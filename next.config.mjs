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
    formats: ["image/avif", "image/webp"]
  },
  poweredByHeader: false,
  reactStrictMode: true
};
export default nextConfig;
