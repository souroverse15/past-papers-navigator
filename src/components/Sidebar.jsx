import { useState } from "react";
import {
  Menu,
  Folder,
  FileText,
  MessageSquare,
  Grid,
  Users,
  Info,
  LogOut,
} from "lucide-react";

const Sidebar = ({ onSelect }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-screen bg-white shadow-md flex flex-col justify-between ${
        collapsed ? "w-16" : "w-60"
      } transition-all duration-300`}
    >
      {/* Top Section */}
      <div className="flex flex-col items-center py-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-600 hover:bg-gray-200 p-3 rounded-full transition-all duration-200"
        >
          <Menu size={24} />
        </button>

        <nav className="mt-4 flex flex-col gap-6">
          <SidebarItem
            icon={<Folder size={24} />}
            text="Files"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<FileText size={24} />}
            text="Documents"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<MessageSquare size={24} />}
            text="Messages"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<Grid size={24} />}
            text="Dashboard"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<Users size={24} />}
            text="Users"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<Info size={24} />}
            text="Info"
            collapsed={collapsed}
          />
        </nav>
      </div>

      {/* Logout Section */}
      <div className="flex flex-col items-center pb-4">
        <SidebarItem
          icon={<LogOut size={24} />}
          text="Logout"
          collapsed={collapsed}
        />
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, collapsed }) => {
  return (
    <div className="flex items-center gap-4 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-md cursor-pointer transition-all duration-200">
      {icon}
      {!collapsed && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
};

export default Sidebar;
