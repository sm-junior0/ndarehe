import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate, tourSchemas } from '../middleware/validation';
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
 * /tours:
 *   get:
 *     summary: Get all tours
 *     description: Retrieve a list of all available tours with filtering and search options
 *     tags: [Tours]
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
 *           default: 12
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for tour name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CITY_TOUR, CULTURAL_TOUR, ADVENTURE_TOUR, FOOD_TOUR, NIGHTLIFE_TOUR, EDUCATIONAL_TOUR, NATURE_TOUR]
 *         description: Filter by tour type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [BUDGET, STANDARD, PREMIUM, LUXURY]
 *         description: Filter by tour category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per person
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per person
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         description: Minimum duration in hours
 *       - in: query
 *         name: participants
 *         schema:
 *           type: integer
 *         description: Number of participants
 *     responses:
 *       200:
 *         description: List of tours retrieved successfully
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
 *                     tours:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tour'
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

/**
 * @swagger
 * /tours/{id}:
 *   get:
 *     summary: Get tour by ID
 *     description: Retrieve detailed information about a specific tour
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour details retrieved successfully
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
 *                     tour:
 *                       $ref: '#/components/schemas/Tour'
 *       404:
 *         description: Tour not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /tours/popular:
 *   get:
 *     summary: Get popular tours
 *     description: Retrieve a list of popular tours based on ratings and reviews
 *     tags: [Tours]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of tours to return
 *     responses:
 *       200:
 *         description: Popular tours retrieved successfully
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
 *                     tours:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tour'
 */

// @desc    Get all tours with filtering and search
// @route   GET /api/tours
// @access  Public
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      category,
      locationId,
      city,
      minPrice,
      maxPrice,
      duration,
      participants,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build where clause
    const where: any = {
      isAvailable: true,
      isVerified: true
    };

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by location
    if (locationId) {
      where.locationId = locationId;
    }

    // Filter by city
    if (city) {
      where.location = {
        city: { contains: city, mode: 'insensitive' }
      };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.pricePerPerson = {};
      if (minPrice) where.pricePerPerson.gte = parseFloat(minPrice as string);
      if (maxPrice) where.pricePerPerson.lte = parseFloat(maxPrice as string);
    }

    // Filter by duration
    if (duration) {
      where.duration = { gte: parseInt(duration as string) };
    }

    // Filter by participants
    if (participants) {
      where.maxParticipants = { gte: parseInt(participants as string) };
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              city: true,
              district: true,
              province: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit as string)
      }),
      prisma.tour.count({ where })
    ]);

    // Calculate average rating for each tour
    const toursWithRating = tours.map(tour => {
      const avgRating = tour.reviews.length > 0
        ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
        : 0;

      return {
        ...tour,
        averageRating: Math.round(avgRating * 10) / 10,
        reviews: undefined // Remove reviews array from response
      };
    });

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        tours: toursWithRating,
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

// @desc    Get single tour
// @route   GET /api/tours/:id
// @access  Public
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            province: true,
            latitude: true,
            longitude: true
          }
        },
        reviews: {
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
          take: 10
        }
      }
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    // Calculate average rating
    const avgRating = tour.reviews.length > 0
      ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
      : 0;

    const tourWithRating = {
      ...tour,
      averageRating: Math.round(avgRating * 10) / 10
    };

    res.json({
      success: true,
      data: { tour: tourWithRating }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create tour (Admin/Provider only)
// @route   POST /api/tours
// @access  Private
router.post('/', protect, authorize('ADMIN', 'PROVIDER'), validate(tourSchemas.create), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      type,
      category,
      locationId,
      duration,
      maxParticipants,
      minParticipants,
      pricePerPerson,
      currency,
      itinerary,
      includes,
      excludes,
      meetingPoint,
      startTime,
      endTime,
      images
    } = req.body;

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location not found'
      });
    }

    const tour = await prisma.tour.create({
      data: {
        name,
        description,
        type,
        category,
        locationId,
        duration: parseInt(duration),
        maxParticipants: parseInt(maxParticipants),
        minParticipants: parseInt(minParticipants),
        pricePerPerson: parseFloat(pricePerPerson),
        currency,
        itinerary: itinerary || [],
        includes: includes || [],
        excludes: excludes || [],
        meetingPoint,
        startTime,
        endTime,
        images: images || []
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            province: true
          }
        }
      }
    });

    // Log activity
    try {
      const actorId = (req as any).user?.id as string | undefined;
      await logActivity({
        type: ActivityType.TOUR_CREATED,
        actorUserId: actorId || null,
        targetType: 'TOUR',
        targetId: tour.id,
        message: `Tour added: ${tour.name}`,
      });
    } catch {}

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: { tour }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update tour (Admin/Provider only)
// @route   PUT /api/tours/:id
// @access  Private
router.put('/:id', protect, authorize('ADMIN', 'PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Convert numeric fields
    if (updateData.duration) updateData.duration = parseInt(updateData.duration);
    if (updateData.maxParticipants) updateData.maxParticipants = parseInt(updateData.maxParticipants);
    if (updateData.minParticipants) updateData.minParticipants = parseInt(updateData.minParticipants);
    if (updateData.pricePerPerson) updateData.pricePerPerson = parseFloat(updateData.pricePerPerson);

    // Verify location exists if updating
    if (updateData.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: updateData.locationId }
      });

      if (!location) {
        return res.status(400).json({
          success: false,
          error: 'Location not found'
        });
      }
    }

    const tour = await prisma.tour.update({
      where: { id },
      data: updateData,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            province: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: { tour }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete tour (Admin only)
// @route   DELETE /api/tours/:id
// @access  Private
router.delete('/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if tour has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        tourId: id,
        serviceType: 'TOUR',
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tour with active bookings'
      });
    }

    await prisma.tour.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tour types
// @route   GET /api/tours/types
// @access  Public
router.get('/types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.tour.groupBy({
      by: ['type'],
      where: {
        isAvailable: true,
        isVerified: true
      },
      _count: {
        type: true
      }
    });

    res.json({
      success: true,
      data: { types }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tour categories
// @route   GET /api/tours/categories
// @access  Public
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.tour.groupBy({
      by: ['category'],
      where: {
        isAvailable: true,
        isVerified: true
      },
      _count: {
        category: true
      }
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get popular tours
// @route   GET /api/tours/popular
// @access  Public
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 6 } = req.query;

    const popularTours = await prisma.tour.findMany({
      where: {
        isAvailable: true,
        isVerified: true
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: [
        { totalReviews: 'desc' },
        { rating: 'desc' }
      ],
      take: parseInt(limit as string)
    });

    // Calculate average rating for each tour
    const toursWithRating = popularTours.map(tour => {
      const avgRating = tour.reviews.length > 0
        ? tour.reviews.reduce((sum, review) => sum + review.rating, 0) / tour.reviews.length
        : 0;

      return {
        ...tour,
        averageRating: Math.round(avgRating * 10) / 10,
        reviews: undefined
      };
    });

    res.json({
      success: true,
      data: { tours: toursWithRating }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 