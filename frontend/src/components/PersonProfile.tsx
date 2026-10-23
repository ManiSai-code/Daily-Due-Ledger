import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { generatePersonReportPDF } from '../utils/reportGenerator';
import { 
  ArrowLeft, 
  PlusCircle, 
  RefreshCw, 
  History, 
  MapPin, 
  Phone, 
  FileText,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { getPersonById, getPersonTransactions } from '../api/apiServices';
import type { Person, Transaction } from '../types';
import { RecordPaymentModal } from './RecordPaymentModal';
import { AdjustDailyModal } from './AdjustDailyModal';
import { DeletePersonModal } from './DeletePersonModal';

interface PersonProfileProps {
  personId: string;
  onBack: () => void;
  onDataChanged: () => void;
}

export const PersonProfile: React.FC<PersonProfileProps> = ({
  personId,
  onBack,
  onDataChanged,
}) => {
  const isAdmin = JSON.parse(localStorage.getItem('daily_due_user') || '{}').role === 'ADMIN';
  const [person, setPerson] = useState<Person | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      try {
        const [personRes, txRes] = await Promise.all([
          getPersonById(personId),
          getPersonTransactions(personId),
        ]);
        if (!ignore) {
          setPerson(personRes);
          setTransactions(txRes);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          setError(message || 'Failed to load borrower profile.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [personId]);

  const handleActionCompleted = () => {
    setLoading(true);
    Promise.all([getPersonById(personId), getPersonTransactions(personId)])
      .then(([personRes, txRes]) => {
        setPerson(personRes);
        setTransactions(txRes);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        onDataChanged();
      });
  };

  const handleDeleted = () => {
    onDataChanged();
    onBack();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error || 'Borrower profile not found.'}</span>
        </div>
        <button onClick={onBack} className="px-3 py-1 bg-red-600 text-white rounded text-sm cursor-pointer">
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        {isAdmin && <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>}

        <div className="flex gap-3">
          {isAdmin && <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3.5 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium text-sm flex items-center space-x-2 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Delete Profile</span>
          </button>}
          <button
  onClick={() => generatePersonReportPDF(person, transactions)}
  className="px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm flex items-center space-x-2 transition cursor-pointer"
>
  <Download className="w-4 h-4 text-indigo-600" />
  <span>Download Statement</span>
</button>
          {isAdmin && (
            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>Adjust Daily Target</span>
            </button>
          )}
          {isAdmin && person.status === 'ACTIVE' && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm flex items-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{person.fullName}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  person.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : person.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {person.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <div className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{person.phoneNumber}</span>
              </div>
              {person.address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{person.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs uppercase font-semibold text-slate-400">Account Started</span>
            <p className="text-sm font-medium text-slate-700">
              {new Date(person.startDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium">Original Loan</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₹{person.originalAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-200/80">
            <span className="text-xs text-amber-700 font-medium">Outstanding Balance</span>
            <div className="text-xl font-bold text-amber-900 mt-1">
              ₹{person.currentBalance.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-lg border border-emerald-200/80">
            <span className="text-xs text-emerald-700 font-medium">Total Cleared</span>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              ₹{Math.max(0, person.originalAmount - person.currentBalance).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-lg border border-indigo-200/80">
            <span className="text-xs text-indigo-700 font-medium">Daily Target</span>
            <div className="text-xl font-bold text-indigo-900 mt-1">
              ₹{person.currentDailyAmount.toLocaleString('en-IN')}/day
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-lg border border-emerald-200/80">
            <span className="text-xs text-emerald-700 font-medium">Clearance Projection</span>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {person.remainingDays} {person.remainingDays === 1 ? 'day' : 'days'}
            </div>
            <span className="text-xs text-emerald-600 block mt-0.5">
              Est: {person.estimatedClearanceDate || 'Cleared'}
            </span>
          </div>
        </div>

        {person.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{person.notes}</span>
          </div>
        )}
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">Payment Ledger History</h2>
          </div>
          <span className="text-xs text-slate-400">{transactions.length} total entries</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No repayments recorded for this account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Payment Date</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Prev Balance</th>
                  <th className="p-4">New Balance</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-xs font-medium text-slate-900">
                      {new Date(tx.paymentDate).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      +₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-slate-500">₹{tx.previousBalance.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-semibold text-slate-900">₹{tx.newBalance.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{tx.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment, Adjustment & Delete Modals */}
      <RecordPaymentModal
        person={person}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentRecorded={handleActionCompleted}
      />

      {isAdmin && (
        <AdjustDailyModal
          person={person}
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          onAdjusted={handleActionCompleted}
        />
      )}

      <DeletePersonModal
        person={person}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleDeleted}
      />
    </div>
  );
};