import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Menu,
  FileText,
  BarChart2,
  Settings,
  LogIn,
  LogOut,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  User,
  ShieldCheck,
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
  const [filePanelOpen, setFilePanelOpen] = useState(true);
  const [activePath, setActivePath] = useState("/");

  // Handle keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+B (or Cmd+B on Mac) to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (item) => {
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
            <h1 className="text-xl font-bold">Past Papers Navigator</h1>
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
        {filterMenuItems(SIDEBAR_SECTIONS.FEATURES).length > 0 && (
          <>
            <SidebarSectionTitle title="Features" collapsed={collapsed} />
            <SidebarSection
              items={filterMenuItems(SIDEBAR_SECTIONS.FEATURES)}
              collapsed={collapsed}
              onSelect={handleSelect}
              activePath={activePath}
              filePanelOpen={filePanelOpen}
            />
          </>
        )}

        {/* Account Section */}
        <SidebarSectionTitle title="Account" collapsed={collapsed} />
        <SidebarSection
          items={filterMenuItems(SIDEBAR_SECTIONS.ACCOUNT)}
          collapsed={collapsed}
          onSelect={handleSelect}
          activePath={activePath}
          filePanelOpen={filePanelOpen}
        />

        {/* Support Section */}
        <SidebarSectionTitle title="Support" collapsed={collapsed} />
        <SidebarSection
          items={filterMenuItems(SIDEBAR_SECTIONS.SUPPORT)}
          collapsed={collapsed}
          onSelect={handleSelect}
          activePath={activePath}
          filePanelOpen={filePanelOpen}
        />
      </div>

      {/* User Profile Section */}
      {user && !collapsed && (
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
            <div className="h-8 w-8 rounded-full bg-blue-600/30 flex items-center justify-center">
              <User size={16} className="text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle Button */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={20} className="text-gray-400" />
          ) : (
            <ChevronLeft size={20} className="text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

// Helper component for section titles
const SidebarSectionTitle = ({ title, collapsed }) => {
  if (collapsed) return null;

  return (
    <h3 className="text-xs uppercase text-gray-500 font-semibold mt-6 mb-2 px-2">
      {title}
    </h3>
  );
};

// Helper component for sidebar sections
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
          onSelect={onSelect}
          filePanelOpen={filePanelOpen}
        />
      ))}
    </div>
  );
};

// Helper component for individual sidebar items
const SidebarItem = ({
  item,
  collapsed,
  isActive,
  onSelect,
  filePanelOpen,
}) => {
  const baseClasses = `
    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
    transition-all duration-200 group relative
  `;

  const activeClasses = isActive
    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
    : "hover:bg-gray-800/60 text-gray-300 hover:text-white";

  const disabledClasses = item.comingSoon
    ? "opacity-60 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
      onClick={() => onSelect(item)}
      disabled={item.comingSoon}
      title={collapsed ? item.text : undefined}
    >
      <div className="flex-shrink-0">{item.icon}</div>

      {!collapsed && (
        <>
          <span className="flex-1 text-left">{item.text}</span>
          {item.comingSoon && (
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
              Soon
            </span>
          )}
          {item.isFileNavigator && (
            <ChevronRight
              size={16}
              className={`transition-transform duration-200 ${
                filePanelOpen ? "rotate-90" : ""
              }`}
            />
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {item.text}
        </div>
      )}
    </button>
  );
};

export default Sidebar;
