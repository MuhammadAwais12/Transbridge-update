import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrandingConfig, MSB } from '../types';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/apiFetch';
import { brand, colorShades } from '../config/brand';

interface BrandingContextType {
  branding: BrandingConfig;
  msb: MSB | null;
  updateBranding: (config: Partial<BrandingConfig> & { name?: string }) => Promise<void>;
  applyBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default branding (Glacier Crest, from src/config/brand.ts), used when no MSB branding is loaded.
// logoUrl stays undefined: components fall back to the static brand logo in public/brand/, so the
// default logo is never written to an MSB record by updateBranding.
const defaultBranding: BrandingConfig = {
  primaryColor: brand.theme.primary,
  secondaryColor: brand.theme.secondary,
  accentColor: brand.theme.accent,
  theme: brand.theme.mode,
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
    // Full 50-950 scales for each role (same shade function as the Tailwind defaults in brand.ts);
    // the primary-*/secondary-*/accent-* Tailwind colours read these variables.
    const roles = {
      primary: brandingConfig.primaryColor || defaultBranding.primaryColor,
      secondary: brandingConfig.secondaryColor || defaultBranding.secondaryColor,
      accent: brandingConfig.accentColor || defaultBranding.accentColor,
    };
    for (const [role, hex] of Object.entries(roles)) {
      for (const [shade, value] of Object.entries(colorShades(hex))) {
        root.style.setProperty(`--color-${role}-${shade}`, value);
        root.style.setProperty(`--tw-color-${role}-${shade}`, value);
      }
    }
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

