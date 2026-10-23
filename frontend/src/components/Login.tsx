import React, { useState } from 'react';
import { login } from '../api/apiServices';
import type { AuthUser } from '../types';

interface LoginProps {
  onLoggedIn: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      onLoggedIn(user);
    } catch (requestError: unknown) {
      const message =
        requestError && typeof requestError === 'object' && 'response' in requestError
          ? (requestError as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || 'Unable to complete authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Due Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to continue
          </p>
        </div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" />
        </label>
        <button disabled={submitting} className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">
          {submitting ? 'Please wait...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
};
