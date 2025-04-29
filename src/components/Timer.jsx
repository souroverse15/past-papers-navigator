import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Info,
  Lock,
  FileText,
} from "lucide-react";
import { createPortal } from "react-dom";
import { autoCompleteGoalWhenMockCompleted } from "../firebase/userService";

const Timer = forwardRef(
  (
    {
      duration = 90,
      isRunning = false,
      onToggle,
      onExamModeChange,
      initialExamMode = false,
      onMount,
      paperInfo = {}, // Prop to receive paper metadata
    },
    ref
  ) => {
    const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
    const [timerRunning, setTimerRunning] = useState(
      initialExamMode || isRunning
    );
    const [showModal, setShowModal] = useState(false);
    const [examMode, setExamMode] = useState(initialExamMode);
    const [scoringModal, setScoringModal] = useState(false);
    const [userScore, setUserScore] = useState("");
    const timerRef = useRef(null);
    const initialized = useRef(false);
    const examModeChangeRef = useRef(onExamModeChange);
    const startTimeRef = useRef(null);
    const { user } = useAuth();
    const [examSaved, setExamSaved] = useState(false);

    // Expose functions to parent component through ref
    useImperativeHandle(ref, () => ({
      showScoringModal: () => {
        console.log("showScoringModal called via ref");
        if (!examSaved) {
          console.log("Saving exam data before showing scoring modal");
          saveMockExamData()
            .then((result) => {
              console.log("Save result:", result);
              setScoringModal(true);
            })
            .catch((error) => {
              console.error("Error saving:", error);
              // Still show modal even if save fails
              setScoringModal(true);
            });
        } else {
          console.log("Exam already saved, showing scoring modal");
          setScoringModal(true);
        }
      },
    }));

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

    // Initialize exam mode if initialExamMode is true and user is logged in
    useEffect(() => {
      if (initialExamMode && !initialized.current) {
        // Check if user is logged in
        if (!user) {
          console.log("User not logged in, cannot initialize exam mode");
          // Don't initialize exam mode without login
          return;
        }

        console.log("Initializing exam mode from Timer component");
        setExamMode(true);
        setTimerRunning(true);
        startTimeRef.current = new Date();
        if (examModeChangeRef.current) {
          console.log(
            "Calling onExamModeChange with true from initialExamMode effect"
          );
          examModeChangeRef.current(true);
        }
        initialized.current = true;
      }
    }, [initialExamMode, user]);

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
        // Record start time when timer starts
        if (!startTimeRef.current) {
          startTimeRef.current = new Date();
        }

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

              // If in exam mode, automatically save the exam data and proceed to checking
              if (examMode && user) {
                console.log("Time's up - automatically saving mock exam data");
                // Auto-save the mock exam data without a score yet
                saveMockExamData(null)
                  .then((result) => {
                    console.log(
                      "Time's up - saved mock data with result:",
                      result
                    );
                    setExamSaved(true);
                    // Transition to checking phase
                    if (examModeChangeRef.current) {
                      examModeChangeRef.current(false, {
                        showMarkScheme: true,
                        score: null,
                        tempSave: true, // This indicates we still need to collect score
                        examId: result?.id, // We'll need this to update the record later
                        timeUp: true, // Flag indicating time ran out
                      });
                    }
                  })
                  .catch((error) => {
                    console.error(
                      "Error auto-saving mock data when time's up:",
                      error
                    );
                    // Show scoring modal as fallback
                    setScoringModal(true);
                  });
              } else {
                setExamMode(false);
                if (examModeChangeRef.current) {
                  examModeChangeRef.current(false);
                }
                alert("Time's up! Exam mode has ended.");
              }
              return 0;
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
    }, [timerRunning, timeLeft, examMode, user]);

    // ESC key event listener to handle both showing the modal and saving when ESC is pressed
    useEffect(() => {
      const handleKeyDown = async (e) => {
        if (e.key === "Escape") {
          console.log(
            "ESC key detected, examMode:",
            examMode,
            "scoringModal:",
            scoringModal
          );
          if (examMode && !scoringModal) {
            // If in exam mode and scoring modal is not shown, save with score 0
            console.log(
              "ESC key pressed while in exam mode, ending mock exam with score 0"
            );
            if (!examSaved) {
              console.log(
                "Mock exam not saved yet, saving now from ESC handler with score 0"
              );
              try {
                // Use await to ensure the save completes before showing the modal
                const result = await saveMockExamData(0); // Set score to 0 when exiting with ESC
                console.log("saveMockExamData completed with result:", result);

                // If successfully saved, set examSaved flag and show completion message
                if (result) {
                  setExamSaved(true);
                  // Exit exam mode
                  setExamMode(false);
                  if (examModeChangeRef.current) {
                    examModeChangeRef.current(false);
                  }
                  // Alert user that mock has been ended with score 0
                  alert(
                    "Mock exam ended. Score recorded as 0% due to early exit."
                  );
                }
              } catch (error) {
                console.error(
                  "Error calling saveMockExamData from ESC handler:",
                  error
                );
                alert(
                  "Error saving mock data. Please try again or contact support."
                );
              }
            }
          } else if (scoringModal) {
            // If scoring modal is open, don't allow ESC to close it - enforce scoring
            console.log(
              "ESC pressed while scoring modal is open - preventing default close"
            );
            e.preventDefault();
            e.stopPropagation();
            // Notify user they need to provide a score
            alert("Please provide your score before closing this screen.");
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [examMode, scoringModal, examSaved]);

    // Save mock exam data to Firestore
    const saveMockExamData = async (score = null) => {
      console.log("saveMockExamData called with score:", score);
      console.log("user:", user?.email, "startTimeRef:", startTimeRef.current);

      if (!user?.email || !startTimeRef.current) {
        console.error(
          "Cannot save mock exam: missing user email or start time"
        );
        return null;
      }

      // Validate paperInfo
      if (!paperInfo || Object.keys(paperInfo).length === 0) {
        console.error(
          "Cannot save mock exam: paperInfo is empty or undefined",
          paperInfo
        );
        return null;
      }

      try {
        console.log("Saving mock exam data for user:", user.email);
        console.log("Paper info received:", paperInfo);

        // Debug to see if we have the file object
        if (paperInfo.file) {
          console.log("File object details:", {
            name: paperInfo.file.name,
            path: paperInfo.file.path,
            qp:
              typeof paperInfo.file.qp === "string"
                ? paperInfo.file.qp.substring(0, 30) + "..."
                : "No QP",
            ms: typeof paperInfo.file.ms === "string" ? "MS exists" : "No MS",
            sp: typeof paperInfo.file.sp === "string" ? "SP exists" : "No SP",
            keys: Object.keys(paperInfo.file),
          });
        } else {
          console.warn("No file object in paperInfo:", paperInfo);
        }

        const endTime = new Date();
        const durationMinutes = Math.round((duration * 60 - timeLeft) / 60);

        // Get the complete path information if available - prioritize direct path properties
        const fullPath =
          paperInfo.fullPath ||
          paperInfo.rawPath ||
          (paperInfo.file && paperInfo.file.path) ||
          null;

        console.log("Using path:", fullPath);

        // Extract file structure and path details
        let pathParts = paperInfo.pathParts || [];
        if ((!pathParts || pathParts.length === 0) && fullPath) {
          pathParts = fullPath.split("/");
          console.log("Path parts extracted from fullPath:", pathParts);
        }

        // If we still have no path parts, try to reconstruct from file properties
        if ((!pathParts || pathParts.length === 0) && paperInfo.file) {
          // Use QP URL to try to identify paper structure if possible
          const qpUrl = paperInfo.file.qp;
          if (qpUrl && typeof qpUrl === "string") {
            console.log(
              "Attempting to extract information from QP URL:",
              qpUrl
            );

            // Look for clues in the URL - drive IDs often contain exam board info in the filename
            const urlParts = qpUrl.split("/");
            const lastPart = urlParts[urlParts.length - 2]; // Usually the file ID in drive URLs
            console.log("Extracted URL part for analysis:", lastPart);

            // Example reconstruction - construct minimal path parts
            pathParts = ["Unknown", "Unknown"];
          }

          // Attempt to reconstruct path from available information
          const parts = [];

          // Add exam board if we can determine it
          if (paperInfo.examBoard && paperInfo.examBoard !== "Unknown") {
            if (paperInfo.examBoard.includes("Edexcel International A Level")) {
              parts.push("IAL");
            } else if (paperInfo.examBoard.includes("Edexcel IGCSE")) {
              parts.push("IGCSE");
            } else {
              // Use first word of exam board
              parts.push(paperInfo.examBoard.split(" ")[0]);
            }
          } else {
            // Add a default exam board as fallback
            parts.push("Unknown");
          }

          // Add subject if available
          if (paperInfo.subject && paperInfo.subject !== "Unknown") {
            parts.push(paperInfo.subject);
          } else {
            // Add a default subject as fallback
            parts.push("Unknown");
          }

          // Add year if available
          if (paperInfo.year) {
            parts.push(paperInfo.year);
          }

          // Add session if available
          if (paperInfo.session) {
            parts.push(paperInfo.session);
          }

          // Add paper name if available
          if (paperInfo.file.name) {
            parts.push(paperInfo.file.name);
          }

          if (parts.length > 0) {
            pathParts = parts;
            console.log(
              "Reconstructed path parts from file properties:",
              pathParts
            );
          }
        }

        // Get detailed board information
        let examBoard = paperInfo.examBoard || "Unknown";
        if (examBoard === "Unknown" && pathParts.length > 0) {
          const boardFromPath = pathParts[0];
          if (boardFromPath === "IAL" || boardFromPath === "IGCSE") {
            examBoard = boardFromPath;
          }
        }

        // Get detailed subject information
        let subject = paperInfo.subject || "Unknown";
        if (subject === "Unknown" && pathParts.length >= 2) {
          subject = pathParts[1] || "Unknown";
        }

        // Try to get year from path if not in paperInfo
        let year = paperInfo.year || null;
        if (!year && pathParts.length >= 3) {
          const potentialYear = pathParts[2];
          if (/^20\d{2}$/.test(potentialYear)) {
            year = potentialYear;
          }
        }

        // Try to get session from path if not in paperInfo
        let session = paperInfo.session || null;
        if (!session && pathParts.length >= 4) {
          session = pathParts[3] || null;
        }

        // Get paper code from file name if available
        let paperCode = paperInfo.paperCode || "Unknown";
        if (paperCode === "Unknown" && paperInfo.file && paperInfo.file.name) {
          paperCode = paperInfo.file.name;
          console.log("Using file name as paper code:", paperCode);
        }

        // If paper code has a PDF extension, clean it up
        if (paperCode.endsWith(".pdf")) {
          paperCode = paperCode.slice(0, -4);
        }

        // Build a title from file name if we have it
        let paperTitle = "";

        // Use file name as the base if everything else is unknown
        if (
          subject === "Unknown" &&
          examBoard === "Unknown" &&
          paperInfo.file &&
          paperInfo.file.name
        ) {
          paperTitle = paperInfo.file.name;
          console.log("Using file name as paper title:", paperTitle);
        } else {
          // Build a complete paper title with all available information
          // Add board prefix
          if (examBoard !== "Unknown") {
            paperTitle = examBoard + " ";
          }

          // Add subject
          if (subject !== "Unknown") {
            paperTitle += subject;
          } else {
            paperTitle += "Unknown Subject";
          }

          // Add year if available
          if (year) {
            paperTitle += ` (${year})`;
          }

          // Add session if available
          if (session) {
            paperTitle += ` ${session}`;
          }

          // Add paper code if available and not already in the title
          if (paperCode !== "Unknown" && !paperTitle.includes(paperCode)) {
            paperTitle += ` - ${paperCode}`;
          }
        }

        console.log("Generated paper title:", paperTitle);

        // Create comprehensive mock exam record with all available data
        const mockExamData = {
          userEmail: user.email,
          userName: user.name || user.email,
          subject: subject,
          paperCode: paperCode,
          year: year,
          session: session,
          examBoard: examBoard,
          paperTitle: paperTitle,
          durationMinutes: durationMinutes,
          startedAt: startTimeRef.current,
          completedAt: serverTimestamp(),
          examDuration: duration,
          rawPath: fullPath,
          pathParts: pathParts,
          timestamp: new Date().getTime(),
        };

        // If we have a file object, store essential metadata for reference
        if (paperInfo.file) {
          mockExamData.fileData = {
            name: paperInfo.file.name,
            path: paperInfo.file.path || null,
            hasQP: !!paperInfo.file.qp,
            hasMS: !!paperInfo.file.ms,
            hasSP: !!paperInfo.file.sp,
          };

          // Store URLs if available
          if (paperInfo.file.qp && typeof paperInfo.file.qp === "string") {
            mockExamData.urls = {
              qp: paperInfo.file.qp,
            };

            if (paperInfo.file.ms && typeof paperInfo.file.ms === "string") {
              mockExamData.urls.ms = paperInfo.file.ms;
            }

            if (paperInfo.file.sp && typeof paperInfo.file.sp === "string") {
              mockExamData.urls.sp = paperInfo.file.sp;
            }
          }
        }

        // Add score if provided
        if (score !== null) {
          mockExamData.score = score;
        }

        console.log("Mock exam data to save:", mockExamData);

        // Save to Firestore
        const docRef = await addDoc(collection(db, "mockExams"), mockExamData);
        console.log("Mock exam data saved successfully with ID:", docRef.id);

        // Set the flag to indicate the exam has been saved
        setExamSaved(true);

        // Auto-complete goal if the paper is in user's goals
        if (fullPath) {
          await autoCompleteGoalWhenMockCompleted(user.email, fullPath, score);
        }

        return docRef;
      } catch (error) {
        console.error("Error saving mock exam data:", error);
        console.error("Error details:", error.message, error.stack);
        return null;
      }
    };

    // Handle exam mode changes
    const handleExamModeChange = (newExamMode) => {
      setExamMode(newExamMode);
      if (examModeChangeRef.current) {
        examModeChangeRef.current(newExamMode);
      }

      // If turning off exam mode and timer was running, save the data
      if (!newExamMode && examMode && user && startTimeRef.current) {
        setScoringModal(true);
      }
    };

    const startExamMode = () => {
      // Check if user is logged in
      if (!user) {
        console.log("User not logged in, redirecting to login page");
        window.location.href = "/login";
        return;
      }

      console.log("Starting exam mode from Timer component");
      setShowModal(false);
      setTimeLeft(duration * 60); // Reset timer to full duration
      setTimerRunning(true);
      startTimeRef.current = new Date(); // Record start time
      handleExamModeChange(true);

      if (onToggle) {
        onToggle(true);
      }
    };

    const toggleTimer = () => {
      // Check if user is logged in
      if (!user) {
        console.log("User not logged in, redirecting to login page");
        // Use window.location to redirect to login page
        window.location.href = "/login";
        return;
      }

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

    // This function is now only used internally - not directly tied to a button in exam mode
    const resetTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTimeLeft(duration * 60);
      setTimerRunning(false);

      // Always show scoring modal when ending a mock exam
      if (examMode && user && startTimeRef.current) {
        setScoringModal(true);
      } else {
        if (examMode) {
          handleExamModeChange(false);
        } else {
          setExamMode(false);
        }

        // Reset start time
        startTimeRef.current = null;
      }
    };

    // Handle submitting score and ending exam
    const handleScoreSubmit = async () => {
      console.log("handleScoreSubmit called, examSaved:", examSaved);

      // Validate score (between 0-100)
      const scoreNum = parseFloat(userScore);
      console.log("User score input:", userScore, "parsed as:", scoreNum);

      // Require a score entry
      if (userScore === "" || isNaN(scoreNum)) {
        alert(
          "Please enter a valid score between 0 and 100. Score is required to complete the mock exam."
        );
        return;
      }

      // Validate score range
      if (scoreNum < 0 || scoreNum > 100) {
        alert("Please enter a valid score between 0 and 100.");
        return;
      }

      try {
        if (!examSaved) {
          // Normal case - save with the score
          console.log("Saving exam with score:", scoreNum);
          const result = await saveMockExamData(scoreNum);
          console.log("Save result:", result);

          if (result) {
            // Set exam as saved and proceed to mark scheme view
            setExamSaved(true);

            // Update any goals if this paper was in goals
            if (paperInfo && paperInfo.fullPath) {
              try {
                await autoCompleteGoalWhenMockCompleted(
                  paperInfo.fullPath,
                  scoreNum
                );
                console.log(
                  "Updated goal completion status for paper:",
                  paperInfo.fullPath
                );
              } catch (error) {
                console.error("Error updating goal status:", error);
              }
            }

            // Close modal and show mark scheme
            setScoringModal(false);

            // Signal to parent that exam mode is ending but with special flag for mark scheme view
            if (examModeChangeRef.current) {
              // Pass special flag to indicate we're ending with a score
              examModeChangeRef.current(false, {
                showMarkScheme: true,
                score: scoreNum,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error in handleScoreSubmit:", error);
        alert("There was an error saving your mock exam. Please try again.");
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
        {initialExamMode && !user ? (
          // Show login prompt instead of timer if attempting to access exam mode without login
          <div className="flex items-center space-x-2 bg-red-900/50 border border-red-700 rounded-md px-3 py-1.5 transition-colors">
            <Lock size={16} className="text-red-300" />
            <span className="text-red-200 text-sm font-medium">
              Login required for Mock Exam
            </span>
            <button
              onClick={() => (window.location.href = "/login")}
              className="p-1 rounded-md bg-red-800 hover:bg-red-700 transition-colors text-white text-xs px-2 cursor-pointer"
            >
              Login
            </button>
          </div>
        ) : examMode ? (
          // Exam Mode Timer - Show End Mock button with improved functionality
          <div className="flex items-center justify-between space-x-2 bg-red-900/50 border border-red-700 rounded-md px-3 py-1.5 transition-colors shadow-lg shadow-red-900/30">
            {/* Timer display */}
            <div className="flex items-center space-x-2">
              <Clock
                size={16}
                className={`text-red-300 ${
                  timeLeft < 300 ? "animate-pulse" : ""
                }`}
              />
              <span
                className={`font-mono font-medium text-sm ${
                  timeLeft < 300 ? "text-red-400" : "text-red-200"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* End Mock button - Improved */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(
                  "End Mock button clicked directly in Timer component"
                );

                // Save the exam data without score first to record duration
                if (!examSaved) {
                  console.log(
                    "Saving mock exam data from End Mock button (without score for now)"
                  );
                  saveMockExamData(null)
                    .then((result) => {
                      console.log(
                        "Initial save successful for duration tracking",
                        result
                      );
                      setExamSaved(true);

                      // Instead of showing scoring modal immediately, exit exam mode with special flag
                      // to show mark scheme for checking
                      if (examModeChangeRef.current) {
                        examModeChangeRef.current(false, {
                          showMarkScheme: true,
                          score: null,
                          tempSave: true, // This indicates we still need to collect score
                          examId: result?.id, // We'll need this to update the record later
                        });
                      }
                    })
                    .catch((error) => {
                      console.error("Error saving:", error);
                      alert(
                        "There was an error saving your mock exam. Please try again."
                      );
                    });
                } else {
                  // If already saved, just show mark scheme
                  if (examModeChangeRef.current) {
                    examModeChangeRef.current(false, {
                      showMarkScheme: true,
                      score: null,
                      tempSave: true,
                    });
                  }
                }
              }}
              className="p-1.5 rounded-md bg-red-700 hover:bg-red-600 transition-colors flex items-center space-x-1 px-2"
            >
              <AlertTriangle size={14} className="text-red-100" />
              <span className="text-xs font-medium text-red-100">End Mock</span>
            </button>
          </div>
        ) : !user ? (
          // Not logged in - Show login button
          <div
            className="flex items-center bg-gradient-to-r from-gray-600 to-gray-800 rounded-md px-2 py-1.5 shadow-md border border-gray-500 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            onClick={() => (window.location.href = "/login")}
          >
            <div className="flex items-center space-x-2 relative z-10">
              <Lock size={16} className="text-gray-300 mr-1" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold leading-none">
                  Mock Exam
                </div>
                <span className="text-xs text-white">Login required</span>
              </div>
            </div>
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
                    Mock
                  </div>
                  <span className="font-mono font-bold text-sm text-white whitespace-nowrap">
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
        {showModal &&
          createPortal(
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
              <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-red-600 animate-scaleIn">
                <div className="flex items-center space-x-3 text-red-500 mb-4">
                  <AlertTriangle
                    size={28}
                    className="text-red-500 animate-pulse"
                  />
                  <h3 className="text-2xl font-bold">Start Mock Exam Mode</h3>
                </div>

                <div className="bg-red-900/30 p-4 rounded-lg border border-red-700 mb-5">
                  <p className="text-red-200 font-medium text-center">
                    You are about to enter a mock exam environment
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
                          and cannot be reset
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
                        Recorded Session
                      </h4>
                      <p className="text-gray-300 text-sm">
                        <span className="text-red-400 font-medium">
                          This mock will be counted and recorded
                        </span>{" "}
                        in your history regardless of completion
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
                </div>

                <div className="bg-red-950/50 p-3 rounded-lg border border-red-800 mb-6">
                  <p className="text-red-300 text-sm text-center font-medium">
                    <strong>IMPORTANT:</strong> Once started, there is no going
                    back. The mock exam WILL be counted. You can only end it to
                    provide your score.
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
                    Start Mock
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Scoring modal for recording self-assessed score */}
        {scoringModal &&
          createPortal(
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 p-4">
              <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border-2 border-red-600">
                <div className="flex items-center text-red-400 mb-4">
                  <AlertTriangle size={24} className="mr-2" />
                  <h3 className="text-xl font-bold">Mock Exam Ended</h3>
                </div>

                <p className="text-gray-300 mb-2">
                  Your mock exam has been ended and will be recorded in your
                  history. Please enter your score below:
                </p>

                <div className="bg-red-900/20 p-3 rounded-lg border border-red-700 mb-4">
                  <p className="text-red-300 text-sm text-center">
                    <strong>Required:</strong> You must enter a score to
                    complete the mock exam. After submitting, you'll be able to
                    check the mark scheme.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Your Score (0-100%): <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={userScore}
                    onChange={(e) => setUserScore(e.target.value)}
                    placeholder="Enter your score (required)"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-start mb-6 bg-gray-700 p-3 rounded-lg">
                  <Info
                    size={20}
                    className="text-blue-400 mr-2 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm text-gray-300">
                    <p>
                      This information will be saved to your profile and visible
                      in your mock exam history. After submitting, you'll see
                      the mark scheme to help you grade your work.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    className="flex-1 bg-red-600 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    onClick={handleScoreSubmit}
                  >
                    Submit Score & View Mark Scheme
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

export default Timer;
