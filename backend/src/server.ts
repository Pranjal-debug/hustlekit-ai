import { app } from './app';
import { initDatabase } from './db/mongo';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    const telemetry = await initDatabase();
    if (telemetry.status === 'connected') {
      console.log(`[Server] MongoDB Atlas connection verified (${telemetry.dbName})`);
    } else if (process.env.MONGODB_URI) {
      console.error(`[Server] CRITICAL: MongoDB Atlas connection failed: ${telemetry.error}`);
    } else {
      console.warn(`[Server] Database status: ${telemetry.status} - ${telemetry.error || 'using memory store'}`);
    }
  } catch (err: any) {
    console.error('[Server] Critical Database Initialization Error:', err.message);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n=============================================`);
    console.log(`🚀 HustleKit AI Backend running on http://${HOST}:${PORT}`);
    console.log(`📡 Health Check: http://${HOST}:${PORT}/healthz`);
    console.log(`✨ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=============================================\n`);
  });

  return server;
}

startServer();

export default app;
