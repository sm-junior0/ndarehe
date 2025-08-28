import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, requireVerification } from '../middleware/auth';
import { validate, bookingSchemas } from '../middleware/validation';
import { sendEmail, emailTemplates } from '../utils/email';
import { logActivity } from '../utils/activity';
import { ActivityType } from '@prisma/client';

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
 *     CreateBookingRequest:
 *       type: object
 *       required:
 *         - serviceType
 *         - serviceId
 *         - startDate
 *         - numberOfPeople
 *       properties:
 *         serviceType:
 *           type: string
 *           enum: [ACCOMMODATION, TRANSPORTATION, TOUR]
 *           description: Type of service to book
 *         serviceId:
 *           type: string
 *           description: ID of the service (accommodation, transportation, or tour)
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date and time of the booking
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date and time (required for accommodation)
 *         numberOfPeople:
 *           type: integer
 *           minimum: 1
 *           description: Number of people for the booking
 *         specialRequests:
 *           type: string
 *           description: Any special requests or notes
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a booking for accommodation, transportation, or tour
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
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
 *                   example: Booking created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - validation error or service not available
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
 * /bookings:
 *   get:
 *     summary: Get user bookings
 *     description: Retrieve all bookings for the current user
 *     tags: [Bookings]
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
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED, REFUNDED]
 *         description: Filter by booking status
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [ACCOMMODATION, TRANSPORTATION, TOUR]
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
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
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
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

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, requireVerification, validate(bookingSchemas.create), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceType, serviceId, startDate, endDate, numberOfPeople, specialRequests = '' } = req.body;

    // Verify service exists and is available
    let service: any;
    let totalAmount = 0;

    switch (serviceType) {
      case 'ACCOMMODATION':
        service = await prisma.accommodation.findUnique({
          where: { id: serviceId },
          include: { location: true }
        });
        if (!service || !service.isAvailable) {
          return res.status(400).json({
            success: false,
            error: 'Accommodation not available'
          });
        }
        
        // Calculate total amount for accommodation
        const nights = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = service.pricePerNight * nights * numberOfPeople;
        break;

      case 'TRANSPORTATION':
        service = await prisma.transportation.findUnique({
          where: { id: serviceId },
          include: { location: true }
        });
        if (!service || !service.isAvailable) {
          return res.status(400).json({
            success: false,
            error: 'Transportation service not available'
          });
        }
        totalAmount = service.pricePerTrip;
        break;

      case 'TOUR':
        service = await prisma.tour.findUnique({
          where: { id: serviceId },
          include: { location: true }
        });
        if (!service || !service.isAvailable) {
          return res.status(400).json({
            success: false,
            error: 'Tour not available'
          });
        }
        totalAmount = service.pricePerPerson * numberOfPeople;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid service type'
        });
    }

    // Check availability for accommodation
    if (serviceType === 'ACCOMMODATION' && startDate && endDate) {
      const conflictingBookings = await prisma.booking.findFirst({
        where: {
          accommodationId: serviceId,
          serviceType: 'ACCOMMODATION',
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          OR: [
            {
              startDate: { lte: new Date(endDate) },
              endDate: { gte: new Date(startDate) }
            }
          ]
        }
      });

      if (conflictingBookings) {
        return res.status(400).json({
          success: false,
          error: 'Accommodation not available for selected dates'
        });
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: req.user!.id,
        serviceType,
        accommodationId: serviceType === 'ACCOMMODATION' ? serviceId : null,
        transportationId: serviceType === 'TRANSPORTATION' ? serviceId : null,
        tourId: serviceType === 'TOUR' ? serviceId : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        numberOfPeople: parseInt(numberOfPeople),
        totalAmount,
        currency: service.currency || 'RWF',
        specialRequests: specialRequests || null
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        accommodation: {
          select: {
            name: true,
            type: true,
            location: true
          }
        },
        transportation: {
          select: {
            name: true,
            type: true,
            vehicleType: true,
            location: true
          }
        },
        tour: {
          select: {
            name: true,
            type: true,
            location: true
          }
        }
      }
    });

    // Log activity
    logActivity({
      type: ActivityType.BOOKING_CREATED,
      actorUserId: req.user!.id,
      targetType: 'BOOKING',
      targetId: booking.id,
      message: `Booking created • ${service.name}`,
      metadata: { serviceType, serviceId },
    }).catch(() => {});

    // Send confirmation email asynchronously (do not block response)
    // IMPORTANT: For accommodation and transportation bookings, defer confirmation email until payment verification
    // Only tours send immediate confirmation emails (they are typically free or have different payment flows)
    if (serviceType === 'TOUR') {
      const serviceName = service.name;
      const payload = {
        id: booking.id,
        serviceName,
        startDate: booking.startDate,
        totalAmount: booking.totalAmount,
        currency: booking.currency
      };
      setImmediate(() => {
        try {
          const { subject, html } = emailTemplates.bookingConfirmation(
            req.user!.firstName,
            payload
          );
          sendEmail(req.user!.email, subject, html).catch((emailError) => {
            console.error('Failed to send booking confirmation email:', emailError);
          });
        } catch (emailError) {
          console.error('Failed to prepare booking confirmation email:', emailError);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, serviceType } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.user!.id };
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          accommodation: {
            select: {
              name: true,
              type: true,
              images: true,
              location: true
            }
          },
          transportation: {
            select: {
              name: true,
              type: true,
              vehicleType: true,
              images: true,
              location: true
            }
          },
          tour: {
            select: {
              name: true,
              type: true,
              images: true,
              location: true
            }
          },
          payment: {
            select: {
              status: true,
              amount: true,
              currency: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.booking.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        bookings,
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

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        accommodation: {
          include: { location: true }
        },
        transportation: {
          include: { location: true }
        },
        tour: {
          include: { location: true }
        },
        payment: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or cannot be cancelled'
      });
    }

    // Check if booking is within cancellation period (e.g., 24 hours before)
    const now = new Date();
    const bookingDate = new Date(booking.startDate);
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be cancelled within 24 hours of start date'
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        isCancelled: true
      }
    });

    // Log activity
    logActivity({
      type: ActivityType.BOOKING_CANCELLED,
      actorUserId: req.user!.id,
      targetType: 'BOOKING',
      targetId: id,
      message: `Booking cancelled • ${id}`,
      metadata: { reason },
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private
router.get('/stats', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await prisma.booking.groupBy({
      by: ['status'],
      where: { userId: req.user!.id },
      _count: {
        status: true
      }
    });

    const totalBookings = await prisma.booking.count({
      where: { userId: req.user!.id }
    });

    const totalSpent = await prisma.booking.aggregate({
      where: {
        userId: req.user!.id,
        status: 'COMPLETED'
      },
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      success: true,
      data: {
        stats,
        totalBookings,
        totalSpent: totalSpent._sum.totalAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 