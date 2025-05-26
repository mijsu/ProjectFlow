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

  // Calculate real percentage changes based on actual month-over-month data
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);
  
  // Get last month's data for comparison
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);
  
  const { data: lastMonthProjects } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    where("createdAt", ">=", lastMonthStart),
    where("createdAt", "<=", lastMonthEnd)
  ]);
  
  const { data: lastMonthDocuments } = useCollection("documents", [
    where("ownerId", "==", user?.uid || ""),
    where("createdAt", ">=", lastMonthStart),
    where("createdAt", "<=", lastMonthEnd)
  ]);
  
  const { data: lastMonthTimeEntries } = useCollection("timeEntries", [
    where("userId", "==", user?.uid || ""),
    where("startTime", ">=", lastMonthStart),
    where("startTime", "<=", lastMonthEnd)
  ]);
  
  const { data: lastMonthTasks } = useCollection("tasks", [
    where("assigneeId", "==", user?.uid || ""),
    where("completedAt", ">=", lastMonthStart),
    where("completedAt", "<=", lastMonthEnd)
  ]);

  // Calculate real growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return "0%";
    if (previous === 0 && current > 0) return "+100%";
    if (current === 0) return "-100%";
    
    const growth = ((current - previous) / previous) * 100;
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  const lastMonthActiveProjects = lastMonthProjects?.filter(p => p.status === "in-progress")?.length || 0;
  const lastMonthDocumentCount = lastMonthDocuments?.length || 0;
  const lastMonthHours = Math.round((lastMonthTimeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0) / 60);
  const lastMonthCompletedTasks = lastMonthTasks?.length || 0;

  const projectsChange = calculateGrowth(activeProjects, lastMonthActiveProjects);
  const documentsChange = calculateGrowth(totalDocuments, lastMonthDocumentCount);
  const hoursChange = calculateGrowth(totalHours, lastMonthHours);
  const tasksChange = calculateGrowth(completedTasks, lastMonthCompletedTasks);

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects,
      change: projectsChange,
      icon: FolderOpen,
      color: "text-emerald-400",
      bgColor: "bg-emerald-600/10",
    },
    {
      title: "Documents Created",
      value: totalDocuments,
      change: documentsChange,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-600/10",
    },
    {
      title: "Hours Tracked",
      value: totalHours,
      change: hoursChange,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Tasks Completed",
      value: completedTasks,
      change: tasksChange,
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
