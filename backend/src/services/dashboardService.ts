import { Person, AccountStatus } from '../models/Person';
import { Transaction } from '../models/Transaction';
import { toNum } from '../utils/clearanceCalculator';

export const getDashboardStatsService = async () => {
  // Start and end of current day (local server time)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Account Metrics Aggregation
  const accountStats = await Person.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBalance: { $sum: '$currentBalance' },
      },
    },
  ]);

  let totalPeople = 0;
  let activePeople = 0;
  let completedPeople = 0;
  let totalOutstandingMoney = 0;

  accountStats.forEach((stat) => {
    totalPeople += stat.count;
    if (stat._id === AccountStatus.ACTIVE) {
      activePeople = stat.count;
      totalOutstandingMoney = toNum(stat.totalBalance);
    } else if (stat._id === AccountStatus.COMPLETED) {
      completedPeople = stat.count;
    }
  });

  // 2. Collection Metrics Aggregation
  const todayCollection = await Transaction.aggregate([
    {
      $match: {
        paymentDate: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    {
      $group: {
        _id: null,
        totalCollectedToday: { $sum: '$amount' },
        peoplePaidToday: { $addToSet: '$personId' },
      },
    },
  ]);

  const allTimeCollection = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        totalCollectedAllTime: { $sum: '$amount' },
      },
    },
  ]);

  const collectedToday = todayCollection.length > 0 ? toNum(todayCollection[0].totalCollectedToday) : 0;
  const uniquePeoplePaidTodayCount = todayCollection.length > 0 ? todayCollection[0].peoplePaidToday.length : 0;
  const collectedAllTime = allTimeCollection.length > 0 ? toNum(allTimeCollection[0].totalCollectedAllTime) : 0;

  // 3. Pending Payments Today
  const pendingPaymentsToday = Math.max(0, activePeople - uniquePeoplePaidTodayCount);

  // 4. Recent Transactions Feed
  const recentTransactionsRaw = await Transaction.find()
    .populate('personId', 'fullName phoneNumber')
    .sort({ paymentDate: -1 })
    .limit(5);

  const recentTransactions = recentTransactionsRaw.map((t) => ({
    id: t._id,
    personName: (t.personId as any)?.fullName || 'Unknown',
    phoneNumber: (t.personId as any)?.phoneNumber || '',
    amount: toNum(t.amount),
    paymentMethod: t.paymentMethod,
    paymentDate: t.paymentDate,
  }));

  return {
    summary: {
      totalPeople,
      activePeople,
      completedPeople,
      totalOutstandingMoney,
      collectedToday,
      collectedAllTime,
      peoplePaidToday: uniquePeoplePaidTodayCount,
      pendingPaymentsToday,
    },
    recentTransactions,
  };
};