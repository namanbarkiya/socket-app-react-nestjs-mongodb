import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketsGateway } from './sockets/sockets.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CacheModule.register({ isGlobal: true }), ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, SocketsGateway],
})
export class AppModule {}
