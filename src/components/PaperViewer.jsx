import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  BookOpen,
  CheckCircle,
  Download,
  GripHorizontal,
  Clock,
  Split,
  Target,
  PlusCircle,
  CheckCircle2,
  Grid2X2,
  SplitSquareVertical,
  DownloadCloud,
  List,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import Timer from "./Timer";
import { useAuth } from "../contexts/AuthContext";
import {
  addPaperGoal,
  getUserGoals,
  getUserCompletedMocks,
  updateMockExamScore,
  updateMockExamByPath,
  autoCompleteGoalWhenMockCompleted,
} from "../firebase/userService";

// Helper function to extract subject from paper name or path
const extractSubject = (paperName, activePath = "") => {
  console.log("Extracting subject from:", { paperName, activePath });

  if (!paperName && !activePath) {
    console.log("No paperName or activePath provided, returning Unknown");
    return "Unknown";
  }

  // Extract from path first (more reliable)
  if (activePath) {
    const pathParts = activePath.split("/");
    console.log("Path parts:", pathParts);

    // The subject is typically the second element in exam board/subject paths
    if (pathParts.length >= 2) {
      if (["IAL", "IGCSE"].includes(pathParts[0])) {
        console.log(
          "Found exam board path structure, subject is:",
          pathParts[1]
        );
        return pathParts[1] || "Unknown";
      }
    }
  }

  // Fall back to extracting from paper name
  if (!paperName) {
    console.log("No paper name to extract from, returning Unknown");
    return "Unknown";
  }

  // Common subject codes in paper names
  const subjectMapping = {
    MATH: "Mathematics",
    PHYS: "Physics",
    CHEM: "Chemistry",
    BIO: "Biology",
    ECON: "Economics",
    ENG: "English",
    HIST: "History",
    GEOG: "Geography",
    COMP: "Computer Science",
    CS: "Computer Science",
    PHY: "Physics",
    BIOL: "Biology",
    ECONS: "Economics",
    ENGLISH: "English",
    PHYSICS: "Physics",
    CHEMISTRY: "Chemistry",
    MATHEMATICS: "Mathematics",
    BUSINESS: "Business Studies",
    ACCOUNTING: "Accounting",
    PSYCH: "Psychology",
    PSYCHOLOGY: "Psychology",
    SOCIOLOGY: "Sociology",
    ART: "Art & Design",
  };

  // Try to match a subject code
  const upperName = paperName.toUpperCase();
  for (const [code, subject] of Object.entries(subjectMapping)) {
    if (upperName.includes(code)) {
      console.log(`Found subject code ${code}, returning ${subject}`);
      return subject;
    }
  }

  console.log("No subject code found, returning Unknown");
  return "Unknown";
};

// Helper function to extract year from paper name or path
const extractYear = (paperName, activePath = "") => {
  console.log("Extracting year from:", { paperName, activePath });

  // Extract from path first (more reliable)
  if (activePath) {
    const pathParts = activePath.split("/");
    console.log("Path parts for year extraction:", pathParts);

    // Year is typically the third element after exam board and subject
    if (pathParts.length >= 3) {
      // Check if third part is a year
      if (/^20\d{2}$/.test(pathParts[2])) {
        console.log("Found year in path:", pathParts[2]);
        return pathParts[2];
      }
    }
  }

  if (!paperName) {
    console.log("No paper name provided for year extraction");
    return null;
  }

  // Look for 4-digit years (20XX)
  const yearMatch = paperName.match(/20\d{2}/);
  if (yearMatch) {
    console.log("Found year in paper name:", yearMatch[0]);
    return yearMatch[0];
  }

  // Try to extract from structured paper names like SubjectCode_Year_Season_Paper
  const parts = paperName.split("_");
  if (parts.length >= 2) {
    // Check if second part is a year
    if (/^20\d{2}$/.test(parts[1])) {
      console.log("Found year in structured paper name:", parts[1]);
      return parts[1];
    }
  }

  console.log("No year found in paper name or path");
  return null;
};

