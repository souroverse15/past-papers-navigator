import React from "react";
import {
  Menu,
  FileText,
  Download,
  BookMarked,
  User,
  BarChart2,
} from "lucide-react";

export default function MobileBottomBar({
  setShowMobileSidebar,
  openModal,
  selectedFile,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 z-50">
      <div className="flex justify-around items-center">
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
        >
          <Menu size={20} />
          <span className="text-xs mt-1">Menu</span>
        </button>

        <button
          onClick={openModal}
          className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
        >
          <FileText size={20} />
          <span className="text-xs mt-1">Papers</span>
        </button>

        {/* If a file is selected, show download buttons */}
        {selectedFile ? (
          <>
            <a
              href={selectedFile.qp.replace("/preview", "/view")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
            >
              <Download size={20} />
              <span className="text-xs mt-1">QP</span>
            </a>

            {selectedFile.ms ? (
              <a
                href={selectedFile.ms.replace("/preview", "/view")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
              >
                <BookMarked size={20} />
                <span className="text-xs mt-1">MS</span>
              </a>
            ) : (
              <button
                onClick={() => (window.location.href = "/login")}
                className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
              >
                <User size={20} />
                <span className="text-xs mt-1">Login</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
            >
              <BarChart2 size={20} />
              <span className="text-xs mt-1">Dashboard</span>
            </button>

            <button
              onClick={() => (window.location.href = "/login")}
              className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
            >
              <User size={20} />
              <span className="text-xs mt-1">Login</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
