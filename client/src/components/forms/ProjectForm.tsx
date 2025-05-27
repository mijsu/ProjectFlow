import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDocument, updateDocument, deleteDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, CheckCircle, Pencil, Check, X, FileText, Eye, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  project?: any; // Ensure the project type is defined correctly
}

export default function ProjectForm({
  isOpen,
  onClose,
  onSuccess,
  project,
}: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProgress, setNewTaskProgress] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [viewingDocument, setViewingDocument] = useState(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  
  // Ongoing tasks state
  const [newOngoingTaskTitle, setNewOngoingTaskTitle] = useState("");
  const [newOngoingTaskPriority, setNewOngoingTaskPriority] = useState("medium");
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch existing tasks for this project
  const { data: projectTasks } = useCollection("tasks", project?.id ? [
    where("projectId", "==", project.id)
  ] : [
    where("projectId", "==", "non-existent-project-id") // This ensures no tasks are returned for new projects
  ]);

  // Fetch documents attached to this project if editing
  const { data: projectDocuments } = useCollection("documents", project?.id ? [
    where("projectId", "==", project.id)
  ] : [
    where("projectId", "==", "non-existent-project-id") // No documents for new projects
  ]);

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "planning");
      setProgress(project.progress || 0);
      setDeadline(project.deadline?.toDate() || undefined);
    } else {
      // Reset form for new project
      setName("");
      setDescription("");
      setStatus("planning");
      setProgress(0);
      setDeadline(undefined);
    }
  }, [project]);

  // Calculate progress based on tasks
  useEffect(() => {
    if (projectTasks && projectTasks.length > 0) {
      const totalProgress = projectTasks.reduce((sum, task) => sum + (task.progressContribution || 0), 0);
      setProgress(Math.min(totalProgress, 100));
    }
  }, [projectTasks]);

  // Add new task to project with progress contribution
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskProgress.trim()) {
      toast({
        title: "Error",
        description: "Please enter task title and progress percentage",
        variant: "destructive",
      });
      return;
    }

    const progressValue = parseInt(newTaskProgress);
    if (isNaN(progressValue) || progressValue < 1 || progressValue > 100) {
      toast({
        title: "Error",
        description: "Progress must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDocument("tasks", {
        title: newTaskTitle.trim(),
        description: `Added from project: ${name}`,
        progressContribution: progressValue,
        projectId: project?.id || `temp-${Date.now()}`,
        assigneeId: user?.uid,
        status: "completed",
        createdAt: new Date(),
        dueDate: new Date(),
      });

      setNewTaskTitle("");
      setNewTaskProgress("");
      
      toast({
        title: "Success",
        description: `Task added with ${progressValue}% progress contribution`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleSaveTaskEdit = async () => {
    if (!editingTaskId || !editingTaskTitle.trim()) return;

    try {
      await updateDocument("tasks", editingTaskId, {
        title: editingTaskTitle.trim()
      });

      setEditingTaskId(null);
      setEditingTaskTitle("");
      
      toast({
        title: "Task Updated",
        description: "Task name updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  // Document management functions
  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setIsDocumentViewerOpen(true);
  };

  // Function to format document content for preview (matching Documents page)
  const formatDocumentContent = (content: string) => {
    if (!content) return "";
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-300">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-blue-300">$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u class="underline text-purple-300">$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-green-300 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-emerald-400 border-b border-emerald-600 pb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-4 text-emerald-300">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mb-3 text-emerald-200">$1</h3>')
      .replace(/^- (.*$)/gm, '<div class="flex items-start mb-2"><span class="text-emerald-400 mr-2">•</span><span class="text-slate-200">$1</span></div>')
      .replace(/^\d+\. (.*$)/gm, '<div class="flex items-start mb-2"><span class="text-emerald-400 mr-2 font-mono">1.</span><span class="text-slate-200">$1</span></div>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-emerald-500 bg-slate-800/50 pl-4 py-3 italic text-slate-300 my-4 rounded-r">$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline transition-colors">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 border border-slate-700" />')
      .replace(/\n/g, '<br>');
  };

  const handleDeleteDocument = async (document: any) => {
    try {
      await deleteDocument("documents", document.id);
      toast({
        title: "Document Deleted",
        description: `"${document.title}" has been removed from the project`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  // Ongoing tasks functions
  const handleAddOngoingTask = async () => {
    if (!newOngoingTaskTitle.trim() || !project?.id) return;
    
    try {
      await addDocument("tasks", {
        title: newOngoingTaskTitle,
        projectId: project.id,
        assigneeId: user?.uid,
        status: "in-progress", // Ongoing tasks start as in-progress
        priority: newOngoingTaskPriority,
        type: "ongoing", // Mark as ongoing task for time tracking
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setNewOngoingTaskTitle("");
      setNewOngoingTaskPriority("medium");
      
      toast({
        title: "Ongoing Task Added",
        description: "Task created successfully and ready for time tracking",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ongoing task",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOngoingTask = async (taskId: string) => {
    try {
      await updateDocument("tasks", taskId, {
        status: "completed",
        updatedAt: new Date()
      });
      
      toast({
        title: "Task Completed",
        description: "Ongoing task marked as completed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOngoingTask = async (taskId: string) => {
    try {
      await deleteDocument("tasks", taskId);
      toast({
        title: "Task Deleted",
        description: "Ongoing task removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate project name
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    // Check if progress is a valid number
    const numericProgress = parseInt(progress.toString());
    if (
      isNaN(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      toast({
        title: "Error",
        description: "Progress must be a number between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        name: name.trim(),
        description: description.trim() || "",
        status,
        progress: numericProgress,
        ownerId: user.uid,
        teamMembers: Array.isArray(project?.teamMembers) ? project.teamMembers : [],
        deadline: deadline || null,
      };

      console.log("Project Data:", projectData); // Log the project data before update

      if (project) {
        // Update existing project
        await updateDocument("projects", project.id, projectData);
        toast({
          title: "Success",
          description: "Project updated successfully!",
        });
      } else {
        // Create new project
        await addDocument("projects", projectData);
        toast({
          title: "Success",
          description: "Project created successfully!",
        });
      }

      // Reset form
      setName("");
      setDescription("");
      setStatus("planning");
      setProgress(0);
      setDeadline(undefined);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStatus(project.status);
      setProgress(project.progress || 0);
      setDeadline(project.deadline?.toDate() || undefined);
    } else {
      // Reset fields when project changes
      setName("");
      setDescription("");
      setStatus("planning");
      setProgress(0);
      setDeadline(undefined);
    }
  }, [project]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader className="pb-4 border-b border-slate-700">
          <DialogTitle className="text-xl font-semibold">
            {project ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Project Details */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-emerald-400 border-b border-slate-700 pb-2">Project Details</h3>
                
                {/* Project name input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Project Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Project description input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Project status select */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-200">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress input */}
          <div className="space-y-2">
            <Label htmlFor="progress" className="text-slate-200">
              Progress Percentage
            </Label>
            <Input
              id="progress"
              type="number"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              min="0"
              max="100"
            />
          </div>

          {/* Deadline picker */}
          <div className="space-y-2">
            <Label className="text-slate-200">Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2" />
                  {deadline ? format(deadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

              </div>

              {/* Right Column - Task Progress Tracking */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-emerald-400 border-b border-slate-700 pb-2">Progress Tracking</h3>
                
                {project ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-200 font-medium">Progress Tasks</Label>
                      <span className="text-sm text-slate-400">
                        Total: {progress}%
                      </span>
                    </div>

                    {/* Existing Tasks - More Scrollable */}
                    {projectTasks && projectTasks.length > 0 ? (
                      <div className="space-y-2 max-h-[28rem] overflow-y-auto border border-slate-700 rounded-lg p-3 bg-slate-900/50">
                        {projectTasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                            <div className="flex items-center space-x-2 flex-1">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              {editingTaskId === task.id ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <Input
                                    value={editingTaskTitle}
                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                    className="flex-1 text-sm bg-slate-800 border-slate-600 text-slate-100"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleSaveTaskEdit}
                                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm text-slate-200 flex-1">{task.title}</span>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditTask(task)}
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                            <span className="text-sm font-medium text-emerald-400 ml-2">
                              +{task.progressContribution || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-6 border border-slate-700 rounded-lg bg-slate-900/30">
                        <p className="text-sm">No progress tasks yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <p>Task progress tracking will be available after creating the project.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ongoing Tasks Section */}
            {project && (
              <div className="border-t border-slate-700 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-slate-100">Ongoing Tasks</h3>
                    <span className="text-xs text-slate-400">Track time for these tasks</span>
                  </div>
                  
                  {/* Add new ongoing task */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add ongoing task (e.g., Research phase, Code review)"
                        value={newOngoingTaskTitle}
                        onChange={(e) => setNewOngoingTaskTitle(e.target.value)}
                        className="flex-1 bg-slate-800 border-slate-600 text-slate-100"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddOngoingTask()}
                      />
                      <Select value={newOngoingTaskPriority} onValueChange={setNewOngoingTaskPriority}>
                        <SelectTrigger className="w-28 bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddOngoingTask}
                        disabled={!newOngoingTaskTitle.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* List existing ongoing tasks */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projectTasks && projectTasks.length > 0 ? (
                      projectTasks
                        .filter(task => task.type === "ongoing" || task.status === "in-progress")
                        .map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                task.status === 'completed' ? 'bg-emerald-400' :
                                task.status === 'in-progress' ? 'bg-blue-400' : 'bg-slate-500'
                              }`} />
                              <div>
                                <span className="text-slate-200 font-medium">{task.title}</span>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    task.priority === 'high' ? 'bg-red-600/20 text-red-300' :
                                    task.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
                                    'bg-slate-600/20 text-slate-300'
                                  }`}>
                                    {task.priority} priority
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    Available for time tracking
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {task.status !== 'completed' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCompleteOngoingTask(task.id)}
                                  className="text-emerald-400 hover:bg-emerald-900/20"
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteOngoingTask(task.id)}
                                className="text-red-400 hover:bg-red-900/20"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center text-slate-400 py-6 border border-slate-700 rounded-lg bg-slate-900/30">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No ongoing tasks yet</p>
                        <p className="text-xs text-slate-500 mt-1">Add tasks that you can track time for</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attached Documents Section */}
            {project && (
              <div className="border-t border-slate-700 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5 text-blue-400" />
                    <Label className="text-slate-200 font-medium">Attached Documents</Label>
                    <span className="text-slate-400 text-sm">
                      ({projectDocuments?.length || 0} documents)
                    </span>
                  </div>

                  {projectDocuments && projectDocuments.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {projectDocuments.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-slate-200 font-medium text-sm">
                                {document.title}
                              </p>
                              <p className="text-slate-400 text-xs capitalize">
                                {document.type} • Updated {new Date(document.updatedAt?.toDate()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDocument(document)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDocument(document)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-6 border border-slate-700 rounded-lg bg-slate-900/30">
                      <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm">No documents attached to this project</p>
                      <p className="text-xs mt-1">Create documents and link them to this project to see them here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add New Task Section - Closer to buttons */}
            {project && (
              <div className="border-t border-slate-700 pt-4">
                <div className="space-y-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <Label className="text-slate-200 text-sm font-medium">Add Progress Task</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Task description (e.g., Project meeting)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 bg-slate-800 border-slate-600 text-slate-100"
                    />
                    <Input
                      type="number"
                      placeholder="10"
                      min="1"
                      max="100"
                      value={newTaskProgress}
                      onChange={(e) => setNewTaskProgress(e.target.value)}
                      className="w-20 bg-slate-800 border-slate-600 text-slate-100"
                    />
                    <span className="flex items-center text-slate-400 text-sm">%</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddTask}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task Progress
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {project ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>

    {/* Document Viewer Modal */}
    <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-950 border-slate-800 text-slate-100 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>{viewingDocument?.title || "Document Preview"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/30 rounded-lg border border-slate-700">
          {viewingDocument ? (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">{viewingDocument.title}</h2>
                    <p className="text-sm text-slate-400 capitalize">
                      {viewingDocument.type} • Updated {new Date(viewingDocument.updatedAt?.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    Read-only Preview
                  </div>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <div 
                  className="text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatDocumentContent(viewingDocument.content || "No content available")
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-400">Loading document...</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => setIsDocumentViewerOpen(false)}
            className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
