import React, { useState, useRef, useLayoutEffect } from 'react';
import { Search } from 'lucide-react';

const SearchInput = React.forwardRef(({
  value,
  onChange,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  disabled = false,
  className = '',
  rightElement,
  style,
  ...props
}, ref) => {
  const rightElementRef = useRef(null);
  const [rightPadding, setRightPadding] = useState(rightElement ? 104 : 48);

  useLayoutEffect(() => {
    if (!rightElement) {
      setRightPadding(48);
      return;
    }
    const updatePadding = () => {
      if (rightElementRef.current) {
        const w = rightElementRef.current.offsetWidth;
        setRightPadding(w + 24);
      }
    };
    updatePadding();

    let ro;
    if (typeof ResizeObserver !== 'undefined' && rightElementRef.current) {
      ro = new ResizeObserver(updatePadding);
      ro.observe(rightElementRef.current);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [rightElement]);

  const isRoundedFull = className.includes('rounded-full');

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0"
      />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        style={{
          paddingRight: rightElement ? `${rightPadding}px` : undefined,
          ...style,
        }}
        className={`w-full h-[46px] md:h-[52px] pl-11 text-sm font-semibold bg-slate-50 border border-slate-200 ${
          isRoundedFull ? 'rounded-full' : 'rounded-xl'
        } outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400 hover:bg-slate-100/70 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed`}
        {...props}
      />
      {rightElement && (
        <div
          ref={rightElementRef}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 flex-shrink-0 pointer-events-auto"
        >
          {rightElement}
        </div>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;

