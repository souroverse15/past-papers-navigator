import { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, RotateCcw, AlertTriangle } from "lucide-react";

export default function Timer({
  duration = 90,
  isRunning = false,
  onToggle,
  onExamModeChange,
  initialExamMode = false,
  onMount,
}) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const [timerRunning, setTimerRunning] = useState(
    initialExamMode || isRunning
  );
  const [showModal, setShowModal] = useState(false);
  const [examMode, setExamMode] = useState(initialExamMode);
  const timerRef = useRef(null);
  const initialized = useRef(false);
  const examModeChangeRef = useRef(onExamModeChange);

  // Call onMount when component mounts
  useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);

  // Update ref when prop changes
  useEffect(() => {
    examModeChangeRef.current = onExamModeChange;
  }, [onExamModeChange]);

  // Initialize exam mode if initialExamMode is true
  useEffect(() => {
    if (initialExamMode && !initialized.current) {
      console.log("Initializing exam mode from Timer component");
      setExamMode(true);
      setTimerRunning(true);
      if (examModeChangeRef.current) {
        console.log(
          "Calling onExamModeChange with true from initialExamMode effect"
        );
        examModeChangeRef.current(true);
      }
      initialized.current = true;
    }
  }, [initialExamMode]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration * 60);
    if (!initialExamMode) {
      setTimerRunning(false);
      setExamMode(false);
    }
  }, [duration, initialExamMode]);

  // Handle timer countdown
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      // Clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start a new interval
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            setExamMode(false);
            if (examModeChangeRef.current) {
              examModeChangeRef.current(false);
            }
            alert("Time's up! Exam mode has ended.");
            return 0;
          }

          // Show warning when 5 minutes remaining
          if (prevTime === 300 && examMode) {
            const warningElement = document.createElement("div");
            warningElement.className =
              "fixed inset-0 bg-red-600/30 flex items-center justify-center z-[9999] animate-pulse";
            warningElement.innerHTML = `
              <div class="bg-red-900 text-white p-6 rounded-lg shadow-2xl border-2 border-red-500 max-w-md">
                <h2 class="text-xl font-bold mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                  Warning: 5 Minutes Remaining!
                </h2>
                <p>You have only 5 minutes left to complete your exam.</p>
                <button class="mt-4 px-4 py-2 bg-red-700 hover:bg-red-800 rounded-md w-full">
                  Dismiss
                </button>
              </div>
            `;

            document.body.appendChild(warningElement);

            // Add click event to dismiss button
            const dismissButton = warningElement.querySelector("button");
            dismissButton.addEventListener("click", () => {
              document.body.removeChild(warningElement);
            });

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              if (document.body.contains(warningElement)) {
                document.body.removeChild(warningElement);
              }
            }, 5000);

            // Also show a standard alert for accessibility
            alert("Warning: 5 minutes remaining in your exam!");
          }

          return prevTime - 1;
        });
      }, 1000);
    } else if (!timerRunning && timerRef.current) {
      // Clear interval when timer is paused
      clearInterval(timerRef.current);
    }

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerRunning, timeLeft, examMode]);

  // Handle exam mode changes
  const handleExamModeChange = (newExamMode) => {
    setExamMode(newExamMode);
    if (examModeChangeRef.current) {
      examModeChangeRef.current(newExamMode);
    }
  };

  const startExamMode = () => {
    console.log("Starting exam mode from Timer component");
    setShowModal(false);
    setTimeLeft(duration * 60); // Reset timer to full duration
    setTimerRunning(true);
    handleExamModeChange(true);

    if (onToggle) {
      onToggle(true);
    }
  };

  const toggleTimer = () => {
    if (!timerRunning && !examMode) {
      // Show disclaimer before starting
      setShowModal(true);
    } else if (timerRunning) {
      // Pause the timer
      setTimerRunning(false);
      if (onToggle) {
        onToggle(false);
      }
    } else if (examMode && !timerRunning) {
      // Resume the timer in exam mode
      setTimerRunning(true);
      if (onToggle) {
        onToggle(true);
      }
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeLeft(duration * 60);
    setTimerRunning(false);

    if (examMode) {
      handleExamModeChange(false);
    } else {
      setExamMode(false);
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <>
      <div
        className={`flex items-center space-x-2 ${
          examMode ? "bg-red-900/50 border border-red-700" : "bg-gray-700"
        } rounded-md px-3 py-1.5 transition-colors ${
          examMode ? "shadow-lg shadow-red-900/30" : ""
        } ${examMode && timeLeft < 300 ? "animate-pulse" : ""}`}
      >
        <Clock
          size={examMode ? 18 : 16}
          className={`${examMode ? "text-red-300" : "text-gray-300"} ${
            timerRunning ? "animate-pulse" : ""
          }`}
        />
        <span
          className={`font-mono font-medium ${
            timeLeft < 300
              ? "text-red-400"
              : examMode
              ? "text-red-200"
              : "text-gray-200"
          } ${examMode ? "text-lg" : ""}`}
        >
          {formatTime(timeLeft)}
        </span>
        <button
          onClick={toggleTimer}
          className={`p-1 rounded-md ${
            examMode
              ? timerRunning
                ? "bg-red-700 hover:bg-red-800"
                : "bg-green-700 hover:bg-green-800"
              : "hover:bg-gray-600"
          } transition-colors`}
          aria-label={timerRunning ? "Pause timer" : "Start timer"}
        >
          {timerRunning ? (
            <Pause size={examMode ? 16 : 14} />
          ) : (
            <Play size={examMode ? 16 : 14} />
          )}
        </button>
        <button
          onClick={resetTimer}
          className={`p-1 rounded-md ${
            examMode ? "bg-red-800 hover:bg-red-900" : "hover:bg-gray-600"
          } transition-colors`}
          aria-label="Reset timer"
        >
          <RotateCcw size={examMode ? 16 : 14} />
        </button>
      </div>

      {/* Exam Mode Disclaimer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center space-x-3 text-yellow-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Exam Mode</h3>
            </div>

            <p className="text-gray-300 mb-4">
              You are about to enter{" "}
              <span className="font-semibold text-white">Exam Mode</span>. Once
              started:
            </p>

            <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
              <li>You cannot access mark schemes or solved papers</li>
              <li>You cannot switch to different papers</li>
              <li>The sidebar will be locked completely</li>
              <li>The timer will run until completion or manual reset</li>
            </ul>

            <p className="text-gray-300 mb-6">
              This creates a realistic exam environment for better practice.
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startExamMode}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
              >
                Start Exam Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
