import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthService } from './services/auth.service';
import { requireAuth, AuthenticatedRequest } from './middleware/auth.middleware';
import { EventBus } from './services/event-bus.service';
import { FeedbackCollectorService } from './services/ai/feedback-collector.service';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());

/**
 * GET /api/health
 * Lightweight API health check endpoint.
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});


/**
 * POST /api/auth/register
 * Creates a new user in the database.
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password with 10 salt rounds
    const passwordHash = await AuthService.hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and sets an HTTP-only JWT cookie.
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await AuthService.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = AuthService.generateToken(user.id, user.email);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the HTTP-only auth cookie.
 */
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Protected endpoint to fetch current authenticated user profile.
 */
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    user: req.user,
  });
});

/**
 * GET /api/users/profile
 * Fetch authenticated user profile details.
 */
app.get('/api/users/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/incoming
 * Webhook endpoint that ingests incoming emails, checks for thread association,
 * validates body structures via Zod, and creates records in PostgreSQL.
 */
const incomingEmailSchema = z.object({
  sender: z.string().email(),
  recipient: z.string().email(),
  subject: z.string(),
  body: z.string(),
  messageId: z.string(),
  inReplyTo: z.string().optional(),
});

app.post('/api/webhooks/incoming', async (req: Request, res: Response) => {
  try {
    // 1. Strict payload validation with Zod
    const validation = incomingEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid payload schema',
        details: validation.error.flatten(),
      });
    }

    const { sender, recipient, subject, body, messageId, inReplyTo } = validation.data;

    // 2. Fetch or dynamically create the recipient User
    let user = await prisma.user.findUnique({
      where: { email: recipient },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: recipient,
          passwordHash: await AuthService.hashPassword('webhook-generated-password-hash'),
        },
      });
    }

    // 3. Check for thread association via In-Reply-To header / messageId
    let threadId: string | null = null;
    if (inReplyTo) {
      const previousEmail = await prisma.email.findUnique({
        where: { messageId: inReplyTo },
      });
      if (previousEmail) {
        threadId = previousEmail.threadId;
      }
    }

    // If no existing thread is found, spin up a new Thread
    if (!threadId) {
      const newThread = await prisma.thread.create({
        data: {
          summary: `Thread for: ${subject}`,
        },
      });
      threadId = newThread.id;
    }

    // 4. Create the Email record
    const emailRecord = await prisma.email.create({
      data: {
        messageId,
        inReplyTo: inReplyTo || null,
        sender,
        recipient,
        subject,
        body,
        status: 'UNREAD',
        userId: user.id,
        threadId,
      },
    });

    // 5. Publish event to decouple AI processing
    await EventBus.publish('email.received', { emailId: emailRecord.id });

    // 6. Return 201 Created immediately
    return res.status(201).json({
      message: 'Email ingested successfully',
      email: {
        id: emailRecord.id,
        messageId: emailRecord.messageId,
        subject: emailRecord.subject,
        threadId: emailRecord.threadId,
        createdAt: emailRecord.createdAt,
      },
    });
  } catch (error) {
    console.error('Incoming webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/me/settings
 * Fetches user-specific preferences. If not initialized, returns system defaults.
 */
app.get('/api/users/me/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return res.status(200).json({
        theme: 'dark',
        signature: null,
        autoReply: false,
      });
    }

    return res.status(200).json({
      theme: settings.theme,
      signature: settings.signature,
      autoReply: settings.autoReply,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/me/settings
 * Updates (or initializes) user-specific preferences, validating parameters via Zod.
 */
const updateSettingsSchema = z.object({
  theme: z.string().min(1).optional(),
  signature: z.string().nullable().optional(),
  autoReply: z.boolean().optional(),
});

app.put('/api/users/me/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validation = updateSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid payload schema',
        details: validation.error.flatten(),
      });
    }

    const { theme, signature, autoReply } = validation.data;

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(theme !== undefined && { theme }),
        ...(signature !== undefined && { signature }),
        ...(autoReply !== undefined && { autoReply }),
      },
      create: {
        userId,
        theme: theme ?? 'dark',
        signature: signature ?? null,
        autoReply: autoReply ?? false,
      },
    });

    return res.status(200).json({
      message: 'Settings updated successfully',
      settings: {
        theme: updatedSettings.theme,
        signature: updatedSettings.signature,
        autoReply: updatedSettings.autoReply,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/emails/search
 * Search user's emails by subject or body with pagination.
 */
app.get('/api/emails/search', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { q } = req.query;
    if (typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required and cannot be empty' });
    }

    // Parse pagination parameters
    const limitQuery = parseInt(req.query.limit as string, 10);
    const offsetQuery = parseInt(req.query.offset as string, 10);

    const limit = isNaN(limitQuery) || limitQuery <= 0 ? 20 : Math.min(limitQuery, 20);
    const offset = isNaN(offsetQuery) || offsetQuery < 0 ? 0 : offsetQuery;

    // Search query object
    const searchFilter = {
      userId,
      OR: [
        { subject: { contains: q } },
        { body: { contains: q } },
      ],
    };

    // Run both count and select queries concurrently
    const [total, emails] = await Promise.all([
      prisma.email.count({ where: searchFilter }),
      prisma.email.findMany({
        where: searchFilter,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      emails,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Email search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/feedback
 * Records user feedback on email classifications, validates payload using Zod,
 * and rate-limits to 100 feedbacks/day per user.
 */
const feedbackInputSchema = z.object({
  emailId: z.string().min(1),
  feedbackType: z.enum(['thumbs_up', 'thumbs_down', 'category_correction', 'priority_adjustment']),
  correctedValue: z.string().optional(),
});

app.post('/api/feedback', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Zod Validation
    const validation = feedbackInputSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid payload schema',
        details: validation.error.flatten(),
      });
    }

    const { emailId, feedbackType, correctedValue } = validation.data;

    // 2. Rate limiting check (100 feedbacks/day per user)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const feedbackCount = await prisma.userFeedback.count({
      where: {
        userId,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (feedbackCount >= 100) {
      return res.status(429).json({ error: 'Rate limit exceeded: 100 feedbacks per day' });
    }

    // 3. Record Feedback
    await FeedbackCollectorService.recordFeedback(userId, emailId, feedbackType, correctedValue);

    return res.status(201).json({ message: 'Feedback recorded successfully' });
  } catch (error) {
    console.error('Record feedback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/me/ai-profile
 * Exposes learned user preference profile.
 */
app.get('/api/users/me/ai-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings || !settings.aiPreferenceProfile) {
      return res.status(200).json({ weekly: {} });
    }

    const profile = JSON.parse(settings.aiPreferenceProfile);
    return res.status(200).json(profile);
  } catch (error) {
    console.error('Fetch AI profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export { app, server, prisma };
