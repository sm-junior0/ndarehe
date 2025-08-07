import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, requireVerification } from '../middleware/auth';
import { validate, reviewSchemas } from '../middleware/validation';

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
 *     CreateReviewRequest:
 *       type: object
 *       required:
 *         - serviceType
 *         - serviceId
 *         - rating
 *         - comment
 *       properties:
 *         serviceType:
 *           type: string
 *           enum: [ACCOMMODATION, TRANSPORTATION, TOUR]
 *           description: Type of service being reviewed
 *         serviceId:
 *           type: string
 *           description: ID of the service (accommodation, transportation, or tour)
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5 stars
 *         comment:
 *           type: string
 *           description: Review comment
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     description: Create a review for an accommodation, transportation, or tour service
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: Review created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - validation error
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
 * /reviews/service/{serviceType}/{serviceId}:
 *   get:
 *     summary: Get reviews for a service
 *     description: Retrieve all reviews for a specific accommodation, transportation, or tour service
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: serviceType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ACCOMMODATION, TRANSPORTATION, TOUR]
 *         description: Type of service
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
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
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *     responses:
 *       200:
 *         description: Service reviews retrieved successfully
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
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
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

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, requireVerification, validate(reviewSchemas.create), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceType, serviceId, bookingId, rating, comment } = req.body;

    // Verify user has completed booking for this service
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: req.user!.id,
          serviceType,
          OR: [
            { accommodationId: serviceId },
            { tourId: serviceId }
          ],
          status: 'COMPLETED'
        }
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          error: 'You can only review services you have completed'
        });
      }

      // Check if review already exists for this booking
      const existingReview = await prisma.review.findUnique({
        where: { bookingId }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this booking'
        });
      }
    }

    // Verify service exists
    let service: any;
    switch (serviceType) {
      case 'ACCOMMODATION':
        service = await prisma.accommodation.findUnique({
          where: { id: serviceId }
        });
        break;
      case 'TOUR':
        service = await prisma.tour.findUnique({
          where: { id: serviceId }
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid service type'
        });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: req.user!.id,
        serviceType,
        accommodationId: serviceType === 'ACCOMMODATION' ? serviceId : null,
        tourId: serviceType === 'TOUR' ? serviceId : null,
        bookingId,
        rating: parseInt(rating),
        comment
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    // Update service rating and review count
    const serviceReviews = await prisma.review.findMany({
      where: {
        serviceType,
        OR: [
          { accommodationId: serviceId },
          { tourId: serviceId }
        ]
      },
      select: { rating: true }
    });

    const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;

    switch (serviceType) {
      case 'ACCOMMODATION':
        await prisma.accommodation.update({
          where: { id: serviceId },
          data: {
            rating: avgRating,
            totalReviews: serviceReviews.length
          }
        });
        break;
      case 'TOUR':
        await prisma.tour.update({
          where: { id: serviceId },
          data: {
            rating: avgRating,
            totalReviews: serviceReviews.length
          }
        });
        break;
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceType/:serviceId
// @access  Public
router.get('/service/:serviceType/:serviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceType, serviceId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      serviceType,
      serviceId,
      isVerified: true
    };

    if (rating) {
      where.rating = parseInt(rating as string);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.review.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        reviews,
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

// @desc    Get user reviews
// @route   GET /api/reviews/user
// @access  Private
router.get('/user', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId: req.user!.id },
        include: {
          accommodation: {
            select: {
              name: true,
              type: true
            }
          },
          tour: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.review.count({ where: { userId: req.user!.id } })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        reviews,
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

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ? parseInt(rating) : undefined,
        comment
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    await prisma.review.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 