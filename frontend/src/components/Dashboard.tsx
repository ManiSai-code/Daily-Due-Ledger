import React, { useEffect, useState, useCallback } from 'react';
import { 
  PlusCircle, 
  UserPlus, 
  IndianRupee, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  AlertCircle,
  Target,
  AlertTriangle,
  CalendarCheck,
} from 'lucide-react';
import { getDashboardMetrics } from '../api/apiServices';
import type { DashboardMetrics } from '../types';
import { QuickPaymentModal } from './QuickPaymentModal';
import { CollectionReports } from './CollectionReports';

interface DashboardProps {
  onNavigateToPeople: () => void;
  onNavigateToCreatePerson: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToPeople,
  onNavigateToCreatePerson,
}) => {
  const isAdmin = JSON.parse(localStorage.getItem('daily_due_user') || '{}').role === 'ADMIN';
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState<boolean>(false);

  // Wrapped in useCallback so it maintains a stable reference for effects & callbacks
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || 'Failed to load executive dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const data = await getDashboardMetrics();
        if (!ignore) {
          setMetrics(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          setError(message || 'Failed to load executive dashboard metrics.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <span>{error || 'Dashboard failed to load.'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Executive Collections Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time daily dues ledger & borrower status</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isAdmin && (
          <button
            onClick={() => setIsQuickPaymentOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-xs transition flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          )}
          {isAdmin && (
          <button
            onClick={onNavigateToCreatePerson}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-xs transition flex items-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Borrower</span>
          </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      {/* Metric Cards Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total Outstanding */}
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
        <IndianRupee className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-2">
      ₹{(metrics?.totalOutstandingDebt ?? 0).toLocaleString('en-IN')}
    </div>
  </div>

  {/* Collected Today */}
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Today</span>
      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
        <TrendingUp className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-2">
      ₹{(metrics?.totalCollectedToday ?? 0).toLocaleString('en-IN')}
    </div>
  </div>

  {/* Total Collected Overall */}
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Overall</span>
      <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
        <IndianRupee className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-2">
      ₹{(metrics.totalCollectedOverall ?? 0).toLocaleString('en-IN')}
    </div>
    <p className="text-xs text-slate-500 mt-1">All recorded payments</p>
  </div>

  {/* Active Borrowers */}
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Borrowers</span>
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        <Users className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-2">
      {metrics?.activeAccountsCount ?? 0}
    </div>
  </div>

  {/* Cleared Accounts */}
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cleared Accounts</span>
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <CheckCircle2 className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-2">
      {metrics?.completedAccountsCount ?? 0}
    </div>
  </div>
</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Today</span>
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{metrics.expectedCollectionToday.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on active daily amounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Rate</span>
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.collectionPercentage.toLocaleString('en-IN')}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ₹{metrics.actualCollectionToday.toLocaleString('en-IN')} collected today
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed Payments</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.missedPayments}</div>
          <p className="text-xs text-slate-500 mt-1">
            ₹{metrics.overdueAmount.toLocaleString('en-IN')} expected but unpaid on{' '}
            {new Date(`${metrics.missedPaymentDate}T00:00:00`).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Best Collection Day</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {metrics.bestCollectionDay
              ? new Date(`${metrics.bestCollectionDay.date}T00:00:00`).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'No payment history yet'}
          </p>
        </div>
        <p className="text-lg font-bold text-emerald-600">
          {metrics.bestCollectionDay
            ? `₹${metrics.bestCollectionDay.amount.toLocaleString('en-IN')}`
            : '₹0'}
        </p>
      </div>

      <CollectionReports />

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">Today's Payment Ledger Activity</h2>
          </div>
          <button
            onClick={onNavigateToPeople}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Borrowers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {metrics.recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No payments collected today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Borrower</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {metrics.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-900">{tx.personName}</td>
                    <td className="p-4 font-bold text-emerald-600">+₹{tx.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(tx.paymentDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Record Payment Modal */}
      {isAdmin && (
        <QuickPaymentModal
          isOpen={isQuickPaymentOpen}
          onClose={() => setIsQuickPaymentOpen(false)}
          onPaymentRecorded={fetchDashboardData}
        />
      )}
    </div>
  );
};