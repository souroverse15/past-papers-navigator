import React, { useState, useEffect } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";

const Timer = () => {
  const [time, setTime] = useState(0); // time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [examDuration, setExamDuration] = useState(0);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (!isConfigured) {
      const hours = parseInt(prompt("Enter exam duration in hours:", "3")) || 0;
      if (hours > 0) {
        const totalSeconds = hours * 3600;
        setTime(totalSeconds);
        setExamDuration(totalSeconds);
        setIsConfigured(true);
      }
    }
    setIsRunning(true);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTime(examDuration);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <span className="text-xl font-mono font-bold text-gray-800 dark:text-gray-200">
          {formatTime(time)}
        </span>
      </div>
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStartTimer}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Start Timer"
          >
            <Play className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handlePauseTimer}
            className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            title="Pause Timer"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleResetTimer}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Timer;
