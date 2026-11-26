import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { brand } from './src/config/brand';

/** Fills %BRAND_*% placeholders in index.html from src/config/brand.ts (single source of truth). */
function brandHtml(): Plugin {
  const values: Record<string, string> = {
    BRAND_NAME: brand.name,
    BRAND_THEME_COLOR: brand.theme.primary,
    BRAND_FAVICON: brand.favicon,
    BRAND_APPLE_TOUCH_ICON: brand.appleTouchIcon,
  };
  return {
    name: 'brand-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/%(BRAND_[A-Z_]+)%/g, (m, key: string) => values[key] ?? m),
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [brandHtml(), react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  esbuild: command === "build" 
    ? { drop: ["console", "debugger"] } 
    : undefined
}));
