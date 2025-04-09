import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Bell, 
  Cog, 
  FileText, 
  Home, 
  Moon, 
  Sun,
  Cloud,
  ShieldCheck
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onRoleSwitch: () => void;
}

export const Sidebar = ({ isOpen, onRoleSwitch }: SidebarProps) => {
  const { user, roleName } = useAuth();
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for system/saved theme preference
  useEffect(() => {
    if (localStorage.getItem('color-theme') === 'dark' || 
      (!localStorage.getItem('color-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    }
  };

  // Navigation items - Merged Dashboard and Incidents
  const navItems = [
    { icon: <Bell className="h-5 w-5 mr-2" />, name: "Incident Dashboard", path: "/" , activePaths: ["/", "/incidents"]},
    { icon: <FileText className="h-5 w-5 mr-2" />, name: "Resources", path: "/resources" },
    { icon: <Cloud className="h-5 w-5 mr-2" />, name: "Cloud Accounts", path: "/accounts" },
    { icon: <ShieldCheck className="h-5 w-5 mr-2" />, name: "Compliance", path: "/compliance" },
    { icon: <BarChart3 className="h-5 w-5 mr-2" />, name: "Reports", path: "/reports" },
    { icon: <Cog className="h-5 w-5 mr-2" />, name: "Settings", path: "/settings" },
  ];

  // Desktop sidebar class
  const desktopClass = "hidden md:flex md:flex-shrink-0";
  // Mobile sidebar class (toggled)
  const mobileClass = "fixed inset-0 z-40 md:hidden flex";

  const sidebarClass = isOpen ? mobileClass : desktopClass;

  return (
    <div className={sidebarClass}>
      <div className="flex flex-col w-64 border-r border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="ml-2 flex flex-col">
              <span className="text-sm font-semibold">NKASE</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Always here just NKASE</span>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <img 
                className="h-10 w-10 rounded-full" 
                src={user?.avatarUrl || "https://via.placeholder.com/40"} 
                alt="User profile"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName || "User"}</p>
              <div className="flex items-center">
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                  {roleName}
                </span>
                <button 
                  className="ml-1 text-xs text-slate-500 dark:text-slate-400"
                  onClick={onRoleSwitch}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-4 flex-grow overflow-y-auto">
          <div className="px-2 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center px-2 py-2 text-sm rounded-md ${
                  item.activePaths?.some(path => location.startsWith(path)) || location === item.path
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Theme toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            className="flex items-center justify-between w-full px-2 py-2 text-sm rounded-md text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={toggleTheme}
          >
            <span className="flex items-center">
              {isDarkMode ? (
                <Moon className="h-5 w-5 mr-2" />
              ) : (
                <Sun className="h-5 w-5 mr-2" />
              )}
              <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            </span>
            <div className="relative inline-block w-10 align-middle select-none">
              <div className={`block w-10 h-6 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white dark:bg-slate-400 w-4 h-4 rounded-full transition-transform ${isDarkMode ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};