import { HeroSlider } from '../components/home/HeroSlider';
import { Categories } from '../components/home/Categories';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { Bestsellers } from '../components/home/Bestsellers';
import { OfferBanner } from '../components/home/OfferBanner';
import { SEO } from '../components/seo/SEO';

export function Home() {
  return (
    <>
      <SEO path="/" />
      <HeroSlider />
      <Categories />
      <FeaturedProducts />
      <OfferBanner />
      <Bestsellers />
    </>
  );
}
