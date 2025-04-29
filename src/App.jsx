import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PastPapersNavigator from "./components/PastPapersNavigator";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import AdminPage from "./components/AdminPage";
import FirestoreDebug from "./components/FirestoreDebug";
import FirestoreRolesDebug from "./components/FirestoreRolesDebug";
import TokenDebug from "./components/TokenDebug";
import RoleCheckDebug from "./components/RoleCheckDebug";
import DashboardRedirect from "./components/DashboardRedirect";
import HelpSupport from "./components/HelpSupport";
import {
  FileText,
  X,
  BarChart2,
  BookOpen,
  PenTool,
  Brain,
  LogIn,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  User,
  ShieldCheck,
} from "lucide-react";

// Wrapper component to include mobile UI for any content
const MobileUIWrapper = ({ children }) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { user, hasRole, handleLogout } = useAuth();

  const handleNavigation = (path) => {
    setShowMobileSidebar(false);
    // For protected routes, redirect to login if user is not logged in
    if (
      (path === "/dashboard" ||
        path === "/notes" ||
        path === "/admin" ||
        path === "/help") &&
      !user
    ) {
      window.location.href = "/login";
    } else {
      window.location.href = path;
    }
  };

  // Determine which dashboard to show based on user role
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (hasRole("Admin")) return "/admin";
    return "/dashboard";
  };

  return (
    <>
      {children}

      {/* Mobile Sidebar Modal for app navigation */}
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
              {user && (
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => handleNavigation(getDashboardPath())}
                >
                  <BarChart2 size={20} />
                  <span>Dashboard</span>
                </button>
              )}

              {user && hasRole("Admin") && (
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => handleNavigation("/admin")}
                >
                  <ShieldCheck size={20} />
                  <span>Admin Dashboard</span>
                </button>
              )}

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
              {!user ? (
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => handleNavigation("/login")}
                >
                  <LogIn size={20} />
                  <span>Login</span>
                </button>
              ) : (
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => {
                    handleLogout();
                    setShowMobileSidebar(false);
                    window.location.href = "/";
                  }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              )}
            </div>

            <h3 className="text-xs uppercase text-gray-500 font-semibold mt-6 mb-3">
              Support
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => handleNavigation("/help")}
              >
                <HelpCircle size={20} />
                <span>Help & Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom App Bar */}
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
            onClick={() => handleNavigation("/")}
            className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
          >
            <FileText size={20} />
            <span className="text-xs mt-1">Papers</span>
          </button>

          <button
            onClick={() => handleNavigation(getDashboardPath())}
            className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
          >
            <BarChart2 size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>

          <button
            onClick={() => handleNavigation("/help")}
            className="flex flex-col items-center p-2 text-gray-300 hover:text-white"
          >
            <HelpCircle size={20} />
            <span className="text-xs mt-1">Help</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Updated Notes component with a nicer coming soon UI
const Notes = () => (
  <div className="min-h-screen bg-[#0D1321] text-white p-4 flex flex-col items-center justify-center">
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 max-w-md w-full shadow-xl text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
        <div className="relative bg-gray-900 rounded-full p-4 border border-blue-500/30 inline-block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        NOTES
      </h1>
      <div className="mb-6 relative">
        <span className="bg-blue-600/20 text-blue-300 font-semibold px-3 py-1 rounded-full text-sm border border-blue-500/30">
          Coming Soon
        </span>
      </div>
      <p className="text-gray-300 mb-6">
        We're working hard to bring you an integrated notes feature that will
        help you organize your study materials alongside past papers.
      </p>
      <div className="bg-gray-900/70 rounded-lg p-4 text-left border border-gray-700">
        <h3 className="text-blue-300 text-sm font-semibold mb-2">
          Planned Features:
        </h3>
        <ul className="text-gray-400 text-sm space-y-2">
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Create and organize study notes by subject</span>
          </li>

          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Rich text formatting with math equation support</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

function App() {
  const { user, handleLogout } = useAuth();
  const [sidebarFileNavigatorOpen, setSidebarFileNavigatorOpen] =
    useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // No longer needed as the collapse is now handled by the CollapsibleFileNavigator component
  // Maintain this for compatibility with existing code but it no longer toggles the navigator
  const toggleFileNavigator = () => {
    console.log(
      "toggleFileNavigator called in App.jsx but no longer functional"
    );
    // Not changing the state anymore, it should always remain true
  };

  return (
    <Router>
      <div className="app-container">
        {/* Only show the sidebar on desktop */}
        {!isMobile && (
          <Sidebar
            isLoggedIn={!!user}
            onLogout={handleLogout}
            onToggleFileNavigator={toggleFileNavigator}
          />
        )}

        <div className="main-content">
          <Routes>
            {/* Public route - accessible to all */}
            <Route
              path="/"
              element={
                <PastPapersNavigator
                  sidebarFileNavigatorOpen={sidebarFileNavigatorOpen}
                  onToggleFileNavigator={toggleFileNavigator}
                  isMobileApp={isMobile}
                />
              }
            />

            {/* Role-specific dashboards */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {/* Debug link for admin */}
                  {user?.email === "souroveahmed15@gmail.com" && (
                    <div className="fixed top-2 right-2 z-50 flex gap-2">
                      <Link
                        to="/role-check"
                        className="bg-purple-600 text-white px-3 py-1 text-sm rounded hover:bg-purple-700"
                      >
                        Debug Roles
                      </Link>
                    </div>
                  )}

                  {/* Redirect to the appropriate dashboard based on user role */}
                  {user?.email === "souroveahmed15@gmail.com" ? (
                    <Navigate to="/admin" />
                  ) : (
                    <UserDashboard />
                  )}
                </ProtectedRoute>
              }
            />

            {/* Protected routes - require authentication */}
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  {isMobile ? (
                    <MobileUIWrapper>
                      <Notes />
                    </MobileUIWrapper>
                  ) : (
                    <Notes />
                  )}
                </ProtectedRoute>
              }
            />

            {/* Help & Support route */}
            <Route
              path="/help"
              element={
                isMobile ? (
                  <MobileUIWrapper>
                    <HelpSupport />
                  </MobileUIWrapper>
                ) : (
                  <HelpSupport />
                )
              }
            />

            {/* Explicit login route */}
            <Route
              path="/login"
              element={
                isMobile ? (
                  <MobileUIWrapper>
                    <Login />
                  </MobileUIWrapper>
                ) : (
                  <Login />
                )
              }
            />

            {/* Admin Debug Page */}
            <Route path="/admin-debug" element={<AdminPage />} />

            {/* Firestore Debug Page */}
            <Route path="/firestore-debug" element={<FirestoreDebug />} />

            {/* Firestore Roles Debug Page */}
            <Route path="/roles-debug" element={<FirestoreRolesDebug />} />

            {/* Token Debug Page */}
            <Route path="/token-debug" element={<TokenDebug />} />

            {/* Role Check Debug Page */}
            <Route path="/role-check" element={<RoleCheckDebug />} />

            {/* Dashboard Selector */}
            <Route path="/dashboards" element={<DashboardRedirect />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
