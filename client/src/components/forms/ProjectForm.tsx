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
import { CalendarIcon, Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  project?: any;
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

  // Fetch tasks for this project
  const { data: projectTasks } = useCollection(
    "tasks",
    project ? [where("projectId", "==", project.id)] : []
  );

  // Calculate progress from tasks
  useEffect(() => {
    if (project && projectTasks && projectTasks.length > 0) {
      const totalProgress = projectTasks.reduce(
        (sum: number, task: any) => sum + (task.progressContribution || 0),
        0
      );
      setProgress(totalProgress);
    }
  }, [projectTasks, project]);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "planning");
      setProgress(project.progress || 0);
      setDeadline(project.deadline ? new Date(project.deadline) : undefined);
    } else {
      setName("");
      setDescription("");
      setStatus("planning");
      setProgress(0);
      setDeadline(undefined);
    }
  }, [project]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskProgress || !project) return;

    try {
      await addDocument("tasks", {
        title: newTaskTitle,
        description: "",
        status: "completed",
        priority: "medium",
        projectId: project.id,
        assigneeId: user?.uid,
        dueDate: null,
        progressContribution: parseInt(newTaskProgress),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setNewTaskTitle("");
      setNewTaskProgress("");
      toast({
        title: "Task added successfully!",
        description: `Added ${newTaskTitle} with ${newTaskProgress}% progress contribution.`,
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const projectData = {
        name,
        description,
        status,
        progress,
        deadline: deadline ? deadline.toISOString() : null,
        ownerId: user.uid,
        updatedAt: new Date(),
      };

      if (project) {
        await updateDocument("projects", project.id, projectData);
        toast({
          title: "Project updated!",
          description: "Your project has been updated successfully.",
        });
      } else {
        await addDocument("projects", {
          ...projectData,
          createdAt: new Date(),
        });
        toast({
          title: "Project created!",
          description: "Your new project has been created successfully.",
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-950 border-slate-800 text-slate-100 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {project ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Project Details */}
            <div className="space-y-4">
              {/* Project name */}
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
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              {/* Project description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 resize-none"
                  rows={3}
                />
              </div>

              {/* Status and Progress row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress" className="text-slate-200">
                    Progress (%)
                  </Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-slate-100"
                    readOnly={project && projectTasks && projectTasks.length > 0}
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label className="text-slate-200">Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
            {project && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200 font-medium">Progress Tasks</Label>
                  <span className="text-sm text-slate-400">
                    Total: {progress}%
                  </span>
                </div>

                {/* Existing Tasks */}
                {projectTasks && projectTasks.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projectTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-700">
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
                )}

                {/* Add New Task */}
                <div className="space-y-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <Label className="text-slate-200 text-sm">Add Progress Task</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Task description"
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
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
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
              {loading ? "Saving..." : project ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}