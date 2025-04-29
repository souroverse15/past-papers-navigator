import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  FolderOpen,
  Star,
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
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleCollapsed = () => {
    setIsTransitioning(true);
    setIsCollapsed(!isCollapsed);
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
        isCollapsed ? "w-[12px]" : "w-64"
      } ${isTransitioning ? "overflow-hidden" : ""}`}
    >
      {/* Toggle Button - Positioned differently based on collapsed state */}
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

      {/* Collapsed Mode */}
      {isCollapsed ? (
        <div className="flex flex-col items-center pt-3">
          {/* Only show a subtle line in collapsed state */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1 h-24 bg-gray-700/40 rounded-full mx-auto"></div>
          </div>
        </div>
      ) : (
        /* Normal File Navigator */
        <FileNavigator
          fileStructure={fileStructure}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFileSelect={onFileSelect}
          activePath={activePath}
          examMode={examMode}
          isMobile={isMobile}
          closeModal={closeModal}
        />
      )}
    </div>
  );
}
