import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import {
  User,
  FileText,
  Clock,
  Percent,
  Award,
  ClipboardList,
  Info,
  RefreshCw,
  Filter,
  Settings,
  ArrowUpRight,
  Calendar,
  ChartLine,
  ChevronDown,
  TrendingUp,
  LineChart,
  BarChart,
  Sigma,
  Target,
  CheckCircle2,
  PlusCircle,
  Trash2,
  CalendarClock,
  ChevronRight,
  ListFilter,
  SortAsc,
  XCircle,
  BarChart2,
  Layers,
  Flame,
  ClipboardCheck,
  Plus,
  Folder,
  FolderOpen,
  CheckSquare,
  Square,
  BookOpen,
  CalendarRange,
  X,
  Search,
  Loader2,
  InfoIcon,
  List,
  GraduationCap,
  CheckCircle,
  History,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import {
  getUserGoals,
  removePaperGoal,
  markGoalComplete,
  addPaperGoal,
  getUserCompletedMocks,
  deleteGoal,
  updateGoalStatus,
} from "../firebase/userService";
import "../animations.css";
import fileStructure from "../data/fileStructure.json";
import { useIsMobile, useIsTablet } from "../hooks/useMediaQuery";

// Add this function to calculate a performance comment based on scores
const generatePerformanceComment = (scores, trend) => {
  if (!scores || scores.length === 0) return "No data available to analyze.";

  const latestScore = scores[scores.length - 1];
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;

  if (scores.length < 2)
    return "Take more mock exams to see a performance trend.";

  if (trend === "increasing") {
    if (latestScore > 80) {
      return "Excellent progress! Your scores are consistently improving and your latest result shows mastery of the material.";
    } else if (latestScore > 60) {
      return "Good improvement trend! Continue practicing to reach mastery level.";
    } else {
      return "You're making progress! Keep working on key concepts to continue improving.";
    }
  } else if (trend === "decreasing") {
    if (latestScore > 80) {
      return "Your latest score is still strong, but watch the downward trend. Review recent topics to ensure continued mastery.";
    } else if (latestScore > 60) {
      return "Your performance shows a slight decline. Consider revisiting recent topics to strengthen your understanding.";
    } else {
      return "Your scores have been decreasing. Focus on core concepts and consider additional practice on challenging topics.";
    }
  } else {
    // stable
    if (averageScore > 80) {
      return "Consistently excellent performance! You've demonstrated strong mastery of this subject.";
    } else if (averageScore > 60) {
      return "Your performance is stable and good. Focus on specific topics to reach excellence.";
    } else {
      return "Your scores are consistent but could be improved. Consider focused practice on key concepts.";
    }
  }
};

// Add this function to determine the performance trend
const determinePerformanceTrend = (scores) => {
  if (!scores || scores.length < 3) return "neutral";

  // Simple linear regression to determine trend with more robust thresholds
  const n = scores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = scores;

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Calculate the average score to normalize the slope threshold
  const avgScore = sumY / n;
  const normalizedSlope = (slope / avgScore) * 100;

  // Use percentage-based thresholds instead of absolute values
  if (normalizedSlope > 2) return "increasing";
  if (normalizedSlope < -2) return "decreasing";
  return "neutral";
};

// Add a function to extract paper/unit from the path
const extractPaperUnitFromPath = (path) => {
  if (!path) return "Unknown";

  const parts = path.split("/");

  // Look for paper or unit indicators
  for (let i = 0; i < parts.length; i++) {
    // Common unit/paper patterns: P1, P2, P3, S1, M1, Paper 1, Paper1, etc.
    const part = parts[i];
    if (/^(P|S|M|C)\d+$/i.test(part) || /^Paper\s*\d+$/i.test(part)) {
      return part;
    }
  }

  // If no obvious unit pattern, try to infer from file name (last part)
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    // Look for unit or paper number in the file name
    const unitMatch = lastPart.match(/(P|S|M|C)(\d+)/i);
    if (unitMatch) {
      return unitMatch[0].toUpperCase();
    }

    // Look for Paper N in the file name
    const paperMatch = lastPart.match(/Paper\s*(\d+)/i);
    if (paperMatch) {
      return `Paper ${paperMatch[1]}`;
    }
  }

  return "Other";
};

// Function to extract subject from path
const extractSubjectFromPath = (path) => {
  if (!path) return null;

  const parts = path.split("/");
  if (parts.length >= 2) {
    // For paths like IAL/Mathematics or IGCSE/Physics
    if (["IAL", "IGCSE"].includes(parts[0])) {
      return `${parts[0]}-${parts[1]}`;
    }
  }
  return parts[0] || null;
};

// Function to group goals by paper/unit within each subject
const getGoalsBySubjectAndUnit = (goals) => {
  const grouped = {};

  goals.forEach((goal) => {
    const subject = extractSubjectFromPath(goal.path) || "Other";
    const unit = extractPaperUnitFromPath(goal.path);

    if (!grouped[subject]) {
      grouped[subject] = {};
    }

    if (!grouped[subject][unit]) {
      grouped[subject][unit] = [];
    }

    grouped[subject][unit].push(goal);
  });

  return grouped;
};

