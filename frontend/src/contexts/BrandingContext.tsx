import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrandingConfig, MSB } from '../types';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/apiFetch';

interface BrandingContextType {
  branding: BrandingConfig;
  msb: MSB | null;
  updateBranding: (config: Partial<BrandingConfig> & { name?: string }) => Promise<void>;
  applyBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default branding config
const defaultBranding: BrandingConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#22c55e',
  accentColor: '#f97316',
  theme: 'light',
  logoUrl: undefined
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const saved = localStorage.getItem('msb_branding');
      if (saved) {
        return JSON.parse(saved) as BrandingConfig;
      }
    } catch (_) {}
    return defaultBranding;
  });
  const [msb, setMsb] = useState<MSB | null>(null);
  const { user } = useAuth();

  // Load MSB branding from backend when user changes
  useEffect(() => {
    const fetchMsb = async () => {
      if (user?.msbId) {
        try {
          const data = await apiFetch(`/msb-admin/${user.msbId}`);
          if (data.msb) {
            setBranding({
              primaryColor: data.msb.primary_color,
              secondaryColor: data.msb.secondary_color,
              accentColor: data.msb.accent_color,
              theme: data.msb.theme,
              logoUrl: data.msb.logo_url,
            });
            setMsb(data.msb);
            localStorage.setItem('msb_branding', JSON.stringify({
              primaryColor: data.msb.primary_color,
              secondaryColor: data.msb.secondary_color,
              accentColor: data.msb.accent_color,
              theme: data.msb.theme,
              logoUrl: data.msb.logo_url,
            }));
            return;
          }
        } catch (error) {
          console.error('Error fetching MSB:', error);
        }
      } else {
        // If no user, fall back to saved branding if available; otherwise default
        try {
          const saved = localStorage.getItem('msb_branding');
          if (saved) {
            setBranding(JSON.parse(saved));
          } else {
            setBranding(defaultBranding);
          }
        } catch (_) {
          setBranding(defaultBranding);
        }
        setMsb(null);
      }
    };
    fetchMsb();
  }, [user]);

  const updateBranding = async (config: Partial<BrandingConfig> & { name?: string }) => {
    // Only update local branding state with BrandingConfig keys
    const { name, ...brandingConfig } = config;
    const newBranding = { ...branding, ...brandingConfig };
    setBranding(newBranding);
    console.log(msb);
    if (msb) {
      const payload: any = {
        primary_color: newBranding.primaryColor,
        secondary_color: newBranding.secondaryColor,
        accent_color: newBranding.accentColor,
        theme: newBranding.theme,
        logo_url: newBranding.logoUrl,
      };
      if (name !== undefined) payload.name = name;
      console.log(payload);
      try {
        const data = await apiFetch(`/msb-admin/branding/${msb.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        // Update state with backend response
        if (data.msb) {
          setBranding({
            primaryColor: data.msb.primary_color,
            secondaryColor: data.msb.secondary_color,
            accentColor: data.msb.accent_color,
            theme: data.msb.theme,
            logoUrl: data.msb.logo_url,
          });
          setMsb({ ...msb, ...data.msb });
          localStorage.setItem('msb_branding', JSON.stringify({
            primaryColor: data.msb.primary_color,
            secondaryColor: data.msb.secondary_color,
            accentColor: data.msb.accent_color,
            theme: data.msb.theme,
            logoUrl: data.msb.logo_url,
          }));
        }
      } catch (error) {
        console.error('Failed to update branding:', error);
      }
    } else {
      // fallback: just update local state
      setBranding(newBranding);
    }
    // Immediately apply the branding changes
    applyBrandingToDOM(newBranding);
  };

  const applyBranding = () => {
    applyBrandingToDOM(branding);
  };

  const applyBrandingToDOM = (brandingConfig: BrandingConfig) => {
    const root = document.documentElement;
    // Apply theme mode class for Tailwind dark variants if configured
    if (brandingConfig.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Compute a range of primary shades so commonly used utility classes map correctly
    root.style.setProperty('--color-primary-50', adjustBrightness(brandingConfig.primaryColor, 65));
    root.style.setProperty('--color-primary-100', adjustBrightness(brandingConfig.primaryColor, 50));
    root.style.setProperty('--color-primary-200', adjustBrightness(brandingConfig.primaryColor, 35));
    root.style.setProperty('--color-primary-300', adjustBrightness(brandingConfig.primaryColor, 20));
    root.style.setProperty('--color-primary-400', adjustBrightness(brandingConfig.primaryColor, 10));
    root.style.setProperty('--color-primary-500', brandingConfig.primaryColor);
    root.style.setProperty('--color-primary-600', adjustBrightness(brandingConfig.primaryColor, -20));
    root.style.setProperty('--color-primary-700', adjustBrightness(brandingConfig.primaryColor, -40));
    root.style.setProperty('--color-primary-800', adjustBrightness(brandingConfig.primaryColor, -55));
    root.style.setProperty('--color-primary-900', adjustBrightness(brandingConfig.primaryColor, -70));
    root.style.setProperty('--color-secondary-500', brandingConfig.secondaryColor);
    root.style.setProperty('--color-accent-500', brandingConfig.accentColor);
    
    // Also update Tailwind CSS custom properties
    root.style.setProperty('--tw-color-primary-50', getComputedStyle(root).getPropertyValue('--color-primary-50'));
    root.style.setProperty('--tw-color-primary-100', getComputedStyle(root).getPropertyValue('--color-primary-100'));
    root.style.setProperty('--tw-color-primary-200', getComputedStyle(root).getPropertyValue('--color-primary-200'));
    root.style.setProperty('--tw-color-primary-300', getComputedStyle(root).getPropertyValue('--color-primary-300'));
    root.style.setProperty('--tw-color-primary-400', getComputedStyle(root).getPropertyValue('--color-primary-400'));
    root.style.setProperty('--tw-color-primary-500', brandingConfig.primaryColor);
    root.style.setProperty('--tw-color-primary-600', adjustBrightness(brandingConfig.primaryColor, -20));
    root.style.setProperty('--tw-color-primary-700', adjustBrightness(brandingConfig.primaryColor, -40));
    root.style.setProperty('--tw-color-secondary-500', brandingConfig.secondaryColor);
    root.style.setProperty('--tw-color-accent-500', brandingConfig.accentColor);
  };

  useEffect(() => {
    applyBranding();
  }, [branding]);

  // Apply saved branding immediately on mount to avoid flash of default
  useEffect(() => {
    try {
      const saved = localStorage.getItem('msb_branding');
      if (saved) {
        const parsed = JSON.parse(saved) as BrandingConfig;
        applyBrandingToDOM(parsed);
      } else {
        applyBrandingToDOM(branding);
      }
    } catch (_) {
      applyBrandingToDOM(branding);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, msb, updateBranding, applyBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

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