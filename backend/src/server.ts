import cors from 'cors';
import dns from 'dns';
import express from 'express';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes/api';
const app = express();
app.use(cors(env.clientUrl ? { origin: env.clientUrl.split(',') } : undefined));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRoutes);
app.use(errorHandler);

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(env.mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(env.port, () => console.log(`Backend running on port ${env.port}`));
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

export default app;
