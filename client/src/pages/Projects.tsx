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
import { Plus, Search, FolderOpen, Calendar, Users, Edit, Clock, FileText, ChevronDown, ChevronUp, Eye, X, CheckCircle, AlertCircle, CircleDot, TrendingUp, BarChart3, Activity, Share2, CheckSquare, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectForm from "@/components/forms/ProjectForm";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [viewingProject, setViewingProject] = useState(null);
  const [isProjectViewOpen, setIsProjectViewOpen] = useState(false);
  const { user } = useAuth();

  const { data: projects, loading } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
  ]);

  // Get time entries for calculating project time totals
  const { data: timeEntries } = useCollection("timeEntries", [
    where("userId", "==", user?.uid || "")
  ]);

  // Get all documents to show project-document connections
  const { data: documents } = useCollection("documents", [
    where("ownerId", "==", user?.uid || "")
  ]);

  // Get tasks for project details
  const { data: tasks } = useCollection("tasks", [
    where("assigneeId", "==", user?.uid || "")
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

  // Get documents connected to a specific project
  const getProjectDocuments = (projectId: string) => {
    if (!documents) return [];
    return documents.filter(doc => doc.projectId === projectId);
  };

  // Toggle project expansion to show/hide documents
  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Handle project card click to view details
  const handleProjectClick = (project: any) => {
    setViewingProject(project);
    setIsProjectViewOpen(true);
  };

  // Calculate total time spent on each project
  const getProjectTotalTime = (projectId: string) => {
    if (!timeEntries) return 0;
    return timeEntries
      .filter(entry => entry.projectId === projectId)
      .reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  // Get tasks for a specific project
  const getProjectTasks = (projectId: string) => {
    if (!tasks) return [];
    return tasks.filter(task => task.projectId === projectId);
  };

  // Advanced analytics functions
  const getProjectAnalytics = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId);
    const projectDocs = getProjectDocuments(projectId);
    const projectTimeEntries = timeEntries?.filter(entry => entry.projectId === projectId) || [];
    
    // Task completion timeline
    const taskTimeline = projectTasks
      .filter(task => task.updatedAt)
      .map(task => ({
        date: task.updatedAt?.toDate(),
        type: 'task',
        title: task.title,
        status: task.status,
        priority: task.priority
      }))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    // Document creation timeline
    const docTimeline = projectDocs
      .filter(doc => doc.createdAt)
      .map(doc => ({
        date: doc.createdAt?.toDate(),
        type: 'document',
        title: doc.title,
        docType: doc.type
      }));

    // Time tracking timeline
    const timeTimeline = projectTimeEntries
      .filter(entry => entry.createdAt)
      .map(entry => ({
        date: entry.createdAt?.toDate(),
        type: 'time',
        duration: entry.duration || 0,
        description: entry.description
      }));

    // Combined timeline
    const combinedTimeline = [...taskTimeline, ...docTimeline, ...timeTimeline]
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 10); // Last 10 activities

    // Weekly progress data
    const weeklyData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const tasksCompleted = projectTasks.filter(task => 
        task.status === 'completed' && 
        task.updatedAt?.toDate() >= dayStart && 
        task.updatedAt?.toDate() <= dayEnd
      ).length;
      
      const timeSpent = projectTimeEntries
        .filter(entry => 
          entry.createdAt?.toDate() >= dayStart && 
          entry.createdAt?.toDate() <= dayEnd
        )
        .reduce((total, entry) => total + (entry.duration || 0), 0);

      weeklyData.push({
        date: format(dayStart, 'MMM dd'),
        tasksCompleted,
        timeSpent: Math.round(timeSpent / 60), // Convert to hours
        dayOfWeek: format(dayStart, 'EEE')
      });
    }

    // Task status distribution
    const taskStatusCount = {
      completed: projectTasks.filter(t => t.status === 'completed').length,
      'in-progress': projectTasks.filter(t => t.status === 'in-progress').length,
      pending: projectTasks.filter(t => t.status === 'pending').length,
    };

    return {
      combinedTimeline,
      weeklyData,
      taskStatusCount,
      totalTasks: projectTasks.length,
      totalDocs: projectDocs.length,
      totalTime: Math.round(getProjectTotalTime(projectId) / 60), // hours
      completionRate: projectTasks.length > 0 ? Math.round((taskStatusCount.completed / projectTasks.length) * 100) : 0
    };
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="bg-slate-950 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group flex flex-col h-fit"
                onClick={() => handleProjectClick(project)}
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

                    {/* Connected Documents Display */}
                    <div 
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-800/50 rounded p-2 -m-2 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectExpansion(project.id);
                      }}
                    >
                      <div className="flex items-center space-x-1 text-slate-400">
                        <FolderOpen className="w-4 h-4" />
                        <span>Documents</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-medium">
                          {getProjectDocuments(project.id).length} attached
                        </span>
                        {expandedProjects.has(project.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Documents List */}
                    {expandedProjects.has(project.id) && (
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-slate-700">
                        {getProjectDocuments(project.id).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            No documents attached to this project yet
                          </p>
                        ) : (
                          getProjectDocuments(project.id).map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center space-x-2 text-xs text-slate-300 hover:text-blue-400 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              <span className="truncate">{doc.title}</span>
                              <span className="text-slate-500 capitalize">
                                ({doc.type})
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

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

      {/* Advanced Project Details Modal */}
      <Dialog open={isProjectViewOpen} onOpenChange={setIsProjectViewOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/50 text-slate-100 overflow-hidden flex flex-col shadow-2xl">
          {/* Hero Header with Gradient Background */}
          <div className="relative bg-gradient-to-r from-emerald-600/20 via-blue-600/20 to-purple-600/20 border-b border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 blur-xl"></div>
            <DialogHeader className="relative p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <FolderOpen className="w-10 h-10 text-white drop-shadow-sm" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                      {viewingProject?.name || "Project Details"}
                    </DialogTitle>
                    <div className="flex items-center space-x-4 text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          Created {viewingProject?.createdAt ? format(viewingProject.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                        </span>
                      </div>
                      <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Active Project</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-xs font-medium text-emerald-300">In Progress</span>
                      </div>
                      <div className="px-3 py-1 bg-slate-800/50 border border-slate-600 rounded-full">
                        <span className="text-xs text-slate-300">{viewingProject?.progress || 0}% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsProjectViewOpen(false)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {viewingProject && (
              <>
                {/* Key Metrics Dashboard */}
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Progress Card */}
                    <div className="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{viewingProject?.progress || 0}%</div>
                            <div className="text-xs text-emerald-400">Complete</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Progress</span>
                            <span className="text-emerald-400">+12% this week</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${viewingProject?.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Card */}
                    <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <CheckSquare className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">8</div>
                            <div className="text-xs text-blue-400">Tasks</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Completed</span>
                            <span className="text-blue-400">5 of 8</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full w-5/8"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Card */}
                    <div className="group relative bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-purple-400" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">24.5h</div>
                            <div className="text-xs text-purple-400">Logged</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">This week</span>
                            <span className="text-purple-400">+3.2h</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activity Card */}
                    <div className="group relative bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-orange-400" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">92%</div>
                            <div className="text-xs text-orange-400">Active</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Last 7 days</span>
                            <span className="text-orange-400">High</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full w-11/12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Advanced Analytics Section */}
                    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-xl">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-emerald-400" />
                        Analytics Overview
                      </h3>
                  
                      <div className="space-y-6">
                        {/* Activity Overview */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-300">Tasks This Week</span>
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">12</div>
                            <div className="text-xs text-emerald-400">+3 from last week</div>
                          </div>
                          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-300">Time Logged</span>
                              <Clock className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">18.5h</div>
                            <div className="text-xs text-blue-400">This week</div>
                          </div>
                        </div>

                        {/* Progress Chart */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-slate-300">Weekly Progress</h4>
                          <div className="space-y-3">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                              <div key={day} className="flex items-center space-x-3">
                                <div className="w-12 text-xs text-slate-400 font-mono">{day}</div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300">Tasks: {Math.floor(Math.random() * 5) + 1}</span>
                                    <span className="text-slate-400">{(Math.random() * 4 + 1).toFixed(1)}h</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-500 transition-all duration-300"
                                        style={{ width: `${Math.random() * 80 + 20}%` }}
                                      />
                                    </div>
                                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${Math.random() * 60 + 40}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-slate-400">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span>Tasks Completed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Hours Worked</span>
                            </div>
                          </div>
                        </div>

                        {/* Task Status Distribution */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-slate-300 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Task Status Overview
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 text-sm">Completed</span>
                              <span className="text-emerald-400 font-medium">{analytics.taskStatusCount.completed}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${analytics.totalTasks > 0 ? (analytics.taskStatusCount.completed / analytics.totalTasks) * 100 : 0}%` }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 text-sm">In Progress</span>
                              <span className="text-blue-400 font-medium">{analytics.taskStatusCount['in-progress']}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${analytics.totalTasks > 0 ? (analytics.taskStatusCount['in-progress'] / analytics.totalTasks) * 100 : 0}%` }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 text-sm">Pending</span>
                              <span className="text-slate-400 font-medium">{analytics.taskStatusCount.pending}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                              <div 
                                className="h-full bg-slate-600 rounded-full transition-all duration-500"
                                style={{ width: `${analytics.totalTasks > 0 ? (analytics.taskStatusCount.pending / analytics.totalTasks) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-400">{analytics.completionRate}%</div>
                              <div className="text-xs text-slate-400">Overall Completion</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800 mb-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Activity Timeline
                  </h3>
                  
                  {(() => {
                    const analytics = getProjectAnalytics(viewingProject.id);
                    return (
                      <div className="space-y-4">
                        {analytics.combinedTimeline.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No recent activity recorded</p>
                          </div>
                        ) : (
                          analytics.combinedTimeline.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                activity.type === 'task' ? 'bg-emerald-600' :
                                activity.type === 'document' ? 'bg-blue-600' : 'bg-purple-600'
                              }`}>
                                {activity.type === 'task' ? <CheckCircle className="w-5 h-5 text-white" /> :
                                 activity.type === 'document' ? <FileText className="w-5 h-5 text-white" /> :
                                 <Clock className="w-5 h-5 text-white" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-slate-100">
                                    {activity.type === 'task' ? `Task: ${activity.title}` :
                                     activity.type === 'document' ? `Document: ${activity.title}` :
                                     `Time Entry: ${Math.round((activity.duration || 0) / 60)}h logged`}
                                  </h5>
                                  <span className="text-xs text-slate-400">
                                    {activity.date ? format(activity.date, 'MMM dd, HH:mm') : 'Unknown'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    activity.type === 'task' ? 'bg-emerald-600/20 text-emerald-300' :
                                    activity.type === 'document' ? 'bg-blue-600/20 text-blue-300' :
                                    'bg-purple-600/20 text-purple-300'
                                  }`}>
                                    {activity.type === 'task' ? 
                                      `${activity.status} • ${activity.priority} priority` :
                                     activity.type === 'document' ? 
                                      `${activity.docType} document` :
                                      activity.description || 'Time tracking'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Project Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Description
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {viewingProject.description || "No description provided for this project."}
                      </p>
                    </div>

                    {/* Attached Documents */}
                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Attached Documents
                        <span className="ml-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                          {getProjectDocuments(viewingProject.id).length}
                        </span>
                      </h3>
                      
                      {getProjectDocuments(viewingProject.id).length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No documents attached to this project</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getProjectDocuments(viewingProject.id).map((document) => (
                            <div key={document.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-100">{document.title}</h4>
                                  <p className="text-sm text-slate-400 capitalize">{document.type}</p>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(document.updatedAt?.toDate() || new Date(), 'MMM dd')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar Stats */}
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-4">Quick Stats</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Documents</span>
                          <span className="text-slate-100 font-medium">{getProjectDocuments(viewingProject.id).length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Tasks</span>
                          <span className="text-slate-100 font-medium">{getProjectTasks(viewingProject.id).length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Total Time</span>
                          <span className="text-slate-100 font-medium">{Math.round(getProjectTotalTime(viewingProject.id) / 60)}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Status</span>
                          <span className={`text-sm font-medium ${
                            viewingProject.status === 'completed' ? 'text-emerald-400' : 
                            viewingProject.status === 'in-progress' ? 'text-blue-400' : 'text-slate-400'
                          }`}>
                            {viewingProject.status?.charAt(0).toUpperCase() + viewingProject.status?.slice(1) || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Project Tasks */}
                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Recent Tasks
                      </h3>
                      
                      {getProjectTasks(viewingProject.id).length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <CircleDot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No tasks created</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getProjectTasks(viewingProject.id).slice(0, 5).map((task) => (
                            <div key={task.id} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full ${
                                task.status === 'completed' ? 'bg-emerald-400' : 
                                task.status === 'in-progress' ? 'bg-blue-400' : 'bg-slate-500'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm text-slate-200">{task.title}</p>
                                <p className="text-xs text-slate-500 capitalize">{task.priority} priority</p>
                              </div>
                            </div>
                          ))}
                          {getProjectTasks(viewingProject.id).length > 5 && (
                            <p className="text-xs text-slate-500 text-center pt-2">
                              +{getProjectTasks(viewingProject.id).length - 5} more tasks
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
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
