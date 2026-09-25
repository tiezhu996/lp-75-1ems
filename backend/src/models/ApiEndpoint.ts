import mongoose, { Schema, Document } from 'mongoose';

export interface IHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface IApiEndpoint extends Document {
  userId: mongoose.Types.ObjectId;
  collectionId: mongoose.Types.ObjectId;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: IHeader[];
  body?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApiEndpointSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      required: true,
      default: 'GET',
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    headers: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
        enabled: { type: Boolean, default: true },
      },
    ],
    body: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

ApiEndpointSchema.index({ userId: 1, collectionId: 1 });

export default mongoose.model<IApiEndpoint>('ApiEndpoint', ApiEndpointSchema);
