import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// â”€â”€ CORS Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dynamically allows requests from your local dev + production frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,               // Production (Vercel/Netlify)
  process.env.FRONTEND_URL_LOCAL,         // Local dev server
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
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
  maxAge: 86400 // Preflight cache: 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// â”€â”€ Health Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Polaris Studio API'
  });
});

// â”€â”€ Contact Form Endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, project, brief, package: pkg, contactMethod } = req.body;

    if (!name || !email || !brief) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, and brief are required.'
      });
    }

    console.log(`[Contact] New inquiry from ${name} <${email}>`);
    console.log(`[Contact] Package: ${pkg || 'Not specified'}`);
    console.log(`[Contact] Brief: ${brief.substring(0, 100)}...`);

    // â”€â”€ TODO: Integrate your email service here â”€â”€
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });

    res.json({
      success: true,
      message: 'Project inquiry received. We will respond within 48 hours.',
      data: { name, email, project, package: pkg, contactMethod }
    });
  } catch (error) {
    console.error('[Contact] Error:', error.message);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// â”€â”€ Start Server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.listen(PORT, () => {
  console.log(`\n  Polaris Studio API running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Allowed origins: ${allowedOrigins.join(', ') || 'All (no env set)'}\n`);
});
