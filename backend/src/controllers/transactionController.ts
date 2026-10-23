import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { Person, AccountStatus } from '../models/Person';
import { PaymentMethod, Transaction } from '../models/Transaction';
import { calculateClearanceProjection, toNum } from '../utils/clearanceCalculator';
import { getPersonPaymentHistoryService } from '../services/transactionService';

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  const { personId, amount, paymentMethod, notes, paymentDate } = req.body as {
    personId?: string;
    amount?: number | string;
    paymentMethod?: PaymentMethod;
    notes?: string;
    paymentDate?: string;
  };

  if (!personId || amount === undefined) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: personId and amount are required.',
    });
    return;
  }

  if (!Types.ObjectId.isValid(personId)) {
    res.status(400).json({ success: false, error: 'Invalid personId.' });
    return;
  }

  const paymentAmount = Number(amount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    res.status(400).json({ success: false, error: 'Payment amount must be greater than 0.' });
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const person = await Person.findById(personId).session(session);
    if (!person) {
      throw new Error('Person profile not found.');
    }

    const previousBalance = toNum(person.currentBalance);
    if (paymentAmount > previousBalance) {
      throw new Error(
        `Payment amount (₹${paymentAmount}) exceeds remaining balance (₹${previousBalance}). Overpayments are rejected.`
      );
    }

    const newBalance = Number((previousBalance - paymentAmount).toFixed(2));
    const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
    const transaction = new Transaction({
      receiptNumber,
      personId: person._id,
      amount: paymentAmount,
      previousBalance: Types.Decimal128.fromString(previousBalance.toFixed(2)),
      newBalance: Types.Decimal128.fromString(newBalance.toFixed(2)),
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      notes,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    });

    person.currentBalance = Types.Decimal128.fromString(newBalance.toFixed(2));
    if (newBalance === 0) {
      person.status = AccountStatus.COMPLETED;
    }

    await person.save({ session });
    await transaction.save({ session });
    await session.commitTransaction();

    const projection = calculateClearanceProjection(
      person.currentBalance,
      person.currentDailyAmount
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: {
        transaction,
        receiptNumber,
        updatedPerson: {
          id: person._id,
          fullName: person.fullName,
          currentBalance: newBalance,
          status: person.status,
          remainingDays: projection.remainingDays,
          estimatedClearanceDate: projection.estimatedClearanceDate,
        },
      },
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'Failed to record payment.';
    res.status(message === 'Person profile not found.' ? 404 : 400).json({
      success: false,
      error: message,
    });
  } finally {
    await session.endSession();
  }
};

export const getPersonTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const personId = Array.isArray(req.params.personId)
      ? req.params.personId[0]
      : req.params.personId;

    if (!personId) {
      res.status(400).json({
        success: false,
        error: 'personId parameter is required.',
      });
      return;
    }

    const history = await getPersonPaymentHistoryService(personId);
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load transactions.';
    res.status(500).json({ success: false, error: message });
  }
};
