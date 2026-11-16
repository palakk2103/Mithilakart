import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LOGIN_REQUIRED_EVENT } from '../utils/loginRequired';

/** Sends a logged-out shopper to /login (and back afterwards) when something needs an account. */

const LoginRequiredBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onLoginRequired = (event) => {
      if (location.pathname.startsWith('/login') || location.pathname.startsWith('/signup')) return;
      toast(event?.detail?.message || 'Please log in to continue', { id: 'login-required' });
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
    };
    window.addEventListener(LOGIN_REQUIRED_EVENT, onLoginRequired);
    return () => window.removeEventListener(LOGIN_REQUIRED_EVENT, onLoginRequired);
  }, [navigate, location.pathname, location.search]);

  return null;
};

export default LoginRequiredBridge;
