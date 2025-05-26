//super
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuration pour servir les fichiers statiques
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  // Activer CORS pour permettre les requêtes depuis n'importe quelle origine
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`L'application est en cours d'exécution sur: http://localhost:${port}`);
  logger.log(`Pour accéder à l'interface du Simplex Solver, ouvrez: http://localhost:${port}`);
}

bootstrap();
