export interface ContactRow {
  label: string;
  value: string;
  url?: string;
}

export const contact: ContactRow[] = [
  { label: 'email',    value: 'jon@d-sports.org',      url: 'mailto:jon@d-sports.org' },
  { label: 'github',   value: 'jondmarien',            url: 'https://github.com/jondmarien' },
  { label: 'linkedin', value: 'jondmarien',            url: 'https://linkedin.com/in/jondmarien' },
  { label: 'site',     value: 'chron0.link',           url: 'https://chron0.link' },
  { label: 'blog',     value: 'quartz.chron0.tech',    url: 'https://quartz.chron0.tech' },
  { label: 'twitch',   value: 'sirchronoblaze',        url: 'https://twitch.tv/sirchronoblaze' },
];
