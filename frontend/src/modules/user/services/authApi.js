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

  if (result?.tokens) {
    setTokens('customer', result.tokens);
    setUser('customer', result.user);
  }

  return {
    success: true,
    token: result?.tokens?.accessToken,
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

  if (result?.tokens) {
    setTokens('customer', result.tokens);
    setUser('customer', result.user);
  }

  return {
    success: true,
    token: result?.tokens?.accessToken,
    user: result?.user,
    isNewUser: result?.isNewUser,
  };
};

export const logoutCustomer = async () => {
  const refreshToken = localStorage.getItem('customer_refresh_token');
  try {
    await customerApi.post('/auth/logout', { refreshToken });
  } catch {
    // proceed with local logout
  }
};
