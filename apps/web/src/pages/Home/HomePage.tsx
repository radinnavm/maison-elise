import { useGetProductsQuery } from '@/api/productsApi';
import { Seo } from '@/components/Seo/Seo';
import { buildWebsiteJsonLd } from '@/components/Seo/metadata';
import { env } from '@/config/env';

import { EditorialSection } from './EditorialSection';
import { Hero } from './Hero';
import { NewsletterSection } from './NewsletterSection';
import { ProductSection } from './ProductSection';

export function HomePage() {
  const newArrivals = useGetProductsQuery({ sort: 'newest', page: 1, limit: 4 });
  const featured = useGetProductsQuery({ sort: 'featured', page: 1, limit: 4 });

  return (
    <>
      <Seo
        title="Maison Élise — Premium Fashion"
        description="Discover Maison Élise: considered silhouettes, refined textures and timeless pieces designed for the modern wardrobe."
        canonicalPath="/"
        jsonLd={buildWebsiteJsonLd(env.siteUrl)}
      />
      <Hero />
      <ProductSection
        eyebrow="Just landed"
        title="New Arrivals"
        products={newArrivals.data?.data ?? []}
        viewAllTo="/shop?sort=newest"
        priorityCount={4}
      />
      <EditorialSection />
      <ProductSection
        eyebrow="Curated"
        title="Featured Collection"
        products={featured.data?.data ?? []}
        viewAllTo="/shop"
      />
      <NewsletterSection />
    </>
  );
}
