import { Helmet } from 'react-helmet-async';
import { HeroSlider } from '../components/home/HeroSlider';
import { Categories } from '../components/home/Categories';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { Bestsellers } from '../components/home/Bestsellers';
import { OfferBanner } from '../components/home/OfferBanner';

export function Home() {
  return (
    <>
      <Helmet>
        <title>Ahmad Collection — Premium Natural Products in Bangladesh</title>
        <meta
          name="description"
          content="Shop premium mustard oil, honey, ghee, dates, spices and more. 100% natural, delivered nationwide. সুলভ মূল্যে, বিশ্বস্ততার সঙ্গে।"
        />
      </Helmet>
      <HeroSlider />
      <Categories />
      <FeaturedProducts />
      <OfferBanner />
      <Bestsellers />
    </>
  );
}
