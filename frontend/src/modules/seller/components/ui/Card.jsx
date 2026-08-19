/**
 * Card Component
 * Elevated card container with optional header, body, footer.
 */
import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  padding = true,
  hover = false,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        bg-[var(--seller-card,#fff)] rounded-xl border border-[var(--seller-border-light,#F3F4F6)]
        shadow-2xs
        ${hover ? 'hover:shadow-xs hover:border-[var(--seller-border,#E5E7EB)] transition-all duration-200' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Card Header */}
      {(title || headerAction) && (
        <div className={`flex items-center justify-between gap-3 ${padding ? 'px-4.5 pt-4 pb-0' : 'px-3.5 pt-3 pb-0'}`}>
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm sm:text-[14.5px] font-bold text-[var(--seller-text,#111827)] truncate">{title}</h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[var(--seller-subtext,#6B7280)] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className={padding ? 'p-4 sm:p-4.5' : ''}>{children}</div>

      {/* Card Footer */}
      {footer && (
        <div className={`border-t border-[var(--seller-border-light,#F3F4F6)] ${padding ? 'px-4.5 py-3' : 'px-3.5 py-2.5'}`}>
          {footer}
        </div>
      )}
    </motion.div>
  );
};

export default Card;
