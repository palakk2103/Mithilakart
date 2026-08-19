/**
 * PageHeader Component
 * Reusable page title with subtitle and action buttons.
 */
import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle, children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-black text-[var(--seller-text,#111827)] tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[var(--seller-subtext,#6B7280)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </motion.div>
  );
};

export default PageHeader;
