import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  X,
  Star,
  FolderOpen,
  FlaskConical,
  Magnet,
  Calculator,
  Cone,
  SquareSigma,
  Folder,
  Radical,
  FilterX,
  FileQuestion,
  CheckCircle2,
  PlusCircle,
  Target,
  Check,
  Trophy,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  getUserCompletedMocks,
  getUserGoals,
  addPaperGoal,
} from "../../firebase/userService";

export default function MobileFileNavigator({
  fileStructure,
  searchQuery,
  setSearchQuery,
  onFileSelect,
  activePath,
  examMode,
  isMobile,
  closeModal,
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState({
    IAL: true,
    IGCSE: true,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [subjectPreferences, setSubjectPreferences] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredStructure, setFilteredStructure] = useState(null);
  const [completedMocks, setCompletedMocks] = useState([]);
  const [userGoals, setUserGoals] = useState([]);
  const [isLoadingMocks, setIsLoadingMocks] = useState(true);
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [isAddingToGoals, setIsAddingToGoals] = useState(false);
  const [addStatus, setAddStatus] = useState({
    success: 0,
    error: 0,
    show: false,
  });

  // Paper type priority order for sorting
  const paperOrder = {
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
    M1: 5,
    S1: 6,
    C12: 7,
    C34: 8,
  };

  // Subject aliases and abbreviations
  const subjectAliases = {
    chemistry: ["chem", "chm"],
    physics: ["phy", "phys"],
    biology: ["bio"],
    mathematics: ["math", "maths"],
    "business studies": ["business", "bs"],
    "computer science": ["cs", "compsci"],
    economics: ["econ"],
    english: ["eng"],
    geography: ["geo"],
    history: ["hist"],
    psychology: ["psych"],
  };

  // Custom sorting function for mathematics papers
  const sortMathematicsPapers = (papers) => {
    return [...papers].sort((a, b) => {
      const aOrder = paperOrder[a.name] || 999;
      const bOrder = paperOrder[b.name] || 999;
      return aOrder - bOrder;
    });
  };

  // Create a debug function to track filtering
  const debugLog = (message, ...args) => {
    console.log(`[MobileFileNavigator] ${message}`, ...args);
  };

  // Fetch user subject preferences - add more detailed logging
  useEffect(() => {
    if (!user?.email) {
      debugLog("No user email, disabling filtering");
      setIsFiltering(false);
      setFilteredStructure(null);
      return;
    }

    const fetchSubjectPreferences = async () => {
      try {
        debugLog("Fetching subject preferences for user:", user.email);
        const userPrefsDoc = doc(db, "userPreferences", user.email);
        const docSnap = await getDoc(userPrefsDoc);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const subjects = data.subjects || [];
          debugLog("Loaded user subject preferences:", subjects);
          setSubjectPreferences(subjects);

          // Only filter if there are preferences
          if (subjects.length > 0) {
            debugLog("Enabling subject filtering with preferences:", subjects);
            setIsFiltering(true);
            filterFileStructure(subjects);
          } else {
            debugLog("No subject preferences found, showing all subjects");
            setIsFiltering(false);
            setFilteredStructure(null);
          }
        } else {
          debugLog("No preferences document found for user:", user.email);
          setIsFiltering(false);
          setFilteredStructure(null);
        }
      } catch (error) {
        console.error("Error fetching subject preferences:", error);
        setIsFiltering(false);
        setFilteredStructure(null);
      }
    };

    fetchSubjectPreferences();
  }, [user?.email]);

  // Function to filter the file structure based on subject preferences
  const filterFileStructure = (subjects) => {
    if (!subjects.length) {
      debugLog("No subjects to filter by");
      setFilteredStructure(null);
      return;
    }

    debugLog("Starting file structure filtering with subjects:", subjects);

    // Function to check if a subject name matches any preference
    const matchesPreference = (subjectName, path) => {
      if (!subjectName) return false;

      debugLog(
        `Checking if subject "${subjectName}" matches preferences in path: ${path}`
      );
      const subjectNameLower = subjectName.toLowerCase();

      // Find what exam board we're in (IAL or IGCSE)
      let examBoard = "";
      let currentPath = path;
      if (currentPath) {
        const pathParts = currentPath.split("/");
        if (pathParts.length > 0) {
          examBoard = pathParts[0].toLowerCase(); // IAL or IGCSE
          debugLog(`Found exam board from path: ${examBoard}`);
        }
      }

      // For IGCSE Mathematics A/B and Further Pure Mathematics, we need EXACT matches
      const specificSubjectMatches = {
        "igcse-mathematics-a": ["Mathematics A"],
        "igcse-mathematics-b": ["Mathematics B"],
        "igcse-further-pure-mathematics": ["Further Pure Mathematics"],
        "igcse-physics": ["Physics"],
        "igcse-chemistry": ["Chemistry"],
        "ial-mathematics": ["Mathematics"],
      };

      // Check each subject preference against all possible variations
      for (const subjectId of subjects) {
        debugLog(`Checking against subject preference: ${subjectId}`);
        const subjectIdLower = subjectId.toLowerCase();

        // Check if we have this in our specific matches map
        if (specificSubjectMatches[subjectIdLower]) {
          const exactMatches = specificSubjectMatches[subjectIdLower];
          debugLog(
            `Using specific matches for ${subjectIdLower}:`,
            exactMatches
          );
          if (
            exactMatches.some(
              (match) => match.toLowerCase() === subjectNameLower
            )
          ) {
            debugLog(
              `✓ EXACT match found: ${subjectName} matches ${subjectIdLower}`
            );
            return true;
          }
          continue; // Don't do fuzzy matching for these specific subjects
        }

        // Extract base subject name from ID (remove ial- or igcse- prefix)
        let baseSubject = subjectIdLower;
        if (
          baseSubject.startsWith("ial-") ||
          baseSubject.startsWith("igcse-")
        ) {
          baseSubject = baseSubject.replace(/^(ial|igcse)-/, "");
          debugLog(`Extracted base subject: ${baseSubject}`);
        }

        // Direct match
        if (
          subjectNameLower === baseSubject ||
          subjectNameLower === subjectIdLower
        ) {
          debugLog(`✓ Direct match: ${subjectName}`);
          return true;
        }

        // Check aliases
        if (subjectAliases[baseSubject]) {
          if (
            subjectAliases[baseSubject].some(
              (alias) => alias === subjectNameLower
            )
          ) {
            debugLog(`✓ Alias match: ${subjectName} via aliases`);
            return true;
          }
        }

        // Check if subject name contains the base subject
        if (subjectNameLower.includes(baseSubject)) {
          debugLog(`✓ Partial match: ${subjectName} contains ${baseSubject}`);
          return true;
        }
      }

      debugLog(`✗ No match found for: ${subjectName}`);
      return false;
    };

    const filterNode = (node, path = "") => {
      if (!node || typeof node !== "object") return null;

      const filtered = {};
      let hasContent = false;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file - keep it
          filtered[key] = value;
          hasContent = true;
        } else if (Array.isArray(value)) {
          // This is an array of papers - keep it
          filtered[key] = value;
          hasContent = true;
        } else if (value && typeof value === "object") {
          // This is a folder - check if it should be included
          const isSubjectFolder = path && path.split("/").length === 1; // Direct child of IAL/IGCSE

          if (isSubjectFolder) {
            // This is a subject folder - check if it matches preferences
            if (matchesPreference(key, currentPath)) {
              debugLog(
                `Including subject folder: ${key} at path: ${currentPath}`
              );
              filtered[key] = value;
              hasContent = true;
            } else {
              debugLog(
                `Excluding subject folder: ${key} at path: ${currentPath}`
              );
            }
          } else {
            // This is not a subject folder - recurse and include if it has content
            const filteredChild = filterNode(value, currentPath);
            if (filteredChild && Object.keys(filteredChild).length > 0) {
              filtered[key] = filteredChild;
              hasContent = true;
            }
          }
        }
      }

      return hasContent ? filtered : null;
    };

    try {
      const filtered = filterNode(fileStructure);
      debugLog("Filtering complete. Result:", filtered);
      setFilteredStructure(filtered);
    } catch (error) {
      console.error("Error during filtering:", error);
      setFilteredStructure(null);
    }
  };

  const toggleFilter = () => {
    debugLog(`Toggling filter. Current state: ${isFiltering}`);

    if (isFiltering) {
      // Turn off filtering
      setIsFiltering(false);
      setFilteredStructure(null);
      debugLog("Filter disabled - showing all subjects");
    } else {
      // Turn on filtering if we have preferences
      if (subjectPreferences.length > 0) {
        setIsFiltering(true);
        filterFileStructure(subjectPreferences);
        debugLog("Filter enabled with preferences:", subjectPreferences);
      } else {
        debugLog("Cannot enable filter - no subject preferences found");
        // Could show a message to user here
      }
    }
  };

  // Determine which structure to render
  const structureToRender =
    isFiltering && filteredStructure ? filteredStructure : fileStructure;

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = [];

    const searchRecursively = (node, path = "", breadcrumb = []) => {
      if (!node || typeof node !== "object") return;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}/${key}` : key;
        const currentBreadcrumb = [...breadcrumb, key];

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          const paperName = value.name || key;
          if (paperName.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              type: "file",
              paper: value,
              path: currentPath,
              breadcrumb: currentBreadcrumb,
            });
          }
        } else if (Array.isArray(value)) {
          // This is an array of papers
          value.forEach((paper, index) => {
            const paperPath = `${currentPath}/${paper.name}`;
            const paperBreadcrumb = [...currentBreadcrumb, paper.name];

            if (paper.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              results.push({
                type: "file",
                paper: paper,
                path: paperPath,
                breadcrumb: paperBreadcrumb,
              });
            }
          });
        } else if (value && typeof value === "object") {
          // This is a folder
          if (key.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              type: "folder",
              name: key,
              path: currentPath,
              breadcrumb: currentBreadcrumb,
            });
          }
          // Continue searching recursively
          searchRecursively(value, currentPath, currentBreadcrumb);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      searchRecursively(structureToRender);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, structureToRender]);

  // Load user completed mocks and goals
  useEffect(() => {
    const fetchUserMocks = async () => {
      if (!user?.email) {
        setCompletedMocks([]);
        setUserGoals([]);
        setIsLoadingMocks(false);
        return;
      }

      try {
        setIsLoadingMocks(true);
        const [mocks, goals] = await Promise.all([
          getUserCompletedMocks(user.email),
          getUserGoals(user.email),
        ]);
        setCompletedMocks(mocks || []);
        setUserGoals(goals || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCompletedMocks([]);
        setUserGoals([]);
      } finally {
        setIsLoadingMocks(false);
      }
    };

    fetchUserMocks();
  }, [user?.email]);

  const isPaperCompleted = (paperPath) => {
    return completedMocks.some((mock) => mock.paperPath === paperPath);
  };

  const getPaperScore = (paperPath) => {
    const mock = completedMocks.find((mock) => mock.paperPath === paperPath);
    return mock ? mock.totalScore : 0;
  };

  const isPaperInGoals = (paperPath) => {
    return userGoals.some((goal) => goal.paperPath === paperPath);
  };

  const getGoalStatus = (paperPath) => {
    const goal = userGoals.find((goal) => goal.paperPath === paperPath);
    return goal ? goal.status : null;
  };

  const toggleExpand = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const updateBreadcrumbs = (file, path) => {
    const pathParts = path.split("/");
    const breadcrumbs = pathParts.map((part, index) => {
      const partPath = pathParts.slice(0, index + 1).join("/");
      return { name: part, path: partPath };
    });
    return breadcrumbs;
  };

  const handleFileSelection = (file, path, breadcrumb = null) => {
    // Update breadcrumbs if not provided from search
    let finalBreadcrumb = breadcrumb;
    if (!finalBreadcrumb) {
      finalBreadcrumb = updateBreadcrumbs(file, path);
    }

    // Close mobile modal if it exists
    if (isMobile && closeModal) {
      closeModal();
    }

    // Call the parent's file selection handler
    onFileSelect(file, path, finalBreadcrumb);
  };

  const addSelectedPapersToGoals = async () => {
    if (selectedPapers.length === 0 || !user?.email) return;

    setIsAddingToGoals(true);
    setAddStatus({ success: 0, error: 0, show: false });

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const paper of selectedPapers) {
        try {
          const subject = extractSubjectFromPath(paper.path);
          const year = extractYearFromPath(paper.path);
          const session = extractSessionFromPath(paper.path);
          const examBoard = extractExamBoardFromPath(paper.path);

          const goalData = {
            paperPath: paper.path,
            paperName: paper.name,
            subject: subject,
            year: year,
            session: session,
            examBoard: examBoard,
            addedAt: new Date(),
            status: "pending",
            targetDate: null,
            priority: "medium",
          };

          await addPaperGoal(user.email, goalData);
          successCount++;
        } catch (error) {
          console.error(`Error adding paper ${paper.name} to goals:`, error);
          errorCount++;
        }
      }

      // Update the status display
      setAddStatus({
        success: successCount,
        error: errorCount,
        show: true,
      });

      // Clear selections if any were successful
      if (successCount > 0) {
        setSelectedPapers([]);
        // Refresh user goals to show updated state
        try {
          const goals = await getUserGoals(user.email);
          setUserGoals(goals || []);
        } catch (error) {
          console.error("Error refreshing goals:", error);
        }
      }

      // Hide status after 3 seconds
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error("Error in addSelectedPapersToGoals:", error);
    } finally {
      setIsAddingToGoals(false);
    }
  };

  // Helper functions to extract info from path
  const extractSubjectFromPath = (path) => {
    const parts = path.split("/");
    return parts[1] || "Unknown";
  };

  const extractYearFromPath = (path) => {
    const parts = path.split("/");
    return parts[2] || "Unknown";
  };

  const extractSessionFromPath = (path) => {
    const parts = path.split("/");
    // Session is typically the 3rd part (index 3) in paths like "IAL/Mathematics/2024/May-June/..."
    if (parts.length > 3) {
      return parts[3];
    }
    return "Unknown";
  };

  const extractExamBoardFromPath = (path) => {
    const parts = path.split("/");
    return parts[0] || "Unknown";
  };

  const togglePaperSelection = (e, paperInfo) => {
    e.stopPropagation();

    const paperPath = paperInfo.path;
    const isCurrentlySelected = selectedPapers.some(
      (p) => p.path === paperPath
    );

    if (isCurrentlySelected) {
      setSelectedPapers((prev) => prev.filter((p) => p.path !== paperPath));
    } else {
      setSelectedPapers((prev) => [...prev, paperInfo]);
    }
  };

  const clearSelections = () => {
    setSelectedPapers([]);
  };

  const isSessionFolder = (key) => {
    // Check if the key matches common session patterns
    const sessionPatterns = [
      /^May.*June$/i, // May-June, May_June, etc.
      /^Oct.*Nov$/i, // Oct-Nov, Oct_Nov, etc.
      /^Feb.*Mar$/i, // Feb-Mar, Feb_Mar, etc.
      /^Winter$/i,
      /^Summer$/i,
      /^Spring$/i,
      /^Autumn$/i,
      /^Fall$/i,
    ];

    return sessionPatterns.some((pattern) => pattern.test(key));
  };

  const hasSelectedPapersInYear = (yearPath, yearNode) => {
    if (!yearNode || typeof yearNode !== "object") return false;

    const checkForSelectedPapers = (node, path) => {
      if (!node || typeof node !== "object") return false;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          if (selectedPapers.some((p) => p.path === currentPath)) {
            return true;
          }
        } else if (Array.isArray(value)) {
          // This is an array of papers
          for (const paper of value) {
            const paperPath = `${currentPath}/${paper.name}`;
            if (selectedPapers.some((p) => p.path === paperPath)) {
              return true;
            }
          }
        } else if (value && typeof value === "object") {
          // This is a folder, recurse
          if (checkForSelectedPapers(value, currentPath)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkForSelectedPapers(yearNode, yearPath);
  };

  const toggleYearSelection = (e, folderPath, node) => {
    e.stopPropagation();

    const hasSelected = hasSelectedPapersInYear(folderPath, node);

    const collectPapers = (currentNode, currentPath) => {
      const papers = [];

      if (!currentNode || typeof currentNode !== "object") return papers;

      for (const [key, value] of Object.entries(currentNode)) {
        const fullPath = currentPath ? `${currentPath}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          papers.push({ ...value, path: fullPath });
        } else if (Array.isArray(value)) {
          // This is an array of papers
          value.forEach((paper) => {
            const paperPath = `${fullPath}/${paper.name}`;
            papers.push({ ...paper, path: paperPath });
          });
        } else if (value && typeof value === "object") {
          // This is a folder, recurse
          papers.push(...collectPapers(value, fullPath));
        }
      }

      return papers;
    };

    const papersInYear = collectPapers(node, folderPath);

    if (hasSelected) {
      // Remove all papers in this year from selections
      setSelectedPapers((prev) =>
        prev.filter(
          (selected) =>
            !papersInYear.some((paper) => paper.path === selected.path)
        )
      );
    } else {
      // Add all papers in this year to selections (that aren't already goals)
      const newSelections = papersInYear.filter(
        (paper) =>
          !isPaperInGoals(paper.path) &&
          !selectedPapers.some((selected) => selected.path === paper.path)
      );
      setSelectedPapers((prev) => [...prev, ...newSelections]);
    }
  };

  const toggleSessionSelection = (e, folderPath, node) => {
    e.stopPropagation();

    const hasSelected = hasSelectedPapersInSession(folderPath, node);

    const collectPapers = (currentNode, currentPath) => {
      const papers = [];

      if (!currentNode || typeof currentNode !== "object") return papers;

      for (const [key, value] of Object.entries(currentNode)) {
        const fullPath = currentPath ? `${currentPath}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          papers.push({ ...value, path: fullPath });
        } else if (Array.isArray(value)) {
          // This is an array of papers
          value.forEach((paper) => {
            const paperPath = `${fullPath}/${paper.name}`;
            papers.push({ ...paper, path: paperPath });
          });
        } else if (value && typeof value === "object") {
          // This is a folder, recurse
          papers.push(...collectPapers(value, fullPath));
        }
      }

      return papers;
    };

    const papersInSession = collectPapers(node, folderPath);

    if (hasSelected) {
      // Remove all papers in this session from selections
      setSelectedPapers((prev) =>
        prev.filter(
          (selected) =>
            !papersInSession.some((paper) => paper.path === selected.path)
        )
      );
    } else {
      // Add all papers in this session to selections (that aren't already goals)
      const newSelections = papersInSession.filter(
        (paper) =>
          !isPaperInGoals(paper.path) &&
          !selectedPapers.some((selected) => selected.path === paper.path)
      );
      setSelectedPapers((prev) => [...prev, ...newSelections]);
    }
  };

  const hasSelectedPapersInSession = (sessionPath, sessionNode) => {
    if (!sessionNode || typeof sessionNode !== "object") return false;

    const checkForSelectedPapers = (node, path) => {
      if (!node || typeof node !== "object") return false;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          if (selectedPapers.some((p) => p.path === currentPath)) {
            return true;
          }
        } else if (Array.isArray(value)) {
          // This is an array of papers
          for (const paper of value) {
            const paperPath = `${currentPath}/${paper.name}`;
            if (selectedPapers.some((p) => p.path === paperPath)) {
              return true;
            }
          }
        } else if (value && typeof value === "object") {
          // This is a folder, recurse
          if (checkForSelectedPapers(value, currentPath)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkForSelectedPapers(sessionNode, sessionPath);
  };

  const areAllPapersInYearInGoals = (yearPath, yearNode) => {
    if (!yearNode || typeof yearNode !== "object") return false;

    const checkPapersInGoals = (node, path) => {
      if (!node || typeof node !== "object")
        return { allInGoals: true, hasAnyPapers: false };

      let allInGoals = true;
      let hasAnyPapers = false;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          hasAnyPapers = true;
          if (!isPaperInGoals(currentPath)) {
            allInGoals = false;
          }
        } else if (Array.isArray(value)) {
          // This is an array of papers
          for (const paper of value) {
            const paperPath = `${currentPath}/${paper.name}`;
            hasAnyPapers = true;
            if (!isPaperInGoals(paperPath)) {
              allInGoals = false;
            }
          }
        } else if (value && typeof value === "object") {
          // This is a folder, recurse
          const result = checkPapersInGoals(value, currentPath);
          if (result.hasAnyPapers) {
            hasAnyPapers = true;
            if (!result.allInGoals) {
              allInGoals = false;
            }
          }
        }
      }

      return { allInGoals, hasAnyPapers };
    };

    const result = checkPapersInGoals(yearNode, yearPath);
    return result.hasAnyPapers && result.allInGoals;
  };

  const areAllPapersInSessionInGoals = (sessionPath, sessionNode) => {
    if (!sessionNode || typeof sessionNode !== "object") return false;

    const checkPapersInGoals = (node, path) => {
      if (!node || typeof node !== "object")
        return { allInGoals: true, hasAnyPapers: false };

      let allInGoals = true;
      let hasAnyPapers = false;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}/${key}` : key;

        if (value && typeof value === "object" && value.qp) {
          // This is a paper file
          hasAnyPapers = true;
          if (!isPaperInGoals(currentPath)) {
            allInGoals = false;
          }
        } else if (Array.isArray(value)) {
          // This is an array of papers
          for (const paper of value) {
            const paperPath = `${currentPath}/${paper.name}`;
            hasAnyPapers = true;
            if (!isPaperInGoals(paperPath)) {
              allInGoals = false;
            }
          }
        } else if (value && typeof value === "object") {
          // This is a folder, recurse
          const result = checkPapersInGoals(value, currentPath);
          if (result.hasAnyPapers) {
            hasAnyPapers = true;
            if (!result.allInGoals) {
              allInGoals = false;
            }
          }
        }
      }

      return { allInGoals, hasAnyPapers };
    };

    const result = checkPapersInGoals(sessionNode, sessionPath);
    return result.hasAnyPapers && result.allInGoals;
  };

  const getIcon = (key, currentPath) => {
    // Special icons for exam boards
    if (key === "IAL" || key === "IGCSE") {
      return <FolderOpen size={18} className="mr-2 text-blue-400" />;
    }

    // Subject-specific icons
    const subjectIcons = {
      Chemistry: <FlaskConical size={18} className="mr-2 text-green-400" />,
      Physics: <Magnet size={18} className="mr-2 text-blue-400" />,
      Mathematics: <Calculator size={18} className="mr-2 text-purple-400" />,
      "Mathematics A": (
        <Calculator size={18} className="mr-2 text-purple-400" />
      ),
      "Mathematics B": (
        <Calculator size={18} className="mr-2 text-purple-500" />
      ),
      "Further Pure Mathematics": (
        <Radical size={18} className="mr-2 text-indigo-400" />
      ),
      Biology: <Cone size={18} className="mr-2 text-yellow-400" />,
      "Computer Science": (
        <SquareSigma size={18} className="mr-2 text-cyan-400" />
      ),
    };

    // Check if this key matches any subject
    if (subjectIcons[key]) {
      return subjectIcons[key];
    }

    // Default folder icon
    return <Folder size={18} className="mr-2 text-gray-400" />;
  };

  const renderTree = (node, path = "") => {
    // Sort keys - specially handle year folders to be in descending order
    const sortedKeys = Object.keys(node).sort((a, b) => {
      // If both keys are years (4 digits), sort in descending order
      if (/^\d{4}$/.test(a) && /^\d{4}$/.test(b)) {
        return parseInt(b) - parseInt(a); // Descending order (newest first)
      }
      // Otherwise keep normal alphabetical order
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => {
      const currentPath = path ? `${path}/${key}` : key;
      const isLeaf = node[key] && typeof node[key] === "object" && node[key].qp;
      const isPapersArray = Array.isArray(node[key]);
      const isActive = activePath.startsWith(currentPath);

      if (isLeaf) {
        const isCompleted = isPaperCompleted(currentPath);
        const score = getPaperScore(currentPath);
        const isGoal = isPaperInGoals(currentPath);
        const goalStatus = getGoalStatus(currentPath);
        const isSelected = selectedPapers.some((p) => p.path === currentPath);

        return (
          <div
            key={currentPath}
            className={`border-b border-gray-800/50 py-3 px-4 flex items-center justify-between touch-manipulation transition-all duration-200 ${
              activePath === currentPath
                ? "bg-blue-600/20 border-blue-500/30"
                : "hover:bg-gray-800/30 active:bg-gray-700/40"
            } ${examMode ? "opacity-50 pointer-events-none" : ""} ${
              isSelected ? "bg-indigo-900/30" : ""
            }`}
            onClick={() => {
              if (!examMode) {
                handleFileSelection(node[key], currentPath);
              }
            }}
            onTouchStart={() => {}}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (!examMode) {
                handleFileSelection(node[key], currentPath);
              }
            }}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Only show checkbox if user is logged in and paper is not already in goals */}
              {!isGoal && user && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) =>
                    togglePaperSelection(e, { ...node[key], path: currentPath })
                  }
                >
                  <div
                    className={`w-5 h-5 flex items-center justify-center rounded border ${
                      isSelected
                        ? "bg-blue-500 border-blue-600"
                        : "border-gray-600 bg-gray-800"
                    }`}
                  >
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                </div>
              )}

              {/* Add left margin if no checkbox is shown */}
              {isGoal && <div className="w-5 flex-shrink-0"></div>}

              <FileText size={18} className="text-gray-400 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <span className="text-white text-base font-medium truncate block">
                  {node[key].name || key}
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Display completion indicator with score-based styling */}
                {isCompleted && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      score >= 70
                        ? "bg-green-900/40 text-green-400 border border-green-700/50"
                        : score >= 40
                        ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50"
                        : "bg-red-900/40 text-red-400 border border-red-700/50"
                    }`}
                    title={`Mock completed with score: ${Math.round(score)}%`}
                  >
                    {Math.round(score)}%
                  </span>
                )}

                {/* Display goal indicator with proper icon */}
                {isGoal && !isCompleted && (
                  <Target
                    size={16}
                    className="text-blue-400"
                    title="In Study Goals"
                  />
                )}

                <ChevronRight size={16} className="text-gray-500" />
              </div>
            </div>
          </div>
        );
      }

      if (isPapersArray) {
        // Sort papers if this is the IAL Mathematics section
        const isMathematicsPath = currentPath.includes("IAL/Mathematics");
        const papersToRender = isMathematicsPath
          ? sortMathematicsPapers(node[key])
          : node[key];

        return (
          <div key={currentPath} className="border-l border-gray-700/50">
            {papersToRender.map((paper, index) => {
              // Create a unique key that combines path and index
              const paperPath = `${currentPath}/${paper.name}`;
              const uniqueKey = `${paperPath}-${index}`;
              const isCompleted = isPaperCompleted(paperPath);
              const score = getPaperScore(paperPath);
              const isGoal = isPaperInGoals(paperPath);
              const goalStatus = getGoalStatus(paperPath);
              const isSelected = selectedPapers.some(
                (p) => p.path === paperPath
              );

              return (
                <div
                  key={uniqueKey}
                  className={`border-b border-gray-800/50 py-3 px-4 ml-4 flex items-center justify-between touch-manipulation transition-all duration-200 ${
                    activePath === paperPath
                      ? "bg-blue-600/20 border-blue-500/30"
                      : "hover:bg-gray-800/30 active:bg-gray-700/40"
                  } ${examMode ? "opacity-50 pointer-events-none" : ""} ${
                    isSelected ? "bg-indigo-900/30" : ""
                  }`}
                  onClick={() => {
                    if (!examMode) {
                      handleFileSelection(paper, paperPath);
                    }
                  }}
                  onTouchStart={() => {}}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (!examMode) {
                      handleFileSelection(paper, paperPath);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Only show checkbox if user is logged in and paper is not already in goals */}
                    {!isGoal && user && (
                      <div
                        className="flex-shrink-0"
                        onClick={(e) =>
                          togglePaperSelection(e, { ...paper, path: paperPath })
                        }
                      >
                        <div
                          className={`w-5 h-5 flex items-center justify-center rounded border ${
                            isSelected
                              ? "bg-blue-500 border-blue-600"
                              : "border-gray-600 bg-gray-800"
                          }`}
                        >
                          {isSelected && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add left margin if no checkbox is shown */}
                    {isGoal && <div className="w-5 flex-shrink-0"></div>}

                    <FileText
                      size={18}
                      className="text-gray-400 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <span className="text-white text-base font-medium truncate block">
                        {paper.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Display completion indicator with score-based styling */}
                      {isCompleted && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            score >= 70
                              ? "bg-green-900/40 text-green-400 border border-green-700/50"
                              : score >= 40
                              ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50"
                              : "bg-red-900/40 text-red-400 border border-red-700/50"
                          }`}
                          title={`Mock completed with score: ${Math.round(
                            score
                          )}%`}
                        >
                          {Math.round(score)}%
                        </span>
                      )}

                      {/* Display paper has SpecimenPaper icon */}
                      {paper.sp && (
                        <Star
                          size={16}
                          className="text-yellow-400"
                          fill="currentColor"
                        />
                      )}

                      {/* Display goal indicator with proper icon */}
                      {isGoal && !isCompleted && (
                        <Target
                          size={16}
                          className="text-blue-400"
                          title="In Study Goals"
                        />
                      )}

                      <ChevronRight size={16} className="text-gray-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      // Handle regular folder node (non-leaf, non-array)
      return (
        <div key={currentPath}>
          <div
            className={`border-b border-gray-800/50 py-4 px-4 flex items-center justify-between touch-manipulation transition-all duration-200 ${
              isActive
                ? "bg-gray-800/60"
                : "hover:bg-gray-800/30 active:bg-gray-700/40"
            } ${examMode ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => {
              if (!examMode) {
                toggleExpand(currentPath);
              }
            }}
            onTouchStart={() => {}}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (!examMode) {
                toggleExpand(currentPath);
              }
            }}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Add checkbox or goal icon for year folders (likely 4-digit year) */}
              {!examMode && user && key.match(/^20\d{2}$/) && (
                <>
                  {areAllPapersInYearInGoals(currentPath, node[key]) ? (
                    <div className="flex-shrink-0">
                      <Target
                        size={16}
                        className="text-blue-400"
                        title="All papers in goals"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex-shrink-0"
                      onClick={(e) =>
                        toggleYearSelection(e, currentPath, node[key])
                      }
                    >
                      <div
                        className={`w-5 h-5 flex items-center justify-center rounded border ${
                          hasSelectedPapersInYear(currentPath, node[key])
                            ? "bg-blue-500 border-blue-600"
                            : "border-gray-600 bg-gray-800 hover:border-blue-400"
                        }`}
                      >
                        {hasSelectedPapersInYear(currentPath, node[key]) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Add checkbox or goal icon for session folders */}
              {!examMode &&
                user &&
                isSessionFolder(key) &&
                !key.match(/^20\d{2}$/) && (
                  <>
                    {areAllPapersInSessionInGoals(currentPath, node[key]) ? (
                      <div className="flex-shrink-0">
                        <Target
                          size={16}
                          className="text-blue-400"
                          title="All papers in goals"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex-shrink-0"
                        onClick={(e) =>
                          toggleSessionSelection(e, currentPath, node[key])
                        }
                      >
                        <div
                          className={`w-5 h-5 flex items-center justify-center rounded border ${
                            hasSelectedPapersInSession(currentPath, node[key])
                              ? "bg-blue-500 border-blue-600"
                              : "border-gray-600 bg-gray-800 hover:border-blue-400"
                          }`}
                        >
                          {hasSelectedPapersInSession(
                            currentPath,
                            node[key]
                          ) && <Check size={14} className="text-white" />}
                        </div>
                      </div>
                    )}
                  </>
                )}

              {getIcon(key, currentPath)}

              <div className="flex-1 min-w-0">
                <span className="text-white text-base font-semibold truncate block">
                  {key}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              {expanded[currentPath] ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </div>
          </div>
          {expanded[currentPath] && (
            <div className="ml-4">{renderTree(node[key], currentPath)}</div>
          )}
        </div>
      );
    });
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <FileQuestion size={32} className="mx-auto mb-3 text-gray-500" />
          <p className="text-base">No papers found matching '{searchQuery}'</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <h3 className="text-sm uppercase text-blue-400 font-semibold mb-4 tracking-wider px-4 pt-2">
          Search Results ({searchResults.length})
        </h3>

        {searchResults.map((result, index) => {
          const isCompleted = isPaperCompleted(result.path);
          const score = getPaperScore(result.path);
          const isGoal = isPaperInGoals(result.path);
          const isSelected = selectedPapers.some((p) => p.path === result.path);

          // Create a meaningful label from breadcrumb
          const pathLabel = result.breadcrumb.join(" > ");

          return (
            <div
              key={index}
              className={`border-b border-gray-800/50 py-4 px-4 touch-manipulation transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-900/30"
                  : "hover:bg-gray-700/50 active:bg-gray-700/40"
              }`}
              onClick={() => {
                if (!examMode) {
                  handleFileSelection(
                    result.paper,
                    result.path,
                    result.breadcrumb
                  );
                }
              }}
              onTouchStart={() => {}}
              onTouchEnd={(e) => {
                e.preventDefault();
                if (!examMode) {
                  handleFileSelection(
                    result.paper,
                    result.path,
                    result.breadcrumb
                  );
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {/* Only show checkbox if user is logged in and paper is not already in goals */}
                {!isGoal && user && (
                  <div
                    className="flex-shrink-0 mt-1"
                    onClick={(e) =>
                      togglePaperSelection(e, {
                        ...result.paper,
                        path: result.path,
                      })
                    }
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded border ${
                        isSelected
                          ? "bg-blue-500 border-blue-600"
                          : "border-gray-600 bg-gray-800"
                      }`}
                    >
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                )}
                {/* Add left margin if no checkbox is shown */}
                {isGoal && <div className="w-5 flex-shrink-0"></div>}

                <FileText
                  size={18}
                  className="text-gray-400 flex-shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-base font-medium truncate">
                      {result.paper.name}
                    </span>

                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      {/* Display completion indicator with score-based styling */}
                      {isCompleted && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            score >= 70
                              ? "bg-green-900/40 text-green-400 border border-green-700/50"
                              : score >= 40
                              ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50"
                              : "bg-red-900/40 text-red-400 border border-red-700/50"
                          }`}
                          title={`Mock completed with score: ${Math.round(
                            score
                          )}%`}
                        >
                          {Math.round(score)}%
                        </span>
                      )}

                      {/* Display goal indicator with proper icon */}
                      {isGoal && !isCompleted && (
                        <Target
                          size={16}
                          className="text-blue-400"
                          title="In Study Goals"
                        />
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 truncate">
                    {pathLabel}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Mobile-optimized search and filter controls */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/60">
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
          />
          <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-white touch-manipulation p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Subject filtering toggle */}
        <div className="flex justify-between items-center text-sm text-gray-300">
          <button
            onClick={toggleFilter}
            className={`flex items-center px-4 py-2 rounded-lg border touch-manipulation transition-all ${
              isFiltering
                ? "text-blue-300 border-blue-500 bg-blue-900/20"
                : "text-gray-300 border-gray-600 hover:bg-gray-700 active:bg-gray-600"
            }`}
          >
            {isFiltering ? (
              <FilterX size={16} className="mr-2" />
            ) : (
              <Star size={16} className="mr-2" />
            )}
            {isFiltering ? "Show All" : "My Subjects"}
          </button>

          {/* Selection actions buttons */}
          {!examMode && user && (
            <div className="flex space-x-2">
              {selectedPapers.length > 0 && (
                <>
                  <button
                    onClick={clearSelections}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-600 hover:bg-gray-700 active:bg-gray-600 touch-manipulation transition-all"
                    title="Clear selections"
                  >
                    Clear ({selectedPapers.length})
                  </button>
                  <button
                    onClick={addSelectedPapersToGoals}
                    disabled={isAddingToGoals || selectedPapers.length === 0}
                    className={`px-3 py-2 text-sm rounded-lg border touch-manipulation transition-all ${
                      isAddingToGoals
                        ? "bg-blue-800/50 border-blue-700 text-blue-300"
                        : addStatus.show && addStatus.success > 0
                        ? "bg-green-800/50 border-green-700 text-green-300"
                        : "border-gray-600 hover:bg-gray-700 active:bg-gray-600"
                    } flex items-center`}
                  >
                    {isAddingToGoals ? (
                      <>
                        <span className="animate-pulse">Processing...</span>
                      </>
                    ) : addStatus.show && addStatus.success > 0 ? (
                      <>
                        <CheckCircle2 size={14} className="mr-1" />
                        Added {addStatus.success}
                      </>
                    ) : (
                      "Add to Goals"
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Render search results or tree */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? renderSearchResults() : renderTree(structureToRender)}
      </div>
    </div>
  );
}
