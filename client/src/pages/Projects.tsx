import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCollection, addDocument, deleteDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ProjectForm from "@/components/forms/ProjectForm";
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Eye,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  Activity,
  X,
  Share2,
  CheckSquare
} from "lucide-react";
import { format } from "date-fns";

export default function Projects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectViewOpen, setIsProjectViewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  const { data: projects = [], isLoading, refetch } = useCollection(
    "projects",
    user ? [{ field: "ownerId", operator: "==", value: user.uid }] : []
  );

  const { data: documents = [] } = useCollection("documents");
  const { data: tasks = [] } = useCollection("tasks");
  const { data: timeEntries = [] } = useCollection("timeEntries");

  const handleDeleteProject = async (projectId) => {
    if (deletingProjectId === projectId) {
      try {
        await deleteDocument("projects", projectId);
        toast({
          title: "Success",
          description: "Project deleted successfully!",
        });
        refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        });
      } finally {
        setDeletingProjectId(null);
      }
    } else {
      setDeletingProjectId(projectId);
      setTimeout(() => setDeletingProjectId(null), 2000);
    }
  };

  const getProjectDocuments = (projectId) => {
    return documents.filter(doc => doc.projectId === projectId);
  };

  const getProjectTasks = (projectId) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectTotalTime = (projectId) => {
    const projectTimeEntries = timeEntries.filter(entry => entry.projectId === projectId);
    return projectTimeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Projects</h1>
              <p className="text-slate-400 mt-2">Manage your projects and track progress</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2 mb-6"></div>
                <div className="h-2 bg-slate-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Projects</h1>
            <p className="text-slate-400 mt-2">Manage your projects and track progress</p>
          </div>
          <Button
            onClick={() => {
              setEditingProject(null);
              setIsProjectFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 text-center p-12">
            <CardContent>
              <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No projects yet</h3>
              <p className="text-slate-500 mb-6">Create your first project to get started with tracking progress and managing tasks.</p>
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setIsProjectFormOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-100 text-lg">{project.name}</CardTitle>
                        <CardDescription className="text-slate-400 text-sm">
                          Created {format(project.createdAt.toDate(), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewingProject(project);
                          setIsProjectViewOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProject(project);
                          setIsProjectFormOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deletingProjectId === project.id}
                        className="text-slate-400 hover:text-red-400"
                      >
                        {deletingProjectId === project.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-sm line-clamp-2">
                    {project.description || "No description provided"}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Progress</span>
                      <span className="text-emerald-400 font-medium text-sm">{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2 bg-slate-800" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-200">{getProjectDocuments(project.id).length}</div>
                      <div className="text-xs text-slate-400">Docs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-200">{getProjectTasks(project.id).length}</div>
                      <div className="text-xs text-slate-400">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-200">{getProjectTotalTime(project.id).toFixed(1)}h</div>
                      <div className="text-xs text-slate-400">Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Project Form Dialog */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setEditingProject(null);
        }}
        onSuccess={() => {
          refetch();
          setIsProjectFormOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />

      {/* Enhanced Project Details Modal */}
      <Dialog open={isProjectViewOpen} onOpenChange={setIsProjectViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-slate-950 border-slate-800 text-slate-100 overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-100">
                    {viewingProject?.name || "Project Details"}
                  </DialogTitle>
                  <p className="text-slate-400 text-sm">
                    Created {viewingProject?.createdAt ? format(viewingProject.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProjectViewOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {viewingProject && (
              <>
                {/* Enhanced Project Overview */}
                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800 mb-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Project Overview
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Description</h4>
                      <p className="text-slate-400 leading-relaxed">
                        {viewingProject?.description || "Modern productivity management project with comprehensive tracking and analytics features."}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Progress</span>
                        <span className="text-emerald-400 font-medium">{viewingProject?.progress || 0}%</span>
                      </div>
                      <Progress value={viewingProject?.progress || 0} className="h-2 bg-slate-800" />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsProjectViewOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingProject(viewingProject);
                      setIsProjectFormOpen(true);
                      setIsProjectViewOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}