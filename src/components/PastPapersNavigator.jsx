import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  FileText,
  Menu,
  Home,
  BookOpen,
  CheckCircle,
  Calendar,
  Search,
  X,
  Download,
  Folder,
  FolderOpen,
  FlaskConical,
  Magnet,
  Calculator,
  Cone,
  SquareSigma,
  ChartSpline,
  Star,
  Clock,
  Lock,
  AlertTriangle,
  Maximize,
  Minimize,
} from "lucide-react";
import fileStructure from "../data/fileStructure.json";
import Timer from "./Timer";
import { getPaperDuration } from "../data/examDurations";
import "../animations.css";

// PDF Viewer Component
function PDFViewer({ file, title }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl flex-1 h-full">
      <iframe
        src={file}
        title={title}
        className="w-full h-full rounded-lg"
        allow="autoplay"
        allowFullScreen
        scrolling="yes"
        style={{ minHeight: "100%", minWidth: "100%" }}
      />
    </div>
  );
}

export default function PastPapersNavigator() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [expanded, setExpanded] = useState({
    IAL: true,
    IGCSE: true,
  });
  const [activeTab, setActiveTab] = useState("qp");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [activePath, setActivePath] = useState("");
  const [timerDuration, setTimerDuration] = useState(90); // Default duration
  const [showTimer, setShowTimer] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [originalTab, setOriginalTab] = useState("qp");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitFullscreenModal, setShowExitFullscreenModal] = useState(false);
  const examContainerRef = useRef(null);
  const userInitiatedExitRef = useRef(false);

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

  // Custom sorting function for mathematics papers
  const sortMathematicsPapers = (papers) => {
    return [...papers].sort((a, b) => {
      const aOrder = paperOrder[a.name] || 999;
      const bOrder = paperOrder[b.name] || 999;
      return aOrder - bOrder;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call once on mount to set initial state

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update timer duration when a new file is selected
  useEffect(() => {
    if (selectedFile) {
      const pathParts = activePath.split("/");
      const duration = getPaperDuration(activePath, selectedFile.name);
      setTimerDuration(duration);
      setShowTimer(true);
    } else {
      setShowTimer(false);
    }
  }, [selectedFile, activePath]);

  const toggleExpand = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const toggleSidebar = () => {
    if (examMode) {
      alert("Sidebar is locked during exam mode.");
      return;
    }
    setSidebarExpanded((prev) => !prev);
  };

  const openModal = () => {
    if (examMode) {
      alert("Navigation is locked during exam mode.");
      return;
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSearch = () => {
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

    // Subject aliases and abbreviations
    const subjectAliases = {
      chemistry: ["chem", "chm"],
      physics: ["phy", "phys"],
      biology: ["bio"],
      mathematics: ["math", "maths", "mathematics a", "mathematics b"],
      "mathematics a": ["math a", "maths a"],
      "mathematics b": ["math b", "maths b"],
      "further mathematics": [
        "further maths",
        "further math",
        "f math",
        "f maths",
        "pmaths",
        "pure maths",
      ],
      "computer science": ["cs", "comp sci", "computing"],
      "business studies": ["business", "bs"],
      economics: ["econ", "eco"],
      "english language": ["eng lang", "english"],
      "english literature": ["eng lit", "literature"],
      geography: ["geo"],
      accounting: ["acc", "acct"],
      psychology: ["psych"],
      "information technology": ["it", "ict"],
    };

    // Check if query contains paper number pattern (e.g., p1, paper 2)
    const paperPattern = /\b(p|paper)\s*([1-6])\b/i;
    const paperMatch = query.match(paperPattern);
    const searchPaper = paperMatch ? paperMatch[2] : null;

    const searchInTree = (node, path = "", breadcrumb = []) => {
      Object.keys(node).forEach((key) => {
        const newPath = path ? `${path}/${key}` : key;
        const newBreadcrumb = [...breadcrumb, key];
        const keyLower = key.toLowerCase();

        const isFolder =
          typeof node[key] === "object" && !Array.isArray(node[key]);

        // Calculate relevance score for this path segment
        let pathRelevance = 0;

        // Year matching
        if (searchYear) {
          // Full year (e.g., 2019)
          if (keyLower === searchYear) {
            pathRelevance += 10;
          }
          // Short year (e.g., 19 matching 2019)
          else if (searchYear.length === 2 && keyLower.includes(searchYear)) {
            pathRelevance += 5;
          }
        }

        // Session matching
        for (const [session, keywords] of Object.entries(sessionKeywords)) {
          if (keywords.some((keyword) => query.includes(keyword))) {
            if (keyLower.includes(session)) {
              pathRelevance += 8;
            }
          }
        }

        // Subject alias matching
        for (const [subject, aliases] of Object.entries(subjectAliases)) {
          // Check if query contains any of the aliases
          if (
            aliases.some((alias) => query.includes(alias.toLowerCase())) ||
            query.includes(subject.toLowerCase())
          ) {
            // Check if this key is the subject or contains the subject
            if (keyLower === subject || keyLower.includes(subject)) {
              pathRelevance += 12; // Higher score for subject matches
            }
          }
        }

        // Direct text matching
        if (keyLower.includes(query)) {
          pathRelevance += 3;
        }

        if (isFolder) {
          searchInTree(node[key], newPath, newBreadcrumb);
        } else {
          node[key].forEach((paper) => {
            let score = 0;
            const paperNameLower = paper.name.toLowerCase();
            const breadcrumbText = newBreadcrumb.join(" ").toLowerCase();

            // Paper number matching
            if (
              searchPaper &&
              paperNameLower.includes(`paper ${searchPaper}`)
            ) {
              score += 15;
            }

            // Direct matches in paper name
            if (paperNameLower.includes(query)) {
              score += 10;
            }

            // Partial matches in breadcrumb
            if (breadcrumbText.includes(query)) {
              score += 5;
            }

            // Add path relevance
            score += pathRelevance;

            // Fuzzy matching - check if all characters in query appear in sequence in the text
            const fuzzyMatch = (text, pattern) => {
              let textIndex = 0;
              for (let i = 0; i < pattern.length; i++) {
                const char = pattern[i];
                textIndex = text.indexOf(char, textIndex);
                if (textIndex === -1) return false;
                textIndex++;
              }
              return true;
            };

            if (
              score > 0 ||
              fuzzyMatch(paperNameLower, query) ||
              fuzzyMatch(breadcrumbText, query)
            ) {
              results.push({
                path: newPath,
                breadcrumb: newBreadcrumb,
                paper,
                score: score,
              });
            }
          });
        }
      });
    };

    searchInTree(fileStructure);

    // Sort results by score (highest first)
    results.sort((a, b) => b.score - a.score);

    setSearchResults(results);
    setIsSearching(false);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const updateBreadcrumbs = (paper, path) => {
    const parts = path.split("/").filter(Boolean);
    const breadcrumb = parts.map((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");
      return { name: part, path: currentPath };
    });
    setBreadcrumbs(breadcrumb);
    setActivePath(path);
  };

  // Handle exam mode change
  const handleExamModeChange = (isExamMode) => {
    console.log("Exam mode changed to:", isExamMode);
    setExamMode(isExamMode);

    if (isExamMode) {
      // Store the current tab before forcing to question paper
      setOriginalTab(activeTab);
      setActiveTab("qp");

      // Close sidebar on mobile
      if (isMobile && modalOpen) {
        closeModal();
      }

      // Force close sidebar on desktop
      setSidebarExpanded(false);

      // Request fullscreen immediately when exam mode is turned on
      setTimeout(() => {
        console.log("Attempting to enter fullscreen from exam mode change");
        if (examContainerRef.current) {
          try {
            if (examContainerRef.current.requestFullscreen) {
              examContainerRef.current.requestFullscreen();
            } else if (examContainerRef.current.webkitRequestFullscreen) {
              examContainerRef.current.webkitRequestFullscreen();
            } else if (examContainerRef.current.msRequestFullscreen) {
              examContainerRef.current.msRequestFullscreen();
            }
            setIsFullscreen(true);
          } catch (error) {
            console.error("Error entering fullscreen:", error);
          }
        }
      }, 300); // Short delay to ensure DOM is ready
    } else if (isExamMode === false) {
      // Only restore the original tab when explicitly turning off exam mode
      // Not when switching tabs
      setActiveTab(originalTab);
    }
  };

  // Modify the tab switching function to respect exam mode
  const handleTabChange = (tab) => {
    if (examMode && tab !== "qp") {
      // Show a message that this action is not allowed in exam mode
      alert("You cannot view mark schemes or solved papers during exam mode.");
      return;
    }

    // Check if the selected file has the requested resource
    if (
      (tab === "ms" && !selectedFile.ms) ||
      (tab === "sp" && !selectedFile.sp)
    ) {
      alert(
        `This paper does not have a ${
          tab === "ms" ? "mark scheme" : "solved paper"
        } available.`
      );
      return;
    }

    // Set the active tab without triggering exam mode change
    setActiveTab(tab);
  };

  // Modify the file selection function to respect exam mode
  const handleFileSelect = (file, path) => {
    if (examMode) {
      // Show a message that this action is not allowed in exam mode
      alert(
        "You cannot switch papers during exam mode. Please reset the timer first."
      );
      return;
    }

    setSelectedFile(file);
    updateBreadcrumbs(file, path);
    if (isMobile) {
      closeModal();
    }
  };

  const renderTree = (node, path = "") => {
    return Object.keys(node).map((key) => {
      const currentPath = path ? `${path}/${key}` : key;
      const isActive = activePath.includes(currentPath);
      const isLeaf = node[key].qp !== undefined;
      const isPapersArray = Array.isArray(node[key]);

      // Check if this is a top-level folder (IGCSE or IAL)
      const isTopLevel = key === "IGCSE" || key === "IAL";

      // Get appropriate icon based on folder name and path
      const getIcon = () => {
        const keyLower = key.toLowerCase();

        // Top level folders
        if (isTopLevel) {
          return expanded[currentPath] ? (
            <FolderOpen
              size={16}
              className="mr-1 flex-shrink-0 text-yellow-400"
            />
          ) : (
            <Folder size={16} className="mr-1 flex-shrink-0 text-yellow-400" />
          );
        }

        // IAL > Mathematics
        if (currentPath === "IAL/Mathematics") {
          return (
            <ChartSpline
              size={16}
              className="mr-1 flex-shrink-0 text-blue-400"
            />
          );
        }

        // Subject specific icons
        if (keyLower.includes("chemistry")) {
          return (
            <FlaskConical
              size={16}
              className="mr-1 flex-shrink-0 text-green-400"
            />
          );
        }
        if (keyLower.includes("physics")) {
          return (
            <Magnet size={16} className="mr-1 flex-shrink-0 text-purple-400" />
          );
        }
        if (keyLower === "mathematics a" || keyLower.includes("maths a")) {
          return (
            <Calculator
              size={16}
              className="mr-1 flex-shrink-0 text-blue-400"
            />
          );
        }
        if (keyLower === "mathematics b" || keyLower.includes("maths b")) {
          return (
            <Cone size={16} className="mr-1 flex-shrink-0 text-cyan-400" />
          );
        }
        if (
          keyLower.includes("further pure mathematics") ||
          keyLower.includes("further pure maths")
        ) {
          return (
            <SquareSigma
              size={16}
              className="mr-1 flex-shrink-0 text-pink-400"
            />
          );
        }
        if (
          keyLower.includes("pure maths") ||
          keyLower.includes("further mathematics")
        ) {
          return (
            <SquareSigma
              size={16}
              className="mr-1 flex-shrink-0 text-indigo-400"
            />
          );
        }

        // Default folder icons
        return expanded[currentPath] ? (
          <ChevronDown size={16} className="mr-1 flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="mr-1 flex-shrink-0" />
        );
      };

      if (isLeaf) {
        return (
          <div
            key={currentPath}
            className={`pl-8 py-1.5 text-sm cursor-pointer hover:bg-gray-700 transition-colors select-none ${
              activePath === currentPath ? "bg-blue-900/30 text-blue-300" : ""
            } ${examMode ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => {
              if (!examMode) {
                setSelectedFile(node[key]);
                updateBreadcrumbs(node[key], currentPath);
                if (isMobile) {
                  closeModal();
                }
              }
            }}
          >
            <div className="flex items-center">
              <FileText size={16} className="mr-2 flex-shrink-0" />
              <span className="truncate">{node[key].name || key}</span>
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
          <div key={currentPath} className="ml-4 border-l border-gray-700">
            {papersToRender.map((paper, index) => (
              <div
                key={`${currentPath}-${index}`}
                className={`pl-8 py-1.5 text-sm cursor-pointer hover:bg-gray-700 transition-colors select-none ${
                  selectedFile === paper ? "bg-blue-900/30 text-blue-300" : ""
                } ${examMode ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => {
                  if (!examMode) {
                    setSelectedFile(paper);
                    updateBreadcrumbs(paper, `${currentPath}/${paper.name}`);
                    if (isMobile) {
                      closeModal();
                    }
                  }
                }}
              >
                <div className="flex items-center">
                  <FileText size={16} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{paper.name}</span>
                  {paper.sp && (
                    <Star
                      size={14}
                      className="ml-1.5 text-yellow-400"
                      fill="currentColor"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div key={currentPath}>
          <div
            className={`flex items-center py-1.5 px-2 cursor-pointer hover:bg-gray-700 transition-colors select-none ${
              isActive ? "bg-blue-900/20 text-blue-200" : ""
            } ${examMode ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => {
              if (!examMode) {
                toggleExpand(currentPath);
              }
            }}
          >
            {getIcon()}
            <span className="truncate font-medium">{key}</span>
          </div>
          {expanded[currentPath] && (
            <div className="ml-4 border-l border-gray-700">
              {renderTree(node[key], currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          {searchQuery.trim() ? "No results found" : "Type to search"}
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {searchResults.map((result, index) => (
          <div
            key={index}
            className={`p-2 rounded-md cursor-pointer transition-colors ${
              selectedFile === result.paper
                ? "bg-blue-600/20 text-blue-400"
                : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
            }`}
            onClick={() => {
              setSelectedFile(result.paper);
              updateBreadcrumbs(result.paper, result.path);
              closeModal();
            }}
          >
            <div className="flex items-center">
              <FileText size={16} className="flex-shrink-0 mr-2" />
              <div>
                <div className="font-medium">{result.paper.name}</div>
                <div className="text-xs text-gray-400">
                  {result.breadcrumb.join(" > ")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Function to handle fullscreen button click
  const handleFullscreenButtonClick = (event) => {
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();

    console.log("Fullscreen button clicked with event handler");

    if (isFullscreen) {
      console.log("Currently in fullscreen, showing exit modal");
      setShowExitFullscreenModal(true);
    } else {
      console.log("Not in fullscreen, attempting to enter fullscreen");
      if (examContainerRef.current) {
        try {
          if (examContainerRef.current.requestFullscreen) {
            examContainerRef.current.requestFullscreen();
          } else if (examContainerRef.current.webkitRequestFullscreen) {
            examContainerRef.current.webkitRequestFullscreen();
          } else if (examContainerRef.current.msRequestFullscreen) {
            examContainerRef.current.msRequestFullscreen();
          }
          setIsFullscreen(true);
        } catch (error) {
          console.error("Error entering fullscreen:", error);
        }
      }
    }
  };

  // Toggle fullscreen function
  const toggleFullscreen = () => {
    console.log("Toggle fullscreen called, current state:", isFullscreen);

    const isCurrentlyFullscreen =
      !!document.fullscreenElement ||
      !!document.webkitFullscreenElement ||
      !!document.mozFullScreenElement ||
      !!document.msFullscreenElement;

    if (!isCurrentlyFullscreen) {
      // Enter fullscreen
      console.log("Attempting to enter fullscreen");
      if (examContainerRef.current) {
        try {
          if (examContainerRef.current.requestFullscreen) {
            examContainerRef.current.requestFullscreen();
          } else if (examContainerRef.current.webkitRequestFullscreen) {
            examContainerRef.current.webkitRequestFullscreen();
          } else if (examContainerRef.current.msRequestFullscreen) {
            examContainerRef.current.msRequestFullscreen();
          }
          setIsFullscreen(true);
          console.log("Entered fullscreen successfully");
        } catch (error) {
          console.error("Error entering fullscreen:", error);
        }
      }
    } else {
      // If in exam mode, show confirmation modal first
      if (examMode) {
        console.log("In exam mode, showing confirmation modal");
        setShowExitFullscreenModal(true);
        return;
      }

      // Exit fullscreen if not in exam mode
      console.log("Not in exam mode, exiting fullscreen directly");
      exitFullscreen();
    }
  };

  // Function to exit fullscreen
  const exitFullscreen = () => {
    console.log("Attempting to exit fullscreen");
    userInitiatedExitRef.current = true;

    try {
      // Actually exit fullscreen using the appropriate method
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      // Force update the state
      setIsFullscreen(false);
      console.log("Exited fullscreen successfully");
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      console.log("Fullscreen change detected");
      const isCurrentlyFullscreen =
        !!document.fullscreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.mozFullScreenElement ||
        !!document.msFullscreenElement;

      console.log("Is currently fullscreen:", isCurrentlyFullscreen);
      console.log("User initiated exit:", userInitiatedExitRef.current);

      // Update the state to match reality
      setIsFullscreen(isCurrentlyFullscreen);

      // If exiting fullscreen while in exam mode and not user initiated, show modal
      if (!isCurrentlyFullscreen && examMode && !userInitiatedExitRef.current) {
        console.log("Showing exit fullscreen modal");
        setShowExitFullscreenModal(true);

        // If we're in exam mode and the user pressed ESC (not user initiated through our UI),
        // try to re-enter fullscreen after a short delay
        if (examMode && !userInitiatedExitRef.current) {
          setTimeout(() => {
            if (
              !document.fullscreenElement &&
              examContainerRef.current &&
              !showExitFullscreenModal &&
              !userInitiatedExitRef.current // Don't re-enter if user explicitly chose to exit
            ) {
              console.log("Attempting to re-enter fullscreen");
              if (examContainerRef.current.requestFullscreen) {
                examContainerRef.current.requestFullscreen();
              } else if (examContainerRef.current.webkitRequestFullscreen) {
                examContainerRef.current.webkitRequestFullscreen();
              } else if (examContainerRef.current.msRequestFullscreen) {
                examContainerRef.current.msRequestFullscreen();
              }
              setIsFullscreen(true);
            }
          }, 300);
        }
      }

      // Reset the user initiated flag after a delay to ensure it's not reset too early
      if (userInitiatedExitRef.current) {
        setTimeout(() => {
          userInitiatedExitRef.current = false;
        }, 1000);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [examMode, showExitFullscreenModal]);

  // Add a separate effect to handle ESC key for the modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        console.log(
          "ESC key pressed, showExitFullscreenModal:",
          showExitFullscreenModal
        );

        if (examMode && isFullscreen) {
          if (showExitFullscreenModal) {
            // Second ESC press - exit fullscreen
            console.log("Second ESC press - exiting fullscreen");
            userInitiatedExitRef.current = true;
            setShowExitFullscreenModal(false);

            // Actually exit fullscreen
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            }

            setIsFullscreen(false);
          } else {
            // First ESC press - show modal
            console.log("First ESC press - showing modal");
            setShowExitFullscreenModal(true);

            // Prevent default behavior (which would exit fullscreen)
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    // Add event listener for ESC key
    document.addEventListener("keydown", handleEscKey, true);

    // Remove event listener when component unmounts
    return () => {
      document.removeEventListener("keydown", handleEscKey, true);
    };
  }, [examMode, isFullscreen, showExitFullscreenModal]);

  // Auto-enter fullscreen when exam mode is activated
  useEffect(() => {
    if (examMode && examContainerRef.current && !isFullscreen) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        console.log("Attempting to enter fullscreen from useEffect");
        if (examContainerRef.current) {
          try {
            if (examContainerRef.current.requestFullscreen) {
              examContainerRef.current.requestFullscreen();
            } else if (examContainerRef.current.webkitRequestFullscreen) {
              examContainerRef.current.webkitRequestFullscreen();
            } else if (examContainerRef.current.msRequestFullscreen) {
              examContainerRef.current.msRequestFullscreen();
            }
            setIsFullscreen(true);
          } catch (error) {
            console.error("Error entering fullscreen:", error);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [examMode, isFullscreen]);

  // Main render function
  return (
    <>
      {/* Exit Fullscreen Confirmation Modal */}
      {showExitFullscreenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-fadeIn">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-red-700 animate-scaleIn">
            <div className="flex items-center space-x-3 text-red-400 mb-4">
              <AlertTriangle size={28} className="animate-pulse" />
              <h3 className="text-2xl font-bold">Exit Fullscreen?</h3>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-300 mb-4">
                You are about to exit fullscreen mode while your exam is still
                running.
              </p>

              <div className="bg-gray-700 p-4 rounded-lg my-6">
                <p className="text-3xl font-bold text-white mb-2">
                  Press ESC Key Again
                </p>
                <p className="text-xl text-gray-300">To exit fullscreen mode</p>
              </div>

              <p className="text-gray-400 italic">
                For the best exam experience, it's recommended to stay in
                fullscreen mode until you complete your exam.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  // Stay in fullscreen - close modal and re-enter fullscreen if needed
                  setShowExitFullscreenModal(false);

                  // Check if we're still in fullscreen, if not, re-enter
                  const isCurrentlyFullscreen =
                    !!document.fullscreenElement ||
                    !!document.webkitFullscreenElement ||
                    !!document.mozFullScreenElement ||
                    !!document.msFullscreenElement;

                  if (!isCurrentlyFullscreen && examContainerRef.current) {
                    console.log("Re-entering fullscreen from Stay button");
                    if (examContainerRef.current.requestFullscreen) {
                      examContainerRef.current.requestFullscreen();
                    } else if (
                      examContainerRef.current.webkitRequestFullscreen
                    ) {
                      examContainerRef.current.webkitRequestFullscreen();
                    } else if (examContainerRef.current.msRequestFullscreen) {
                      examContainerRef.current.msRequestFullscreen();
                    }
                    setIsFullscreen(true);
                  }
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
              >
                Stay in Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render exam mode view if in exam mode */}
      {examMode && selectedFile ? (
        <div
          ref={examContainerRef}
          className="flex flex-col h-screen bg-gray-900 text-white"
        >
          {/* Exam Mode Header */}
          <div className="bg-red-700 text-white py-2 px-4 flex items-center justify-between shadow-lg">
            <div></div> {/* Empty div for spacing */}
            <div className="flex items-center space-x-3">
              <Clock size={20} className="animate-pulse" />
              <span className="font-bold text-lg">EXAM MODE ACTIVE</span>
              <Lock size={20} />
            </div>
            {!isFullscreen && (
              <button
                onClick={handleFullscreenButtonClick}
                className="p-1.5 rounded-md hover:bg-red-800 transition-colors"
                aria-label="Enter fullscreen"
              >
                <Maximize size={18} />
              </button>
            )}
            {isFullscreen && (
              <div className="text-xs text-white/70 italic">
                Press ESC to exit
              </div>
            )}
          </div>

          {/* Timer Bar - Centered */}
          <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-center items-center">
            <div className="scale-125 transform">
              <Timer
                duration={timerDuration}
                onExamModeChange={handleExamModeChange}
                initialExamMode={true}
                onMount={() => {
                  // Request fullscreen when Timer mounts with initialExamMode=true
                  console.log("Timer mounted with initialExamMode=true");
                  setTimeout(() => {
                    if (examContainerRef.current) {
                      try {
                        if (examContainerRef.current.requestFullscreen) {
                          examContainerRef.current.requestFullscreen();
                        } else if (
                          examContainerRef.current.webkitRequestFullscreen
                        ) {
                          examContainerRef.current.webkitRequestFullscreen();
                        } else if (
                          examContainerRef.current.msRequestFullscreen
                        ) {
                          examContainerRef.current.msRequestFullscreen();
                        }
                        setIsFullscreen(true);
                      } catch (error) {
                        console.error("Error entering fullscreen:", error);
                      }
                    }
                  }, 100);
                }}
              />
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl h-full">
              <iframe
                src={selectedFile.qp}
                className="w-full h-full rounded-lg"
                allow="autoplay"
                allowFullScreen
                scrolling="yes"
                style={{ minHeight: "100%", minWidth: "100%" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-screen bg-gray-900 text-white relative overflow-hidden">
          {/* Sidebar Navigator for PC */}
          {!isMobile && (
            <div
              className={`bg-gray-800 overflow-hidden transition-all duration-300 border-r border-gray-700 flex flex-col ${
                sidebarExpanded ? "w-72" : "w-16"
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                {sidebarExpanded ? (
                  <>
                    <h1 className="font-bold text-xl text-white">
                      Past Papers
                    </h1>
                    <button
                      onClick={toggleSidebar}
                      className="p-1 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={toggleSidebar}
                    className="p-1 rounded-md hover:bg-gray-700 transition-colors mx-auto"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              {sidebarExpanded && (
                <>
                  <div className="p-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <Search
                        size={16}
                        className="absolute left-3 top-2.5 text-gray-400"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {searchQuery ? (
                      <div className="p-3">
                        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">
                          Search Results
                        </h3>
                        {isSearching ? (
                          <div className="text-center py-4 text-gray-400">
                            Searching...
                          </div>
                        ) : (
                          renderSearchResults()
                        )}
                      </div>
                    ) : (
                      <div className="p-1">{renderTree(fileStructure)}</div>
                    )}
                  </div>
                </>
              )}

              {!sidebarExpanded && (
                <div className="flex flex-col items-center mt-6 space-y-6 text-gray-400">
                  <FileText
                    size={24}
                    className="hover:text-blue-400 cursor-pointer"
                    onClick={toggleSidebar}
                    title="Past Papers"
                  />
                </div>
              )}
            </div>
          )}

          {/* Modal Navigator for Mobile */}
          {modalOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-[9000] p-4 pt-16 overflow-y-auto"
              onClick={(e) => {
                // Close modal when clicking outside
                if (e.target === e.currentTarget) {
                  closeModal();
                }
              }}
            >
              <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <h2 className="text-lg font-bold text-white">
                    Past Papers Navigator
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-3 border-b border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search papers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Search
                      size={16}
                      className="absolute left-3 top-2.5 text-gray-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[60vh] p-2">
                  {searchQuery ? (
                    <div className="p-2">
                      <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">
                        Search Results
                      </h3>
                      {isSearching ? (
                        <div className="text-center py-4 text-gray-400">
                          Searching...
                        </div>
                      ) : (
                        renderSearchResults()
                      )}
                    </div>
                  ) : (
                    renderTree(fileStructure)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
            {selectedFile ? (
              <>
                {/* Mobile Navigation Button */}
                {isMobile && (
                  <button
                    onClick={openModal}
                    className="fixed top-1 right-1 z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                    aria-label="Open Navigator"
                  >
                    <Menu size={24} />
                  </button>
                )}

                {/* Tab Navigation with Download Buttons and Timer */}
                <div className="flex flex-wrap items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                  <div
                    className={`flex ${
                      isMobile ? "flex-wrap gap-1" : "space-x-2"
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (examMode) {
                          alert(
                            "You cannot view mark schemes or solved papers during exam mode."
                          );
                          return;
                        }
                        setActiveTab("qp");
                      }}
                      className={`${
                        isMobile ? "px-2 py-1.5 text-xs" : "px-4 py-2"
                      } rounded-md transition-colors ${
                        activeTab === "qp"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <FileText size={isMobile ? 14 : 16} />
                        <span>{isMobile ? "QP" : "Question Paper"}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (examMode) {
                          alert(
                            "You cannot view mark schemes or solved papers during exam mode."
                          );
                          return;
                        }
                        if (!selectedFile.ms) {
                          alert(
                            "This paper does not have a mark scheme available."
                          );
                          return;
                        }
                        setActiveTab("ms");
                      }}
                      className={`${
                        isMobile ? "px-2 py-1.5 text-xs" : "px-4 py-2"
                      } rounded-md transition-colors ${
                        !selectedFile.ms
                          ? "bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed"
                          : activeTab === "ms"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={!selectedFile.ms}
                    >
                      <div className="flex items-center space-x-1">
                        <BookOpen size={isMobile ? 14 : 16} />
                        <span>{isMobile ? "MS" : "Mark Scheme"}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (examMode) {
                          alert(
                            "You cannot view mark schemes or solved papers during exam mode."
                          );
                          return;
                        }
                        if (!selectedFile.sp) {
                          alert(
                            "This paper does not have a solved paper available."
                          );
                          return;
                        }
                        setActiveTab("sp");
                      }}
                      className={`${
                        isMobile ? "px-2 py-1.5 text-xs" : "px-4 py-2"
                      } rounded-md transition-colors ${
                        !selectedFile.sp
                          ? "bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed"
                          : activeTab === "sp"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={!selectedFile.sp}
                    >
                      <div className="flex items-center space-x-1">
                        <CheckCircle size={isMobile ? 14 : 16} />
                        <span>{isMobile ? "SP" : "Solved Paper"}</span>
                      </div>
                    </button>

                    {/* Timer Component */}
                    {showTimer && (
                      <div className={`${isMobile ? "mt-2 w-full" : "ml-4"}`}>
                        <Timer
                          duration={timerDuration}
                          onExamModeChange={handleExamModeChange}
                        />
                      </div>
                    )}
                  </div>

                  <div className="hidden md:flex space-x-1 mt-1 md:mt-0">
                    <a
                      href={selectedFile.qp.replace("/preview", "/view")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors flex items-center space-x-1 text-xs"
                    >
                      <Download size={14} />
                      <span>QP</span>
                    </a>
                    {selectedFile.ms && (
                      <a
                        href={selectedFile.ms.replace("/preview", "/view")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors flex items-center space-x-1 text-xs"
                      >
                        <Download size={14} />
                        <span>MS</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex flex-col md:flex-row flex-1 gap-2 p-4 overflow-hidden">
                  {/* Always show Question Paper */}
                  <div
                    className={
                      activeTab !== "qp" && selectedFile[activeTab]
                        ? "md:w-1/2 flex-1"
                        : "w-full flex-1"
                    }
                  >
                    <PDFViewer file={selectedFile.qp} title="Question Paper" />
                  </div>

                  {/* Show Mark Scheme or Solved Paper if selected */}
                  {activeTab !== "qp" && selectedFile[activeTab] && (
                    <div className="md:w-1/2 flex-1">
                      <PDFViewer
                        file={selectedFile[activeTab]}
                        title={
                          activeTab === "ms" ? "Mark Scheme" : "Solved Paper"
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Past Papers Navigator
                </h2>
                <p className="text-gray-400 max-w-md mb-6">
                  Select a paper from the sidebar to view question papers, mark
                  schemes, and solved papers.
                </p>
                {isMobile && (
                  <button
                    onClick={() => {
                      console.log("Button clicked");
                      openModal();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Menu size={16} />
                      <span>Open Navigator</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
