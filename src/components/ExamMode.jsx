import React, { useRef, useEffect, useState } from "react";
import { Clock, Lock, AlertTriangle, ShieldAlert, Clock3 } from "lucide-react";
import Timer from "./Timer";
import { getPDFViewerUrl } from "../config/api";

export default function ExamMode({
  selectedFile,
  examContainerRef,
  timerDuration,
  handleExamModeChange,
  setIsFullscreen,
}) {
  // Loading states for PDF
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reset loading state when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      setPdfLoading(true);
      setPdfError(null);
      setRetryCount(0);
    }
  }, [selectedFile]);

  // Handle iframe load events
  const handlePdfLoad = () => {
    setPdfLoading(false);
    setPdfError(null);
    setRetryCount(0);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    if (retryCount < 2) {
      setPdfError(`Loading Question Paper... Retry ${retryCount + 1}/3`);
      setRetryCount((prev) => prev + 1);
      setTimeout(() => {
        setPdfLoading(true);
        setPdfError(null);
      }, 2000);
    } else {
      setPdfError("Failed to load Question Paper. Please refresh the page.");
    }
  };

  // Manual retry function
  const retryPdf = () => {
    setPdfLoading(true);
    setPdfError(null);
    setRetryCount(0);
  };

  // Loading component
  const LoadingIndicator = ({ error, onRetry }) => (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-10">
      {error ? (
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-300 mb-2">Loading Question Paper...</p>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            This may take a few moments
          </p>
        </div>
      )}
    </div>
  );

  // Request fullscreen when component mounts
  useEffect(() => {
    if (examContainerRef.current) {
      setTimeout(() => {
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
      }, 100);
    }
  }, [examContainerRef, setIsFullscreen]);

  return (
    <div className="h-screen w-full bg-[#0D1321] flex flex-col overflow-hidden">
      {/* Improved Exam Mode Warning Banner */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 border-b border-red-700/50 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

        <div className="flex items-center h-10 whitespace-nowrap animate-marquee relative z-10">
          <div className="flex space-x-6 items-center">
            <span className="font-bold text-lg font-mono tracking-wider flex items-center bg-red-950/40 px-3 py-1 rounded-md border border-red-700/30">
              <ShieldAlert
                size={18}
                className="animate-pulse mr-2 text-red-300"
              />
              <span className="text-red-100">MOCK MODE ACTIVE</span>
            </span>

            <span className="text-yellow-200 text-sm flex items-center bg-yellow-950/40 px-3 py-1.5 rounded-md border border-yellow-700/30">
              <AlertTriangle size={15} className="mr-1.5 text-yellow-300" />
              <span className="font-mono tracking-wider">
                PRESSING ESC WILL END THE MOCK WITH SCORE OF ZERO
              </span>
            </span>

            <span className="font-bold text-lg font-mono tracking-wider flex items-center bg-red-950/40 px-3 py-1 rounded-md border border-red-700/30">
              <Lock size={18} className="mr-2 text-red-300" />
              <span className="text-red-100">EXAM ENVIRONMENT LOCKED</span>
            </span>

            <span className="text-yellow-200 text-sm flex items-center bg-yellow-950/40 px-3 py-1.5 rounded-md border border-yellow-700/30">
              <AlertTriangle size={15} className="mr-1.5 text-yellow-300" />
              <span className="font-mono tracking-wider">
                EXITING FULLSCREEN WILL END THE MOCK
              </span>
            </span>

            <span className="font-bold text-lg font-mono tracking-wider flex items-center bg-red-950/40 px-3 py-1 rounded-md border border-red-700/30">
              <Clock3 size={18} className="animate-pulse mr-2 text-red-300" />
              <span className="text-red-100">MOCK MODE ACTIVE</span>
            </span>

            <span className="text-yellow-200 text-sm flex items-center bg-yellow-950/40 px-3 py-1.5 rounded-md border border-yellow-700/30">
              <AlertTriangle size={15} className="mr-1.5 text-yellow-300" />
              <span className="font-mono tracking-wider">
                PRESSING ESC WILL END THE MOCK WITH SCORE OF ZERO
              </span>
            </span>

            <span className="font-bold text-lg font-mono tracking-wider flex items-center bg-red-950/40 px-3 py-1 rounded-md border border-red-700/30">
              <Lock size={18} className="mr-2 text-red-300" />
              <span className="text-red-100">EXAM ENVIRONMENT LOCKED</span>
            </span>

            <span className="text-yellow-200 text-sm flex items-center bg-yellow-950/40 px-3 py-1.5 rounded-md border border-yellow-700/30">
              <AlertTriangle size={15} className="mr-1.5 text-yellow-300" />
              <span className="font-mono tracking-wider">
                EXITING FULLSCREEN WILL END THE MOCK
              </span>
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
      </div>

      {/* Single Navbar with Timer for Exam Mode */}
      <div className="flex items-center justify-center p-2 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        {/* Timer Component - Centered */}
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
            }, 100);
          }}
          paperInfo={{
            subject: selectedFile?.path
              ? selectedFile.path.split("/")[1]
              : "Unknown",
            paperCode: selectedFile?.name || "Unknown",
            year: selectedFile?.path
              ? selectedFile.path.split("/")[2] || null
              : null,
            session: selectedFile?.path
              ? selectedFile.path.split("/")[3] || null
              : null,
            examBoard: selectedFile?.path
              ? selectedFile.path.split("/")[0]
              : "Unknown",
            rawPath: selectedFile?.path || null,
            fullPath: selectedFile?.path,
            file: selectedFile,
            pathParts: selectedFile?.path ? selectedFile.path.split("/") : [],
          }}
        />
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="bg-gray-800 rounded-xl overflow-hidden h-full relative">
          {pdfLoading && (
            <LoadingIndicator error={pdfError} onRetry={retryPdf} />
          )}
          <iframe
            src={getPDFViewerUrl(selectedFile.qp)}
            className="w-full h-full"
            allow="autoplay"
            allowFullScreen
            scrolling="yes"
            style={{
              minHeight: "100%",
              minWidth: "100%",
              display: "block",
              border: "none",
            }}
            onLoad={handlePdfLoad}
            onError={handlePdfError}
          />
        </div>
      </div>
    </div>
  );
}
