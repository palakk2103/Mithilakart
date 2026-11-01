import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Horizontal scroller that works on touch AND desktop/tablet:
 * - native swipe on touch
 * - prev/next arrow buttons (shown only when there is overflow, md+ screens)
 * - click-and-drag with a mouse
 * - optional `center` to centre items only when they all fit (never clips the left edge)
 */
const ScrollRow = ({ children, className = '', center = false, style }) => {
  const ref = useRef(null);
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return undefined;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    Array.from(el.children).forEach((c) => ro?.observe(c));
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update, children]);

  const scrollByDir = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.75, 200), behavior: 'smooth' });
  };

  const onMouseDown = (e) => {
    if (e.button !== 0 || !ref.current) return;
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: ref.current.scrollLeft };
  };
  const onMouseMove = (e) => {
    const d = drag.current;
    if (!d.down || !ref.current) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) ref.current.scrollLeft = d.startLeft - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
  };
  // Swallow the click that ends a drag so cards don't get selected accidentally
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const arrow =
    'hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/95 border border-[#EADCC9] text-[#3E5A44] shadow-md hover:bg-[#3E5A44] hover:text-white transition-colors cursor-pointer active:scale-95';

  return (
    <div className="relative">
      {canLeft && (
        <button type="button" aria-label="Scroll left" onClick={() => scrollByDir(-1)} className={`${arrow} left-0.5`}>
          <ChevronLeft size={18} />
        </button>
      )}
      <div
        ref={ref}
        onScroll={update}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        style={{ WebkitOverflowScrolling: 'touch', ...style }}
        className={`overflow-x-auto no-scrollbar md:cursor-grab md:active:cursor-grabbing ${
          center ? '[&>*:first-child]:ml-auto [&>*:last-child]:mr-auto' : ''
        } ${className}`}
      >
        {children}
      </div>
      {canRight && (
        <button type="button" aria-label="Scroll right" onClick={() => scrollByDir(1)} className={`${arrow} right-0.5`}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};

export default ScrollRow;
