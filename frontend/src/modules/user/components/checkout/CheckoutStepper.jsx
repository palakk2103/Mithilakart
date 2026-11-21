import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Saved Addresses', 'Summary', 'Payment'];

/**
 * Saved Addresses → Summary → Payment progress: finished steps show a green
 * tick, the current step is filled in the tab colour and its label too.
 */
const CheckoutStepper = ({ current = 2, accentHex = '#F5A400' }) => (
  <ol className="flex items-start px-4 pt-2 pb-1" aria-label="Checkout progress">
    {STEPS.map((label, i) => {
      const step = i + 1;
      const done = step < current;
      const active = step === current;
      return (
        <li key={label} className="flex-1 flex flex-col items-center relative">
          {i > 0 && (
            <span
              className="absolute top-[13px] right-1/2 w-full h-[2px]"
              style={{ background: step <= current ? (done || active ? accentHex : '#E2E8F0') : '#E2E8F0' }}
              aria-hidden
            />
          )}
          <span
            className="relative z-10 w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-bold border-2 bg-white"
            style={done
              ? { background: '#16A34A', borderColor: '#16A34A', color: '#fff' }
              : active
                ? { background: accentHex, borderColor: accentHex, color: '#fff' }
                : { borderColor: '#CBD5E1', color: '#64748B' }}
            aria-current={active ? 'step' : undefined}
          >
            {done ? <Check size={14} strokeWidth={3} /> : step}
          </span>
          <span
            className={`mt-0.5 text-[11px] font-semibold text-center leading-tight ${active ? '' : done ? 'text-slate-700' : 'text-slate-600'}`}
            style={active ? { color: accentHex } : undefined}
          >
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);

export default CheckoutStepper;
