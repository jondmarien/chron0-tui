import React from 'react';
import { Box, Text, useInput } from 'ink';
import { theme, writeupTypeColor } from '../theme.js';
import { writeups } from '../../data/security.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { osc8 } from '../util/hyperlink.js';
import { useListNav } from '../hooks/useListNav.js';

export function Security({ active }: { active: boolean }): JSX.Element {
  const { index, move } = useListNav(writeups.length, active);

  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') move(-1);
      else if (key.downArrow || input === 'j') move(+1);
    },
    { isActive: active }
  );

  return (
    <Box flexDirection="column">
      <SectionHeader title="security research" />

      {writeups.map((w, i) => {
        const selected = i === index;
        return (
          <Box key={w.title} flexDirection="column" marginBottom={1}>
            <Text>
              <Text color={selected ? theme.accent : theme.muted}>
                {selected ? '▶ ' : '  '}
              </Text>
              <Text color={writeupTypeColor[w.type] ?? theme.dim}>[{w.type}]</Text>
              <Text> </Text>
              <Text color={selected ? theme.text : theme.dim} bold={selected}>
                {w.title}
              </Text>
            </Text>
            {selected && (
              <Box paddingLeft={4} flexDirection="column">
                <Text color={theme.dim} wrap="wrap">
                  {w.description}
                </Text>
                <Text color={theme.accentD}>{osc8(w.url, w.url)}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
