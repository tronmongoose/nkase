import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Define user roles
export type UserRole = "incident_responder" | "soc_analyst" | "incident_manager" | "ciso";

// Define user type
export type User = {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
};

// Define context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  switchRole: (role: UserRole) => void;
  roleName: string;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>("incident_responder");
  
  // Fetch user data
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: 3,
  });
  
  // Role switching function
  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };
  
  // Map role to readable name
  const getRoleName = (role: UserRole): string => {
    switch(role) {
      case "incident_responder":
        return "Incident Responder";
      case "soc_analyst":
        return "SOC Analyst";
      case "incident_manager":
        return "Incident Manager";
      case "ciso":
        return "CISO";
      default:
        return "Incident Responder";
    }
  };
  
  // If user is loaded, but has different role than state, update the user
  const currentUser = user ? {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: currentRole
  } as User : null;
  
  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoading,
        error: error as Error | null,
        switchRole,
        roleName: currentUser ? getRoleName(currentUser.role) : "",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
