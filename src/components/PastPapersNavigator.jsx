import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  useLocation,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import fileStructure from "../data/fileStructure.json";
import { getPaperDuration } from "../data/examDurations";
import "../animations.css";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calculator,
  Menu,
  X,
  Search,
  FileText,
  BarChart2,
  HelpCircle,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";

// Import components
import FileNavigator from "./FileNavigator";
import CollapsibleFileNavigator from "./CollapsibleFileNavigator";
import PaperViewer from "./PaperViewer";
import ExamMode from "./ExamMode";
import SearchModal from "./SearchModal";

// Helper function to find a file in the file structure by path
const findFileByPath = (structure, path) => {
  if (!path) return null;

  const parts = path.split("/").filter((part) => part);
  if (parts.length === 0) return null;

  let current = structure;
  let currentPath = "";
  let breadcrumbs = [];

  // Navigate through the structure
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    breadcrumbs.push(part);
    currentPath = currentPath ? `${currentPath}/${part}` : part;

    if (current[part]) {
      current = current[part];
    } else {
      console.error(`Path segment '${part}' not found in structure`);
      return null;
    }
  }

  // Find the file in the current folder
  const fileName = parts[parts.length - 1];
  if (Array.isArray(current)) {
    const file = current.find((f) => f.name === fileName);
    if (file) {
      return { file, path, breadcrumbs: [...breadcrumbs, fileName] };
    }
  }

  console.error(`File '${fileName}' not found in path '${currentPath}'`);
  return null;
};

