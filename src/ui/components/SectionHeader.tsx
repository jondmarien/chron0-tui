import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export function SectionHeader({ title }: { title: string }): JSX.Element {
  return (
    <Box marginBottom={1}>
      <Text>
        <Text color={theme.accent}>#</Text> <Text color={theme.text}>{title}</Text>
      </Text>
    </Box>
  );
}
