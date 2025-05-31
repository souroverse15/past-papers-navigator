import React, { useState, useEffect } from "react";
import MobileLayout from "../layout/MobileLayout";
import MobileFileNavigator from "./MobileFileNavigator";
import MobilePaperViewer from "./MobilePaperViewer";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import fileStructure from "../../data/fileStructure.json";

/**
 * MobilePastPapersNavigator - Main mobile component combining file navigation and paper viewing
 * with responsive switching between screens
 */
export default function MobilePastPapersNavigator() {
  const [activeView, setActiveView] = useState("navigator"); // 'navigator' or 'viewer'
  const [selectedFile, setSelectedFile] = useState(null);
  const [activePath, setActivePath] = useState("");
  const [activeTab, setActiveTab] = useState("qp");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  // Use the same file structure as desktop - no need to fetch remotely
  useEffect(() => {
    // Simulate a brief loading state for consistency
    setIsLoading(true);
    setTimeout(() => {
      console.log(
        "Using local file structure data:",
        Object.keys(fileStructure)
      );
      setIsLoading(false);
    }, 100);
  }, []);

  // Handle file selection
  const handleFileSelect = (file, path) => {
    if (!file || !file.qp) {
      console.warn("Selected file does not have a question paper");
      return;
    }

    console.log("File selected:", { file, path });
    setSelectedFile(file);
    setActivePath(path);
    setActiveView("viewer");
    setActiveTab("qp"); // Default to question paper
  };

  // Handle going back to the navigator
  const handleBackToNavigator = () => {
    setActiveView("navigator");
    // Don't clear selectedFile to maintain state
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Show loading state
  if (isLoading) {
    return (
      <MobileLayout activePage="papers">
        <div className="flex h-full items-center justify-center bg-[#0D1321] text-white">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-lg">Loading papers...</p>
            <p className="text-sm text-gray-400">
              Preparing your study materials
            </p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Error handling (though unlikely with local data)
  if (error) {
    return (
      <MobileLayout activePage="papers">
        <div className="flex h-full items-center justify-center bg-[#0D1321] text-white p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400">
              Error Loading Papers
            </h2>
            <p className="text-gray-300">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // For tablets, show both navigator and viewer side by side
  if (isTablet) {
    return (
      <MobileLayout activePage="papers">
        <div className="flex h-full">
          <div className="w-1/3 border-r border-gray-800">
            <MobileFileNavigator
              fileStructure={fileStructure}
              onFileSelect={handleFileSelect}
              activePath={activePath}
              isLoading={isLoading}
            />
          </div>
          <div className="w-2/3">
            <MobilePaperViewer
              selectedFile={selectedFile}
              activePath={activePath}
              onBackClick={handleBackToNavigator}
              onTabChange={handleTabChange}
            />
          </div>
        </div>
      </MobileLayout>
    );
  }

  // For mobile, switch between navigator and viewer
  return (
    <MobileLayout activePage="papers">
      {activeView === "navigator" ? (
        <MobileFileNavigator
          fileStructure={fileStructure}
          onFileSelect={handleFileSelect}
          activePath={activePath}
          isLoading={isLoading}
        />
      ) : (
        <MobilePaperViewer
          selectedFile={selectedFile}
          activePath={activePath}
          onBackClick={handleBackToNavigator}
          onTabChange={handleTabChange}
        />
      )}
    </MobileLayout>
  );
}
