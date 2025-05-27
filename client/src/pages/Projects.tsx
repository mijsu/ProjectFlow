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

  const { data: projects = [], loading: isLoading } = useCollection("projects");
  
  const userProjects = projects.filter(project => project.ownerId === user?.uid);

  const { data: documents = [] } = useCollection("documents");
  const { data: tasks = [] } = useCollection("tasks");
  const { data: timeEntries = [] } = useCollection("timeEntries");

  const handleDeleteProject = async (projectId: string) => {
    if (deletingProjectId === projectId) {
      try {
        await deleteDocument("projects", projectId);
        toast({
          title: "Success",
          description: "Project deleted successfully!",
        });
        // Project will be automatically updated through Firestore real-time sync
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

  const getProjectDocuments = (projectId: string) => {
    return documents.filter(doc => doc.projectId === projectId);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectTotalTime = (projectId: string) => {
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

        {userProjects.length === 0 ? (
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
            {userProjects.map((project) => (
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
                {/* Hero Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  {/* Progress Card */}
                  <div className="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">{viewingProject?.progress || 0}%</div>
                          <div className="text-xs text-emerald-400">Complete</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${viewingProject?.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Documents Card */}
                  <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">{getProjectDocuments(viewingProject.id).length}</div>
                          <div className="text-xs text-blue-400">Documents</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {getProjectDocuments(viewingProject.id).length > 0 ? 'Active content' : 'No documents yet'}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Card */}
                  <div className="group relative bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <CheckSquare className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">{getProjectTasks(viewingProject.id).length}</div>
                          <div className="text-xs text-purple-400">Tasks</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {getProjectTasks(viewingProject.id).filter(t => t.status === 'completed').length} completed
                      </div>
                    </div>
                  </div>

                  {/* Time Card */}
                  <div className="group relative bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">{getProjectTotalTime(viewingProject.id).toFixed(1)}h</div>
                          <div className="text-xs text-orange-400">Logged</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        Time invested
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Project Details */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <FolderOpen className="w-6 h-6 mr-3 text-emerald-400" />
                      Project Details
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Description</h4>
                        <p className="text-slate-400 leading-relaxed">
                          {viewingProject?.description || "This project showcases modern productivity management with advanced analytics and collaborative features."}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Status</h4>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-emerald-400 font-medium">Active</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Priority</h4>
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-400">95%</div>
                          <div className="text-xs text-slate-400">Productivity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">88%</div>
                          <div className="text-xs text-slate-400">Efficiency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-400">92%</div>
                          <div className="text-xs text-slate-400">Quality</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Overview */}
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
                      Analytics Overview
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Weekly Progress */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-300">Weekly Progress</h4>
                        <div className="space-y-3">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                            <div key={day} className="flex items-center space-x-3">
                              <div className="w-8 text-xs text-slate-400 font-mono">{day}</div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-300">Tasks: {Math.floor(Math.random() * 3) + 1}</span>
                                  <span className="text-slate-400">{(Math.random() * 2 + 1).toFixed(1)}h</span>
                                </div>
                                <div className="flex space-x-1">
                                  <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 transition-all duration-300"
                                      style={{ width: `${Math.random() * 60 + 40}%` }}
                                    />
                                  </div>
                                  <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 transition-all duration-300"
                                      style={{ width: `${Math.random() * 80 + 20}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Performance */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-300 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Team Performance
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Active Contributors</span>
                            <span className="text-sm font-medium text-white">3</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Avg. Session Time</span>
                            <span className="text-sm font-medium text-white">2.5h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Collaboration Score</span>
                            <span className="text-sm font-medium text-emerald-400">9.2/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const recentActivity = [
                        { date: new Date(), type: 'task', title: 'Task completed: UI Design Review', status: 'completed' },
                        { date: new Date(Date.now() - 3600000), type: 'document', title: 'Document created: Project Specification' },
                        { date: new Date(Date.now() - 7200000), type: 'time', duration: 2.5, description: 'Time logged on development' }
                      ];
                      
                      return recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            {activity.type === 'task' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                            {activity.type === 'document' && <FileText className="w-4 h-4 text-blue-400" />}
                            {activity.type === 'time' && <Clock className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-200">
                              {activity.title || activity.description}
                            </div>
                            <div className="text-xs text-slate-400">
                              {format(activity.date, 'MMM dd, HH:mm')}
                            </div>
                          </div>
                          {activity.type === 'task' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700/50">
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