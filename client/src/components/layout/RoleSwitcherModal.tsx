import { useAuth, UserRole } from "@/context/AuthContext";
import { User, Shield, ClipboardList, BarChart3 } from "lucide-react";

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal = ({ isOpen, onClose }: RoleSwitcherModalProps) => {
  const { switchRole, user } = useAuth();
  
  if (!isOpen) return null;
  
  const roles: { role: UserRole; name: string; description: string; icon: JSX.Element }[] = [
    {
      role: "incident_responder",
      name: "Incident Responder", 
      description: "Handle and investigate active security incidents",
      icon: <User className="h-6 w-6 text-blue-600 dark:text-blue-200" />
    },
    {
      role: "soc_analyst",
      name: "SOC Analyst", 
      description: "Monitor alerts and perform initial triage",
      icon: <Shield className="h-6 w-6 text-slate-600 dark:text-slate-300" />
    },
    {
      role: "incident_manager",
      name: "Incident Manager", 
      description: "Coordinate response and manage escalation",
      icon: <ClipboardList className="h-6 w-6 text-slate-600 dark:text-slate-300" />
    },
    {
      role: "ciso",
      name: "CISO", 
      description: "Executive overview and security metrics",
      icon: <BarChart3 className="h-6 w-6 text-slate-600 dark:text-slate-300" />
    }
  ];
  
  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-500 opacity-75 dark:bg-slate-900 dark:opacity-90"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-200" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title">
                  Switch Security Role
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a role to view the dashboard from a different perspective. Each role has its own view with relevant information and actions.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="grid grid-cols-1 gap-4">
                {roles.map((roleItem) => (
                  <button
                    key={roleItem.role}
                    className={`relative border rounded-lg p-4 flex flex-col ${
                      user?.role === roleItem.role
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                    onClick={() => handleSwitchRole(roleItem.role)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        {roleItem.icon}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">{roleItem.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{roleItem.description}</p>
                      </div>
                    </div>
                    {user?.role === roleItem.role && (
                      <div className="absolute top-3 right-3">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
