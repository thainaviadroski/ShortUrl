import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // geoip-lite reads its .dat files via a `__dirname`-relative fs.readFileSync
  // at runtime. Bundling it rewrites that path and breaks the lookup, so it
  // must stay a native `require` instead.
  serverExternalPackages: ['geoip-lite'],
  outputFileTracingIncludes: {
    '/*': ['node_modules/geoip-lite/data/**/*'],
  },
};

export default nextConfig;
