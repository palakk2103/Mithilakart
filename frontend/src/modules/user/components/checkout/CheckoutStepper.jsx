import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Saved Addresses', 'Summary', 'Payment'];

/**
 * Cart → Address → Summary → Payment progress, as in every standard checkout:
 * finished steps show a tick, the current step is highlighted.
 */
const CheckoutStepper = ({ current = 2, accentHex = '#F5A400' }) => (
  <ol className="flex items-start px-5 pt-3 pb-2" aria-label="Checkout progress">
    {STEPS.map((label, i) => {
      const step = i + 1;
      const done = step < current;
      const active = step === current;
      return (
        <li key={label} className="flex-1 flex flex-col items-center relative">
          {i > 0 && (
            <span
              className="absolute top-[14px] right-1/2 w-full h-[2px]"
              style={{ background: step <= current ? accentHex : '#E2E8F0' }}
              aria-hidden
            />
          )}
          <span
            className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 bg-white"
            style={done
              ? { background: '#16A34A', borderColor: '#16A34A', color: '#fff' }
              : active
                ? { background: accentHex, borderColor: accentHex, color: '#fff' }
                : { borderColor: '#CBD5E1', color: '#94A3B8' }}
            aria-current={active ? 'step' : undefined}
          >
            {done ? <Check size={15} strokeWidth={3} /> : step}
          </span>
          <span className={`mt-1 text-[11.5px] font-semibold text-center leading-tight ${active ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}`}>
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);

export default CheckoutStepper;
