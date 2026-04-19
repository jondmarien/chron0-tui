import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { contact } from '../../data/contact.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { osc8 } from '../util/hyperlink.js';

export function Contact(): JSX.Element {
  return (
    <Box flexDirection="column">
      <SectionHeader title="contact" />

      {contact.map((row) => (
        <Box key={row.label} flexDirection="row">
          <Box width={12}>
            <Text color={theme.muted}>{row.label}</Text>
          </Box>
          <Text color={theme.accentD}>
            {row.url ? osc8(row.url, row.value) : row.value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
