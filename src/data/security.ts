export type WriteupType = 'CVE' | 'CTF' | 'LABS' | 'ANALYSIS' | 'BLOG';

export interface Writeup {
  title: string;
  type: WriteupType;
  description: string;
  url: string;
}

export const writeups: Writeup[] = [
  {
    title: 'The 7-Zip Vulnerability Discovery — CVE-2024-11477',
    type: 'CVE',
    description: '7-Zip MarkZipBook out-of-bounds write. Remote code execution via crafted archive.',
    url: 'https://quartz.chron0.tech/ISSessions/Articles/24-25-Season/Fall-24/Session-5---2024-12-03/The-7-Zip-Vulnerability-Discovery-(CVE-2024-11477)',
  },
  {
    title: 'PaperCut Authentication Bypass — CVE-2023-27350',
    type: 'CVE',
    description: 'Unauthenticated RCE via the PaperCut NG/MF print management platform.',
    url: 'https://quartz.chron0.tech/TryHackMe/PaperCut/PaperCut-CVE-2023-27350',
  },
  {
    title: 'GameFreak Teraleak Analysis',
    type: 'ANALYSIS',
    description: 'Source code leak post-mortem — what was exposed and what it reveals about game dev security.',
    url: 'https://quartz.chron0.tech/ISSessions/Articles/24-25-Season/Fall-24/Session-3---2024-10-29/GameFreak-Teraleak',
  },
  {
    title: 'Mr. Robot CTF — Writeup',
    type: 'CTF',
    description: 'Full walkthrough: robots.txt recon, Hydra brute force, privilege escalation via SUID bit.',
    url: 'https://quartz.chron0.tech/TryHackMe/Mr.-Robot/Mr.-Robot-CTF---Writeup',
  },
  {
    title: 'PortSwigger BSCP Labs',
    type: 'LABS',
    description: 'Web security labs — SQLi, XSS, SSRF, access control, business logic flaws.',
    url: 'https://quartz.chron0.tech/tags/bscp',
  },
  {
    title: "More writeups → Chrono's Cyber Chronicles",
    type: 'BLOG',
    description: 'TryHackMe, HackTheBox, ISSessions CTF writeups — ongoing.',
    url: 'https://quartz.chron0.tech',
  },
];
