import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import IncidentDetails from "@/pages/IncidentDetails";
import Resources from "@/pages/Resources";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Accounts from "@/pages/Accounts";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RoleSwitcherModal } from "@/components/layout/RoleSwitcherModal";
import { useState, Suspense } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthProvider } from "@/context/AuthContext";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleRoleModal = () => {
    setIsRoleModalOpen(!isRoleModalOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-slate-900 text-textColor dark:text-slate-200">
      <ErrorBoundary>
        <Sidebar isOpen={isSidebarOpen} onRoleSwitch={toggleRoleModal} />
      </ErrorBoundary>
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <ErrorBoundary>
          <Header toggleSidebar={toggleSidebar} toggleRoleModal={toggleRoleModal} />
        </ErrorBoundary>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/incidents/:id" component={IncidentDetails} />
                <Route path="/resources" component={Resources} />
                <Route path="/accounts" component={Accounts} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route path="/:rest*" component={NotFound} />
              </Switch>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      
      <ErrorBoundary>
        <RoleSwitcherModal isOpen={isRoleModalOpen} onClose={toggleRoleModal} />
      </ErrorBoundary>
      <Toaster />
    </div>
  );
}

export default App;
