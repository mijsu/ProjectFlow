import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { Link } from "wouter";

export default function ActiveProjects() {
  const { user } = useAuth();
  
  const { data: projects, loading } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
    limit(5)
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-emerald-600/10 text-emerald-400 border-emerald-600/20";
      case "planning":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "completed":
        return "bg-green-600/10 text-green-400 border-green-600/20";
      case "on-hold":
        return "bg-red-600/10 text-red-400 border-red-600/20";
      default:
        return "bg-slate-600/10 text-slate-400 border-slate-600/20";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-emerald-600";
      case "planning":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-600";
      default:
        return "bg-slate-600";
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-slate-900 rounded-lg border border-slate-800 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-3"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-100">Active Projects</CardTitle>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No projects yet</p>
              <Link href="/projects/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            projects?.map((project) => (
              <div
                key={project.id}
                className="p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Link href={`/projects/${project.id}`}>
                    <h4 className="font-medium text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer">
                      {project.name}
                    </h4>
                  </Link>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("-", " ")}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {project.description || "No description"}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">
                      {project.teamMembers?.length || 0} members
                    </span>
                  </div>
                  {project.deadline && (
                    <span className="text-xs text-slate-400">
                      Due {format(project.deadline.toDate(), "MMM d")}
                    </span>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-300">{project.progress || 0}%</span>
                  </div>
                  <Progress 
                    value={project.progress || 0} 
                    className="h-2 bg-slate-800"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
