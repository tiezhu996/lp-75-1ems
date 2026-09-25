import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Environment from '../models/Environment';
import Collection from '../models/Collection';
import ApiEndpoint from '../models/ApiEndpoint';

dotenv.config();

export const seedData = async (force: boolean = false): Promise<boolean> => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && !force) {
      console.log('数据库已有数据，跳过种子初始化');
      return false;
    }

    if (force) {
      await User.deleteMany({});
      await Environment.deleteMany({});
      await Collection.deleteMany({});
      await ApiEndpoint.deleteMany({});
    }

    const user1 = new User({
      username: 'dev1',
      password: 'dev123',
    });

    const user2 = new User({
      username: 'dev2',
      password: 'dev123',
    });

    await user1.save();
    await user2.save();
    console.log('创建用户: dev1, dev2');

    const env1 = new Environment({
      userId: user1._id,
      name: '开发环境',
      variables: [
        { key: 'base_url', value: 'http://localhost:3106' },
      ],
      isActive: true,
    });

    const env2 = new Environment({
      userId: user2._id,
      name: '开发环境',
      variables: [
        { key: 'base_url', value: 'http://localhost:3106' },
      ],
      isActive: true,
    });

    await env1.save();
    await env2.save();
    console.log('创建环境: 开发环境');

    const collection1 = new Collection({
      userId: user1._id,
      name: '示例 API',
      description: '示例接口集合，包含用户管理相关接口',
    });

    const collection2 = new Collection({
      userId: user2._id,
      name: '示例 API',
      description: '示例接口集合，包含用户管理相关接口',
    });

    await collection1.save();
    await collection2.save();
    console.log('创建集合: 示例 API');

    const endpointsUser1 = [
      {
        collectionId: collection1._id,
        name: '获取用户列表',
        method: 'GET' as const,
        url: '{{base_url}}/api/users',
        headers: [],
        description: '获取所有用户列表',
      },
      {
        collectionId: collection1._id,
        name: '创建用户',
        method: 'POST' as const,
        url: '{{base_url}}/api/users',
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: '{\n  "name": "test",\n  "email": "test@example.com"\n}',
        description: '创建新用户',
      },
      {
        collectionId: collection1._id,
        name: '获取单个用户',
        method: 'GET' as const,
        url: '{{base_url}}/api/users/:id',
        headers: [],
        description: '根据 ID 获取单个用户',
      },
      {
        collectionId: collection1._id,
        name: '更新用户',
        method: 'PUT' as const,
        url: '{{base_url}}/api/users/:id',
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: '{\n  "name": "updated",\n  "email": "updated@example.com"\n}',
        description: '更新用户信息',
      },
    ];

    const endpointsUser2 = [
      {
        collectionId: collection2._id,
        name: '获取用户列表',
        method: 'GET' as const,
        url: '{{base_url}}/api/users',
        headers: [],
        description: '获取所有用户列表',
      },
      {
        collectionId: collection2._id,
        name: '创建用户',
        method: 'POST' as const,
        url: '{{base_url}}/api/users',
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: '{\n  "name": "test",\n  "email": "test@example.com"\n}',
        description: '创建新用户',
      },
      {
        collectionId: collection2._id,
        name: '获取单个用户',
        method: 'GET' as const,
        url: '{{base_url}}/api/users/:id',
        headers: [],
        description: '根据 ID 获取单个用户',
      },
      {
        collectionId: collection2._id,
        name: '更新用户',
        method: 'PUT' as const,
        url: '{{base_url}}/api/users/:id',
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: '{\n  "name": "updated",\n  "email": "updated@example.com"\n}',
        description: '更新用户信息',
      },
    ];

    for (const endpointData of endpointsUser1) {
      const endpoint = new ApiEndpoint({
        userId: user1._id,
        ...endpointData,
      });
      await endpoint.save();
    }

    for (const endpointData of endpointsUser2) {
      const endpoint = new ApiEndpoint({
        userId: user2._id,
        ...endpointData,
      });
      await endpoint.save();
    }

    console.log('创建示例接口完成');
    console.log('种子数据插入完成');
    return true;
  } catch (error) {
    console.error('种子数据插入失败:', error);
    return false;
  }
};

if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/api_debugger';
  mongoose.connect(mongoUri)
    .then(() => seedData(true))
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
