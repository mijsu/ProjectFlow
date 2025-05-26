import TopBar from "@/components/layout/TopBar";
import StatsOverview from "@/components/dashboard/StatsOverview";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import ActiveProjects from "@/components/dashboard/ActiveProjects";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Dashboard" 
        subtitle={`Welcome back, ${user?.displayName || "User"}!`} 
      />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <StatsOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <RecentActivity />
          <QuickActions />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveProjects />
          <RecentDocuments />
        </div>
      </div>
    </div>
  );
}
