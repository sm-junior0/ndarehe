import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, requireVerification } from '../middleware/auth';
import { validate, tripPlanSchemas } from '../middleware/validation';
import { sendEmail, emailTemplates } from '../utils/email';

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
 *     CreateTripPlanRequest:
 *       type: object
 *       required:
 *         - arrivalDate
 *         - departureDate
 *         - tripType
 *         - numberOfPeople
 *       properties:
 *         arrivalDate:
 *           type: string
 *           format: date
 *           description: Arrival date
 *         departureDate:
 *           type: string
 *           format: date
 *           description: Departure date
 *         budget:
 *           type: number
 *           description: Budget for the trip
 *         tripType:
 *           type: string
 *           enum: [BUSINESS, FAMILY, ROMANTIC, ADVENTURE, CULTURAL, RELAXATION]
 *           description: Type of trip
 *         numberOfPeople:
 *           type: integer
 *           minimum: 1
 *           description: Number of people traveling
 *         specialRequests:
 *           type: string
 *           description: Any special requests or preferences
 */

/**
 * @swagger
 * /trip-plans:
 *   post:
 *     summary: Create a new trip plan request
 *     description: Submit a trip plan request for personalized recommendations
 *     tags: [Trip Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTripPlanRequest'
 *     responses:
 *       201:
 *         description: Trip plan request created successfully
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
 *                   example: Trip plan request created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     tripPlan:
 *                       $ref: '#/components/schemas/TripPlan'
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
 * /trip-plans:
 *   get:
 *     summary: Get user trip plans
 *     description: Retrieve all trip plan requests for the current user
 *     tags: [Trip Plans]
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
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *         description: Filter by trip plan status
 *     responses:
 *       200:
 *         description: User trip plans retrieved successfully
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
 *                     tripPlans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TripPlan'
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

// @desc    Create trip plan request
// @route   POST /api/trip-plans
// @access  Private
router.post('/', protect, requireVerification, validate(tripPlanSchemas.create), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { arrivalDate, departureDate, budget, tripType, numberOfPeople, specialRequests } = req.body;

    const tripPlan = await prisma.tripPlan.create({
      data: {
        userId: req.user!.id,
        arrivalDate: new Date(arrivalDate),
        departureDate: new Date(departureDate),
        budget: budget ? parseFloat(budget) : null,
        tripType,
        numberOfPeople: parseInt(numberOfPeople),
        specialRequests
      }
    });

    // TODO: Implement AI-powered trip planning logic
    // For now, generate basic recommendations
    const recommendations = await generateTripRecommendations(tripPlan);

    // Update trip plan with recommendations
    await prisma.tripPlan.update({
      where: { id: tripPlan.id },
      data: {
        status: 'COMPLETED',
        recommendations
      }
    });

    // Send trip plan ready notification
    try {
      const { subject, html } = emailTemplates.tripPlanReady(req.user!.firstName, tripPlan.id);
      await sendEmail(req.user!.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send trip plan email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Trip plan request submitted successfully',
      data: { tripPlan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user trip plans
// @route   GET /api/trip-plans
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.user!.id };
    if (status) where.status = status;

    const [tripPlans, total] = await Promise.all([
      prisma.tripPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.tripPlan.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        tripPlans,
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

// @desc    Get single trip plan
// @route   GET /api/trip-plans/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tripPlan = await prisma.tripPlan.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!tripPlan) {
      return res.status(404).json({
        success: false,
        error: 'Trip plan not found'
      });
    }

    res.json({
      success: true,
      data: { tripPlan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update trip plan
// @route   PUT /api/trip-plans/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // Convert date fields
    if (updateData.arrivalDate) updateData.arrivalDate = new Date(updateData.arrivalDate);
    if (updateData.departureDate) updateData.departureDate = new Date(updateData.departureDate);
    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
    if (updateData.numberOfPeople) updateData.numberOfPeople = parseInt(updateData.numberOfPeople);

    const tripPlan = await prisma.tripPlan.update({
      where: {
        id,
        userId: req.user!.id
      },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Trip plan updated successfully',
      data: { tripPlan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete trip plan
// @route   DELETE /api/trip-plans/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tripPlan = await prisma.tripPlan.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!tripPlan) {
      return res.status(404).json({
        success: false,
        error: 'Trip plan not found'
      });
    }

    await prisma.tripPlan.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Trip plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate trip recommendations
async function generateTripRecommendations(tripPlan: any) {
  const recommendations: any = {
    accommodations: [],
    transportation: [],
    tours: [],
    estimatedCost: 0
  };

  try {
    // Get recommended accommodations based on trip type and budget
    const accommodationQuery: any = {
      where: {
        isAvailable: true,
        isVerified: true
      },
      take: 3
    };

    if (tripPlan.budget) {
      accommodationQuery.where.pricePerNight = {
        lte: tripPlan.budget / (tripPlan.numberOfPeople * 3) // Rough estimate
      };
    }

    const accommodations = await prisma.accommodation.findMany(accommodationQuery);
    recommendations.accommodations = accommodations;

    // Get recommended transportation
    const transportation = await prisma.transportation.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        type: 'AIRPORT_PICKUP'
      },
      take: 2
    });
    recommendations.transportation = transportation;

    // Get recommended tours based on trip type
    const tourQuery: any = {
      where: {
        isAvailable: true,
        isVerified: true
      },
      take: 3
    };

    if (tripPlan.tripType === 'CULTURAL') {
      tourQuery.where.type = 'CULTURAL_TOUR';
    } else if (tripPlan.tripType === 'ADVENTURE') {
      tourQuery.where.type = 'ADVENTURE_TOUR';
    }

    const tours = await prisma.tour.findMany(tourQuery);
    recommendations.tours = tours;

    // Calculate estimated cost
    const nights = Math.ceil((tripPlan.departureDate - tripPlan.arrivalDate) / (1000 * 60 * 60 * 24));
    
    if (accommodations.length > 0) {
      const avgAccommodationPrice = accommodations.reduce((sum: number, acc: any) => sum + acc.pricePerNight, 0) / accommodations.length;
      recommendations.estimatedCost += avgAccommodationPrice * nights * tripPlan.numberOfPeople;
    }

    if (transportation.length > 0) {
      const avgTransportPrice = transportation.reduce((sum: number, trans: any) => sum + trans.pricePerTrip, 0) / transportation.length;
      recommendations.estimatedCost += avgTransportPrice * 2; // Round trip
    }

    if (tours.length > 0) {
      const avgTourPrice = tours.reduce((sum: number, tour: any) => sum + tour.pricePerPerson, 0) / tours.length;
      recommendations.estimatedCost += avgTourPrice * tripPlan.numberOfPeople;
    }

  } catch (error) {
    console.error('Error generating recommendations:', error);
  }

  return recommendations;
}

export default router; 