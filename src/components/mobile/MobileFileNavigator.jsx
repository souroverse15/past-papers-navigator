import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Search,
  X,
  RefreshCw,
  Filter,
  Star,
  CheckCircle2,
} from "lucide-react";

/**
 * Enhanced MobileFileNavigator - A touch-friendly, optimized file navigation component for mobile devices
 */
export default function MobileFileNavigator({
  fileStructure,
  onFileSelect,
  activePath = "",
  isLoading = false,
}) {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [filterByYear, setFilterByYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);

  // Initialize with expanded path based on activePath
  useEffect(() => {
    if (activePath && fileStructure) {
      const pathParts = activePath.split("/").filter(Boolean);
      const newExpandedFolders = {};

      let currentPath = "";
      pathParts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        newExpandedFolders[currentPath] = true;
      });

      setExpandedFolders((prevState) => ({
        ...prevState,
        ...newExpandedFolders,
      }));
    }
  }, [activePath, fileStructure]);

  // Extract available years from file structure
  useEffect(() => {
    if (fileStructure) {
      const years = new Set();
      const extractYears = (structure, path = "") => {
        Object.entries(structure).forEach(([key, value]) => {
          if (/^20\d{2}$/.test(key)) {
            years.add(key);
          }
          if (typeof value === "object" && value && !value.qp) {
            extractYears(value, path ? `${path}/${key}` : key);
          }
        });
      };
      extractYears(fileStructure);
      setAvailableYears(Array.from(years).sort().reverse());
    }
  }, [fileStructure]);

  // Toggle folder expansion
  const toggleFolder = (folderPath) => {
    setExpandedFolders((prevState) => ({
      ...prevState,
      [folderPath]: !prevState[folderPath],
    }));
  };

  // Check if a path is the active path or a parent of it
  const isActiveOrParent = (path) => {
    return activePath === path || activePath.startsWith(`${path}/`);
  };

  // Enhanced search functionality
  const handleSearch = useMemo(() => {
    return (query) => {
      if (!query.trim() || !fileStructure) {
        setSearchResults([]);
        return;
      }

      const results = [];
      const searchQuery = query.toLowerCase();

      // Recursive search function with path tracking
      const searchInStructure = (structure, currentPath = "") => {
        if (!structure || typeof structure !== "object") return;

        Object.entries(structure).forEach(([key, value]) => {
          const fullPath = currentPath ? `${currentPath}/${key}` : key;
          const nameMatchesSearch = key.toLowerCase().includes(searchQuery);

          if (nameMatchesSearch) {
            if (typeof value === "object" && value && !value.qp) {
              // It's a folder
              results.push({
                name: key,
                path: fullPath,
                type: "folder",
                level: fullPath.split("/").length,
              });
            } else if (typeof value === "object" && value && value.qp) {
              // It's a file
              const pathParts = fullPath.split("/");
              const board = pathParts[0] || "";
              const subject = pathParts[1] || "";
              const year = pathParts[2] || "";
              const session = pathParts[3] || "";

              results.push({
                name: key,
                path: fullPath,
                type: "file",
                data: value,
                board,
                subject,
                year,
                session,
                level: fullPath.split("/").length,
              });
            }
          }

          // Recursively search in subfolders
          if (typeof value === "object" && value && !value.qp) {
            searchInStructure(value, fullPath);
          }
        });
      };

      searchInStructure(fileStructure);
      return results.slice(0, 50); // Limit results for better performance
    };
  }, [fileStructure]);

  // Effect to update search results when query changes
  useEffect(() => {
    if (searchQuery) {
      const results = handleSearch(searchQuery);
      let filteredResults = results || [];

      // Apply year filter if selected
      if (filterByYear) {
        filteredResults = filteredResults.filter(
          (result) =>
            result.year === filterByYear || result.path.includes(filterByYear)
        );
      }

      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, filterByYear, handleSearch]);

  // Enhanced folder contents rendering with better performance
  const renderFolderContents = (structure, path = "", depth = 0) => {
    if (!structure || typeof structure !== "object") {
      return null;
    }

    // Don't render deeply nested folders if they're not expanded
    if (depth > 0 && !expandedFolders[path] && !isActiveOrParent(path)) {
      return null;
    }

    const entries = Object.entries(structure);

    // Sort entries: folders first, then files, both alphabetically
    const sortedEntries = entries.sort(([keyA, valueA], [keyB, valueB]) => {
      const isFileA = valueA && typeof valueA === "object" && valueA.qp;
      const isFileB = valueB && typeof valueB === "object" && valueB.qp;

      if (isFileA && !isFileB) return 1;
      if (!isFileA && isFileB) return -1;

      // Special sorting for years (newest first)
      if (/^20\d{2}$/.test(keyA) && /^20\d{2}$/.test(keyB)) {
        return keyB.localeCompare(keyA);
      }

      return keyA.localeCompare(keyB);
    });

    return sortedEntries.map(([key, value]) => {
      const fullPath = path ? `${path}/${key}` : key;
      const isActive = activePath === fullPath;

      // If it's a file (has qp property)
      if (value && typeof value === "object" && value.qp) {
        const hasAllPapers = value.qp && value.ms;
        const hasSolutions = value.sp || value.in;

        return (
          <div
            key={fullPath}
            className={`border-b border-gray-800/50 py-3 px-4 flex items-center justify-between touch-manipulation transition-all duration-200 ${
              isActive
                ? "bg-blue-600/20 border-blue-500/30"
                : "hover:bg-gray-800/30 active:bg-gray-700/40"
            }`}
            onClick={() => onFileSelect(value, fullPath)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <File
                size={18}
                className={isActive ? "text-blue-400" : "text-gray-400"}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium block truncate ${
                    isActive ? "text-blue-100" : "text-gray-200"
                  }`}
                >
                  {key}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  {hasAllPapers && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 size={12} className="text-green-400" />
                      <span className="text-xs text-green-400">Complete</span>
                    </div>
                  )}
                  {hasSolutions && (
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400">Solutions</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight
              size={16}
              className={`flex-shrink-0 ${
                isActive ? "text-blue-400" : "text-gray-500"
              }`}
            />
          </div>
        );
      }

      // If it's a folder
      const isExpanded =
        expandedFolders[fullPath] || isActiveOrParent(fullPath);
      const folderEntries = Object.entries(value || {});
      const fileCount = folderEntries.filter(([, v]) => v && v.qp).length;
      const folderCount = folderEntries.filter(([, v]) => v && !v.qp).length;

      return (
        <div key={fullPath}>
          <div
            className={`border-b border-gray-800/50 py-3 px-4 flex items-center justify-between touch-manipulation transition-all duration-200 ${
              isActiveOrParent(fullPath)
                ? "bg-gray-800/60"
                : "hover:bg-gray-800/30 active:bg-gray-700/40"
            }`}
            onClick={() => toggleFolder(fullPath)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {isExpanded ? (
                <ChevronDown
                  size={18}
                  className="text-gray-400 flex-shrink-0"
                />
              ) : (
                <ChevronRight
                  size={18}
                  className="text-gray-400 flex-shrink-0"
                />
              )}
              <Folder
                size={18}
                className={`flex-shrink-0 ${
                  isActiveOrParent(fullPath) ? "text-blue-400" : "text-gray-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium block truncate ${
                    isActiveOrParent(fullPath)
                      ? "text-blue-100"
                      : "text-gray-200"
                  }`}
                >
                  {key}
                </span>
                {(fileCount > 0 || folderCount > 0) && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    {fileCount > 0 && `${fileCount} papers`}
                    {fileCount > 0 && folderCount > 0 && " • "}
                    {folderCount > 0 && `${folderCount} folders`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="pl-6 border-l-2 border-gray-800/30 ml-4">
              {renderFolderContents(value, fullPath, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Render search results
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <Search size={32} className="mx-auto mb-4 opacity-50" />
          <p>No papers found</p>
          <p className="text-sm mt-2">Try adjusting your search terms</p>
        </div>
      );
    }

    return searchResults.map((result) => (
      <div
        key={result.path}
        className={`border-b border-gray-800/50 py-3 px-4 transition-all duration-200 ${
          result.type === "file"
            ? "hover:bg-gray-800/30 active:bg-gray-700/40 cursor-pointer"
            : "hover:bg-gray-800/20"
        }`}
        onClick={() =>
          result.type === "file" && onFileSelect(result.data, result.path)
        }
      >
        <div className="flex items-center space-x-3">
          {result.type === "file" ? (
            <File size={16} className="text-blue-400 flex-shrink-0" />
          ) : (
            <Folder size={16} className="text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200 truncate">
              {result.name}
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              {result.board && result.subject && (
                <span>
                  {result.board} • {result.subject}
                  {result.year && ` • ${result.year}`}
                  {result.session && ` ${result.session}`}
                </span>
              )}
            </div>
          </div>
          {result.type === "file" && (
            <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
          )}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0D1321] text-white">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-sm">Loading papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0D1321] text-white">
      {/* Enhanced Search Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchActive(e.target.value.length > 0);
            }}
            className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchActive(false);
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Year Filter */}
        {searchActive && availableYears.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterByYear}
              onChange={(e) => setFilterByYear(e.target.value)}
              className="bg-gray-800/60 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {searchActive ? (
          <div className="p-2">
            {searchQuery && (
              <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-800/50">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                {filterByYear && ` in ${filterByYear}`}
              </div>
            )}
            {renderSearchResults()}
          </div>
        ) : fileStructure ? (
          <div>{renderFolderContents(fileStructure)}</div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw size={32} className="mx-auto mb-4 opacity-50" />
            <p>No file structure available</p>
            <p className="text-sm mt-2">Please check your connection</p>
          </div>
        )}
      </div>
    </div>
  );
}
