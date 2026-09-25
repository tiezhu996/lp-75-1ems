import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = Router();

interface RegisterRequest {
  username: string;
  password: string;
}

router.post('/register', async (req, res: Response<ApiResponse>) => {
  try {
    const { username, password } = req.body as RegisterRequest;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    if (username.length < 2 || username.length > 50) {
      res.status(400).json({
        success: false,
        message: '用户名长度必须在 2-50 个字符之间',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: '密码长度至少为 6 个字符',
      });
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '用户名已存在',
      });
      return;
    }

    const user = new User({ username, password });
    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      jwtSecret,
      { expiresIn: jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败',
    });
  }
});

router.post('/login', async (req, res: Response<ApiResponse>) => {
  try {
    const { username, password } = req.body as RegisterRequest;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      jwtSecret,
      { expiresIn: jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
    });
  }
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: '未授权访问',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: req.user._id.toString(),
      username: req.user.username,
      createdAt: req.user.createdAt,
    },
  });
});

export default router;
