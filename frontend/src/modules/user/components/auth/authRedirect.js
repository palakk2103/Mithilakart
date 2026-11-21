const DEFAULT_BY_FLOW = {
  quickshop: '/quick-shop',
  mithilak: '/mithilak',
  freshgrocery: '/fresh-grocery',
};

/**
 * After login / sign-up go back to where the customer came from (the product
 * they tried to add, checkout…), carrying the state that page needs.
 */
export function goAfterAuth(navigate, location, activeFlow, { replace = false } = {}) {
  const redirectTo = location.state?.from || DEFAULT_BY_FLOW[activeFlow] || '/home';
  const state = {};
  if (location.state?.product) state.product = location.state.product;
  if (location.state?.checkoutProduct) state.checkoutProduct = location.state.checkoutProduct;
  if (location.state?.pendingAction) state.pendingAction = location.state.pendingAction;
  navigate(redirectTo, { replace, state });
}
