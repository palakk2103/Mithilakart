import React, { useState } from 'react';
import { AlertTriangle, Home, RefreshCw, ChevronDown, ChevronUp, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';

const ErrorPage = ({ error, resetErrorBoundary }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow 
    ? 'bg-gradient-to-b from-[#e0f2f1]/40 via-[#f2faf9] to-[#ffffff]' 
    : isFreshGroceryFlow 
      ? 'bg-gradient-to-b from-[#FFF0A0]/20 via-[#FFFDF3] to-[#FFF]' 
      : isQuickShopFlow 
        ? 'bg-gradient-to-b from-[#fff5f7] via-[#fffcfc] to-[#fff]' 
        : 'bg-gradient-to-b from-[#eaf5ee]/50 via-[#f7faf8] to-[#ffffff]';

  const textPrimary = isMithilakFlow 
    ? 'text-[#207C8A]' 
    : isFreshGroceryFlow 
      ? 'text-[#7A3E17]' 
      : isQuickShopFlow 
        ? 'text-[#F26522]' 
        : 'text-[#6FAE4A]';

  const buttonBg = isMithilakFlow 
    ? 'bg-[#207C8A] hover:bg-[#1a6874]' 
    : isFreshGroceryFlow 
      ? 'bg-[#D9A21B] hover:bg-[#c49218] text-[#7A3E17]' 
      : isQuickShopFlow 
        ? 'bg-[#F26522] hover:bg-[#d9561b]' 
        : 'bg-[#6FAE4A] hover:bg-[#2d4332]';

  const borderPrimary = isMithilakFlow 
    ? 'border-[#207C8A] text-[#207C8A] hover:bg-[#207C8A]/5' 
    : isFreshGroceryFlow 
      ? 'border-[#D9A21B] text-[#7A3E17] hover:bg-[#D9A21B]/5' 
      : isQuickShopFlow 
        ? 'border-[#F26522] text-[#F26522] hover:bg-[#F26522]/5' 
        : 'border-[#6FAE4A] text-[#6FAE4A] hover:bg-[#6FAE4A]/5';

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-center relative overflow-hidden"
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex justify-center mb-6">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, -3, 3, 0]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="p-6 rounded-full bg-amber-50 border border-amber-100 text-amber-600 shadow-inner"
          >
            <AlertTriangle size={56} className="stroke-[1.75]" />
          </motion.div>
        </div>

        <h1 className="text-6xl font-black tracking-tighter text-slate-800 mb-1">500</h1>
        
        <h2 className={`text-xs font-black uppercase tracking-widest ${textPrimary} mb-3`}>
          Something Went Wrong
        </h2>
        
        <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6 max-w-xs mx-auto">
          We encountered an unexpected issue while loading this page. Don't worry, your data is safe!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
          <button
            onClick={handleRetry}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl ${buttonBg} text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md`}
          >
            <RefreshCw size={14} />
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/home'}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl border ${borderPrimary} font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm`}
          >
            <Home size={14} />
            Go Home
          </button>
        </div>

        {/* Technical Error Details Accordion */}
        {error && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-left">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <LifeBuoy size={13} /> Technical Details
              </span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-rose-300 overflow-x-auto max-h-36"
              >
                <p className="font-bold text-rose-400 mb-1">{error.name || 'Error'}: {error.message}</p>
                {error.stack && (
                  <pre className="text-[9px] text-slate-400 whitespace-pre-wrap leading-snug">
                    {error.stack.slice(0, 300)}...
                  </pre>
                )}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ErrorPage;
