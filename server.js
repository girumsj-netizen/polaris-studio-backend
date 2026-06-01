import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security Headers ---
app.use(helmet());

// --- Body Size Limit ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- CORS Configuration ---
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_LOCAL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin && allowedOrigins.length > 0) {
      return callback(new Error('Not allowed by CORS'));
    }
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// --- Rate Limiting ---
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// --- Input Validation Helpers ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sanitize = (str) => typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : '';

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Polaris Studio API'
  });
});

// --- Contact Form Endpoint ---
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, project, brief, package: pkg, contactMethod } = req.body;

    if (!name || !email || !brief) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, and brief are required.'
      });
    }

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanBrief = sanitize(brief);

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (cleanBrief.length < 10 || cleanBrief.length > 5000) {
      return res.status(400).json({ error: 'Brief must be between 10 and 5000 characters.' });
    }

    console.log(`[Contact] New inquiry from ${cleanName} <${cleanEmail}>`);
    console.log(`[Contact] Package: ${pkg || 'Not specified'}`);
    console.log(`[Contact] Brief: ${cleanBrief.substring(0, 100)}...`);

    // TODO: Integrate email service (Nodemailer)

    res.json({
      success: true,
      message: 'Project inquiry received. We will respond within 48 hours.',
      data: { name: cleanName, email: cleanEmail, project, package: pkg, contactMethod }
    });
  } catch (error) {
    console.error('[Contact] Error:', error.message);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n  Polaris Studio API running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Allowed origins: ${allowedOrigins.join(', ') || 'All (no env set)'}\n`);
});
