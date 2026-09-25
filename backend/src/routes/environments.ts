import { Router, Response } from 'express';
import authMiddleware from '../middleware/auth';
import Environment, { IEnvVariable } from '../models/Environment';
import { AuthenticatedRequest, ApiResponse } from '../types';
import mongoose from 'mongoose';

const router = Router();

interface CreateEnvironmentRequest {
  name: string;
  variables?: IEnvVariable[];
}

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const environments = await Environment.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: environments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取环境列表失败',
    });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const { name, variables } = req.body as CreateEnvironmentRequest;

    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '环境名称不能为空',
      });
      return;
    }

    const existingEnvironment = await Environment.findOne({
      userId: req.user._id,
      name: name.trim(),
    });

    if (existingEnvironment) {
      res.status(400).json({
        success: false,
        message: '环境名称已存在',
      });
      return;
    }

    const environments = await Environment.find({ userId: req.user._id });
    const isFirstEnvironment = environments.length === 0;

    const environment = new Environment({
      userId: req.user._id,
      name: name.trim(),
      variables: variables || [],
      isActive: isFirstEnvironment,
    });

    await environment.save();

    res.status(201).json({
      success: true,
      data: environment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建环境失败',
    });
  }
});

router.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未授权访问' });
        return;
      }

      const { id } = req.params;
      const { name, variables } = req.body as Partial<CreateEnvironmentRequest>;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: '无效的环境 ID',
        });
        return;
      }

      const environment = await Environment.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!environment) {
        res.status(404).json({
          success: false,
          message: '环境不存在',
        });
        return;
      }

      if (name && name.trim().length > 0) {
        const existingEnvironment = await Environment.findOne({
          userId: req.user._id,
          name: name.trim(),
          _id: { $ne: id },
        });

        if (existingEnvironment) {
          res.status(400).json({
            success: false,
            message: '环境名称已存在',
          });
          return;
        }

        environment.name = name.trim();
      }

      if (variables !== undefined) {
        environment.variables = variables;
      }

      await environment.save();

      res.json({
        success: true,
        data: environment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新环境失败',
      });
    }
  }
);

router.put(
  '/:id/activate',
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
          message: '无效的环境 ID',
        });
        return;
      }

      const environment = await Environment.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!environment) {
        res.status(404).json({
          success: false,
          message: '环境不存在',
        });
        return;
      }

      await Environment.updateMany(
        { userId: req.user._id },
        { isActive: false }
      );

      environment.isActive = true;
      await environment.save();

      res.json({
        success: true,
        data: environment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '激活环境失败',
      });
    }
  }
);

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
          message: '无效的环境 ID',
        });
        return;
      }

      const environment = await Environment.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!environment) {
        res.status(404).json({
          success: false,
          message: '环境不存在',
        });
        return;
      }

      const wasActive = environment.isActive;
      await environment.deleteOne();

      if (wasActive) {
        const nextEnvironment = await Environment.findOne({
          userId: req.user._id,
        }).sort({ createdAt: 1 });

        if (nextEnvironment) {
          nextEnvironment.isActive = true;
          await nextEnvironment.save();
        }
      }

      res.json({
        success: true,
        message: '环境已删除',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除环境失败',
      });
    }
  }
);

export default router;
