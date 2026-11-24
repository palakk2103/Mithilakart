import { useEffect, useState } from 'react';
import { Flower2, UserRound, IndianRupee, LayoutTemplate, AlertTriangle, ExternalLink, RotateCcw, Eraser, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import usePurohitStore, { PUROHIT_STORAGE_ERROR_EVENT } from '../../../features/purohit/usePurohitStore';
import { usePurohitCatalog } from '../../../features/purohit/selectors';
import RitualsPanel from './purohit/RitualsPanel';
import PanditsPanel from './purohit/PanditsPanel';
import ServicesPanel from './purohit/ServicesPanel';
import HomepagePanel from './purohit/HomepagePanel';
import BookingsPanel from './purohit/BookingsPanel';
import usePujaBookingStore from '../../../features/purohit/usePujaBookingStore';

const TABS = [
  { id: 'home', label: 'Homepage Section', icon: LayoutTemplate },
  { id: 'rituals', label: 'Rituals', icon: Flower2 },
  { id: 'pandits', label: 'Pandits', icon: UserRound },
  { id: 'services', label: 'Pandit Cards', icon: IndianRupee },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
];

/**
 * Admin: Purohit & Ritual Services (Mithilak tab).
 * FRONTEND ONLY — all data lives in this browser's localStorage until a backend exists.
 */
const PurohitServicesManager = () => {
  const [tab, setTab] = useState('home');
  const { rituals, pandits, services } = usePurohitCatalog();
  const removeSampleData = usePurohitStore((st) => st.removeSampleData);
  const resetToStarter = usePurohitStore((st) => st.resetToStarter);
  const hasSamples = pandits.some((p) => p.isSample);

  useEffect(() => {
    const onErr = () => toast.error('Browser storage is full — changes could not be saved. Use smaller images or image URLs.', { id: 'purohit-quota' });
    window.addEventListener(PUROHIT_STORAGE_ERROR_EVENT, onErr);
    return () => window.removeEventListener(PUROHIT_STORAGE_ERROR_EVENT, onErr);
  }, []);

  const bookingCount = usePujaBookingStore((st) => st.bookings.length);
  const counts = { rituals: rituals.length, pandits: pandits.length, services: services.length, bookings: bookingCount };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 min-w-0 [contain:inline-size]" data-testid="purohit-manager">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purohit &amp; Ritual Services Management</h1>
          <p className="text-sm text-slate-500 mt-1">Rituals, pandit profiles, pricing and the Mithilak homepage section.</p>
        </div>
        <a href="/mithilak" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50">
          <ExternalLink size={14} /> Open Mithilak tab
        </a>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Saved in this browser only (not on the server yet)</p>
          <p>Changes apply instantly to the Mithilak tab in this browser and survive a refresh, but other devices and customers won&apos;t see them until backend integration is done.</p>
          <div className="flex flex-wrap gap-2 mt-2">
              {hasSamples && (
                <button
                  type="button"
                  onClick={() => { if (window.confirm('Remove all sample pandit profiles and their listings? Rituals are kept.')) { removeSampleData(); toast.success('Sample pandits removed'); } }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-bold hover:bg-amber-100 cursor-pointer"
                >
                  <Eraser size={12} /> Remove sample pandits
                </button>
              )}
              <button
                type="button"
                onClick={() => { if (window.confirm('Reset everything to the starter data? All your rituals, pandits and prices here will be replaced.')) { resetToStarter(); toast.success('Reset to starter data'); } }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-bold hover:bg-amber-100 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset to starter data
              </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-200" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            data-testid={`purohit-tab-${id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 -mb-px border-b-2 text-sm font-bold whitespace-nowrap cursor-pointer transition-colors ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Icon size={15} /> {label}
            {counts[id] !== undefined && <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{counts[id]}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'home' && <HomepagePanel />}
        {tab === 'rituals' && <RitualsPanel />}
        {tab === 'pandits' && <PanditsPanel />}
        {tab === 'services' && <ServicesPanel />}
        {tab === 'bookings' && <BookingsPanel />}
      </div>
    </div>
  );
};

export default PurohitServicesManager;
