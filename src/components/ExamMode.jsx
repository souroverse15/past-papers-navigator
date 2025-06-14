import React, { useRef, useEffect } from "react";
import { Clock, Lock, AlertTriangle, ShieldAlert, Clock3 } from "lucide-react";
import Timer from "./Timer";

export default function ExamMode({
  selectedFile,
  examContainerRef,
  timerDuration,
  handleExamModeChange,
  setIsFullscreen,
}) {
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
        <div className="bg-gray-800 rounded-xl overflow-hidden h-full">
          <iframe
            src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(
              selectedFile.qp
            )}`}
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
          />
        </div>
      </div>
    </div>
  );
}
