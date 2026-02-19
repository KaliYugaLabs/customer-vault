import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { securityHeaders, corsOptions, generalLimiter, authLimiter, authenticateToken } from './middleware/security';
import { geocodeAddress, searchAddress } from './services/geocoding';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(securityHeaders);
app.use(corsOptions);
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Geocoding endpoints (public but rate limited)
app.get('/api/v1/geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    
    const result = await geocodeAddress(q);
    
    if (!result) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    
    if (q.length < 3) {
      return res.json([]);
    }
    
    const results = await searchAddress(q);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Protected routes (require authentication)
app.use('/api/v1/protected', authenticateToken);

app.get('/api/v1/protected/profile', (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
