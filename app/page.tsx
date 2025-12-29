import HeroClient from '../components/HeroClient'
import CategoriesClient from '../components/CategoriesClient'
import FeaturedBrandsClient from '../components/FeaturedBrandsClient'
import TrustPointsClient from '../components/TrustPointsClient'
import FaqClient from '../components/FaqClient'
import PageAnalytics from '../components/PageAnalytics'

export default function Home() {
  return (
    <main className="py-8">
      <HeroClient />

      <div className="container max-w-[1200px] mt-8">
        <h2 className="text-xl font-bold tracking-tight">Categorias</h2>
        <p className="mt-1 text-sm text-muted">Explore categorias para encontrar as melhores ofertas.</p>
        <CategoriesClient />
        <FeaturedBrandsClient />
        <TrustPointsClient />
        <FaqClient />
      </div>
      <PageAnalytics path="/" />
    </main>
  )
}
