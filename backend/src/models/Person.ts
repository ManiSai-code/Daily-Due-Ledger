import { Schema, model, Document, Types } from 'mongoose';

// Account Status Enum
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

// TypeScript Interface for Person Document
export interface IPerson extends Document {
  fullName: string;
  phoneNumber: string;
  address?: string;
  originalAmount: Types.Decimal128;
  currentBalance: Types.Decimal128;
  currentDailyAmount: Types.Decimal128;
  status: AccountStatus;
  startDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definition
const personSchema = new Schema<IPerson>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Please provide a valid phone number'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    originalAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Original amount is required'],
      validate: {
        validator: (val: Types.Decimal128) => parseFloat(val.toString()) > 0,
        message: 'Original amount must be greater than 0',
      },
    },
    currentBalance: {
      type: Schema.Types.Decimal128,
      required: [true, 'Current balance is required'],
      validate: {
        validator: (val: Types.Decimal128) => parseFloat(val.toString()) >= 0,
        message: 'Current balance cannot be negative',
      },
    },
    currentDailyAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Daily payment amount is required'],
      validate: {
        validator: (val: Types.Decimal128) => parseFloat(val.toString()) > 0,
        message: 'Daily payment amount must be greater than 0',
      },
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Search Index for fast lookup by name or phone
personSchema.index({ fullName: 'text', phoneNumber: 'text' });

export const Person = model<IPerson>('Person', personSchema);