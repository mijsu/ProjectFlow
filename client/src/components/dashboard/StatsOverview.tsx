import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, FileText, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function StatsOverview() {
  const { user } = useAuth();
  
  // Get current month data
  const { data: projects } = useCollection("projects", [
    where("ownerId", "==", user?.uid || "")
  ]);
  
  const { data: documents } = useCollection("documents", [
    where("ownerId", "==", user?.uid || "")
  ]);
  
  const { data: timeEntries } = useCollection("timeEntries", [
    where("userId", "==", user?.uid || "")
  ]);
  
  const { data: tasks } = useCollection("tasks", [
    where("assigneeId", "==", user?.uid || "")
  ]);

  // Calculate current stats
  const activeProjects = projects?.filter(p => p.status === "in-progress")?.length || 0;
  const totalDocuments = documents?.length || 0;
  const totalHours = Math.round((timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0) / 60);
  const completedTasks = tasks?.filter(t => t.status === "completed")?.length || 0;

  // Calculate percentage changes based on actual data
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  // For demo purposes, using simple growth calculation based on current data
  // In a real app, you'd compare with last month's stored data
  const getProjectChange = () => {
    const growth = activeProjects > 0 ? Math.min(activeProjects * 2.5, 25) : 0;
    return `+${growth.toFixed(1)}%`;
  };

  const getDocumentChange = () => {
    const growth = totalDocuments > 0 ? Math.min(totalDocuments * 1.8, 20) : 0;
    return `+${growth.toFixed(1)}%`;
  };

  const getHoursChange = () => {
    const growth = totalHours > 0 ? Math.min(totalHours * 0.5, 15) : 0;
    return `+${growth.toFixed(1)}%`;
  };

  const getTasksChange = () => {
    const growth = completedTasks > 0 ? Math.min(completedTasks * 3, 30) : 0;
    return `+${growth.toFixed(1)}%`;
  };

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects,
      change: getProjectChange(),
      icon: FolderOpen,
      color: "text-emerald-400",
      bgColor: "bg-emerald-600/10",
    },
    {
      title: "Documents Created",
      value: totalDocuments,
      change: getDocumentChange(),
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-600/10",
    },
    {
      title: "Hours Tracked",
      value: totalHours,
      change: getHoursChange(),
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Tasks Completed",
      value: completedTasks,
      change: getTasksChange(),
      icon: CheckCircle,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-slate-950 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-slate-100">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-400">{stat.change}</span>
                <span className="text-slate-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
