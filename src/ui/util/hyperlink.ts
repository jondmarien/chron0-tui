// OSC 8 clickable terminal hyperlink:
//   ESC ] 8 ; ; URL ST <label> ESC ] 8 ; ; ST
// Modern terminals (Warp, iTerm2, Kitty, WezTerm, GNOME Terminal, Windows Terminal)
// render this as a real clickable link. Older terminals silently show the label only.

const ESC = '\u001B';
const ST = '\u001B\\';

export function osc8(url: string, label: string = url): string {
  return `${ESC}]8;;${url}${ST}${label}${ESC}]8;;${ST}`;
}
