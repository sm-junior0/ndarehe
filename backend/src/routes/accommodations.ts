import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate, accommodationSchemas } from '../middleware/validation';
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
 * /accommodations:
 *   get:
 *     summary: Get all accommodations
 *     description: Retrieve a list of all available accommodations with filtering and search options
 *     tags: [Accommodations]
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
 *         description: Search term for accommodation name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HOTEL, GUESTHOUSE, APARTMENT, VILLA, HOSTEL, CAMPING, HOMESTAY]
 *         description: Filter by accommodation type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [BUDGET, STANDARD, PREMIUM, LUXURY]
 *         description: Filter by accommodation category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Number of guests
 *     responses:
 *       200:
 *         description: List of accommodations retrieved successfully
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
 *                     accommodations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Accommodation'
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
 * /accommodations/{id}:
 *   get:
 *     summary: Get accommodation by ID
 *     description: Retrieve detailed information about a specific accommodation
 *     tags: [Accommodations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Accommodation ID
 *     responses:
 *       200:
 *         description: Accommodation details retrieved successfully
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
 *                     accommodation:
 *                       $ref: '#/components/schemas/Accommodation'
 *       404:
 *         description: Accommodation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @desc    Get all accommodations with filtering and search
// @route   GET /api/accommodations
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
      guests,
      checkIn,
      checkOut,
      amenities,
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
      where.pricePerNight = {};
      if (minPrice) where.pricePerNight.gte = parseFloat(minPrice as string);
      if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice as string);
    }

    // Filter by number of guests
    if (guests) {
      where.maxGuests = { gte: parseInt(guests as string) };
    }

    // Filter by amenities
    if (amenities) {
      const amenityArray = (amenities as string).split(',');
      where.amenities = {
        hasEvery: amenityArray
      };
    }

    // Check availability for specific dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn as string);
      const checkOutDate = new Date(checkOut as string);
      
      where.availability = {
        none: {
          date: {
            gte: checkInDate,
            lt: checkOutDate
          },
          isAvailable: false
        }
      };
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [accommodations, total] = await Promise.all([
      prisma.accommodation.findMany({
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
      prisma.accommodation.count({ where })
    ]);

    // Calculate average rating for each accommodation
    const accommodationsWithRating = accommodations.map(accommodation => {
      const avgRating = accommodation.reviews.length > 0
        ? accommodation.reviews.reduce((sum, review) => sum + review.rating, 0) / accommodation.reviews.length
        : 0;

      return {
        ...accommodation,
        averageRating: Math.round(avgRating * 10) / 10,
        reviews: undefined // Remove reviews array from response
      };
    });

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        accommodations: accommodationsWithRating,
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

// @desc    Get single accommodation
// @route   GET /api/accommodations/:id
// @access  Public
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const accommodation = await prisma.accommodation.findUnique({
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
        },
        availability: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: { date: 'asc' },
          take: 30
        }
      }
    });

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        error: 'Accommodation not found'
      });
    }

    // Calculate average rating
    const avgRating = accommodation.reviews.length > 0
      ? accommodation.reviews.reduce((sum, review) => sum + review.rating, 0) / accommodation.reviews.length
      : 0;

    const accommodationWithRating = {
      ...accommodation,
      averageRating: Math.round(avgRating * 10) / 10
    };

    res.json({
      success: true,
      data: { accommodation: accommodationWithRating }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create accommodation (Admin/Provider only)
// @route   POST /api/accommodations
// @access  Private
router.post('/', protect, authorize('ADMIN', 'PROVIDER'), validate(accommodationSchemas.create), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      type,
      category,
      locationId,
      address,
      phone,
      email,
      website,
      pricePerNight,
      currency,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
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

    const accommodation = await prisma.accommodation.create({
      data: {
        name,
        description,
        type,
        category,
        locationId,
        address,
        phone,
        email,
        website,
        pricePerNight: parseFloat(pricePerNight),
        currency,
        maxGuests: parseInt(maxGuests),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        amenities: amenities || [],
        images: images || [],
        // Partner fields if provided
        isPartner: req.body.isPartner ?? false,
        partnerName: req.body.partnerName ?? null,
        partnerContact: req.body.partnerContact ?? null,
        partnerNotes: req.body.partnerNotes ?? null
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
        type: ActivityType.ACCOMMODATION_CREATED,
        actorUserId: actorId || null,
        targetType: 'ACCOMMODATION',
        targetId: accommodation.id,
        message: `Accommodation added: ${accommodation.name}`,
      });
    } catch {}

    res.status(201).json({
      success: true,
      message: 'Accommodation created successfully',
      data: { accommodation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update accommodation (Admin/Provider only)
// @route   PUT /api/accommodations/:id
// @access  Private
router.put('/:id', protect, authorize('ADMIN', 'PROVIDER'), validate(accommodationSchemas.update), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Convert numeric fields
    if (updateData.pricePerNight) updateData.pricePerNight = parseFloat(updateData.pricePerNight);
    if (updateData.maxGuests) updateData.maxGuests = parseInt(updateData.maxGuests);
    if (updateData.bedrooms) updateData.bedrooms = parseInt(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = parseInt(updateData.bathrooms);

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

    const accommodation = await prisma.accommodation.update({
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
      message: 'Accommodation updated successfully',
      data: { accommodation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete accommodation (Admin only)
// @route   DELETE /api/accommodations/:id
// @access  Private
router.delete('/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if accommodation has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        accommodationId: id,
        serviceType: 'ACCOMMODATION',
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete accommodation with active bookings'
      });
    }

    await prisma.accommodation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Accommodation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get accommodation availability
// @route   GET /api/accommodations/:id/availability
// @access  Public
router.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { accommodationId: id };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const availability = await prisma.availability.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json({
      success: true,
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update accommodation availability (Admin/Provider only)
// @route   PUT /api/accommodations/:id/availability
// @access  Private
router.put('/:id/availability', protect, authorize('ADMIN', 'PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    // Verify accommodation exists
    const accommodation = await prisma.accommodation.findUnique({
      where: { id }
    });

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        error: 'Accommodation not found'
      });
    }

    // Update availability records
    const availabilityUpdates = availability.map((avail: any) => ({
      where: {
        accommodationId_date: {
          accommodationId: id,
          date: new Date(avail.date)
        }
      },
      update: {
        isAvailable: avail.isAvailable,
        price: avail.price || null
      },
      create: {
        accommodationId: id,
        date: new Date(avail.date),
        isAvailable: avail.isAvailable,
        price: avail.price || null
      }
    }));

    await prisma.$transaction(
      availabilityUpdates.map((update: any) => 
        prisma.availability.upsert(update)
      )
    );

    res.json({
      success: true,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get accommodation types
// @route   GET /api/accommodations/types
// @access  Public
router.get('/types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.accommodation.groupBy({
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

// @desc    Get accommodation categories
// @route   GET /api/accommodations/categories
// @access  Public
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.accommodation.groupBy({
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

export default router; 