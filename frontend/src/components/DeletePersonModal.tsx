import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { deletePerson } from '../api/apiServices';
import type { Person } from '../types';

interface DeletePersonModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeletePersonModal: React.FC<DeletePersonModalProps> = ({
  person,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [confirmText, setConfirmText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !person) return null;

  const isConfirmed = confirmText === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    try {
      setSubmitting(true);
      setError(null);
      await deletePerson(person.id);
      setConfirmText('');
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || 'Failed to delete account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50">
          <div className="flex items-center space-x-2 text-rose-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="font-bold">Delete Account</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDelete} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete <strong className="text-slate-900">{person.fullName}</strong>? 
            This action cannot be undone and will purge all transaction history associated with this borrower.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Type <span className="text-rose-600 font-bold">DELETE</span> to confirm *
            </label>
            <input
              type="text"
              required
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
              disabled={!isConfirmed || submitting}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-xs flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{submitting ? 'Deleting...' : 'Permanently Delete'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};