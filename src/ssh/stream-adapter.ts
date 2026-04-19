import type { ServerChannel } from "ssh2";
import { PassThrough, Transform, type Writable } from "node:stream";

export interface TTYStdout extends Transform {
  columns: number;
  rows: number;
  isTTY: true;
  getColorDepth: () => number;
  hasColors: (...args: unknown[]) => boolean;
}

export interface TTYStdin extends PassThrough {
  isTTY: true;
  setRawMode: (raw: boolean) => TTYStdin;
  ref: () => void;
  unref: () => void;
}

/**
 * Translate LF → CRLF on every byte that flows through.
 *
 * On a real terminal the pty master's line discipline applies the ONLCR flag
 * and converts `\n` to `\r\n` automatically. Over a raw ssh2 channel there is
 * no pty master — Ink's output arrives as `\n`-separated lines and the
 * client's terminal renders each line below the previous one at the same
 * column (the "staircase" effect). We translate at the boundary between
 * Ink and the channel so the wire format is always `\r\n`.
 *
 * `lastWasCR` is preserved across chunks so we don't insert a stray `\r`
 * in front of an `\n` that the previous chunk already finished with `\r`.
 */
class CRLFTransform extends Transform {
  private lastWasCR = false;

  override _transform(
    chunk: unknown,
    encoding: BufferEncoding | "buffer",
    callback: (err?: Error | null, data?: Buffer) => void,
  ): void {
    let buf: Buffer;
    if (Buffer.isBuffer(chunk)) {
      buf = chunk;
    } else if (typeof chunk === "string") {
      const enc: BufferEncoding = encoding === "buffer" ? "utf8" : encoding;
      buf = Buffer.from(chunk, enc);
    } else if (chunk instanceof Uint8Array) {
      buf = Buffer.from(chunk);
    } else {
      callback();
      return;
    }

    const out: number[] = [];
    for (let i = 0; i < buf.length; i++) {
      const b = buf[i]!;
      if (b === 0x0a /* \n */) {
        const prev = i === 0 ? (this.lastWasCR ? 0x0d : 0) : buf[i - 1];
        if (prev !== 0x0d) out.push(0x0d);
        out.push(0x0a);
      } else {
        out.push(b);
      }
    }
    this.lastWasCR = buf.length > 0 && buf[buf.length - 1] === 0x0d;
    callback(null, Buffer.from(out));
  }
}

/**
 * Force-install a method as an own data property. Direct assignment can
 * silently fail under Bun when a prototype defines the same name as a
 * non-writable getter (see oven-sh/bun#16718, #22372). `defineProperty`
 * with `configurable: true, writable: true` always wins.
 */
function installMethod<T extends object>(
  target: T,
  name: string,
  fn: (...args: any[]) => any,
): void {
  Object.defineProperty(target, name, {
    value: fn,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

function installValue<T extends object>(
  target: T,
  name: string,
  value: unknown,
): void {
  Object.defineProperty(target, name, {
    value,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

/**
 * Wrap an ssh2 ServerChannel so Ink can treat it like a real TTY.
 *
 * Strategy: never mutate the channel itself. Build dedicated wrapper
 * streams whose properties we fully control, then pipe bytes between
 * them and the channel. This is robust under both Node and Bun, where
 * `Duplex` / socket prototypes can interfere with property assignment
 * on the channel object.
 *
 *   client → channel → stdin (PassThrough) → Ink useInput
 *   Ink render → stdout (CRLFTransform) → channel → client
 */
export function adaptChannel(
  channel: ServerChannel,
  initialCols: number,
  initialRows: number,
): { stdin: TTYStdin; stdout: TTYStdout; stderr: Writable } {
  // ── stdin ───────────────────────────────────────────────────────
  const stdin = new PassThrough() as TTYStdin;
  installValue(stdin, "isTTY", true);
  installMethod(stdin, "setRawMode", function setRawMode(this: TTYStdin) {
    // ssh2 already delivers raw keystrokes; no kernel tty to toggle.
    return this;
  });
  installMethod(stdin, "ref", () => {
    /* SSH server keeps the event loop alive; nothing to ref. */
  });
  installMethod(stdin, "unref", () => {
    /* paired noop with ref(). */
  });

  channel.pipe(stdin);

  // ── stdout ──────────────────────────────────────────────────────
  let cols = Math.max(1, initialCols || 80);
  let rows = Math.max(1, initialRows || 24);

  const stdout = new CRLFTransform() as unknown as TTYStdout;
  Object.defineProperty(stdout, "isTTY", {
    value: true,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  Object.defineProperty(stdout, "columns", {
    get: () => cols,
    set: (v: number) => {
      const n = Number(v);
      cols = Math.max(1, Number.isFinite(n) && n > 0 ? Math.floor(n) : 80);
    },
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty(stdout, "rows", {
    get: () => rows,
    set: (v: number) => {
      const n = Number(v);
      rows = Math.max(1, Number.isFinite(n) && n > 0 ? Math.floor(n) : 24);
    },
    configurable: true,
    enumerable: true,
  });
  installMethod(stdout, "getColorDepth", () => 24);
  installMethod(stdout, "hasColors", () => true);

  // Don't propagate the transform's `end` to the channel — we close the
  // channel explicitly during cleanup.
  stdout.pipe(channel as unknown as Writable, { end: false });

  // ── stderr ──────────────────────────────────────────────────────
  // ssh2 exposes a writable stderr sub-stream. CRLF doesn't matter much
  // here (we mostly write short status lines) but keep a transform for
  // consistency with stdout.
  const stderrTransform = new CRLFTransform();
  stderrTransform.pipe(channel.stderr as unknown as Writable, { end: false });
  const stderr = stderrTransform as unknown as Writable;

  return { stdin, stdout, stderr };
}
