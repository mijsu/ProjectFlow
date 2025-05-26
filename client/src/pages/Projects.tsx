import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { Plus, Search, FolderOpen, Calendar, Users, Edit, Clock } from "lucide-react";
import ProjectForm from "@/components/forms/ProjectForm";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const { user } = useAuth();

  const { data: projects, loading } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
  ]);

  // Get time entries for calculating project time totals
  const { data: timeEntries } = useCollection("timeEntries", [
    where("userId", "==", user?.uid || "")
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

  // Calculate total time spent on each project
  const getProjectTotalTime = (projectId: string) => {
    if (!timeEntries) return 0;
    return timeEntries
      .filter(entry => entry.projectId === projectId)
      .reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  const formatDurationMinutes = (minutes: number) => {
    if (minutes === 0) return "0h";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredProjects =
    projects?.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description &&
          project.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase())),
    ) || [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Projects" />
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="bg-slate-950 border-slate-800 animate-pulse"
              >
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-2/3 mb-4"></div>
                  <div className="h-2 bg-slate-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Projects" />

      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <Button
            onClick={() => setIsProjectFormOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first project to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsProjectFormOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="bg-slate-950 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setIsProjectFormOpen(true);
                        }}
                        className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2">
                    {project.description || "No description"}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{project.teamMembers?.length || 0} members</span>
                      </div>

                      {project.deadline && (
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(project.deadline.toDate(), "MMM d")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Time Tracking Display */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Time logged</span>
                      </div>
                      <span className="text-emerald-400 font-medium">
                        {formatDurationMinutes(getProjectTotalTime(project.id))}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-300">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <Progress
                        value={project.progress || 0}
                        className="h-2 bg-slate-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setEditingProject(null);
        }}
        onSuccess={() => {
          setIsProjectFormOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />
    </div>
  );
}