// Helper function to extract year from filename or path
const extractYear = (text) => {
  if (!text) return null;
  const yearMatch = text.match(/\b(20\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("performance");
  const [mockExams, setMockExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // State for subject preferences
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [subjectPreferences, setSubjectPreferences] = useState([]);
  const [stats, setStats] = useState({
    totalMocks: 0,
    totalTimeSpent: 0,
    avgScore: 0,
    mostAttemptedSubject: "",
    recentActivity: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add these state variables
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [subjectList, setSubjectList] = useState([]);
  const [unitList, setUnitList] = useState([]);

  // Goals-related state
  const [userGoals, setUserGoals] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [goalSearchQuery, setGoalSearchQuery] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  // Add Paper Management State
  const [availablePapers, setAvailablePapers] = useState([]);
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [paperSearchQuery, setPaperSearchQuery] = useState("");
  const [selectedSubjectForPapers, setSelectedSubjectForPapers] =
    useState("all");
  const [selectedYearForPapers, setSelectedYearForPapers] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("IAL");
  const [selectedUnitForPapers, setSelectedUnitForPapers] = useState("all");
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [paperSelectionModalOpen, setPaperSelectionModalOpen] = useState(false);

  // Media query hooks for responsive design
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // New state for performance analytics
  const [filteredExams, setFilteredExams] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    scores: [],
    times: [],
    trend: "neutral",
    comment: "",
    trendLinePoints: [],
  });

  // New state for goals tab
  const [goals, setGoals] = useState([]);
  const [goalCompletionRate, setGoalCompletionRate] = useState(0);
  const [goalSortBy, setGoalSortBy] = useState("date-added");
  const [groupBySubject, setGroupBySubject] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [yearRange, setYearRange] = useState({ from: 2015, to: 2023 });
  const [paperPreview, setPaperPreview] = useState([]);

  // Add back the missing goalFilterType state
  const [goalFilterType, setGoalFilterType] = useState("all");

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // Fetch mock exam data for the current user
  const fetchMockExams = async () => {
    if (!user?.email) {
      console.log("No user email to fetch mock exams");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching mock exams for user:", user.email);

      // Query Firestore for mock exams associated with this user
      const mocksRef = collection(db, "mockExams");
      const q = query(
        mocksRef,
        where("userEmail", "==", user.email),
        orderBy("completedAt", "desc")
      );

      console.log("Mock exams query created");

      const querySnapshot = await getDocs(q);
      const examsData = [];

      console.log(`Found ${querySnapshot.size} mock exam records`);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Mock exam record ${doc.id}:`, data);

        // Extract path parts if available in rawPath but not in pathParts
        let pathParts = data.pathParts || [];
        if ((!pathParts || !pathParts.length) && data.rawPath) {
          pathParts = data.rawPath.split("/");
          console.log("Extracted pathParts from rawPath:", pathParts);
        }

        // Check if we have file data
        if (data.fileData) {
          console.log("Found fileData in mock exam record:", data.fileData);

          // Use file path if available and we don't have a valid path yet
          if (
            data.fileData.path &&
            (!data.rawPath || data.rawPath === "null")
          ) {
            console.log("Using path from fileData:", data.fileData.path);
            data.rawPath = data.fileData.path;

            // Recalculate path parts if needed
            if (!pathParts || pathParts.length === 0) {
              pathParts = data.fileData.path.split("/");
              console.log(
                "Re-extracted pathParts from fileData.path:",
                pathParts
              );
            }
          }

          // Use file name for paper code if needed
          if (
            data.fileData.name &&
            (!data.paperCode || data.paperCode === "Unknown")
          ) {
            console.log(
              "Using name from fileData as paper code:",
              data.fileData.name
            );
            data.paperCode = data.fileData.name;
          }
        }

        // Process exam board from path if not available
        let examBoard = data.examBoard || "Unknown";
        if (examBoard === "Unknown" && pathParts.length > 0) {
          const boardPart = pathParts[0];
          if (boardPart === "IAL" || boardPart === "IGCSE") {
            examBoard = boardPart;
            console.log("Extracted examBoard from path:", examBoard);
          }
        }

        // Process subject from path if not available
        let subject = data.subject || "Unknown";
        if (subject === "Unknown" && pathParts.length > 1) {
          subject = pathParts[1];
          console.log("Extracted subject from path:", subject);
        }

        // Process year from path if not available
        let year = data.year || null;
        if (!year && pathParts.length > 2 && /^20\d{2}$/.test(pathParts[2])) {
          year = pathParts[2];
          console.log("Extracted year from path:", year);
        }

        // Process session from path if not available
        let session = data.session || null;
        if (!session && pathParts.length > 3) {
          session = pathParts[3];
          console.log("Extracted session from path:", session);
        }

        // Ensure each record has all the required fields
        const processedExam = {
          id: doc.id,
          ...data,
          // Ensure these fields exist with enhanced data
          pathParts: pathParts,
          subject: subject,
          paperCode: data.paperCode || "Unknown",
          year: year,
          session: session,
          examBoard: examBoard,
          paperTitle: data.paperTitle || null,
          rawPath: data.rawPath || null,
          completedAt: data.completedAt || null,
          durationMinutes: data.durationMinutes || 0,
          score: data.score !== undefined ? data.score : null,
        };

        // If paperTitle wasn't generated or is "Unknown", generate it now
        if (
          !processedExam.paperTitle ||
          processedExam.paperTitle === "Unknown" ||
          processedExam.paperTitle === "Unknown Subject"
        ) {
          processedExam.paperTitle = formatPaperTitle(processedExam);
          console.log("Generated new paper title:", processedExam.paperTitle);
        }

        examsData.push(processedExam);
      });

      console.log("Total mock exams processed:", examsData.length);
      console.log("Mock exam details:", examsData);
      setMockExams(examsData);

      // Calculate statistics
      if (examsData.length > 0) {
        // Total time spent (in minutes)
        const totalTime = examsData.reduce(
          (sum, exam) => sum + (exam.durationMinutes || 0),
          0
        );

        // Get subject counts for finding most attempted
        const subjectCounts = {};
        examsData.forEach((exam) => {
          const subject = exam.subject || "Unknown";
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        });

        // Find most attempted subject
        const mostAttempted = Object.entries(subjectCounts).sort(
          ([, a], [, b]) => b - a
        )[0][0];

        // Calculate average score if available
        let avgScore = 0;
        const examsWithScores = examsData.filter(
          (exam) => exam.score !== undefined && exam.score !== null
        );
        if (examsWithScores.length > 0) {
          avgScore =
            examsWithScores.reduce((sum, exam) => sum + exam.score, 0) /
            examsWithScores.length;
        }

        const newStats = {
          totalMocks: examsData.length,
          totalTimeSpent: totalTime,
          avgScore: avgScore,
          mostAttemptedSubject: mostAttempted,
          recentActivity: examsData[0],
        };

        console.log("Calculated stats:", newStats);
        setStats(newStats);
      } else {
        console.log("No mock exams found for user");
      }
    } catch (error) {
      console.error("Error fetching mock exams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user subject preferences
  const fetchSubjectPreferences = async () => {
    if (!user?.email) {
      console.log("No user email to fetch subject preferences");
      return;
    }

    try {
      console.log("Fetching subject preferences for user:", user.email);
      const userPrefsDoc = doc(db, "userPreferences", user.email);
      const docSnap = await getDoc(userPrefsDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const subjects = data.subjects || [];
        console.log("Found subject preferences:", subjects);
        setSubjectPreferences(subjects);
      } else {
        console.log(
          "No preferences document exists for user, creating default"
        );
        // Create default preferences if none exist
        setSubjectPreferences([]);

        // Optionally create a default document
        try {
          await setDoc(doc(db, "userPreferences", user.email), {
            subjects: [],
          });
          console.log("Created default empty preferences document");
        } catch (err) {
          console.error("Error creating default preferences:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching subject preferences:", error);
    }
  };

  // Fetch all available subjects
  const fetchAvailableSubjects = async () => {
    try {
      // Set default subjects based on what's actually in the file structure
      const defaultSubjects = [
        // IAL subjects
        { id: "ial-mathematics", name: "IAL Mathematics" },

        // IGCSE subjects
        { id: "igcse-chemistry", name: "IGCSE Chemistry" },
        { id: "igcse-physics", name: "IGCSE Physics" },
        { id: "igcse-mathematics-a", name: "IGCSE Mathematics A" },
        { id: "igcse-mathematics-b", name: "IGCSE Mathematics B" },
        {
          id: "igcse-further-pure-mathematics",
          name: "IGCSE Further Pure Mathematics",
        },
      ];

      // Set subjects to default first
      setAvailableSubjects(defaultSubjects);

      // Then try to load from database
      const subjectsRef = collection(db, "subjects");
      const querySnapshot = await getDocs(subjectsRef);
      const subjects = [];

      if (querySnapshot.size > 0) {
        console.log(`Found ${querySnapshot.size} subjects in database`);
        querySnapshot.forEach((doc) => {
          subjects.push({ id: doc.id, ...doc.data() });
        });

        if (subjects.length > 0) {
          console.log("Using subjects from database:", subjects);
          setAvailableSubjects(subjects);
        }
      } else {
        console.log("No subjects found in database, using defaults");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      // Fallback subjects are already set
    }
  };

  // Initial data load
  useEffect(() => {
    if (!user?.email) return;

    fetchMockExams();
    fetchSubjectPreferences();
    fetchAvailableSubjects();
  }, [user?.email]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMockExams();
    setIsRefreshing(false);
  };

  // Toggle a subject preference (add if not present, remove if present)
  const toggleSubject = (subjectId) => {
    // Ensure lowercase for consistency
    const normalizedId = subjectId.toLowerCase();
    console.log("Toggling subject preference:", normalizedId);

    // Check if subject is already in preferences
    let newPreferences;
    if (subjectPreferences.includes(normalizedId)) {
      // Remove subject
      newPreferences = subjectPreferences.filter((id) => id !== normalizedId);
    } else {
      // Add subject
      newPreferences = [...subjectPreferences, normalizedId];
    }

    // Update state immediately for fast UI response
    setSubjectPreferences(newPreferences);

    // Then save to database in the background
    saveSubjectPreferencesInBackground(newPreferences);
  };

  // Save subject preferences without blocking the UI
  const saveSubjectPreferencesInBackground = async (subjects) => {
    if (!user?.email) {
      console.log("No user email, cannot save preferences");
      return;
    }

    // Ensure all subjects are lowercase for consistency
    const normalizedSubjects = subjects.map((s) => s.toLowerCase());
    console.log(
      "Saving subject preferences in background:",
      normalizedSubjects
    );

    try {
      const userPrefsDoc = doc(db, "userPreferences", user.email);
      await setDoc(
        userPrefsDoc,
        { subjects: normalizedSubjects },
        { merge: true }
      );
      console.log("Subject preferences saved successfully");
    } catch (error) {
      console.error("Error saving subject preferences:", error);
      // Show error but don't revert UI - could implement retry logic here
      alert(
        "Failed to save preferences. Changes may not persist after refresh."
      );
    }
  };

  // Check if a subject is selected in preferences
  const isSubjectSelected = (subjectId) => {
    return subjectPreferences.includes(subjectId.toLowerCase());
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time duration (minutes to hours and minutes)
  const formatDuration = (minutes) => {
    // Check if minutes is null or undefined, but allow 0
    if (minutes === null || minutes === undefined) return "N/A";

    // Convert to number to ensure proper calculation
    const mins = Number(minutes);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (mins === 0) return "0 min"; // Early ended exam
    if (hours === 0) return `${remainingMins} min`;
    return `${hours}h ${remainingMins}m`;
  };

  // Helper function to format subject display name
  const formatSubjectName = (subjectId) => {
    if (!subjectId) return "";

    // Handle prefixed subjects
    if (subjectId.startsWith("ial-") || subjectId.startsWith("igcse-")) {
      const [prefix, ...parts] = subjectId.split("-");
      const subject = parts.join(" ");
      return `${prefix.toUpperCase()} ${
        subject.charAt(0).toUpperCase() + subject.slice(1)
      }`;
    }

    // Fallback for non-prefixed subjects
    return subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
  };

  // Toggle all subjects at once
  const toggleAllSubjects = () => {
    // If all subjects are already selected, deselect all
    // Otherwise, select all
    if (availableSubjects.every((subject) => isSubjectSelected(subject.id))) {
      // Deselect all
      setSubjectPreferences([]);
      saveSubjectPreferencesInBackground([]);
    } else {
      // Select all
      const allSubjectIds = availableSubjects.map((subject) =>
        subject.id.toLowerCase()
      );
      setSubjectPreferences(allSubjectIds);
      saveSubjectPreferencesInBackground(allSubjectIds);
    }
  };

  // Check if all subjects are selected
  const areAllSubjectsSelected = () => {
    return (
      availableSubjects.length > 0 &&
      availableSubjects.every((subject) => isSubjectSelected(subject.id))
    );
  };

  // Format paper title for display
  const formatPaperTitle = (exam) => {
    // If paper title exists and is not empty or "Unknown", return it
    if (
      exam.paperTitle &&
      exam.paperTitle !== "Unknown" &&
      exam.paperTitle !== "Unknown Subject"
    ) {
      return exam.paperTitle;
    }

    // Log the exam info for debugging
    console.log("Generating paper title for exam record:", {
      id: exam.id,
      subject: exam.subject,
      paperCode: exam.paperCode,
      hasPathParts: exam.pathParts && exam.pathParts.length > 0,
      hasFileData: !!exam.fileData,
      hasUrls: !!exam.urls,
    });

    // Otherwise, generate a title from the available fields
    let title = [];

    // Try to get data from pathParts first (most reliable)
    if (exam.pathParts && exam.pathParts.length > 0) {
      // Board is pathParts[0]
      if (exam.pathParts[0]) {
        title.push(exam.pathParts[0]);
      }

      // Subject is pathParts[1]
      if (exam.pathParts.length > 1 && exam.pathParts[1]) {
        title.push(exam.pathParts[1]);
      }

      // Year is pathParts[2]
      if (
        exam.pathParts.length > 2 &&
        exam.pathParts[2] &&
        /^20\d{2}$/.test(exam.pathParts[2])
      ) {
        let yearStr = exam.pathParts[2];

        // Add session if available (pathParts[3])
        if (exam.pathParts.length > 3 && exam.pathParts[3]) {
          yearStr += ` ${exam.pathParts[3]}`;
        }

        title.push(yearStr);
      }

      // Paper Code is the filename from the path
      if (exam.paperCode && exam.paperCode !== "Unknown") {
        // Clean up the paper code (remove file extension)
        let paperCode = exam.paperCode;
        if (paperCode.endsWith(".pdf")) {
          paperCode = paperCode.slice(0, -4);
        }
        title.push(paperCode);
      }
    } else {
      // Fallback to individual fields if pathParts not available

      // Add exam board if available
      if (exam.examBoard && exam.examBoard !== "Unknown") {
        title.push(exam.examBoard);
      } else if (exam.rawPath) {
        const boardFromPath = exam.rawPath.split("/")[0];
        if (boardFromPath === "IAL" || boardFromPath === "IGCSE") {
          title.push(boardFromPath);
        }
      }

      // Add subject
      if (exam.subject && exam.subject !== "Unknown") {
        title.push(exam.subject);
      }

      // Add year and session
      if (exam.year) {
        let yearStr = exam.year;
        if (exam.session) {
          yearStr += ` ${exam.session}`;
        }
        title.push(yearStr);
      } else if (exam.session) {
        title.push(exam.session);
      }

      // Add paper code
      if (exam.paperCode && exam.paperCode !== "Unknown") {
        // Clean up the paper code
        let paperCode = exam.paperCode;
        if (paperCode.endsWith(".pdf")) {
          paperCode = paperCode.slice(0, -4);
        }
        title.push(paperCode);
      }
    }

    // Fallback to file data if we have it
    if (title.length === 0 && exam.fileData && exam.fileData.name) {
      return exam.fileData.name;
    }

    // Fallback to using QP URL if we have it
    if (title.length === 0 && exam.urls && exam.urls.qp) {
      // Try to extract a meaningful filename from the URL
      const url = exam.urls.qp;
      const urlParts = url.split("/");
      // Get the last meaningful part (usually contains file ID)
      const lastPart = urlParts[urlParts.length - 2] || "Unknown";
      return `Paper ${lastPart.substring(0, 8)}...`;
    }

    // Return generated title or fallback
    return title.length > 0 ? title.join(" - ") : "Unknown Paper";
  };

  // Add a new function to extract subjects and units from mock exams
  const extractSubjectsAndUnits = (exams) => {
    if (!exams || exams.length === 0) return;

    const subjects = new Map();
    const igcseSubjects = new Set();
    const ialSubjects = new Set();
    const ialUnits = new Map();

    exams.forEach((exam) => {
      const examBoard = exam.examBoard;
      const subject = exam.subject;

      if (examBoard === "IGCSE" && subject && subject !== "Unknown") {
        igcseSubjects.add(subject);
      } else if (examBoard === "IAL" && subject && subject !== "Unknown") {
        ialSubjects.add(subject);

        // Extract unit information from paper code for IAL
        if (exam.paperCode && exam.paperCode !== "Unknown") {
          const unitMatch = exam.paperCode.match(/^(P\d+|M\d+|S\d+|C\d+)/i);
          if (unitMatch) {
            const unit = unitMatch[0].toUpperCase();
            if (!ialUnits.has(subject)) {
              ialUnits.set(subject, new Set());
            }
            ialUnits.get(subject).add(unit);
          }
        }
      }
    });

    // Convert Sets to arrays
    const subjectsArr = [
      // Remove the "All Subjects" option
      ...Array.from(igcseSubjects).map((s) => ({
        id: `IGCSE-${s}`,
        name: `IGCSE ${s}`,
      })),
      ...Array.from(ialSubjects).map((s) => ({
        id: `IAL-${s}`,
        name: `IAL ${s}`,
      })),
    ];

    setSubjectList(subjectsArr);

    // If we have subjects and current selection is empty, select the first subject
    if (
      subjectsArr.length > 0 &&
      (!selectedSubject || selectedSubject === "all")
    ) {
      setSelectedSubject(subjectsArr[0].id);
      // Filter the exams based on the newly selected subject
      // This will be handled by the useEffect that watches selectedSubject
    }
  };

  // Add a function to update unit list when subject changes
  const updateUnitList = (subject) => {
    if (!subject) {
      setUnitList([{ id: "all", name: "All Units/Papers" }]);
      return;
    }

    // Extract subject details
    const [board, subjectName] = subject.split("-");

    if (board === "IGCSE") {
      // For IGCSE, units are paper types (Paper1, Paper2, etc.)
      const papers = mockExams
        .filter(
          (exam) => exam.examBoard === "IGCSE" && exam.subject === subjectName
        )
        .map((exam) => exam.paperCode)
        .filter((code) => code && code !== "Unknown");

      // Extract unique papers
      const uniquePapers = [...new Set(papers)];

      setUnitList([
        { id: "all", name: "All Papers" },
        ...uniquePapers.map((p) => ({ id: p, name: p })),
      ]);
    } else if (board === "IAL") {
      // For IAL, extract units like P1, P2, M1, etc.
      const units = new Set();

      mockExams
        .filter(
          (exam) => exam.examBoard === "IAL" && exam.subject === subjectName
        )
        .forEach((exam) => {
          if (exam.paperCode && exam.paperCode !== "Unknown") {
            const unitMatch = exam.paperCode.match(/^(P\d+|M\d+|S\d+|C\d+)/i);
            if (unitMatch) {
              units.add(unitMatch[0].toUpperCase());
            }
          }
        });

      setUnitList([
        { id: "all", name: "All Units" },
        ...Array.from(units).map((u) => ({ id: u, name: u })),
      ]);
    }
  };

  // Add a function to filter exams based on selections
  const filterExamsBySelection = () => {
    if (!mockExams || mockExams.length === 0) {
      setFilteredExams([]);
      return;
    }

    // If there's no subject selected but we have subjects available,
    // don't filter yet - the extractSubjectsAndUnits function will handle setting the initial subject
    if (!selectedSubject && subjectList.length > 0) {
      return;
    }

    let filtered = [...mockExams];

    // Filter by subject (which already includes the exam level prefix)
    if (selectedSubject) {
      const [level, subjectName] = selectedSubject.split("-");
      filtered = filtered.filter(
        (exam) => exam.examBoard === level && exam.subject === subjectName
      );
    }

    // Filter by unit/paper
    if (selectedUnit !== "all") {
      filtered = filtered.filter((exam) => {
        if (!exam.paperCode || exam.paperCode === "Unknown") return false;

        // For IAL, match unit pattern (P1, M1, etc.)
        if (exam.examBoard === "IAL") {
          const unitPattern = new RegExp(`^${selectedUnit}`, "i");
          return unitPattern.test(exam.paperCode);
        }

        // For IGCSE, match exact paper code
        return exam.paperCode === selectedUnit;
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = a.completedAt
        ? a.completedAt.toDate
          ? a.completedAt.toDate()
          : new Date(a.completedAt)
        : new Date(0);
      const dateB = b.completedAt
        ? b.completedAt.toDate
          ? b.completedAt.toDate()
          : new Date(b.completedAt)
        : new Date(0);
      return dateA - dateB;
    });

    setFilteredExams(filtered);

    // Generate performance data
    generatePerformanceData(filtered);
  };

  // Add function to generate performance data for charts
  const generatePerformanceData = (exams) => {
    if (!exams || exams.length === 0) {
      setPerformanceData({
        labels: [],
        scores: [],
        times: [],
        trend: "neutral",
        comment: "No data available for the selected criteria.",
        trendLinePoints: [],
      });
      return;
    }

    // Ensure exams are in chronological order for trend analysis
    const sortedExams = [...exams].sort((a, b) => {
      const dateA = a.completedAt
        ? a.completedAt.toDate
          ? a.completedAt.toDate()
          : new Date(a.completedAt)
        : new Date(0);
      const dateB = b.completedAt
        ? b.completedAt.toDate
          ? b.completedAt.toDate()
          : new Date(b.completedAt)
        : new Date(0);
      return dateA - dateB;
    });

    // Format dates for labels
    const labels = sortedExams.map((exam) => {
      const date = exam.completedAt
        ? exam.completedAt.toDate
          ? exam.completedAt.toDate()
          : new Date(exam.completedAt)
        : new Date();
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    // Extract scores and times
    const scores = sortedExams.map((exam) =>
      exam.score !== undefined && exam.score !== null ? exam.score : 0
    );
    const times = sortedExams.map((exam) => exam.durationMinutes || 0);

    // Calculate trend line points for visualization
    let trendLinePoints = [];
    if (scores.length >= 2) {
      // Simple linear regression
      const n = scores.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = scores;

      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumXX = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate points for trend line
      trendLinePoints = x.map((x) => ({
        x: x,
        y: Math.max(0, Math.min(100, slope * x + intercept)), // Clamp values between 0-100%
      }));
    }

    // Determine trend
    const trend = determinePerformanceTrend(scores);

    // Generate comment
    const comment = generatePerformanceComment(scores, trend);

    setPerformanceData({
      labels,
      scores,
      times,
      trend,
      comment,
      trendLinePoints,
    });
  };

  // Add effect to extract subjects when mock exams change
  useEffect(() => {
    if (mockExams.length > 0) {
      extractSubjectsAndUnits(mockExams);
    }
  }, [mockExams]);

  // Add effect to filter exams whenever the filtered subjects list is updated
  useEffect(() => {
    if (subjectList.length > 0) {
      // If no subject is selected but we have subjects, select the first one
      if (!selectedSubject && subjectList.length > 0) {
        setSelectedSubject(subjectList[0].id);
      } else {
        // Otherwise filter based on current selection
        filterExamsBySelection();
      }
    }
  }, [subjectList, selectedSubject, selectedUnit, mockExams]);

  // Add effect to update units when subject changes
  useEffect(() => {
    updateUnitList(selectedSubject);
  }, [selectedSubject, mockExams]);

  // Fetch user goals with expanded functionality
  const fetchUserGoals = async () => {
    if (!user || !user.email) {
      console.log("No user logged in");
      return;
    }

    setIsLoadingGoals(true);
    try {
      console.log("Fetching goals for user:", user.email);
      const userGoals = await getUserGoals(user.email);

      if (Array.isArray(userGoals)) {
        console.log(`Found ${userGoals.length} goals`);
        setGoals(userGoals);
      } else {
        console.error("Invalid goals data returned:", userGoals);
        setGoals([]);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      setError("Failed to load your goals. Please try again later.");
      setGoals([]);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  // Toggle selection of a goal for batch operations
  const toggleGoalSelection = (goalId) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goalId)) {
        return prev.filter((id) => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };

  // Toggle select or deselect all goals
  const toggleSelectAll = () => {
    if (selectedGoals.length === filteredGoals.length) {
      setSelectedGoals([]);
    } else {
      setSelectedGoals(filteredGoals.map((goal) => goal.id));
    }
  };

  // Batch delete selected goals
  const batchDeleteGoals = async () => {
    if (selectedGoals.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedGoals.length} goals?`
      )
    ) {
      return;
    }

    try {
      let success = true;

      // Process each selected goal
      for (const goalId of selectedGoals) {
        const result = await removePaperGoal(user.email, goalId);
        if (!result) success = false;
      }

      if (success) {
        // Update local state
        const updatedGoals = goals.filter(
          (goal) => !selectedGoals.includes(goal.id)
        );
        setGoals(updatedGoals);

        // Recalculate completion rate
        if (updatedGoals.length > 0) {
          const completedGoals = updatedGoals.filter((goal) => goal.completed);
          setGoalCompletionRate(
            (completedGoals.length / updatedGoals.length) * 100
          );
        } else {
          setGoalCompletionRate(0);
        }

        // Clear selection
        setSelectedGoals([]);
      }
    } catch (error) {
      console.error("Error deleting goals:", error);
    }
  };

  // Delete all goals for a specific subject
  const deleteSubjectGoals = async (subject, goalsToDelete) => {
    if (!goalsToDelete || goalsToDelete.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete all ${goalsToDelete.length} goals for ${subject}?`
      )
    ) {
      return;
    }

    try {
      let success = true;
      const goalIds = goalsToDelete.map((goal) => goal.id);

      // Process each goal for this subject
      for (const goalId of goalIds) {
        const result = await removePaperGoal(user.email, goalId);
        if (!result) success = false;
      }

      if (success) {
        // Update local state
        const updatedGoals = goals.filter((goal) => !goalIds.includes(goal.id));
        setGoals(updatedGoals);

        // Recalculate completion rate
        if (updatedGoals.length > 0) {
          const completedGoals = updatedGoals.filter((goal) => goal.completed);
          setGoalCompletionRate(
            (completedGoals.length / updatedGoals.length) * 100
          );
        } else {
          setGoalCompletionRate(0);
        }

        // Clear selection that might include deleted goals
        setSelectedGoals((prev) => prev.filter((id) => !goalIds.includes(id)));
      }
    } catch (error) {
      console.error(`Error deleting goals for subject ${subject}:`, error);
      alert(`Failed to delete goals for ${subject}. Please try again.`);
    }
  };

  // Set target date for selected goals
  // Remove the batchSetTargetDate function completely
  // const batchSetTargetDate = async () => {
  //   if (!user?.email || selectedGoals.length === 0 || !selectedTargetDate) {
  //     alert("Please select goals and a target date.");
  //     return;
  //   }
  //
  //   try {
  //     // Use dedicated function for batch updates
  //     const success = await batchSetGoalTargetDate(
  //       user.email,
  //       selectedGoals,
  //       selectedTargetDate
  //     );
  //
  //     if (success) {
  //       // Update local state
  //       const updatedGoals = goals.map((goal) => {
  //         if (selectedGoals.includes(goal.id)) {
  //           return { ...goal, targetDate: selectedTargetDate };
  //         }
  //         return goal;
  //       });
  //
  //       setGoals(updatedGoals);
  //       setTargetDateModalOpen(false);
  //       setSelectedTargetDate(null);
  //     } else {
  //       alert("Failed to set target dates. Please try again.");
  //     }
  //   } catch (error) {
  //     console.error("Error batch setting target dates:", error);
  //     alert("An error occurred while setting target dates. Please try again.");
  //   }
  // };

  // Toggle expand/collapse for a subject group
  const toggleSubjectExpanded = (subject) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  // Get filtered and sorted goals
  const getFilteredGoals = () => {
    if (!goals) return [];

    // First filter by goal status type
    let filtered = [...goals];
    if (goalFilterType === "pending") {
      filtered = filtered.filter((goal) => !goal.completed);
    } else if (goalFilterType === "completed") {
      filtered = filtered.filter((goal) => goal.completed);
    }

    // Sort by selected criteria
    if (goalSortBy === "date-added") {
      filtered.sort((a, b) => {
        // Sort by added date (newest first)
        const dateA = a.added?.toDate ? a.added.toDate() : new Date(0);
        const dateB = b.added?.toDate ? b.added.toDate() : new Date(0);
        return dateB - dateA;
      });
    } else if (goalSortBy === "subject") {
      filtered.sort((a, b) => {
        // Extract subjects from paths
        const subjectA = extractSubjectFromPath(a.path) || "";
        const subjectB = extractSubjectFromPath(b.path) || "";
        return subjectA.localeCompare(subjectB);
      });
    }

    return filtered;
  };

  // Group goals by subject
  const getGoalsBySubject = (goals) => {
    const grouped = {};

    goals.forEach((goal) => {
      const subject = extractSubjectFromPath(goal.path) || "Other";
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(goal);
    });

    return grouped;
  };

  // Load goals when component mounts
  useEffect(() => {
    fetchUserGoals();
  }, [user?.email]);

  // Calculate filtered goals
  const filteredGoals = getFilteredGoals();
  const groupedGoals = groupBySubject ? getGoalsBySubject(filteredGoals) : null;

  // Toggle a folder's expanded state
  const toggleFolderExpanded = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Load available papers for the selection modal
  const loadAvailablePapers = async () => {
    setIsLoadingPapers(true);
    try {
      console.log("==== LOADING AVAILABLE PAPERS ====");

      // Try to get the paper structure from Firebase first
      let structure = null;

      try {
        // Attempt to get from 'paperStructure/structure' path
        const papersRef = doc(db, "paperStructure", "structure");
        const papersSnap = await getDoc(papersRef);

        if (papersSnap.exists()) {
          // Check if the structure is in 'structure' field or directly in the document
          if (papersSnap.data().structure) {
            structure = papersSnap.data().structure;
            console.log(
              "Retrieved paper structure from Firestore (paperStructure/structure)"
            );
          } else {
            structure = papersSnap.data();
            console.log(
              "Retrieved paper structure directly from Firestore document"
            );
          }
        } else {
          console.log(
            "No paper structure found at paperStructure/structure, trying alternative location"
          );
        }
      } catch (error) {
        console.log("Error fetching from paperStructure/structure:", error);
      }

      // If not found, try alternate location
      if (!structure) {
        try {
          const altPapersRef = doc(db, "papers", "structure");
          const altPapersSnap = await getDoc(altPapersRef);

          if (altPapersSnap.exists()) {
            if (altPapersSnap.data().structure) {
              structure = altPapersSnap.data().structure;
              console.log(
                "Retrieved paper structure from Firestore (papers/structure)"
              );
            } else {
              structure = altPapersSnap.data();
              console.log(
                "Retrieved paper structure directly from papers document"
              );
            }
          }
        } catch (error) {
          console.log("Error fetching from papers/structure:", error);
        }
      }

      // If still not found, try collection approach
      if (!structure) {
        try {
          const papersCollectionRef = collection(db, "papers");
          const papersQuery = query(papersCollectionRef);
          const papersQuerySnap = await getDocs(papersQuery);

          if (!papersQuerySnap.empty) {
            // Construct structure from collection
            structure = { folders: [] };

            papersQuerySnap.forEach((doc) => {
              const data = doc.data();
              if (data.folders) {
                structure.folders = [...structure.folders, ...data.folders];
              }
            });

            console.log("Constructed paper structure from papers collection");
          }
        } catch (error) {
          console.log("Error fetching from papers collection:", error);
        }
      }

      // Last attempt - try to mock a basic structure
      if (!structure) {
        console.log(
          "No paper structure found in any location, using hardcoded fallback for testing"
        );

        // Create a basic mock structure for testing
        structure = {
          folders: [
            {
              name: "IAL",
              folders: [
                {
                  name: "Mathematics",
                  folders: [
                    {
                      name: "P1",
                      files: [
                        { name: "IAL Math P1 2022", type: "file" },
                        { name: "IAL Math P1 2021", type: "file" },
                      ],
                    },
                    {
                      name: "P2",
                      files: [
                        { name: "IAL Math P2 2022", type: "file" },
                        { name: "IAL Math P2 2021", type: "file" },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: "IGCSE",
              folders: [
                {
                  name: "Physics",
                  folders: [
                    {
                      name: "Paper 1",
                      files: [
                        { name: "IGCSE Physics Paper 1 2022", type: "file" },
                        { name: "IGCSE Physics Paper 1 2021", type: "file" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        };
      }

      if (!structure) {
        throw new Error("Could not obtain paper structure from any source");
      }

      // Log the structure to understand what we're working with
      console.log("Structure found - proceeding with extraction");
      if (structure && structure.folders && structure.folders.length > 0) {
        console.log(
          "Top level folders:",
          structure.folders.map((f) => f.name).join(", ")
        );
      }

      // Flatten the nested structure into an array of papers
      const flattenedPapers = [];

      // Recursive function to extract papers from structure
      const extractPapers = (node, path = []) => {
        if (!node) return;

        // Process files at this level
        if (node.files && Array.isArray(node.files)) {
          node.files.forEach((file) => {
            if (file && (file.type === "file" || !file.type)) {
              const fullPath = [...path, file.name].join("/");
              // Convert to uniform format
              flattenedPapers.push({
                name: file.name,
                path: fullPath,
                examBoard: path[0] || "", // First part is exam board
                subject: path[1] || "", // Second part is subject
                pathSegments: path, // Store all path segments for easier access
                year: extractYear(file.name) || extractYear(fullPath),
                qp: file.qp || "",
                ms: file.ms || "",
                sp: file.sp || "",
              });
            }
          });
        }

        // Process subfolders
        if (node.folders && Array.isArray(node.folders)) {
          node.folders.forEach((folder) => {
            if (folder && folder.name) {
              // Recursively process each subfolder with updated path
              extractPapers(folder, [...path, folder.name]);
            }
          });
        }
      };

      // Start extraction from root
      extractPapers(structure);

      console.log(`Extracted ${flattenedPapers.length} papers from structure`);

      // Log sample papers
      if (flattenedPapers.length > 0) {
        console.log("Sample papers:");
        const samples = flattenedPapers.slice(0, 3);
        samples.forEach((paper, i) => {
          console.log(`Paper ${i + 1}:`);
          console.log(`  Name: ${paper.name}`);
          console.log(`  Path: ${paper.path}`);
          console.log(`  ExamBoard: ${paper.examBoard}`);
          console.log(`  Subject: ${paper.subject}`);
          console.log(`  Year: ${paper.year}`);
          console.log(`  Path segments: ${paper.pathSegments.join(" > ")}`);
        });
      } else {
        console.warn("No papers found in structure! Using fallback data.");

        // Create some fallback papers for each level
        const fallbackPapers = [
          // IAL papers
          {
            name: "IAL Mathematics P1 Jan 2022",
            path: "IAL/Mathematics/P1/Jan-2022/IAL Mathematics P1 Jan 2022",
            examBoard: "IAL",
            subject: "Mathematics",
            pathSegments: ["IAL", "Mathematics", "P1", "Jan-2022"],
            year: 2022,
            session: "Jan",
          },
          {
            name: "IAL Mathematics P2 Jun 2022",
            path: "IAL/Mathematics/P2/Jun-2022/IAL Mathematics P2 Jun 2022",
            examBoard: "IAL",
            subject: "Mathematics",
            pathSegments: ["IAL", "Mathematics", "P2", "Jun-2022"],
            year: 2022,
            session: "Jun",
          },
          {
            name: "IAL Physics Unit 1 Jan 2022",
            path: "IAL/Physics/Unit 1/Jan-2022/IAL Physics Unit 1 Jan 2022",
            examBoard: "IAL",
            subject: "Physics",
            pathSegments: ["IAL", "Physics", "Unit 1", "Jan-2022"],
            year: 2022,
            session: "Jan",
          },
          // IGCSE papers
          {
            name: "IGCSE Physics Paper 1 May 2022",
            path: "IGCSE/Physics/Paper 1/May-2022/IGCSE Physics Paper 1 May 2022",
            examBoard: "IGCSE",
            subject: "Physics",
            pathSegments: ["IGCSE", "Physics", "Paper 1", "May-2022"],
            year: 2022,
            session: "May",
          },
          {
            name: "IGCSE Chemistry Paper 2 Nov 2022",
            path: "IGCSE/Chemistry/Paper 2/Nov-2022/IGCSE Chemistry Paper 2 Nov 2022",
            examBoard: "IGCSE",
            subject: "Chemistry",
            pathSegments: ["IGCSE", "Chemistry", "Paper 2", "Nov-2022"],
            year: 2022,
            session: "Nov",
          },
          {
            name: "IGCSE Mathematics Paper 4 May 2022",
            path: "IGCSE/Mathematics/Paper 4/May-2022/IGCSE Mathematics Paper 4 May 2022",
            examBoard: "IGCSE",
            subject: "Mathematics",
            pathSegments: ["IGCSE", "Mathematics", "Paper 4", "May-2022"],
            year: 2022,
            session: "May",
          },
        ];

        flattenedPapers.push(...fallbackPapers);
        console.log("Added fallback papers:", flattenedPapers.length);
      }

      // Update state
      setAvailablePapers(flattenedPapers);
    } catch (error) {
      console.error("Error loading papers:", error);
      console.error("Stack trace:", error.stack);

      // Create fallback papers so user can still use the modal
      const fallbackPapers = [
        // IAL papers
        {
          name: "IAL Mathematics P1 Jan 2022",
          path: "IAL/Mathematics/P1/Jan-2022/IAL Mathematics P1 Jan 2022",
          examBoard: "IAL",
          subject: "Mathematics",
          pathSegments: ["IAL", "Mathematics", "P1", "Jan-2022"],
          year: 2022,
          session: "Jan",
        },
        {
          name: "IAL Mathematics P2 Jun 2022",
          path: "IAL/Mathematics/P2/Jun-2022/IAL Mathematics P2 Jun 2022",
          examBoard: "IAL",
          subject: "Mathematics",
          pathSegments: ["IAL", "Mathematics", "P2", "Jun-2022"],
          year: 2022,
          session: "Jun",
        },
        {
          name: "IAL Physics Unit 1 Jan 2022",
          path: "IAL/Physics/Unit 1/Jan-2022/IAL Physics Unit 1 Jan 2022",
          examBoard: "IAL",
          subject: "Physics",
          pathSegments: ["IAL", "Physics", "Unit 1", "Jan-2022"],
          year: 2022,
          session: "Jan",
        },
        // IGCSE papers
        {
          name: "IGCSE Physics Paper 1 May 2022",
          path: "IGCSE/Physics/Paper 1/May-2022/IGCSE Physics Paper 1 May 2022",
          examBoard: "IGCSE",
          subject: "Physics",
          pathSegments: ["IGCSE", "Physics", "Paper 1", "May-2022"],
          year: 2022,
          session: "May",
        },
        {
          name: "IGCSE Chemistry Paper 2 Nov 2022",
          path: "IGCSE/Chemistry/Paper 2/Nov-2022/IGCSE Chemistry Paper 2 Nov 2022",
          examBoard: "IGCSE",
          subject: "Chemistry",
          pathSegments: ["IGCSE", "Chemistry", "Paper 2", "Nov-2022"],
          year: 2022,
          session: "Nov",
        },
        {
          name: "IGCSE Mathematics Paper 4 May 2022",
          path: "IGCSE/Mathematics/Paper 4/May-2022/IGCSE Mathematics Paper 4 May 2022",
          examBoard: "IGCSE",
          subject: "Mathematics",
          pathSegments: ["IGCSE", "Mathematics", "Paper 4", "May-2022"],
          year: 2022,
          session: "May",
        },
      ];

      setAvailablePapers(fallbackPapers);
      alert(
        "We've loaded a set of example papers for you to use. This happens when we can't access the full paper database. You can still explore and use all features with these example papers."
      );
    } finally {
      setIsLoadingPapers(false);
    }
  };

  // Add selected papers as goals - simplified implementation
  const addSelectedPapersAsGoals = async () => {
    if (!user || !user.email) {
      alert("You must be logged in to add papers to goals");
      return;
    }

    if (selectedPapers.length === 0) {
      alert("Please select at least one paper to add to goals");
      return;
    }

    try {
      setIsLoadingPapers(true);
      console.log(`Adding ${selectedPapers.length} papers to goals`);

      let successCount = 0;
      let failCount = 0;

      // Default target date (7 days from now)
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (const paper of selectedPapers) {
        try {
          // Prepare the paper info for storage
          const paperForGoal = {
            name: paper.name,
            path: paper.path,
            subject: paper.subject,
            year: paper.year,
            session: paper.session,
            examBoard: paper.examBoard,
            qp: paper.qp || "",
            ms: paper.ms || "",
            sp: paper.sp || "",
            targetDate,
          };

          console.log("Adding to goals:", paperForGoal);

          const result = await addPaperGoal(user.email, paperForGoal);
          if (result) {
            console.log("Successfully added paper:", paper.name);
            successCount++;
          } else {
            console.log("Failed to add paper:", paper.name);
            failCount++;
          }
        } catch (error) {
          console.error("Error adding paper:", error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(
          `Added ${successCount} papers to your goals. ${
            failCount > 0 ? `${failCount} papers could not be added.` : ""
          }`
        );
      } else {
        alert(
          `No papers were added. ${failCount} papers were already in your goals or couldn't be added.`
        );
      }

      // Refresh goals list
      await fetchUserGoals();

      // If still in the modal with paper preview, refresh the preview to update statuses
      if (paperSelectionModalOpen && paperPreview.length > 0) {
        // Update alreadyInGoals status for papers in the preview
        setPaperPreview((prev) =>
          prev.map((paper) => ({
            ...paper,
            alreadyInGoals: isPaperInGoals(paper.path),
          }))
        );

        // Clear selected papers since they should now be in goals
        setSelectedPapers([]);
      } else {
        // Close modal and reset selection
        setPaperSelectionModalOpen(false);
        setSelectedPapers([]);
        setPaperPreview([]);
      }

      setIsLoadingPapers(false);
    } catch (error) {
      console.error("Error adding papers to goals:", error);
      alert(`Error: ${error.message}`);
      setIsLoadingPapers(false);
    }
  };

  // Filter papers by search query
  const getFilteredPapers = (papers, searchQuery) => {
    if (!searchQuery || !papers) return papers || [];

    const query = searchQuery.toLowerCase();
    return papers.filter(
      (paper) =>
        (paper.name && paper.name.toLowerCase().includes(query)) ||
        (paper.path && paper.path.toLowerCase().includes(query))
    );
  };

  // Helper function to check if a paper is already in goals
  const isPaperInGoals = (paperPath) => {
    if (!paperPath || goals.length === 0) return false;

    // Normalize the paper path for comparison
    const normalizedPaperPath = paperPath
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/")
      .trim();

    console.log(`Checking if paper exists in goals: ${normalizedPaperPath}`);

    for (const goal of goals) {
      // Skip if goal has no path
      if (!goal.path) continue;

      // Normalize the goal path the same way
      const normalizedGoalPath = goal.path
        .replace(/^\/+/, "")
        .replace(/\/+/g, "/")
        .trim();

      if (normalizedGoalPath === normalizedPaperPath) {
        console.log(
          `Paper already in goals: ${paperPath} matches ${goal.path}`
        );
        return true;
      }
    }

    return false;
  };

  // Toggle selection of a paper
  const togglePaperSelection = (paper) => {
    if (paper.alreadyInGoals) return; // Don't toggle papers already in goals

    setSelectedPapers((prev) => {
      const isSelected = prev.some((p) => p.path === paper.path);
      if (isSelected) {
        // Remove paper from selection
        return prev.filter((p) => p.path !== paper.path);
      } else {
        // Add paper to selection
        return [...prev, paper];
      }
    });
  };

  // Handle marking a goal as complete/incomplete
  const handleMarkComplete = async (goalId, isComplete) => {
    if (!user?.email || !goalId) return;

    try {
      console.log(
        `Marking goal ${goalId} as ${isComplete ? "complete" : "incomplete"}`
      );
      const success = await updateGoalStatus(user.email, goalId, isComplete);

      if (success) {
        // Update local state
        const updatedGoals = goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                completed: isComplete,
                completedDate: isComplete ? new Date() : null,
              }
            : goal
        );
        setGoals(updatedGoals);

        // Show success message
        alert(
          `Goal ${
            isComplete ? "completed" : "marked as incomplete"
          } successfully!`
        );
      } else {
        alert("Failed to update goal status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating goal status:", error);
      alert("An error occurred while updating the goal. Please try again.");
    }
  };

  // Handle deleting a goal
  const handleDeleteGoal = async (goalId) => {
    if (!user?.email || !goalId) return;

    // Confirm deletion
    if (!confirm("Are you sure you want to remove this goal?")) {
      return;
    }

    try {
      console.log(`Deleting goal ${goalId}`);
      const success = await deleteGoal(user.email, goalId);

      if (success) {
        // Update local state by removing the goal
        setGoals(goals.filter((goal) => goal.id !== goalId));
        alert("Goal removed successfully!");
      } else {
        alert("Failed to remove goal. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("An error occurred while removing the goal. Please try again.");
    }
  };

  // Generate paper preview based on selections (level, subject, units, years)
  const generatePaperPreview = async () => {
    if (!selectedLevel || selectedSubjects.length === 0) {
      console.log("Level or subject not selected");
      alert("Please select a level and at least one subject.");
      return;
    }

    try {
      console.log("Generating paper preview...");
      console.log("Selected level:", selectedLevel);
      console.log("Selected subjects:", selectedSubjects);
      console.log("Selected units:", selectedUnits);
      console.log("Selected years:", selectedYears);

      // Set loading state
      setIsLoadingPapers(true);
      setPaperPreview([]);

      // Make sure we have the latest goals
      await fetchUserGoals();

      // Get the full subject data based on the selected subject
      const subjectId = selectedSubjects[0];
      console.log(`Fetching data for subject: ${subjectId}`);

      const papers = await getPapersForSubject(selectedLevel, subjectId);

      if (!papers || papers.length === 0) {
        console.log("No papers found for the selected subject");
        setIsLoadingPapers(false);
        alert("No papers found for the selected subject and criteria.");
        return;
      }

      console.log(`Found ${papers.length} papers for ${subjectId}`);

      // Filter papers based on selected units (if any)
      let filteredPapers = papers;
      if (selectedUnits.length > 0) {
        filteredPapers = papers.filter((paper) =>
          selectedUnits.some((unit) => paper.name && paper.name.includes(unit))
        );
        console.log(
          `Filtered to ${filteredPapers.length} papers based on selected units`
        );

        // If no papers match the units filter, show a message but continue with all papers
        if (filteredPapers.length === 0) {
          console.log(
            "No papers match the selected units, showing all papers instead"
          );
          filteredPapers = papers;
        }
      }

      // Filter papers based on selected years (if any)
      if (selectedYears.length > 0) {
        const yearFilteredPapers = filteredPapers.filter((paper) =>
          selectedYears.includes(paper.year)
        );
        console.log(
          `Filtered to ${yearFilteredPapers.length} papers based on selected years`
        );

        // If no papers match the years filter, show a message but continue with unfiltered papers
        if (yearFilteredPapers.length === 0) {
          console.log(
            "No papers match the selected years, showing all papers instead"
          );
        } else {
          // Only apply the year filter if it doesn't filter out all papers
          filteredPapers = yearFilteredPapers;
        }
      }

      // Check if papers are already in goals
      const papersWithGoalStatus = filteredPapers.map((paper) => {
        const alreadyInGoals = isPaperInGoals(paper.path);
        return {
          ...paper,
          alreadyInGoals,
        };
      });

      console.log(
        `Final preview contains ${papersWithGoalStatus.length} papers`
      );
      setPaperPreview(papersWithGoalStatus);
      setIsLoadingPapers(false);

      // If no papers remain after filtering, show a helpful message
      if (papersWithGoalStatus.length === 0) {
        alert(
          "No papers match your selected filters. Try selecting different units or years."
        );
      }
    } catch (error) {
      console.error("Error generating paper preview:", error);
      alert(
        "There was an error generating the paper preview. Please try again."
      );
      setIsLoadingPapers(false);
    }
  };

  // Helper function to get papers for a specific subject
  const getPapersForSubject = async (level, subjectId) => {
    try {
      // Get the subject from the ID
      const subject = subjectId.split("-")[1] || subjectId; // Extract just the subject name
      console.log(`Getting papers for ${level}/${subject}`);

      // First try to get papers from fileStructure
      if (fileStructure && level) {
        console.log(
          `Looking up papers in fileStructure for ${level}/${subject}`
        );

        // Try possible variations of the subject name
        const possibleNames = [
          subject,
          subject.charAt(0).toUpperCase() + subject.slice(1),
          subject.replace(/-/g, " "),
          subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, " "),
          subject.replace(/-/g, ""),
          subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ""),
        ];

        // Debug available subjects
        console.log(
          "Available subjects in fileStructure:",
          fileStructure[level] ? Object.keys(fileStructure[level]) : "none"
        );

        // Find the first matching subject name
        let subjectData = null;
        let matchedName = null;

        for (const name of possibleNames) {
          if (fileStructure[level] && fileStructure[level][name]) {
            subjectData = fileStructure[level][name];
            matchedName = name;
            console.log(`Found match in fileStructure: ${level}/${name}`);
            break;
          }
        }

        if (subjectData) {
          // Found the subject in fileStructure
          console.log(
            `Using fileStructure data for papers: ${level}/${matchedName}`
          );

          const papers = [];

          // Extract years from fileStructure
          const yearKeys = Object.keys(subjectData).filter((key) =>
            /^20\d{2}$/.test(key)
          );
          console.log(`Found ${yearKeys.length} years for papers:`, yearKeys);

          // Process each year
          for (const year of yearKeys) {
            const yearNum = parseInt(year);
            const yearData = subjectData[year];

            // Process each session in this year
            for (const session in yearData) {
              const sessionData = yearData[session][session]; // This is the array of papers

              if (!Array.isArray(sessionData)) {
                console.log(`Data for ${year} ${session} is not an array`);
                continue;
              }

              // Process each paper in this session
              for (const paper of sessionData) {
                if (!paper || !paper.name) continue;

                // Construct the paper path
                const paperPath = `${level}/${matchedName}/${paper.name}/${year}/${session}`;

                papers.push({
                  name: `${matchedName} ${paper.name} ${year} ${session}`,
                  path: paperPath,
                  fullPath: paperPath,
                  subject: matchedName,
                  year: yearNum,
                  session: session,
                  examBoard: level,
                  qp: paper.qp || "",
                  ms: paper.ms || "",
                  sp: paper.sp || "",
                });
              }
            }
          }

          console.log(
            `Found ${papers.length} papers in fileStructure for ${level}/${matchedName}`
          );
          if (papers.length > 0) {
            return papers;
          }
        }
      }

      // Fallback to Firebase if no papers found in fileStructure
      console.log(`Falling back to Firebase for papers: ${level}/${subject}`);

      // Create a reference to the subject data
      const subjectRef = doc(db, "subjects", level, subject, "data");
      const subjectDoc = await getDoc(subjectRef);

      if (!subjectDoc.exists()) {
        console.log(`No data found in Firebase for ${level}/${subject}`);
        return [];
      }

      const subjectData = subjectDoc.data();
      const papers = [];

      // Process each year
      for (const year in subjectData) {
        if (!/^20\d{2}$/.test(year)) continue; // Skip if not a year

        const yearData = subjectData[year];
        const yearNum = parseInt(year);

        // Process each session in this year
        for (const session in yearData) {
          const sessionData = yearData[session][session]; // This is the array of papers

          if (!Array.isArray(sessionData)) {
            console.log(`Data for ${year} ${session} is not an array`);
            continue;
          }

          // Process each paper in this session
          for (const paper of sessionData) {
            if (!paper || !paper.name) continue;

            // Construct the paper path
            const paperPath = `${level}/${subject}/${paper.name}/${year}/${session}`;

            papers.push({
              name: `${subject} ${paper.name} ${year} ${session}`,
              path: paperPath,
              fullPath: paperPath,
              subject: subject,
              year: yearNum,
              session: session,
              examBoard: level,
              qp: paper.qp || "",
              ms: paper.ms || "",
              sp: paper.sp || "",
            });
          }
        }
      }

      return papers;
    } catch (error) {
      console.error("Error getting papers for subject:", error);
      return [];
    }
  };

  // Add papers from preview to goals
  const addSelectedPapersFromPreview = async () => {
    if (!user || !user.email) {
      alert("You must be logged in to add papers to goals");
      return;
    }

    if (paperPreview.length === 0) {
      console.log("No papers in preview to add");
      return;
    }

    // Filter out papers that are already in goals
    const papersToAdd = paperPreview.filter((paper) => !paper.alreadyInGoals);

    if (papersToAdd.length === 0) {
      alert("All papers are already in your goals");
      return;
    }

    console.log(`Adding ${papersToAdd.length} papers to goals`);

    try {
      let successCount = 0;
      let failCount = 0;

      // Default target date (7 days from now)
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (const paper of papersToAdd) {
        try {
          // Prepare the paper info for storage
          const paperForGoal = {
            name: paper.name,
            path: paper.path,
            subject: paper.subject,
            year: paper.year,
            session: paper.session,
            examBoard: paper.examBoard,
            qp: paper.qp || "",
            ms: paper.ms || "",
            sp: paper.sp || "",
            targetDate: targetDate,
          };

          console.log(`Adding paper: ${paper.name}`);
          const result = await addPaperGoal(user.email, paperForGoal);

          if (result) {
            console.log(`Successfully added ${paper.name} to goals`);
            successCount++;
          } else {
            console.log(`Failed to add ${paper.name} to goals`);
            failCount++;
          }
        } catch (error) {
          console.error(`Error adding ${paper.name}:`, error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        alert(
          `Added ${successCount} papers to goals. ${
            failCount > 0 ? `${failCount} papers could not be added.` : ""
          }`
        );
      } else {
        alert(`Failed to add any papers to goals. Please try again.`);
      }

      // Close modal and refresh
      setPaperSelectionModalOpen(false);
      setSelectedLevel("");
      setSelectedSubjects([]);
      setSelectedUnits([]);
      setSelectedYears([]);
      setPaperPreview([]);

      // Refresh goals
      await fetchUserGoals();
    } catch (error) {
      console.error("Error adding papers to goals:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Reset paper selection state
  const resetPaperSelectionState = () => {
    console.log("Resetting paper selection state");
    setPaperSelectionModalOpen(false);
    setSelectedLevel("");
    setSelectedSubjects([]);
    setSelectedUnits([]);
    setSelectedYears([]);
    setAvailableUnits([]);
    setAvailableYears([]);
    setPaperPreview([]);
  };

  // Fetch available units and years for a subject
  const fetchAvailableUnitsAndYears = async (subject, level) => {
    console.log(`Fetching available units and years for ${level} - ${subject}`);

    try {
      setIsLoadingPapers(true);

      // Extract subject name from ID
      const subjectName = subject.split("-")[1] || subject;
      console.log("Extracted subject name:", subjectName);

      // Try to find the data in fileStructure first
      if (fileStructure && level) {
        console.log(
          `Looking up ${level}/${subjectName} in fileStructure from fetchAvailableUnitsAndYears`
        );

        // Try possible variations of the subject name
        const possibleNames = [
          subjectName,
          subjectName.charAt(0).toUpperCase() + subjectName.slice(1),
          subjectName.replace(/-/g, " "),
          subjectName.charAt(0).toUpperCase() +
            subjectName.slice(1).replace(/-/g, " "),
          subjectName.replace(/-/g, ""),
          subjectName.charAt(0).toUpperCase() +
            subjectName.slice(1).replace(/-/g, ""),
        ];

        // For debugging
        console.log(
          "Available subjects in fileStructure for",
          level,
          ":",
          fileStructure[level] ? Object.keys(fileStructure[level]) : "none"
        );

        // Find the first matching subject name
        let subjectData = null;
        let matchedName = null;

        for (const name of possibleNames) {
          if (fileStructure[level] && fileStructure[level][name]) {
            subjectData = fileStructure[level][name];
            matchedName = name;
            console.log(`Found match in fileStructure: ${level}/${name}`);
            break;
          }
        }

        if (subjectData) {
          // Found the subject in fileStructure
          console.log(
            `Using data from fileStructure for ${level}/${matchedName}`
          );

          // Extract years from fileStructure
          const yearKeys = Object.keys(subjectData).filter((key) =>
            /^20\d{2}$/.test(key)
          );
          console.log(`Found ${yearKeys.length} years:`, yearKeys);

          if (yearKeys.length > 0) {
            // Extract units and years
            const units = new Set();
            const years = new Set();

            // Process each year
            for (const year of yearKeys) {
              years.add(parseInt(year));
              const yearData = subjectData[year];

              // Process each session in this year
              for (const session in yearData) {
                const sessionData = yearData[session][session];

                if (Array.isArray(sessionData)) {
                  // Add unique units/papers
                  sessionData.forEach((paper) => {
                    if (paper && paper.name) {
                      units.add(paper.name);
                    }
                  });
                }
              }
            }

            // Convert sets to arrays and sort
            const unitsArray = Array.from(units).sort();
            const yearsArray = Array.from(years).sort((a, b) => b - a); // Sort years in descending order

            console.log(
              `Found ${unitsArray.length} units and ${yearsArray.length} years in fileStructure`
            );

            // Update state with data from fileStructure
            setAvailableUnits(unitsArray);
            setAvailableYears(yearsArray);
            setIsLoadingPapers(false);

            // We've found and used the data, so return
            return;
          }
        }
      }

      // If we get here, we couldn't find data in fileStructure, so try Firestore
      // Fetch subject data from Firestore
      const subjectRef = doc(db, "subjects", level, subjectName, "data");
      console.log(
        "Fetching data from:",
        `subjects/${level}/${subjectName}/data`
      );

      const subjectDoc = await getDoc(subjectRef);

      if (!subjectDoc.exists()) {
        console.log(`No data found for ${level}/${subjectName}`);
        console.log("Document path may be incorrect or document doesn't exist");
        setAvailableUnits([]);
        setAvailableYears([]);
        setIsLoadingPapers(false);
        return;
      }

      console.log("Subject document exists, getting data");
      const subjectData = subjectDoc.data();
      console.log("Data keys:", Object.keys(subjectData));

      // Extract units and years
      const units = new Set();
      const years = new Set();

      // Process each year
      for (const year in subjectData) {
        console.log("Checking key:", year);
        if (!/^20\d{2}$/.test(year)) {
          console.log(`Skipping non-year key: ${year}`);
          continue; // Skip if not a year
        }

        console.log(`Found year: ${year}`);
        years.add(parseInt(year));
        const yearData = subjectData[year];

        // Process each session in this year
        for (const session in yearData) {
          console.log(`Processing session: ${session}`);
          const sessionData = yearData[session][session];

          if (!sessionData) {
            console.log(`No data for ${year}/${session}/${session}`);
            continue;
          }

          if (Array.isArray(sessionData)) {
            // Add unique units/papers
            console.log(
              `Found ${sessionData.length} papers in ${year}/${session}`
            );
            sessionData.forEach((paper) => {
              if (paper && paper.name) {
                units.add(paper.name);
                console.log(`Added unit: ${paper.name}`);
              } else {
                console.log("Paper missing name:", paper);
              }
            });
          } else {
            console.log(`Session data is not an array:`, typeof sessionData);
            console.log("Session data:", sessionData);
          }
        }
      }

      // Convert sets to arrays and sort
      const unitsArray = Array.from(units).sort();
      const yearsArray = Array.from(years).sort((a, b) => b - a); // Sort years in descending order

      console.log(
        `Found ${unitsArray.length} units and ${yearsArray.length} years for ${level} - ${subjectName}`
      );
      console.log("Years array:", yearsArray);
      console.log("Units array:", unitsArray);

      setAvailableUnits(unitsArray);
      setAvailableYears(yearsArray);
      console.log("State updated with years:", yearsArray);
      setIsLoadingPapers(false);
    } catch (error) {
      console.error("Error fetching available units and years:", error);
      console.error("Error stack:", error.stack);
      setAvailableUnits([]);
      setAvailableYears([]);
      setIsLoadingPapers(false);
    }
  };

  // Update the handler for subject selection
  const handleSubjectChange = (subject) => {
    console.log(`Subject selected: ${subject}`);
    console.log("Current state - Level:", selectedLevel);

    // Clear previous selections
    setSelectedSubjects([subject]);
    setSelectedUnits([]);
    setSelectedYears([]);
    setPaperPreview([]);
    console.log("Cleared previous selections");

    // Extract subject name from ID
    const subjectName = subject.split("-")[1] || subject;

    // Try to find the data in fileStructure
    if (fileStructure && selectedLevel) {
      console.log(
        `Looking up ${selectedLevel}/${subjectName} in fileStructure`
      );

      // Handle capitalization differences - try both exact match and capitalized first letter
      let lookupName = subjectName;
      const capitalizedName =
        subjectName.charAt(0).toUpperCase() + subjectName.slice(1);

      // Try possible variations of the subject name
      const possibleNames = [
        subjectName,
        capitalizedName,
        subjectName.replace(/-/g, " "),
        capitalizedName.replace(/-/g, " "),
        subjectName.replace(/-/g, ""),
        capitalizedName.replace(/-/g, ""),
      ];

      // For debugging
      console.log(
        "Available subjects in fileStructure for",
        selectedLevel,
        ":",
        fileStructure[selectedLevel]
          ? Object.keys(fileStructure[selectedLevel])
          : "none"
      );

      // Find the first matching subject name
      let subjectData = null;
      let matchedName = null;

      for (const name of possibleNames) {
        if (
          fileStructure[selectedLevel] &&
          fileStructure[selectedLevel][name]
        ) {
          subjectData = fileStructure[selectedLevel][name];
          matchedName = name;
          console.log(`Found match in fileStructure: ${selectedLevel}/${name}`);
          break;
        }
      }

      if (subjectData) {
        // Found the subject in fileStructure
        console.log(
          `Using data from fileStructure for ${selectedLevel}/${matchedName}`
        );

        // Extract years from fileStructure
        const yearKeys = Object.keys(subjectData).filter((key) =>
          /^20\d{2}$/.test(key)
        );
        console.log(`Found ${yearKeys.length} years:`, yearKeys);

        if (yearKeys.length > 0) {
          // Extract units and years
          const units = new Set();
          const years = new Set();

          // Process each year
          for (const year of yearKeys) {
            years.add(parseInt(year));
            const yearData = subjectData[year];

            // Process each session in this year
            for (const session in yearData) {
              const sessionData = yearData[session][session];

              if (Array.isArray(sessionData)) {
                // Add unique units/papers
                sessionData.forEach((paper) => {
                  if (paper && paper.name) {
                    units.add(paper.name);
                  }
                });
              }
            }
          }

          // Convert sets to arrays and sort
          const unitsArray = Array.from(units).sort();
          const yearsArray = Array.from(years).sort((a, b) => b - a); // Sort years in descending order

          console.log(`Found ${unitsArray.length} units:`, unitsArray);
          console.log(`Found ${yearsArray.length} years:`, yearsArray);

          // Update state with data from fileStructure
          setAvailableUnits(unitsArray);
          setAvailableYears(yearsArray);
          setIsLoadingPapers(false);

          // We've found and used the data, so return
          return;
        }
      } else {
        console.log(
          `Subject ${selectedLevel}/${subjectName} not found in fileStructure`
        );
      }
    }

    // If we couldn't find the data in fileStructure, try the database
    console.log(`Falling back to database for ${selectedLevel}/${subjectName}`);

    // Check database structure for diagnostic purposes
    const checkDatabaseStructure = async () => {
      try {
        // Check if the subjects collection exists
        const subjectsSnapshot = await getDocs(collection(db, "subjects"));
        console.log(
          `Subjects collection has ${subjectsSnapshot.size} documents`
        );

        // Check if this level exists
        const levelDoc = await getDoc(doc(db, "subjects", selectedLevel));
        const levelExists = levelDoc.exists();
        console.log(`Level document ${selectedLevel} exists: ${levelExists}`);

        if (levelExists) {
          // List all documents in the level
          const levelDocsSnapshot = await getDocs(
            collection(db, "subjects", selectedLevel)
          );
          console.log(
            `Level ${selectedLevel} has ${levelDocsSnapshot.size} subjects:`
          );
          levelDocsSnapshot.forEach((doc) => console.log(`- ${doc.id}`));

          // Check if subject exists
          const subjectDoc = await getDoc(
            doc(db, "subjects", selectedLevel, subjectName)
          );
          const subjectExists = subjectDoc.exists();
          console.log(
            `Subject document ${selectedLevel}/${subjectName} exists: ${subjectExists}`
          );

          if (subjectExists) {
            // List all documents in the subject
            const subjectDocsSnapshot = await getDocs(
              collection(db, "subjects", selectedLevel, subjectName)
            );
            console.log(
              `Subject ${selectedLevel}/${subjectName} has ${subjectDocsSnapshot.size} documents:`
            );
            subjectDocsSnapshot.forEach((doc) => console.log(`- ${doc.id}`));

            // Check if data document exists
            const dataDoc = await getDoc(
              doc(db, "subjects", selectedLevel, subjectName, "data")
            );
            const dataExists = dataDoc.exists();
            console.log(
              `Data document ${selectedLevel}/${subjectName}/data exists: ${dataExists}`
            );

            if (dataExists) {
              const data = dataDoc.data();
              console.log(`Data document keys:`, Object.keys(data));

              // Check for year keys
              const yearKeys = Object.keys(data).filter((key) =>
                /^20\d{2}$/.test(key)
              );
              console.log(`Found ${yearKeys.length} year keys:`, yearKeys);
            }
          }
        }
      } catch (error) {
        console.error("Error checking database structure:", error);
      }
    };

    // Run the structure check
    checkDatabaseStructure();

    // Fetch available units and years for this subject
    if (selectedLevel && subject) {
      console.log(
        `Calling fetchAvailableUnitsAndYears with ${subject}, ${selectedLevel}`
      );
      fetchAvailableUnitsAndYears(subject, selectedLevel);
    } else {
      console.warn("Cannot fetch units/years: missing level or subject", {
        level: selectedLevel,
        subject,
      });
    }
  };

  // Update the handler for level selection
  const handleLevelChange = (level) => {
    console.log(`Level selected: ${level}`);

    // Clear previous selections
    setSelectedLevel(level);
    setSelectedSubjects([]);
    setSelectedUnits([]);
    setSelectedYears([]);
    setAvailableUnits([]);
    setAvailableYears([]);
    setPaperPreview([]);

    // Add debugging after setting state
    console.log("Set selectedLevel to:", level);

    // Verify that subjects for this level will be available
    const levelsSubjects = availableSubjects.filter(
      (subject) =>
        (level === "IAL" &&
          (subject.id.includes("IAL") || subject.name?.includes("IAL"))) ||
        (level === "IGCSE" &&
          (subject.id.includes("IGCSE") || subject.name?.includes("IGCSE")))
    );
    console.log(
      `Found ${levelsSubjects.length} subjects for level ${level}:`,
      levelsSubjects.map((s) => s.id)
    );
  };

  // Load fileStructure.json when component mounts
  useEffect(() => {
    if (fileStructure) {
      console.log("=== FILE STRUCTURE LOADED ===");

      // IAL Mathematics
      if (fileStructure.IAL?.Mathematics) {
        const years = Object.keys(fileStructure.IAL.Mathematics).filter((y) =>
          /^20\d{2}$/.test(y)
        );
        console.log("IAL Mathematics Years:", years);

        // Check the first year to see the structure
        if (years.length > 0) {
          const firstYear = years[0];
          const sessions = Object.keys(
            fileStructure.IAL.Mathematics[firstYear]
          );
          console.log(`IAL Mathematics ${firstYear} Sessions:`, sessions);

          // Check the first session
          if (sessions.length > 0) {
            const firstSession = sessions[0];
            const papers =
              fileStructure.IAL.Mathematics[firstYear][firstSession][
                firstSession
              ];
            console.log(
              `IAL Mathematics ${firstYear} ${firstSession} Papers:`,
              papers.map((p) => p.name).join(", ")
            );
          }
        }
      } else {
        console.warn("IAL Mathematics not found in file structure");
      }

      // IGCSE subjects
      if (fileStructure.IGCSE) {
        const subjects = Object.keys(fileStructure.IGCSE);
        console.log("IGCSE Subjects:", subjects);

        // Check first subject
        if (subjects.length > 0) {
          const firstSubject = subjects[0];
          const years = Object.keys(fileStructure.IGCSE[firstSubject]).filter(
            (y) => /^20\d{2}$/.test(y)
          );
          console.log(`IGCSE ${firstSubject} Years:`, years);

          // Check first year
          if (years.length > 0) {
            const firstYear = years[0];
            const sessions = Object.keys(
              fileStructure.IGCSE[firstSubject][firstYear]
            );
            console.log(
              `IGCSE ${firstSubject} ${firstYear} Sessions:`,
              sessions
            );

            // Check first session
            if (sessions.length > 0) {
              const firstSession = sessions[0];
              const papers =
                fileStructure.IGCSE[firstSubject][firstYear][firstSession][
                  firstSession
                ];
              console.log(
                `IGCSE ${firstSubject} ${firstYear} ${firstSession} Papers:`,
                papers.map((p) => p.name).join(", ")
              );
            }
          }
        }
      } else {
        console.warn("IGCSE section not found in file structure");
      }
    } else {
      console.error("fileStructure.json not loaded!");
    }
  }, []);

  // Add a useEffect to monitor availableYears changes
  useEffect(() => {
    console.log("availableYears changed:", availableYears);
    console.log("Years count:", availableYears.length);
  }, [availableYears]);

  // Debug fileStructure on component mount
  useEffect(() => {
    if (fileStructure) {
      console.log("=== DEBUGGING FILE STRUCTURE ===");
      console.log("fileStructure top-level keys:", Object.keys(fileStructure));

      // Check IAL
      if (fileStructure.IAL) {
        console.log("IAL subjects:", Object.keys(fileStructure.IAL));

        // Mathematics specifically
        if (fileStructure.IAL.Mathematics) {
          console.log(
            "IAL Mathematics years:",
            Object.keys(fileStructure.IAL.Mathematics).filter((y) =>
              /^20\d{2}$/.test(y)
            )
          );

          // Get example data from a year
          const mathYears = Object.keys(fileStructure.IAL.Mathematics).filter(
            (y) => /^20\d{2}$/.test(y)
          );
          if (mathYears.length > 0) {
            const firstYear = mathYears[0];
            console.log(
              `IAL Mathematics ${firstYear} sessions:`,
              Object.keys(fileStructure.IAL.Mathematics[firstYear])
            );

            // Get units/papers for this year
            const sessions = Object.keys(
              fileStructure.IAL.Mathematics[firstYear]
            );
            if (sessions.length > 0) {
              const firstSession = sessions[0];
              const papers =
                fileStructure.IAL.Mathematics[firstYear][firstSession][
                  firstSession
                ];
              console.log(
                `IAL Mathematics units/papers:`,
                papers.map((p) => p.name)
              );
            }
          }
        }
      }

      // Check IGCSE
      if (fileStructure.IGCSE) {
        console.log("IGCSE subjects:", Object.keys(fileStructure.IGCSE));

        // Check Physics as an example
        if (fileStructure.IGCSE.Physics) {
          console.log(
            "IGCSE Physics years:",
            Object.keys(fileStructure.IGCSE.Physics).filter((y) =>
              /^20\d{2}$/.test(y)
            )
          );

          // Get example data from a year
          const physicsYears = Object.keys(fileStructure.IGCSE.Physics).filter(
            (y) => /^20\d{2}$/.test(y)
          );
          if (physicsYears.length > 0) {
            const firstYear = physicsYears[0];
            console.log(
              `IGCSE Physics ${firstYear} sessions:`,
              Object.keys(fileStructure.IGCSE.Physics[firstYear])
            );

            // Get units/papers for this year
            const sessions = Object.keys(
              fileStructure.IGCSE.Physics[firstYear]
            );
            if (sessions.length > 0) {
              const firstSession = sessions[0];
              const papers =
                fileStructure.IGCSE.Physics[firstYear][firstSession][
                  firstSession
                ];
              console.log(
                `IGCSE Physics units/papers:`,
                papers.map((p) => p.name)
              );
            }
          }
        }
      }
    } else {
      console.error("fileStructure is not loaded!");
    }
  }, [fileStructure]);

  // Initialize the modal when it opens
  useEffect(() => {
    if (paperSelectionModalOpen) {
      console.log("Paper selection modal opened");
      // Clear previous selections when modal opens
      setSelectedLevel("");
      setSelectedSubjects([]);
      setSelectedUnits([]);
      setSelectedYears([]);
      setPaperPreview([]);
    }
  }, [paperSelectionModalOpen]);

  // Debug logging for available years
  useEffect(() => {
    console.log("Available years updated:", availableYears);
  }, [availableYears]);

  // Add the useEffect to calculate completion rate when goals change
  useEffect(() => {
    if (goals.length > 0) {
      const completedGoals = goals.filter((goal) => goal.completed);
      setGoalCompletionRate((completedGoals.length / goals.length) * 100);
    } else {
      setGoalCompletionRate(0);
    }
  }, [goals]);

  return (
    <div
      className={`min-h-screen bg-gray-900 text-white ${
        isMobile ? "py-4 px-3" : "py-8 px-4 sm:px-6 md:px-16"
      }`}
    >
      {/* Header with user info - Mobile optimized */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center ${
          isMobile ? "mb-4 p-3" : "mb-8 p-5"
        } bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl`}
      >
        <div
          className={`flex items-center ${isMobile ? "mb-3" : "mb-4"} md:mb-0`}
        >
          {user?.picture && !imageError ? (
            <img
              src={user.picture}
              alt={user?.name || "User"}
              className={`${
                isMobile ? "h-12 w-12" : "h-16 w-16"
              } rounded-full ${
                isMobile ? "mr-3" : "mr-4"
              } object-cover border-2 border-blue-500/30`}
              onError={handleImageError}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`${
                isMobile ? "h-12 w-12" : "h-16 w-16"
              } rounded-full ${
                isMobile ? "mr-3" : "mr-4"
              } bg-gray-800/70 flex items-center justify-center border-2 border-blue-500/30`}
            >
              <User size={isMobile ? 24 : 32} className="text-blue-400" />
            </div>
          )}
          <div>
            <h1
              className={`${
                isMobile ? "text-lg" : "text-2xl"
              } font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500`}
            >
              {user?.name || "User"}
            </h1>
            <p className={`text-gray-400 ${isMobile ? "text-sm" : ""}`}>
              {user?.email}
            </p>
            <div className="mt-1">
              <span
                className={`px-2 py-1 ${
                  isMobile ? "text-xs" : "text-xs"
                } rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300`}
              >
                {user?.role || "User"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            to="/"
            className={`bg-blue-600/70 hover:bg-blue-700/70 backdrop-blur-sm ${
              isMobile ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm"
            } rounded-lg font-medium flex items-center border border-blue-500/40 shadow-sm shadow-blue-500/20 transition-all`}
          >
            <FileText
              size={isMobile ? 14 : 16}
              className={`${isMobile ? "mr-1" : "mr-2"}`}
            />
            Past Papers
          </Link>
        </div>
      </div>

      {/* Mobile optimized tabs */}
      <div
        className={`flex ${
          isMobile ? "flex-wrap gap-1" : "flex-wrap"
        } border-b border-gray-700 ${isMobile ? "mt-4 mb-4" : "mt-8 mb-6"}`}
      >
        <button
          className={`${
            isMobile ? "px-2 py-2 text-xs mr-1 mb-1" : "px-4 py-2.5 mr-4"
          } whitespace-nowrap rounded-md transition-all ${
            activeTab === "performance"
              ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
              : "text-gray-300 hover:bg-gray-700/40 hover:text-gray-100"
          }`}
          onClick={() => setActiveTab("performance")}
        >
          <span className="flex items-center">
            <div
              className={`${
                isMobile ? "mr-1 p-1" : "mr-2 p-1.5"
              } rounded-full ${
                activeTab === "performance"
                  ? "bg-purple-500"
                  : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              }`}
            >
              <LineChart
                size={isMobile ? 12 : 16}
                className={`${
                  activeTab === "performance" ? "text-white" : "text-purple-400"
                }`}
              />
            </div>
            {isMobile ? "Performance" : "Performance"}
          </span>
        </button>
        <button
          className={`${
            isMobile ? "px-2 py-2 text-xs mr-1 mb-1" : "px-4 py-2.5 mr-4"
          } whitespace-nowrap rounded-md transition-all ${
            activeTab === "history"
              ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
              : "text-gray-300 hover:bg-gray-700/40 hover:text-gray-100"
          }`}
          onClick={() => setActiveTab("history")}
        >
          <span className="flex items-center">
            <div
              className={`${
                isMobile ? "mr-1 p-1" : "mr-2 p-1.5"
              } rounded-full ${
                activeTab === "history"
                  ? "bg-purple-500"
                  : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              }`}
            >
              <History
                size={isMobile ? 12 : 16}
                className={`${
                  activeTab === "history" ? "text-white" : "text-purple-400"
                }`}
              />
            </div>
            {isMobile ? "History" : "Exam History"}
          </span>
        </button>
        <button
          className={`${
            isMobile ? "px-2 py-2 text-xs mr-1 mb-1" : "px-4 py-2.5 mr-4"
          } whitespace-nowrap rounded-md transition-all ${
            activeTab === "goals"
              ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
              : "text-gray-300 hover:bg-gray-700/40 hover:text-gray-100"
          }`}
          onClick={() => setActiveTab("goals")}
        >
          <span className="flex items-center">
            <div
              className={`${
                isMobile ? "mr-1 p-1" : "mr-2 p-1.5"
              } rounded-full ${
                activeTab === "goals"
                  ? "bg-purple-500"
                  : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              }`}
            >
              <Target
                size={isMobile ? 12 : 16}
                className={`${
                  activeTab === "goals" ? "text-white" : "text-purple-400"
                }`}
              />
            </div>
            {isMobile ? "Goals" : "Study Goals"}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`${
            isMobile ? "px-2 py-2 text-xs mr-1 mb-1" : "px-4 py-2.5"
          } whitespace-nowrap rounded-md transition-all ${
            activeTab === "preferences"
              ? "bg-blue-600/60 backdrop-blur-sm text-white border border-blue-500/50 shadow-sm shadow-blue-500/20"
              : "text-gray-300 hover:bg-gray-700/40 hover:text-gray-100"
          }`}
        >
          <span className="flex items-center">
            <div
              className={`${
                isMobile ? "mr-1 p-1" : "mr-2 p-1.5"
              } rounded-full ${
                activeTab === "preferences"
                  ? "bg-purple-500"
                  : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              }`}
            >
              <Settings
                size={isMobile ? 12 : 16}
                className={`${
                  activeTab === "preferences" ? "text-white" : "text-purple-400"
                }`}
              />
            </div>
            {isMobile ? "Settings" : "Preferences"}
          </span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "performance" && (
        <div className={`space-y-${isMobile ? "4" : "6"}`}>
          {/* Filters Section */}
          <div
            className={`bg-gray-800/40 backdrop-blur-md rounded-lg shadow-md ${
              isMobile ? "p-3" : "p-5"
            }`}
          >
            <h3
              className={`${isMobile ? "text-base" : "text-lg"} font-semibold ${
                isMobile ? "mb-3" : "mb-4"
              } flex items-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500`}
            >
              <LineChart
                className={`${isMobile ? "mr-1" : "mr-2"} text-blue-400`}
                size={isMobile ? 16 : 20}
              />
              Performance Analytics
            </h3>

            <div
              className={`grid grid-cols-1 ${
                isMobile ? "" : "md:grid-cols-2"
              } gap-${isMobile ? "3" : "4"} ${isMobile ? "mb-3" : "mb-4"}`}
            >
              {/* Subject Filter */}
              <div>
                <label
                  className={`block ${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-gray-300 mb-1`}
                >
                  Subject
                </label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedUnit("all"); // Reset unit when subject changes
                    }}
                    className={`w-full ${
                      isMobile ? "py-2 px-2 text-sm" : "py-2 px-3"
                    } bg-gray-700/70 backdrop-blur-sm border border-gray-600/70 rounded-lg appearance-none focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-700/90`}
                  >
                    {subjectList.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-2.5 text-blue-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>

              {/* Unit/Paper Filter */}
              <div>
                <label
                  className={`block ${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-gray-300 mb-1`}
                >
                  {selectedSubject.startsWith("IAL-") ? "Unit" : "Paper"}
                </label>
                <div className="relative">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className={`w-full ${
                      isMobile ? "py-2 px-2 text-sm" : "py-2 px-3"
                    } bg-gray-700/70 backdrop-blur-sm border border-gray-600/70 rounded-lg appearance-none focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-700/90`}
                  >
                    {unitList.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-2.5 text-blue-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div
              className={`grid grid-cols-${
                isMobile ? "1" : "1 md:grid-cols-3"
              } gap-${isMobile ? "2" : "4"} ${isMobile ? "mt-3" : "mt-4"}`}
            >
              <div
                className={`bg-gray-700/50 backdrop-blur-sm ${
                  isMobile ? "p-3" : "p-4"
                } rounded-lg flex items-center border border-gray-600/30`}
              >
                <div
                  className={`bg-blue-500/20 ${
                    isMobile ? "p-1.5" : "p-2"
                  } rounded-lg ${
                    isMobile ? "mr-2" : "mr-3"
                  } border border-blue-500/30`}
                >
                  <FileText
                    size={isMobile ? 16 : 20}
                    className="text-blue-400"
                  />
                </div>
                <div>
                  <div
                    className={`${
                      isMobile ? "text-xs" : "text-sm"
                    } text-gray-400`}
                  >
                    Total Exams
                  </div>
                  <div
                    className={`${
                      isMobile ? "text-lg" : "text-xl"
                    } font-semibold`}
                  >
                    {filteredExams.length}
                  </div>
                </div>
              </div>

              <div
                className={`bg-gray-700/50 backdrop-blur-sm ${
                  isMobile ? "p-3" : "p-4"
                } rounded-lg flex items-center border border-gray-600/30`}
              >
                <div
                  className={`bg-green-500/20 ${
                    isMobile ? "p-1.5" : "p-2"
                  } rounded-lg ${
                    isMobile ? "mr-2" : "mr-3"
                  } border border-green-500/30`}
                >
                  <Percent
                    size={isMobile ? 16 : 20}
                    className="text-green-400"
                  />
                </div>
                <div>
                  <div
                    className={`${
                      isMobile ? "text-xs" : "text-sm"
                    } text-gray-400`}
                  >
                    Average Score
                  </div>
                  <div
                    className={`${
                      isMobile ? "text-lg" : "text-xl"
                    } font-semibold`}
                  >
                    {performanceData.scores.length > 0
                      ? `${Math.round(
                          performanceData.scores.reduce((a, b) => a + b, 0) /
                            performanceData.scores.length
                        )}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div
                className={`bg-gray-700/50 backdrop-blur-sm ${
                  isMobile ? "p-3" : "p-4"
                } rounded-lg flex items-center border border-gray-600/30`}
              >
                <div
                  className={`${isMobile ? "p-1.5" : "p-2"} rounded-lg ${
                    isMobile ? "mr-2" : "mr-3"
                  } border ${
                    performanceData.trend === "increasing"
                      ? "bg-green-500/20 border-green-500/30"
                      : performanceData.trend === "decreasing"
                      ? "bg-red-500/20 border-red-500/30"
                      : "bg-yellow-500/20 border-yellow-500/30"
                  }`}
                >
                  {performanceData.trend === "increasing" && (
                    <TrendingUp size={20} className="text-green-400" />
                  )}
                  {performanceData.trend === "decreasing" && (
                    <TrendingUp
                      size={20}
                      className="text-red-400 transform rotate-180"
                    />
                  )}
                  {performanceData.trend === "neutral" && (
                    <Sigma size={20} className="text-yellow-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Trend</div>
                  <div className="text-xl font-semibold capitalize">
                    {performanceData.trend === "increasing" && (
                      <span className="text-green-400">Improving</span>
                    )}
                    {performanceData.trend === "decreasing" && (
                      <span className="text-red-400">Declining</span>
                    )}
                    {performanceData.trend === "neutral" && (
                      <span className="text-yellow-400">Stable</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Graph */}
          <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-md overflow-hidden border border-gray-700/50">
            <div className="p-5 border-b border-gray-700/50">
              <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Score Progress
              </h3>
            </div>

            <div className="p-5">
              {performanceData.scores.length > 0 ? (
                <div>
                  {/* Chart visualization */}
                  <div className="h-64 flex items-end space-x-1 relative">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-400 pointer-events-none px-1">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>

                    {/* Bar chart with some padding for axis */}
                    <div className="flex-1 flex items-end space-x-1 h-full pl-10">
                      {/* Trend line */}
                      {performanceData.trendLinePoints.length > 0 && (
                        <svg
                          className="absolute inset-0 pointer-events-none"
                          style={{ paddingTop: "5px", paddingBottom: "20px" }}
                        >
                          <polyline
                            points={performanceData.trendLinePoints
                              .map((point, i) => {
                                // Calculate x position based on the number of bars
                                const barWidth =
                                  100 / performanceData.scores.length;
                                const xPercent = barWidth * (i + 0.5); // Center of each bar

                                // Calculate y position (inverted since SVG y=0 is at top)
                                const yPercent = 100 - point.y;

                                // Calculate actual SVG coordinates
                                const x = (xPercent / 100) * 100 + "%";
                                const y = (yPercent / 100) * 100 + "%";

                                return `${x},${y}`;
                              })
                              .join(" ")}
                            fill="none"
                            stroke={
                              performanceData.trend === "increasing"
                                ? "#22c55e"
                                : performanceData.trend === "decreasing"
                                ? "#ef4444"
                                : "#eab308"
                            }
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        </svg>
                      )}

                      {performanceData.scores.map((score, index) => (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                        >
                          <div className="w-full flex flex-col items-center justify-end h-full">
                            {/* Tooltip on hover */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bg-gray-900/90 backdrop-blur-md text-white text-xs rounded p-2 -mt-16 pointer-events-none border border-gray-700/50 z-10">
                              <div className="font-semibold">
                                {performanceData.labels[index]}
                              </div>
                              <div>Score: {score}%</div>
                            </div>
                            {/* Actual bar */}
                            <div
                              className={`w-full rounded-t-sm backdrop-blur-sm ${
                                score > 80
                                  ? "bg-green-500/70 border-t border-x border-green-400/40"
                                  : score > 60
                                  ? "bg-blue-500/70 border-t border-x border-blue-400/40"
                                  : score > 40
                                  ? "bg-yellow-500/70 border-t border-x border-yellow-400/40"
                                  : "bg-red-500/70 border-t border-x border-red-400/40"
                              }`}
                              style={{ height: `${Math.max(score, 3)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1 text-gray-400 truncate w-full text-center">
                            {performanceData.labels[index] || ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Analysis */}
                  <div className="mt-8 p-4 bg-blue-900/20 backdrop-blur-sm border border-blue-700/30 rounded-lg">
                    <h4 className="text-md font-semibold mb-2 flex items-center">
                      <Info size={16} className="mr-2 text-blue-400" />
                      Performance Analysis
                    </h4>
                    <p className="text-gray-300">{performanceData.comment}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-700/40">
                  <BarChart size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No data available for the selected criteria</p>
                  <p className="text-sm mt-2">
                    Take mock exams to see your performance analytics
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Time Spent Graph */}
          {performanceData.times.length > 0 && (
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-md overflow-hidden border border-gray-700/50">
              <div className="p-5 border-b border-gray-700/50">
                <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Time Spent
                </h3>
              </div>

              <div className="p-5">
                <div className="h-48 flex items-end space-x-1 relative">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-400 pointer-events-none px-1">
                    <span>{Math.max(...performanceData.times)} min</span>
                    <span>
                      {Math.round(Math.max(...performanceData.times) * 0.75)}{" "}
                      min
                    </span>
                    <span>
                      {Math.round(Math.max(...performanceData.times) * 0.5)} min
                    </span>
                    <span>
                      {Math.round(Math.max(...performanceData.times) * 0.25)}{" "}
                      min
                    </span>
                    <span>0 min</span>
                  </div>

                  {/* Bar chart with padding for axis */}
                  <div className="flex-1 flex items-end space-x-1 h-full pl-10">
                    {performanceData.times.map((time, index) => {
                      const maxTime = Math.max(...performanceData.times);
                      const height = maxTime > 0 ? (time / maxTime) * 100 : 0;

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                        >
                          <div className="w-full flex flex-col items-center justify-end h-full">
                            {/* Tooltip on hover */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bg-gray-900/90 backdrop-blur-md text-white text-xs rounded p-2 -mt-16 pointer-events-none border border-gray-700/50">
                              <div className="font-semibold">
                                {performanceData.labels[index]}
                              </div>
                              <div>Time: {time} min</div>
                            </div>
                            {/* Actual bar */}
                            <div
                              className="w-full bg-purple-500/70 backdrop-blur-sm rounded-t-sm border-t border-x border-purple-400/40"
                              style={{ height: `${Math.max(height, 3)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1 text-gray-400 truncate w-full text-center">
                            {performanceData.labels[index] || ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-md border border-gray-700/50">
          <div className="p-5 border-b border-gray-700/50 flex justify-between items-center">
            <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Mock History
            </h3>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-md ${
                isRefreshing
                  ? "bg-gray-700/60 text-gray-500"
                  : "bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-700/50"
              } transition-colors`}
              title="Refresh mock exam data"
            >
              <RefreshCw
                size={16}
                className={`${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="p-5">
            {isLoading || isRefreshing ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : mockExams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="pb-3 pl-4">Date</th>
                      <th className="pb-3">Paper</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockExams.map((exam) => (
                      <tr
                        key={exam.id}
                        className="border-t border-gray-700/30 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 pl-4">
                          {formatDate(exam.completedAt)}
                        </td>
                        <td className="py-3 max-w-xs">
                          <div className="truncate font-medium">
                            {formatPaperTitle(exam)}
                          </div>
                          {exam.rawPath && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {exam.rawPath}
                            </div>
                          )}
                        </td>
                        <td className="py-3">
                          {formatDuration(exam.durationMinutes || 0)}
                        </td>
                        <td className="py-3">
                          {exam.score !== undefined ? (
                            <span className="px-2 py-0.5 bg-blue-900/30 rounded-md border border-blue-700/40">
                              {Math.round(exam.score)}%
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-700/40">
                <Calendar size={40} className="mx-auto mb-4 opacity-50" />
                <p>No mock exams taken yet</p>
                <p className="text-sm mt-2">
                  Use the timer feature in past papers to track your mock exams
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Goals Tab */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/40 shadow-lg">
            {/* Heading and actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Target size={24} className="text-blue-400" />
                <h2 className="text-xl font-semibold">Study Goals</h2>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setGroupBySubject(!groupBySubject)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-lg transition-colors"
                >
                  <BookOpen size={18} />
                  <span>{groupBySubject ? "Ungroup" : "Group by Subject"}</span>
                </button>
              </div>
            </div>

            {/* Progress overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/90 border border-gray-700/40 rounded-lg p-4 flex flex-col">
                <span className="text-gray-400 text-sm">Total Goals</span>
                <div className="mt-1 flex items-center">
                  <Target size={18} className="text-blue-400 mr-2" />
                  <span className="text-2xl font-bold">{goals.length}</span>
                </div>
              </div>

              <div className="bg-gray-800/90 border border-gray-700/40 rounded-lg p-4 flex flex-col">
                <span className="text-gray-400 text-sm">Completed</span>
                <div className="mt-1 flex items-center">
                  <CheckCircle2 size={18} className="text-green-400 mr-2" />
                  <span className="text-2xl font-bold">
                    {goals.filter((goal) => goal.completed).length}
                  </span>
                </div>
              </div>

              <div className="bg-gray-800/90 border border-gray-700/40 rounded-lg p-4 flex flex-col">
                <span className="text-gray-400 text-sm">Completion Rate</span>
                <div className="mt-1 flex items-center">
                  <Percent size={18} className="text-yellow-400 mr-2" />
                  <span className="text-2xl font-bold">
                    {goalCompletionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${goalCompletionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Filter and Batch Actions Bar */}
            <div className="mb-4 flex flex-wrap justify-between items-center gap-3 bg-gray-800/40 p-3 border border-gray-700/30 rounded-lg">
              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-800 rounded-md border border-gray-700">
                  <button
                    onClick={() => setGoalFilterType("all")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-l-md ${
                      goalFilterType === "all"
                        ? "bg-blue-600/40 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setGoalFilterType("pending")}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      goalFilterType === "pending"
                        ? "bg-blue-600/40 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setGoalFilterType("completed")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-r-md ${
                      goalFilterType === "completed"
                        ? "bg-blue-600/40 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    Completed
                  </button>
                </div>

                <div className="flex items-center bg-gray-800 rounded-md border border-gray-700">
                  <div className="px-2 py-1.5 text-xs text-gray-400 border-r border-gray-700 flex items-center">
                    <SortAsc size={14} className="mr-1" />
                    <span>Sort:</span>
                  </div>
                  <select
                    value={goalSortBy}
                    onChange={(e) => setGoalSortBy(e.target.value)}
                    className="bg-transparent text-white text-xs px-2 py-1.5 border-none outline-none"
                  >
                    <option value="date-added">Date Added</option>
                    <option value="subject">Subject</option>
                  </select>
                </div>

                <button
                  onClick={() => setGroupBySubject(!groupBySubject)}
                  className={`flex items-center px-3 py-1.5 text-xs rounded-md border ${
                    groupBySubject
                      ? "bg-blue-600/40 text-white border-blue-500/50"
                      : "bg-gray-800 text-gray-300 border-gray-700"
                  }`}
                >
                  <Filter size={14} className="mr-1.5" />
                  Group by Subject
                </button>
              </div>

              {/* Batch Actions */}
              {selectedGoals.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {selectedGoals.length} selected
                  </span>
                  <button
                    onClick={batchDeleteGoals}
                    className="flex items-center px-3 py-1.5 bg-red-600/40 hover:bg-red-600/60 text-white rounded-md text-xs"
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Goals list */}
            <div className="mt-4">
              {isLoadingGoals ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-400">Loading your goals...</p>
                </div>
              ) : goals.length > 0 ? (
                <div>
                  {/* Choose between grouped or flat view */}
                  {groupBySubject ? (
                    // Grouped by subject, then by unit
                    <div className="space-y-4">
                      {Object.entries(
                        getGoalsBySubjectAndUnit(filteredGoals)
                      ).map(([subject, unitGoals]) => (
                        <div
                          key={subject}
                          className="bg-gray-900/30 rounded-lg border border-gray-700/40 overflow-hidden"
                        >
                          {/* Subject header */}
                          <div className="flex items-center justify-between p-3 bg-gray-800/60">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => toggleSubjectExpanded(subject)}
                            >
                              {expandedSubjects[subject] ? (
                                <ChevronDown
                                  size={16}
                                  className="text-blue-400 mr-2"
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className="text-blue-400 mr-2"
                                />
                              )}
                              <span className="font-medium">{subject}</span>
                              <span className="ml-2 text-xs text-gray-400">
                                ({Object.values(unitGoals).flat().length} goal
                                {Object.values(unitGoals).flat().length !== 1 &&
                                  "s"}
                                )
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-gray-400">
                                {Math.round(
                                  (Object.values(unitGoals)
                                    .flat()
                                    .filter((g) => g.completed).length /
                                    Object.values(unitGoals).flat().length) *
                                    100
                                )}
                                % complete
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const confirmed = window.confirm(
                                    `Are you sure you want to delete all ${
                                      Object.values(unitGoals).flat().length
                                    } goals for ${subject}?`
                                  );
                                  if (confirmed) {
                                    // Get all goalIds for this subject
                                    const goalIds = Object.values(unitGoals)
                                      .flat()
                                      .map((goal) => goal.id);

                                    // Remove goals from Firebase
                                    Promise.all(
                                      goalIds.map((goalId) =>
                                        removePaperGoal(user.email, goalId)
                                      )
                                    ).then(() => {
                                      // Update local state
                                      setGoals((prev) =>
                                        prev.filter(
                                          (goal) => !goalIds.includes(goal.id)
                                        )
                                      );

                                      // Clear selection that might include deleted goals
                                      setSelectedGoals((prev) =>
                                        prev.filter(
                                          (id) => !goalIds.includes(id)
                                        )
                                      );

                                      // Recalculate completion rate
                                      const updatedGoals = goals.filter(
                                        (goal) => !goalIds.includes(goal.id)
                                      );
                                      if (updatedGoals.length > 0) {
                                        const completedGoals =
                                          updatedGoals.filter(
                                            (goal) => goal.completed
                                          );
                                        setGoalCompletionRate(
                                          (completedGoals.length /
                                            updatedGoals.length) *
                                            100
                                        );
                                      } else {
                                        setGoalCompletionRate(0);
                                      }
                                    });
                                  }
                                }}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title={`Delete all goals for ${subject}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Units for this subject */}
                          {expandedSubjects[subject] && (
                            <div className="p-3 space-y-4">
                              {Object.entries(unitGoals).map(
                                ([unit, goals]) => (
                                  <div
                                    key={`${subject}-${unit}`}
                                    className="bg-gray-800/40 rounded-lg border border-gray-700/30"
                                  >
                                    {/* Unit header */}
                                    <div className="flex items-center justify-between p-2 bg-gray-800/80 rounded-t-lg border-b border-gray-700/30">
                                      <div className="flex items-center">
                                        <FileText
                                          size={14}
                                          className="text-blue-400 mr-2"
                                        />
                                        <span className="font-medium">
                                          {unit}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400">
                                          ({goals.length} paper
                                          {goals.length !== 1 && "s"})
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {Math.round(
                                          (goals.filter((g) => g.completed)
                                            .length /
                                            goals.length) *
                                            100
                                        )}
                                        % complete
                                      </div>
                                    </div>

                                    {/* Papers for this unit */}
                                    <div className="p-2">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="text-left text-xs text-gray-400">
                                            <th className="p-1 pl-2 w-6">
                                              <input
                                                type="checkbox"
                                                checked={
                                                  goals.filter((g) =>
                                                    selectedGoals.includes(g.id)
                                                  ).length === goals.length &&
                                                  goals.length > 0
                                                }
                                                onChange={() => {
                                                  if (
                                                    goals.filter((g) =>
                                                      selectedGoals.includes(
                                                        g.id
                                                      )
                                                    ).length === goals.length
                                                  ) {
                                                    // Deselect all for this unit
                                                    setSelectedGoals((prev) =>
                                                      prev.filter(
                                                        (id) =>
                                                          !goals.find(
                                                            (g) => g.id === id
                                                          )
                                                      )
                                                    );
                                                  } else {
                                                    // Select all for this unit
                                                    const notYetSelectedIds =
                                                      goals
                                                        .filter(
                                                          (g) =>
                                                            !selectedGoals.includes(
                                                              g.id
                                                            )
                                                        )
                                                        .map((g) => g.id);
                                                    setSelectedGoals((prev) => [
                                                      ...prev,
                                                      ...notYetSelectedIds,
                                                    ]);
                                                  }
                                                }}
                                                className="rounded-sm bg-gray-700 border-gray-600"
                                              />
                                            </th>
                                            <th className="p-1">Paper</th>
                                            <th className="p-1">Year</th>
                                            <th className="p-1">Session</th>
                                            <th className="p-1">Status</th>
                                            <th className="p-1">Marks</th>
                                            <th className="p-1 text-right pr-1">
                                              Actions
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {goals.map((goal) => {
                                            // Extract year and session from path if available
                                            const pathParts = goal.path
                                              ? goal.path.split("/")
                                              : [];
                                            let year = "N/A";
                                            let session = "N/A";

                                            // Look for year (4 digits pattern) in path parts
                                            for (const part of pathParts) {
                                              if (/^20\d{2}$/.test(part)) {
                                                year = part;
                                                // Session is likely the part after year
                                                const yearIndex =
                                                  pathParts.indexOf(part);
                                                if (
                                                  yearIndex <
                                                  pathParts.length - 1
                                                ) {
                                                  session =
                                                    pathParts[yearIndex + 1];
                                                }
                                                break;
                                              }
                                            }

                                            return (
                                              <tr
                                                key={goal.id}
                                                className={`border-t border-gray-700/20 hover:bg-gray-700/30 transition-colors ${
                                                  goal.completed
                                                    ? "bg-green-900/10"
                                                    : ""
                                                } ${
                                                  selectedGoals.includes(
                                                    goal.id
                                                  )
                                                    ? "bg-blue-900/20"
                                                    : ""
                                                }`}
                                              >
                                                <td className="p-1 pl-2">
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedGoals.includes(
                                                      goal.id
                                                    )}
                                                    onChange={() =>
                                                      toggleGoalSelection(
                                                        goal.id
                                                      )
                                                    }
                                                    className="rounded-sm bg-gray-700 border-gray-600"
                                                  />
                                                </td>
                                                <td className="p-1">
                                                  <Link
                                                    to={`/?path=${encodeURIComponent(
                                                      goal.path
                                                    )}`}
                                                    className="hover:text-blue-400 transition-colors text-sm"
                                                  >
                                                    {goal.name}
                                                  </Link>
                                                </td>
                                                <td className="p-1 text-sm">
                                                  {year}
                                                </td>
                                                <td className="p-1 text-sm">
                                                  {session}
                                                </td>
                                                <td className="p-1">
                                                  {goal.completed ? (
                                                    <span className="px-1.5 py-0.5 bg-green-900/30 text-green-300 rounded-md border border-green-700/40 text-xs">
                                                      Completed
                                                    </span>
                                                  ) : (
                                                    <span className="px-1.5 py-0.5 bg-yellow-900/30 text-yellow-300 rounded-md border border-yellow-700/40 text-xs">
                                                      Pending
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="p-1">
                                                  {goal.completedAsMock ? (
                                                    <span
                                                      className={`px-1.5 py-0.5 rounded-md text-xs ${
                                                        (goal.mockScore !==
                                                          undefined &&
                                                          goal.mockScore !==
                                                            null) ||
                                                        goal.mockScore === 0
                                                          ? goal.mockScore >= 70
                                                            ? "bg-green-900/30 text-green-300 border border-green-700/40"
                                                            : goal.mockScore >=
                                                              40
                                                            ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700/40"
                                                            : "bg-red-900/30 text-red-300 border border-red-700/40"
                                                          : "bg-gray-700/30 text-gray-300 border border-gray-600/40"
                                                      }`}
                                                    >
                                                      {(goal.mockScore !==
                                                        undefined &&
                                                        goal.mockScore !==
                                                          null) ||
                                                      goal.mockScore === 0
                                                        ? `${Math.round(
                                                            goal.mockScore
                                                          )}%`
                                                        : "0%"}
                                                    </span>
                                                  ) : (
                                                    "-"
                                                  )}
                                                </td>
                                                <td className="p-1 text-right pr-1">
                                                  <div className="flex justify-end space-x-1">
                                                    <button
                                                      onClick={() =>
                                                        handleDeleteGoal(
                                                          goal.id
                                                        )
                                                      }
                                                      className="p-0.5 text-red-400 hover:text-red-300 transition-colors"
                                                      title="Delete goal"
                                                    >
                                                      <Trash2 size={12} />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Regular flat view - keep the existing code
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        {/* Existing flat view table code */}
                        <thead>
                          <tr className="text-left text-gray-400 text-sm">
                            <th className="pb-3 pl-4 w-6">
                              <input
                                type="checkbox"
                                checked={
                                  selectedGoals.length ===
                                    filteredGoals.length &&
                                  filteredGoals.length > 0
                                }
                                onChange={toggleSelectAll}
                                className="rounded-sm bg-gray-700 border-gray-600"
                              />
                            </th>
                            <th className="pb-3">Paper/Unit</th>
                            <th className="pb-3">Year</th>
                            <th className="pb-3">Session</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Marks</th>
                            <th className="pb-3 text-right pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGoals.map((goal) => {
                            // Existing goal mapping code
                            // Extract year and session from path if available
                            const pathParts = goal.path
                              ? goal.path.split("/")
                              : [];
                            let year = "N/A";
                            let session = "N/A";

                            // Look for year (4 digits pattern) in path parts
                            for (const part of pathParts) {
                              if (/^20\d{2}$/.test(part)) {
                                year = part;
                                // Session is likely the part after year
                                const yearIndex = pathParts.indexOf(part);
                                if (yearIndex < pathParts.length - 1) {
                                  session = pathParts[yearIndex + 1];
                                }
                                break;
                              }
                            }

                            return (
                              <tr
                                key={goal.id}
                                className={`border-t border-gray-700/30 hover:bg-gray-700/30 transition-colors ${
                                  goal.completed ? "bg-green-900/10" : ""
                                } ${
                                  selectedGoals.includes(goal.id)
                                    ? "bg-blue-900/20"
                                    : ""
                                }`}
                              >
                                <td className="py-3 pl-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedGoals.includes(goal.id)}
                                    onChange={() =>
                                      toggleGoalSelection(goal.id)
                                    }
                                    className="rounded-sm bg-gray-700 border-gray-600"
                                  />
                                </td>
                                <td className="py-3">
                                  <Link
                                    to={`/?path=${encodeURIComponent(
                                      goal.path
                                    )}`}
                                    className="hover:text-blue-400 transition-colors"
                                  >
                                    <div className="truncate font-medium max-w-[300px]">
                                      {goal.name}
                                    </div>
                                    {goal.path && (
                                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">
                                        {goal.path}
                                      </div>
                                    )}
                                  </Link>
                                </td>
                                <td className="py-3">{year}</td>
                                <td className="py-3">{session}</td>
                                <td className="py-3">
                                  {goal.completed ? (
                                    <span className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded-md border border-green-700/40">
                                      Completed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-300 rounded-md border border-yellow-700/40">
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="py-3">
                                  {goal.completedAsMock ? (
                                    <span
                                      className={`px-2 py-0.5 rounded-md ${
                                        (goal.mockScore !== undefined &&
                                          goal.mockScore !== null) ||
                                        goal.mockScore === 0
                                          ? goal.mockScore >= 70
                                            ? "bg-green-900/30 text-green-300 border border-green-700/40"
                                            : goal.mockScore >= 40
                                            ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700/40"
                                            : "bg-red-900/30 text-red-300 border border-red-700/40"
                                          : "bg-gray-700/30 text-gray-300 border border-gray-600/40"
                                      }`}
                                    >
                                      {(goal.mockScore !== undefined &&
                                        goal.mockScore !== null) ||
                                      goal.mockScore === 0
                                        ? `${Math.round(goal.mockScore)}%`
                                        : "0%"}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="py-3 text-right pr-4">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => handleDeleteGoal(goal.id)}
                                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                      title="Delete goal"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-700/40">
                  <Target size={40} className="mx-auto mb-4 opacity-50" />
                  <p>No study goals set yet</p>
                  <p className="text-sm mt-2">
                    Go to the Past Papers Navigator to add papers to your goals
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 overflow-hidden">
            <div className="p-5 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
              <h3 className="text-xl font-semibold flex items-center">
                <Settings size={20} className="mr-2 text-blue-400" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Subject Preferences
                </span>
              </h3>
              <p className="text-gray-300 mt-2 text-sm">
                Customize your experience by selecting subjects you're
                interested in. These will be available as filters in the file
                navigator.
              </p>
            </div>

            <div className="p-6">
              {/* Info Card */}
              <div className="mb-6 bg-blue-900/20 backdrop-blur-sm border border-blue-700/30 rounded-lg p-4 flex items-start">
                <Info
                  size={18}
                  className="text-blue-400 mr-3 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h4 className="text-blue-300 font-medium mb-1">
                    Quick Filtering
                  </h4>
                  <p className="text-sm text-gray-300">
                    Selected subjects will appear in the "My Subjects" filter in
                    the Past Papers Navigator, allowing you to quickly focus on
                    papers from your chosen subjects.
                  </p>
                </div>
              </div>

              {/* Subject Categories */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-200">
                    Your Subject Selection
                  </h4>

                  {availableSubjects.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleAllSubjects}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          areAllSubjectsSelected()
                            ? "bg-blue-600/30 text-blue-200 border-blue-500/50 hover:bg-blue-600/40"
                            : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                        }`}
                      >
                        {areAllSubjectsSelected()
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Group subjects by category/level */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-blue-400 mb-3 flex items-center">
                    <GraduationCap size={14} className="mr-1.5" />
                    IAL Subjects
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                    {availableSubjects
                      .filter(
                        (subject) =>
                          subject.id.includes("IAL") ||
                          subject.name?.includes("IAL")
                      )
                      .map((subject) => (
                        <div
                          key={subject.id}
                          className={`flex items-center p-3 rounded-md transition-colors ${
                            isSubjectSelected(subject.id)
                              ? "bg-blue-900/30 border border-blue-800/50"
                              : "hover:bg-gray-700/40 border border-gray-700/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`subject-${subject.id}`}
                            checked={isSubjectSelected(subject.id)}
                            onChange={() => toggleSubject(subject.id)}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-700/70 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                          />
                          <label
                            htmlFor={`subject-${subject.id}`}
                            className={`ml-2 text-sm font-medium cursor-pointer select-none flex-1 ${
                              isSubjectSelected(subject.id)
                                ? "text-blue-300"
                                : "text-gray-300"
                            }`}
                          >
                            {formatSubjectName(subject.name || subject.id)}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h5 className="text-sm font-medium text-blue-400 mb-3 flex items-center">
                    <BookOpen size={14} className="mr-1.5" />
                    IGCSE Subjects
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                    {availableSubjects
                      .filter(
                        (subject) =>
                          subject.id.includes("IGCSE") ||
                          subject.name?.includes("IGCSE")
                      )
                      .map((subject) => (
                        <div
                          key={subject.id}
                          className={`flex items-center p-3 rounded-md transition-colors ${
                            isSubjectSelected(subject.id)
                              ? "bg-blue-900/30 border border-blue-800/50"
                              : "hover:bg-gray-700/40 border border-gray-700/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`subject-${subject.id}`}
                            checked={isSubjectSelected(subject.id)}
                            onChange={() => toggleSubject(subject.id)}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-700/70 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                          />
                          <label
                            htmlFor={`subject-${subject.id}`}
                            className={`ml-2 text-sm font-medium cursor-pointer select-none flex-1 ${
                              isSubjectSelected(subject.id)
                                ? "text-blue-300"
                                : "text-gray-300"
                            }`}
                          >
                            {formatSubjectName(subject.name || subject.id)}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>

                {availableSubjects.length === 0 && (
                  <div className="text-center py-8 text-gray-400 bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-700/40">
                    <ClipboardList
                      size={36}
                      className="mx-auto mb-3 opacity-50"
                    />
                    <p className="font-medium mb-1">No subjects available</p>
                    <p className="text-sm">
                      Subjects will appear here once you've completed mock exams
                    </p>
                  </div>
                )}
              </div>

              {/* Summary of selection */}
              <div className="mt-8 bg-indigo-900/20 backdrop-blur-sm p-5 rounded-lg border border-indigo-700/30">
                <h4 className="text-sm font-medium text-indigo-300 mb-3 flex items-center">
                  <CheckCircle size={16} className="mr-2" />
                  Your Selected Subjects
                </h4>

                {subjectPreferences.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjectPreferences.map((subject) => (
                      <div
                        key={subject}
                        className="bg-indigo-900/40 text-indigo-200 px-3 py-1.5 rounded-full text-xs border border-indigo-700/50 flex items-center"
                      >
                        {formatSubjectName(subject)}
                        <button
                          onClick={() => toggleSubject(subject)}
                          className="ml-2 text-indigo-300 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm">
                    No subjects selected. All subjects will be shown in the Past
                    Papers Navigator.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paper Selection Modal - IMPROVED DYNAMIC VERSION */}
      {paperSelectionModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Target size={20} className="mr-2 text-blue-400" />
                Add Papers to Goals
              </h3>
              <button
                onClick={() => {
                  setPaperSelectionModalOpen(false);
                  setSelectedPapers([]);
                  setPaperPreview([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-hidden flex">
              {/* Left panel - Selection controls */}
              <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-4">
                {isLoadingPapers ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400">Loading available papers...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Level Selection */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <BookOpen size={16} className="mr-2 text-blue-400" />
                        Select Level
                      </h4>
                      <div className="bg-gray-700/30 rounded-md p-2">
                        <div className="grid grid-cols-2 gap-2">
                          {["IAL", "IGCSE"].map((level) => (
                            <div
                              key={level}
                              className={`p-2 rounded-md cursor-pointer transition-colors flex items-center ${
                                selectedLevel === level
                                  ? "bg-blue-600/40 border border-blue-500/50"
                                  : "bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50"
                              }`}
                              onClick={() => handleLevelChange(level)}
                            >
                              <input
                                type="radio"
                                checked={selectedLevel === level}
                                onChange={() => {}} // Handled by parent div
                                className="mr-2"
                              />
                              <span className="text-sm">{level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Subject Selection */}
                    {selectedLevel && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                          <BookOpen size={16} className="mr-2 text-blue-400" />
                          Select Subject
                        </h4>
                        <div className="bg-gray-700/30 rounded-md p-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {availableSubjects
                              .filter((subject) =>
                                selectedLevel === "IAL"
                                  ? subject.id.includes("IAL") ||
                                    subject.name?.includes("IAL")
                                  : subject.id.includes("IGCSE") ||
                                    subject.name?.includes("IGCSE")
                              )
                              .map((subject) => (
                                <div
                                  key={subject.id}
                                  className={`p-2 rounded-md cursor-pointer transition-colors flex items-center ${
                                    selectedSubjects[0] === subject.id
                                      ? "bg-blue-600/40 border border-blue-500/50"
                                      : "bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50"
                                  }`}
                                  onClick={() =>
                                    handleSubjectChange(subject.id)
                                  }
                                >
                                  <input
                                    type="radio"
                                    checked={selectedSubjects[0] === subject.id}
                                    onChange={() => {}} // Handled by parent div
                                    className="mr-2"
                                  />
                                  <span className="text-sm truncate">
                                    {formatSubjectName(
                                      subject.name || subject.id
                                    )}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Units/Papers Selection */}
                    {selectedSubjects.length > 0 &&
                      availableUnits.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                            <FileText
                              size={16}
                              className="mr-2 text-blue-400"
                            />
                            Select{" "}
                            {selectedLevel === "IAL" ? "Units" : "Papers"}
                          </h4>
                          <div className="bg-gray-700/30 rounded-md p-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {availableUnits.map((unit) => (
                                <div
                                  key={unit}
                                  className={`p-2 rounded-md cursor-pointer transition-colors flex items-center ${
                                    selectedUnits.includes(unit)
                                      ? "bg-blue-600/40 border border-blue-500/50"
                                      : "bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50"
                                  }`}
                                  onClick={() => {
                                    setSelectedUnits((prev) =>
                                      prev.includes(unit)
                                        ? prev.filter((u) => u !== unit)
                                        : [...prev, unit]
                                    );
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedUnits.includes(unit)}
                                    onChange={() => {}} // Handled by parent div
                                    className="mr-2"
                                  />
                                  <span className="text-sm">{unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Years Selection - UPDATED TO BE DYNAMIC */}
                    {selectedSubjects.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                          <Calendar size={16} className="mr-2 text-blue-400" />
                          Select Years
                        </h4>
                        <div className="bg-gray-700/30 rounded-md p-3">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <button
                              onClick={() => setSelectedYears(availableYears)}
                              className="px-2 py-1 text-xs bg-blue-600/70 hover:bg-blue-600/80 text-white rounded"
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => setSelectedYears([])}
                              className="px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-700/70 text-white rounded"
                            >
                              Clear All
                            </button>
                            {availableYears.length > 5 && (
                              <button
                                onClick={() => {
                                  const recentYears = [...availableYears]
                                    .sort((a, b) => b - a)
                                    .slice(0, 3);
                                  setSelectedYears(recentYears);
                                }}
                                className="px-2 py-1 text-xs bg-green-600/70 hover:bg-green-600/80 text-white rounded"
                              >
                                Recent 3 Years
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {availableYears.length === 0 ? (
                              <div className="col-span-4 text-center py-4 text-gray-400">
                                <p>No years available for this subject</p>
                                <p className="text-sm mt-1">
                                  The database may be missing data for this
                                  selection
                                </p>
                              </div>
                            ) : (
                              availableYears.map((year) => (
                                <div
                                  key={year}
                                  className={`p-2 rounded-md cursor-pointer transition-colors flex items-center ${
                                    selectedYears.includes(year)
                                      ? "bg-blue-600/40 border border-blue-500/50"
                                      : "bg-gray-700/50 border border-gray-600/50 hover:bg-gray-600/50"
                                  }`}
                                  onClick={() => {
                                    setSelectedYears((prev) =>
                                      prev.includes(year)
                                        ? prev.filter((y) => y !== year)
                                        : [...prev, year]
                                    );
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedYears.includes(year)}
                                    onChange={() => {}} // Handled by parent div
                                    className="mr-2"
                                  />
                                  <span className="text-sm">{year}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generate Preview Button */}
                    {selectedSubjects.length > 0 && (
                      <button
                        onClick={generatePaperPreview}
                        className="w-full py-2 bg-blue-600/70 hover:bg-blue-600/80 text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Search size={16} className="mr-2" />
                        Generate Preview
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right panel - Preview */}
              <div className="w-1/2 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center">
                    <List size={16} className="mr-2 text-blue-400" />
                    Preview Papers ({paperPreview.length})
                  </h4>
                  {paperPreview.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // Select all papers that aren't already in goals
                          const papersToAdd = paperPreview.filter(
                            (p) => !p.alreadyInGoals
                          );
                          setSelectedPapers(papersToAdd);
                        }}
                        className="text-xs px-2 py-1 bg-blue-600/70 hover:bg-blue-600/80 text-white rounded"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedPapers([])}
                        className="text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
                {paperPreview.length > 0 ? (
                  <div className="space-y-2">
                    {paperPreview.map((paper, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${
                          paper.alreadyInGoals
                            ? "bg-gray-800/50 border-gray-700/50"
                            : "bg-gray-700/30 border-gray-600/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-white">
                              {paper.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {paper.examBoard} • {paper.subject} • {paper.year}{" "}
                              {paper.session}
                            </div>
                          </div>
                          {paper.alreadyInGoals ? (
                            <span className="text-xs text-gray-400">
                              Already in goals
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedPapers.some(
                                (p) => p.path === paper.path
                              )}
                              onChange={() => togglePaperSelection(paper)}
                              className="mt-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <p>No papers selected or matching criteria</p>
                    <p className="text-sm mt-2">
                      Select a level, subject, and other criteria to see
                      available papers
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with action buttons */}
            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedPapers.length > 0
                  ? `${selectedPapers.length} papers selected`
                  : "No papers selected"}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setPaperSelectionModalOpen(false);
                    setSelectedPapers([]);
                    setPaperPreview([]);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={addSelectedPapersAsGoals}
                  disabled={selectedPapers.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedPapers.length > 0
                      ? "bg-blue-600/70 hover:bg-blue-600/80 text-white"
                      : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Add Selected Papers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
