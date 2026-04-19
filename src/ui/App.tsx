import React, { useState, useEffect } from 'react';
import { Box, useApp, useInput, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { StatusBar } from './components/StatusBar.js';
import { About } from './sections/About.js';
import { Projects } from './sections/Projects.js';
import { Security } from './sections/Security.js';
import { Community } from './sections/Community.js';
import { Contact } from './sections/Contact.js';
import { useAppRouter, Section, SECTIONS } from './hooks/useAppRouter.js';

export interface AppProps {
  /** Optional visitor identifier for display/logging. */
  visitor?: string;
}

export function App({ visitor }: AppProps): JSX.Element {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const router = useAppRouter('about');

  // Track status from the Projects section so the status bar & global key
  // handler can adjust (no section-jump while in search/detail).
  const [projectsStatus, setProjectsStatus] = useState({ searching: false, inDetail: false });

  const [cols, setCols] = useState(stdout?.columns ?? 80);
  const [rows, setRows] = useState(stdout?.rows ?? 24);

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => {
      setCols(stdout.columns ?? 80);
      setRows(stdout.rows ?? 24);
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  const lockGlobalKeys =
    router.section === 'projects' && (projectsStatus.searching || projectsStatus.inDetail);

  useInput((input, key) => {
    if (lockGlobalKeys) return;

    // Section shortcuts 1-5
    const n = parseInt(input, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= SECTIONS.length) {
      const s = SECTIONS[n - 1];
      if (s) router.setSection(s);
      return;
    }

    if (key.tab) {
      router.toggleFocus();
      return;
    }

    if (input === 'q') {
      exit();
      return;
    }

    // When sidebar is focused, up/down cycles sections.
    if (router.focus === 'sidebar') {
      if (key.upArrow || input === 'k') router.cycleSection(-1);
      else if (key.downArrow || input === 'j') router.cycleSection(+1);
      else if (key.return) router.setFocus('content');
    }
  });

  // Status bar hints depend on section + focus.
  const hints = buildHints(router.section, router.focus, projectsStatus);

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      <Header width={cols} />

      <Box flexDirection="row" flexGrow={1}>
        <Sidebar section={router.section} focus={router.focus} />
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          {renderSection(router.section, router.focus === 'content', setProjectsStatus)}
        </Box>
      </Box>

      <StatusBar
        section={router.section}
        hints={hints}
        searching={projectsStatus.searching}
      />
    </Box>
  );
}

function renderSection(
  section: Section,
  contentActive: boolean,
  onProjectsStatus: (s: { searching: boolean; inDetail: boolean }) => void
): JSX.Element {
  switch (section) {
    case 'about':
      return <About />;
    case 'projects':
      return <Projects active={contentActive} onStatusChange={onProjectsStatus} />;
    case 'security':
      return <Security active={contentActive} />;
    case 'community':
      return <Community />;
    case 'contact':
      return <Contact />;
  }
}

function buildHints(
  section: Section,
  focus: 'sidebar' | 'content',
  projects: { searching: boolean; inDetail: boolean }
): string[] {
  if (section === 'projects' && projects.searching) {
    return ['type to filter', 'enter apply', 'esc cancel'];
  }
  if (section === 'projects' && projects.inDetail) {
    return ['esc / q back'];
  }
  const base = ['1-5 jump', 'tab switch panel', 'q quit'];
  if (focus === 'sidebar') return ['↑↓/jk move', 'enter focus content', ...base];
  if (section === 'projects') return ['↑↓/jk move', 'enter detail', '/ search', ...base];
  if (section === 'security') return ['↑↓/jk move', ...base];
  return base;
}
