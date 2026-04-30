import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/browse`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        // Add more static routes as needed
        // Dynamic routes (brands, categories, offers) should be generated from database
    ]
}
