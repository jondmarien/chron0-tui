// Ink/chalk accepts hex strings in most color props.
// Palette mirrors the old CSS variables from the HTML site.

export const theme = {
  bg:       '#0d0d0d',
  surface:  '#111111',
  border:   '#222222',
  text:     '#d4d4d4',
  dim:      '#6e6e6e',
  muted:    '#3a3a3a',
  accent:   '#a78bfa',
  accentD:  '#7c5cc7',
  green:    '#4ec994',
  orange:   '#e8a56e',
  red:      '#e06c75',
  purple:   '#c4a8fb',
} as const;

// Tag → color mapping for project pills (roughly matches the HTML tag classes).
export const tagColor: Record<string, string> = {
  TypeScript:   theme.accent,
  JavaScript:   '#c9a227',
  Python:       theme.green,
  Java:         theme.red,
  Rust:         theme.orange,
  Go:           '#5dc9e8',
  security:     theme.purple,
  'BApp Store': theme.purple,
  C2:           theme.purple,
  web:          '#6db36d',
  mobile:       '#6db36d',
  Expo:         '#6db36d',
  blockchain:   '#6db36d',
  hockey:       '#6db36d',
  Web3:         '#6db36d',
  CTF:          theme.green,
  forensics:    '#6db36d',
  hackathon:    '#6db36d',
  monitoring:   '#6db36d',
  hardware:     '#6db36d',
  music:        '#6db36d',
  AI:           '#6db36d',
  Discord:      '#6db36d',
};

// Writeup type → color
export const writeupTypeColor: Record<string, string> = {
  CVE:      theme.red,
  CTF:      theme.green,
  LABS:     theme.green,
  ANALYSIS: theme.purple,
  BLOG:     theme.purple,
};
