import React, { useState, useEffect } from 'react';
import { sellersApi } from '../services/api';
import { extractList, mapPendingVendor } from '../utils/mappers';
import { 
  CheckCircle2, XCircle, FileText, MapPin, 
  Mail, Phone, ShieldCheck, ExternalLink, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VendorApproval = () => {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error: apiError } = await sellersApi.getAll({ kycStatus: 'pending' });
    if (apiError) {
      setError(apiError);
      setPendingVendors([]);
    } else {
      setError(null);
      setPendingVendors(extractList(data).map(mapPendingVendor));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    const { error: apiError } = await sellersApi.approve(id);
    if (!apiError) {
      setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleReject = async (id) => {
    const { error: apiError } = await sellersApi.reject(id, 'Rejected by admin');
    if (!apiError) {
      setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Requests</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">Review and verify new vendor registration requests.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {pendingVendors.length > 0 ? (
            pendingVendors.map((vendor, index) => (
              <motion.div 
                key={vendor.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-slate-50">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center text-blue-600 font-black text-xl shadow-inner border border-blue-100/50">
                        {vendor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{vendor.name}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-0.5">Retail Partner Request</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100/50">
                      Pending Review
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail size={16} className="text-slate-400" />
                        <span className="text-sm font-bold">{vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone size={16} className="text-slate-400" />
                        <span className="text-sm font-bold">+91 98765 43210</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="text-sm font-bold">Joined: {vendor.joined}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <ShieldCheck size={16} className="text-slate-400" />
                        <span className="text-sm font-bold text-green-600">Email Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="p-8 bg-slate-50/50 flex-1">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14} /> Verification Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['GST Certificate', 'PAN Card Copy', 'Identity Proof', 'Bank Statement'].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all cursor-pointer group">
                        <span className="text-xs font-bold text-slate-600">{doc}</span>
                        <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-50 flex gap-4 bg-white">
                  <button 
                    onClick={() => handleReject(vendor.id)}
                    className="flex-1 py-4 border border-red-100 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(vendor.id)}
                    className="flex-[2] py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Approve Vendor
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">All Caught Up!</h3>
              <p className="text-slate-400 font-medium mt-2 max-w-sm px-6">There are no pending vendor registration requests to review at the moment.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VendorApproval;
