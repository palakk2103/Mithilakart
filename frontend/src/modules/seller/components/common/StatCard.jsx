/**
 * StatCard Component
 * Animated statistics card with icon, value, trend indicator.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-600',
  trend,
  trendValue,
  delay = 0,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.2 }}
      className={`
        bg-[var(--seller-card,#fff)] rounded-xl border border-[var(--seller-border-light,#F3F4F6)]
        p-4 shadow-2xs hover:shadow-xs transition-all duration-200 group select-none
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${iconBg} group-hover:scale-105 transition-transform duration-200`}>
          {Icon && <Icon size={18} className={iconColor} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
            trend === 'up' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' : 'text-rose-700 bg-rose-50 border border-rose-200/60'
          }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <p className="text-[10.5px] font-bold text-[var(--seller-subtext,#6B7280)] uppercase tracking-wider mb-0.5 truncate">
        {title}
      </p>
      <h3 className="text-xl sm:text-2xl font-black text-[var(--seller-text,#111827)] tracking-tight">
        {value}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-[var(--seller-subtext,#6B7280)] mt-1 truncate">{subtitle}</p>
      )}
    </motion.div>
  );
};

export default StatCard;
