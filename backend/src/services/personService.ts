
import { Person, IPerson, AccountStatus } from '../models/Person';
import { calculateClearanceProjection, toNum } from '../utils/clearanceCalculator';
import mongoose from 'mongoose';
import { PaymentArrangementHistory } from '../models/PaymentArrangementHistory';
import { Transaction } from '../models/Transaction';
export interface CreatePersonInput {
  fullName: string;
  phoneNumber: string;
  address?: string;
  originalAmount: number;
  currentDailyAmount: number;
  startDate?: Date;
  notes?: string;
}

export const createPersonService = async (input: CreatePersonInput) => {
  // Check if phone number already exists
  const existingPerson = await Person.findOne({ phoneNumber: input.phoneNumber });
  if (existingPerson) {
    throw new Error('A person with this phone number already exists.');
  }

  // Initial current balance equals the original amount owed
  const newPerson = new Person({
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    address: input.address,
    originalAmount: input.originalAmount,
    currentBalance: input.originalAmount,
    currentDailyAmount: input.currentDailyAmount,
    startDate: input.startDate || new Date(),
    notes: input.notes,
    status: AccountStatus.ACTIVE,
  });

  return await newPerson.save();
};

export const getAllPeopleService = async (
  search?: string,
  status?: string,
  assignedPersonIds?: string[]
) => {
  const query: any = {};

  if (status) {
    query.status = status;
  }
  if (assignedPersonIds) {
    query._id = { $in: assignedPersonIds };
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const people = await Person.find(query).sort({ createdAt: -1 });

  return people.map((person) => {
    const projection = calculateClearanceProjection(
      person.currentBalance,
      person.currentDailyAmount
    );

    return {
      id: person._id,
      fullName: person.fullName,
      phoneNumber: person.phoneNumber,
      address: person.address,
      originalAmount: toNum(person.originalAmount),
      currentBalance: toNum(person.currentBalance),
      currentDailyAmount: toNum(person.currentDailyAmount),
      status: person.status,
      startDate: person.startDate,
      remainingDays: projection.remainingDays,
      estimatedClearanceDate: projection.estimatedClearanceDate,
      createdAt: person.createdAt,
    };
  });
};

export const getPersonByIdService = async (id: string) => {
  const person = await Person.findById(id);
  if (!person) {
    throw new Error('Person profile not found.');
  }

  const projection = calculateClearanceProjection(
    person.currentBalance,
    person.currentDailyAmount
  );

  return {
    id: person._id,
    fullName: person.fullName,
    phoneNumber: person.phoneNumber,
    address: person.address,
    originalAmount: toNum(person.originalAmount),
    currentBalance: toNum(person.currentBalance),
    currentDailyAmount: toNum(person.currentDailyAmount),
    status: person.status,
    startDate: person.startDate,
    notes: person.notes,
    remainingDays: projection.remainingDays,
    estimatedClearanceDate: projection.estimatedClearanceDate,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
};
export const updateDailyAmountService = async (
  personId: string,
  newDailyAmount: number,
  reason?: string
) => {
  if (newDailyAmount <= 0) {
    throw new Error('Daily payment amount must be greater than 0.');
  }

  const person = await Person.findById(personId);
  if (!person) {
    throw new Error('Person profile not found.');
  }

  const previousDailyAmount = toNum(person.currentDailyAmount);

  if (previousDailyAmount === newDailyAmount) {
    throw new Error('New daily amount is identical to the current amount.');
  }

  // Audit record
  const historyRecord = new PaymentArrangementHistory({
    personId: person._id,
    previousDailyAmount,
    newDailyAmount,
    reason,
  });

  person.currentDailyAmount = mongoose.Types.Decimal128.fromString(newDailyAmount.toFixed(2));

  await historyRecord.save();
  await person.save();

  const projection = calculateClearanceProjection(
    person.currentBalance,
    person.currentDailyAmount
  );

  return {
    personId: person._id,
    fullName: person.fullName,
    previousDailyAmount,
    newDailyAmount,
    currentBalance: toNum(person.currentBalance),
    remainingDays: projection.remainingDays,
    estimatedClearanceDate: projection.estimatedClearanceDate,
  };
};

export const getDailyAmountHistoryService = async (personId: string) => {
  const history = await PaymentArrangementHistory.find({ personId }).sort({ changedAt: -1 });

  return history.map((item) => ({
    id: item._id,
    previousDailyAmount: toNum(item.previousDailyAmount),
    newDailyAmount: toNum(item.newDailyAmount),
    reason: item.reason,
    changedAt: item.changedAt,
  }));
};
export const deletePerson = async (id: string): Promise<boolean> => {
  const person = await Person.findById(id);
  if (!person) {
    throw new Error('Person record not found.');
  }

  // Delete all associated transactions and audit history entries
  await Promise.all([
    Transaction.deleteMany({ personId: id }),
    PaymentArrangementHistory.deleteMany({ personId: id }),
    Person.findByIdAndDelete(id),
  ]);

  return true;
};