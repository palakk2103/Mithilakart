import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const IST_OFFSET_MS = 330 * 60000;
const pad = (n) => String(n).padStart(2, '0');

/** Milliseconds until the next `HH:MM` in India, whatever the phone's time zone is. */
const msUntil = (hhmm) => {
  const [h, m] = String(hhmm || '06:00').split(':').map(Number);
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const target = new Date(ist);
  target.setUTCHours(h, m, 0, 0);
  if (target <= ist) target.setUTCDate(target.getUTCDate() + 1);
  return target - ist;
};

/** "We open in 05 : 12 : 40" countdown of the closed banner. */
const OpensInTimer = ({ opensAt }) => {
  const { t } = useTranslation();
  const [left, setLeft] = useState(() => msUntil(opensAt));

  useEffect(() => {
    setLeft(msUntil(opensAt));
    const id = setInterval(() => setLeft(msUntil(opensAt)), 1000);
    return () => clearInterval(id);
  }, [opensAt]);

  const s = Math.max(0, Math.floor(left / 1000));
  return (
    <div className="flex flex-col items-start">
      <div className="font-mono text-xl font-black text-white tracking-wide">
        {pad(Math.floor(s / 3600))} : {pad(Math.floor((s % 3600) / 60))} : {pad(s % 60)}
      </div>
      <div className="flex items-center gap-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
        <span>{t('auto.hours')}</span>
        <span>{t('auto.minutes')}</span>
        <span>{t('auto.seconds')}</span>
      </div>
    </div>
  );
};

export default OpensInTimer;
