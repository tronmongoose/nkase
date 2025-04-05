import { useAuth } from "@/context/AuthContext";
import { Menu, Search, Bell } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleRoleModal: () => void;
}

export const Header = ({ toggleSidebar, toggleRoleModal }: HeaderProps) => {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-800 shadow dark:shadow-slate-700/30">
      <button 
        className="md:hidden px-4 text-slate-500 dark:text-slate-400 focus:outline-none"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex items-center justify-between">
        <div className="flex-1 flex items-center">
          <div className="max-w-lg w-full">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                id="search" 
                name="search" 
                className="block w-full bg-slate-50 dark:bg-slate-700 border-transparent rounded-md pl-10 pr-3 py-2 text-sm placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Search incidents or resources..." 
                type="search"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          <button className="p-1 rounded-full text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none">
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="ml-3 relative">
            <button 
              className="max-w-xs bg-white dark:bg-slate-800 rounded-full flex items-center text-sm focus:outline-none"
              onClick={toggleUserMenu}
            >
              <span className="sr-only">Open user menu</span>
              <img 
                className="h-8 w-8 rounded-full"
                src={user?.avatarUrl || "https://via.placeholder.com/32"}
                alt="User profile"
              />
            </button>
            
            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5" role="menu">
                <div className="py-1" role="none">
                  <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">Your Profile</a>
                  <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">Settings</a>
                  <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">Sign out</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
