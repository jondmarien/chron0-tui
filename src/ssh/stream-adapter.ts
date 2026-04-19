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
  ref: () => void;
  unref: () => void;
}

/**
 * Translate LF → CRLF on bytes written to the channel.
 *
 * On a real terminal, the pty master's line discipline applies the ONLCR
 * flag, converting `\n` to `\r\n` automatically. Over a raw ssh2 channel
 * there is no pty master — Ink's output arrives as `\n`-separated lines
 * and the client's terminal renders each line below the previous one at
 * the same column (the "staircase" effect).
 *
 * We wrap the channel's write to prepend `\r` before any lone `\n`. We
 * preserve existing `\r\n` sequences to avoid emitting `\r\r\n`, and we
 * remember whether the last byte of the previous chunk was `\r` so the
 * translation is correct across chunk boundaries.
 */
function installCrlfTranslation(channel: ServerChannel): void {
  const anyCh = channel as unknown as { write: ServerChannel['write']; __crlfPatched?: boolean };
  if (anyCh.__crlfPatched) return;
  anyCh.__crlfPatched = true;

  const origWrite = channel.write.bind(channel);
  let lastWasCR = false;

  const translate = (buf: Buffer): Buffer => {
    const out: number[] = [];
    for (let i = 0; i < buf.length; i++) {
      const b = buf[i]!;
      if (b === 0x0a /* \n */) {
        const prev = i === 0 ? (lastWasCR ? 0x0d : 0) : buf[i - 1];
        if (prev !== 0x0d) out.push(0x0d);
        out.push(0x0a);
      } else {
        out.push(b);
      }
    }
    lastWasCR = buf.length > 0 && buf[buf.length - 1] === 0x0d;
    return Buffer.from(out);
  };

  (channel as any).write = function patchedWrite(
    chunk: unknown,
    encoding?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void
  ): boolean {
    let buf: Buffer;
    if (Buffer.isBuffer(chunk)) {
      buf = chunk;
    } else if (typeof chunk === 'string') {
      const enc: BufferEncoding = typeof encoding === 'string' ? encoding : 'utf8';
      buf = Buffer.from(chunk, enc);
    } else if (chunk instanceof Uint8Array) {
      buf = Buffer.from(chunk);
    } else {
      // Unknown chunk — pass through untouched.
      return origWrite(chunk as Buffer, encoding as BufferEncoding, cb as any);
    }
    const cbArg = typeof encoding === 'function' ? encoding : cb;
    return origWrite(translate(buf), cbArg);
  };
}

/**
 * Wrap an ssh2 ServerChannel so Ink treats it like a real TTY. Ink reads
 * `.columns` / `.rows` off stdout, listens for `resize`, calls
 * `setRawMode` / `setEncoding` / `ref` / `unref` on stdin, and writes
 * `\n`-terminated lines assuming a pty driver will translate to `\r\n`.
 * A bare ssh2 channel has none of these, so we bolt them on.
 */
export function adaptChannel(
  channel: ServerChannel,
  initialCols: number,
  initialRows: number
): { stdin: TTYStdin; stdout: TTYStdout; stderr: Writable } {
  // Translate LF → CRLF on output so Ink's newline-separated frames render
  // correctly on the client terminal (no pty master here to do it for us).
  installCrlfTranslation(channel);

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
  // Ink calls .ref() / .unref() on stdin when toggling raw mode. On Node
  // these come from the underlying net.Socket, but Bun's Duplex streams
  // don't expose them and an ssh2 channel never does. Noops are safe: the
  // SSH server itself keeps the event loop alive.
  if (typeof stdin.ref !== 'function') {
    stdin.ref = () => { /* noop */ };
  }
  if (typeof stdin.unref !== 'function') {
    stdin.unref = () => { /* noop */ };
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
