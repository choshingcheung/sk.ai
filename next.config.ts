import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Handle ONNX files
    config.module.rules.push({
      test: /\.onnx$/,
      use: 'file-loader',
    });
    
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      buffer: false,
      stream: false,
      util: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
    };

    // Handle WASM files for ONNX.js
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Ignore server-side imports for client-only libraries
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp$': false,
        'onnxruntime-node$': false,
      };
    }
    
    return config;
  },
  
  // Ensure static files are served properly
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // Cache for 24 hours
          },
        ],
      },
    ];
  },
};

export default nextConfig;
