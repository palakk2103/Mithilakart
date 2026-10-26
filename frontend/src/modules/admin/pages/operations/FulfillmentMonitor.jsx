import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Truck, AlertCircle, Copy } from 'lucide-react';
import { fulfillmentApi } from '../../services/api';

/**
 * CR-002 — admin fulfillment monitor.
 *
 * Exists so an operator can answer "why did this order go to courier?" from
 * the panel, without shell access to server logs. Shows the ordered candidate
 * list with each rank score and failure code, plus the trace id.
 *
 * All values are read from the backend; this page computes nothing.
 */

const STATES = [
  'searching', 'seller_assigned', 'seller_accepted',
  'warehouse_pending', 'warehouse_accepted',
  'courier_pending', 'courier_assigned',
  'fulfilled', 'failed', 'cancelled',
];

const STATE_TONE = {
  failed: 'bg-red-50 text-red-700 border-red-200',
  courier_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  courier_assigned: 'bg-slate-50 text-slate-700 border-slate-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
};

const DEFAULT_TONE = 'bg-blue-50 text-blue-700 border-blue-200';

export default function FulfillmentMonitor() {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await fulfillmentApi.list(
      stateFilter ? { state: stateFilter } : {}
    );
    setItems(data?.data || data?.items || []);
    setError(err);
    setLoading(false);
  }, [stateFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (orderId) => {
    const { data, error: err } = await fulfillmentApi.getDetail(orderId);
    if (err) { setError(err); return; }
    setDetail(data);
  };

  const act = async (fn, orderId) => {
    setBusy(true);
    const { error: err } = await fn(orderId);
    setError(err);
    setBusy(false);
    await load();
    if (detail) await openDetail(orderId);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fulfillment Monitor</h1>
          <p className="text-sm text-gray-500">Diagnose fulfillment without server logs</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All states</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Fallback</th>
              <th className="px-4 py-3">Failure</th>
              <th className="px-4 py-3">Trace</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.fulfillmentId} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {row.orderNumber || row.orderId}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-lg border px-2 py-1 text-xs font-bold ${STATE_TONE[row.state] || DEFAULT_TONE}`}>
                    {row.state}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.attemptCount}</td>
                <td className="px-4 py-3 text-gray-600">L{row.fallbackLevel}</td>
                <td className="px-4 py-3 text-xs text-red-600">{row.failureCode || '—'}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(row.traceId || '')}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-500"
                    title="Copy trace id"
                  >
                    <Copy size={11} />
                    {(row.traceId || '').slice(0, 8)}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openDetail(row.orderId)}
                    className="text-xs font-bold text-blue-600"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}

            {!items.length && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No fulfillment records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="rounded-xl border border-gray-100 p-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-base font-bold text-gray-900">
              {detail.fulfillment.orderNumber || detail.fulfillment.orderId}
              <span className="ml-2 font-mono text-[11px] text-gray-400">
                {detail.fulfillment.traceId}
              </span>
            </h2>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => act(fulfillmentApi.retry, detail.fulfillment.orderId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
              >
                <RefreshCw size={12} /> Retry
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => act(fulfillmentApi.forceCourier, detail.fulfillment.orderId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50"
              >
                <Truck size={12} /> Force courier
              </button>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500"
              >
                Close
              </button>
            </div>
          </div>

          {/* The ordered candidate list — this is the "why" for an operator. */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
              Attempts
            </h3>
            <div className="space-y-2">
              {detail.attempts.map((a) => (
                <div key={a.attemptNumber} className="rounded-lg border border-gray-100 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="font-bold text-gray-800">
                      #{a.attemptNumber} · {a.kind} · {a.status}
                    </span>
                    {a.rankScore != null && (
                      <span className="text-gray-500">score {a.rankScore.toFixed?.(3) ?? a.rankScore}</span>
                    )}
                  </div>
                  {a.sellerId && <div className="text-gray-500 mt-0.5">seller {a.sellerId}</div>}
                  {a.failureCode && (
                    <div className="mt-1 flex items-center gap-1 text-red-600 font-semibold">
                      <AlertCircle size={11} />
                      {a.failureCode}
                      {a.failureDetail ? ` — ${a.failureDetail}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {detail.deliveryAssignment && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Delivery assignment
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-[11px] text-gray-700">
                {JSON.stringify(detail.deliveryAssignment, null, 2)}
              </pre>
            </div>
          )}

          {detail.configSnapshot && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Config snapshot (frozen at fulfillment)
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-[11px] text-gray-700">
                {JSON.stringify(detail.configSnapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
