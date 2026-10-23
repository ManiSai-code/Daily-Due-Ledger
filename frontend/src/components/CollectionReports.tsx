import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { getCollectionReport } from '../api/apiServices';
import type { CollectionReport } from '../types';
import {
  generateCollectionReportCSV,
  generateCollectionReportPDF,
} from '../utils/reportGenerator';

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const getPresetRange = (preset: string): [string, string] => {
  const today = new Date();
  const end = formatDate(today);
  const start = new Date(today);

  if (preset === 'week') {
    start.setDate(today.getDate() - 6);
  } else if (preset === 'month') {
    start.setDate(1);
  }

  return [formatDate(start), end];
};

export const CollectionReports: React.FC = () => {
  const [preset, setPreset] = useState('today');
  const [[from, to], setRange] = useState<[string, string]>(() => getPresetRange('today'));
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await getCollectionReport(from, to));
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const updatePreset = (value: string) => {
    setPreset(value);
    if (value !== 'custom') {
      setRange(getPresetRange(value));
    }
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Collection Reports</h2>
          <p className="text-sm text-slate-500">Review collections, borrowers, and missed payments.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-500">
            Range
            <select
              value={preset}
              onChange={(event) => updatePreset(event.target.value)}
              className="block mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            From
            <input
              type="date"
              value={from}
              disabled={preset !== 'custom'}
              onChange={(event) => setRange([event.target.value, to])}
              className="block mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            To
            <input
              type="date"
              value={to}
              disabled={preset !== 'custom'}
              onChange={(event) => setRange([from, event.target.value])}
              className="block mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadReport()}
            className="p-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            aria-label="Refresh report"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading report...</p>}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              ['Collected', `₹${report.totalCollected.toLocaleString('en-IN')}`],
              ['Outstanding', `₹${report.totalOutstanding.toLocaleString('en-IN')}`],
              ['Payments', report.paymentCount],
              ['Expected', `₹${report.expectedCollection.toLocaleString('en-IN')}`],
              ['Missed', report.missedPayments],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-bold text-slate-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => generateCollectionReportPDF(report)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              <FileText className="w-4 h-4" /> Download PDF
            </button>
            <button
              type="button"
              onClick={() => generateCollectionReportCSV(report)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-sm">
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Top Borrowers</h3>
              {report.topBorrowers.length === 0 ? <p className="text-slate-400">No payments.</p> : report.topBorrowers.map((item) => (
                <div key={item.id} className="flex justify-between border-b border-slate-100 py-2">
                  <span>{item.name}</span><strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Payment Methods</h3>
              {report.paymentMethodBreakdown.map((item) => (
                <div key={item.method} className="flex justify-between border-b border-slate-100 py-2">
                  <span>{item.method}</span><strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Missed Borrowers</h3>
              {report.missedBorrowers.length === 0 ? <p className="text-emerald-600">None in this range.</p> : report.missedBorrowers.map((item) => (
                <div key={item.id} className="flex justify-between border-b border-slate-100 py-2">
                  <span>
                    {item.name}
                    <small className="block text-xs text-rose-500">{item.missedDates.join(', ')}</small>
                  </span>
                  <strong>₹{item.expectedAmount.toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
