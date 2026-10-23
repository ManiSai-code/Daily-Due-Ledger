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

const getDateRange = (from?: string, to?: string): { start: Date; end: Date } => {
  const end = to ? new Date(`${to}T23:59:59.999`) : new Date();
  const start = from
    ? new Date(`${from}T00:00:00.000`)
    : new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid report date range.');
  }

  return { start, end };
};

export const getCollectionReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, end } = getDateRange(
      typeof req.query.from === 'string' ? req.query.from : undefined,
      typeof req.query.to === 'string' ? req.query.to : undefined
    );
    const [people, transactions] = await Promise.all([
      Person.find().lean(),
      Transaction.find({ paymentDate: { $gte: start, $lte: end } })
        .sort({ paymentDate: -1 })
        .lean(),
    ]);
    const peopleById = new Map(people.map((person) => [String(person._id), person]));
    const activePeople = people.filter((person) => person.status === AccountStatus.ACTIVE);
    const daysInRange = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
    );
    const collected = transactions.reduce(
      (total, transaction) => total + asNumber(transaction.amount),
      0
    );
    const paymentMethods = new Map<string, number>();
    const borrowerTotals = new Map<string, number>();

    transactions.forEach((transaction) => {
      const method = transaction.paymentMethod || 'OTHER';
      paymentMethods.set(method, (paymentMethods.get(method) || 0) + asNumber(transaction.amount));
      const personId = String(transaction.personId);
      borrowerTotals.set(personId, (borrowerTotals.get(personId) || 0) + asNumber(transaction.amount));
    });

    const rangeDates = Array.from({ length: daysInRange }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
    const paymentDatesByPerson = new Map<string, Set<string>>();
    transactions.forEach((transaction) => {
      const personId = String(transaction.personId);
      const dates = paymentDatesByPerson.get(personId) || new Set<string>();
      dates.add(new Date(transaction.paymentDate).toISOString().slice(0, 10));
      paymentDatesByPerson.set(personId, dates);
    });
    const missedBorrowers = activePeople
      .map((person) => {
        const personStartDate = new Date(person.startDate).toISOString().slice(0, 10);
        const eligibleDates = rangeDates.filter((date) => date >= personStartDate);
        const paidDates = paymentDatesByPerson.get(String(person._id)) || new Set<string>();
        const missedDates = eligibleDates.filter((date) => !paidDates.has(date));

        return {
        id: String(person._id),
        name: person.fullName,
        missedDates,
        expectedAmount: Number(
          (asNumber(person.currentDailyAmount) * missedDates.length).toFixed(2)
        ),
        };
      })
      .filter((person) => person.missedDates.length > 0);

    const topBorrowers = [...borrowerTotals.entries()]
      .sort(([, first], [, second]) => second - first)
      .slice(0, 10)
      .map(([personId, amount]) => ({
        id: personId,
        name: peopleById.get(personId)?.fullName || 'Unknown',
        amount: Number(amount.toFixed(2)),
      }));

    const totalOutstanding = activePeople.reduce(
      (total, person) => total + Math.max(0, getBalance(person as Record<string, unknown>)),
      0
    );
    const expectedCollection = activePeople.reduce(
      (total, person) => total + asNumber(person.currentDailyAmount) * daysInRange,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        totalCollected: Number(collected.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        paymentCount: transactions.length,
        expectedCollection: Number(expectedCollection.toFixed(2)),
        missedPayments: missedBorrowers.length,
        missedBorrowers,
        topBorrowers,
        paymentMethodBreakdown: [...paymentMethods.entries()].map(([method, amount]) => ({
          method,
          amount: Number(amount.toFixed(2)),
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate collection report.';
    res.status(400).json({ success: false, error: message });
  }
};

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
    const [people, allTransactions] = await Promise.all([
      Person.find().lean(),
      Transaction.find().sort({ paymentDate: -1 }).lean(),
    ]);
    const transactions = allTransactions.slice(0, 5);

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

    const todayTransactions = allTransactions.filter(
      (transaction) =>
        transaction.paymentDate >= startOfToday &&
        transaction.paymentDate <= endOfToday
    );
    const totalCollectedToday = todayTransactions.reduce(
      (total, transaction) => total + asNumber(transaction.amount),
      0
    );
    const peoplePaidToday = new Set(
      todayTransactions.map((transaction) => String(transaction.personId))
    );
    const missedPeople = activePeople.filter(
      (person) => !peoplePaidToday.has(String(person._id))
    );
    const expectedCollectionToday = activePeople.reduce(
      (total, person) => total + asNumber(person.currentDailyAmount),
      0
    );
    const collectionPercentage =
      expectedCollectionToday > 0
        ? Number(((totalCollectedToday / expectedCollectionToday) * 100).toFixed(2))
        : 0;

    const collectionsByDay = new Map<string, number>();
    allTransactions.forEach((transaction) => {
      const date = new Date(transaction.paymentDate).toISOString().slice(0, 10);
      collectionsByDay.set(
        date,
        (collectionsByDay.get(date) || 0) + asNumber(transaction.amount)
      );
    });
    const bestCollectionDay = [...collectionsByDay.entries()].sort(
      ([, firstAmount], [, secondAmount]) => secondAmount - firstAmount
    )[0];

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
      expectedCollectionToday,
      actualCollectionToday: totalCollectedToday,
      collectionPercentage,
      missedPayments: missedPeople.length,
      overdueAmount: missedPeople.reduce(
        (total, person) => total + asNumber(person.currentDailyAmount),
        0
      ),
      missedPaymentDate: startOfToday.toISOString().slice(0, 10),
      bestCollectionDay: bestCollectionDay
        ? {
            date: bestCollectionDay[0],
            amount: Number(bestCollectionDay[1].toFixed(2)),
          }
        : null,
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
