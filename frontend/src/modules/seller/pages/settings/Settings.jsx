/**
 * Settings Page
 * Manage Store profile, Bank details, Password, and Notification Preferences.
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Store, Landmark, Shield, Bell, Save, ArrowLeft, MapPin } from 'lucide-react';
import { PageHeader } from '../../components/common';
import { Card, Button, Toggle } from '../../components/ui';
import {
  getProfile, updateProfile, updateBankDetails, changePassword, updateNotificationPrefs,
} from '../../services/sellerApi';
import toast from 'react-hot-toast';

const defaultNotificationPrefs = {
  orderAlerts: true,
  outOfStock: true,
  customerReviews: false,
  weeklyDigest: true,
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState(defaultNotificationPrefs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, setValue: setProfileValue } = useForm();
  const { register: registerBank, handleSubmit: handleBankSubmit, reset: resetBank } = useForm();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword } = useForm();

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setProfileValue('latitude', lat, { shouldDirty: true });
        setProfileValue('longitude', lng, { shouldDirty: true });
        toast.success(`Store location captured: ${lat}, ${lng}`);
        setDetectingLocation(false);
      },
      (err) => {
        toast.error('Could not detect live location. Please allow browser location access or enter coordinates manually.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await getProfile();
        resetProfile({
          name: profile?.name || '',
          storeName: profile?.storeName || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
          address: profile?.addressLine || profile?.address || profile?.storeDescription || '',
          city: profile?.city || '',
          state: profile?.state || '',
          pincode: profile?.pincode || '',
          latitude: profile?.latitude ?? '',
          longitude: profile?.longitude ?? '',
        });
        const bank = profile?.bankDetails || profile?.bank || {};
        resetBank({
          holderName: bank.holderName || bank.accountHolder || '',
          bankName: bank.bankName || '',
          accountNumber: bank.accountNumber || '',
          ifsc: bank.ifsc || '',
        });
        if (profile?.notificationPrefs) {
          setNotifications({ ...defaultNotificationPrefs, ...profile.notificationPrefs });
        }
      } catch (err) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [resetProfile, resetBank]);

  const onUpdateProfile = async (data) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const onUpdateBank = async (data) => {
    try {
      await updateBankDetails(data);
      toast.success('Bank details updated successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to update bank details');
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully!');
      resetPassword();
    } catch (err) {
      toast.error(err?.message || 'Failed to update password');
    }
  };

  const handleNotificationPrefChange = async (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      await updateNotificationPrefs(updated);
    } catch (err) {
      setNotifications(notifications);
      toast.error(err?.message || 'Failed to update notification preferences');
    }
  };

  const inputClass = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Settings" subtitle="Manage store setup, payment receiving accounts, security keys and alerts" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2 sticky top-24 space-y-1">
            {[
              { id: 'profile', label: 'Store Profile', icon: Store },
              { id: 'bank', label: 'Bank Details', icon: Landmark },
              { id: 'password', label: 'Security & Password', icon: Shield },
              { id: 'notifications', label: 'Notification Preferences', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Panel contents */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card title="Store Profile Details" subtitle="This information will be displayed to customers on Mithilakart">
              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Owner Full Name</label>
                    <input {...registerProfile('name')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Registered Store Name</label>
                    <input {...registerProfile('storeName')} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" {...registerProfile('email')} className={inputClass} disabled />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile Number</label>
                    <input {...registerProfile('phone')} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input {...registerProfile('city')} placeholder="e.g. Indore" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input {...registerProfile('state')} placeholder="e.g. Madhya Pradesh" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input {...registerProfile('pincode')} placeholder="e.g. 452001" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Store Address Line</label>
                  <textarea {...registerProfile('address')} rows={2} placeholder="Complete shop address for customer delivery and courier pickup" className={inputClass} />
                </div>

                {/* Store GPS Coordinates & Live Location Button */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin size={16} className="text-emerald-600" /> Store GPS Location (For 10-30 min Quick Delivery)
                      </h4>
                      <p className="text-xs text-slate-500">Accurate store coordinates ensure nearby customers see live 10-30m delivery ETA</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="text-xs shrink-0"
                    >
                      {detectingLocation ? 'Detecting GPS...' : '📍 Auto-Detect Live Store Location'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        {...registerProfile('latitude')}
                        placeholder="e.g. 22.7248"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        {...registerProfile('longitude')}
                        placeholder="e.g. 75.8839"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" icon={Save}>Save Profile Details</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'bank' && (
            <Card title="Bank Account Details" subtitle="Bank account where settlement payouts will be automatically credited">
              <form onSubmit={handleBankSubmit(onUpdateBank)} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Account Holder Name</label>
                    <input {...registerBank('holderName')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Bank Name</label>
                    <input {...registerBank('bankName')} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Account Number</label>
                    <input {...registerBank('accountNumber')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>IFSC Code</label>
                    <input {...registerBank('ifsc')} className={inputClass} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" icon={Save}>Save Bank Details</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'password' && (
            <Card title="Change Security Password" subtitle="Ensure your account password remains secure">
              <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4 mt-4">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <input type="password" {...registerPassword('currentPassword', { required: true })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <input type="password" {...registerPassword('newPassword', { required: true })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <input type="password" {...registerPassword('confirmPassword', { required: true })} className={inputClass} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" icon={Save}>Update Password</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card title="Notification Configurations" subtitle="Select channels and categories of updates you want to receive">
              <div className="mt-6 space-y-5">
                <Toggle
                  label="New Order Alerts"
                  description="Receive instant toast notifications when customers purchase items"
                  checked={notifications.orderAlerts}
                  onChange={(v) => handleNotificationPrefChange('orderAlerts', v)}
                />
                <Toggle
                  label="Out of Stock Indicators"
                  description="Alerts you immediately when inventory item reaches threshold"
                  checked={notifications.outOfStock}
                  onChange={(v) => handleNotificationPrefChange('outOfStock', v)}
                />
                <Toggle
                  label="Customer Review Submissions"
                  description="Receive email summaries when products receive ratings"
                  checked={notifications.customerReviews}
                  onChange={(v) => handleNotificationPrefChange('customerReviews', v)}
                />
                <Toggle
                  label="Weekly Digest summary"
                  description="Get weekly sales, settlement reports directly to your inbox"
                  checked={notifications.weeklyDigest}
                  onChange={(v) => handleNotificationPrefChange('weeklyDigest', v)}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
