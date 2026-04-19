import { createServer, listen, DEFAULT_CONFIG } from './ssh/server.js';

async function main() {
  const server = createServer(DEFAULT_CONFIG);
  await listen(server, DEFAULT_CONFIG);

  const shutdown = (signal: string) => {
    process.stdout.write(`\nReceived ${signal}, shutting down...\n`);
    server.close(() => {
      process.exit(0);
    });
    // Don't wait forever.
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
