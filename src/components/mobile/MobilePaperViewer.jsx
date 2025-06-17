import React, { useState, useEffect } from "react";
import {
  FileText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  Target,
  Download,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Split,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getPDFViewerUrl } from "../../config/api";

/**
 * Enhanced MobilePaperViewer - A dedicated component for viewing papers on mobile devices
 * with optimized UI controls, split view functionality, and better PDF viewing experience
 */
export default function MobilePaperViewer({
  selectedFile,
  activePath,
  onBackClick,
  onTabChange,
}) {
  const [activeTab, setActiveTab] = useState("qp"); // qp, ms, sp, in
  const [splitView, setSplitView] = useState(false); // Whether to show split view
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Add CSS for animations
  const styles = `
    @keyframes shrink {
      0% { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    .animate-shrink {
      animation: shrink 3s linear forwards;
    }
  `; // Fixed: Removed global white iframe backgrounds

  // Reset state when file changes
  useEffect(() => {
    if (selectedFile) {
      setActiveTab("qp");
      setSplitView(false);
      setLoading(true); // Show loading when file changes
      setLoadingError(null);
      setRetryCount(0);
    }
  }, [selectedFile]);

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (loadingError) {
      const timer = setTimeout(() => {
        setLoadingError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loadingError]);

  // Check if it's English Language B
  const isEnglishLanguageB = (path = "") => {
    if (!path) return false;
    const pathParts = path.split("/");
    return pathParts.some(
      (part) => part.toLowerCase() === "english language b"
    );
  };

  const isEnglishB = isEnglishLanguageB(activePath);

  // Change tab handler with split view logic
  const handleTabChange = (tab) => {
    if (!selectedFile?.[tab]) {
      // Show a toast-like notification instead of alert
      setLoadingError(
        `This paper does not have a ${getTabName(tab)} available.`
      );
      setTimeout(() => setLoadingError(null), 3000);
      return;
    }

    // Set loading state when switching tabs
    setLoading(true);
    setLoadingError(null);

    // If clicking on MS or SP while QP is active, enable split view
    if (activeTab === "qp" && (tab === "ms" || tab === "sp" || tab === "in")) {
      setSplitView(true);
      setActiveTab(tab);
    } else if (
      (activeTab === "ms" || activeTab === "sp" || activeTab === "in") &&
      tab === "qp"
    ) {
      // If clicking QP while in MS/SP view, disable split view
      setSplitView(false);
      setActiveTab(tab);
    } else {
      // Normal tab switching
      setSplitView(false);
      setActiveTab(tab);
    }

    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Toggle split view
  const toggleSplitView = () => {
    if (splitView) {
      setSplitView(false);
      setActiveTab("qp");
    } else if (activeTab !== "qp" && selectedFile?.qp) {
      setSplitView(true);
    }
  };

  // Get human-readable tab name
  const getTabName = (tab) => {
    switch (tab) {
      case "qp":
        return "Question Paper";
      case "ms":
        return "Mark Scheme";
      case "sp":
        return "Solved Paper";
      case "in":
        return "Booklet";
      default:
        return "";
    }
  };

  // Handle iframe load events
  const handleIframeLoad = () => {
    setLoading(false);
    setLoadingError(null);
    setRetryCount(0);
  };

  const handleIframeError = () => {
    setLoading(false);
    if (retryCount < 2) {
      setLoadingError(
        `Failed to load document. Retrying... (${retryCount + 1}/3)`
      );
      setRetryCount((prev) => prev + 1);
      // Auto-retry after 2 seconds
      setTimeout(() => {
        setLoading(true);
        setLoadingError(null);
      }, 2000);
    } else {
      setLoadingError(
        "Failed to load the document. Please check your internet connection and try again."
      );
    }
  };

  // Retry function for manual retry
  const handleRetry = () => {
    setLoading(true);
    setLoadingError(null);
    setRetryCount(0);
  };

  // Enhanced Loading component
  const LoadingIndicator = ({ error, onRetry }) => (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-10">
      {error ? (
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4 text-sm">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-3 border-gray-600 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-300 mb-2 text-sm">Loading PDF...</p>
          <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Please wait...</p>
        </div>
      )}
    </div>
  );

  // Get current tab URL
  const getCurrentTabUrl = (tab = activeTab) => {
    if (!selectedFile || !selectedFile[tab]) return null;
    return getPDFViewerUrl(selectedFile[tab]);
  };

  // Download current paper
  const handleDownload = (tab = activeTab) => {
    const url = getCurrentTabUrl(tab);
    if (url) {
      // Convert Google Drive preview URL to download URL
      const downloadUrl = url.replace("/preview", "/export?format=pdf");
      window.open(downloadUrl, "_blank");
    }
  };

  // Extract paper info for display
  const getPaperInfo = () => {
    if (!selectedFile || !activePath) return null;

    const pathParts = activePath.split("/");
    return {
      board: pathParts[0] || "",
      subject: pathParts[1] || "",
      year: pathParts[2] || "",
      session: pathParts[3] || "",
      paperName:
        selectedFile.name || pathParts[pathParts.length - 1] || "Unknown Paper",
    };
  };

  const paperInfo = getPaperInfo();

  // If no file is selected, show enhanced placeholder
  if (!selectedFile) {
    return (
      <div className="flex flex-col h-full bg-[#0D1321] text-white">
        <style>{styles}</style>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm mx-auto space-y-6 animate-in fade-in-50 duration-500">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 rounded-2xl border border-blue-500/20 shadow-xl">
                <FileText
                  size={64}
                  className="text-blue-400 mx-auto animate-pulse"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">
                Select a Past Paper
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Choose a paper from the file navigator to start your exam
                preparation journey
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <FileText size={16} />
                  <span>Question Papers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen size={16} />
                  <span>Mark Schemes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0D1321] text-white">
      <style>{styles}</style>
      {/* Compact Header */}
      <div className="p-2 border-b border-gray-800 bg-gray-900/70 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Back Button - Icon Only */}
          <button
            onClick={onBackClick}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-gray-300" />
          </button>

          {/* Tab Buttons - Center */}
          <div className="flex items-center space-x-1">
            <button
              disabled={!selectedFile.qp}
              onClick={() => handleTabChange("qp")}
              className={`flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[36px] ${
                activeTab === "qp"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : selectedFile.qp
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
                  : "bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed"
              }`}
            >
              <FileText size={12} className="mr-1" />
              <span>QP</span>
              {splitView && activeTab !== "qp" && (
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1.5 animate-pulse"></div>
              )}
            </button>

            <button
              disabled={!selectedFile.ms}
              onClick={() => handleTabChange("ms")}
              className={`flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[36px] ${
                activeTab === "ms"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : selectedFile.ms
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
                  : "bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed"
              }`}
            >
              <BookOpen size={12} className="mr-1" />
              <span>MS</span>
              {splitView && activeTab === "ms" && (
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1.5 animate-pulse"></div>
              )}
            </button>

            {/* Conditional rendering of SP or Booklet button */}
            {isEnglishB ? (
              <button
                disabled={!selectedFile.in}
                onClick={() => handleTabChange("in")}
                className={`flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[36px] ${
                  activeTab === "in"
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : selectedFile.in
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
                    : "bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed"
                }`}
              >
                <BookOpen size={12} className="mr-1" />
                <span>Book</span>
                {splitView && activeTab === "in" && (
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1.5 animate-pulse"></div>
                )}
              </button>
            ) : (
              <button
                disabled={!selectedFile.sp}
                onClick={() => handleTabChange("sp")}
                className={`flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[36px] ${
                  activeTab === "sp"
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : selectedFile.sp
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
                    : "bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 size={12} className="mr-1" />
                <span>SP</span>
                {splitView && activeTab === "sp" && (
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1.5 animate-pulse"></div>
                )}
              </button>
            )}
          </div>

          {/* Download Buttons - Right */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleDownload("qp")}
              className="px-2.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-all duration-200 min-h-[36px] flex items-center space-x-1"
              title="Download Question Paper"
              disabled={!selectedFile.qp}
            >
              <Download
                size={12}
                className={`${
                  !selectedFile.qp ? "text-gray-500" : "text-blue-300"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  !selectedFile.qp ? "text-gray-500" : "text-blue-300"
                }`}
              >
                QP
              </span>
            </button>
            <button
              onClick={() => handleDownload("ms")}
              className="px-2.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-all duration-200 min-h-[36px] flex items-center space-x-1"
              title="Download Mark Scheme"
              disabled={!selectedFile.ms}
            >
              <Download
                size={12}
                className={`${
                  !selectedFile.ms ? "text-gray-500" : "text-green-300"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  !selectedFile.ms ? "text-gray-500" : "text-green-300"
                }`}
              >
                MS
              </span>
            </button>
          </div>
        </div>

        {/* Single Line Paper Information */}
        {paperInfo && (
          <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {paperInfo.board && (
                <span className="px-2 py-0.5 bg-blue-900/30 rounded-md text-blue-300 font-medium">
                  {paperInfo.board}
                </span>
              )}
              {paperInfo.subject && (
                <span className="font-medium">{paperInfo.subject}</span>
              )}
              {paperInfo.year && <span>• {paperInfo.year}</span>}
              {paperInfo.session && (
                <span className="capitalize">{paperInfo.session}</span>
              )}
              <span className="text-white font-semibold">
                • {paperInfo.paperName}
              </span>
              {splitView && (
                <span className="flex items-center space-x-1 text-green-400">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Split View</span>
                </span>
              )}
              {loading && (
                <span className="flex items-center space-x-1 text-blue-400">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Loading...</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Error Display */}
      {loadingError && (
        <div className="relative mx-3 mb-3 animate-in slide-in-from-top-2 duration-300">
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start space-x-3">
            <AlertTriangle
              size={16}
              className="text-red-400 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-red-300 text-xs leading-relaxed">
                {loadingError}
              </p>
            </div>
            <button
              onClick={() => setLoadingError(null)}
              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
          <div className="absolute -bottom-1 left-3 right-3 h-1 bg-red-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 animate-shrink origin-left"></div>
          </div>
        </div>
      )}

      {/* Paper Content */}
      <div className={`flex-1 relative bg-gray-900`}>
        {loading && (
          <LoadingIndicator error={loadingError} onRetry={handleRetry} />
        )}

        {splitView ? (
          // Split View - Show QP and current tab top and bottom
          <div className="flex flex-col h-full">
            {/* Question Paper (Top) */}
            <div className="h-1/2 border-b border-gray-600 bg-gray-900">
              {getCurrentTabUrl("qp") ? (
                <iframe
                  key={`qp-split-${selectedFile.name || activePath}`}
                  src={getCurrentTabUrl("qp")}
                  className="w-full h-full border-0"
                  title={`Question Paper - ${selectedFile.name || "Paper"}`}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center space-y-4 p-6 animate-in fade-in-50 duration-300">
                    <AlertTriangle
                      size={48}
                      className="text-yellow-500 mx-auto animate-bounce"
                    />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">
                        Question Paper Not Available
                      </h3>
                      <p className="text-gray-300 max-w-xs">
                        This paper doesn't have a question paper available.
                      </p>
                    </div>
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current Tab (Bottom) */}
            <div className="h-1/2 bg-gray-900">
              {getCurrentTabUrl() ? (
                <iframe
                  key={`${activeTab}-split-${selectedFile.name || activePath}`}
                  src={getCurrentTabUrl()}
                  className="w-full h-full border-0"
                  title={`${getTabName(activeTab)} - ${
                    selectedFile.name || "Paper"
                  }`}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center space-y-4 p-6 animate-in fade-in-50 duration-300">
                    <AlertTriangle
                      size={48}
                      className="text-yellow-500 mx-auto animate-bounce"
                    />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">
                        {getTabName(activeTab)} Not Available
                      </h3>
                      <p className="text-gray-300 max-w-xs">
                        This paper doesn't have a{" "}
                        {getTabName(activeTab).toLowerCase()} available.
                      </p>
                    </div>
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Single View
          <>
            {getCurrentTabUrl() ? (
              <iframe
                key={`${activeTab}-${selectedFile.name || activePath}`}
                src={getCurrentTabUrl()}
                className="w-full h-full border-0"
                title={`${getTabName(activeTab)} - ${
                  selectedFile.name || "Paper"
                }`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-800">
                <div className="text-center space-y-4 p-6 animate-in fade-in-50 duration-500">
                  <AlertTriangle
                    size={48}
                    className="text-yellow-500 mx-auto animate-bounce"
                  />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {getTabName(activeTab)} Not Available
                    </h3>
                    <p className="text-gray-300 max-w-xs">
                      This paper doesn't have a{" "}
                      {getTabName(activeTab).toLowerCase()} available.
                    </p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
