import { NestFactory } from '@nestjs/core';
import { AuthenticatedSocketAdapter } from './adapter/authenticated-socket.adapter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  // app.enableCors({
  //   origin: ['http://localhost:5173/'],
  // });
  app.useWebSocketAdapter(new AuthenticatedSocketAdapter(app)); // Add our custom socket adapter.

  await app.listen(4000);
}
bootstrap();
