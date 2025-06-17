import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  FolderOpen,
  Star,
  X,
} from "lucide-react";
import FileNavigator from "./FileNavigator";
import "./CollapsibleNavigator.css";

export default function CollapsibleFileNavigator({
  fileStructure,
  searchQuery,
  setSearchQuery,
  onFileSelect,
  activePath,
  examMode,
  isMobile,
  closeModal,
  isCollapsed: externalIsCollapsed,
  onToggleCollapsed,
}) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isCollapsed =
    externalIsCollapsed !== undefined
      ? externalIsCollapsed
      : internalIsCollapsed;
  const setIsCollapsed = onToggleCollapsed || setInternalIsCollapsed;

  const toggleCollapsed = () => {
    setIsTransitioning(true);
    setIsCollapsed(!isCollapsed);
  };

  // Handle file selection for mobile - close sidebar after selection
  const handleFileSelect = (file, path, breadcrumbs) => {
    onFileSelect(file, path, breadcrumbs);
    // Auto-close sidebar on mobile after file selection
    if (isMobile && onToggleCollapsed) {
      onToggleCollapsed(true);
    }
  };

  // Handle transition end
  useEffect(() => {
    const transitionEndHandler = () => {
      setIsTransitioning(false);
    };

    const sidebarElement = document.getElementById("collapsible-sidebar");
    if (sidebarElement) {
      sidebarElement.addEventListener("transitionend", transitionEndHandler);
    }

    return () => {
      if (sidebarElement) {
        sidebarElement.removeEventListener(
          "transitionend",
          transitionEndHandler
        );
      }
    };
  }, []);

  return (
    <div
      id="collapsible-sidebar"
      className={`bg-gray-800 border-r border-gray-700 flex flex-col h-full relative transition-all duration-300 ease-in-out ${
        isCollapsed ? (isMobile ? "w-0" : "w-[12px]") : "w-64"
      } ${isTransitioning ? "overflow-hidden" : ""} ${
        isMobile ? "shadow-2xl" : ""
      }`}
    >
      {/* Desktop Toggle Button - Only show on desktop */}
      {!isMobile && (
        <button
          onClick={toggleCollapsed}
          className={`absolute ${
            isCollapsed ? "-right-6" : "-right-3"
          } top-4 bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 border border-gray-600 z-20 shadow-lg transition-all duration-300 transform ${
            isCollapsed ? "" : "rotate-180"
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={18} className="text-blue-400" />
        </button>
      )}

      {/* Collapsed Mode - Only for desktop */}
      {isCollapsed && !isMobile ? (
        <div className="flex flex-col items-center pt-3">
          {/* Only show a subtle line in collapsed state */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1 h-24 bg-gray-700/40 rounded-full mx-auto"></div>
          </div>
        </div>
      ) : (
        /* Normal File Navigator - Show when not collapsed or on mobile */
        !isCollapsed && (
          <div className="flex flex-col h-full">
            <FileNavigator
              fileStructure={fileStructure}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onFileSelect={handleFileSelect}
              activePath={activePath}
              examMode={examMode}
              isMobile={isMobile}
              closeModal={closeModal}
            />

            {/* Mobile Close Button - At the bottom */}
            {isMobile && (
              <div className="border-t border-gray-700 p-3 bg-gray-800/80">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  aria-label="Close file navigator"
                >
                  <X size={18} />
                  <span>Close Navigator</span>
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
