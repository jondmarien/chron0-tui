import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { Section, SECTIONS, sectionIndex } from '../hooks/useAppRouter.js';

interface Props {
  section: Section;
  hints: string[];
  searching?: boolean;
}

export function StatusBar({ section, hints, searching = false }: Props): JSX.Element {
  const idx = sectionIndex(section) + 1;
  const total = SECTIONS.length;
  const mode = searching ? 'SEARCH' : 'NAV';

  return (
    <Box
      borderStyle="single"
      borderColor={theme.border}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text color={theme.dim}>{hints.join('  ·  ')}</Text>
      <Text color={theme.muted}>
        [{mode}]  {section}  {idx}/{total}
      </Text>
    </Box>
  );
}
