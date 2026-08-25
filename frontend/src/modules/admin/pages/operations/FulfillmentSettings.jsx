import React, { useEffect, useState } from 'react';
import { fulfillmentApi } from '../../services/api';
import { Save, CheckCircle2, AlertCircle, ChevronRight, Sliders, Timer, MapPin, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CR-002 — admin UI for the fulfillment ranking/config API.
 *
 * The backend (AdminFulfillmentService, GET/PUT /admin/fulfillment/settings)
 * has validated, DB-backed seller AND delivery-partner ranking weights since
 * CR-002 — this page is the missing frontend consumer. All values are read
 * from and written through that one endpoint; this page computes nothing
 * except renormalising weight sliders for display.
 */

const FACTOR_LABELS = {
  // Seller ranking factors
  distance: 'Seller distance',
  routeEta: 'Route ETA',
  preparation: 'Preparation time',
  workload: 'Seller workload',
  availability: 'Stock availability',
  adminBoost: 'Admin boost',
  // Delivery-partner ranking factors
  pickupDistance: 'Pickup distance',
  locationFreshness: 'Location freshness',
};

const factorLabel = (key) => FACTOR_LABELS[key] || key;

function normalize(weights) {
  const entries = Object.entries(weights || {});
  const total = entries.reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
  if (total <= 0) return weights;
  return Object.fromEntries(entries.map(([k, v]) => [k, (Number(v) || 0) / total]));
}

const WeightSliders = ({ title, hint, factors, weights, onChange }) => {
  const normalized = normalize(weights);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</p>
        {hint && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">
        {factors.map((factor) => {
          const value = Number(weights?.[factor]) || 0;
          return (
            <div key={factor} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">{factorLabel(factor)}</span>
                <span className="text-[11px] font-black text-blue-600">
                  {Math.round((normalized?.[factor] || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onChange(factor, e.target.value)}
                className="w-full accent-blue-600"
              />
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
        Percentages shown are normalised to sum to 100% — weight 0 disables a factor entirely.
      </p>
    </div>
  );
};

const NumberField = ({ label, value, onChange, suffix = '', range }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
      {label}
      {range && <span className="normal-case font-medium text-slate-300"> ({range.min}–{range.max})</span>}
    </label>
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl py-4 px-6">
      <input
        type="number"
        min={range?.min}
        max={range?.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-bold outline-none"
      />
      {suffix && <span className="text-xs font-black text-slate-400">{suffix}</span>}
    </div>
  </div>
);

const Toggle = ({ checked, onChange, label, hint }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div>
      <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{label}</p>
      {hint && <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full relative transition-all ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'right-1' : 'left-1'}`} />
    </button>
  </div>
);

export default function FulfillmentSettings() {
  const [activeSection, setActiveSection] = useState('Ranking');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ ranges: {}, rankingFactors: [], partnerRankingFactors: [], deliveryAssignmentModes: [] });
  const [form, setForm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: apiError } = await fulfillmentApi.getSettings();
      if (cancelled) return;
      if (apiError) {
        setError(apiError);
      } else {
        setError(null);
        setMeta({
          ranges: data.ranges || {},
          rankingFactors: data.rankingFactors || [],
          partnerRankingFactors: data.partnerRankingFactors || [],
          deliveryAssignmentModes: data.deliveryAssignmentModes || [],
        });
        setForm(data.settings || {});
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateRankingWeight = (factor, value) =>
    setForm((prev) => ({
      ...prev,
      rankingWeights: { ...prev.rankingWeights, [factor]: Number(value) },
    }));

  const updatePartnerRankingWeight = (factor, value) =>
    setForm((prev) => ({
      ...prev,
      partnerRankingWeights: { ...prev.partnerRankingWeights, [factor]: Number(value) },
    }));

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);

    const payload = {
      sellerRankingWeights: form.rankingWeights,
      partnerRankingWeights: form.partnerRankingWeights,
      deliveryAssignmentMode: form.deliveryAssignmentMode,
      quickFulfillmentSearchTimeoutSeconds: Number(form.searchTimeoutSeconds),
      sellerAcceptanceTimeoutSeconds: Number(form.sellerAcceptanceTimeoutSeconds),
      deliveryPartnerAssignmentTimeoutSeconds: Number(form.deliveryPartnerAssignmentTimeoutSeconds),
      sellerSearchRadiusKm: Number(form.sellerSearchRadiusKm),
      defaultPreparationTimeMinutes: Number(form.defaultPreparationTimeMinutes),
      deliveryBufferMinutes: Number(form.deliveryBufferMinutes),
      maxSellerAttemptsPerOrder: Number(form.maxSellerAttempts),
      warehouseFallbackEnabled: Boolean(form.warehouseFallbackEnabled),
      courierFallbackEnabled: Boolean(form.courierFallbackEnabled),
      routingProviderEnabled: Boolean(form.routingProviderEnabled),
      routingFallbackSpeedKmph: Number(form.routingFallbackSpeedKmph),
      crossSellerSubstitutionEnabled: Boolean(form.crossSellerSubstitutionEnabled),
    };

    const { data, error: apiError } = await fulfillmentApi.updateSettings(payload);
    setSaving(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data?.settings) setForm(data.settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: 'Ranking', icon: Sliders, label: 'Seller & Partner Ranking' },
    { id: 'Timing', icon: Timer, label: 'Timeouts & Radius' },
    { id: 'Fallback', icon: Route, label: 'Fallback Ladder' },
    { id: 'Routing', icon: MapPin, label: 'Routing & ETA' },
  ];

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm font-bold">
        {error ? error : 'Loading fulfillment settings…'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight uppercase">Fulfillment Settings</h1>
          <p className="text-slate-500 font-medium mt-1">
            Seller selection weighs price, distance, ETA and reliability — configure the balance here, no deploy required.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white shadow-blue-100 hover:scale-105'}`}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Settings Updated!' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-72 flex-shrink-0 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-widest transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-white text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-100'
              }`}
            >
              <section.icon size={18} />
              {section.label}
              {activeSection === section.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-10"
            >
              {activeSection === 'Ranking' && (
                <>
                  <WeightSliders
                    title="Seller ranking weights"
                    hint="How the fulfillment engine scores eligible sellers — a seller is only ranked once they can fulfil the complete cart."
                    factors={meta.rankingFactors}
                    weights={form.rankingWeights}
                    onChange={updateRankingWeight}
                  />
                  <div className="border-t border-slate-100 pt-8">
                    <WeightSliders
                      title="Delivery-partner ranking weights"
                      hint="Used only when Assignment Mode below is set to Ranked — Broadcast mode ignores these."
                      factors={meta.partnerRankingFactors}
                      weights={form.partnerRankingWeights}
                      onChange={updatePartnerRankingWeight}
                    />
                  </div>
                  <div className="border-t border-slate-100 pt-8">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                      Delivery assignment mode
                    </label>
                    <div className="flex gap-3">
                      {meta.deliveryAssignmentModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => update('deliveryAssignmentMode', mode)}
                          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                            form.deliveryAssignmentMode === mode
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'Timing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NumberField
                    label="Quick fulfillment search timeout"
                    value={form.searchTimeoutSeconds}
                    onChange={(v) => update('searchTimeoutSeconds', v)}
                    suffix="sec"
                    range={meta.ranges.quickFulfillmentSearchTimeoutSeconds}
                  />
                  <NumberField
                    label="Seller acceptance timeout"
                    value={form.sellerAcceptanceTimeoutSeconds}
                    onChange={(v) => update('sellerAcceptanceTimeoutSeconds', v)}
                    suffix="sec"
                    range={meta.ranges.sellerAcceptanceTimeoutSeconds}
                  />
                  <NumberField
                    label="Delivery partner assignment timeout"
                    value={form.deliveryPartnerAssignmentTimeoutSeconds}
                    onChange={(v) => update('deliveryPartnerAssignmentTimeoutSeconds', v)}
                    suffix="sec"
                    range={meta.ranges.deliveryPartnerAssignmentTimeoutSeconds}
                  />
                  <NumberField
                    label="Seller search radius"
                    value={form.sellerSearchRadiusKm}
                    onChange={(v) => update('sellerSearchRadiusKm', v)}
                    suffix="km"
                    range={meta.ranges.sellerSearchRadiusKm}
                  />
                  <NumberField
                    label="Default preparation time"
                    value={form.defaultPreparationTimeMinutes}
                    onChange={(v) => update('defaultPreparationTimeMinutes', v)}
                    suffix="min"
                    range={meta.ranges.defaultPreparationTimeMinutes}
                  />
                  <NumberField
                    label="Delivery buffer"
                    value={form.deliveryBufferMinutes}
                    onChange={(v) => update('deliveryBufferMinutes', v)}
                    suffix="min"
                    range={meta.ranges.deliveryBufferMinutes}
                  />
                </div>
              )}

              {activeSection === 'Fallback' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                    <AlertCircle size={20} className="text-amber-500 mt-1 flex-shrink-0" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Fallback ladder: nearest eligible seller(s) → Warehouse (if enabled) → Courier (if enabled). A seller
                      is only eligible if they can fulfil the complete cart — no partial or split orders.
                    </p>
                  </div>
                  <Toggle
                    label="Warehouse fallback"
                    hint="Allow the central warehouse to fulfil an order when no seller can"
                    checked={form.warehouseFallbackEnabled}
                    onChange={(v) => update('warehouseFallbackEnabled', v)}
                  />
                  <Toggle
                    label="Courier fallback"
                    hint="Downgrade to standard courier delivery when seller and warehouse both fail"
                    checked={form.courierFallbackEnabled}
                    onChange={(v) => update('courierFallbackEnabled', v)}
                  />
                  <Toggle
                    label="Cross-seller substitution"
                    hint="Allow splitting eligibility checks across multiple sellers for the same cart"
                    checked={form.crossSellerSubstitutionEnabled}
                    onChange={(v) => update('crossSellerSubstitutionEnabled', v)}
                  />
                  <NumberField
                    label="Max seller attempts per order"
                    value={form.maxSellerAttempts}
                    onChange={(v) => update('maxSellerAttempts', v)}
                    range={meta.ranges.maxSellerAttemptsPerOrder}
                  />
                </div>
              )}

              {activeSection === 'Routing' && (
                <div className="space-y-6">
                  <Toggle
                    label="Live routing provider"
                    hint="Use the configured maps/routing API for ETA instead of straight-line distance"
                    checked={form.routingProviderEnabled}
                    onChange={(v) => update('routingProviderEnabled', v)}
                  />
                  <NumberField
                    label="Fallback speed (used when routing provider is off or unavailable)"
                    value={form.routingFallbackSpeedKmph}
                    onChange={(v) => update('routingFallbackSpeedKmph', v)}
                    suffix="km/h"
                    range={meta.ranges.routingFallbackSpeedKmph}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