// Helper function to extract session from path and paper name
const extractSession = (activePath = "", paperName = "") => {
  console.log("Extracting session from:", { activePath, paperName });

  const sessionMapping = {
    m: "May/June",
    s: "May/June",
    w: "Oct/Nov",
    winter: "Oct/Nov",
    summer: "May/June",
    may: "May/June",
    june: "May/June",
    oct: "Oct/Nov",
    nov: "Oct/Nov",
    jan: "January",
    feb: "Feb/Mar",
    mar: "Feb/Mar",
  };

  // First try to get from path
  if (activePath) {
    const pathParts = activePath.split("/");
    console.log("Path parts for session extraction:", pathParts);

    // Session is typically the fourth element (after exam board, subject, year)
    if (pathParts.length >= 4) {
      const potentialSession = pathParts[3].toLowerCase();
      console.log("Potential session from path:", potentialSession);

      // Map common session abbreviations
      for (const [key, value] of Object.entries(sessionMapping)) {
        if (potentialSession.includes(key)) {
          console.log(`Session match found in path: ${key} → ${value}`);
          return value;
        }
      }

      return pathParts[3]; // Return as-is if no mapping found
    }
  }

  // Try to extract from paper name if provided
  if (paperName) {
    const paperNameLower = paperName.toLowerCase();

    // Check for session indicators in paper name
    for (const [key, value] of Object.entries(sessionMapping)) {
      if (paperNameLower.includes(key)) {
        console.log(`Session match found in paper name: ${key} → ${value}`);
        return value;
      }
    }

    // Try to extract from structured paper names like SubjectCode_Year_Session_Paper
    const parts = paperName.split("_");
    if (parts.length >= 3) {
      const potentialSession = parts[2].toLowerCase();
      for (const [key, value] of Object.entries(sessionMapping)) {
        if (potentialSession.includes(key)) {
          console.log(
            `Session match found in structured name: ${key} → ${value}`
          );
          return value;
        }
      }
    }
  }

  console.log("No session found in path or paper name");
  return null;
};

// Helper function to extract exam board from path
const extractExamBoard = (activePath = "") => {
  console.log("Extracting exam board from:", activePath);

  if (!activePath) {
    console.log("No active path provided for exam board extraction");
    return "Unknown";
  }

  const pathParts = activePath.split("/");
  if (pathParts.length >= 1) {
    // First part is typically the exam board
    const examBoard = pathParts[0];
    console.log("Exam board from path:", examBoard);

    // Map abbreviations to full names
    const boardMapping = {
      IAL: "Edexcel International A Level",
      IGCSE: "Edexcel IGCSE",
      CIE: "Cambridge International",
      AQA: "AQA",
      OCR: "OCR",
      WJEC: "WJEC",
    };

    if (boardMapping[examBoard]) {
      console.log(
        `Mapped exam board: ${examBoard} → ${boardMapping[examBoard]}`
      );
      return boardMapping[examBoard];
    }

    return examBoard;
  }

  console.log("No exam board found in path");
  return "Unknown";
};

// Add this function near the other extract functions at the top
const isEnglishLanguageB = (activePath = "") => {
  if (!activePath) return false;
  const pathParts = activePath.split("/");
  // Check if it's English Language B by looking at the subject part of the path
  return pathParts.some((part) => part.toLowerCase() === "english language b");
};

