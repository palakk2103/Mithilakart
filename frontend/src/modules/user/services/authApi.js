import customerApi from '../../../shared/api/client';
import { setTokens, setUser } from '../../../shared/api/tokenStorage';

export const sendPhoneOtp = async (countryCode, phoneNumber) => {
  return customerApi.post('/auth/send-phone-otp', {
    countryCode,
    phone: phoneNumber,
  });
};

export const verifyPhoneOtp = async (countryCode, phoneNumber, otp, name) => {
  const result = await customerApi.post('/auth/verify-phone-otp', {
    countryCode,
    phone: phoneNumber,
    otp,
    ...(name ? { name } : {}),
  });

  const tokens = result?.tokens || (result?.accessToken ? result : null);
  if (tokens?.accessToken) {
    setTokens('customer', tokens);
    if (result?.user) setUser('customer', result.user);
  }

  return {
    success: Boolean(tokens?.accessToken),
    token: tokens?.accessToken,
    user: result?.user,
    isNewUser: result?.isNewUser,
  };
};

export const sendEmailOtp = async (email) => {
  return customerApi.post('/auth/send-email-otp', { email });
};

export const verifyEmailOtp = async (email, otp, name) => {
  const result = await customerApi.post('/auth/verify-email-otp', {
    email,
    otp,
    ...(name ? { name } : {}),
  });

  const tokens = result?.tokens || (result?.accessToken ? result : null);
  if (tokens?.accessToken) {
    setTokens('customer', tokens);
    if (result?.user) setUser('customer', result.user);
  }

  return {
    success: Boolean(tokens?.accessToken),
    token: tokens?.accessToken,
    user: result?.user,
    isNewUser: result?.isNewUser,
  };
};

const storeSession = (result) => {
  const tokens = result?.tokens;
  if (tokens?.accessToken) {
    setTokens('customer', tokens);
    if (result?.user) setUser('customer', result.user);
  }
  return { success: Boolean(tokens?.accessToken), user: result?.user, isNewUser: result?.isNewUser };
};

/* AUTH-1/2 — one account, two verified identities. */
export const registerStart = (data) => customerApi.post('/auth/register/start', data);
export const registerVerifyPhone = (registrationId, otp) => customerApi.post('/auth/register/verify-phone', { registrationId, otp });
export const registerVerifyEmail = async (registrationId, otp) => storeSession(
  await customerApi.post('/auth/register/verify-email', { registrationId, otp })
);
export const registerResend = (registrationId, channel) => customerApi.post('/auth/register/resend', { registrationId, channel });

/** AUTH-5 — sign out of every device. */
export const logoutAllDevices = () => customerApi.post('/auth/logout-all', {});

export const logoutCustomer = async () => {
  const refreshToken = localStorage.getItem('customer_refresh_token');
  try {
    await customerApi.post('/auth/logout', { refreshToken });
  } catch {
    // proceed with local logout
  }
};
