/**
 * Seller Auth Context
 * Manages seller authentication state with backend API.
 * When backend is ready, replace loginSeller/logoutSeller with real API calls.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginSeller as apiLogin, logoutSeller as apiLogout } from '../services/sellerApi';

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('seller_token');
    const savedSeller = localStorage.getItem('seller_data');
    if (token && savedSeller) {
      try {
        setSeller(JSON.parse(savedSeller));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_data');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      const response = await apiLogin({ email, password });
      const { token, seller: sellerData } = response;

      localStorage.setItem('seller_token', token);
      localStorage.setItem('seller_data', JSON.stringify(sellerData));

      setSeller(sellerData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Proceed with local logout even if API fails
    }
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_data');
    setSeller(null);
    setIsAuthenticated(false);
  }, []);

  const updateSellerData = useCallback((data) => {
    const updated = { ...seller, ...data };
    setSeller(updated);
    localStorage.setItem('seller_data', JSON.stringify(updated));
  }, [seller]);

  const value = {
    seller,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateSellerData,
  };

  return (
    <SellerAuthContext.Provider value={value}>
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider');
  }
  return context;
};

export default SellerAuthContext;
