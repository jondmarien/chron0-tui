import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { profile } from '../../data/profile.js';
import { SectionHeader } from '../components/SectionHeader.js';

export function About(): JSX.Element {
  return (
    <Box flexDirection="column">
      <SectionHeader title="about" />

      <Box marginBottom={1}>
        <Text color={theme.dim}>
          <Text color={theme.green}>❯</Text> whoami
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          <Text color={theme.text}>{profile.name} </Text>
          <Text color={theme.accent}>// {profile.alias}</Text>
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.dim}>{profile.tagline.join('  ·  ')}</Text>
      </Box>

      <Box flexDirection="column">
        {profile.bio.map((para, i) => (
          <Box key={i} marginBottom={1}>
            <Text color={theme.dim} wrap="wrap">
              {para}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
