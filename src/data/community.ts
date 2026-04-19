export interface CommunityItem {
  name: string;
  role: string;
  description: string;
}

export const community: CommunityItem[] = [
  {
    name: 'BearHacks 2025',
    role: 'Co-Chair',
    description:
      "Co-organized Sheridan College's first-ever hybrid hackathon — 36 hours, 100+ participants, Hazel McCallion campus, March 2025. Now building the web portals for BearHacks 2026.",
  },
  {
    name: 'ISSessions CTF',
    role: 'Coordinator — ISS Club, Sheridan College',
    description:
      'Runs the ISSessions cybersecurity competition series. Built and maintains the live scoreboard tool (CTFd API). Publishes challenge writeups at quartz.chron0.tech.',
  },
  {
    name: 'Canada DevOps Hackathon Toronto',
    role: 'Competitor — Team 1, November 2025',
    description:
      'Built HemoStat — a health vitals monitoring and alert system — during a time-pressured hackathon environment.',
  },
];
