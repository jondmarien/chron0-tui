import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { profile } from '../../data/profile.js';
import { sidebarLinks } from '../../data/links.js';
import { SECTIONS, Section, Focus } from '../hooks/useAppRouter.js';
import { osc8 } from '../util/hyperlink.js';

interface Props {
  section: Section;
  focus: Focus;
}

const ICONS: Record<Section, string> = {
  about: '~',
  projects: '⌥',
  security: '⚑',
  community: '◈',
  contact: '@',
};

export function Sidebar({ section, focus }: Props): JSX.Element {
  const focused = focus === 'sidebar';

  return (
    <Box flexDirection="column" width={20} paddingX={1} paddingY={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.accent}>{profile.handle}</Text>
        <Text color={theme.dim}>{profile.name}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.muted}>NAVIGATION</Text>
        {SECTIONS.map((s, i) => {
          const active = s === section;
          const marker = active ? (focused ? '▶' : '›') : ' ';
          const color = active ? theme.accent : theme.dim;
          return (
            <Text key={s} color={color}>
              {marker} {ICONS[s]} {s}
              <Text color={theme.muted}> [{i + 1}]</Text>
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column">
        <Text color={theme.muted}>LINKS</Text>
        {sidebarLinks.map((link) => (
          <Text key={link.label} color={theme.dim}>
            {' • '}
            {osc8(link.url, link.label)}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
