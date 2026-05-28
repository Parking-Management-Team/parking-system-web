'use client';

import { ReactNode } from 'react';
import { useScrollReveal } from '@/lib/hooks/useScrollReveal';

interface ScrollRevealProviderProps {
  children: ReactNode;
}

export function ScrollRevealProvider({ children }: ScrollRevealProviderProps) {
  useScrollReveal();
  return <>{children}</>;
}
