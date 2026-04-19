import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import ssh2 from 'ssh2';
import { createServer, listen } from '../../src/ssh/server.js';

const tmp = path.join(os.tmpdir(), `chron0-tui-test-${randomBytes(6).toString('hex')}.key`);

const config = {
  host: '127.0.0.1',
  port: 0, // random
  hostKeyPath: tmp,
  maxConnections: 5,
  maxPerIp: 5,
  limits: { idleMs: 60_000, hardMs: 60_000 },
  banner: undefined,
};

describe('ssh server', () => {
  const server = createServer(config as any);
  let boundPort = 0;

  afterAll(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      })
  );

  it('accepts a connection, requests a pty+shell, receives a frame', async () => {
    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        boundPort = (server as any).address().port;
        resolve();
      });
      server.on('error', reject);
    });

    // `listen` helper isn't used here because we need the dynamic port.
    void listen; // silence unused-import warnings in watch mode

    const client = new ssh2.Client();

    const output = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const timer = setTimeout(() => reject(new Error('no frame received')), 5000);

      client
        .on('ready', () => {
          client.shell({ term: 'xterm-256color', cols: 100, rows: 30 }, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
              const joined = Buffer.concat(chunks).toString('utf8');
              // Wait until the banner / About content has been rendered.
              if (joined.includes('Jon Marien')) {
                clearTimeout(timer);
                stream.end();
                client.end();
                resolve(joined);
              }
            });
            stream.on('error', reject);
          });
        })
        .on('error', reject)
        .connect({
          host: '127.0.0.1',
          port: boundPort,
          username: 'tester',
          password: 'anything',
          // Allow any host key — this is a smoke test, not prod.
          hostVerifier: () => true,
          // Don't enforce strict algs for test portability
        });
    });

    expect(output).toContain('Jon Marien');
  });
});
