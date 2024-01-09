import { useEffect, useState } from "react";
import { socket } from "./socket";
import { ConnectionState } from "./components/ConnectionState";
// import { Events } from "./components/Events";
import { ConnectionManager } from "./components/ComponentManager";
import { MyForm } from "./components/MyForm";
import { TimerEvents } from "./components/EventsEnum";

import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    function onConnect() {
      socket.emit(TimerEvents.currentTimer);
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);

    socket.on(TimerEvents.currentTimer, (data) => {
      setTimer(data);
    });

    socket.on(TimerEvents.tick, (data) => {
      setTimer(data.timer);
      console.log(data.timer);
    });

    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);
  return (
    <div className="App">
      <span style={{ marginTop: 20 }}>
        Made with ❤️ by{" "}
        <a href="https://github.com/namanbarkiya">@namanbarkiya</a>
      </span>
      <br />
      <span>Some bugs might be there, please press RESET first ^_^</span>
      <h1>{timer}</h1>
      <ConnectionState isConnected={isConnected} />
      {/* <Events events={fooEvents} /> */}
      <ConnectionManager />
      <MyForm />
    </div>
  );
}

export default App;
