import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate, transportationSchemas } from '../middleware/validation';
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
 * /transportation:
 *   get:
 *     summary: Get all transportation services
 *     description: Retrieve a list of all available transportation services with filtering options
 *     tags: [Transportation]
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
 *         description: Search term for service name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [AIRPORT_PICKUP, CITY_TRANSPORT, TOUR_TRANSPORT, PRIVATE_TRANSPORT]
 *         description: Filter by transportation type
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [STANDARD, VIP, VAN, BUS, MOTORCYCLE]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per trip
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per trip
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: integer
 *         description: Minimum passenger capacity
 *     responses:
 *       200:
 *         description: List of transportation services retrieved successfully
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
 *                     transportation:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transportation'
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
 * /transportation/{id}:
 *   get:
 *     summary: Get transportation service by ID
 *     description: Retrieve detailed information about a specific transportation service
 *     tags: [Transportation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transportation service ID
 *     responses:
 *       200:
 *         description: Transportation service details retrieved successfully
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
 *                     transportation:
 *                       $ref: '#/components/schemas/Transportation'
 *       404:
 *         description: Transportation service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /transportation/airport-pickup:
 *   get:
 *     summary: Get airport pickup services
 *     description: Retrieve a list of airport pickup transportation services
 *     tags: [Transportation]
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Location ID for the airport
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [STANDARD, VIP, VAN, BUS, MOTORCYCLE]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: integer
 *         description: Minimum passenger capacity
 *     responses:
 *       200:
 *         description: Airport pickup services retrieved successfully
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
 *                     airportPickups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transportation'
 */

// @desc    Get all transportation services with filtering
// @route   GET /api/transportation
// @access  Public
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      vehicleType,
      locationId,
      city,
      minPrice,
      maxPrice,
      capacity,
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

    // Filter by vehicle type
    if (vehicleType) {
      where.vehicleType = vehicleType;
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
      where.pricePerTrip = {};
      if (minPrice) where.pricePerTrip.gte = parseFloat(minPrice as string);
      if (maxPrice) where.pricePerTrip.lte = parseFloat(maxPrice as string);
    }

    // Filter by capacity
    if (capacity) {
      where.capacity = { gte: parseInt(capacity as string) };
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [transportation, total] = await Promise.all([
      prisma.transportation.findMany({
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
          }
        },
        orderBy,
        skip,
        take: parseInt(limit as string)
      }),
      prisma.transportation.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        transportation,
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

// @desc    Get single transportation service
// @route   GET /api/transportation/:id
// @access  Public
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const transportation = await prisma.transportation.findUnique({
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
        }
      }
    });

    if (!transportation) {
      return res.status(404).json({
        success: false,
        error: 'Transportation service not found'
      });
    }

    res.json({
      success: true,
      data: { transportation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create transportation service (Admin/Provider only)
// @route   POST /api/transportation
// @access  Private
router.post('/', protect, authorize('ADMIN', 'PROVIDER'), validate(transportationSchemas.create), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      type,
      vehicleType,
      locationId,
      capacity,
      pricePerTrip,
      pricePerHour,
      currency,
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

    const transportation = await prisma.transportation.create({
      data: {
        name,
        description,
        type,
        vehicleType,
        locationId,
        capacity: parseInt(capacity),
        pricePerTrip: parseFloat(pricePerTrip),
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : null,
        currency,
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
        type: ActivityType.TRANSPORTATION_CREATED,
        actorUserId: actorId || null,
        targetType: 'TRANSPORTATION',
        targetId: transportation.id,
        message: `Transportation added: ${transportation.name}`,
      });
    } catch {}

    res.status(201).json({
      success: true,
      message: 'Transportation service created successfully',
      data: { transportation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update transportation service (Admin/Provider only)
// @route   PUT /api/transportation/:id
// @access  Private
router.put('/:id', protect, authorize('ADMIN', 'PROVIDER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Convert numeric fields
    if (updateData.capacity) updateData.capacity = parseInt(updateData.capacity);
    if (updateData.pricePerTrip) updateData.pricePerTrip = parseFloat(updateData.pricePerTrip);
    if (updateData.pricePerHour) updateData.pricePerHour = parseFloat(updateData.pricePerHour);

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

    const transportation = await prisma.transportation.update({
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
      message: 'Transportation service updated successfully',
      data: { transportation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete transportation service (Admin only)
// @route   DELETE /api/transportation/:id
// @access  Private
router.delete('/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if transportation has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        transportationId: id,
        serviceType: 'TRANSPORTATION',
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete transportation service with active bookings'
      });
    }

    await prisma.transportation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Transportation service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get transportation types
// @route   GET /api/transportation/types
// @access  Public
router.get('/types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.transportation.groupBy({
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

// @desc    Get vehicle types
// @route   GET /api/transportation/vehicle-types
// @access  Public
router.get('/vehicle-types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicleTypes = await prisma.transportation.groupBy({
      by: ['vehicleType'],
      where: {
        isAvailable: true,
        isVerified: true
      },
      _count: {
        vehicleType: true
      }
    });

    res.json({
      success: true,
      data: { vehicleTypes }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get airport pickup services
// @route   GET /api/transportation/airport-pickup
// @access  Public
router.get('/airport-pickup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, vehicleType, capacity } = req.query;

    const where: any = {
      type: 'AIRPORT_PICKUP',
      isAvailable: true,
      isVerified: true
    };

    if (locationId) {
      where.locationId = locationId;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (capacity) {
      where.capacity = { gte: parseInt(capacity as string) };
    }

    const airportPickups = await prisma.transportation.findMany({
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
        }
      },
      orderBy: { pricePerTrip: 'asc' }
    });

    res.json({
      success: true,
      data: { airportPickups }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 