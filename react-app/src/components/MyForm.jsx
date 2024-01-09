import React, { useState } from "react";
import { socket } from "../socket";
import { TimerEvents } from "./EventsEnum";

export function MyForm() {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function startTimer() {
        if (socket.connected) {
            socket.emit(TimerEvents.timerStart, {
                dur: 20,
            });
        } else {
            console.log("No socket connection found.");
        }
    }

    function stopTimer() {
        if (socket.connected) {
            socket.emit(TimerEvents.timerStop);
        } else {
            console.log("No socket connection found.");
        }
    }

    function resetTimer() {
        if (socket.connected) {
            socket.emit(TimerEvents.timerReset, { dur: 30 });
        } else {
            console.log("No socket connection found.");
        }
    }

    return (
        <div>
            {/* <input onChange={(e) => setValue(e.target.value)} /> */}

            <button disabled={isLoading} onClick={startTimer}>
                Start Timer
            </button>
            <button disabled={isLoading} onClick={stopTimer}>
                Stop Timer
            </button>
            <button disabled={isLoading} onClick={resetTimer}>
                Reset
            </button>
        </div>
    );
}
