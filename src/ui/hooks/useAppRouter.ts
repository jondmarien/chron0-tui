import { useState, useCallback } from 'react';

export type Section = 'about' | 'projects' | 'security' | 'community' | 'contact';
export type Focus = 'sidebar' | 'content';

export const SECTIONS: Section[] = ['about', 'projects', 'security', 'community', 'contact'];

export function sectionIndex(s: Section): number {
  return SECTIONS.indexOf(s);
}

export interface AppRouter {
  section: Section;
  focus: Focus;
  setSection: (s: Section) => void;
  cycleSection: (delta: 1 | -1) => void;
  toggleFocus: () => void;
  setFocus: (f: Focus) => void;
}

export function useAppRouter(initial: Section = 'about'): AppRouter {
  const [section, setSection] = useState<Section>(initial);
  const [focus, setFocus] = useState<Focus>('sidebar');

  const cycleSection = useCallback((delta: 1 | -1) => {
    setSection((cur) => {
      const idx = SECTIONS.indexOf(cur);
      const next = (idx + delta + SECTIONS.length) % SECTIONS.length;
      return SECTIONS[next]!;
    });
  }, []);

  const toggleFocus = useCallback(() => {
    setFocus((f) => (f === 'sidebar' ? 'content' : 'sidebar'));
  }, []);

  return { section, focus, setSection, cycleSection, toggleFocus, setFocus };
}
