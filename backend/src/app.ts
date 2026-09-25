import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import collectionRoutes from './routes/collections';
import endpointRoutes from './routes/endpoints';
import environmentRoutes from './routes/environments';
import { router as historyRouter } from './routes/history';
import proxyRoutes from './routes/proxy';
import { errorHandler } from './middleware/errorHandler';
import { seedData } from './database/seed';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/history', historyRouter);
app.use('/api/proxy', proxyRoutes);

app.use(errorHandler);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await seedData(false);

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
