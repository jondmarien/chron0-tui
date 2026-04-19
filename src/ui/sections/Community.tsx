import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { community } from '../../data/community.js';
import { SectionHeader } from '../components/SectionHeader.js';

export function Community(): JSX.Element {
  return (
    <Box flexDirection="column">
      <SectionHeader title="community" />

      {community.map((c) => (
        <Box key={c.name} flexDirection="column" marginBottom={1}>
          <Text color={theme.text} bold>
            {c.name}
          </Text>
          <Text color={theme.accentD}>{c.role}</Text>
          <Text color={theme.dim} wrap="wrap">
            {c.description}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
