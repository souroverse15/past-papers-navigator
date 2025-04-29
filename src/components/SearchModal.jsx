import React from "react";
import { X } from "lucide-react";
import FileNavigator from "./FileNavigator";

export default function SearchModal({
  modalOpen,
  closeModal,
  searchQuery,
  setSearchQuery,
  fileStructure,
  onFileSelect,
  activePath,
  examMode,
  effectiveIsMobile,
}) {
  if (!modalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] transition-opacity duration-300"
      onClick={closeModal}
    >
      <div
        className="bg-[#0D1321] w-full max-w-md mx-auto h-5/6 mt-16 rounded-t-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Find Paper</h2>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Content */}
        <div className="h-full flex flex-col">
          <FileNavigator
            fileStructure={fileStructure}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFileSelect={onFileSelect}
            activePath={activePath}
            examMode={examMode}
            isMobile={effectiveIsMobile}
            closeModal={closeModal}
          />
        </div>
      </div>
    </div>
  );
}
