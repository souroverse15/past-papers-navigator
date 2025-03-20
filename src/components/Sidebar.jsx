import { useState, useEffect } from "react";
import {
  Menu,
  FileText,
  Home,
  BarChart2,
  BookOpen,
  Settings,
  LogIn,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  User,
  PenTool,
  Brain,
  Clock,
} from "lucide-react";

// Define sidebar sections for easy addition of new items
const SIDEBAR_SECTIONS = {
  MAIN: [
    {
      id: "home",
      icon: <Home size={20} />,
      text: "Home",
      path: "/",
      comingSoon: true,
    },
    {
      id: "papers",
      icon: <FileText size={20} />,
      text: "Past Papers",
      path: "/papers",
      isFileNavigator: true,
    },
  ],
  FEATURES: [
    {
      id: "dashboard",
      icon: <BarChart2 size={20} />,
      text: "Dashboard",
      path: "/dashboard",
      comingSoon: true,
    },
    {
      id: "notes",
      icon: <BookOpen size={20} />,
      text: "Notes",
      path: "/notes",
      comingSoon: true,
    },
    {
      id: "topical",
      icon: <PenTool size={20} />,
      text: "Topical Questions",
      path: "/topical",
      comingSoon: true,
    },
    {
      id: "ai-grader",
      icon: <Brain size={20} />,
      text: "AI Mock Grader",
      path: "/ai-grader",
      comingSoon: true,
    },
  ],
  ACCOUNT: [
    {
      id: "login",
      icon: <LogIn size={20} />,
      text: "Login",
      path: "/login",
      comingSoon: true,
    },
    {
      id: "profile",
      icon: <User size={20} />,
      text: "Profile",
      path: "/profile",
      comingSoon: true,
    },
  ],
  SUPPORT: [
    {
      id: "settings",
      icon: <Settings size={20} />,
      text: "Settings",
      path: "/settings",
    },
    {
      id: "help",
      icon: <HelpCircle size={20} />,
      text: "Help & Support",
      path: "/help",
    },
  ],
};

const Sidebar = ({
  onSelect,
  activePath = "/",
  onToggleFileNavigator,
  onCollapse,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [filePanelOpen, setFilePanelOpen] = useState(false); // Track file panel state

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

    if (item.isFileNavigator && onToggleFileNavigator) {
      // If this is the file navigator item and we have a toggle handler, call it
      // Toggle the file navigator panel when "Past Papers" is selected
      setFilePanelOpen(!filePanelOpen); // Toggle file panel state
      onToggleFileNavigator(); // No parameter means toggle
    } else if (onSelect) {
      // Otherwise, just call the regular onSelect handler
      onSelect(item.path);
    }
  };

  // Call onCollapse when collapsed state changes
  useEffect(() => {
    if (onCollapse) {
      onCollapse(collapsed);
    }
  }, [collapsed, onCollapse]);

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
          items={SIDEBAR_SECTIONS.MAIN}
          collapsed={collapsed}
          onSelect={handleSelect}
          activePath={activePath}
          filePanelOpen={filePanelOpen}
        />

        {/* Features Section */}
        <div className="mt-4">
          <SidebarSectionTitle title="Features" collapsed={collapsed} />
          <SidebarSection
            items={SIDEBAR_SECTIONS.FEATURES}
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
            items={SIDEBAR_SECTIONS.ACCOUNT}
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
          items={SIDEBAR_SECTIONS.SUPPORT}
          collapsed={collapsed}
          onSelect={handleSelect}
          activePath={activePath}
          filePanelOpen={filePanelOpen}
        />
      </div>
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
      <div
        className={`flex-shrink-0 ${
          collapsed && isPastPapersItem ? "animate-breathing text-blue-400" : ""
        }`}
      >
        {icon}
      </div>

      {/* Show arrow indicator for Past Papers when collapsed */}
      {collapsed && isPastPapersItem && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 text-blue-400">
          {filePanelOpen ? (
            <ChevronRight size={14} className="animate-arrow-pulse" />
          ) : (
            <ChevronLeft size={14} className="animate-arrow-pulse" />
          )}
        </div>
      )}

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
