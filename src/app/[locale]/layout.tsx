import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '@/app/globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets:  ['vietnamese', 'latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display:  'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-jetbrains-mono',
  display:  'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

import { ScrollRevealProvider } from '@/components/layout/ScrollRevealProvider';

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'vi' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F172A" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ScrollRevealProvider>
            {children}
          </ScrollRevealProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
