import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { orderBy, limit } from "firebase/firestore";
import { FileText, FolderOpen, Clock, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { user } = useAuth();
  
  const { data: projects } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
    limit(3)
  ]);
  
  const { data: documents } = useCollection("documents", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
    limit(3)
  ]);
  
  const { data: timeEntries } = useCollection("timeEntries", [
    where("userId", "==", user?.uid || ""),
    orderBy("startTime", "desc"),
    limit(3)
  ]);

  // Create combined activities array
  const activities = [
    ...(projects?.map(p => ({
      id: `project-${p.id}`,
      type: "project_updated",
      description: `Updated project "${p.name}"`,
      createdAt: p.updatedAt
    })) || []),
    ...(documents?.map(d => ({
      id: `document-${d.id}`,
      type: "document_updated", 
      description: `Modified document "${d.title}"`,
      createdAt: d.updatedAt
    })) || []),
    ...(timeEntries?.map(t => ({
      id: `time-${t.id}`,
      type: "time_logged",
      description: `Logged ${Math.floor((t.duration || 0) / 60)}h ${(t.duration || 0) % 60}m for "${t.description}"`,
      createdAt: t.startTime
    })) || [])
  ].sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
    const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
    return bTime.getTime() - aTime.getTime();
  }).slice(0, 10);

  const loading = false;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "document_created":
      case "document_updated":
        return FileText;
      case "project_created":
      case "project_updated":
        return FolderOpen;
      case "task_completed":
        return CheckCircle;
      case "time_logged":
        return Clock;
      default:
        return FileText;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "document_created":
      case "document_updated":
        return "text-emerald-400 bg-emerald-600/10";
      case "project_created":
      case "project_updated":
        return "text-blue-400 bg-blue-600/10";
      case "task_completed":
        return "text-purple-400 bg-purple-500/10";
      case "time_logged":
        return "text-yellow-400 bg-yellow-500/10";
      default:
        return "text-slate-400 bg-slate-700/10";
    }
  };

  if (loading) {
    return (
      <Card className="lg:col-span-2 bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-slate-950 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-100">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No recent activity</p>
          ) : (
            activities?.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClasses = getActivityColor(activity.type);
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${colorClasses}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{activity.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(activity.createdAt?.toDate?.() || activity.createdAt || new Date(), { 
                        addSuffix: true 
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
