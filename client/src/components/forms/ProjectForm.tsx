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
import { addDocument, updateDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, CheckCircle } from "lucide-react";
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch existing tasks for this project
  const { data: projectTasks } = useCollection("tasks", project?.id ? [
    where("projectId", "==", project.id)
  ] : []);

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
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-slate-200">{task.title}</span>
                            </div>
                            <span className="text-sm font-medium text-emerald-400">
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
  );
}
