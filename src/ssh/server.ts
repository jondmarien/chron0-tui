import ssh2 from 'ssh2';
import type { AuthContext, Connection, PseudoTtyInfo, ServerChannel, Session } from 'ssh2';
import { loadOrCreateHostKey } from './host-key.js';
import { startInteractiveSession, writeTextSnapshot, DEFAULT_LIMITS, SessionLimits } from './session.js';

export interface ServerConfig {
  host: string;
  port: number;
  hostKeyPath: string;
  maxConnections: number;
  maxPerIp: number;
  limits: SessionLimits;
  banner?: string;
}

export const DEFAULT_CONFIG: ServerConfig = {
  host: process.env.HOST ?? '0.0.0.0',
  port: parseInt(process.env.PORT ?? '2222', 10),
  hostKeyPath: process.env.HOST_KEY_PATH ?? './host_rsa',
  maxConnections: parseInt(process.env.MAX_CONNECTIONS ?? '50', 10),
  maxPerIp: parseInt(process.env.MAX_PER_IP ?? '5', 10),
  limits: DEFAULT_LIMITS,
  banner: 'Welcome. This is a read-only TUI portfolio. Press `q` or Ctrl-C to exit.\r\n',
};

function log(event: string, fields: Record<string, unknown> = {}) {
  const parts = [
    new Date().toISOString(),
    event,
    ...Object.entries(fields).map(([k, v]) => `${k}=${v}`),
  ];
  process.stdout.write(parts.join(' | ') + '\n');
}

export function createServer(config: ServerConfig = DEFAULT_CONFIG): ssh2.Server {
  const hostKey = loadOrCreateHostKey(config.hostKeyPath);
  const perIp = new Map<string, number>();
  let active = 0;

  const server = new ssh2.Server(
    {
      hostKeys: [hostKey],
      banner: config.banner,
      ident: 'SSH-2.0-chron0-tui',
    },
    (client: Connection, info) => {
      const ip = (info as any)?.ip ?? 'unknown';
      const count = perIp.get(ip) ?? 0;

      if (active >= config.maxConnections || count >= config.maxPerIp) {
        log('reject', { ip, reason: 'limit' });
        client.end();
        return;
      }

      active++;
      perIp.set(ip, count + 1);
      log('connect', { ip, active });

      let username = 'visitor';

      client.on('authentication', (ctx: AuthContext) => {
        username = (ctx.username || 'visitor').slice(0, 32);
        // Read-only public portfolio — accept any auth method.
        ctx.accept();
      });

      client.on('ready', () => {
        log('ready', { ip, user: username });

        client.on('session', (accept) => {
          const session: Session = accept();

          let pty: PseudoTtyInfo | null = null;

          session.on('pty', (acceptPty, _reject, info) => {
            pty = info;
            acceptPty();
          });

          session.on('shell', (acceptShell) => {
            const channel: ServerChannel = acceptShell();
            if (!pty) {
              // No pty requested — fall back to plain text output.
              writeTextSnapshot(channel);
              return;
            }
            startInteractiveSession(channel, pty, { ip, username }, config.limits);
          });

          session.on('exec', (acceptExec, _reject, _execInfo) => {
            const channel: ServerChannel = acceptExec();
            writeTextSnapshot(channel);
          });
        });
      });

      const release = () => {
        active = Math.max(0, active - 1);
        const c = (perIp.get(ip) ?? 1) - 1;
        if (c <= 0) perIp.delete(ip);
        else perIp.set(ip, c);
        log('close', { ip, active });
      };

      client.on('close', release);
      client.on('error', (err) => log('client-error', { ip, err: err.message }));
    }
  );

  return server;
}

export function listen(server: ssh2.Server, config: ServerConfig = DEFAULT_CONFIG): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(config.port, config.host, () => {
      log('listen', { host: config.host, port: config.port });
      resolve();
    });
    server.on('error', reject);
  });
}
