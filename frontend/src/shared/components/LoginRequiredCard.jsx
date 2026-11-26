import { LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useTabTheme from '../hooks/useTabTheme';

/**
 * Empty state for pages that only make sense for a logged-in customer
 * (orders, wishlist, addresses, cart…). Shows "Login to see your …" with a
 * Login button that returns the shopper to the same page afterwards.
 */
const LoginRequiredCard = ({ title = 'Login to continue', subtitle = 'Please log in to see this page.', icon: Icon = LogIn, onLogin = null, message = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryHex } = useTabTheme();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 min-h-[55vh]" data-testid="login-required">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: `${primaryHex}1a` }}>
        <Icon size={34} style={{ color: primaryHex }} />
      </div>
      <h2 className="text-[19px] font-bold text-slate-900">{title}</h2>
      <p className="text-[14px] text-slate-500 mt-1.5 max-w-xs">{subtitle}</p>
      <button
        type="button"
        onClick={onLogin || (() => navigate('/login', { state: { ...(location.state || {}), from: `${location.pathname}${location.search}`, message: message || title } }))}
        className="mt-6 px-10 h-12 rounded-full text-white font-bold text-[14px] active:scale-95 transition-transform shadow-md"
        style={{ background: primaryHex }}
      >
        Login
      </button>
    </div>
  );
};

export default LoginRequiredCard;
