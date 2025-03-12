import { useState, useEffect } from "react";
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
} from "lucide-react";
import fileStructure from "../data/fileStructure.json";

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

  const toggleExpand = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev);
  };

  const openModal = () => {
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
            }`}
            onClick={() => {
              setSelectedFile(node[key]);
              updateBreadcrumbs(node[key], currentPath);
              if (isMobile) {
                closeModal();
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
                }`}
                onClick={() => {
                  setSelectedFile(paper);
                  updateBreadcrumbs(paper, `${currentPath}/${paper.name}`);
                  if (isMobile) {
                    closeModal();
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
            }`}
            onClick={() => toggleExpand(currentPath)}
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

  return (
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
                <h1 className="font-bold text-xl text-white">Past Papers</h1>
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

            {/* Tab Navigation with Download Buttons */}
            <div className="flex flex-wrap items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
              <div
                className={`flex ${isMobile ? "flex-wrap gap-1" : "space-x-2"}`}
              >
                <button
                  onClick={() => setActiveTab("qp")}
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
                  onClick={() => setActiveTab("ms")}
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
                  onClick={() => setActiveTab("sp")}
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
              <div
                className={`bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl flex-1 ${
                  activeTab === "qp" || !selectedFile[activeTab]
                    ? "w-full"
                    : "md:w-1/2"
                }`}
              >
                <iframe
                  src={selectedFile.qp}
                  className="w-full h-full rounded-lg"
                  allow="autoplay"
                  allowFullScreen
                  scrolling="yes"
                  style={{ minHeight: "100%", minWidth: "100%" }}
                />
              </div>

              {activeTab !== "qp" && selectedFile[activeTab] && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl flex-1 md:w-1/2">
                  <iframe
                    src={selectedFile[activeTab]}
                    className="w-full h-full rounded-lg"
                    allow="autoplay"
                    allowFullScreen
                    scrolling="yes"
                    style={{ minHeight: "100%", minWidth: "100%" }}
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
  );
}
