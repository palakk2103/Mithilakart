/**
 * Frontend Centralized Dispatch SLA & Shipment Delay Configuration
 * 
 * BACKEND-READY DESIGN:
 * These rules provide default SLA thresholds when the backend does not supply explicit
 * `dispatchDeadline` or `dispatchStatus` fields on order objects.
 * When the backend API is updated later to return backend SLA calculations, the utility
 * layer will seamlessly utilize the backend fields without breaking or rewriting UI components.
 */

export const DISPATCH_DELAY_CONFIG = {
  // Global toggle for frontend dispatch delay feature
  enabled: true,

  // Default SLA thresholds by order fulfillment flow (in hours)
  defaultSlaHours: {
    standard: 24,       // Standard e-commerce / Mithilakart
    courier: 24,        // Courier shipping
    mithilak: 24,       // Mithilak regional items
    quick_shop: 0.5,    // Quick commerce (30 minutes)
    groceries_fresh: 0.5// Fresh groceries (30 minutes)
  },

  // Minutes before SLA deadline to trigger warning status
  warningThresholdMinutes: {
    standard: 120,      // 2 hours warning before deadline
    quick_shop: 10      // 10 minutes warning before deadline
  },

  // Minutes after SLA deadline to classify as escalated
  escalationThresholdMinutes: 1440, // 24 hours past deadline

  // Optional development simulation config for easy testing
  devDemo: {
    enabled: false,           // Set to true to override dispatch state globally for UI testing
    simulatedStatus: null     // 'normal' | 'warning' | 'delayed' | 'escalated'
  }
};

export default DISPATCH_DELAY_CONFIG;
