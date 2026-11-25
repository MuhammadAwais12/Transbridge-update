import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { apiFetch, ApiError } from '../../lib/apiFetch';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Key,
  Bell,
  Globe,
  CreditCard,
  FileText,
  Download,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';
import { useStates, useCountries } from '../../hooks/useCountries';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  nationality: string | null;
  address_1: string;
  address_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences' | 'documents'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Profile data state
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.clientId) return;
      
      setIsFetching(true);
      setFetchError(null);
      
      try {
        const data = await apiFetch(`/client/${user.clientId}/profile`);
        setProfileData(data);
        console.log('profile data',data)
      } catch (err) {
        console.error('Error fetching profile:', err);
        setFetchError(err instanceof Error ? err.message : 'Failed to fetch profile data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [user?.clientId]);

    // Helper functions to get country and state names
  const getCountryName = (countryCode: string | null) => {
    if (!countryCode || countriesLoading) return '';
    const country = countries.find(c => c.Iso2 === countryCode);
    return country ? country.name : countryCode;
  };

  const getStateName = (stateCode: string | null, countryCode: string | null) => {
    if (!stateCode || !countryCode || statesLoading) return stateCode || '';
    // Make sure we're using the states for the correct country
    const state = states.find(s => s.state_code === stateCode);
    return state ? state.name : stateCode;
  };

  // Add countries hook
  const { countries, loading: countriesLoading } = useCountries();
  // Get states for the selected country
  const { states, loading: statesLoading } = useStates(
    profileData?.country ? getCountryName(profileData?.country) : null
  );

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true
  });

  const [preferences, setPreferences] = useState({
    language: 'English',
    timezone: 'America/New_York',
    currency: 'USD',
    theme: 'light',
    emailFrequency: 'weekly',
    statementDelivery: 'email'
  });

  const handleSaveProfile = async () => {
    if (!user?.clientId || !profileData) return;

    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    // Client-side validation for required fields
    const requiredFields = {
      first_name: 'First Name',
      last_name: 'Last Name',
      phone_number: 'Phone Number',
      date_of_birth: 'Date of Birth',
      nationality: 'Nationality',
      address_1: 'Address Line 1',
      city: 'City',
      state: 'State/Province',
      postal_code: 'Postal Code',
      country: 'Country'
    };

    const newValidationErrors: Record<string, string> = {};

    // Check each required field
    Object.entries(requiredFields).forEach(([field, label]) => {
      const value = profileData[field as keyof Profile];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newValidationErrors[field] = `${label} is required`;
      }
    });

    // Additional validation for specific fields
    if (profileData.phone_number && !/^\+?[\d\s\-\(\)]+$/.test(profileData.phone_number.trim())) {
      newValidationErrors.phone_number = 'Please enter a valid phone number';
    }

    if (profileData.postal_code && profileData.postal_code.trim().length < 3) {
      newValidationErrors.postal_code = 'Postal code must be at least 3 characters';
    }

    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const profileUpdateData = {
        email: user?.email,
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        phone_number: profileData.phone_number.trim(),
        date_of_birth: profileData.date_of_birth,
        nationality: profileData.nationality?.trim() || '',
        address_1: profileData.address_1.trim(),
        address_2: profileData.address_2?.trim() || '',
        city: profileData.city.trim(),
        state: profileData.state.trim(),
        postal_code: profileData.postal_code.trim(),
        country: profileData.country.trim()
      };
      console.log(profileUpdateData);

      let data;
      try {
        data = await apiFetch(`/client/${user.clientId}/profile`, {
          method: 'PUT',
          body: JSON.stringify(profileUpdateData),
        });
      } catch (err) {
        // Handle validation errors
        const body = err instanceof ApiError ? (err.body as any) : null;
        if (err instanceof ApiError && err.status === 400 && body?.errors) {
          setValidationErrors(body.errors);
          throw new Error('Please fix the validation errors');
        }
        // Other errors: ApiError carries the backend message
        throw err;
      }

      // Update profile data with response
      setProfileData(data);
      setValidationErrors({});
      setError(null);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      if (!Object.keys(validationErrors).length) {
        setError(err instanceof Error ? err.message : 'Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setError('');
    setFieldErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // Validation
    let hasErrors = false;
    const newFieldErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };

    if (!securityData.currentPassword.trim()) {
      newFieldErrors.currentPassword = 'Current password is required';
      hasErrors = true;
    }

    if (!securityData.newPassword.trim()) {
      newFieldErrors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (securityData.newPassword.length < 6) {
      newFieldErrors.newPassword = 'New password must be at least 6 characters';
      hasErrors = true;
    } else if (securityData.newPassword.length > 128) {
      newFieldErrors.newPassword = 'New password must not exceed 128 characters';
      hasErrors = true;
    }

    if (!securityData.confirmPassword.trim()) {
      newFieldErrors.confirmPassword = 'Please confirm your new password';
      hasErrors = true;
    } else if (securityData.confirmPassword !== securityData.newPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Backend answers 401 for a wrong current password, so don't log the user out on 401 here
      try {
        await apiFetch('/client/change-password', {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: securityData.currentPassword,
            newPassword: securityData.newPassword,
          }),
          skipAuthRedirect: true,
        });
      } catch (err) {
        if (!(err instanceof ApiError)) throw err; // network error -> outer catch
        setError(err.status === 401 ? 'Current password is incorrect' : err.message || 'Failed to change password');
        return;
      }

      // Success
      setSaveSuccess(true);
      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonalTab = () => (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex items-center space-x-6">
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: branding.primaryColor }}
        >
          {profileData?.first_name.charAt(0)}{profileData?.last_name.charAt(0)}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {profileData?.first_name} {profileData?.last_name}
          </h3>
          <p className="text-gray-600">{user?.email}</p>
        </div>
        <div className="flex-1 flex justify-end">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            {isEditing ? (
              <input
                type="text"
                required
                value={profileData?.first_name || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                className={`input-field ${validationErrors.first_name ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your first name"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{profileData?.first_name}</p>
            )}
            {validationErrors.first_name && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            {isEditing ? (
              <input
                type="text"
                required
                value={profileData?.last_name || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                className={`input-field ${validationErrors.last_name ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your last name"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{profileData?.last_name}</p>
            )}
            {validationErrors.last_name && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-900">{user?.email}</p>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Verified
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            {isEditing ? (
              <input
                type="tel"
                required
                value={profileData?.phone_number || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, phone_number: e.target.value } : null)}
                className={`input-field ${validationErrors.phone_number ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your phone number"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">{profileData?.phone_number}</p>
              </div>
            )}
            {validationErrors.phone_number && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.phone_number}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            {isEditing ? (
              <input
                type="date"
                required
                value={profileData?.date_of_birth || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, date_of_birth: e.target.value } : null)}
                className={`input-field ${validationErrors.date_of_birth ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">
                  {profileData?.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : ''}
                </p>
              </div>
            )}
            {validationErrors.date_of_birth && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.date_of_birth}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
            {isEditing ? (
              <input
                type="text"
                required
                value={profileData?.nationality || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, nationality: e.target.value } : null)}
                className={`input-field ${validationErrors.nationality ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your nationality"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">{profileData?.nationality || 'Not specified'}</p>
              </div>
            )}
            {validationErrors.nationality && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.nationality}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Address Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
            {isEditing ? (
              <input
                type="text"
                required
                value={profileData?.address_1 || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, address_1: e.target.value } : null)}
                className={`input-field ${validationErrors.address_1 ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your address"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{profileData?.address_1}</p>
            )}
            {validationErrors.address_1 && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.address_1}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData?.address_2 || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, address_2: e.target.value } : null)}
                className="input-field"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{profileData?.address_2 || ''}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            {isEditing ? (
              <input
                type="text"
                required
                value={profileData?.city || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, city: e.target.value } : null)}
                className={`input-field ${validationErrors.city ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your city"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{profileData?.city}</p>
            )}
            {validationErrors.city && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
            {isEditing ? (
              <select
                required
                value={profileData?.state || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, state: e.target.value } : null)}
                className={`input-field ${validationErrors.state ? 'border-red-300 focus:ring-red-500' : ''}`}
                disabled={!profileData?.country || statesLoading}
              >
                <option value="">Select state...</option>
                {statesLoading
                  ? <option disabled>Loading...</option>
                  : states.map(s => (
                      <option key={s.state_code} value={s.state_code}>
                        {s.name}
                      </option>
                    ))
                }
              </select>
            ) : (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900 py-2">
                  {statesLoading ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : (
                    getStateName(profileData?.state || null, profileData?.country || null)
                  )}
                </p>
              </div>
            )}
            {validationErrors.state && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
            {isEditing ? (
              <input
                type="text"
                required
                value={profileData?.postal_code || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, postal_code: e.target.value } : null)}
                className={`input-field ${validationErrors.postal_code ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your postal code"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{profileData?.postal_code}</p>
            )}
            {validationErrors.postal_code && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.postal_code}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            {isEditing ? (
              <select
                required
                value={profileData?.country || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, country: e.target.value, state: '' } : null)}
                className={`input-field ${validationErrors.country ? 'border-red-300 focus:ring-red-500' : ''}`}
                disabled={countriesLoading}
              >
                <option value="">Select country...</option>
                {countriesLoading
                  ? <option disabled>Loading...</option>
                  : countries.map(c => (
                      <option key={c.Iso2} value={c.Iso2}>
                        {c.name}
                      </option>
                    ))
                }
              </select>
            ) : (
              <p className="text-sm text-gray-900 py-2">
                {countriesLoading ? (
                  <span className="text-gray-500">Loading...</span>
                ) : (
                  getCountryName(profileData?.country || null)
                )}
              </p>
            )}
            {validationErrors.country && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Key className="w-5 h-5 mr-2" />
          Change Password
        </h4>
        <div className="space-y-4 max-w-md">
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <p className="text-sm text-green-800">Password updated successfully!</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={`input-field pr-10 ${fieldErrors.currentPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={securityData.newPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={`input-field pr-10 ${fieldErrors.newPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`input-field pr-10 ${fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Updating Password...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Key className="w-5 h-5 mr-2" />
                Update Password
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      {/* <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Two-Factor Authentication
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900">Secure your account with 2FA</p>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={securityData.twoFactorEnabled}
              onChange={(e) => setSecurityData(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="rounded border-gray-300 mr-2"
            />
            <span className="text-sm text-gray-700">
              {securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div> */}

      {/* Security Notifications */}
      {/* <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Security Notifications
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive security alerts via email</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityData.emailNotifications}
                onChange={(e) => setSecurityData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="rounded border-gray-300 mr-2"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Receive security alerts via SMS</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityData.smsNotifications}
                onChange={(e) => setSecurityData(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                className="rounded border-gray-300 mr-2"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">Login Alerts</p>
              <p className="text-sm text-gray-600">Get notified of new device logins</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={securityData.loginAlerts}
                onChange={(e) => setSecurityData(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                className="rounded border-gray-300 mr-2"
              />
            </label>
          </div>
        </div>
      </div> */}
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      {/* General Preferences */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">General Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              className="input-field"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
              className="input-field"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency Display</label>
            <select
              value={preferences.currency}
              onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
              className="input-field"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={preferences.theme}
              onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
              className="input-field"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Communication Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Frequency</label>
            <select
              value={preferences.emailFrequency}
              onChange={(e) => setPreferences(prev => ({ ...prev, emailFrequency: e.target.value }))}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statement Delivery</label>
            <select
              value={preferences.statementDelivery}
              onChange={(e) => setPreferences(prev => ({ ...prev, statementDelivery: e.target.value }))}
              className="input-field"
            >
              <option value="email">Email</option>
              <option value="mail">Physical Mail</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      {/* KYC Documents */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          KYC Documents
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Driver's License</p>
                <p className="text-sm text-gray-600">Uploaded on Jan 1, 2024</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Verified
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Proof of Address</p>
                <p className="text-sm text-gray-600">Uploaded on Jan 1, 2024</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Verified
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload New Document */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h4>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop your document
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: JPG, PNG, PDF (Max 10MB)
          </p>
          <button className="btn-primary mt-4">
            Choose File
          </button>
        </div>
      </div>

      {/* Account Statements */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Statements</h4>
        <div className="space-y-3">
          {['December 2023', 'November 2023', 'October 2023'].map((month, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Statement - {month}</p>
                  <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Loading State */}
      {authLoading || isFetching ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : !user ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      ) : fetchError ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{fetchError}</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'personal', label: 'Personal Info', icon: User },
                { id: 'security', label: 'Security', icon: Shield },
                // { id: 'preferences', label: 'Preferences', icon: Bell },
                // { id: 'documents', label: 'Documents', icon: FileText }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'personal' && renderPersonalTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'documents' && renderDocumentsTab()}
        </>
      )}
    </div>
  );
}