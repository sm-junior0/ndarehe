import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { adminSchemas } from '../middleware/validation';
import { validate } from '../middleware/validation';
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
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           description: Total number of users
 *         totalBookings:
 *           type: integer
 *           description: Total number of bookings
 *         totalRevenue:
 *           type: number
 *           description: Total revenue generated
 *         pendingBookings:
 *           type: integer
 *           description: Number of pending bookings
 *         activeAccommodations:
 *           type: integer
 *           description: Number of active accommodations
 *         activeTours:
 *           type: integer
 *           description: Number of active tours
 *         activeTransportation:
 *           type: integer
 *           description: Number of active transportation services
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Retrieve comprehensive statistics for the admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                     stats:
 *                       $ref: '#/components/schemas/DashboardStats'
 *                     recentBookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all users with filtering and search options
 *     tags: [Admin]
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for user name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, PROVIDER]
 *         description: Filter by user role
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
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
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     description: Retrieve a list of all bookings with filtering and search options
 *     tags: [Admin]
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
 *           default: 20
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Bookings list retrieved successfully
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
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// All routes require ADMIN role
router.use(protect, authorize('ADMIN'));

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalAccommodations,
      totalTours,
      totalTransportation,
      totalBookings,
      totalRevenue,
      recentBookings,
      pendingBookings,
      pendingTripPlans,
      unverifiedAccommodations,
      unverifiedTransportation
    ] = await Promise.all([
      prisma.user.count(),
      prisma.accommodation.count(),
      prisma.tour.count(),
      prisma.transportation.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          accommodation: { select: { name: true } },
          transportation: { select: { name: true } },
          tour: { select: { name: true } }
        }
      }),
      prisma.booking.count({
        where: { status: 'PENDING' }
      }),
      prisma.tripPlan.count({
        where: { status: 'PENDING' }
      }),
      prisma.accommodation.count({ where: { isVerified: false } }),
      prisma.transportation.count({ where: { isVerified: false } })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAccommodations,
          totalTours,
          totalTransportation,
          totalBookings,
          totalRevenue: totalRevenue._sum.amount || 0,
          pendingBookings,
          pendingTripPlans,
          unverifiedAccommodations,
          unverifiedTransportation
        },
        recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/activity:
 *   get:
 *     summary: Get recent activity feed (Admin only)
 *     description: Consolidated list of recent actions across users, bookings, payments, and listings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Maximum number of activity items to return
 *     responses:
 *       200:
 *         description: Activity feed retrieved successfully
 */
