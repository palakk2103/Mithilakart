import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'mk_install_dismissed_at';
const DISMISS_DAYS = 7;
const HIDDEN_ON = /^\/(admin|seller|delivery|login|signup)/;

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
};

/**
 * INF-3 — in-app "Install app" card. Chrome fires `beforeinstallprompt` once
 * the manifest and service worker qualify; we keep the event and show our own
 * card (dismissible for 7 days) instead of relying on the browser's mini-bar.
 */
const InstallAppPrompt = () => {
  const { pathname } = useLocation();
  const [deferred, setDeferred] = useState(null);
  const [hidden, setHidden] = useState(recentlyDismissed);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred || hidden || HIDDEN_ON.test(pathname)) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setHidden(true);
  };

  const install = async () => {
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    setDeferred(null);
    if (choice?.outcome !== 'accepted') dismiss();
  };

  return (
    <div role="dialog" aria-label="Install Mithilakart app" className="fixed inset-x-3 bottom-[76px] md:bottom-6 md:left-auto md:right-6 md:w-[360px] z-[1500] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 flex items-center gap-3">
      <img src="/IMG_MGI_96.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-slate-900 leading-tight">Install the Mithilakart app</p>
        <p className="text-[12px] text-slate-500 leading-snug">Faster, works offline, one tap from your home screen.</p>
      </div>
      <button type="button" onClick={install} className="h-11 px-4 rounded-xl bg-[color:var(--mk-primary,#6FAE4A)] text-white text-[13px] font-bold flex items-center gap-1.5 shrink-0">
        <Download size={16} /> Install
      </button>
      <button type="button" onClick={dismiss} aria-label="Not now" className="w-11 h-11 -mr-1 flex items-center justify-center text-slate-400 shrink-0">
        <X size={18} />
      </button>
    </div>
  );
};

export default InstallAppPrompt;
