'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false);

  useEffect(() => {
    const onChange = (event: MediaQueryListEvent) => {
      setValue(event.matches);
    };

    const result = window.matchMedia(query);
    setValue(result.matches);

    // Modern browsers support addEventListener, fallback to addListener for older engines
    if (result.addEventListener) {
      result.addEventListener('change', onChange);
    } else {
      result.addListener(onChange);
    }

    return () => {
      if (result.removeEventListener) {
        result.removeEventListener('change', onChange);
      } else {
        result.removeListener(onChange);
      }
    };
  }, [query]);

  return value;
}
