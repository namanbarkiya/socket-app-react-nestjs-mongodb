import { Cache } from 'cache-manager';
import { getDb } from './mongo.db';
import { TimerEvents } from './events';

var userTimers = {};

export function getUserDeviceRoom(userId: string, deviceId: string) {
  return `user:${userId}-device:${deviceId}`;
}

export async function getCurrentTimerServer(
  server: any,
  userId: string,
  deviceId: string,
  event: string,
  cacheManager: Cache,
) {
  console.log('current time asked');
  let timer = userTimers[userId + 'current'];
  if (!timer) {
    timer = await cacheManager.get(userId);
  }

  server.to(getUserDeviceRoom(userId, deviceId)).emit(event, timer); // Actually send the message to the user device via WebSocket channel.
}

export async function getCurrentTimerServerState(
  server: any,
  userId: string,
  deviceId: string,
  event: string,
) {
  let state = false;
  if (userTimers[userId]) {
    state = true;
  }
  server.to(getUserDeviceRoom(userId, deviceId)).emit(event, state); // Actually send the message to the user device via WebSocket channel.
}

export function sendToUserDevice(
  server: any,
  userId: string,
  deviceId: string,
  event: string,
  payload: any,
) {
  server.to(getUserDeviceRoom(userId, deviceId)).emit(event, payload); // Actually send the message to the user device via WebSocket channel.
}

export async function startTimerForUserDevice(
  server: any,
  userId: string,
  deviceId: string,
  dur: number,
  cacheManager: Cache,
) {
  var counter: any;

  let userData: any = await cacheManager.get(userId);
  if (!userData) {
    const socketDB = await getDb('socket');
    const user = await socketDB
      .collection('cache')
      .findOne({ user_id: userId });
    if (!user) {
      await socketDB
        .collection('cache')
        .insertOne({ user_id: userId, duration: dur });
      counter = dur;
      console.log('data created!');
    } else {
      counter = user.duration;
      console.log('data found in db');
    }
    await cacheManager.set(userId, counter, counter * 2 * 60 * 1000);
  } else {
    counter = userData;
    console.log('Cache for startTimer => ', counter);
  }

  clearInterval(userTimers[userId]);
  var timer = setInterval(async function () {
    sendToUserDevice(server, userId, deviceId, TimerEvents.tick.toString(), {
      timer: counter,
    }); // Send tick message to user device.

    console.log('Current count => ', counter);
    if (counter > 0) {
      counter--;
      userTimers[userId + 'current'] = counter;
    } else {
      // Stop timer for this user.
      delete userTimers[userId];
      delete userTimers[userId + 'current'];
      // await cacheManager.del(userId);
      clearInterval(timer);
      server
        .to(getUserDeviceRoom(userId, deviceId))
        .emit(TimerEvents.completed);
      stopTimerForUserDevice(server, userId, deviceId, cacheManager, 0);
    }
  }, 1000);

  userTimers[userId] = timer; // Store timer for this user device.
}

export async function stopTimerForUserDevice(
  server: any,
  userId: string,
  deviceId: string,
  cacheManager: Cache,
  dur?: number,
) {
  clearInterval(userTimers[userId]); // Stop the timer for this user device.
  if (dur) delete userTimers[userId + 'current'];

  let currentDur = isNaN(dur) ? userTimers[userId + 'current'] : dur;

  if (isNaN(currentDur)) {
    const socketDB = await getDb('socket');
    const user = await socketDB
      .collection('cache')
      .findOne({ user_id: userId });

    currentDur = user.duration;
  }
  await cacheManager.set(userId, currentDur, currentDur * 2 * 60 * 1000);

  console.log('current timer => ', currentDur);
  getDb('socket')
    .then((socketDB) => {
      socketDB.collection('cache').updateOne(
        { user_id: userId },
        {
          $set: {
            duration: currentDur,
          },
        },
      );
      console.log('data saved!');
    })
    .catch((err) => console.log(err));

  delete userTimers[userId]; // Delete the timer for this user device from the `userTimers` object.

  server
    .to(getUserDeviceRoom(userId, deviceId))
    .emit(TimerEvents.currentTimer, currentDur);
}
