import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      // Dev local-disk uploads served by the API
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // @coinbase/cdp-sdk (pulled transitively by RainbowKit's Base Account
  // connector) references optional @x402/* payment packages we don't use.
  // Ignore them so the bundler doesn't fail resolving optional deps.
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// }),
    );
    return config;
  },
};

export default nextConfig;
