import { Document, model, Schema, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  READ_ONLY = 'READ_ONLY',
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  assignedPersonIds: Types.ObjectId[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    assignedPersonIds: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
