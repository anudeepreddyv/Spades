import { useState, useEffect } from 'react';

export function useScreenSize() {
  const [size, setSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const handler = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  const w = size.w;
  const h = size.h;
  const isMobile = w < 500;       // phones
  const isTablet = w >= 500 && w < 900; // tablets/small laptops
  const isDesktop = w >= 900;

  return { w, h, isMobile, isTablet, isDesktop };
}
