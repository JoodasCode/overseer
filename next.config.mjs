/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://rxchyyxsipdopwpwnxku.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDA3OTcsImV4cCI6MjA2NDcxNjc5N30.F3B_omEBQwwOwQCKMzk3ImXVPNh_SypgNFAVpC8eiRA',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix cross-origin request warnings
  experimental: {
    allowedDevOrigins: [
      '192.168.1.165',
      'localhost',
      '127.0.0.1'
    ],
    // Enable modern bundling optimizations
    optimizePackageImports: ['lucide-react', '@radix-ui/react-toast'],
  },
  // Performance optimizations - swcMinify is enabled by default in Next.js 15
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  // Add proper webpack configuration for Supabase and performance
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      // Resolve the Supabase realtime-js warning and other Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // Suppress specific critical dependency warnings
      config.module.exprContextCritical = false;
      config.module.unknownContextCritical = false;
    }

    // Performance optimizations
    if (!dev) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
          },
        },
      };
    }

    // Bundle analyzer (enable with ANALYZE=true)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }

    return config;
  },
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Enable compression
  compress: true,
  // Font optimization is handled by Next.js 15 automatically
}

export default nextConfig