export default function PastPapersNavigator({
  sidebarFileNavigatorOpen,
  onToggleFileNavigator,
  isMobileApp,
}) {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // State for file navigation and selection
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("qp");
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [activePath, setActivePath] = useState("");

  // State for mobile interface
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for file navigator
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // State for mobile navigation
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState("papers");

  // State for exam mode
  const [timerDuration, setTimerDuration] = useState(90);
  const [showTimer, setShowTimer] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialExamMode, setInitialExamMode] = useState(false);

  // Refs
  const examContainerRef = useRef(null);
  const userInitiatedExitRef = useRef(false);

  // Use the isMobileApp prop if provided, otherwise use the internal state
  const effectiveIsMobile = isMobileApp !== undefined ? isMobileApp : isMobile;

  // Add new state for the modals
  const [showCheckingModal, setShowCheckingModal] = useState(false);
  const [showNoMarkSchemeModal, setShowNoMarkSchemeModal] = useState(false);
  const [checkingInstructions, setCheckingInstructions] = useState({
    isTemp: false,
  });

  // Define mobile navigation sections
  const mobileNavSections = [
    {
      id: "papers",
      icon: FileText,
      text: "Past Papers",
      path: "/",
      hasFileNavigator: true,
    },
    {
      id: "dashboard",
      icon: BarChart2,
      text: "Dashboard",
      path: "/dashboard",
      requiresAuth: true,
    },
    {
      id: "admin",
      icon: ShieldCheck,
      text: "Admin",
      path: "/admin",
      requiresAuth: true,
      requiredRole: "Admin",
    },
    {
      id: "help",
      icon: HelpCircle,
      text: "Help",
      path: "/help",
    },
    {
      id: "login",
      icon: user ? LogOut : LogIn,
      text: user ? "Logout" : "Login",
      path: user ? null : "/login",
      action: user ? "logout" : null,
    },
  ];

  // Filter navigation items based on auth state
  const getVisibleNavSections = () => {
    return mobileNavSections.filter((section) => {
      if (section.requiresAuth && !user) return false;
      if (
        section.requiredRole &&
        (!user || !user.roles?.includes(section.requiredRole))
      )
        return false;
      return true;
    });
  };

  // Handle mobile navigation item click
  const handleMobileNavClick = (section) => {
    if (section.action === "logout") {
      // Handle logout
      handleLogout();
      navigate("/");
      setShowMobileNav(false);
      return;
    }

    if (section.path) {
      navigate(section.path);
    }

    setActiveNavSection(section.id);

    // If it's not the papers section, close the mobile nav
    if (section.id !== "papers") {
      setShowMobileNav(false);
    }
  };

  // Mobile Navigation Component
  const MobileNavigation = () => (
    <div className="flex h-full shadow-2xl">
      {/* Slim Sidebar */}
      <div className="w-16 bg-gray-900 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <FileText size={24} className="text-blue-500 mx-auto" />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-3 space-y-1">
          {getVisibleNavSections().map((section) => {
            const Icon = section.icon;
            const isActive = activeNavSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => handleMobileNavClick(section)}
                className={`w-full p-3 flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                title={section.text}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">
                  {section.text.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={() => setShowMobileNav(false)}
            className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Close navigation"
          >
            <X size={20} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* File Navigator Panel - Only show for Papers section */}
      {activeNavSection === "papers" && (
        <div className="w-64 bg-gray-800">
          <CollapsibleFileNavigator
            fileStructure={fileStructure}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFileSelect={handleFileSelect}
            activePath={activePath}
            examMode={examMode}
            isMobile={effectiveIsMobile}
            closeModal={closeModal}
            isCollapsed={false}
            onToggleCollapsed={() => setShowMobileNav(false)}
          />
        </div>
      )}
    </div>
  );

  // Initialize sidebar state based on device type
  useEffect(() => {
    // Start with sidebar collapsed on mobile, expanded on desktop
    setSidebarCollapsed(effectiveIsMobile);
  }, [effectiveIsMobile]);

  // Set active navigation section based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === "/") {
      setActiveNavSection("papers");
    } else if (currentPath === "/dashboard") {
      setActiveNavSection("dashboard");
    } else if (currentPath === "/admin") {
      setActiveNavSection("admin");
    } else if (currentPath === "/help") {
      setActiveNavSection("help");
    } else if (currentPath === "/login") {
      setActiveNavSection("login");
    }
  }, [location.pathname]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const wasMobile = isMobile;
      const nowMobile = width < 768;

      setIsMobile(nowMobile);

      // If switching from desktop to mobile, collapse sidebar
      if (!wasMobile && nowMobile) {
        setSidebarCollapsed(true);
      }
      // If switching from mobile to desktop, expand sidebar
      else if (wasMobile && !nowMobile) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call once on mount to set initial state

    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Handle URL path parameter when coming from study goals
  useEffect(() => {
    const path = searchParams.get("path");
    if (path) {
      console.log("Found path in URL:", path);

      try {
        // Find the file in the structure
        const fileInfo = findFileByPath(fileStructure, path);

        if (fileInfo) {
          console.log("Found file:", fileInfo);
          // Include the path in the file object for better reference
          const fileWithPath = {
            ...fileInfo.file,
            path: fileInfo.path,
          };

          // Update state with the found file
          setSelectedFile(fileWithPath);
          setActivePath(fileInfo.path);
          setBreadcrumbs(fileInfo.breadcrumbs);
          setShowTimer(true);

          console.log("Paper loaded from URL:", fileWithPath.name);
        } else {
          console.error("Could not find file with path:", path);
        }
      } catch (error) {
        console.error("Error loading file from path:", error);
      }
    }
  }, [searchParams]);

  // Add keyboard shortcut for toggling the file navigator
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Log key events for debugging
      console.log("Key pressed:", {
        key: e.key,
        code: e.code,
        altKey: e.altKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
      });

      // No longer using keyboard shortcuts to toggle file navigator
      // Now the collapse/expand is handled within the CollapsibleFileNavigator
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [examMode, onToggleFileNavigator]); // Add onToggleFileNavigator as a dependency

  // Update timer duration when a new file is selected
  useEffect(() => {
    if (selectedFile) {
      const duration = getPaperDuration(activePath, selectedFile.name);
      setTimerDuration(duration);
      setShowTimer(true);
    } else {
      setShowTimer(false);
    }
  }, [selectedFile, activePath]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!isDocFullscreen && isFullscreen) {
        console.log("Exiting fullscreen detected");

        // Only exit exam mode if the exit was user-initiated, not program-initiated
        if (!userInitiatedExitRef.current) {
          console.log("Exiting exam mode due to fullscreen exit");
          setExamMode(false);
        }

        // Reset fullscreen state
        setIsFullscreen(false);
        userInitiatedExitRef.current = false;
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
  }, [isFullscreen]);

  // Handle fullscreen exit
  const exitFullscreen = () => {
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(false);
  };

  // Toggle sidebar - Updated for new unified approach
  const toggleSidebar = () => {
    if (examMode) {
      console.log("Sidebar is locked during exam mode");
      alert("Sidebar is locked during exam mode.");
      return;
    }
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Search modal handlers
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

  // File selection handler
  const handleFileSelect = (file, path, breadcrumbs) => {
    // Debug the file object before modification
    console.log("handleFileSelect - Original file object:", {
      originalFile: file,
      originalPath: path,
      fileHasPath: file?.path ? true : false,
      fileKeys: Object.keys(file || {}),
    });

    // Include the path in the file object for better reference
    const fileWithPath = {
      ...file,
      path: path,
    };

    console.log("File selected with path data:", {
      fileName: file.name,
      filePath: path,
      fullObject: fileWithPath,
      breadcrumbs,
    });

    setSelectedFile(fileWithPath);
    setActivePath(path);
    setBreadcrumbs(breadcrumbs);

    // Also set showTimer to true when a file is selected
    setShowTimer(true);

    // Close mobile navigation when file is selected
    if (effectiveIsMobile) {
      setShowMobileNav(false);
    }
  };

  // Timer handlers
  const handleTimerToggle = (isRunning) => {
    setTimerRunning(isRunning);
  };

  // Update the handleExamModeChange function
  const handleExamModeChange = (newExamMode, options = {}) => {
    console.log(`Setting exam mode to ${newExamMode}`, options);
    setExamMode(newExamMode);

    // Close mobile navigation when entering exam mode
    if (newExamMode && effectiveIsMobile) {
      setShowMobileNav(false);
    }

    if (newExamMode) {
      // Save the original tab and switch to QP
      setActiveTab("qp");
    } else if (options && options.showMarkScheme) {
      // Show the mark scheme when mock is completed with a score
      console.log("Mock completed with score:", options.score);
      setActiveTab("ms");

      // If this is a temporary save (without score), mark that we're in checking phase
      if (options.tempSave) {
        // Set a URL parameter to indicate we're in checking phase
        const url = new URL(window.location);
        url.searchParams.set("checking", "true");

        // If we have an exam ID, add it to the URL
        if (options.examId) {
          url.searchParams.set("examId", options.examId);
        }

        // Update URL without reloading the page
        window.history.pushState({}, "", url);

        // Also store in session storage as a backup
        sessionStorage.setItem("mockExamChecking", "true");
        if (options.examId) {
          sessionStorage.setItem("tempSavedExamId", options.examId);
        }
      }

      // Force showing side-by-side view of QP and MS for checking
      if (selectedFile && selectedFile.ms) {
        // Set a short timeout to ensure state updates properly
        setTimeout(() => {
          // If checking phase, show different message
          if (options.tempSave) {
            // Show modal instead of alert
            setCheckingInstructions({ isTemp: true });
            setShowCheckingModal(true);
          } else {
            // Display a message to the user about checking their answers
            setCheckingInstructions({ isTemp: false });
            setShowCheckingModal(true);
          }
        }, 300);
      } else {
        console.log("No mark scheme available for this paper");
        setShowNoMarkSchemeModal(true);
      }
    }
  };

  const handleTimerMount = () => {
    console.log("Timer component mounted");
  };

  // Debug showTimer state
  useEffect(() => {
    console.log("showTimer state changed:", showTimer);
  }, [showTimer]);

  // Debug selectedFile state
  useEffect(() => {
    if (selectedFile) {
      console.log("selectedFile state changed:", {
        name: selectedFile.name,
        hasPath: selectedFile.path ? true : false,
        pathValue: selectedFile.path,
      });

      // Ensure timer is shown when a file is selected
      if (!showTimer) {
        console.log("Enabling timer because a file is selected");
        setShowTimer(true);
      }
    } else {
      console.log("selectedFile is null");
    }
  }, [selectedFile, showTimer]);

  // If in exam mode, show the exam interface
  if (examMode) {
    return (
      <div ref={examContainerRef}>
        <ExamMode
          selectedFile={selectedFile}
          examContainerRef={examContainerRef}
          timerDuration={timerDuration}
          handleExamModeChange={handleExamModeChange}
          setIsFullscreen={setIsFullscreen}
        />
      </div>
    );
  }

  return (
    <>
      <div className="h-screen w-full bg-[#0D1321] text-white relative overflow-hidden">
        <div className="flex h-full">
          {/* Mobile Navigation - Only show when toggled */}
          {effectiveIsMobile && showMobileNav && (
            <div className="absolute inset-y-0 left-0 z-30 animate-slideInLeft">
              <MobileNavigation />
            </div>
          )}

          {/* Desktop File Navigator - Only show on desktop */}
          {!effectiveIsMobile && (
            <div className="relative">
              <CollapsibleFileNavigator
                fileStructure={fileStructure}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onFileSelect={handleFileSelect}
                activePath={activePath}
                examMode={examMode}
                isMobile={effectiveIsMobile}
                closeModal={closeModal}
                isCollapsed={sidebarCollapsed}
                onToggleCollapsed={setSidebarCollapsed}
              />
            </div>
          )}

          {/* Overlay for mobile when navigation is open */}
          {effectiveIsMobile && showMobileNav && (
            <div
              className="absolute inset-0 bg-black/50 z-20"
              onClick={() => setShowMobileNav(false)}
            />
          )}

          {/* Main Content Area */}
          <div className={`flex-1 ${effectiveIsMobile ? "relative z-10" : ""}`}>
            <PaperViewer
              selectedFile={selectedFile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              timerDuration={timerDuration}
              timerRunning={timerRunning}
              handleTimerToggle={handleTimerToggle}
              handleExamModeChange={handleExamModeChange}
              initialExamMode={initialExamMode}
              handleTimerMount={handleTimerMount}
              examMode={examMode}
              showTimer={showTimer}
              effectiveIsMobile={effectiveIsMobile}
              activePath={activePath}
            />
          </div>
        </div>

        {/* Floating Action Button for Mobile - Bottom Right */}
        {effectiveIsMobile && !showMobileNav && !examMode && (
          <button
            onClick={() => setShowMobileNav(true)}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl z-40 transition-all duration-200 hover:scale-110 border border-blue-500"
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Search Modal */}
        <SearchModal
          modalOpen={modalOpen}
          closeModal={closeModal}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fileStructure={fileStructure}
          onFileSelect={handleFileSelect}
          activePath={activePath}
          examMode={examMode}
          effectiveIsMobile={effectiveIsMobile}
        />
      </div>

      {/* Checking Instructions Modal */}
      {showCheckingModal &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border-2 border-blue-600 animate-scaleIn">
              <div className="flex items-center text-blue-400 mb-3">
                <BookOpen size={24} className="mr-2" />
                <h3 className="text-xl font-bold">Check Your Answers</h3>
              </div>

              {checkingInstructions.isTemp ? (
                <div className="flex items-center justify-center bg-blue-900/20 p-3 rounded-lg border border-blue-700 mb-4">
                  <span className="text-blue-200 font-medium text-center">
                    Mark scheme is now available. <br />
                    Click
                    <span className="bg-green-600 text-white px-1 py-0.5 rounded ml-2">
                      "Done Checking"
                    </span>
                    &nbsp;when finished
                  </span>
                </div>
              ) : (
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700 mb-4">
                  <p className="text-blue-200 font-medium text-center">
                    Your score has been saved
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-600 p-1.5 rounded-full">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <span className="text-white font-medium">Mark your work</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="bg-blue-600 p-1.5 rounded-full">
                    <Calculator size={14} className="text-white" />
                  </div>
                  <span className="text-white font-medium">
                    Calculate percentage
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCheckingModal(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* No Mark Scheme Available Modal */}
      {showNoMarkSchemeModal &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border-2 border-amber-600 animate-scaleIn">
              <div className="flex items-center text-amber-400 mb-4">
                <AlertTriangle size={28} className="mr-2" />
                <h3 className="text-xl font-bold">No Mark Scheme Available</h3>
              </div>

              <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-700 mb-5">
                <p className="text-amber-200 font-medium text-center">
                  Your mock exam has been ended, but no mark scheme is available
                  for this paper.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowNoMarkSchemeModal(false)}
                  className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
