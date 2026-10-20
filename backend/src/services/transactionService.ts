import mongoose from 'mongoose';
import { Person, AccountStatus } from '../models/Person';
import { Transaction, PaymentMethod } from '../models/Transaction';
import { toNum, calculateClearanceProjection } from '../utils/clearanceCalculator';

export interface RecordPaymentInput {
  personId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  paymentDate?: Date;
}

export const recordPaymentService = async (input: RecordPaymentInput) => {
  const { personId, amount, paymentMethod, notes, paymentDate } = input;

  // 1. Validate payment amount bounds
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  // 2. Fetch target person record
  const person = await Person.findById(personId);
  if (!person) {
    throw new Error('Person profile not found.');
  }

  const currentBalance = toNum(person.currentBalance);

  // 3. Enforce Overpayment Rejection Policy
  if (amount > currentBalance) {
    throw new Error(
      `Payment amount (₹${amount}) exceeds remaining balance (₹${currentBalance}). Overpayments are rejected.`
    );
  }

  // 4. Calculate new balance
  const previousBalance = currentBalance;
  const newBalance = previousBalance - amount;

  // 5. Use Mongoose session transaction for ACID safety
  // 5. Use Mongoose session transaction for ACID safety
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Instantiate a single transaction document
    const transaction = new Transaction({
      personId: person._id,
      amount,
      previousBalance,
      newBalance,
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      notes,
      paymentDate: paymentDate || new Date(),
    });

    // Update person balance & status
    person.currentBalance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
    if (newBalance === 0) {
      person.status = AccountStatus.COMPLETED;
    }

    // Save both documents within the session context
    await person.save({ session });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    const projection = calculateClearanceProjection(
      person.currentBalance,
      person.currentDailyAmount
    );

    return {
      transaction,
      updatedPerson: {
        id: person._id,
        fullName: person.fullName,
        currentBalance: toNum(person.currentBalance),
        status: person.status,
        remainingDays: projection.remainingDays,
        estimatedClearanceDate: projection.estimatedClearanceDate,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getPersonPaymentHistoryService = async (personId: string) => {
  const transactions = await Transaction.find({ personId }).sort({ paymentDate: -1 });

  return transactions.map((t) => ({
    id: t._id,
    amount: toNum(t.amount),
    previousBalance: toNum(t.previousBalance),
    newBalance: toNum(t.newBalance),
    paymentMethod: t.paymentMethod,
    notes: t.notes,
    paymentDate: t.paymentDate,
    createdAt: t.createdAt,
  }));
};