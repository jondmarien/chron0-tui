import React from 'react';
import { Box, Text } from 'ink';
import { banner, portrait } from '../assets.js';
import { theme } from '../theme.js';
import { profile } from '../../data/profile.js';

interface Props {
  width: number;
}

/**
 * Header shows (on wide terminals) the ASCII portrait on the left, the
 * figlet banner on the right, and the tagline under both. On narrow
 * terminals it stacks vertically.
 */
export function Header({ width }: Props): JSX.Element {
  const wide = width >= 100;

  const bannerBlock = (
    <Box flexDirection="column">
      <Text color={theme.accent}>{banner.trimEnd()}</Text>
      <Box marginTop={1}>
        <Text color={theme.dim}>
          // <Text color={theme.accent}>{profile.alias}</Text>  ·  {profile.tagline.join('  ·  ')}
        </Text>
      </Box>
    </Box>
  );

  if (!wide) {
    return (
      <Box flexDirection="column" marginBottom={1} paddingX={1}>
        {bannerBlock}
      </Box>
    );
  }

  return (
    <Box flexDirection="row" marginBottom={1} paddingX={1}>
      <Box marginRight={2}>
        <Text>{portrait.trimEnd()}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} justifyContent="center">
        {bannerBlock}
      </Box>
    </Box>
  );
}
