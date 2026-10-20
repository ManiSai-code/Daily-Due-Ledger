import React, { useState } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { updateDailyAmount } from '../api/apiServices';
import type { Person } from '../types';

interface AdjustDailyModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjusted: () => void;
}

export const AdjustDailyModal: React.FC<AdjustDailyModalProps> = ({
  person,
  isOpen,
  onClose,
  onAdjusted,
}) => {
  const [newDailyAmount, setNewDailyAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !person) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const daily = parseFloat(newDailyAmount);
    if (isNaN(daily) || daily <= 0) {
      setError('New daily target must be greater than 0.');
      return;
    }

    if (daily === person.currentDailyAmount) {
      setError('New daily amount is identical to the current target.');
      return;
    }

    try {
      setSubmitting(true);
      await updateDailyAmount(person.id, daily, reason.trim() || undefined);
      setNewDailyAmount('');
      setReason('');
      onAdjusted();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || 'Failed to update daily amount.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">Adjust Daily Target</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Current Daily Target:</span>
              <span className="font-bold text-slate-900">₹{person.currentDailyAmount}/day</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Balance:</span>
              <span className="font-bold text-slate-900">₹{person.currentBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Daily Target (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 700"
              value={newDailyAmount}
              onChange={(e) => setNewDailyAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Change
            </label>
            <input
              type="text"
              placeholder="e.g. Borrower requested faster repayment terms"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Updating...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};