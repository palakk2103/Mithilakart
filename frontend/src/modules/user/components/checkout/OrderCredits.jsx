import React, { useState } from 'react';
import { CheckCircle2, Gift, ShieldAlert, Wallet } from 'lucide-react';
import { formatPrice } from '../../../../shared/utils/priceFormatter';

/** Payment page: gift card box and "use wallet balance". Amounts come from the server quote. */
const OrderCredits = ({ bill, accentHex, giftCode, onApplyGift, onRemoveGift, useWallet, onWallet, busy }) => {
  const [code, setCode] = useState('');
  const gift = bill?.giftCard;
  return (
    <div className="space-y-3" data-testid="order-credits">
      <h2 className="flex items-center gap-2 text-[16px] font-bold cd-heading"><Gift size={18} style={{ color: accentHex }} /> Gift Card &amp; Wallet</h2>
      {giftCode && gift ? (
        <div className="rounded-lg bg-emerald-50 px-3 py-2.5 flex items-center gap-2" role="status">
          <CheckCircle2 size={17} className="text-emerald-600 flex-shrink-0" />
          <p className="flex-1 text-[13px] font-semibold text-emerald-800">Gift card •••• {gift.last4}: {formatPrice(gift.amount, gift.amount % 1 !== 0)} used</p>
          <button type="button" onClick={onRemoveGift} className="h-9 px-2 text-[12.5px] font-bold text-slate-600 underline">Remove</button>
        </div>
      ) : (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) onApplyGift(code.trim()); }}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={24} autoComplete="off" aria-label="Gift card code" placeholder="XXXX-XXXX-XXXX-XXXX" className="flex-1 min-w-0 h-11 border border-slate-300 rounded-lg px-3 text-[14px] font-semibold focus:outline-none bg-white" />
          <button type="submit" disabled={busy} className="px-5 h-11 cd-btn text-white text-[13.5px] font-bold active:scale-95" style={{ background: accentHex }}>Redeem</button>
        </form>
      )}
      {bill?.walletEnabled && bill.walletBalance > 0 && (
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 min-h-[48px] cursor-pointer">
          <Wallet size={19} style={{ color: accentHex }} />
          <span className="flex-1 text-[13.5px] font-semibold text-slate-800">Use wallet balance ({formatPrice(bill.walletBalance, bill.walletBalance % 1 !== 0)})</span>
          <input type="checkbox" checked={useWallet} onChange={(e) => onWallet(e.target.checked)} className="w-5 h-5" style={{ accentColor: accentHex }} />
        </label>
      )}
      <p className="flex items-start gap-1.5 text-[11.5px] text-slate-500 leading-snug"><ShieldAlert size={14} className="flex-shrink-0 mt-px" /> Mithilakart never asks for your gift card code or OTP by call, SMS or WhatsApp.</p>
    </div>
  );
};

export default OrderCredits;
