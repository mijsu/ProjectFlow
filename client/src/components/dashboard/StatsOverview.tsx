import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, FileText, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";

export default function StatsOverview() {
  const { user } = useAuth();
  
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

  const activeProjects = projects?.filter(p => p.status === "in-progress")?.length || 0;
  const totalDocuments = documents?.length || 0;
  const totalHours = Math.round((timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0) / 60);
  const completedTasks = tasks?.filter(t => t.status === "completed")?.length || 0;

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects,
      change: "+2.5%",
      icon: FolderOpen,
      color: "text-emerald-400",
      bgColor: "bg-emerald-600/10",
    },
    {
      title: "Documents Created",
      value: totalDocuments,
      change: "+12.3%",
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-600/10",
    },
    {
      title: "Hours Tracked",
      value: totalHours,
      change: "+8.1%",
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Tasks Completed",
      value: completedTasks,
      change: "+15.7%",
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
