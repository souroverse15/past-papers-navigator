import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
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
} from "../firebase/userService";

export default function FileNavigator({
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
    console.log(`[FileNavigator] ${message}`, ...args);
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
          // Only match if we're in the correct exam board section AND the subject name matches exactly
          if (examBoard && subjectIdLower.startsWith(examBoard)) {
            const exactMatches = specificSubjectMatches[subjectIdLower];
            if (exactMatches.includes(subjectName)) {
              debugLog(
                `✅ EXACT match: "${subjectName}" is exactly in the list for "${subjectIdLower}"`
              );
              return true;
            } else {
              debugLog(
                `❌ Not an exact match: "${subjectName}" is not in list for "${subjectIdLower}"`
              );
            }
          } else {
            debugLog(
              `❌ Skip: Wrong exam board for "${subjectIdLower}" - we're in "${examBoard}"`
            );
          }
        }
        // Handle prefixed subjects
        else if (
          subjectIdLower.startsWith("ial-") ||
          subjectIdLower.startsWith("igcse-")
        ) {
          // Extract the actual subject name and the board prefix
          const [prefixPart, ...subjectParts] = subjectIdLower.split("-");

          // Skip this preference if we're in a different exam board section
          if (examBoard && prefixPart !== examBoard.toLowerCase()) {
            debugLog(
              `Skipping preference ${subjectIdLower} because we're in ${examBoard} section`
            );
            continue;
          }
        }
      }

      debugLog(`❌ No match found for subject: ${subjectName}`);
      return false;
    };

    // Clone file structure and filter it
    const filtered = JSON.parse(JSON.stringify(fileStructure));

    // Filter function that traverses the tree
    const filterNode = (node, path = "") => {
      if (!node) return null;

      const result = {};

      // Process each key in the node
      Object.keys(node).forEach((key) => {
        const currentPath = path ? `${path}/${key}` : key;
        debugLog(`Checking node: ${key} (path: ${currentPath})`);

        // Handle top-level categories (IGCSE and IAL)
        if (key === "IGCSE" || key === "IAL") {
          debugLog(`Found exam board: ${key}`);
          // Always include these top-level categories
          const filteredSubNode = filterNode(node[key], currentPath);
          if (filteredSubNode && Object.keys(filteredSubNode).length > 0) {
            result[key] = filteredSubNode;
          }
        }
        // Handle arrays of papers
        else if (Array.isArray(node[key])) {
          debugLog(
            `Found array of papers: ${key} (${node[key].length} papers)`
          );
          result[key] = node[key]; // Keep all paper arrays
        }
        // Handle file objects
        else if (node[key] && typeof node[key] === "object" && node[key].qp) {
          debugLog(`Found file object: ${key}`);
          result[key] = node[key]; // Keep all file objects
        }
        // Handle subject directories specifically
        else if (
          currentPath.includes("IGCSE/") ||
          currentPath.includes("IAL/")
        ) {
          // Check if this is a subject level directory (direct child of IGCSE or IAL)
          const pathParts = currentPath.split("/");
          const isDirectSubject = pathParts.length === 2; // e.g., "IGCSE/Mathematics A"

          if (isDirectSubject) {
            debugLog(`Found subject directory: ${key} (path: ${currentPath})`);
            // Check if this subject matches preferences
            if (matchesPreference(key, currentPath)) {
              debugLog(`✅ Keeping subject that matches preferences: ${key}`);
              result[key] = filterNode(node[key], currentPath);
            } else {
              debugLog(
                `❌ Filtering out subject that doesn't match preferences: ${key}`
              );
            }
          } else {
            // For non-subject directories, process recursively (years, papers, etc.)
            debugLog(`Found non-subject directory: ${key} (in ${currentPath})`);
            const filteredSubNode = filterNode(node[key], currentPath);
            if (filteredSubNode && Object.keys(filteredSubNode).length > 0) {
              result[key] = filteredSubNode;
            }
          }
        }
        // Handle any other directories (should rarely happen)
        else if (typeof node[key] === "object") {
          debugLog(`Found other directory: ${key}`);
          const filteredSubNode = filterNode(node[key], currentPath);
          if (filteredSubNode && Object.keys(filteredSubNode).length > 0) {
            result[key] = filteredSubNode;
          }
        }
      });

      return Object.keys(result).length > 0 ? result : null;
    };

    const filteredResult = filterNode(filtered);
    console.log("Filtered structure:", filteredResult);
    setFilteredStructure(filteredResult || fileStructure);
  };

  // Toggle filter on/off with better debugging
  const toggleFilter = () => {
    if (isFiltering) {
      debugLog("Disabling subject filtering");
      setIsFiltering(false);
      setFilteredStructure(null);
    } else if (subjectPreferences.length > 0) {
      debugLog(
        "Enabling subject filtering with preferences:",
        subjectPreferences
      );
      setIsFiltering(true);
      filterFileStructure(subjectPreferences);
    } else {
      debugLog("Cannot enable filtering - no subject preferences found");

      // Show more helpful alert message
      alert(
        "No subject preferences found in your profile. " +
          "Please add subjects in your User Dashboard (Preferences tab) first, " +
          "then try filtering again."
      );
    }
  };

  // Handle search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = [];
    const query = searchQuery.toLowerCase().trim();

    // Check if query contains year pattern (e.g., 2019, 19)
    const yearPattern = /\b(20\d{2}|\d{2})\b/;
    const yearMatch = query.match(yearPattern);
    const searchYear = yearMatch ? yearMatch[0] : null;

    // Check for session keywords
    const sessionKeywords = {
      may: ["may", "may-june", "m/j", "summer"],
      june: ["may", "may-june", "m/j", "summer"],
      oct: ["oct", "oct-nov", "o/n", "winter", "fall"],
      nov: ["oct", "oct-nov", "o/n", "winter", "fall"],
      feb: ["feb", "feb-mar", "f/m", "winter"],
      mar: ["feb", "feb-mar", "f/m", "winter"],
      jan: ["jan", "january", "winter"],
    };

    // Function to search the file structure recursively
    const searchRecursively = (node, path = "", breadcrumb = []) => {
      Object.keys(node).forEach((key) => {
        const currentPath = path ? `${path}/${key}` : key;
        const currentBreadcrumb = [...breadcrumb, key];
        const keyLower = key.toLowerCase();

        // Check if this is a paper object
        if (node[key] && typeof node[key] === "object" && node[key].qp) {
          const paper = node[key];
          const paperName = (paper.name || key).toLowerCase();

          // Check for year match in paper name
          const paperYearMatch = paperName.match(yearPattern);
          const paperYear = paperYearMatch ? paperYearMatch[0] : "";

          // Extract month/session
          let paperSession = "";
          for (const session in sessionKeywords) {
            if (sessionKeywords[session].some((kw) => paperName.includes(kw))) {
              paperSession = session;
              break;
            }
          }

          // Check for subject match in breadcrumb
          let subjectMatch = false;
          for (const subject in subjectAliases) {
            if (
              breadcrumb.some(
                (crumb) =>
                  crumb.toLowerCase().includes(subject) ||
                  subjectAliases[subject].some((alias) =>
                    crumb.toLowerCase().includes(alias)
                  )
              )
            ) {
              subjectMatch = true;
              break;
            }
          }

          // Add to results if any search term matches
          if (
            (searchYear && paperYear.includes(searchYear)) ||
            paperName.includes(query) ||
            currentBreadcrumb.some((crumb) =>
              crumb.toLowerCase().includes(query)
            ) ||
            (subjectMatch && (searchYear || paperSession))
          ) {
            results.push({
              paper,
              path: currentPath,
              breadcrumb: currentBreadcrumb,
            });
          }
        }
        // If this is an array of papers
        else if (Array.isArray(node[key])) {
          node[key].forEach((paper, index) => {
            const paperName = (paper.name || "").toLowerCase();
            const paperPath = `${currentPath}/${paper.name}`;

            // Check for year match in paper name
            const paperYearMatch = paperName.match(yearPattern);
            const paperYear = paperYearMatch ? paperYearMatch[0] : "";

            // Extract month/session
            let paperSession = "";
            for (const session in sessionKeywords) {
              if (
                sessionKeywords[session].some((kw) => paperName.includes(kw))
              ) {
                paperSession = session;
                break;
              }
            }

            if (
              (searchYear && paperYear.includes(searchYear)) ||
              paperName.includes(query) ||
              currentBreadcrumb.some((crumb) =>
                crumb.toLowerCase().includes(query)
              )
            ) {
              results.push({
                paper,
                path: paperPath,
                breadcrumb: [...currentBreadcrumb, paper.name],
              });
            }
          });
        }
        // If this is a folder/category, search within it
        else if (typeof node[key] === "object") {
          searchRecursively(node[key], currentPath, currentBreadcrumb);
        }
      });
    };

    searchRecursively(fileStructure);
    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, fileStructure]);

  // Fetch user mock exams
  useEffect(() => {
    const fetchUserMocks = async () => {
      if (!user?.email) {
        setCompletedMocks([]);
        setUserGoals([]);
        setIsLoadingMocks(false);
        return;
      }

      setIsLoadingMocks(true);
      try {
        // Fetch completed mocks
        const mocks = await getUserCompletedMocks(user.email);
        setCompletedMocks(mocks);

        // Fetch user goals
        const goals = await getUserGoals(user.email);
        setUserGoals(goals);
      } catch (error) {
        console.error("Error fetching user mocks or goals:", error);
      } finally {
        setIsLoadingMocks(false);
      }
    };

    fetchUserMocks();
  }, [user?.email]);

  // Helper function to check if a paper has been completed as a mock
  const isPaperCompleted = (paperPath) => {
    return completedMocks.some((mock) => mock.rawPath === paperPath);
  };

  // Helper function to get mock score for a paper if available
  const getPaperScore = (paperPath) => {
    const mock = completedMocks.find((mock) => {
      // Normalize paths for comparison
      const normalizedMockPath = (mock.rawPath || "")
        .replace(/^\/+/, "")
        .replace(/\/+/g, "/")
        .trim();

      const normalizedPaperPath = (paperPath || "")
        .replace(/^\/+/, "")
        .replace(/\/+/g, "/")
        .trim();

      return normalizedMockPath === normalizedPaperPath;
    });

    // Return the score or 0 if not available
    return mock?.score !== undefined ? mock.score : 0;
  };

  // Helper function to check if a paper is in user goals
  const isPaperInGoals = (paperPath) => {
    return userGoals.some((goal) => goal.path === paperPath);
  };

  // Helper function to get goal status
  const getGoalStatus = (paperPath) => {
    const goal = userGoals.find((goal) => goal.path === paperPath);
    return goal?.completed ? "completed" : "pending";
  };

  const toggleExpand = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const updateBreadcrumbs = (file, path) => {
    const pathParts = path.split("/");
    const breadcrumbs = [];
    let currentPath = "";

    for (let i = 0; i < pathParts.length; i++) {
      currentPath = currentPath
        ? `${currentPath}/${pathParts[i]}`
        : pathParts[i];
      if (i === pathParts.length - 1) {
        breadcrumbs.push({
          name: file.name || pathParts[i],
          path: currentPath,
        });
      } else {
        breadcrumbs.push({
          name: pathParts[i],
          path: currentPath,
        });
      }
    }

    return breadcrumbs;
  };

  const handleFileSelection = (file, path) => {
    // Debug log to see the file structure
    console.log("FileNavigator - handleFileSelection:", {
      file: file,
      path: path,
      fileKeys: Object.keys(file),
      qpUrl: file.qp ? file.qp.substring(0, 50) + "..." : "No QP URL",
    });

    // Add path to file object if not present
    const fileWithPath = {
      ...file,
      path: path, // Ensure path is included with the file
    };

    // Create breadcrumbs
    const breadcrumbs = updateBreadcrumbs(fileWithPath, path);

    // Call the parent component's onFileSelect function with updated file
    onFileSelect(fileWithPath, path, breadcrumbs);

    if (isMobile) {
      closeModal();
    }
  };

  // Use filtered structure if filtering is enabled, otherwise use the original
  const structureToRender =
    isFiltering && filteredStructure ? filteredStructure : fileStructure;

  // Add selected papers to goals
  const addSelectedPapersToGoals = async () => {
    if (!user?.email) {
      alert("You must be logged in to add papers to goals");
      return;
    }

    if (selectedPapers.length === 0) {
      alert("Please select at least one paper to add to goals");
      return;
    }

    setIsAddingToGoals(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Default target date (7 days from now)
      const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (const paperInfo of selectedPapers) {
        if (isPaperInGoals(paperInfo.path)) {
          console.log(`Paper already in goals: ${paperInfo.path}`);
          errorCount++;
          continue;
        }

        try {
          const goalPaper = {
            name: paperInfo.name,
            path: paperInfo.path,
            subject: extractSubjectFromPath(paperInfo.path),
            year: extractYearFromPath(paperInfo.path),
            session: extractSessionFromPath(paperInfo.path),
            examBoard: extractExamBoardFromPath(paperInfo.path),
            qp: paperInfo.qp || "",
            ms: paperInfo.ms || "",
            sp: paperInfo.sp || "",
            targetDate: targetDate,
          };

          const result = await addPaperGoal(user.email, goalPaper);
          if (result) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Error adding paper ${paperInfo.path}:`, err);
          errorCount++;
        }
      }

      // Update goals and status display
      setAddStatus({
        success: successCount,
        error: errorCount,
        show: true,
      });

      // Refetch goals to update UI
      const goals = await getUserGoals(user.email);
      setUserGoals(goals);

      // Clear selection after adding
      setSelectedPapers([]);

      // Hide status after a delay
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, show: false }));
      }, 5000);
    } catch (error) {
      console.error("Error adding papers to goals:", error);
      alert(`Error adding papers to goals: ${error.message}`);
    } finally {
      setIsAddingToGoals(false);
    }
  };

  // Helper functions to extract metadata from paper path
  const extractSubjectFromPath = (path) => {
    if (!path) return "Unknown Subject";
    const parts = path.split("/");
    return parts.length > 1 ? parts[1] : "Unknown Subject";
  };

  const extractYearFromPath = (path) => {
    if (!path) return null;
    const parts = path.split("/");
    for (const part of parts) {
      if (/^20\d{2}$/.test(part)) {
        return parseInt(part);
      }
    }
    return null;
  };

  const extractSessionFromPath = (path) => {
    if (!path) return "Unknown";
    const parts = path.split("/");
    const sessionParts = ["may", "june", "oct", "nov", "feb", "mar", "jan"];
    for (const part of parts) {
      const lower = part.toLowerCase();
      for (const session of sessionParts) {
        if (lower.includes(session)) {
          return part;
        }
      }
    }
    return "Unknown";
  };

  const extractExamBoardFromPath = (path) => {
    if (!path) return "Unknown";
    const parts = path.split("/");
    return parts.length > 0 ? parts[0] : "Unknown";
  };

  // Toggle paper selection - only for logged in users
  const togglePaperSelection = (e, paperInfo) => {
    e.stopPropagation();

    // Don't allow selection if not logged in
    if (!user) {
      console.log("User must be logged in to select papers");
      alert("Please sign in to use the batch selection feature");
      return;
    }

    // Don't allow selection of papers already in goals
    if (isPaperInGoals(paperInfo.path)) {
      console.log(`Cannot select paper already in goals: ${paperInfo.path}`);
      return;
    }

    setSelectedPapers((prev) => {
      const isSelected = prev.some((p) => p.path === paperInfo.path);
      if (isSelected) {
        return prev.filter((p) => p.path !== paperInfo.path);
      } else {
        return [...prev, paperInfo];
      }
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedPapers([]);
  };

  // Helper function to detect session folders
  const isSessionFolder = (key) => {
    const keyLower = key.toLowerCase();
    const sessionKeywords = [
      "may-june",
      "m/j",
      "may june",
      "may",
      "june",
      "oct-nov",
      "o/n",
      "oct nov",
      "oct",
      "nov",
      "feb-mar",
      "f/m",
      "feb mar",
      "feb",
      "mar",
      "jan",
      "january",
      "winter",
      "summer",
      "fall",
    ];

    return sessionKeywords.some((keyword) => keyLower.includes(keyword));
  };

  // Helper function to check if year folder has selected papers
  const hasSelectedPapersInYear = (yearPath, yearNode) => {
    // Initialize result
    let hasSelected = false;

    // Recursive function to check for selected papers
    const checkForSelectedPapers = (node, path) => {
      Object.keys(node).forEach((key) => {
        const currentPath = `${path}/${key}`;

        // If it's a paper array
        if (Array.isArray(node[key])) {
          node[key].forEach((paper) => {
            const paperPath = `${currentPath}/${paper.name}`;
            if (selectedPapers.some((p) => p.path === paperPath)) {
              hasSelected = true;
            }
          });
        }
        // If it's a leaf node (direct paper)
        else if (node[key] && typeof node[key] === "object" && node[key].qp) {
          if (selectedPapers.some((p) => p.path === currentPath)) {
            hasSelected = true;
          }
        }
        // If it's a subfolder, recurse
        else if (node[key] && typeof node[key] === "object") {
          checkForSelectedPapers(node[key], currentPath);
        }
      });
    };

    // Start the recursive check
    checkForSelectedPapers(yearNode, yearPath);

    return hasSelected;
  };

  // Toggle selection of all papers in a year folder - only for logged in users
  const toggleYearSelection = (e, folderPath, node) => {
    e.stopPropagation();

    // Don't allow selection if not logged in
    if (!user) {
      console.log("User must be logged in to select papers");
      alert("Please sign in to use the batch selection feature");
      return;
    }

    // Get all papers in this folder recursively
    const papersInFolder = [];

    // Recursive function to collect all papers
    const collectPapers = (currentNode, currentPath) => {
      Object.keys(currentNode).forEach((key) => {
        const nextPath = `${currentPath}/${key}`;

        // If it's a paper array
        if (Array.isArray(currentNode[key])) {
          currentNode[key].forEach((paper) => {
            const paperPath = `${nextPath}/${paper.name}`;
            // Only add papers that aren't already in goals
            if (!isPaperInGoals(paperPath)) {
              papersInFolder.push({
                ...paper,
                path: paperPath,
              });
            }
          });
        }
        // If it's a leaf node (direct paper)
        else if (
          currentNode[key] &&
          typeof currentNode[key] === "object" &&
          currentNode[key].qp
        ) {
          // Only add papers that aren't already in goals
          if (!isPaperInGoals(nextPath)) {
            papersInFolder.push({
              ...currentNode[key],
              path: nextPath,
            });
          }
        }
        // If it's a subfolder (like session folders), recurse
        else if (currentNode[key] && typeof currentNode[key] === "object") {
          collectPapers(currentNode[key], nextPath);
        }
      });
    };

    // Start collecting papers from all subfolders
    collectPapers(node, folderPath);

    console.log(
      `Found ${papersInFolder.length} papers in folder ${folderPath}`
    );

    // Check if all selectable papers are already selected
    const allSelected =
      papersInFolder.length > 0 &&
      papersInFolder.every((paper) =>
        selectedPapers.some((p) => p.path === paper.path)
      );

    // Check if some papers are selected
    const someSelected = papersInFolder.some((paper) =>
      selectedPapers.some((p) => p.path === paper.path)
    );

    // If all are selected, deselect all. If some or none are selected, select all.
    if (allSelected) {
      // Deselect all papers in the folder
      setSelectedPapers((prev) =>
        prev.filter(
          (p) => !papersInFolder.some((paper) => paper.path === p.path)
        )
      );
      console.log(`Deselected all papers in folder ${folderPath}`);
    } else {
      // Select all papers that aren't already selected
      setSelectedPapers((prev) => {
        const newSelectedPapers = [...prev];

        papersInFolder.forEach((paper) => {
          if (!newSelectedPapers.some((p) => p.path === paper.path)) {
            newSelectedPapers.push(paper);
          }
        });

        console.log(
          `Selected ${
            papersInFolder.length - (someSelected ? prev.length : 0)
          } new papers in folder ${folderPath}`
        );
        return newSelectedPapers;
      });
    }
  };

  // Toggle selection of all papers in a session folder - only for logged in users
  const toggleSessionSelection = (e, folderPath, node) => {
    e.stopPropagation();

    // Don't allow selection if not logged in
    if (!user) {
      console.log("User must be logged in to select papers");
      alert("Please sign in to use the batch selection feature");
      return;
    }

    // Get all papers in this session folder
    const papersInFolder = [];

    // Recursive function to collect papers, but only one level deep for sessions
    const collectPapers = (currentNode, currentPath) => {
      Object.keys(currentNode).forEach((key) => {
        const nextPath = `${currentPath}/${key}`;

        // If it's a paper array
        if (Array.isArray(currentNode[key])) {
          currentNode[key].forEach((paper) => {
            const paperPath = `${nextPath}/${paper.name}`;
            // Only add papers that aren't already in goals
            if (!isPaperInGoals(paperPath)) {
              papersInFolder.push({
                ...paper,
                path: paperPath,
              });
            }
          });
        }
        // If it's a leaf node (direct paper)
        else if (
          currentNode[key] &&
          typeof currentNode[key] === "object" &&
          currentNode[key].qp
        ) {
          // Only add papers that aren't already in goals
          if (!isPaperInGoals(nextPath)) {
            papersInFolder.push({
              ...currentNode[key],
              path: nextPath,
            });
          }
        }
      });
    };

    // Start collecting papers
    collectPapers(node, folderPath);

    console.log(
      `Found ${papersInFolder.length} papers in session folder ${folderPath}`
    );

    // Check if all selectable papers are already selected
    const allSelected =
      papersInFolder.length > 0 &&
      papersInFolder.every((paper) =>
        selectedPapers.some((p) => p.path === paper.path)
      );

    // Check if some papers are selected
    const someSelected = papersInFolder.some((paper) =>
      selectedPapers.some((p) => p.path === paper.path)
    );

    // If all are selected, deselect all. If some or none are selected, select all.
    if (allSelected) {
      // Deselect all papers in the folder
      setSelectedPapers((prev) =>
        prev.filter(
          (p) => !papersInFolder.some((paper) => paper.path === p.path)
        )
      );
      console.log(`Deselected all papers in session ${folderPath}`);
    } else {
      // Select all papers that aren't already selected
      setSelectedPapers((prev) => {
        const newSelectedPapers = [...prev];

        papersInFolder.forEach((paper) => {
          if (!newSelectedPapers.some((p) => p.path === paper.path)) {
            newSelectedPapers.push(paper);
          }
        });

        console.log(
          `Selected ${
            papersInFolder.length - (someSelected ? prev.length : 0)
          } new papers in session ${folderPath}`
        );
        return newSelectedPapers;
      });
    }
  };

  // Helper function to check if session folder has selected papers
  const hasSelectedPapersInSession = (sessionPath, sessionNode) => {
    // Initialize result
    let hasSelected = false;

    // Function to check for selected papers in this level only
    const checkForSelectedPapers = (node, path) => {
      Object.keys(node).forEach((key) => {
        const currentPath = `${path}/${key}`;

        // If it's a paper array
        if (Array.isArray(node[key])) {
          node[key].forEach((paper) => {
            const paperPath = `${currentPath}/${paper.name}`;
            if (selectedPapers.some((p) => p.path === paperPath)) {
              hasSelected = true;
            }
          });
        }
        // If it's a leaf node (direct paper)
        else if (node[key] && typeof node[key] === "object" && node[key].qp) {
          if (selectedPapers.some((p) => p.path === currentPath)) {
            hasSelected = true;
          }
        }
      });
    };

    // Check papers in this session folder
    checkForSelectedPapers(sessionNode, sessionPath);

    return hasSelected;
  };

  // Helper function to check if all papers in a year folder are already in goals
  const areAllPapersInYearInGoals = (yearPath, yearNode) => {
    // To track all papers and if they're in goals
    let totalPapers = 0;
    let papersInGoals = 0;

    // Recursive function to check all papers
    const checkPapersInGoals = (node, path) => {
      Object.keys(node).forEach((key) => {
        const currentPath = `${path}/${key}`;

        // If it's a paper array
        if (Array.isArray(node[key])) {
          node[key].forEach((paper) => {
            const paperPath = `${currentPath}/${paper.name}`;
            totalPapers++;
            if (isPaperInGoals(paperPath)) {
              papersInGoals++;
            }
          });
        }
        // If it's a leaf node (direct paper)
        else if (node[key] && typeof node[key] === "object" && node[key].qp) {
          totalPapers++;
          if (isPaperInGoals(currentPath)) {
            papersInGoals++;
          }
        }
        // If it's a subfolder, recurse
        else if (node[key] && typeof node[key] === "object") {
          checkPapersInGoals(node[key], currentPath);
        }
      });
    };

    // Start the recursive check
    checkPapersInGoals(yearNode, yearPath);

    // Return true if all papers are in goals and there are papers
    return totalPapers > 0 && totalPapers === papersInGoals;
  };

  // Helper function to check if all papers in a session folder are already in goals
  const areAllPapersInSessionInGoals = (sessionPath, sessionNode) => {
    // To track all papers and if they're in goals
    let totalPapers = 0;
    let papersInGoals = 0;

    // Function to check papers in this level only
    const checkPapersInGoals = (node, path) => {
      Object.keys(node).forEach((key) => {
        const currentPath = `${path}/${key}`;

        // If it's a paper array
        if (Array.isArray(node[key])) {
          node[key].forEach((paper) => {
            const paperPath = `${currentPath}/${paper.name}`;
            totalPapers++;
            if (isPaperInGoals(paperPath)) {
              papersInGoals++;
            }
          });
        }
        // If it's a leaf node (direct paper)
        else if (node[key] && typeof node[key] === "object" && node[key].qp) {
          totalPapers++;
          if (isPaperInGoals(currentPath)) {
            papersInGoals++;
          }
        }
      });
    };

    // Check papers in this session folder
    checkPapersInGoals(sessionNode, sessionPath);

    // Return true if all papers are in goals and there are papers
    return totalPapers > 0 && totalPapers === papersInGoals;
  };

  // Function to get the appropriate icon for different subjects/folder types
  const getIcon = (key, currentPath) => {
    const keyLower = key.toLowerCase();

    // Special case for IGCSE and IAL folders - show yellow folder icons
    if (key === "IGCSE" || key === "IAL") {
      return expanded[currentPath] ? (
        <FolderOpen
          size={18}
          className="mr-1.5 flex-shrink-0 text-yellow-400"
        />
      ) : (
        <Folder size={18} className="mr-1.5 flex-shrink-0 text-yellow-400" />
      );
    }

    // Special case for Mathematics under IAL
    if (keyLower === "mathematics" && currentPath.includes("IAL")) {
      return (
        <Radical size={16} className="mr-1.5 flex-shrink-0 text-blue-400" />
      );
    }

    if (keyLower.includes("chemistry")) {
      return (
        <FlaskConical
          size={16}
          className="mr-1.5 flex-shrink-0 text-green-400"
        />
      );
    }
    if (keyLower.includes("physics")) {
      return (
        <Magnet size={16} className="mr-1.5 flex-shrink-0 text-purple-400" />
      );
    }
    if (keyLower === "mathematics a" || keyLower.includes("maths a")) {
      return (
        <Calculator size={16} className="mr-1.5 flex-shrink-0 text-blue-400" />
      );
    }
    if (keyLower === "mathematics b" || keyLower.includes("maths b")) {
      return <Cone size={16} className="mr-1.5 flex-shrink-0 text-cyan-400" />;
    }
    if (
      keyLower.includes("further pure mathematics") ||
      keyLower.includes("further pure maths")
    ) {
      return (
        <SquareSigma size={16} className="mr-1.5 flex-shrink-0 text-pink-400" />
      );
    }
    if (
      keyLower.includes("pure maths") ||
      keyLower.includes("further mathematics")
    ) {
      return (
        <SquareSigma
          size={16}
          className="mr-1.5 flex-shrink-0 text-indigo-400"
        />
      );
    }

    // Default folder icons
    return expanded[currentPath] ? (
      <ChevronDown size={16} className="mr-1.5 flex-shrink-0 text-blue-300" />
    ) : (
      <ChevronRight size={16} className="mr-1.5 flex-shrink-0 text-gray-400" />
    );
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
            className={`pl-4 py-2 text-sm cursor-pointer hover:bg-gray-700/40 transition-all select-none rounded-md my-0.5 ${
              activePath === currentPath
                ? "bg-blue-900/40 text-blue-300 border-l-2 border-blue-400"
                : "border-l border-transparent"
            } ${examMode ? "opacity-50 pointer-events-none" : ""} ${
              isSelected ? "bg-indigo-900/30" : ""
            }`}
            onClick={() => {
              if (!examMode) {
                handleFileSelection(node[key], currentPath);
              }
            }}
          >
            <div className="flex items-center">
              {/* Only show checkbox if user is logged in and paper is not already in goals */}
              {!isGoal && user && (
                <div
                  className="mr-2 p-1"
                  onClick={(e) =>
                    togglePaperSelection(e, { ...node[key], path: currentPath })
                  }
                >
                  <div
                    className={`w-4 h-4 flex items-center justify-center rounded border ${
                      isSelected
                        ? "bg-blue-500 border-blue-600"
                        : "border-gray-600 bg-gray-800"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </div>
              )}
              {/* Add left margin if no checkbox is shown */}
              {isGoal && <div className="w-6 mr-2"></div>}
              <FileText
                size={16}
                className="mr-2 flex-shrink-0 text-gray-400"
              />
              <span className="truncate">{node[key].name || key}</span>

              {/* Display completion indicator with score-based styling */}
              {isCompleted && (
                <div
                  className="ml-1.5 flex items-center"
                  title={`Mock completed with score: ${Math.round(score)}%`}
                >
                  <span
                    className={`text-xs ml-1 px-1.5 py-0.5 rounded ${
                      score >= 70
                        ? "bg-green-900/40 text-green-400 border border-green-700/50"
                        : score >= 40
                        ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50"
                        : "bg-red-900/40 text-red-400 border border-red-700/50"
                    }`}
                  >
                    {Math.round(score)}%
                  </span>
                </div>
              )}

              {/* Display goal indicator with proper icon */}
              {isGoal && !isCompleted && (
                <div
                  className="ml-1.5 flex items-center group relative"
                  title="This paper is in your study goals - click to view your dashboard"
                >
                  <Target size={14} className="text-blue-400" />
                  <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                    In Study Goals
                  </span>
                </div>
              )}
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
          <div key={currentPath} className="ml-4 border-l border-gray-700/50">
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
                  className={`pl-4 py-2 text-sm cursor-pointer hover:bg-gray-700/40 transition-all select-none rounded-md my-0.5 ${
                    activePath === paperPath
                      ? "bg-blue-900/40 text-blue-300 border-l-2 border-blue-400"
                      : "border-l border-transparent"
                  } ${examMode ? "opacity-50 pointer-events-none" : ""} ${
                    isSelected ? "bg-indigo-900/30" : ""
                  }`}
                  onClick={() => {
                    if (!examMode) {
                      handleFileSelection(paper, paperPath);
                    }
                  }}
                >
                  <div className="flex items-center">
                    {/* Only show checkbox if user is logged in and paper is not already in goals */}
                    {!isGoal && user && (
                      <div
                        className="mr-2 p-1"
                        onClick={(e) =>
                          togglePaperSelection(e, { ...paper, path: paperPath })
                        }
                      >
                        <div
                          className={`w-4 h-4 flex items-center justify-center rounded border ${
                            isSelected
                              ? "bg-blue-500 border-blue-600"
                              : "border-gray-600 bg-gray-800"
                          }`}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                    )}
                    {/* Add left margin if no checkbox is shown */}
                    {isGoal && <div className="w-6 mr-2"></div>}
                    <FileText
                      size={16}
                      className="mr-2 flex-shrink-0 text-gray-400"
                    />
                    <span className="truncate">{paper.name}</span>

                    {/* Display completion indicator with score-based styling */}
                    {isCompleted && (
                      <div
                        className="ml-1.5 flex items-center"
                        title={`Mock completed with score: ${Math.round(
                          score
                        )}%`}
                      >
                        <span
                          className={`text-xs ml-1 px-1.5 py-0.5 rounded ${
                            score >= 70
                              ? "bg-green-900/40 text-green-400 border border-green-700/50"
                              : score >= 40
                              ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50"
                              : "bg-red-900/40 text-red-400 border border-red-700/50"
                          }`}
                        >
                          {Math.round(score)}%
                        </span>
                      </div>
                    )}

                    {/* Display paper has SpecimenPaper icon */}
                    {paper.sp && (
                      <Star
                        size={14}
                        className="ml-1.5 text-yellow-400"
                        fill="currentColor"
                      />
                    )}

                    {/* Display goal indicator with proper icon */}
                    {isGoal && !isCompleted && (
                      <div
                        className="ml-1.5 flex items-center group relative"
                        title="This paper is in your study goals - click to view your dashboard"
                      >
                        <Target size={14} className="text-blue-400" />
                        <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                          In Study Goals
                        </span>
                      </div>
                    )}
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
            className={`px-3 py-2 cursor-pointer hover:bg-gray-700/40 rounded-md transition-colors flex items-center select-none ${
              isActive ? "text-blue-300" : "text-gray-200"
            } ${examMode ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => {
              if (!examMode) {
                toggleExpand(currentPath);
              }
            }}
          >
            {/* Add checkbox or goal icon for year folders (likely 4-digit year) */}
            {!examMode && user && key.match(/^20\d{2}$/) && (
              <>
                {areAllPapersInYearInGoals(currentPath, node[key]) ? (
                  <div className="mr-2 p-1 flex items-center group relative">
                    <Target size={14} className="text-blue-400" />
                    <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                      All papers in goals
                    </span>
                  </div>
                ) : (
                  <div
                    className="mr-2 p-1"
                    onClick={(e) =>
                      toggleYearSelection(e, currentPath, node[key])
                    }
                  >
                    <div
                      className={`w-4 h-4 flex items-center justify-center rounded border ${
                        hasSelectedPapersInYear(currentPath, node[key])
                          ? "bg-blue-500 border-blue-600"
                          : "border-gray-600 bg-gray-800 hover:border-blue-400"
                      }`}
                    >
                      {hasSelectedPapersInYear(currentPath, node[key]) && (
                        <Check size={12} className="text-white" />
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
                    <div className="mr-2 p-1 flex items-center group relative">
                      <Target size={14} className="text-blue-400" />
                      <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                        All papers in goals
                      </span>
                    </div>
                  ) : (
                    <div
                      className="mr-2 p-1"
                      onClick={(e) =>
                        toggleSessionSelection(e, currentPath, node[key])
                      }
                    >
                      <div
                        className={`w-4 h-4 flex items-center justify-center rounded border ${
                          hasSelectedPapersInSession(currentPath, node[key])
                            ? "bg-blue-500 border-blue-600"
                            : "border-gray-600 bg-gray-800 hover:border-blue-400"
                        }`}
                      >
                        {hasSelectedPapersInSession(currentPath, node[key]) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            {getIcon(key, currentPath)}
            <span className="truncate font-medium">{key}</span>
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
        <div className="text-center py-6 text-gray-400">
          <FileQuestion size={24} className="mx-auto mb-2 text-gray-500" />
          <p className="text-sm">No papers found matching '{searchQuery}'</p>
        </div>
      );
    }

    return (
      <div className="space-y-1 p-2">
        <h3 className="text-xs uppercase text-blue-400 font-semibold mb-2 tracking-wider px-2">
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
              className={`flex items-start p-2 hover:bg-gray-700/50 rounded-md cursor-pointer ${
                isSelected ? "bg-indigo-900/30" : ""
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
            >
              {/* Only show checkbox if user is logged in and paper is not already in goals */}
              {!isGoal && user && (
                <div
                  className="mt-0.5 mr-2 p-1"
                  onClick={(e) =>
                    togglePaperSelection(e, {
                      ...result.paper,
                      path: result.path,
                    })
                  }
                >
                  <div
                    className={`w-4 h-4 flex items-center justify-center rounded border ${
                      isSelected
                        ? "bg-blue-500 border-blue-600"
                        : "border-gray-600 bg-gray-800"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </div>
              )}
              {/* Add left margin if no checkbox is shown */}
              {isGoal && <div className="w-6 mr-2"></div>}

              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <FileText
                    size={14}
                    className="text-gray-400 flex-shrink-0 mr-1.5"
                  />
                  <span className="text-sm font-medium truncate">
                    {result.paper.name}
                  </span>

                  {/* Display completion indicator with score-based styling */}
                  {isCompleted && (
                    <div
                      className="ml-1.5 flex items-center"
                      title={`Mock completed with score: ${Math.round(score)}%`}
                    >
                      <span
                        className={`text-xs ml-1 px-1.5 py-0.5 rounded ${
                          score >= 70
                            ? "bg-green-900/40 text-green-400 border border-green-700/50"
                            : score >= 40
                            ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50"
                            : "bg-red-900/40 text-red-400 border border-red-700/50"
                        }`}
                      >
                        {Math.round(score)}%
                      </span>
                    </div>
                  )}

                  {/* Display goal indicator with proper icon */}
                  {isGoal && !isCompleted && (
                    <div
                      className="ml-1.5 flex items-center group relative"
                      title="This paper is in your study goals - click to view your dashboard"
                    >
                      <Target size={14} className="text-blue-400" />
                      <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                        In Study Goals
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {pathLabel}
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
    <div className={`flex flex-col h-full ${isMobile ? "pt-12" : ""}`}>
      {/* Search and filter controls */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/60">
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Subject filtering toggle */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
          <button
            onClick={toggleFilter}
            className={`flex items-center px-3 py-1.5 rounded border ${
              isFiltering
                ? "text-blue-300 border-blue-500 bg-blue-900/20"
                : "text-gray-300 border-gray-600 hover:bg-gray-700"
            }`}
          >
            {isFiltering ? (
              <FilterX size={14} className="mr-1.5" />
            ) : (
              <Star size={14} className="mr-1.5" />
            )}
            {isFiltering ? "Show All" : "My Subjects"}
          </button>

          {/* Selection actions buttons */}
          {!examMode && user && (
            <div className="flex space-x-1">
              {selectedPapers.length > 0 && (
                <>
                  <button
                    onClick={clearSelections}
                    className="px-2 py-1 text-xs rounded border border-gray-600 hover:bg-gray-700"
                    title="Clear selections"
                  >
                    Clear ({selectedPapers.length})
                  </button>
                  <button
                    onClick={addSelectedPapersToGoals}
                    disabled={isAddingToGoals || selectedPapers.length === 0}
                    className={`px-2 py-1 text-xs rounded border ${
                      isAddingToGoals
                        ? "bg-blue-800/50 border-blue-700 text-blue-300"
                        : addStatus.show && addStatus.success > 0
                        ? "bg-green-800/50 border-green-700 text-green-300"
                        : "border-gray-600 hover:bg-gray-700"
                    } flex items-center transition-colors duration-200`}
                  >
                    {isAddingToGoals ? (
                      <>
                        <span className="animate-pulse mr-1">
                          Processing...
                        </span>
                      </>
                    ) : addStatus.show && addStatus.success > 0 ? (
                      <>
                        <CheckCircle2 size={12} className="mr-1" />
                        Added {addStatus.success} paper
                        {addStatus.success !== 1 ? "s" : ""}
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
