/**
 * CountUp Component - Hiệu ứng đếm số tăng dần
 *
 * Khi người dùng cuộn đến phần tử này, số sẽ tự động đếm từ 0 đến giá trị end.
 * Dùng cho thống kê trên landing page: "500+", "10K+", "99.8%"
 *
 * @param end - Giá trị cuối cùng (ví dụ: 500)
 * @param duration - Thời gian đếm (ms, mặc định 2000)
 * @param suffix - Ký tự thêm sau số (ví dụ: "+", "K+", "%")
 * @param decimals - Số thập phân (ví dụ: 99.8 → decimals=1)
 *
 * @example
 * <CountUp end={500} suffix="+" />         → "500+"
 * <CountUp end={99.8} suffix="%" decimals={1} />  → "99.8%"
 */

'use client'

import { useState, useEffect, useRef } from 'react'

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({ 
  end, 
  duration = 2000, 
  suffix = '', 
  decimals = 0 
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    let animationFrameId: number;
    hasAnimated.current = false; // Reset on setup to handle strict mode double-firing and fast refresh
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress * (2 - progress); // Ease out quad
            setCount(easeProgress * end);
            if (progress < 1) {
              animationFrameId = window.requestAnimationFrame(step);
            }
          };
          animationFrameId = window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration]);

  return (
    <span ref={elementRef}>
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}
