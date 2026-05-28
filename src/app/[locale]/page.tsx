import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { UserTypesSection } from '@/components/sections/UserTypesSection';
import { CTASection } from '@/components/sections/CTASection';
import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NexPark — Hệ thống quản lý bãi xe thông minh',
  description: 'NexPark tự động hóa toàn bộ quy trình gửi xe: đặt chỗ, check-in, tính phí. Hiệu quả, minh bạch, thông minh.',
};

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <UserTypesSection />
      <CTASection />
    </main>
  );
}
