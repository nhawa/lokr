import type { NextConfig } from 'next';
const config: NextConfig = {
  // PDF export is a Node route handler, so this app cannot be a static export.
  poweredByHeader: false,
  serverExternalPackages: ['@playwright/test'],
};
export default config;
