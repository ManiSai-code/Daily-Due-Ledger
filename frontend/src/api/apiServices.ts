import type { DashboardData, Person, Transaction, DashboardMetrics, CollectionReport, PaymentReceipt } from '../types';
import apiClient from './apiClient';

const responseNumber = (value: string | number | { $numberDecimal?: string }): number => {
  if (typeof value === 'object') {
    return Number(value.$numberDecimal || 0);
  }
  return Number(value);
};

export const getDashboardStats = async (): Promise<DashboardData> => {
  const response = await apiClient.get<{ success: boolean; data: DashboardData } | DashboardData>(
    '/dashboard'
  );
  return 'data' in response.data ? response.data.data : response.data;
};
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await apiClient.get<{ success: boolean; data: DashboardMetrics } | DashboardMetrics>(
    '/dashboard'
  );
  return 'data' in response.data ? response.data.data : response.data;
};

export const getCollectionReport = async (from: string, to: string): Promise<CollectionReport> => {
  const response = await apiClient.get<{ success: boolean; data: CollectionReport }>(
    '/dashboard/report',
    { params: { from, to } }
  );
  return response.data.data;
};

export const getAllPeople = async (search = '', status = ''): Promise<Person[]> => {
  const response = await apiClient.get<{ success: boolean; data: Person[] }>('/people', {
    params: { search, status },
  });
  return response.data.data;
};

export const getPersonById = async (id: string): Promise<Person> => {
  const response = await apiClient.get<{ success: boolean; data: Person }>(`/people/${id}`);
  return response.data.data;
};

export const createPerson = async (data: {
  fullName: string;
  phoneNumber: string;
  originalAmount: number;
  currentDailyAmount: number;
  address?: string;
  notes?: string;
}): Promise<Person> => {
  const response = await apiClient.post<{ success: boolean; data: Person }>('/people', data);
  return response.data.data;
};

export const recordPayment = async (data: {
  personId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}): Promise<PaymentReceipt> => {
  const response = await apiClient.post<{
    success: boolean;
    data: {
      receiptNumber: string;
      transaction: {
        amount: string | number | { $numberDecimal?: string };
        previousBalance: string | number | { $numberDecimal?: string };
        newBalance: string | number | { $numberDecimal?: string };
        paymentMethod: PaymentReceipt['paymentMethod'];
        notes?: string;
        paymentDate: string;
      };
      updatedPerson: { fullName: string; currentBalance: number };
    };
  }>('/transactions', data);
  const result = response.data.data;
  return {
    receiptNumber: result.receiptNumber,
    personName: result.updatedPerson.fullName,
    phoneNumber: '',
    amount: responseNumber(result.transaction.amount),
    previousBalance: responseNumber(result.transaction.previousBalance),
    newBalance: responseNumber(result.transaction.newBalance),
    paymentMethod: result.transaction.paymentMethod,
    notes: result.transaction.notes,
    paymentDate: result.transaction.paymentDate,
  };
};

export const updateDailyAmount = async (
  id: string,
  newDailyAmount: number,
  reason?: string
): Promise<unknown> => {
  const response = await apiClient.patch(`/people/${id}/daily-amount`, {
    newDailyAmount,
    reason,
  });
  return response.data;
};

export const getPersonTransactions = async (personId: string): Promise<Transaction[]> => {
  const response = await apiClient.get<{ success: boolean; data: Transaction[] }>(
    `/transactions/person/${personId}`
  );
  return response.data.data;
};

export const deletePerson = async (id: string): Promise<unknown> => {
  const response = await apiClient.delete(`/people/${id}`);
  return response.data;
};