router.get('/activity', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '25', 10), 100);
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);

    // Fetch recent items per category (lightweight aggregation)
    const [users, bookings, payments, accommodations, transportation, tours] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true }
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          accommodation: { select: { name: true } },
          transportation: { select: { name: true } },
          tour: { select: { name: true } },
        }
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          booking: {
            select: {
              serviceType: true,
              accommodation: { select: { name: true } },
              transportation: { select: { name: true } },
              tour: { select: { name: true } },
            }
          }
        }
      }),
      prisma.accommodation.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, name: true, createdAt: true } }),
      prisma.transportation.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, name: true, createdAt: true } }),
      prisma.tour.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, name: true, createdAt: true } }),
    ]);

    type Activity = { id: string; type: string; timestamp: Date; message: string };
    const activity: Activity[] = [];

    for (const u of users) {
      activity.push({
        id: `user_${u.id}`,
        type: 'USER_REGISTERED',
        timestamp: u.createdAt,
        message: `User registered: ${u.email}`
      });
    }

    for (const b of bookings) {
      const serviceName = b.accommodation?.name || b.transportation?.name || b.tour?.name || 'Service';
      activity.push({
        id: `booking_${b.id}`,
        type: 'BOOKING_CREATED',
        timestamp: b.createdAt,
        message: `Booking created • ${serviceName}`
      });
    }

    for (const p of payments) {
      const serviceName = p.booking?.accommodation?.name || p.booking?.transportation?.name || p.booking?.tour?.name || 'Service';
      activity.push({
        id: `payment_${p.id}`,
        type: p.status === 'COMPLETED' ? 'PAYMENT_COMPLETED' : p.status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_UPDATED',
        timestamp: p.createdAt,
        message: `Payment ${p.status.toLowerCase()} • ${serviceName}`
      });
    }

    for (const a of accommodations) {
      activity.push({ id: `acc_${a.id}`, type: 'ACCOMMODATION_CREATED', timestamp: a.createdAt, message: `Accommodation added: ${a.name}` });
    }
    for (const t of transportation) {
      activity.push({ id: `trans_${t.id}`, type: 'TRANSPORTATION_CREATED', timestamp: t.createdAt, message: `Transportation added: ${t.name}` });
    }
    for (const t of tours) {
      activity.push({ id: `tour_${t.id}`, type: 'TOUR_CREATED', timestamp: t.createdAt, message: `Tour added: ${t.name}` });
    }

    // Sort by timestamp desc and apply pagination
    activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const total = activity.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const end = start + limit;
    const sliced = activity.slice(start, end);

    res.json({ success: true, data: { activity: sliced, pagination: { page, limit, total, totalPages } } });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, role, isVerified, isActive } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        users,
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

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
router.put('/users/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive, isVerified, role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : user.isActive,
        isVerified: isVerified !== undefined ? isVerified : user.isVerified,
        role: role || user.role
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Log activity
    try {
      const changes: string[] = [];
      if (isActive !== undefined && isActive !== user.isActive) {
        changes.push(`status ${isActive ? 'activated' : 'deactivated'}`);
      }
      if (isVerified !== undefined && isVerified !== user.isVerified) {
        changes.push(`verification ${isVerified ? 'approved' : 'rejected'}`);
      }
      if (role && role !== user.role) {
        changes.push(`role changed to ${role}`);
      }

      if (changes.length > 0) {
        await logActivity({
          type: ActivityType.USER_STATUS_UPDATED,
          actorUserId: req.user?.id || null,
          targetType: 'USER',
          targetId: id,
          message: `Admin updated user ${user.email}: ${changes.join(', ')}`,
          metadata: { 
            previousStatus: { isActive: user.isActive, isVerified: user.isVerified, role: user.role },
            newStatus: { isActive: updatedUser.isActive, isVerified: updatedUser.isVerified, role: updatedUser.role }
          }
        });
      }
    } catch {}

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Permanently delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        userId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete user with active bookings. Please deactivate instead.'
      });
    }

    // Delete user (this will cascade to related records due to Prisma schema)
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User deleted permanently'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
router.get('/bookings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, serviceType, startDate, endDate } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
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
              type: true
            }
          },
          transportation: {
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
          },
          payment: {
            select: {
              status: true,
              amount: true
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

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (Admin only)
router.put('/bookings/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        isConfirmed: status === 'CONFIRMED'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log activity
    try {
      await logActivity({
        type: ActivityType.BOOKING_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'BOOKING',
        targetId: id,
        message: `Admin updated booking ${id} status to ${status}`,
        metadata: { 
          previousStatus: booking.status,
          newStatus: status,
          serviceType: booking.serviceType
        }
      });
    } catch {}

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get revenue statistics
// @route   GET /api/admin/revenue
// @access  Private (Admin only)
router.get('/revenue', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { status: 'COMPLETED' };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const revenue = await prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true }
    });

    const monthlyRevenue = await prisma.payment.groupBy({
      by: ['createdAt'],
      where,
      _sum: { amount: true },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: {
        totalRevenue: revenue._sum.amount || 0,
        totalTransactions: revenue._count.id,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
router.get('/settings', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' }
    });

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update system setting
// @route   PUT /api/admin/settings/:key
// @access  Private (Admin only)
router.put('/settings/:key', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    const updatedSetting = await prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        description: description || setting.description
      }
    });

    // Log the activity
    try {
      await logActivity({
        type: ActivityType.SYSTEM_SETTING_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'SYSTEM_SETTING',
        targetId: key,
        message: `Admin updated system setting: ${key}`,
        metadata: { previousValue: setting.value, newValue: value }
      });
    } catch {}

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { setting: updatedSetting }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Bulk update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
router.put('/settings', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: 'Settings must be an array'
      });
    }

    const updatePromises = settings.map(async (setting: { key: string; value: string; description?: string }) => {
      const existingSetting = await prisma.systemSetting.findUnique({
        where: { key: setting.key }
      });

      if (existingSetting) {
        return prisma.systemSetting.update({
          where: { key: setting.key },
          data: {
            value: setting.value,
            description: setting.description || existingSetting.description
          }
        });
      } else {
        return prisma.systemSetting.create({
          data: {
            key: setting.key,
            value: setting.value,
            description: setting.description
          }
        });
      }
    });

    const updatedSettings = await Promise.all(updatePromises);

    // Log the bulk update activity
    try {
      await logActivity({
        type: ActivityType.SYSTEM_SETTING_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'SYSTEM_SETTING',
        targetId: 'bulk_update',
        message: `Admin bulk updated ${updatedSettings.length} system settings`,
        metadata: { updatedSettings: updatedSettings.map(s => ({ key: s.key, value: s.value })) }
      });
    } catch {}

    res.json({
      success: true,
      message: `${updatedSettings.length} settings updated successfully`,
      data: { settings: updatedSettings }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create or update system setting
// @route   POST /api/admin/settings
// @access  Private (Admin only)
router.post('/settings', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { key, value, description } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        error: 'Key and value are required'
      });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description: description || undefined
      },
      create: {
        key,
        value,
        description
      }
    });

    // Log the activity
    try {
      await logActivity({
        type: ActivityType.SYSTEM_SETTING_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'SYSTEM_SETTING',
        targetId: key,
        message: `Admin created/updated system setting: ${key}`,
        metadata: { value, description }
      });
    } catch {}

    res.json({
      success: true,
      message: 'Setting created/updated successfully',
      data: { setting }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get pending items for admin review
// @route   GET /api/admin/pending
// @access  Private (Admin only)
router.get('/pending', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [bookings, tripPlans, accommodations, transportation] = await Promise.all([
      prisma.booking.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          accommodation: { select: { name: true, isPartner: true, partnerName: true } },
          transportation: { select: { name: true, type: true, isPartner: true, partnerName: true } },
          tour: { select: { name: true, type: true } },
          payment: { select: { status: true, amount: true } }
        },
        take: 25
      }),
      prisma.tripPlan.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 25
      }),
      prisma.accommodation.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: 'desc' },
        take: 25
      }),
      prisma.transportation.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: 'desc' },
        take: 25
      })
    ]);

    res.json({
      success: true,
      data: {
        pendingBookings: bookings,
        pendingTripPlans: tripPlans,
        unverifiedAccommodations: accommodations,
        unverifiedTransportation: transportation
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// @desc    Create a new user (Admin only)
// @route   POST /api/admin/users
// @access  Private (Admin only)
router.post('/users', validate(adminSchemas.createUser), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, role, password, phone, isVerified, isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    const finalPassword = password || Math.random().toString(36).slice(-10) + 'A1!';
    const hashed = await bcrypt.hash(finalPassword, 10);

    const created = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashed,
        role,
        phone: phone || null,
        isVerified: isVerified ?? true,
        isActive: isActive ?? true,
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isVerified: true, isActive: true, createdAt: true }
    });

    // Log activity
    try {
      await logActivity({
        type: ActivityType.USER_REGISTERED,
        actorUserId: req.user?.id || null,
        targetType: 'USER',
        targetId: created.id,
        message: `Admin created user: ${created.email}`,
        metadata: { role: created.role }
      });
    } catch {}

    res.status(201).json({ success: true, message: 'User created', data: { user: created } });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all accommodations for admin management
// @route   GET /api/admin/accommodations
// @access  Private (Admin only)
router.get('/accommodations', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      category,
      isVerified,
      isAvailable
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build where clause
    const where: any = {};

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

    // Filter by verification status
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

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
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.accommodation.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        accommodations,
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

// @desc    Update accommodation verification status
// @route   PUT /api/admin/accommodations/:id/verify
// @access  Private (Admin only)
router.put('/accommodations/:id/verify', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const accommodation = await prisma.accommodation.findUnique({
      where: { id }
    });

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        error: 'Accommodation not found'
      });
    }

    const updatedAccommodation = await prisma.accommodation.update({
      where: { id },
      data: { isVerified },
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
      await logActivity({
        type: ActivityType.ACCOMMODATION_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'ACCOMMODATION',
        targetId: id,
        message: `Admin ${isVerified ? 'verified' : 'unverified'} accommodation: ${accommodation.name}`,
        metadata: { 
          previousStatus: { isVerified: accommodation.isVerified },
          newStatus: { isVerified }
        }
      });
    } catch {}

    res.json({
      success: true,
      message: `Accommodation ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { accommodation: updatedAccommodation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all locations for accommodation creation
// @route   GET /api/admin/locations
// @access  Private (Admin only)
router.get('/locations', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all transportation for admin management
// @route   GET /api/admin/transportation
// @access  Private (Admin only)
router.get('/transportation', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      vehicleType,
      isVerified,
      isAvailable
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build where clause
    const where: any = {};

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

    // Filter by verification status
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

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
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
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

// @desc    Update transportation verification status
// @route   PUT /api/admin/transportation/:id/verify
// @access  Private (Admin only)
router.put('/transportation/:id/verify', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const transportation = await prisma.transportation.findUnique({
      where: { id }
    });

    if (!transportation) {
      return res.status(404).json({
        success: false,
        error: 'Transportation not found'
      });
    }

    const updatedTransportation = await prisma.transportation.update({
      where: { id },
      data: { isVerified },
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
      await logActivity({
        type: ActivityType.TRANSPORTATION_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'TRANSPORTATION',
        targetId: id,
        message: `Admin ${isVerified ? 'verified' : 'unverified'} transportation: ${transportation.name}`,
        metadata: { 
          previousStatus: { isVerified: transportation.isVerified },
          newStatus: { isVerified }
        }
      });
    } catch {}

    res.json({
      success: true,
      message: `Transportation ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { transportation: updatedTransportation }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update tour verification status
// @route   PUT /api/admin/tours/:id/verify
// @access  Private (Admin only)
router.put('/tours/:id/verify', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const tour = await prisma.tour.findUnique({
      where: { id }
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    const updatedTour = await prisma.tour.update({
      where: { id },
      data: { isVerified },
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
      await logActivity({
        type: ActivityType.TOUR_UPDATED,
        actorUserId: req.user?.id || null,
        targetType: 'TOUR',
        targetId: id,
        message: `Admin ${isVerified ? 'verified' : 'unverified'} tour: ${tour.name}`,
        metadata: { 
          previousStatus: { isVerified: tour.isVerified },
          newStatus: { isVerified }
        }
      });
    } catch {}

    res.json({
      success: true,
      message: `Tour ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { tour: updatedTour }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all tours for admin management
// @route   GET /api/admin/tours
// @access  Private (Admin only)
router.get('/tours', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      category,
      isVerified,
      isAvailable
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build where clause
    const where: any = {};

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

    // Filter by verification status
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

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
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tour.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        tours,
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

// @desc    Get revenue report
// @route   GET /api/admin/reports/revenue
// @access  Private (Admin only)
router.get('/reports/revenue', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range'
      });
    }

    // Get payments within date range
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        booking: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Generate date range array for complete coverage
    const dateRange: Date[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group data based on groupBy parameter
    const groupedData: any = {};
    
    // Initialize all dates with zero values
    dateRange.forEach(date => {
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          revenue: 0,
          bookings: 0,
          payments: []
        };
      }
    });

    // Add actual payment data
    payments.forEach(payment => {
      let key: string;
      const date = new Date(payment.createdAt);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (groupedData[key]) {
        groupedData[key].revenue += payment.amount;
        groupedData[key].bookings += 1;
        groupedData[key].payments.push(payment);
      }
    });

    const reportData = Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalBookings = payments.length;

    res.json({
      success: true,
      data: {
        report: reportData,
        summary: {
          totalRevenue,
          totalBookings,
          averageRevenue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get bookings report
// @route   GET /api/admin/reports/bookings
// @access  Private (Admin only)
router.get('/reports/bookings', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range'
      });
    }

    // Get bookings within date range
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payment: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Generate date range array for complete coverage
    const dateRange: Date[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group data based on groupBy parameter
    const groupedData: any = {};
    
    // Initialize all dates with zero values
    dateRange.forEach(date => {
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          totalBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          revenue: 0,
          bookings: []
        };
      }
    });

    // Add actual booking data
    bookings.forEach(booking => {
      let key: string;
      const date = new Date(booking.createdAt);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (groupedData[key]) {
        groupedData[key].totalBookings += 1;
        groupedData[key].bookings.push(booking);

        switch (booking.status) {
          case 'CONFIRMED':
            groupedData[key].confirmedBookings += 1;
            break;
          case 'CANCELLED':
            groupedData[key].cancelledBookings += 1;
            break;
          case 'PENDING':
            groupedData[key].pendingBookings += 1;
            break;
        }

        // Add revenue if payment exists and is completed
        if (booking.payment && booking.payment.status === 'COMPLETED') {
          groupedData[key].revenue += booking.payment.amount;
        }
      }
    });

    const reportData = Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const totalRevenue = bookings.reduce((sum, booking) => {
      if (booking.payment && booking.payment.status === 'COMPLETED') {
        return sum + booking.payment.amount;
      }
      return sum;
    }, 0);

    res.json({
      success: true,
      data: {
        report: reportData,
        summary: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          pendingBookings,
          totalRevenue,
          averageRevenue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get activity report
// @route   GET /api/admin/reports/activity
// @access  Private (Admin only)
router.get('/reports/activity', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range'
      });
    }

    // Get activities within date range
    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        actorUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Generate date range array for complete coverage
    const dateRange: Date[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group data based on groupBy parameter
    const groupedData: any = {};
    
    // Initialize all dates with zero values
    dateRange.forEach(date => {
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          totalActivities: 0,
          userRegistrations: 0,
          bookings: 0,
          payments: 0,
          contentCreations: 0,
          activities: []
        };
      }
    });

    // Add actual activity data
    activities.forEach(activity => {
      let key: string;
      const date = new Date(activity.createdAt);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (groupedData[key]) {
        groupedData[key].totalActivities += 1;
        groupedData[key].activities.push(activity);

        // Categorize activities
        switch (activity.type) {
          case 'USER_REGISTERED':
            groupedData[key].userRegistrations += 1;
            break;
          case 'BOOKING_CREATED':
          case 'BOOKING_UPDATED':
            groupedData[key].bookings += 1;
            break;
          case 'PAYMENT_COMPLETED':
          case 'PAYMENT_FAILED':
            groupedData[key].payments += 1;
            break;
          case 'ACCOMMODATION_CREATED':
          case 'TRANSPORTATION_CREATED':
          case 'TOUR_CREATED':
            groupedData[key].contentCreations += 1;
            break;
        }
      }
    });

    const reportData = Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalActivities = activities.length;
    const userRegistrations = activities.filter(a => a.type === 'USER_REGISTERED').length;
    const bookings = activities.filter(a => ['BOOKING_CREATED', 'BOOKING_UPDATED'].includes(a.type)).length;
    const payments = activities.filter(a => ['PAYMENT_COMPLETED', 'PAYMENT_FAILED'].includes(a.type)).length;
    const contentCreations = activities.filter(a => ['ACCOMMODATION_CREATED', 'TRANSPORTATION_CREATED', 'TOUR_CREATED'].includes(a.type)).length;

    res.json({
      success: true,
      data: {
        report: reportData,
        summary: {
          totalActivities,
          userRegistrations,
          bookings,
          payments,
          contentCreations,
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get analytics dashboard data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period = '30d' } = req.query;
    const periodStr = period as string;
    
    // Calculate date range based on period
    const end = new Date();
    const start = new Date();
    
    switch (periodStr) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    // Get comprehensive analytics data
    const [
      bookingsData,
      revenueData,
      serviceSplit,
      userGrowth,
      conversionMetrics,
      topServices
    ] = await Promise.all([
      // Bookings trend data
      prisma.booking.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Revenue trend data
      prisma.payment.groupBy({
        by: ['createdAt'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Service type distribution
      prisma.booking.groupBy({
        by: ['serviceType'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true }
      }),
      
      // User growth
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Conversion metrics
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true }
      }),
      
      // Top performing services
      prisma.booking.groupBy({
        by: ['serviceType'],
        where: {
          createdAt: { gte: start, lte: end },
          status: 'CONFIRMED'
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })
    ]);

    // Process bookings data for chart
    const processedBookingsData = processTimeSeriesData(bookingsData, start, end, periodStr, 'bookings');
    
    // Process revenue data for chart
    const processedRevenueData = processTimeSeriesData(revenueData, start, end, periodStr, 'revenue');
    
    // Process user growth data
    const processedUserGrowthData = processTimeSeriesData(userGrowth, start, end, periodStr, 'users');

    // Calculate service split percentages
    const totalBookings = serviceSplit.reduce((sum, item) => sum + item._count.id, 0);
    const serviceSplitData = serviceSplit.map(item => ({
      name: item.serviceType,
      value: totalBookings > 0 ? Math.round((item._count.id / totalBookings) * 100) : 0
    }));

    // Calculate conversion rate (bookings vs total visitors - estimated)
    const totalBookingsCount = conversionMetrics._count.id;
    const estimatedVisitors = totalBookingsCount * 30; // Rough estimate: 1 booking per 30 visitors
    const conversionRate = estimatedVisitors > 0 ? (totalBookingsCount / estimatedVisitors) * 100 : 0;

    // Calculate average booking value
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
    const averageBookingValue = totalBookingsCount > 0 ? totalRevenue / totalBookingsCount : 0;

    res.json({
      success: true,
      data: {
        period: periodStr,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        bookings: {
          trend: processedBookingsData,
          total: totalBookingsCount
        },
        revenue: {
          trend: processedRevenueData,
          total: totalRevenue,
          average: averageBookingValue
        },
        services: {
          split: serviceSplitData,
          top: topServices.map(item => ({
            serviceType: item.serviceType,
            bookings: item._count.id
          }))
        },
        users: {
          growth: processedUserGrowthData,
          total: userGrowth.reduce((sum, item) => sum + item._count.id, 0)
        },
        metrics: {
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageBookingValue: Math.round(averageBookingValue),
          topService: serviceSplitData.length > 0 ? serviceSplitData[0].name : 'N/A'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to process time series data
function processTimeSeriesData(data: any[], start: Date, end: Date, period: string, dataType: string) {
  const result: any[] = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    let key: string;
    let label: string;
    
    switch (period) {
      case '7d':
        key = currentDate.toISOString().split('T')[0];
        label = `D${currentDate.getDate()}`;
        break;
      case '30d':
        key = currentDate.toISOString().split('T')[0];
        label = `D${currentDate.getDate()}`;
        break;
      case '90d':
        key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        label = `M${currentDate.getMonth() + 1}`;
        break;
      default:
        key = currentDate.toISOString().split('T')[0];
        label = `D${currentDate.getDate()}`;
    }
    
    // Find data for this date
    const dayData = data.find(item => {
      const itemDate = new Date(item.createdAt);
      switch (period) {
        case '7d':
        case '30d':
          return itemDate.toISOString().split('T')[0] === key;
        case '90d':
          return `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}` === key;
        default:
          return itemDate.toISOString().split('T')[0] === key;
      }
    });
    
    result.push({
      label,
      [dataType]: dataType === 'revenue' 
        ? (dayData?._sum.amount || 0)
        : (dayData?._count.id || 0)
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

// @desc    Get help articles
// @route   GET /api/admin/help/articles
// @access  Private (Admin only)
router.get('/help/articles', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    
    let whereClause: any = {};
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }
    
    const articles = await prisma.helpArticle.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      include: {
        category: true
      }
    });
    
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get help article by ID
// @route   GET /api/admin/help/articles/:id
// @access  Private (Admin only)
router.get('/help/articles/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.helpArticle.findUnique({
      where: { id },
      include: {
        category: true
      }
    });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Help article not found'
      });
    }
    
    // Log article view for analytics
    await logActivity({
      type: ActivityType.HELP_ARTICLE_VIEWED,
      actorUserId: req.user?.id || null,
      targetType: 'HELP_ARTICLE',
      targetId: id,
      message: `Admin viewed help article: ${article.title}`,
      metadata: { articleTitle: article.title, category: article.category?.name }
    });
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create help article
// @route   POST /api/admin/help/articles
// @access  Private (Admin only)
router.post('/help/articles', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, categoryId, tags, order, isPublished } = req.body;
    
    const article = await prisma.helpArticle.create({
      data: {
        title,
        content,
        categoryId,
        tags: tags || [],
        order: order || 0,
        isPublished: isPublished !== undefined ? isPublished : true,
        authorId: req.user?.id || ''
      },
      include: {
        category: true
      }
    });
    
    await logActivity({
      type: ActivityType.HELP_ARTICLE_CREATED,
      actorUserId: req.user?.id || null,
      targetType: 'HELP_ARTICLE',
      targetId: article.id,
      message: `Admin created help article: ${article.title}`,
      metadata: { articleTitle: article.title, category: article.category?.name }
    });
    
    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update help article
// @route   PUT /api/admin/help/articles/:id
// @access  Private (Admin only)
router.put('/help/articles/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, tags, order, isPublished } = req.body;
    
    const article = await prisma.helpArticle.update({
      where: { id },
      data: {
        title,
        content,
        categoryId,
        tags: tags || [],
        order: order || 0,
        isPublished: isPublished !== undefined ? isPublished : true
      },
      include: {
        category: true
      }
    });
    
    await logActivity({
      type: ActivityType.HELP_ARTICLE_UPDATED,
      actorUserId: req.user?.id || null,
      targetType: 'HELP_ARTICLE',
      targetId: id,
      message: `Admin updated help article: ${article.title}`,
      metadata: { articleTitle: article.title, category: article.category?.name }
    });
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete help article
// @route   DELETE /api/admin/help/articles/:id
// @access  Private (Admin only)
router.delete('/help/articles/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.helpArticle.delete({
      where: { id }
    });
    
    await logActivity({
      type: ActivityType.HELP_ARTICLE_DELETED,
      actorUserId: req.user?.id || null,
      targetType: 'HELP_ARTICLE',
      targetId: id,
      message: `Admin deleted help article: ${article.title}`,
      metadata: { articleTitle: article.title }
    });
    
    res.json({
      success: true,
      message: 'Help article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get help categories
// @route   GET /api/admin/help/categories
// @access  Private (Admin only)
router.get('/help/categories', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.helpCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create help category
// @route   POST /api/admin/help/categories
// @access  Private (Admin only)
router.post('/help/categories', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, order, icon } = req.body;
    
    const category = await prisma.helpCategory.create({
      data: {
        name,
        description,
        order: order || 0,
        icon
      }
    });
    
    await logActivity({
      type: ActivityType.HELP_CATEGORY_CREATED,
      actorUserId: req.user?.id || null,
      targetType: 'HELP_CATEGORY',
      targetId: category.id,
      message: `Admin created help category: ${category.name}`,
      metadata: { categoryName: category.name }
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get system diagnostics
// @route   GET /api/admin/help/diagnostics
// @access  Private (Admin only)
router.get('/help/diagnostics', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get system health information
    const [
      dbStatus,
      userCount,
      bookingCount,
      systemSettings
    ] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as status`,
      prisma.user.count(),
      prisma.booking.count(),
      prisma.systemSetting.findMany({
        where: { isActive: true },
        select: { key: true, value: true }
      })
    ]);
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        userCount,
        bookingCount
      },
      system: {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      settings: systemSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as any)
    };
    
    res.json({
      success: true,
      data: diagnostics
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit support ticket
// @route   POST /api/admin/help/tickets
// @access  Private (Admin only)
router.post('/help/tickets', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { subject, description, priority, category } = req.body;
    
    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        description,
        priority: priority || 'MEDIUM',
        category: category || 'GENERAL',
        status: 'OPEN',
        submittedBy: req.user?.id || '',
        assignedTo: null
      }
    });
    
    await logActivity({
      type: ActivityType.SUPPORT_TICKET_CREATED,
      actorUserId: req.user?.id || null,
      targetType: 'SUPPORT_TICKET',
      targetId: ticket.id,
      message: `Admin submitted support ticket: ${ticket.subject}`,
      metadata: { subject: ticket.subject, priority: ticket.priority, category: ticket.category }
    });
    
    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get support tickets
// @route   GET /api/admin/help/tickets
// @access  Private (Admin only)
router.get('/help/tickets', protect, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;
    
    let whereClause: any = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          submittedByUser: {
            select: { firstName: true, lastName: true, email: true }
          },
          assignedToUser: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      }),
      prisma.supportTicket.count({ where: whereClause })
    ]);
    
    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});