export default function PaperViewer({
  selectedFile,
  activeTab,
  setActiveTab,
  timerDuration,
  timerRunning,
  handleTimerToggle,
  handleExamModeChange,
  initialExamMode,
  handleTimerMount,
  examMode,
  showTimer,
  effectiveIsMobile,
  activePath,
}) {
  const [sideBySideView, setSideBySideView] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // 50% default width for desktop
  const [topPanelHeight, setTopPanelHeight] = useState(50); // 50% default height for mobile
  const [selectedPaperType, setSelectedPaperType] = useState(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const stackedContainerRef = useRef(null);
  const isStackedDraggingRef = useRef(false);
  const timerRef = useRef(null); // Add ref for Timer component
  const { user } = useAuth();

  // Adding a new state for goal actions and mock exam checking
  const [addingToGoal, setAddingToGoal] = useState(false);
  const [goalAdded, setGoalAdded] = useState(false);
  const [isPaperInGoals, setIsPaperInGoals] = useState(false);
  const [isPaperCompletedAsMock, setIsPaperCompletedAsMock] = useState(false);
  const [isCheckingMockExam, setIsCheckingMockExam] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [mockScore, setMockScore] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tempSavedExamId, setTempSavedExamId] = useState(null);

  // State to track whether we're in mark scheme checking phase after mock exam
  useEffect(() => {
    // If activeTab is set to "ms" and sideBySideView is true, and it was due to a mock exam ending
    // then we're in mark scheme checking phase
    if (activeTab === "ms" && sideBySideView && !examMode) {
      const urlParams = new URLSearchParams(window.location.search);
      const isChecking = urlParams.get("checking") === "true";

      if (isChecking || sessionStorage.getItem("mockExamChecking") === "true") {
        setIsCheckingMockExam(true);
        // Store this state in session storage to persist across page refreshes
        sessionStorage.setItem("mockExamChecking", "true");

        // If we have an exam ID in the URL, store it
        const examId = urlParams.get("examId");
        if (examId) {
          setTempSavedExamId(examId);
          sessionStorage.setItem("tempSavedExamId", examId);
        } else if (sessionStorage.getItem("tempSavedExamId")) {
          setTempSavedExamId(sessionStorage.getItem("tempSavedExamId"));
        }
      }
    }
  }, [activeTab, sideBySideView, examMode]);

  // Handle the done checking button click
  const handleDoneChecking = () => {
    setShowScoreModal(true);
  };

  // Handle score submission
  const handleScoreSubmit = async () => {
    if (!mockScore || isNaN(parseInt(mockScore))) {
      alert("Please enter a valid score.");
      return;
    }

    try {
      console.log("Submitting score for paper:", selectedFile?.path);
      console.log("User:", user?.email);
      console.log("Score:", mockScore);

      // Get the exam data from session storage
      const tempSavedExamId = sessionStorage.getItem("tempSavedExamId");
      console.log("Temp saved exam ID:", tempSavedExamId);

      if (!tempSavedExamId) {
        throw new Error("No temporary exam ID found");
      }

      // Convert score to number
      const scoreNum = parseInt(mockScore);

      // Save the score to the completed mock exams
      const success = await updateMockExamScore(tempSavedExamId, scoreNum);
      console.log("Mock exam score updated successfully:", success);

      if (!success) {
        throw new Error("Failed to update mock exam score");
      }

      // Now update goal status if the paper is in goals
      try {
        const paperPath = activePath || selectedFile?.path;
        if (user && user.email && paperPath) {
          const goalUpdateResult = await autoCompleteGoalWhenMockCompleted(
            user.email,
            paperPath,
            scoreNum
          );
          console.log(
            `Goal update result: ${
              goalUpdateResult ? "Success" : "No action needed"
            }`
          );
        }
      } catch (goalError) {
        console.warn(
          "Error updating goal status, but mock exam was saved:",
          goalError
        );
        // Continue execution - we don't want to fail the whole operation if just the goal update fails
      }

      // Clear the checking state
      setIsCheckingMockExam(false);
      sessionStorage.removeItem("mockExamChecking");
      sessionStorage.removeItem("tempSavedExamId");

      // Update UI to reflect completed mock status
      setIsPaperCompletedAsMock(true);
      setShowScoreModal(false);

      // Show success modal instead of alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error updating mock exam score:", error);
      alert("There was an error saving your score. Please try again.");
    }
  };

  // Check if paper is in goals and if it's completed as a mock when selected file changes
  useEffect(() => {
    const checkPaperStatus = async () => {
      if (!user?.email || !selectedFile) {
        setIsPaperInGoals(false);
        setIsPaperCompletedAsMock(false);
        return;
      }

      try {
        const paperPath = activePath || selectedFile?.path || "";
        if (!paperPath) {
          setIsPaperInGoals(false);
          setIsPaperCompletedAsMock(false);
          return;
        }

        console.log("Checking paper status:", paperPath);

        // Normalize path for comparison
        const normalizedPath = paperPath
          .replace(/^\/+/, "")
          .replace(/\/+/g, "/")
          .trim();

        // Get user's goals
        const goals = await getUserGoals(user.email);
        console.log(`Found ${goals.length} goals for user:`, user.email);

        const isInGoals = goals.some((goal) => {
          const normalizedGoalPath = goal.path
            .replace(/^\/+/, "")
            .replace(/\/+/g, "/")
            .trim();
          const match = normalizedGoalPath === normalizedPath;
          if (match) {
            console.log("Paper found in goals:", goal);
          }
          return match;
        });

        // Get user's completed mocks
        const completedMocks = await getUserCompletedMocks(user.email);
        console.log(
          `Found ${completedMocks.length} completed mocks for user:`,
          user.email
        );

        const isCompletedAsMock = completedMocks.some((mock) => {
          const normalizedMockPath = (mock.rawPath || "")
            .replace(/^\/+/, "")
            .replace(/\/+/g, "/")
            .trim();
          const match = normalizedMockPath === normalizedPath;
          if (match) {
            console.log("Paper found in completed mocks:", mock);
          }
          return match;
        });

        console.log("Paper in goals:", isInGoals);
        console.log("Paper completed as mock:", isCompletedAsMock);

        setIsPaperInGoals(isInGoals);
        setIsPaperCompletedAsMock(isCompletedAsMock);
      } catch (error) {
        console.error("Error checking paper status:", error);
        setIsPaperInGoals(false);
        setIsPaperCompletedAsMock(false);
      }
    };

    if (selectedFile && user) {
      checkPaperStatus();
    }
  }, [selectedFile, user]);

  // When a mock exam is completed, set side-by-side view
  useEffect(() => {
    if (
      activeTab === "ms" &&
      !sideBySideView &&
      selectedFile &&
      selectedFile.ms
    ) {
      // Only trigger this automatically when coming from exam mode
      if (!examMode && activeTab === "ms") {
        console.log(
          "Mock exam completed - enabling side-by-side view for mark scheme checking"
        );
        setSideBySideView(true);
      }
    }
  }, [activeTab, examMode, selectedFile]);

  // Log props for debugging
  useEffect(() => {
    console.log("PaperViewer props:", {
      selectedFile: selectedFile?.name,
      activePath,
    });
  }, [selectedFile, activePath]);

  // Desktop horizontal divider drag handlers
  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    // Calculate percentage (limited to range 20-80%)
    let percentage = (mouseX / containerWidth) * 100;
    percentage = Math.max(20, Math.min(80, percentage));

    setLeftPanelWidth(percentage);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Remove the class from the body
    document.body.classList.remove("resize-divider-active");
  }, [handleMouseMove]);

  // Mobile vertical divider drag handlers
  const handleStackedMouseMove = useCallback((e) => {
    if (!isStackedDraggingRef.current || !stackedContainerRef.current) return;

    const containerRect = stackedContainerRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const mouseY = e.clientY - containerRect.top;

    // Calculate percentage (limited to range 20-80%)
    let percentage = (mouseY / containerHeight) * 100;
    percentage = Math.max(20, Math.min(80, percentage));

    setTopPanelHeight(percentage);
  }, []);

  const handleStackedTouchMove = useCallback((e) => {
    if (!isStackedDraggingRef.current || !stackedContainerRef.current) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const containerRect = stackedContainerRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const touch = e.touches[0];
    const touchY = touch.clientY - containerRect.top;

    // Calculate percentage (limited to range 20-80%)
    let percentage = (touchY / containerHeight) * 100;
    percentage = Math.max(20, Math.min(80, percentage));

    setTopPanelHeight(percentage);
  }, []);

  const handleStackedDragEnd = useCallback(() => {
    isStackedDraggingRef.current = false;
    document.removeEventListener("touchmove", handleStackedTouchMove);
    document.removeEventListener("mousemove", handleStackedMouseMove);
    document.removeEventListener("touchend", handleStackedDragEnd);
    document.removeEventListener("mouseup", handleStackedDragEnd);

    // Remove the class from the body
    document.body.classList.remove("resize-divider-active");
  }, [handleStackedTouchMove, handleStackedMouseMove]);

  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Add a class to the body to prevent text selection during drag
    document.body.classList.add("resize-divider-active");
  };

  const handleStackedDividerMouseDown = (e) => {
    e.preventDefault();
    isStackedDraggingRef.current = true;
    document.addEventListener("touchmove", handleStackedTouchMove, {
      passive: false,
    });
    document.addEventListener("mousemove", handleStackedMouseMove);
    document.addEventListener("touchend", handleStackedDragEnd);
    document.addEventListener("mouseup", handleStackedDragEnd);

    // Add a class to the body to prevent text selection during drag
    document.body.classList.add("resize-divider-active");
  };

  // Function to add current paper to goals
  const addToGoals = async () => {
    if (!user?.email || !selectedFile) return;

    setAddingToGoal(true);
    try {
      // Get the paper path and ensure it's properly set
      const paperPath = activePath || selectedFile?.path || "";

      // If still no path, log an error and show an alert
      if (!paperPath) {
        console.error("Cannot add to goals: No paper path found");
        alert(
          "Error: Cannot identify paper path. Please try selecting the paper again."
        );
        setAddingToGoal(false);
        return;
      }

      console.log("Adding paper to goals with path:", paperPath);
      console.log("Selected file info:", {
        name: selectedFile.name,
        path: paperPath,
        keys: Object.keys(selectedFile),
      });

      // Extract metadata for better organization
      const subject = extractSubject(selectedFile.name, paperPath);
      const year = extractYear(selectedFile.name, paperPath);
      const session = extractSession(paperPath, selectedFile.name);
      const examBoard = extractExamBoard(paperPath);

      // Prepare paper info for goal with richer metadata
      const paperInfo = {
        name: selectedFile.name || "Unknown Paper",
        path: paperPath,
        subject: subject,
        year: year,
        session: session,
        examBoard: examBoard,
        paperInfo: {
          ...selectedFile,
          path: paperPath,
          subject: subject,
          year: year,
          session: session,
          examBoard: examBoard,
        },
        // Set a default target date for 7 days from now
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      console.log("Adding paper to goals:", paperInfo);
      const success = await addPaperGoal(user.email, paperInfo);

      if (success) {
        console.log("Successfully added paper to goals");
        // Immediately update UI state to reflect the change
        setGoalAdded(true);
        setIsPaperInGoals(true);
        // Reset goalAdded state after 3 seconds but keep isPaperInGoals as true
        setTimeout(() => {
          setGoalAdded(false);
        }, 3000);
      } else {
        console.log("Paper already in goals or could not be added");
        alert("This paper is already in your goals or couldn't be added.");
        // Even if addition failed because it's already in goals, update the UI state
        setIsPaperInGoals(true);
      }
    } catch (error) {
      console.error("Error adding paper to goals:", error);
      alert(`Error adding paper to goals: ${error.message}`);
    } finally {
      setAddingToGoal(false);
    }
  };

  // Function to end the mock exam directly
  const endMockExam = () => {
    console.log("Direct end mock function called from PaperViewer");
    // Use the timer ref to call show scoring modal
    if (timerRef.current && timerRef.current.showScoringModal) {
      timerRef.current.showScoringModal();
    } else {
      console.error("Timer ref or showScoringModal function not available");
    }
  };

  // Add this function to handle paper type clicks
  const handlePaperTypeClick = (paperLink) => {
    if (!paperLink) {
      alert("This paper type is not available.");
      return;
    }
    const isEnglishB = isEnglishLanguageB(activePath);
    setActiveTab(isEnglishB ? "in" : "sp");
    setSideBySideView(false);
    setSelectedPaperType(paperLink);
  };

  // Add this section where the buttons are rendered
  const renderSolvedPaperOrBookletButton = () => {
    if (!selectedFile) return null;

    const isEnglishB = isEnglishLanguageB(activePath);
    const buttonLink = isEnglishB ? selectedFile?.in : selectedFile?.sp;
    const buttonText = isEnglishB ? "Booklet" : "Solved Paper";

    return (
      <button
        onClick={() => {
          if (!buttonLink) {
            alert(
              `This paper does not have a ${buttonText.toLowerCase()} available.`
            );
            return;
          }
          setActiveTab(isEnglishB ? "in" : "sp");
          setSideBySideView(false);
        }}
        className={`${
          effectiveIsMobile ? "px-3 py-1.5 text-sm" : "px-3 py-1.5"
        } rounded-md transition-all ${
          !buttonLink
            ? "bg-gray-800/50 backdrop-blur-sm text-gray-500 opacity-50 cursor-not-allowed border border-gray-700"
            : activeTab === (isEnglishB ? "in" : "sp")
            ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
            : "bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700/80 border border-gray-700 hover:border-gray-600"
        }`}
        disabled={!buttonLink}
      >
        <div className="flex items-center space-x-1">
          {isEnglishB ? (
            <BookOpen
              size={effectiveIsMobile ? 14 : 16}
              className={
                !buttonLink
                  ? "text-gray-500"
                  : activeTab === "in"
                  ? "text-white"
                  : "text-blue-400"
              }
            />
          ) : (
            <CheckCircle2
              size={effectiveIsMobile ? 14 : 16}
              className={
                !buttonLink
                  ? "text-gray-500"
                  : activeTab === "sp"
                  ? "text-white"
                  : "text-yellow-400"
              }
            />
          )}
          <span>
            {effectiveIsMobile ? (isEnglishB ? "IN" : "SP") : buttonText}
          </span>
        </div>
      </button>
    );
  };

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D1321] text-white p-4">
        <div className="p-1 rounded-2xl relative max-w-lg w-full mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-30"></div>
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl p-8 relative z-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
              <div className="relative bg-gray-900 rounded-full p-4 border border-blue-500/30 inline-block">
                <FileText size={48} className="text-blue-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Select a Past Paper
            </h2>

            <p className="text-gray-300 mb-8">
              Choose a paper from the file navigator to start your exam
              preparation
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-medium mb-2 text-blue-400">
                  Question Paper
                </h3>
                <p className="text-gray-300">
                  The original exam paper with questions
                </p>
              </div>

              <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-medium mb-2 text-blue-400">
                  Mark Scheme
                </h3>
                <p className="text-gray-300">
                  Official answers and marking guidelines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0D1321] text-white h-full">
      {/* Navigation bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (!selectedFile.qp) {
                alert("This paper does not have a question paper available.");
                return;
              }
              setActiveTab("qp");
              setSideBySideView(false);
            }}
            className={`${
              effectiveIsMobile ? "px-3 py-1.5 text-sm" : "px-3 py-1.5"
            } rounded-md transition-all ${
              !selectedFile.qp
                ? "bg-gray-800/50 backdrop-blur-sm text-gray-500 opacity-50 cursor-not-allowed border border-gray-700"
                : activeTab === "qp"
                ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
                : "bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700/80 border border-gray-700 hover:border-gray-600"
            }`}
            disabled={!selectedFile.qp}
          >
            <div className="flex items-center space-x-1">
              <FileText
                size={effectiveIsMobile ? 14 : 16}
                className={
                  !selectedFile.qp
                    ? "text-gray-500"
                    : activeTab === "qp"
                    ? "text-white"
                    : "text-blue-400"
                }
              />
              <span>{effectiveIsMobile ? "QP" : "Question Paper"}</span>
            </div>
          </button>

          <button
            onClick={() => {
              if (!selectedFile.ms) {
                alert("This paper does not have a mark scheme available.");
                return;
              }
              setActiveTab("ms");
              // Enable side-by-side view on desktop, stacked view on mobile
              setSideBySideView(true);
            }}
            className={`${
              effectiveIsMobile ? "px-3 py-1.5 text-sm" : "px-3 py-1.5"
            } rounded-md transition-all ${
              !selectedFile.ms
                ? "bg-gray-800/50 backdrop-blur-sm text-gray-500 opacity-50 cursor-not-allowed border border-gray-700"
                : activeTab === "ms"
                ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
                : "bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700/80 border border-gray-700 hover:border-gray-600"
            }`}
            disabled={!selectedFile.ms}
          >
            <div className="flex items-center space-x-1">
              <BookOpen
                size={effectiveIsMobile ? 14 : 16}
                className={
                  !selectedFile.ms
                    ? "text-gray-500"
                    : activeTab === "ms"
                    ? "text-white"
                    : "text-blue-400"
                }
              />
              <span>{effectiveIsMobile ? "MS" : "Mark Scheme"}</span>
            </div>
          </button>

          {/* Replace the old Solved Paper button with our new dynamic button */}
          {renderSolvedPaperOrBookletButton()}

          {/* Add to Goals button - only show if user is logged in, paper is not in goals, and not completed as mock */}
          {user && !isPaperInGoals && !isPaperCompletedAsMock && (
            <button
              onClick={addToGoals}
              disabled={addingToGoal || goalAdded}
              className={`ml-auto flex items-center justify-center px-3 py-1.5 rounded-md transition-all ${
                goalAdded
                  ? "bg-green-600/60 text-green-100 border border-green-500/50"
                  : "bg-indigo-600/70 hover:bg-indigo-600/80 text-white border border-indigo-500/50"
              }`}
            >
              {addingToGoal ? (
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              ) : goalAdded ? (
                <>
                  <CheckCircle2
                    size={effectiveIsMobile ? 14 : 16}
                    className="mr-1"
                  />
                  <span>{effectiveIsMobile ? "Added" : "Added to Goals"}</span>
                </>
              ) : (
                <>
                  <Target size={effectiveIsMobile ? 14 : 16} className="mr-1" />
                  <span>{effectiveIsMobile ? "Add Goal" : "Add to Goals"}</span>
                </>
              )}
            </button>
          )}
          {user && isPaperCompletedAsMock && (
            <div className="ml-auto flex items-center text-sm text-green-400 border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">
              <CheckCircle2 size={14} className="mr-1" />
              <span>Completed as Mock</span>
            </div>
          )}
          {user && isPaperInGoals && !isPaperCompletedAsMock && (
            <div className="ml-auto flex items-center text-sm text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-1 rounded">
              <Target size={14} className="mr-1" />
              <span>In Study Goals</span>
            </div>
          )}
        </div>

        {/* Timer, Goal button and Download buttons */}
        <div className="flex items-center space-x-2">
          {/* Show "Done Checking" button if in checking phase */}
          {isCheckingMockExam && (
            <button
              onClick={handleDoneChecking}
              className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 transition-colors flex items-center space-x-1.5 text-white"
            >
              <CheckCircle2 size={16} className="text-white" />
              <span className="font-medium">Done Checking</span>
            </button>
          )}

          {/* Timer Component */}
          {showTimer && (
            <>
              <div
                className={
                  effectiveIsMobile ? "scale-90 origin-right transform-gpu" : ""
                }
              >
                {/* Debug logging for selected file */}
                {console.log(
                  "PaperViewer - selectedFile being passed to Timer:",
                  selectedFile
                )}
                <Timer
                  ref={timerRef} // Add ref to access Timer methods
                  duration={timerDuration}
                  isRunning={timerRunning}
                  onToggle={handleTimerToggle}
                  onExamModeChange={handleExamModeChange}
                  initialExamMode={initialExamMode}
                  onMount={handleTimerMount}
                  paperInfo={{
                    subject: extractSubject(selectedFile?.name, activePath),
                    paperCode: selectedFile?.name || "Unknown",
                    year: extractYear(selectedFile?.name, activePath),
                    session: extractSession(activePath, selectedFile?.name),
                    examBoard: extractExamBoard(activePath),
                    rawPath: activePath,
                    fullPath: activePath,
                    file: selectedFile,
                    pathParts: activePath ? activePath.split("/") : [],
                  }}
                />
              </div>

              {/* Direct End Mock button in PaperViewer component */}
              {examMode && user && (
                <button
                  onClick={endMockExam}
                  className="p-2 rounded-md bg-red-700 hover:bg-red-600 transition-colors flex items-center space-x-1.5 px-3 text-white"
                  type="button"
                >
                  <AlertTriangle size={16} />
                  <span className="font-medium">End Mock</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 relative overflow-hidden bg-[#0D1321]">
        {sideBySideView ? (
          // Side by side view
          <div className="flex h-full">
            {/* Left panel (Question Paper) */}
            <div
              className={`${effectiveIsMobile ? "w-full" : ""} h-full`}
              style={effectiveIsMobile ? {} : { width: `${leftPanelWidth}%` }}
            >
              {selectedFile?.qp && (
                <iframe
                  src={selectedFile.qp}
                  className="w-full h-full border-0"
                  title="Question Paper"
                  style={{ backgroundColor: "white" }}
                />
              )}
            </div>

            {/* Divider */}
            {!effectiveIsMobile && (
              <div
                className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors"
                onMouseDown={handleDividerMouseDown}
              />
            )}

            {/* Right panel */}
            <div
              className={`${effectiveIsMobile ? "w-full" : ""} h-full`}
              style={
                effectiveIsMobile ? {} : { width: `${100 - leftPanelWidth}%` }
              }
            >
              {activeTab === "ms" && selectedFile?.ms && (
                <iframe
                  src={selectedFile.ms}
                  className="w-full h-full border-0"
                  title="Mark Scheme"
                  style={{ backgroundColor: "white" }}
                />
              )}
              {activeTab === "sp" && selectedFile?.sp && (
                <iframe
                  src={selectedFile.sp}
                  className="w-full h-full border-0"
                  title="Solved Paper"
                  style={{ backgroundColor: "white" }}
                />
              )}
              {activeTab === "in" && selectedFile?.in && (
                <iframe
                  src={selectedFile.in}
                  className="w-full h-full border-0"
                  title="Booklet"
                  style={{ backgroundColor: "white" }}
                />
              )}
            </div>
          </div>
        ) : (
          // Single view
          <div className="h-full">
            {activeTab === "qp" && selectedFile?.qp && (
              <iframe
                src={selectedFile.qp}
                className="w-full h-full border-0"
                title="Question Paper"
                style={{ backgroundColor: "white" }}
              />
            )}
            {activeTab === "ms" && selectedFile?.ms && (
              <iframe
                src={selectedFile.ms}
                className="w-full h-full border-0"
                title="Mark Scheme"
                style={{ backgroundColor: "white" }}
              />
            )}
            {activeTab === "sp" && selectedFile?.sp && (
              <iframe
                src={selectedFile.sp}
                className="w-full h-full border-0"
                title="Solved Paper"
                style={{ backgroundColor: "white" }}
              />
            )}
            {activeTab === "in" && selectedFile?.in && (
              <iframe
                src={selectedFile.in}
                className="w-full h-full border-0"
                title="Booklet"
                style={{ backgroundColor: "white" }}
              />
            )}
          </div>
        )}
      </div>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border-2 border-green-600">
            <div className="flex items-center text-green-400 mb-4">
              <CheckCircle2 size={24} className="mr-2" />
              <h3 className="text-xl font-bold">Enter Your Score</h3>
            </div>

            <p className="text-gray-300 mb-4">
              Now that you've checked your answers with the mark scheme, please
              enter your final score:
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Your Score (0-100%): <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={mockScore}
                onChange={(e) => setMockScore(e.target.value)}
                placeholder="Enter your score (required)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500"
                autoFocus
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScoreSubmit}
                className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border-2 border-green-600 animate-scaleIn">
            <div className="flex items-center text-green-400 mb-4">
              <CheckCircle2 size={28} className="mr-2" />
              <h3 className="text-xl font-bold">Score Recorded!</h3>
            </div>

            <div className="bg-green-900/20 p-4 rounded-lg border border-green-700 mb-5">
              <p className="text-green-200 font-medium text-center">
                Your mock exam has been successfully recorded with your score!
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="py-2.5 px-6 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
