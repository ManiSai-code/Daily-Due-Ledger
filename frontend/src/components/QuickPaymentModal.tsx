import React, { useEffect, useState } from 'react';
import { X, IndianRupee, AlertCircle, Search, UserCheck } from 'lucide-react';
import { getAllPeople, recordPayment } from '../api/apiServices';
import type { Person } from '../types';

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentRecorded,
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingPeople, setLoadingPeople] = useState<boolean>(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedPersonId('');
    setSearchTerm('');
    setAmount('');
    setNotes('');
    setError(null);
    setLoadingPeople(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    let ignore = false;

    if (!isOpen) {
      return;
    }

    const fetchActiveBorrowers = async () => {
      try {
        const res = await getAllPeople('', 'ACTIVE');
        if (!ignore) {
          setPeople(res);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Failed to load active borrowers.');
        }
      } finally {
        if (!ignore) {
          setLoadingPeople(false);
        }
      }
    };

    fetchActiveBorrowers();

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPerson = people.find((p) => p.id === selectedPersonId);
  const numAmount = parseFloat(amount);
  const isOverpaid =
    selectedPerson && !isNaN(numAmount) && numAmount > selectedPerson.currentBalance;

  const handlePersonSelect = (person: Person) => {
    setSelectedPersonId(person.id);
    setAmount(person.currentDailyAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPerson) {
      setError('Please select a borrower first.');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (isOverpaid) {
      setError(
        `Payment cannot exceed remaining balance (₹${selectedPerson.currentBalance.toLocaleString('en-IN')}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      await recordPayment({
        personId: selectedPerson.id,
        amount: numAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      resetForm();
      onPaymentRecorded();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPeople = people.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Quick Record Payment</h2>
            <p className="text-xs text-slate-500">
              Select borrower and collect daily installment
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Borrower Selector Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Borrower *
            </label>

            {/* Search Input for Dropdown */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filter borrower by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Borrower List Selection */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
              {loadingPeople ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Loading borrowers...
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active borrowers found.
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => handlePersonSelect(person)}
                    className={`w-full text-left p-2.5 flex justify-between items-center transition cursor-pointer text-xs ${
                      selectedPersonId === person.id
                        ? 'bg-indigo-50 border-l-4 border-indigo-600 font-semibold'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-slate-900 font-medium">
                        {person.fullName}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {person.phoneNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-indigo-600 font-semibold block">
                        ₹{person.currentDailyAmount}/day
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Bal: ₹{person.currentBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected Person Card Summary */}
          {selectedPerson && (
            <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200 flex justify-between items-center text-xs text-indigo-900">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>
                  Selected: <strong>{selectedPerson.fullName}</strong>
                </span>
              </div>
              <span className="font-bold">
                Bal: ₹{selectedPerson.currentBalance.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Amount & Method Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-hidden ${
                    isOverpaid
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {isOverpaid && (
                <p className="text-[11px] text-red-600 mt-1">
                  Exceeds remaining balance.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Receipt Ref
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #9021..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPerson || isOverpaid}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};