import React from 'react';
import { Link } from 'react-router-dom';
import footerBorder from '../../assets/footer-border.png';
import { useSupportContact } from '../config/publicConfig';

const Footer = () => {
  const contact = useSupportContact();
  return (
    <footer className="w-full bg-white pb-20 mt-auto border-t border-gray-100 flex flex-col items-center">
      {/* Decorative Mithila painting border with opacity */}
      <div className="w-full h-10 md:h-14 mb-8 opacity-75 overflow-hidden border-b border-gray-100">
        <img
          src={footerBorder}
          alt="Mithila Art Footer Border"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Responsive Footer Link Grid (Hidden on mobile, 2 columns on tablet, 4 columns on desktop) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12 w-full max-w-[1200px] px-5 sm:px-6 mb-8 pb-8 border-b border-gray-100">
        {/* Column 1: About */}
        <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">About Mithilakart</h3>
          <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed font-semibold">
            Discover unique, high-quality handcrafted items and fresh goods directly from local artisans. We bridge the gap between traditional craftsmanship and modern convenience.
          </p>
        </div>

        {/* Column 2: Customer Care */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">Customer Care</h3>
          <ul className="space-y-2 text-[11px] md:text-xs font-bold text-gray-500">
            <li>
              <Link to="/profile/help-center" className="hover:text-primary-green transition-colors">Help Center</Link>
            </li>
            <li>
              <Link to="/profile/orders" className="hover:text-primary-green transition-colors">Track Order</Link>
            </li>
            <li>
              <Link to="/cancellation-returns" className="hover:text-primary-green transition-colors">Cancellations & Returns</Link>
            </li>
            <li>
              <Link to="/shipping" className="hover:text-primary-green transition-colors">Shipping Policy</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Useful Links */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">Useful Links</h3>
          <ul className="space-y-2 text-[11px] md:text-xs font-bold text-gray-500">
            <li>
              <Link to="/terms" className="hover:text-primary-green transition-colors">Terms of Use</Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary-green transition-colors">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/home" className="hover:text-primary-green transition-colors">Home Page</Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-primary-green transition-colors">Shop by Categories</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">Contact Us</h3>
          <ul className="space-y-2 text-[11px] md:text-xs font-semibold text-gray-500">
            <li><strong>Email:</strong> {contact.email}</li>
            <li><strong>Phone:</strong> {contact.phone}</li>
            <li><strong>Address:</strong> Mithilakart Pvt Ltd, Mumbai, India</li>
          </ul>
        </div>
      </div>

      {/* Social Media Icons (Centered for both Desktop & Mobile) */}
      <div className="flex items-center justify-center gap-5 mb-5">
        {/* Facebook */}
        <a
          href="https://www.facebook.com/mithilakart"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1877F2] transition-transform hover:scale-110 active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        {/* YouTube */}
        <a
          href="https://www.youtube.com/@mithilakart"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FF0000] transition-transform hover:scale-110 active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/mithilakart"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
          style={{
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>

        {/* X */}
        <a
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black transition-transform hover:scale-110 active:scale-95 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me/918076109547"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] transition-transform hover:scale-110 active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>

      {/* Centered Logo & Stacked Brand Name */}
      <div className="flex flex-col items-center justify-center gap-1">
        <img
          src="/mthibg.png"
          alt="Mithilakart Logo"
          className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
        />
        <div className="flex items-center text-[14px] font-bold text-black tracking-wide italic mt-1">
          Mithilakart<span className="text-[10px] align-super ml-0.5">™</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
