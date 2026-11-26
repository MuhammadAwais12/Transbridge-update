import React, { useState, useEffect } from 'react';
import { useBranding } from '../../contexts/BrandingContext';
import { brand } from '../../config/brand';
import { Upload, Eye, Save, RotateCcw, Palette, Type, Layout, Check } from 'lucide-react';

const colorPresets = [
  { name: brand.name, primary: brand.theme.primary, secondary: brand.theme.secondary, accent: brand.theme.accent },
  { name: 'Corporate Blue', primary: '#3b82f6', secondary: '#22c55e', accent: '#f97316' },
  { name: 'Financial Green', primary: '#059669', secondary: '#3b82f6', accent: '#f59e0b' },
  { name: 'Modern Purple', primary: '#8b5cf6', secondary: '#06b6d4', accent: '#f97316' },
  { name: 'Professional Gray', primary: '#6b7280', secondary: '#10b981', accent: '#f59e0b' },
  { name: 'Trust Navy', primary: '#1e40af', secondary: '#059669', accent: '#dc2626' },
];

export default function BrandingCustomization() {
  const { branding, msb, updateBranding } = useBranding();
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Local inputs for text fields to avoid persisting invalid partial hex values
  const [primaryInput, setPrimaryInput] = useState(branding.primaryColor);
  const [secondaryInput, setSecondaryInput] = useState(branding.secondaryColor);
  const [accentInput, setAccentInput] = useState(branding.accentColor);
  const [colorError, setColorError] = useState<string | null>(null);
  
  // Track original branding to detect changes
  const [originalBranding] = useState(branding);
  const [msbName, setMsbName] = useState(msb?.name || '');

  // Update msbName when msb changes
  React.useEffect(() => {
    setMsbName(msb?.name || '');
  }, [msb]);

  // Keep local text inputs in sync when branding changes externally (presets/reset/fetch)
  useEffect(() => {
    setPrimaryInput(branding.primaryColor);
    setSecondaryInput(branding.secondaryColor);
    setAccentInput(branding.accentColor);
  }, [branding.primaryColor, branding.secondaryColor, branding.accentColor]);

  const normalizeHex = (value: string) => {
    let v = value.trim();
    if (!v) return '';
    if (v[0] !== '#') v = `#${v}`;
    if (v.length === 4) {
      // #RGB -> #RRGGBB
      const r = v[1];
      const g = v[2];
      const b = v[3];
      v = `#${r}${r}${g}${g}${b}${b}`;
    }
    return v.toLowerCase();
  };

  const isValidHex = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value);

  const handleColorChange = (colorType: string, value: string) => {
    // This handler is used by color pickers (always valid #RRGGBB)
    const normalized = normalizeHex(value);
    if (!isValidHex(normalized)) {
      setColorError(`Please provide a valid hex color, e.g. ${brand.theme.primary}`);
      return;
    }
    setColorError(null);
    if (colorType === 'primaryColor') setPrimaryInput(normalized);
    if (colorType === 'secondaryColor') setSecondaryInput(normalized);
    if (colorType === 'accentColor') setAccentInput(normalized);
    updateBranding({ [colorType]: normalized });
    setHasUnsavedChanges(true);
  };

  const commitTextColor = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    const normalized = normalizeHex(value);
    if (!isValidHex(normalized)) {
      setColorError(`Please provide a valid hex color, e.g. ${brand.theme.primary}`);
      return;
    }
    setColorError(null);
    updateBranding({ [colorType]: normalized });
    setHasUnsavedChanges(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        updateBranding({ logoUrl: result });
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMsbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsbName(e.target.value);
    setHasUnsavedChanges(true);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    updateBranding({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    });
    setHasUnsavedChanges(true);
  };

  const resetToDefaults = () => {
    updateBranding({
      primaryColor: brand.theme.primary,
      secondaryColor: brand.theme.secondary,
      accentColor: brand.theme.accent,
      logoUrl: undefined
    });
    setLogoPreview(null);
    setLogoFile(null);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBranding({ name: msbName }); // Send name to backend
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save branding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding & Customization</h1>
          <p className="text-gray-600 mt-1">Customize the look and feel of your client portal</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn-secondary ${previewMode ? 'bg-primary-100 text-primary-700 border-primary-300' : ''}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview Mode'}
          </button> */}
          <button onClick={resetToDefaults} className="btn-secondary">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`btn-primary ${hasUnsavedChanges ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Status */}
      {hasUnsavedChanges && !saveSuccess && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save Changes" to apply them to all client portals.
            </p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">
              Branding changes saved successfully! All client portals will now use the updated design.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customization Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* MSB Name Edit */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Type className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">MSB Name</h3>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={msbName}
                onChange={handleMsbNameChange}
                className="input-field text-lg font-semibold"
                placeholder="Enter MSB name"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Upload className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Logo Upload</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {logoPreview || branding.logoUrl ? (
                    <img 
                      src={logoPreview || branding.logoUrl} 
                      alt="Logo preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <span className="sr-only">Choose logo file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload your company logo (PNG, JPG, SVG recommended)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Color Customization */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Color Scheme</h3>
            </div>

            {/* Color Presets */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Custom Colors</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={primaryInput}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryInput}
                      onChange={(e) => { setPrimaryInput(e.target.value); setHasUnsavedChanges(true); }}
                      onBlur={() => commitTextColor('primaryColor', primaryInput)}
                      className="flex-1 input-field text-sm"
                      placeholder={brand.theme.primary}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={secondaryInput}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryInput}
                      onChange={(e) => { setSecondaryInput(e.target.value); setHasUnsavedChanges(true); }}
                      onBlur={() => commitTextColor('secondaryColor', secondaryInput)}
                      className="flex-1 input-field text-sm"
                      placeholder={brand.theme.secondary}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={accentInput}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentInput}
                      onChange={(e) => { setAccentInput(e.target.value); setHasUnsavedChanges(true); }}
                      onBlur={() => commitTextColor('accentColor', accentInput)}
                      className="flex-1 input-field text-sm"
                      placeholder={brand.theme.accent}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {colorError && (
            <div className="mt-2 text-sm text-red-600">{colorError}</div>
          )}

          {/* Theme Options */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Layout className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Theme Options</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme Mode
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={branding.theme === 'light'}
                      onChange={(e) => {
                        updateBranding({ theme: e.target.value as 'light' | 'dark' });
                        setHasUnsavedChanges(true);
                      }}
                      className="mr-2"
                    />
                    Light Mode
                  </label>
                  {/* <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={branding.theme === 'dark'}
                      onChange={(e) => {
                        updateBranding({ theme: e.target.value as 'light' | 'dark' });
                        setHasUnsavedChanges(true);
                      }}
                      className="mr-2"
                    />
                    Dark Mode
                  </label> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Eye className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Mock Header */}
            <div 
              className="p-4 text-white"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <div className="flex items-center space-x-3">
                {(logoPreview || branding.logoUrl) && (
                  <img 
                    src={logoPreview || branding.logoUrl} 
                    alt="Logo" 
                    className="h-8 w-auto bg-white/20 rounded p-1"
                  />
                )}
                <div>
                  <h4 className="font-semibold">{msb?.name || 'Your MSB Name'}</h4>
                  <p className="text-xs opacity-90">Online Banking</p>
                </div>
              </div>
            </div>

            {/* Mock Content */}
            <div className="p-4 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900">Account Balance</h5>
                <span className="text-2xl font-bold" style={{ color: branding.secondaryColor }}>
                  $12,450.00
                </span>
              </div>

              <button 
                className="w-full py-2 px-4 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Transfer Funds
              </button>

              <div className="flex space-x-2">
                <button 
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border"
                  style={{ 
                    borderColor: branding.accentColor,
                    color: branding.accentColor 
                  }}
                >
                  View Statements
                </button>
                <button 
                  className="flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  Pay Bills
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              This preview shows how your branding will appear to your clients in their banking portal.
              {hasUnsavedChanges && " Don't forget to save your changes!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}