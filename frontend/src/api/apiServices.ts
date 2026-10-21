import type { DashboardData, Person, Transaction, DashboardMetrics } from '../types';
import apiClient from './apiClient';

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
}): Promise<unknown> => {
  const response = await apiClient.post('/transactions', data);
  return response.data;
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