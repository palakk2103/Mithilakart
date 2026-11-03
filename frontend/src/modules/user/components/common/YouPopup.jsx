import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Bottom sheet shown above the mobile bottom nav when "You" is tapped.
 * Items/labels/order come from the admin-managed config (see config/youPopup.js).
 * `anchorRef` is the "You" nav button so taps on it are handled by its own
 * toggle handler rather than being treated as an outside click.
 */
const YouPopup = ({ items, onClose, anchorRef, bottom = 56 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef(null);
  const openedAt = useRef(location.pathname + location.search);

  useEffect(() => {
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, anchorRef]);

  // Close on any route change (including browser back/forward).
  useEffect(() => {
    if (location.pathname + location.search !== openedAt.current) onClose();
  }, [location.pathname, location.search, onClose]);

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="You menu"
      data-testid="you-popup"
      className="md:hidden fixed left-0 right-0 z-40 bg-[#FFF8EE] border-t border-[#EADCC9] rounded-t-2xl px-3 pt-3 pb-3 shadow-[0_-6px_20px_rgba(63,42,32,0.14)]"
      style={{ bottom }}
    >
      {items.length === 0 ? (
        <p className="text-center text-[12px] font-semibold text-[#3F2A20]/60 py-2">Nothing to show right now</p>
      ) : (
        <div className="flex gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-testid={`you-popup-item-${item.id}`}
              onClick={() => { navigate(item.route); onClose(); }}
              className="flex-1 min-w-0 min-h-[44px] px-2 py-2.5 rounded-xl border border-[#EADCC9] bg-white text-[12.5px] font-bold text-[#3F2A20] truncate active:scale-95 transition-transform"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouPopup;
