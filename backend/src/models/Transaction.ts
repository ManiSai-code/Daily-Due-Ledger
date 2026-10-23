import { Schema, model, Document, Types } from 'mongoose';

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export interface ITransaction extends Document {
  receiptNumber: string;
  personId: Types.ObjectId;
  amount: Types.Decimal128;
  previousBalance: Types.Decimal128;
  newBalance: Types.Decimal128;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate: Date;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: [true, 'Person ID is required'],
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Transaction amount is required'],
      validate: {
        validator: (val: Types.Decimal128) => parseFloat(val.toString()) > 0,
        message: 'Payment amount must be strictly greater than 0',
      },
    },
    previousBalance: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    newBalance: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
    },
    notes: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Transactions are immutable ledger records
  }
);

transactionSchema.index({ personId: 1, paymentDate: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);