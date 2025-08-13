import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';
import { sendEmail, emailTemplates } from '../utils/email';
import { generateToken, generateEmailVerificationToken, generatePasswordResetToken } from '../utils/jwt';
import { AuthenticatedRequest, JWTPayload } from '../types';

const router = express.Router();

// In-memory store to track recently processed verification tokens
// In production, consider using Redis for this
const recentlyProcessedTokens = new Map<string, number>();

// Clean up old tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  for (const [token, timestamp] of recentlyProcessedTokens.entries()) {
    if (timestamp < fiveMinutesAgo) {
      recentlyProcessedTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Rate limiter for email verification - more restrictive
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 email verification requests per minute
  message: {
    success: false,
    data: null,
    message: 'Too many verification attempts. Please wait a moment before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for resend verification - even more restrictive
const resendVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2, // limit each IP to 2 resend requests per 5 minutes
  message: {
    success: false,
    data: null,
    message: 'Too many resend requests. Please wait 5 minutes before requesting another verification email.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password (minimum 6 characters)
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         phone:
 *           type: string
 *           description: User's phone number (optional)
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: User's date of birth (optional)
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully. Please check your email to verify your account.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *       400:
 *         description: Bad request - validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validate(authSchemas.register), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      }
    });

    // Generate verification token
    const verificationToken = generateEmailVerificationToken(user.id);

    // Send welcome email
    try {
      const { subject, html } = emailTemplates.welcome(user.firstName, verificationToken);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate(authSchemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', emailVerificationLimiter, async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Verification token is required'
      });
    }

    // Check if this token was recently processed
    const now = Date.now();
    const recentlyProcessed = recentlyProcessedTokens.get(token);
    
    if (recentlyProcessed && (now - recentlyProcessed) < 30000) { // 30 seconds
      return res.status(429).json({
        success: false,
        data: null,
        message: 'This verification link was recently used. Please wait a moment before trying again.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;
    
    // Check if user exists and get current verification status
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      const shouldRedirect = (req.query.redirect ?? 'true') !== 'false';
      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : undefined);
      if (shouldRedirect && frontendUrl) {
        return res.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=invalid`);
      }
      return res.status(400).json({
        success: false,
        data: null,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (existingUser.isVerified) {
      return res.json({
        success: true,
        data: { user: { id: existingUser.id, email: existingUser.email, isVerified: existingUser.isVerified } },
        message: 'Email is already verified'
      });
    }
    
    // Mark token as processed to prevent duplicates
    recentlyProcessedTokens.set(token, now);

    // Update user verification status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });

    // Send verification success email
    try {
      const { subject, html } = emailTemplates.emailVerified(user.firstName);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send verification success email:', emailError);
    }

    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, isVerified: user.isVerified } },
      message: 'Email verified successfully'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const shouldRedirect = (req.query.redirect ?? 'true') !== 'false';
      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : undefined);
      if (shouldRedirect && frontendUrl) {
        return res.redirect(`${frontendUrl.replace(/\/$/, '')}/verify-email?status=invalid`);
      }
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid or expired verification token'
      });
    }
    next(error);
  }
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
router.post('/resend-verification', resendVerificationLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken(user.id);

    // Send verification email
    try {
      const { subject, html } = emailTemplates.welcome(user.firstName, verificationToken);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      data: { message: 'Verification email sent successfully' },
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', validate(authSchemas.forgotPassword), async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user.id);

    // Send reset email
    try {
      const { subject, html } = emailTemplates.passwordReset(user.firstName, resetToken);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', validate(authSchemas.resetPassword), async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }
    next(error);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        isVerified: true,
        isActive: true,
        profileImage: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router; 