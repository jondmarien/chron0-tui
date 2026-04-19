import React from "react";
import { render } from "ink";
import type { ServerChannel, PseudoTtyInfo, WindowChangeInfo } from "ssh2";
import { adaptChannel } from "./stream-adapter.js";
import { App } from "../ui/App.js";
import { profile } from "../data/profile.js";
import { community } from "../data/community.js";

export interface SessionLimits {
  idleMs: number; // inactivity cutoff (no keystrokes)
  hardMs: number; // absolute cutoff
}

export const DEFAULT_LIMITS: SessionLimits = {
  idleMs: 5 * 60 * 1000,
  hardMs: 15 * 60 * 1000,
};

export interface SessionMeta {
  ip: string;
  username: string;
}

/**
 * Render the Ink app into an interactive shell channel. Caller should have
 * already handled the pty-req. Returns a cleanup function the SSH server can
 * call on disconnect.
 */
export function startInteractiveSession(
  channel: ServerChannel,
  pty: PseudoTtyInfo,
  meta: SessionMeta,
  limits: SessionLimits = DEFAULT_LIMITS,
): () => void {
  const { stdin, stdout, stderr } = adaptChannel(channel, pty.cols, pty.rows);

  const instance = render(
    React.createElement(App, { visitor: meta.username }),
    {
      stdin: stdin as unknown as NodeJS.ReadStream,
      stdout: stdout as unknown as NodeJS.WriteStream,
      stderr: stderr as unknown as NodeJS.WriteStream,
      exitOnCtrlC: true,
      patchConsole: false,
    },
  );

  // ── resize handling ──────────────────────────────────────────
  // Mutate the wrapper's columns/rows and emit 'resize' on the wrapper —
  // that's the stream Ink subscribed to via useStdout(). The ssh2 channel
  // itself never fires 'resize'.
  const onWindowChange = (info: WindowChangeInfo) => {
    stdout.columns = Math.max(1, info.cols || stdout.columns);
    stdout.rows = Math.max(1, info.rows || stdout.rows);
    stdout.emit("resize");
  };
  (channel as any).on("window-change", onWindowChange);

  // ── idle + hard timeouts ─────────────────────────────────────
  let idleTimer: NodeJS.Timeout;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      try {
        stderr.write("\r\nIdle timeout. Disconnecting.\r\n");
      } catch {}
      cleanup();
    }, limits.idleMs);
  };
  channel.on("data", resetIdle);
  resetIdle();

  const hardTimer = setTimeout(() => {
    try {
      stderr.write("\r\nSession limit reached. Disconnecting.\r\n");
    } catch {}
    cleanup();
  }, limits.hardMs);

  // ── cleanup ──────────────────────────────────────────────────
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearTimeout(idleTimer);
    clearTimeout(hardTimer);
    try {
      instance.unmount();
    } catch {}
    // Stop the channel → stdin pump first so Ink stops getting input.
    try {
      (channel as any).unpipe?.(stdin);
    } catch {}
    try {
      stdin.end();
    } catch {}
    // Drain any pending Ink frame, then close the channel.
    try {
      stdout.end();
    } catch {}
    try {
      stderr.end?.();
    } catch {}
    try {
      channel.end();
    } catch {}
  };

  channel.once("close", cleanup);
  channel.once("end", cleanup);
  channel.once("error", cleanup);

  // When Ink unmounts (user pressed q / ctrl+c), close the channel.
  instance.waitUntilExit().then(cleanup, cleanup);

  return cleanup;
}

/**
 * Render a non-interactive text version of the site for `ssh host command`
 * or clients that don't request a pty.
 */
export function writeTextSnapshot(channel: ServerChannel): void {
  const lines: string[] = [];
  lines.push(`${profile.name}  //  ${profile.alias}`);
  lines.push(profile.tagline.join(" · "));
  lines.push("");
  lines.push(...profile.bio);
  lines.push("");
  lines.push(
    "For the full interactive site, connect with a PTY:  ssh ssh.chron0.tech",
  );
  lines.push("");
  lines.push(`Community: ${community.map((c) => c.name).join(", ")}`);

  channel.write(lines.join("\r\n") + "\r\n");
  channel.exit(0);
  channel.end();
}
