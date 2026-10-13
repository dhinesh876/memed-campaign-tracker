import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/memed',
  jwtSecret: process.env.JWT_SECRET || 'memed_secret_key',
  spikeViewsThreshold: Number(process.env.SPIKE_THRESHOLD) || 50000,
  // Comma-separated list of allowed frontend origins. Empty = allow all (dev only).
  clientUrl: process.env.CLIENT_URL || '',
};

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set; using an insecure default.');
}
