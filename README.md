# chron0-tui

Jon Marien's portfolio, rendered as an interactive TUI over SSH.

```
ssh ssh.chron0.tech
```

## Stack
- **Ink 5** (React for the terminal) + TypeScript
- **ssh2** (pure-JS SSH server)
- **figlet** for the name banner, **asciify-image** for the portrait (both rendered at build time into `assets/*.txt`)

## Development

```sh
bun install
bun run gen-assets   # one-time: build portrait.txt + banner.txt from assets/source/me.jpg
bun run dev          # starts the SSH server on :2222 with a local host key
# in another terminal:
ssh -p 2222 anyone@localhost
```

Any username / any key / no key is accepted — it's a read-only portfolio.

## Production
See `deploy/DEPLOY.md`.

## Layout
```
src/
  index.ts              entrypoint
  ssh/                  ssh2 server + channel ↔ ink plumbing
  ui/                   Ink components, sections, hooks, theme
  data/                 content (bio, projects, writeups, etc.)
assets/
  source/me.jpg         portrait input
  portrait.txt          generated
  banner.txt            generated
scripts/gen-assets.mjs  build-time asset generator
deploy/                 droplet provisioning
```
