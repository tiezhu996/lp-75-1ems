import { Router, Response } from 'express';
import authMiddleware from '../middleware/auth';
import RequestHistory from '../models/RequestHistory';
import { AuthenticatedRequest, ApiResponse } from '../types';
import mongoose from 'mongoose';

const router = Router();

const MAX_HISTORY_PER_USER = 100;

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const { search, limit = 50 } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);

    const query: Record<string, unknown> = {
      userId: req.user._id };

    if (search && (search as string).trim().length > 0) {
      const searchTerm = (search as string).trim();
      query['$or'] = [
        { method: { $regex: searchTerm, $options: 'i' } },
        { url: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const history = await RequestHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取请求历史失败',
    });
  }
});

router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未授权访问' });
        return;
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的历史记录 ID',
        });
        return;
      }

      const history = await RequestHistory.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!history) {
        res.status(404).json({
          success: false,
          message: '历史记录不存在',
        });
        return;
      }

      await history.deleteOne();

      res.json({
        success: true,
        message: '历史记录已删除',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除历史记录失败',
      });
    }
  }
);

router.delete(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未授权访问' });
        return;
      }

      await RequestHistory.deleteMany({ userId: req.user._id });

      res.json({
        success: true,
        message: '历史记录已清空',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '清空历史记录失败',
      });
    }
  }
);

export { router, MAX_HISTORY_PER_USER };
