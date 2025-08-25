import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logActivity } from '../utils/activity';
import { protect } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';
import { sendEmail, emailTemplates } from '../utils/email';
import { generateToken, generateEmailVerificationToken, generatePasswordResetToken } from '../utils/jwt';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { verifyPassword } from '../utils/password';


const router = express.Router();

enum ActivityType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_LOGGED_OUT = 'USER_LOGGED_OUT'
}

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

    // Log activity
    logActivity({
      type: ActivityType.USER_REGISTERED,
      actorUserId: user.id,
      targetType: 'USER',
      targetId: user.id,
      message: `User registered: ${user.email}`,
    }).catch(() => { });

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
    const startTime = Date.now();
    console.time('Total login time');
    
    const { email, password } = req.body;

    // Set timeout for the entire login operation
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timeout')), 50000)
    );

    // Use Promise.race with the actual login logic
    await Promise.race([
      (async () => {
        console.time('Database query');
        // Single optimized query with only needed fields
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            password: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true,
            isActive: true
          }
        });
        console.timeEnd('Database query');

        if (!user || !user.isActive) {
          res.status(401).json({
            success: false,
            error: 'Invalid credentials'
          });
          return;
        }

        console.time('Password verification');
        // Use the optimized password verification
        const isPasswordValid = await verifyPassword(password, user.password);
        console.timeEnd('Password verification');

        if (!isPasswordValid) {
          res.status(401).json({
            success: false,
            error: 'Invalid credentials'
          });
          return;
        }

        console.time('Token generation');
        // Generate token
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role
        });
        console.timeEnd('Token generation');

        // Response
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

        // Complete the total timing
        console.timeEnd('Total login time');
        console.log(`Total login processing: ${Date.now() - startTime}ms`);

        // Non-blocking activity logging
        logActivity({
          type: ActivityType.USER_LOGGED_IN,
          actorUserId: user.id,
          targetType: 'USER',
          targetId: user.id,
          message: `User logged in: ${user.email}`,
        }).catch(() => { });
      })(),
      timeoutPromise
    ]);

  } catch (error) {
    // Make sure to end the timer even on error
    console.timeEnd('Total login time');
    
    if (typeof error === 'object' && error !== null && 'message' in error && (error as any).message === 'Login timeout') {
      return res.status(408).json({
        success: false,
        error: 'Login timeout. Please try again.'
      });
    }
    next(error);
  }
});


// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token, redirect } = req.query;

    if (!token) {
      // If redirect is requested, redirect to frontend with error status
      if (redirect === 'true') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/verify-email?status=error&message=Verification token is required`);
      }

      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: string };

    // Update user
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { isVerified: true }
    });

    // If redirect is requested, redirect to frontend with success status
    if (redirect === 'true') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/verify-email?status=success`);
    }

    // Send success response (for API calls)
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // Handle redirect for invalid token
      if (req.query.redirect === 'true') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/verify-email?status=error&message=Invalid or expired verification token`);
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
    next(error);
  }
});


// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
router.post('/resend-verification', protect, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { email } = req.body;
    const userId = req.user!.id;

    // Get user - either by provided email or authenticated user ID
    let user;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken(user.id);

    // Send verification email
    try {
      const { subject, html } = emailTemplates.welcome(user.firstName, verificationToken);
      await sendEmail(user.email, subject, html);

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }
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

  // Log activity
  if ((req as any).user?.id && (req as any).user?.email) {
    logActivity({
      type: ActivityType.USER_LOGGED_OUT,
      actorUserId: (req as any).user.id,
      targetType: 'USER',
      targetId: (req as any).user.id,
      message: `User logged out: ${(req as any).user.email}`,
    }).catch(() => { });
  }
});

export default router; 