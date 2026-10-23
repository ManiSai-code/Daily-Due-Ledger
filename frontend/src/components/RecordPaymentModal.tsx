import React, { useState } from 'react';
import { X, IndianRupee, AlertCircle } from 'lucide-react';
import { recordPayment } from '../api/apiServices';
import type { PaymentReceipt, Person } from '../types';
import { generatePaymentReceiptPDF, sharePaymentReceiptWhatsApp } from '../utils/reportGenerator';

interface RecordPaymentModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  person,
  isOpen,
  onClose,
  onPaymentRecorded,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const handleClose = () => {
    const paymentWasRecorded = receipt !== null;
    setReceipt(null);
    onClose();
    if (paymentWasRecorded) {
      onPaymentRecorded();
    }
  };

  if (!isOpen || !person) return null;

  if (receipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Payment Recorded</h2>
              <p className="text-sm text-emerald-600">Receipt {receipt.receiptNumber}</p>
            </div>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-2">
            <p className="flex justify-between"><span>Amount paid</span><strong>₹{receipt.amount.toLocaleString('en-IN')}</strong></p>
            <p className="flex justify-between"><span>Remaining balance</span><strong>₹{receipt.newBalance.toLocaleString('en-IN')}</strong></p>
            <p className="flex justify-between"><span>Method</span><strong>{receipt.paymentMethod}</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => generatePaymentReceiptPDF(receipt)} className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">Download PDF</button>
            <button onClick={() => sharePaymentReceiptWhatsApp(receipt)} className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">Share WhatsApp</button>
          </div>
          <button onClick={handleClose} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">Done</button>
        </div>
      </div>
    );
  }

  const numAmount = parseFloat(amount);
  const isOverpaid = !isNaN(numAmount) && numAmount > person.currentBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (isOverpaid) {
      setError(`Payment cannot exceed remaining balance (₹${person.currentBalance.toLocaleString('en-IN')}).`);
      return;
    }

    try {
      setSubmitting(true);
      const paymentReceipt = await recordPayment({
        personId: person.id,
        amount: numAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      setAmount('');
      setNotes('');
      setReceipt({ ...paymentReceipt, phoneNumber: person.phoneNumber });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800">Record Repayment</h2>
            <p className="text-xs text-slate-500">{person.fullName} ({person.phoneNumber})</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</span>
            <span className="font-bold text-slate-900 text-lg">
              ₹{person.currentBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Amount (₹) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(person.currentDailyAmount.toString())}
                className="text-xs text-indigo-600 hover:underline cursor-pointer"
              >
                Set Daily Target (₹{person.currentDailyAmount})
              </button>
            </div>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder={`Suggested: ₹${person.currentDailyAmount}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-hidden ${
                  isOverpaid
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/50'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>
            {isOverpaid && (
              <p className="text-xs text-red-600 mt-1">
                Overpayment rejected. Maximum accepted: ₹{person.currentBalance.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="CASH">Cash Payment</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Receipt Ref
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #402910..."
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
              disabled={submitting || isOverpaid}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};