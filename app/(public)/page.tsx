import HeroClient from '../../components/HeroClient'
import FeaturedBrandsClient from '../../components/FeaturedBrandsClient'
import CategoryRowsClient from '../../components/CategoryRowsClient'
import TrustPointsClient from '../../components/TrustPointsClient'
import FaqClient from '../../components/FaqClient'
import PageAnalytics from '../../components/PageAnalytics'
import { getHomePageData } from '../../lib/home-data'

export const revalidate = 60

export default async function Home() {
  const { siteContent, featuredBrands, categoryRows } = await getHomePageData()

  return (
    <main className="py-8">
      <HeroClient data={siteContent} />

      <div className="min-h-screen bg-bg pb-20">
        <FeaturedBrandsClient data={featuredBrands} />
        <CategoryRowsClient data={categoryRows} />
        <TrustPointsClient
          data={{
            trust_points: siteContent.trust_points,
            trust_points_title: siteContent.trust_points_title,
          }}
        />
        <FaqClient
          data={{
            faqs: siteContent.faqs,
            faq_title: siteContent.faq_title,
          }}
        />
      </div>
      <PageAnalytics path="/" />
    </main>
  )
}
