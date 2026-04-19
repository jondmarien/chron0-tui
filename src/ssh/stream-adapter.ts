import type { ServerChannel } from 'ssh2';
import type { Writable, Readable } from 'node:stream';

export interface TTYStdout extends Writable {
  columns: number;
  rows: number;
  isTTY: true;
  getColorDepth?: () => number;
  hasColors?: (...args: unknown[]) => boolean;
}

export interface TTYStdin extends Readable {
  isTTY: true;
  setRawMode: (raw: boolean) => void;
  setEncoding: (encoding: BufferEncoding) => this;
}

/**
 * Wrap an ssh2 ServerChannel so Ink treats it like a real TTY. Ink reads
 * `.columns` / `.rows` off stdout, listens for `resize`, and calls
 * `setRawMode` / `setEncoding` on stdin. A bare channel has none of these,
 * so we bolt them on.
 *
 * Returns the same underlying channel cast to each interface. Mutating
 * `stdout.columns` / `stdout.rows` and emitting `'resize'` triggers an Ink
 * re-layout.
 */
export function adaptChannel(
  channel: ServerChannel,
  initialCols: number,
  initialRows: number
): { stdin: TTYStdin; stdout: TTYStdout; stderr: Writable } {
  // Decorate stdout-side.
  const stdout = channel as unknown as TTYStdout;
  stdout.columns = Math.max(1, initialCols || 80);
  stdout.rows = Math.max(1, initialRows || 24);
  stdout.isTTY = true;
  if (typeof stdout.getColorDepth !== 'function') {
    stdout.getColorDepth = () => 24; // 24-bit truecolor — terminals negotiate down if needed
  }
  if (typeof stdout.hasColors !== 'function') {
    stdout.hasColors = () => true;
  }

  // Decorate stdin-side. The ssh2 channel is bidirectional, so it's the same
  // object, but we expose a different type so Ink's input code is happy.
  const stdin = channel as unknown as TTYStdin;
  stdin.isTTY = true;
  if (typeof stdin.setRawMode !== 'function') {
    stdin.setRawMode = () => {
      /* ssh2 already gives us raw keystrokes; nothing to toggle */
    };
  }
  // Ink calls .setEncoding('utf8'); ssh2 channels are duplex streams which
  // already support setEncoding, so this is usually a no-op — keep it safe.
  if (typeof stdin.setEncoding !== 'function') {
    stdin.setEncoding = function (this: TTYStdin) {
      return this;
    };
  }

  const stderr = channel.stderr as unknown as Writable;

  return { stdin, stdout, stderr };
}
