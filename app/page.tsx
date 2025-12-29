import HeroClient from '../components/HeroClient'
import CategoriesClient from '../components/CategoriesClient'
import FeaturedBrandsClient from '../components/FeaturedBrandsClient'
import CategoryRowsClient from '../components/CategoryRowsClient'
import TrustPointsClient from '../components/TrustPointsClient'
import FaqClient from '../components/FaqClient'
import PageAnalytics from '../components/PageAnalytics'

export default function Home() {
  return (
    <main className="py-8">
      <HeroClient />

      <div className="min-h-screen bg-bg pb-20">
        {/* CategoriesClient removed to prevent duplicate/hardcoded display. Use CategoryRowsClient for dynamic islands. */}
        {/* <CategoriesClient /> */}
        <FeaturedBrandsClient />
        <CategoryRowsClient />
        <TrustPointsClient />
        <FaqClient />
      </div>
      <PageAnalytics path="/" />
    </main>
  )
}
