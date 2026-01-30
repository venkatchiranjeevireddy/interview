import express from 'express';
import cors from 'cors';
import authRoutes from './auth/auth.routes.js';
import resumeRoutes from './resume/resume.routes.js';
import interviewRoutes from './interview/interview.routes.js';
import subscriptionRoutes from './services/subscription.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Simple request logger for visibility in console
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);

export default app;
