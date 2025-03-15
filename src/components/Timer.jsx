import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Info,
  Lock,
  FileText,
  Maximize,
} from "lucide-react";

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
  const [showTooltip, setShowTooltip] = useState(false);
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
      {examMode ? (
        // Exam Mode Timer - Only with reset button, no pause button
        <div
          className={`flex items-center space-x-2 bg-red-900/50 border border-red-700 rounded-md px-3 py-1.5 transition-colors shadow-lg shadow-red-900/30 ${
            timeLeft < 300 ? "animate-pulse" : ""
          }`}
        >
          <Clock size={18} className="text-red-300 animate-pulse" />
          <span
            className={`font-mono font-medium text-lg ${
              timeLeft < 300 ? "text-red-400" : "text-red-200"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
          <button
            onClick={resetTimer}
            className="p-1 rounded-md bg-red-800 hover:bg-red-900 transition-colors"
            aria-label="Reset timer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      ) : (
        // Non-Exam Mode Timer - Compact design for navbar with play/pause button
        <div
          className="flex items-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-md px-2 py-1.5 shadow-md border border-blue-500 hover:from-blue-700 hover:to-blue-900 transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={toggleTimer}
        >
          <div className="absolute inset-0 bg-blue-500 opacity-10 animate-pulse"></div>

          <div className="flex items-center space-x-2 relative z-10">
            <div className="flex items-center">
              <Clock size={16} className="text-blue-200 mr-1.5" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold leading-none">
                  Mock Exam
                </div>
                <span className="font-mono font-bold text-sm text-white">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTimer();
                }}
                className="p-1 rounded-md bg-blue-700 hover:bg-blue-600 transition-colors"
                aria-label={timerRunning ? "Pause timer" : "Start timer"}
              >
                {timerRunning ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Mode Disclaimer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-red-600 animate-scaleIn">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <AlertTriangle size={28} className="text-red-500 animate-pulse" />
              <h3 className="text-2xl font-bold">Start Mock Exam Mode</h3>
            </div>

            <div className="bg-red-900/30 p-4 rounded-lg border border-red-700 mb-5">
              <p className="text-red-200 font-medium text-center">
                You are about to enter a simulated exam environment
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-red-600 p-1.5 rounded-full mt-0.5">
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    Timed Environment
                  </h4>
                  <p className="text-gray-300 text-sm">
                    The timer will run continuously until completion{" "}
                    <span className="text-red-400 font-medium">
                      and cannot be paused
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-red-600 p-1.5 rounded-full mt-0.5">
                  <Lock size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    Restricted Access
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Mark schemes and solved papers will be hidden
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-red-600 p-1.5 rounded-full mt-0.5">
                  <FileText size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Fixed Paper</h4>
                  <p className="text-gray-300 text-sm">
                    You cannot switch to different papers during the exam
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-red-600 p-1.5 rounded-full mt-0.5">
                  <Maximize size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Fullscreen Mode</h4>
                  <p className="text-gray-300 text-sm">
                    The app will enter fullscreen for a distraction-free
                    experience
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-950/50 p-3 rounded-lg border border-red-800 mb-6">
              <p className="text-red-300 text-sm text-center font-medium">
                Once started, the exam can only be ended by completing it or
                manually resetting the timer.
              </p>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startExamMode}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors font-medium flex items-center"
              >
                <Play size={16} className="mr-2" />
                Start Exam Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
