import React from 'react';
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
  ...props
}, ref) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
        className="w-full h-[52px] pl-11 pr-12 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400 hover:bg-slate-100/70 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
        {...props}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
