import React from "react";
import {
  FileText,
  X,
  BarChart2,
  BookOpen,
  PenTool,
  Brain,
  LogIn,
  HelpCircle,
} from "lucide-react";

export default function MobileSidebar({
  showMobileSidebar,
  setShowMobileSidebar,
  selectedFile,
  user,
}) {
  const handleNavigation = (path) => {
    setShowMobileSidebar(false);
    // For protected routes, redirect to login if user is not logged in
    if ((path === "/dashboard" || path === "/notes") && !user) {
      window.location.href = "/login";
    } else {
      window.location.href = path;
    }
  };

  return (
    <div
      id="mobileSidebarModal"
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] transition-opacity duration-300 ${
        showMobileSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setShowMobileSidebar(false)}
    >
      <div
        className={`bg-[#0D1321] w-3/4 max-w-xs h-full transition-transform duration-300 ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* App Logo/Title */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-500" />
            <h1 className="text-xl font-bold">Past Papers</h1>
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="p-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3">
            Main
          </h3>
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600"
              onClick={() => handleNavigation("/")}
            >
              <FileText size={20} />
              <span>Past Papers</span>
            </button>
          </div>

          <h3 className="text-xs uppercase text-gray-500 font-semibold mt-6 mb-3">
            Features
          </h3>
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white opacity-60"
              onClick={() => handleNavigation("/dashboard")}
            >
              <BarChart2 size={20} />
              <span>Dashboard</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white opacity-60"
              onClick={() => handleNavigation("/notes")}
            >
              <BookOpen size={20} />
              <span>Notes</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white opacity-60">
              <PenTool size={20} />
              <span>Topical Questions</span>
              <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded">
                Soon
              </span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white opacity-60">
              <Brain size={20} />
              <span>AI Mock Grader</span>
              <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded">
                Soon
              </span>
            </button>
          </div>

          <h3 className="text-xs uppercase text-gray-500 font-semibold mt-6 mb-3">
            Account
          </h3>
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => handleNavigation("/login")}
            >
              <LogIn size={20} />
              <span>Login</span>
            </button>
          </div>

          <h3 className="text-xs uppercase text-gray-500 font-semibold mt-6 mb-3">
            Support
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
              <HelpCircle size={20} />
              <span>Help & Support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
