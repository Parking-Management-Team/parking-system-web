'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal hook using IntersectionObserver.
 * Adds .visible class to elements with .reveal class when they enter viewport.
 */
export function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);
}
