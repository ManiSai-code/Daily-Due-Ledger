import { Request, Response } from 'express';
import { Person, AccountStatus } from '../models/Person';
import { Transaction } from '../models/Transaction';

interface DashboardTransaction {
  id: string;
  personName: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
}

const asNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getBalance = (person: Record<string, unknown>): number => {
  const balance = person.currentBalance ?? person.dueAmount ?? person.netBalance;
  return asNumber(balance ?? person.originalAmount);
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [people, transactions] = await Promise.all([
      Person.find().lean(),
      Transaction.find().sort({ paymentDate: -1 }).limit(5).lean(),
    ]);

    const peopleById = new Map(
      people.map((person) => [String(person._id), person])
    );

    const activePeople = people.filter(
      (person) => person.status === AccountStatus.ACTIVE
    );
    const completedPeople = people.filter(
      (person) => person.status === AccountStatus.COMPLETED
    );
    const totalOutstandingDebt = activePeople.reduce(
      (total, person) => total + Math.max(0, getBalance(person as Record<string, unknown>)),
      0
    );

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const totalCollectedToday = transactions
      .filter(
        (transaction) =>
          transaction.paymentDate >= startOfToday &&
          transaction.paymentDate <= endOfToday
      )
      .reduce((total, transaction) => total + asNumber(transaction.amount), 0);

    const recentTransactions: DashboardTransaction[] = transactions.map((transaction) => {
      const person = peopleById.get(String(transaction.personId));

      return {
        id: String(transaction._id),
        personName: person?.fullName || 'Unknown',
        phoneNumber: person?.phoneNumber || '',
        amount: asNumber(transaction.amount),
        paymentMethod: transaction.paymentMethod,
        paymentDate: transaction.paymentDate,
      };
    });

    const payload = {
      totalOutstandingDebt,
      totalCollectedToday,
      activeAccountsCount: activePeople.length,
      completedAccountsCount: completedPeople.length,
      recentTransactions,
      summary: {
        totalPeople: people.length,
        activePeople: activePeople.length,
        completedPeople: completedPeople.length,
        totalOutstandingMoney: totalOutstandingDebt,
        collectedToday: totalCollectedToday,
      },
    };

    res.status(200).json({ success: true, data: payload });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard statistics.';
    res.status(500).json({ success: false, error: message });
  }
};
