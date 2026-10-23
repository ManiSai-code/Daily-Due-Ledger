// Account Status Object & Union Type
export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const UserRole = {
  ADMIN: 'ADMIN',
  READ_ONLY: 'READ_ONLY',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedPersonIds: string[];
}

// Payment Method Object & Union Type
export const PaymentMethod = {
  CASH: 'CASH',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// Interfaces
export interface Person {
  id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  originalAmount: number;
  currentBalance: number;
  currentDailyAmount: number;
  status: AccountStatus;
  startDate: string;
  notes?: string;
  remainingDays: number;
  estimatedClearanceDate: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate: string;
  createdAt: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  personName: string;
  phoneNumber: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate: string;
}

export interface DashboardSummary {
  totalPeople: number;
  activePeople: number;
  completedPeople: number;
  totalOutstandingMoney: number;
  collectedToday: number;
  collectedAllTime: number;
  peoplePaidToday: number;
  pendingPaymentsToday: number;
}

export interface RecentTransaction {
  id: string;
  personName: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentTransactions: RecentTransaction[];
}
export interface RecentTransaction {
  id: string;
  personName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface DashboardMetrics {
  totalOutstandingDebt: number;
  totalCollectedOverall: number;
  totalCollectedToday: number;
  expectedCollectionToday: number;
  actualCollectionToday: number;
  collectionPercentage: number;
  missedPayments: number;
  overdueAmount: number;
  missedPaymentDate: string;
  bestCollectionDay: {
    date: string;
    amount: number;
  } | null;
  activeAccountsCount: number;
  completedAccountsCount: number;
  recentTransactions: RecentTransaction[];
}

export interface CollectionReport {
  from: string;
  to: string;
  totalCollected: number;
  totalOutstanding: number;
  paymentCount: number;
  expectedCollection: number;
  actualCollection: number;
  missedAmount: number;
  collectionPercentage: number;
  missedPayments: number;
  missedBorrowers: Array<{
    id: string;
    name: string;
    missedDates: string[];
    expectedAmount: number;
  }>;
  topBorrowers: Array<{ id: string; name: string; amount: number }>;
  paymentMethodBreakdown: Array<{ method: string; amount: number }>;
}