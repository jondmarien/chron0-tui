import { useState, useEffect } from 'react';

export function useListNav(length: number, enabled = true) {
  const [index, setIndex] = useState(0);

  // If list shrinks (e.g. search filtering), clamp index in-bounds.
  useEffect(() => {
    if (length === 0) {
      setIndex(0);
    } else if (index >= length) {
      setIndex(length - 1);
    }
  }, [length, index]);

  function move(delta: number) {
    if (!enabled || length === 0) return;
    setIndex((i) => (i + delta + length) % length);
  }

  return { index, setIndex, move };
}
