import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Request interface to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePaymentRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - amount
 *         - method
 *       properties:
 *         bookingId:
 *           type: string
 *           description: ID of the booking to pay for
 *         amount:
 *           type: number
 *           description: Payment amount
 *         method:
 *           type: string
 *           enum: [CARD, MOBILE_MONEY, BANK_TRANSFER, CASH, PAYPAL]
 *           description: Payment method
 *         currency:
 *           type: string
 *           default: RWF
 *           description: Payment currency
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment
 *     description: Process a payment for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       201:
 *         description: Payment created successfully
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
 *                   example: Payment processed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - validation error or booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get user payments
 *     description: Retrieve all payments for the current user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED]
 *         description: Filter by payment status
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CARD, MOBILE_MONEY, BANK_TRANSFER, CASH, PAYPAL]
 *         description: Filter by payment method
 *     responses:
 *       200:
 *         description: User payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 */

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId, method, amount, currency = 'RWF' } = req.body;

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: req.user!.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already exists for this booking'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId: req.user!.id,
        amount: parseFloat(amount),
        currency,
        method,
        status: 'PENDING'
      },
      include: {
        booking: {
          include: {
            accommodation: true,
            transportation: true,
            tour: true
          }
        }
      }
    });

    // TODO: Integrate with actual payment gateway (Stripe, etc.)
    // For now, simulate payment processing
    setTimeout(async () => {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          isConfirmed: true
        }
      });
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        booking: {
          include: {
            accommodation: true,
            transportation: true,
            tour: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user payments
// @route   GET /api/payments
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.user!.id };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              serviceType: true,
              startDate: true,
              endDate: true,
              accommodation: { select: { name: true } },
              transportation: { select: { name: true } },
              tour: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 