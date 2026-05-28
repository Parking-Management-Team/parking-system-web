import { ReactNode } from 'react';

// Since we have a `[locale]` layout, this root layout is only necessary to request the
// simplest rendering of the children. Next-intl will handle the rest in the localized layout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
