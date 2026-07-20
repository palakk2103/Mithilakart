import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, ShieldCheck, Camera, Save, Edit3, X, Truck, Eye, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import useDeliveryStore from '../../../store/useDeliveryStore';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, fetchProfile } = useDeliveryStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e, key) => {
    setFormData({ ...formData, [key]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ title }) => (
    <div className="pt-4 pb-2">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Personal Info</h1>
        </div>
        
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-blue-50 text-[#3E5A44]' : 'text-slate-400'}`}
        >
          {isEditing ? <X size={22} /> : <Edit3 size={22} />}
        </button>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <User size={40} className="text-[#3E5A44]" />
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-[#3E5A44] text-white rounded-full border-2 border-white shadow-lg animate-in zoom-in duration-300">
                <Camera size={14} />
              </button>
            )}
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-3">Partner ID: #7742</p>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader title="Personal Details" />
            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'fullName', icon: User },
                { label: 'Mobile', key: 'mobile', icon: Phone },
                { label: 'Alt Mobile', key: 'altMobile', icon: Phone },
                { label: 'Email', key: 'email', icon: Mail },
                { label: 'Date of Birth', key: 'dob', icon: User },
                { label: 'Age', key: 'age', icon: User },
                { label: 'Father\'s Name', key: 'fathersName', icon: User },
                { label: 'Current Address', key: 'currAddress', icon: MapPin },
                { label: 'Permanent Address', key: 'permAddress', icon: MapPin },
                { label: 'City', key: 'city', icon: MapPin },
                { label: 'State', key: 'state', icon: MapPin },
                { label: 'PIN Code', key: 'pinCode', icon: MapPin },
                { label: 'Emergency Contact', key: 'emergencyContact', icon: Phone },
              ].map(field => (
                <div key={field.key} className={`bg-white rounded-2xl p-4 border transition-all ${isEditing ? 'border-blue-200 shadow-blue-50' : 'border-slate-100 shadow-sm'}`}>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.label}</label>
                  <div className="flex items-center gap-3">
                    <field.icon size={16} className={`${isEditing ? 'text-[#3E5A44]' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      readOnly={!isEditing}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(e, field.key)}
                      className={`flex-1 bg-transparent text-sm font-bold outline-none ${isEditing ? 'text-slate-900' : 'text-slate-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Identity Details" />
            <div className="space-y-3">
              {[
                { label: 'Aadhaar Number', key: 'aadhaar', icon: ShieldCheck },
                { label: 'PAN Number', key: 'pan', icon: ShieldCheck },
                { label: 'Police Verification', key: 'policeVerification', icon: ShieldCheck },
              ].map(field => (
                <div key={field.key} className={`bg-white rounded-2xl p-4 border transition-all ${isEditing ? 'border-blue-200 shadow-blue-50' : 'border-slate-100 shadow-sm'}`}>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.label}</label>
                  <div className="flex items-center gap-3">
                    <field.icon size={16} className={`${isEditing ? 'text-[#3E5A44]' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      readOnly={!isEditing}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(e, field.key)}
                      className={`flex-1 bg-transparent text-sm font-bold outline-none ${isEditing ? 'text-slate-900' : 'text-slate-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Vehicle Info" />
            <div className="space-y-3">
              {[
                { label: 'Vehicle Type', key: 'vehicleType', icon: Truck },
                { label: 'Vehicle Number', key: 'vehicleNumber', icon: Truck },
                { label: 'License Number', key: 'licenseNumber', icon: ShieldCheck },
                { label: 'RC Number', key: 'rcNumber', icon: ShieldCheck },
                { label: 'Insurance #', key: 'insuranceNumber', icon: ShieldCheck },
                { label: 'Insurance Expiry', key: 'insuranceExpiry', icon: ShieldCheck },
              ].map(field => (
                <div key={field.key} className={`bg-white rounded-2xl p-4 border transition-all ${isEditing ? 'border-blue-200 shadow-blue-50' : 'border-slate-100 shadow-sm'}`}>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.label}</label>
                  <div className="flex items-center gap-3">
                    <field.icon size={16} className={`${isEditing ? 'text-[#3E5A44]' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      readOnly={!isEditing}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(e, field.key)}
                      className={`flex-1 bg-transparent text-sm font-bold outline-none ${isEditing ? 'text-slate-900' : 'text-slate-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Bank Details" />
            <div className="space-y-3">
              {[
                { label: 'Bank Name', key: 'bankName', icon: ShieldCheck },
                { label: 'Acc Holder', key: 'accHolder', icon: User },
                { label: 'Acc Number', key: 'accNumber', icon: ShieldCheck },
                { label: 'IFSC Code', key: 'ifsc', icon: ShieldCheck },
                { label: 'Branch', key: 'branch', icon: MapPin },
                { label: 'UPI ID', key: 'upiId', icon: ShieldCheck },
              ].map(field => (
                <div key={field.key} className={`bg-white rounded-2xl p-4 border transition-all ${isEditing ? 'border-blue-200 shadow-blue-50' : 'border-slate-100 shadow-sm'}`}>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.label}</label>
                  <div className="flex items-center gap-3">
                    <field.icon size={16} className={`${isEditing ? 'text-[#3E5A44]' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      readOnly={!isEditing}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(e, field.key)}
                      className={`flex-1 bg-transparent text-sm font-bold outline-none ${isEditing ? 'text-slate-900' : 'text-slate-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Uploaded Documents" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Profile Photo', key: 'profilePhoto' },
                { label: 'ID Card', key: 'idCard' },
                { label: 'Marksheet', key: 'educationMarksheet' },
                { label: 'Driving License', key: 'drivingLicenseDoc' },
                { label: 'Signature', key: 'applicantSignature' },
              ].map(doc => (
                <div key={doc.key} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col gap-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{doc.label}</label>
                  <div className="aspect-video bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-50 relative group">
                    {formData[doc.key] ? (
                      <>
                        <img src={formData[doc.key]} alt={doc.label} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setSelectedImage({ url: formData[doc.key], label: doc.label })}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Eye size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon size={16} className="text-slate-300" />
                        <span className="text-[8px] font-bold text-slate-300 uppercase">Not Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isEditing && (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#3E5A44] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2 mt-8"
          >
            <Save size={18} />
            Save Changes
          </motion.button>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute top-6 right-6 flex gap-4">
             <button onClick={() => setSelectedImage(null)} className="p-3 bg-white/10 text-white rounded-full backdrop-blur-md">
              <X size={24} />
            </button>
          </div>
          <p className="text-white font-black uppercase tracking-widest text-xs mb-4">{selectedImage.label}</p>
          <img src={selectedImage.url} alt="Full View" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain animate-in zoom-in duration-300" />
        </div>
      )}
    </div>
  );
};

export default PersonalInfo;
