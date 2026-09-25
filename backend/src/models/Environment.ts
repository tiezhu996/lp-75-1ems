import mongoose, { Schema, Document } from 'mongoose';

export interface IEnvVariable {
  key: string;
  value: string;
}

export interface IEnvironment extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  variables: IEnvVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EnvironmentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    variables: [
      {
        key: { type: String, trim: true, required: true },
        value: { type: String, default: '' },
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

EnvironmentSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<IEnvironment>('Environment', EnvironmentSchema);
