import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  project?: any;
}

export default function ProjectForm({ isOpen, onClose, project }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize form with project data when editing
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "planning");
      setProgress(project.progress || 0);
      setDeadline(project.deadline ? format(project.deadline.toDate(), "yyyy-MM-dd") : "");
    } else {
      // Reset form for new project
      setName("");
      setDescription("");
      setStatus("planning");
      setProgress(0);
      setDeadline("");
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (project) {
        // Update existing project
        await updateDocument("projects", project.id, {
          name: name.trim(),
          description: description.trim(),
          status,
          deadline: deadline ? new Date(deadline) : null,
          progress,
          updatedAt: new Date(),
        });

        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        // Create new project
        await addDocument("projects", {
          name: name.trim(),
          description: description.trim(),
          status,
          deadline: deadline ? new Date(deadline) : null,
          progress,
          ownerId: user.uid,
          teamMembers: [user.uid],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: project ? "Failed to update project" : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">Project Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400"
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 resize-none"
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-200">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress" className="text-slate-200">Progress (%)</Label>
            <Input
              id="progress"
              type="number"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400"
              placeholder="Enter project progress"
              min="0"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(new Date(deadline), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={deadline ? new Date(deadline) : undefined}
                  onSelect={(date) => setDeadline(date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                  className="bg-slate-900"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}