import { Router, Response } from 'express';
import authMiddleware from '../middleware/auth';
import ApiEndpoint, { IHeader } from '../models/ApiEndpoint';
import Collection from '../models/Collection';
import { AuthenticatedRequest, ApiResponse, HttpMethod } from '../types';
import mongoose from 'mongoose';

const router = Router();

const HTTP_METHODS: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

interface CreateEndpointRequest {
  collectionId: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: IHeader[];
  body?: string;
  description?: string;
}

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const { collectionId } = req.query;

    if (!collectionId) {
      res.status(400).json({
        success: false,
        message: '缺少 collectionId 参数',
      });
      return;
    }

    const endpoints = await ApiEndpoint.find({
      userId: req.user._id,
      collectionId: collectionId as string,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: endpoints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取接口列表失败',
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: '无效的接口 ID',
      });
      return;
    }

    const endpoint = await ApiEndpoint.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!endpoint) {
      res.status(404).json({
        success: false,
        message: '接口不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取接口详情失败',
    });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const { collectionId, name, method, url, headers, body, description } =
      req.body as CreateEndpointRequest;

    if (!collectionId || !name || !method || !url) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
      return;
    }

    if (!HTTP_METHODS.includes(method)) {
      res.status(400).json({
        success: false,
        message: '不支持的 HTTP 方法',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      res.status(400).json({
        success: false,
        message: '无效的集合 ID',
      });
      return;
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      userId: req.user._id,
    });

    if (!collection) {
      res.status(404).json({
        success: false,
        message: '集合不存在',
      });
      return;
    }

    const endpoint = new ApiEndpoint({
      userId: req.user._id,
      collectionId: collection._id,
      name: name.trim(),
      method,
      url: url.trim(),
      headers: headers || [],
      body,
      description: description?.trim(),
    });

    await endpoint.save();

    res.status(201).json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建接口失败',
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权访问' });
      return;
    }

    const { id } = req.params;
    const { name, method, url, headers, body, description } = req.body as Partial<CreateEndpointRequest>;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: '无效的接口 ID',
      });
      return;
    }

    const endpoint = await ApiEndpoint.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!endpoint) {
      res.status(404).json({
        success: false,
        message: '接口不存在',
      });
      return;
    }

    if (name && name.trim().length > 0) {
      endpoint.name = name.trim();
    }

    if (method && HTTP_METHODS.includes(method)) {
      endpoint.method = method;
    }

    if (url && url.trim().length > 0) {
      endpoint.url = url.trim();
    }

    if (headers !== undefined) {
      endpoint.headers = headers;
    }

    if (body !== undefined) {
      endpoint.body = body;
    }

    if (description !== undefined) {
      endpoint.description = description?.trim();
    }

    await endpoint.save();

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新接口失败',
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
          message: '无效的接口 ID',
        });
        return;
      }

      const endpoint = await ApiEndpoint.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!endpoint) {
        res.status(404).json({
          success: false,
          message: '接口不存在',
        });
        return;
      }

      await endpoint.deleteOne();

      res.json({
        success: true,
        message: '接口已删除',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除接口失败',
      });
    }
  }
);

export default router;
