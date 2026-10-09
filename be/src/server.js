import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 CaloCalculate API running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Bye!');
    process.exit(0);
  });
}

bootstrap();
