/** @type {import('next').NextConfig} */
// Whitelist Supabase Storage host (if NEXT_PUBLIC_SUPABASE_URL is set) so that
// next/image can optimize remote brand/category/offer assets in production.
const remotePatterns = [];
try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
        remotePatterns.push({
            protocol: 'https',
            hostname: new URL(url).hostname,
            pathname: '/storage/v1/object/public/**',
        });
    }
} catch { /* ignore malformed URL during build */ }

const nextConfig = {
    images: {
        remotePatterns,
        formats: ['image/avif', 'image/webp'],
    },
    reactStrictMode: true,
};

module.exports = nextConfig;
