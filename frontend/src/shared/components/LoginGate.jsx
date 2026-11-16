import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../api/tokenStorage';
import LoginRequiredCard from './LoginRequiredCard';

/**
 * Wraps a customer-only page. Logged out → header + "Login to see your …";
 * logged in → the page itself. Kept as a wrapper so the page's own hooks are
 * never called conditionally.
 */
const LoginGate = ({ children, title, cardTitle, subtitle, icon }) => {
  const navigate = useNavigate();
  if (isAuthenticated('customer')) return children;
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 h-14 px-4 flex items-center gap-3 bg-white border-b border-slate-200">
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100">
          <ArrowLeft size={21} />
        </button>
        <h1 className="text-[17px] font-bold text-slate-900">{title}</h1>
      </header>
      <LoginRequiredCard title={cardTitle} subtitle={subtitle} icon={icon} />
    </div>
  );
};

export default LoginGate;
