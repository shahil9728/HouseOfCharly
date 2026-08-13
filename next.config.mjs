/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product imagery is referenced by URL from the Google Sheet.
    // Add your own image host here after migrating off the review CDN.
    remotePatterns: [
      { protocol: "https", hostname: "pub.hyperagent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" }
    ],
    formats: ["image/avif", "image/webp"],
    /* Optimised variants are cached for 31 days instead of Next's short
       default. The source images are immutable URLs from the sheet, so there is
       nothing to re-fetch — and every cache miss is a slow first paint for a
       real visitor, which is exactly what Core Web Vitals measures. */
    minimumCacheTTL: 2678400
  },
  poweredByHeader: false,
  reactStrictMode: true
};
export default nextConfig;
