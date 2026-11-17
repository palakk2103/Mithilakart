/**
 * The storefront has no guest shopping. Anything that finds the shopper logged
 * out calls requestLogin(); LoginRequiredBridge (mounted in App) then sends
 * them to /login and back to the same page afterwards.
 */
export const LOGIN_REQUIRED_EVENT = 'login-required';

export const requestLogin = (message) => {
  window.dispatchEvent(new CustomEvent(LOGIN_REQUIRED_EVENT, { detail: { message } }));
};
