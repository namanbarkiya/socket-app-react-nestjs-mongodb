import { io } from "socket.io-client";
import { randomUser } from "./components/EventsEnum";

const URL = import.meta.env.SERVER_URL || "http://localhost:4000";

export const socket = io(URL, {
  query: {
    deviceId: randomUser.deviceId,
    userId: randomUser.userId,
  },
});
