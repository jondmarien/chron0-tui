export type ProjectTag =
  | 'TypeScript'
  | 'JavaScript'
  | 'Python'
  | 'Java'
  | 'Rust'
  | 'Go'
  | 'security'
  | 'web'
  | 'blockchain'
  | 'hockey'
  | 'mobile'
  | 'Expo'
  | 'CTF'
  | 'forensics'
  | 'music'
  | 'AI'
  | 'Discord'
  | 'hackathon'
  | 'monitoring'
  | 'hardware'
  | 'BApp Store'
  | 'Web3'
  | 'C2';

export interface Project {
  name: string;
  description: string;
  tags: ProjectTag[];
  url: string;
  linkLabel: string;
}

export const projects: Project[] = [
  {
    name: 'D-Sports',
    description:
      'Sports + blockchain fan engagement platform. Hockey-focused. Pack opening, digital collectibles, crypto wallets, global leaderboards. 100+ users, 3 countries.',
    tags: ['TypeScript', 'blockchain', 'hockey'],
    url: 'https://d-sports.org',
    linkLabel: 'd-sports.org',
  },
  {
    name: 'BearHacks Web Portals',
    description:
      "Registration and admin portals for BearHacks 2026 — Sheridan College's hybrid hackathon. Actively in development.",
    tags: ['TypeScript', 'web'],
    url: 'https://github.com/jondmarien/bearhacks-web-portals',
    linkLabel: 'github',
  },
  {
    name: 'Nexus C2',
    description:
      'Python C2 framework. Encrypted agent comms (Fernet), Rich TUI operator console, multi-platform payload delivery (Windows/Linux/macOS), Gatekeeper bypass, screenshot/webcam capture, hardware fingerprinting, loot auto-save, Ghost VPN social-engineering landing page. Live at c2.chron0.tech.',
    tags: ['Python', 'security', 'C2'],
    url: 'https://c2.chron0.tech',
    linkLabel: 'c2.chron0.tech',
  },
  {
    name: 'Automotive Security Capstone',
    description:
      'RTL-SDR V4 + Raspberry Pi Pico W for real-time automotive RF/NFC security monitoring. Detects jamming, replay attacks, and brute force on wireless car entry. Rich CLI dashboard with session export.',
    tags: ['Python', 'security', 'hardware'],
    url: 'https://github.com/jondmarien/automotive-security-capstone',
    linkLabel: 'github',
  },
  {
    name: 'Burpcord',
    description:
      'BurpSuite extension for Discord rich presence. Shows your active scan target and state in your Discord status. Published to the PortSwigger BApp Store.',
    tags: ['Java', 'security', 'BApp Store'],
    url: 'https://github.com/jondmarien/Burpcord',
    linkLabel: 'bappstore',
  },
  {
    name: 'Health Companion',
    description:
      'Personal health app monorepo. Expo Router mobile app (iOS/Android/Web) + Express API + PostgreSQL + Drizzle ORM. pnpm workspace with generated OpenAPI types and React Native client.',
    tags: ['TypeScript', 'mobile', 'Expo'],
    url: 'https://github.com/jondmarien/Health-Companion-Plan',
    linkLabel: 'github',
  },
  {
    name: 'CTFd Live Scoreboard',
    description:
      'Real-time scoreboard overlay for CTFd. Used at ISSessions competitions — live-polls the CTFd API and renders rankings.',
    tags: ['TypeScript', 'CTF'],
    url: 'https://github.com/jondmarien/ctfd-live-scoreboard',
    linkLabel: 'github',
  },
  {
    name: 'MemoryAnalysis.Powershell',
    description:
      'PowerShell module wrapping vol3, pyo3, and .NET for memory dump forensics. Includes a Rust bridge for performance-critical analysis paths.',
    tags: ['Rust', 'security', 'forensics'],
    url: 'https://github.com/jondmarien/MemoryAnalysis.Powershell',
    linkLabel: 'github',
  },
  {
    name: 'QRCoder',
    description: 'Custom QR code generator — branded QR codes with logo embedding and styling options.',
    tags: ['TypeScript', 'web'],
    url: 'https://github.com/jondmarien/qrcoder',
    linkLabel: 'github',
  },
  {
    name: 'MediaCoder',
    description: 'Media file converter and background removal tool. Built alongside QRCoder as a personal utility duo.',
    tags: ['TypeScript', 'web'],
    url: 'https://github.com/jondmarien/mediacoder',
    linkLabel: 'github',
  },
  {
    name: 'HemoStat',
    description:
      'Health vitals monitoring and alert system. Canada DevOps Hackathon Toronto, Nov 2025 — Team 1 project.',
    tags: ['Python', 'hackathon', 'monitoring'],
    url: 'https://github.com/jondmarien/HemoStat',
    linkLabel: 'github',
  },
  {
    name: 'TuneFlow',
    description:
      'YouTube description/chapters/comments parser that auto-generates Spotify, YouTube, SoundCloud, and Apple Music playlists.',
    tags: ['TypeScript', 'music'],
    url: 'https://github.com/jondmarien/TuneFlow',
    linkLabel: 'github',
  },
  {
    name: 'dVulnDB',
    description:
      'Web3 vulnerability disclosure and bug bounty platform. On-chain vuln registry with structured disclosure flows for security researchers.',
    tags: ['TypeScript', 'security', 'Web3'],
    url: 'https://github.com/jondmarien/dVulnDB',
    linkLabel: 'github',
  },
  {
    name: 'Contextual',
    description:
      'AI-powered GIF picker for Discord. Reads conversation context and suggests the perfect reaction GIF.',
    tags: ['Python', 'AI', 'Discord'],
    url: 'https://github.com/jondmarien/contextual-discord',
    linkLabel: 'github',
  },
  {
    name: 'Advent of Code 2025',
    description: 'AoC 2025 solutions written in Go — language learning through competitive algorithmic puzzles.',
    tags: ['Go'],
    url: 'https://github.com/jondmarien/AoC-2025',
    linkLabel: 'github',
  },
];
