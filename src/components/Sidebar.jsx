import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Menu,
  FileText,
  BarChart2,
  BookOpen,
  Settings,
  LogIn,
  LogOut,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  User,
  PenTool,
  Brain,
  ShieldCheck,
  Zap,
  GraduationCap,
  Flame,
  Users,
  Files,
  FileEdit,
  AlertTriangle,
} from "lucide-react";

// Define sidebar sections for easy addition of new items
const SIDEBAR_SECTIONS = {
  MAIN: [
    {
      id: "papers",
      icon: <FileText size={20} />,
      text: "Past Papers",
      path: "/",
      isFileNavigator: true,
    },
  ],
  FEATURES: [
    {
      id: "dashboard",
      icon: <BarChart2 size={20} />,
      text: "Dashboard",
      path: "/dashboard",
      requiresAuth: true,
    },
    {
      id: "admin-dashboard",
      icon: <ShieldCheck size={20} />,
      text: "Admin Dashboard",
      path: "/admin",
      requiresAuth: true,
      requiredRole: "Admin",
    },
    {
      id: "notes",
      icon: <BookOpen size={20} />,
      text: "Notes",
      path: "/notes",
      requiresAuth: true,
    },
    {
      id: "topical",
      icon: <PenTool size={20} />,
      text: "Topical Questions",
      path: "/topical",
      comingSoon: true,
      requiresAuth: true,
    },
    {
      id: "ai-grader",
      icon: <Brain size={20} />,
      text: "AI Mock Grader",
      path: "/ai-grader",
      comingSoon: true,
      requiresAuth: true,
    },
  ],
  ACCOUNT: [
    {
      id: "login",
      icon: <LogIn size={20} />,
      text: "Login",
      path: "/login",
      hideWhenLoggedIn: true,
    },
    {
      id: "logout",
      icon: <LogOut size={20} />,
      text: "Logout",
      action: "logout",
      showWhenLoggedIn: true,
      requiresAuth: true,
    },
  ],
  SUPPORT: [
    {
      id: "help",
      icon: <HelpCircle size={20} />,
      text: "Help & Support",
      path: "/help",
    },
  ],
};

const Sidebar = ({ onToggleFileNavigator, onCollapse }) => {
  const { user, isAuthenticated, handleLogout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [filePanelOpen, setFilePanelOpen] = useState(true); // Changed to true as default
  const [activePath, setActivePath] = useState("/");

  // Handle keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+B (or Cmd+B on Mac) to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault(); // Prevent default browser behavior
        setCollapsed((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (item) => {
    if (item.comingSoon) {
      // Don't do anything for "coming soon" items
      return;
    }

    if (item.action === "logout") {
      handleLogout();
      navigate("/");
      return;
    }

    // Navigate to the path first
    if (item.path) {
      navigate(item.path);
      setActivePath(item.path);
    }
  };

  // Call onCollapse when collapsed state changes
  useEffect(() => {
    if (onCollapse) {
      onCollapse(collapsed);
    }
  }, [collapsed, onCollapse]);

  // Filter menu items based on authentication state and user role
  const filterMenuItems = (items) => {
    return items.filter((item) => {
      // Hide dev-only items in production
      if (item.devOnly && import.meta.env.PROD) return false;

      // Hide items that require auth if not authenticated
      if (item.requiresAuth && !isAuthenticated()) return false;

      // Hide items that require specific role
      if (item.requiredRole && !hasRole(item.requiredRole)) return false;

      // Hide items marked to hide when logged in
      if (item.hideWhenLoggedIn && isAuthenticated()) return false;

      // Hide items marked to show only when logged in
      if (item.showWhenLoggedIn && !isAuthenticated()) return false;

      return true;
    });
  };

  return (
    <div
      className={`h-screen bg-[#0D1321] text-white shadow-2xl drop-shadow-xl flex flex-col justify-between ${
        collapsed ? "w-14" : "w-64"
      } transition-all duration-300 relative`}
    >
      {/* App Logo/Title - Clickable to toggle sidebar */}
      <div
        className="flex items-center py-4 px-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <FileText size={24} className="text-blue-500" />
        ) : (
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-blue-500" />
            <h1 className="text-xl font-bold">SouroVerse</h1>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {/* Main Section */}
        <SidebarSection
          items={filterMenuItems(SIDEBAR_SECTIONS.MAIN)}
          collapsed={collapsed}
          onSelect={handleSelect}
          activePath={activePath}
          filePanelOpen={filePanelOpen}
        />

        {/* Features Section */}
        <div className="mt-4">
          <SidebarSectionTitle title="Features" collapsed={collapsed} />
          <SidebarSection
            items={filterMenuItems(SIDEBAR_SECTIONS.FEATURES)}
            collapsed={collapsed}
            onSelect={handleSelect}
            activePath={activePath}
            filePanelOpen={filePanelOpen}
          />
        </div>

        {/* Account Section */}
        <div className="mt-4">
          <SidebarSectionTitle title="Account" collapsed={collapsed} />
          <SidebarSection
            items={filterMenuItems(SIDEBAR_SECTIONS.ACCOUNT)}
            collapsed={collapsed}
            onSelect={handleSelect}
            activePath={activePath}
            filePanelOpen={filePanelOpen}
          />
        </div>
      </div>

      {/* Support Section */}
      <div className="py-3 px-2 border-t border-gray-800">
        <SidebarSection
          items={filterMenuItems(SIDEBAR_SECTIONS.SUPPORT)}
          collapsed={collapsed}
          onSelect={handleSelect}
          activePath={activePath}
          filePanelOpen={filePanelOpen}
        />
      </div>

      {/* User profile section - when logged in */}
      {isAuthenticated() && (
        <div className="border-t border-gray-800 p-2">
          <div
            className={`flex items-center gap-3 p-2 rounded-lg bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                className={`rounded-full object-cover border-2 border-blue-500/30 ${
                  collapsed ? "w-8 h-8" : "w-10 h-10"
                }`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `<div class="${
                    collapsed ? "w-8 h-8" : "w-10 h-10"
                  } rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30">${
                    user?.name?.charAt(0) || user?.email?.charAt(0) || "U"
                  }</div>`;
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30 ${
                  collapsed ? "w-8 h-8" : "w-10 h-10"
                }`}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-400">{user?.role || "User"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarSectionTitle = ({ title, collapsed }) => {
  if (collapsed) return null;

  return (
    <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">
      {title}
    </h3>
  );
};

const SidebarSection = ({
  items,
  collapsed,
  onSelect,
  activePath,
  filePanelOpen,
}) => {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          collapsed={collapsed}
          isActive={activePath === item.path}
          onSelect={() => onSelect(item)}
          filePanelOpen={filePanelOpen}
        />
      ))}
    </div>
  );
};

const SidebarItem = ({
  item,
  collapsed,
  isActive,
  onSelect,
  filePanelOpen,
}) => {
  const { id, icon, text, comingSoon } = item;

  // Check if this is the Past Papers item
  const isPastPapersItem = id === "papers";

  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer relative
        ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }
        ${comingSoon ? "opacity-40" : ""}
        transition-all duration-200`}
      onClick={onSelect}
      title={comingSoon ? `${text} - Coming Soon` : text}
    >
      <div className="flex-shrink-0">{icon}</div>

      {!collapsed && (
        <>
          <span className="text-sm font-medium">{text}</span>
          {comingSoon && (
            <span className="ml-auto text-xs text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-800/50">
              Soon
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar;
