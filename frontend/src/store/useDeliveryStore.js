import { create } from 'zustand';
import { getProfile, updateProfile as apiUpdateProfile } from '../modules/delivery/services/deliveryApi';
import { getUser } from '../shared/api/tokenStorage';

const emptyProfile = {
  fullName: '',
  mobile: '',
  altMobile: '',
  email: '',
  dob: '',
  age: '',
  fathersName: '',
  currAddress: '',
  permAddress: '',
  city: '',
  state: '',
  pinCode: '',
  emergencyContact: '',
  aadhaar: '',
  pan: '',
  policeVerification: '',
  vehicleType: '',
  vehicleNumber: '',
  licenseNumber: '',
  rcNumber: '',
  insuranceNumber: '',
  insuranceExpiry: '',
  bankName: '',
  accHolder: '',
  accNumber: '',
  ifsc: '',
  branch: '',
  upiId: '',
  profilePhoto: null,
  idCard: null,
  educationMarksheet: null,
  drivingLicenseDoc: null,
  applicantSignature: null,
};

export const mapPartnerToProfile = (partner = {}) => ({
  ...emptyProfile,
  fullName: partner.name || partner.fullName || '',
  mobile: partner.phone
    ? `${partner.countryCode || '+91'} ${partner.phone}`.trim()
    : partner.mobile || '',
  vehicleType: partner.vehicleType || '',
  aadhaar: partner.documents?.aadharNumber || partner.aadhaar || '',
  licenseNumber: partner.documents?.drivingLicenseNumber || partner.licenseNumber || '',
  vehicleNumber: partner.documents?.vehicleRegistrationNumber || partner.vehicleNumber || '',
  accHolder: partner.name || partner.fullName || '',
});

const useDeliveryStore = create((set, get) => ({
  profile: { ...emptyProfile },
  profileLoading: false,
  profileError: null,

  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    try {
      let data = null;
      try {
        data = await getProfile();
      } catch {
        data = getUser('delivery');
      }
      set({
        profile: mapPartnerToProfile(data || {}),
        profileLoading: false,
      });
    } catch (err) {
      set({
        profile: mapPartnerToProfile(getUser('delivery') || {}),
        profileLoading: false,
        profileError: err?.message || 'Failed to load profile',
      });
    }
  },

  updateProfile: async (newData) => {
    const payload = {
      name: newData.fullName || newData.name,
      vehicleType: newData.vehicleType,
    };
    const updated = await apiUpdateProfile(payload);
    set((state) => ({
      profile: { ...state.profile, ...mapPartnerToProfile(updated || {}), ...newData },
    }));
    return updated;
  },
}));

export default useDeliveryStore;
