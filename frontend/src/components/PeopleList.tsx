import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import { getAllPeople } from '../api/apiServices';
import type { Person } from '../types';

interface PeopleListProps {
  onOpenCreateModal: () => void;
  onSelectPerson: (personId: string) => void;
}

export const PeopleList: React.FC<PeopleListProps> = ({
  onOpenCreateModal,
  onSelectPerson,
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Wrap fetchPeople with useCallback so its reference remains stable
  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllPeople(searchTerm, statusFilter);
      setPeople(res);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || 'Failed to fetch accounts list.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPeople();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchPeople]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Borrower Accounts Directory</h1>
          <p className="text-sm text-slate-500">Manage balances, daily payment targets, and projection timelines</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-xs transition flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Borrower</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Accounts</option>
          <option value="COMPLETED">Cleared Accounts</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-600 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : people.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No borrower profiles found matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Borrower Details</th>
                  <th className="p-4">Current Balance</th>
                  <th className="p-4">Daily Target</th>
                  <th className="p-4">Remaining Days</th>
                  <th className="p-4">Est. Clearance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {people.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{person.fullName}</div>
                      <div className="text-xs text-slate-500">{person.phoneNumber}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      ₹{person.currentBalance.toLocaleString('en-IN')}
                      <span className="block text-xs font-normal text-slate-400">
                        of ₹{person.originalAmount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-4 text-indigo-600 font-semibold">
                      ₹{person.currentDailyAmount.toLocaleString('en-IN')}/day
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        {person.remainingDays} {person.remainingDays === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {person.estimatedClearanceDate ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{person.estimatedClearanceDate}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium">Settled</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          person.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : person.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {person.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onSelectPerson(person.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-xs transition cursor-pointer"
                      >
                        Manage Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};