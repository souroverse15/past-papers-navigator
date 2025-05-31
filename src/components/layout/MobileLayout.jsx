import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  File,
  Menu,
  X,
  User,
  BookOpen,
  Home,
  Search,
  Settings,
  BarChart2,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Enhanced MobileLayout component provides a consistent layout for mobile and tablet views
 * with a bottom navigation bar, slide-out sidebar, and responsive design
 */
export default function MobileLayout({ children, activePage = "papers" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, hasRole, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavigation = (route) => {
    navigate(route);
    closeSidebar();
  };

  // Enhanced navigation items
  const navigationItems = [
    {
      id: "papers",
      label: "Past Papers",
      icon: BookOpen,
      route: "/",
      description: "Browse and view past papers",
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart2,
      route: "/dashboard",
      description: "View your progress and stats",
      requiresAuth: true,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      route: "/help",
      description: "Get help and support",
    },
  ];

  // Check if current page is active
  const isActivePage = (pageId, route) => {
    if (pageId === activePage) return true;
    if (route === location.pathname) return true;
    return false;
  };

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return "/login";
    if (hasRole("Admin")) return "/admin";
    return "/dashboard";
  };

  return (
    <div className="relative h-screen w-screen bg-[#0D1321] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Enhanced Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-gradient-to-b from-[#141E33] to-[#0D1321] shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <File size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Past Papers</h1>
              <p className="text-xs text-gray-400">Navigator</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {navigationItems.map((item) => {
            // Skip items that require auth if user is not logged in
            if (item.requiresAuth && !user) return null;

            const Icon = item.icon;
            const route =
              item.id === "dashboard" ? getDashboardRoute() : item.route;
            const isActive = isActivePage(item.id, item.route);

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(route)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-lg"
                    : "hover:bg-gray-800/40 text-gray-300 hover:text-white"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? "bg-blue-500/20" : "bg-gray-800/50"
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-blue-400" : "text-gray-400"}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </button>
            );
          })}
        </div>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50">
          {user ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  closeSidebar();
                  navigate("/");
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavigation("/login")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="h-full pb-16 overflow-hidden">{children}</main>

      {/* Enhanced Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#141E33] to-[#0D1321] border-t border-gray-800/50 flex items-center z-40 backdrop-blur-sm">
        <div className="flex items-center justify-around w-full px-2">
          {/* Menu Button */}
          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center w-16 h-full text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={22} />
            <span className="text-xs mt-1">Menu</span>
          </button>

          {/* Papers Button */}
          <button
            onClick={() => handleNavigation("/")}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activePage === "papers"
                ? "text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen size={22} />
            <span className="text-xs mt-1">Papers</span>
            {activePage === "papers" && (
              <div className="w-1 h-1 bg-blue-400 rounded-full mt-0.5"></div>
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={() => {
              // For now, focus on search in papers page
              if (location.pathname !== "/") {
                handleNavigation("/");
              }
            }}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activePage === "search"
                ? "text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Search size={22} />
            <span className="text-xs mt-1">Search</span>
          </button>

          {/* Dashboard/Profile Button */}
          <button
            onClick={() =>
              handleNavigation(user ? getDashboardRoute() : "/login")
            }
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activePage === "dashboard"
                ? "text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {user ? <BarChart2 size={22} /> : <User size={22} />}
            <span className="text-xs mt-1">{user ? "Dashboard" : "Login"}</span>
            {activePage === "dashboard" && (
              <div className="w-1 h-1 bg-blue-400 rounded-full mt-0.5"></div>
            )}
          </button>

          {/* Help Button */}
          <button
            onClick={() => handleNavigation("/help")}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activePage === "help"
                ? "text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <HelpCircle size={22} />
            <span className="text-xs mt-1">Help</span>
            {activePage === "help" && (
              <div className="w-1 h-1 bg-blue-400 rounded-full mt-0.5"></div>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
