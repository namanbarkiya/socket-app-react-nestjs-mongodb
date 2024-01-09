import { CACHE_MANAGER, Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { getDb } from './mongo.db';
import {
  getCurrentTimerServer,
  getCurrentTimerServerState,
  getUserDeviceRoom,
  startTimerForUserDevice,
  stopTimerForUserDevice,
} from './rooms';
import { TimerEvents } from './events';

@WebSocketGateway({ cors: true })
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @WebSocketServer()
  public server: any;

  async handleConnection(@ConnectedSocket() client: any) {
    let userDuration: any = await this.cacheManager.get(
      client.handshake.query.userId.toString(),
    );
    if (!userDuration && userDuration !== 0) {
      const cacheDB = await getDb('socket');

      let userData = await cacheDB
        .collection('cache')
        .findOne({ user_id: client.handshake.query.userId.toString() });

      if (userData) {
        // console.log('user data => ', userData);
        await this.cacheManager.set(
          client.handshake.query.userId.toString(),
          userData.duration,
          userData.duration * 60 * 1000 * 2,
        );
        userData = userData.duration;
      } else {
        await cacheDB.collection('cache').insertOne({
          user_id: client.handshake.query.userId.toString(),
          duration: parseInt(client.handshake.query.defaultTimer),
        });

        userData = parseInt(client.handshake.query.defaultTimer);
        await this.cacheManager.set(
          client.handshake.query.userId.toString(),
          userData,
          userData * 60 * 1000 * 2,
        );
      }
    }

    console.log(
      `user ${client.handshake.query.userId.toString()} with socket ${
        client.id
      } connected with device ${client.handshake?.query?.deviceId}`,
    );

    client.join(
      getUserDeviceRoom(
        client.handshake.query.userId.toString(),
        client.handshake.query.deviceId.toString(),
      ),
    );
    // this.server
    //   .to(
    //     getUserDeviceRoom(
    //       client.handshake.query.userId.toString(),
    //       client.handshake.query.deviceId.toString(),
    //     ),
    //   )
    //   .emit(TimerEvents.currentTimer, userData);
  }

  handleDisconnect(@ConnectedSocket() client: any) {
    console.log(
      `user ${client.handshake.query.userId.toString()} with socket ${
        client.id
      } with device ${client.handshake?.query?.deviceId} DISCONNECTED`,
    );

    client.leave(
      getUserDeviceRoom(
        client.handshake.query.userId.toString(),
        client.handshake.query.deviceId.toString(),
      ),
    );
  }

  @SubscribeMessage(TimerEvents.currentTimer)
  getCurrentTimer(@ConnectedSocket() client: any): void {
    getCurrentTimerServer(
      this.server,
      client.handshake.query.userId.toString(),
      client.handshake.query.deviceId.toString(),
      TimerEvents.currentTimer,
      this.cacheManager,
    );
  }

  @SubscribeMessage(TimerEvents.activeState)
  getCurrentTimerState(@ConnectedSocket() client: any): void {
    getCurrentTimerServerState(
      this.server,
      client.handshake.query.userId.toString(),
      client.handshake.query.deviceId.toString(),
      TimerEvents.activeState,
    );
  }

  @SubscribeMessage(TimerEvents.timerStart.toString())
  startMyTimer(@ConnectedSocket() client: any, @MessageBody() body: any): void {
    startTimerForUserDevice(
      this.server,
      client.handshake.query.userId.toString(),
      client.handshake.query.deviceId.toString(),
      body.dur, // Timer duration
      this.cacheManager,
    );
  }

  @SubscribeMessage(TimerEvents.timerStop.toString())
  stopMyTimer(@ConnectedSocket() client: any): void {
    // Stop current timer for this user device.
    stopTimerForUserDevice(
      this.server,
      client.handshake.query.userId.toString(),
      client.handshake.query.deviceId.toString(),
      this.cacheManager,
    );
  }

  @SubscribeMessage(TimerEvents.timerReset.toString())
  resetMyTimer(@ConnectedSocket() client: any, @MessageBody() body: any): void {
    // Stop current timer for this user device.
    stopTimerForUserDevice(
      this.server,
      client.handshake.query.userId.toString(),
      client.handshake.query.deviceId.toString(),
      this.cacheManager,
      body.dur,
    );
  }
}
