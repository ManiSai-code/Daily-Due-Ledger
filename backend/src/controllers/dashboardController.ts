import { Request, Response } from 'express';
import { Person, AccountStatus } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

interface DashboardTransaction {
  id: string;
  personName: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
}

const getDateRange = (from?: string, to?: string): { start: Date; end: Date } => {
  const today = indiaDateKey(new Date());
  const requestedEnd = to
    ? new Date(`${to}T23:59:59.999+05:30`)
    : new Date(`${today}T23:59:59.999+05:30`);
  const todayEnd = new Date(`${today}T23:59:59.999+05:30`);
  const end = requestedEnd > todayEnd ? todayEnd : requestedEnd;
  const start = from
    ? new Date(`${from}T00:00:00.000+05:30`)
    : new Date(`${today}T00:00:00.000+05:30`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid report date range.');
  }

  return { start, end };
};

const indiaDateKey = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
};

export const getCollectionReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = getDateRange(
      typeof req.query.from === 'string' ? req.query.from : undefined,
      typeof req.query.to === 'string' ? req.query.to : undefined
    );
    const [people, transactions] = await Promise.all([
      Person.find(
        req.user?.role === UserRole.READ_ONLY
          ? { _id: { $in: req.user.assignedPersonIds } }
          : {}
      ).lean(),
      Transaction.find({
        paymentDate: { $gte: start, $lte: end },
        ...(req.user?.role === UserRole.READ_ONLY
          ? { personId: { $in: req.user.assignedPersonIds } }
          : {}),
      })
        .sort({ paymentDate: -1 })
        .lean(),
    ]);
    const peopleById = new Map(people.map((person) => [String(person._id), person]));
    const activePeople = people.filter((person) => person.status === AccountStatus.ACTIVE);
    const daysInRange = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000)
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
      return indiaDateKey(new Date(start.getTime() + index * 86400000));
    });
    const paymentDatesByPerson = new Map<string, Set<string>>();
    transactions.forEach((transaction) => {
      const personId = String(transaction.personId);
      const dates = paymentDatesByPerson.get(personId) || new Set<string>();
      dates.add(indiaDateKey(new Date(transaction.paymentDate)));
      paymentDatesByPerson.set(personId, dates);
    });
    const missedBorrowers = activePeople
      .map((person) => {
        const personStartDate = indiaDateKey(new Date(person.startDate));
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
        from: indiaDateKey(start),
        to: indiaDateKey(end),
        totalCollected: Number(collected.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        paymentCount: transactions.length,
        expectedCollection: Number(expectedCollection.toFixed(2)),
        actualCollection: Number(collected.toFixed(2)),
        missedAmount: Number(Math.max(0, expectedCollection - collected).toFixed(2)),
        collectionPercentage:
          expectedCollection > 0
            ? Number(((collected / expectedCollection) * 100).toFixed(2))
            : 0,
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

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [people, allTransactions] = await Promise.all([
      Person.find(
        req.user?.role === UserRole.READ_ONLY
          ? { _id: { $in: req.user.assignedPersonIds } }
          : {}
      ).lean(),
      Transaction.find(
        req.user?.role === UserRole.READ_ONLY
          ? { personId: { $in: req.user.assignedPersonIds } }
          : {}
      ).sort({ paymentDate: -1 }).lean(),
    ]);
    const transactions = allTransactions.slice(0, 5);
    const totalCollectedOverall = allTransactions.reduce(
      (total, transaction) => total + asNumber(transaction.amount),
      0
    );

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

    const today = indiaDateKey(new Date());
    const startOfToday = new Date(`${today}T00:00:00.000+05:30`);
    const endOfToday = new Date(`${today}T23:59:59.999+05:30`);

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
      const date = indiaDateKey(new Date(transaction.paymentDate));
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
      totalCollectedOverall: Number(totalCollectedOverall.toFixed(2)),
      totalCollectedToday,
      expectedCollectionToday,
      actualCollectionToday: totalCollectedToday,
      collectionPercentage,
      missedPayments: missedPeople.length,
      overdueAmount: missedPeople.reduce(
        (total, person) => total + asNumber(person.currentDailyAmount),
        0
      ),
      missedPaymentDate: indiaDateKey(startOfToday),
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
        collectedAllTime: Number(totalCollectedOverall.toFixed(2)),
      },
    };

    res.status(200).json({ success: true, data: payload });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard statistics.';
    res.status(500).json({ success: false, error: message });
  }
};
