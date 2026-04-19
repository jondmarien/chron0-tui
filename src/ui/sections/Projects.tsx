import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { theme, tagColor } from '../theme.js';
import { projects, Project } from '../../data/projects.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { osc8 } from '../util/hyperlink.js';
import { useListNav } from '../hooks/useListNav.js';

interface Props {
  active: boolean;
  onStatusChange?: (s: { searching: boolean; inDetail: boolean }) => void;
}

export function Projects({ active, onStatusChange }: Props): JSX.Element {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [detail, setDetail] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query]);

  const { index, move, setIndex } = useListNav(filtered.length, active && !searching && !detail);

  // Report status up so StatusBar/keybinds adapt.
  React.useEffect(() => {
    onStatusChange?.({ searching, inDetail: !!detail });
  }, [searching, detail, onStatusChange]);

  useInput(
    (input, key) => {
      if (detail) {
        if (key.escape || input === 'q') setDetail(null);
        return;
      }

      if (searching) {
        if (key.escape) {
          setSearching(false);
        } else if (key.return) {
          setSearching(false);
        }
        return;
      }

      if (input === '/') {
        setSearching(true);
        return;
      }
      if (key.upArrow || input === 'k') move(-1);
      else if (key.downArrow || input === 'j') move(+1);
      else if (key.return) {
        const p = filtered[index];
        if (p) setDetail(p);
      } else if (input === 'c' && query) {
        setQuery('');
        setIndex(0);
      }
    },
    { isActive: active }
  );

  if (detail) {
    return <ProjectDetail project={detail} />;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader title={`projects  (${filtered.length}/${projects.length})`} />

      <Box marginBottom={1}>
        <Text color={searching ? theme.accent : theme.dim}>/</Text>
        <Text> </Text>
        {searching ? (
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={() => setSearching(false)}
            placeholder="type to filter, enter to apply, esc to cancel"
          />
        ) : (
          <Text color={theme.dim}>
            {query ? (
              <>
                <Text color={theme.text}>{query}</Text>
                <Text color={theme.muted}>   (press `c` to clear)</Text>
              </>
            ) : (
              'press / to search'
            )}
          </Text>
        )}
      </Box>

      <Box flexDirection="column">
        {filtered.length === 0 ? (
          <Text color={theme.dim}>no projects match `{query}`</Text>
        ) : (
          filtered.map((p, i) => {
            const selected = i === index;
            return (
              <Box key={p.name} flexDirection="column" marginBottom={0}>
                <Text>
                  <Text color={selected ? theme.accent : theme.muted}>
                    {selected ? '▶ ' : '  '}
                  </Text>
                  <Text color={selected ? theme.text : theme.dim} bold={selected}>
                    {p.name}
                  </Text>
                </Text>
                {selected && (
                  <Box paddingLeft={4} flexDirection="column">
                    <Text color={theme.dim} wrap="wrap">
                      {p.description}
                    </Text>
                    <Box marginTop={0}>
                      <Text>
                        {p.tags.map((t, idx) => (
                          <Text key={t} color={tagColor[t] ?? theme.dim}>
                            {idx > 0 ? ' ' : ''}[{t}]
                          </Text>
                        ))}
                      </Text>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

function ProjectDetail({ project }: { project: Project }): JSX.Element {
  return (
    <Box flexDirection="column">
      <SectionHeader title={`projects / ${project.name}`} />

      <Box marginBottom={1}>
        <Text color={theme.accent} bold>
          {project.name}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          {project.tags.map((t, i) => (
            <Text key={t} color={tagColor[t] ?? theme.dim}>
              {i > 0 ? '  ' : ''}[{t}]
            </Text>
          ))}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.text} wrap="wrap">
          {project.description}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.dim}>link: </Text>
        <Text color={theme.accentD}>{osc8(project.url, project.url)}</Text>
      </Box>

      <Text color={theme.muted}>[esc / q] back to list</Text>
    </Box>
  );
}
