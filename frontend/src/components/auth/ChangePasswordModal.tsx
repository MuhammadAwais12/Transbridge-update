import React, { useState } from 'react';
import { X, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../lib/apiBase';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // Validation
    let hasErrors = false;
    const newFieldErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };

    if (!currentPassword.trim()) {
      newFieldErrors.currentPassword = 'Current password is required';
      hasErrors = true;
    }

    if (!newPassword.trim()) {
      newFieldErrors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (newPassword.length < 6) {
      newFieldErrors.newPassword = 'New password must be at least 6 characters';
      hasErrors = true;
    } else if (newPassword.length > 128) {
      newFieldErrors.newPassword = 'New password must not exceed 128 characters';
      hasErrors = true;
    }

    if (!confirmPassword.trim()) {
      newFieldErrors.confirmPassword = 'Please confirm your new password';
      hasErrors = true;
    } else if (confirmPassword !== newPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/client/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Current password is incorrect');
        } else {
          setError(data.message || 'Failed to change password');
        }
        return;
      }

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Clear field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Update the corresponding state
    switch (field) {
      case 'currentPassword':
        setCurrentPassword(value);
        break;
      case 'newPassword':
        setNewPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
          <p className="text-gray-600">
            For security reasons, please change your password on your first login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  fieldErrors.currentPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                value={currentPassword}
                onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  fieldErrors.newPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                value={newPassword}
                onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                value={confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Changing Password...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" />
                Change Password
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 