import { Schema, model, Document, Types } from 'mongoose';

export interface IPaymentArrangementHistory extends Document {
  personId: Types.ObjectId;
  previousDailyAmount: Types.Decimal128;
  newDailyAmount: Types.Decimal128;
  reason?: string;
  changedAt: Date;
}

const paymentArrangementHistorySchema = new Schema<IPaymentArrangementHistory>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
      required: true,
      index: true,
    },
    previousDailyAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    newDailyAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export const PaymentArrangementHistory = model<IPaymentArrangementHistory>(
  'PaymentArrangementHistory',
  paymentArrangementHistorySchema
);