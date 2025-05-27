import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useCollection, addDocument, updateDocument } from "@/hooks/useFirestore";
import { where, orderBy, limit } from "firebase/firestore";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { Play, Pause, Square, Plus, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TimeTracking() {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  
  // Manual entry form
  const [entryDescription, setEntryDescription] = useState("");
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entryDuration, setEntryDuration] = useState("");
  const [entryProject, setEntryProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [newTaskProgress, setNewTaskProgress] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [pendingTimeEntry, setPendingTimeEntry] = useState<any>(null);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem('timer-state');
    if (savedTimerState) {
      const { isRunning, start, paused, task, project } = JSON.parse(savedTimerState);
      if (isRunning && start) {
        setIsTimerRunning(true);
        setStartTime(new Date(start));
        setPausedTime(paused || 0);
        setCurrentTask(task || "");
        setEntryProject(project || "");
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (isTimerRunning && startTime) {
      const timerState = {
        isRunning: isTimerRunning,
        start: startTime.toISOString(),
        paused: pausedTime,
        task: currentTask,
        project: entryProject
      };
      localStorage.setItem('timer-state', JSON.stringify(timerState));
    } else {
      localStorage.removeItem('timer-state');
    }
  }, [isTimerRunning, startTime, pausedTime, currentTask, entryProject]);
  
  const { data: timeEntries } = useCollection("timeEntries", [
    where("userId", "==", user?.uid || "")
  ]);

  const { data: projects } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("name", "asc")
  ]);

  // Fetch ongoing tasks for the selected project
  const { data: allTasks } = useCollection("tasks", entryProject && entryProject !== "none" ? [
    where("projectId", "==", entryProject)
  ] : []);
  
  // Filter to only show in-progress tasks
  const projectTasks = allTasks?.filter(task => 
    task.status === "in-progress" && task.projectId === entryProject
  ) || [];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        const currentElapsed = Date.now() - startTime.getTime() + pausedTime;
        setElapsedTime(currentElapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, startTime, pausedTime]);

  const handleStartTimer = () => {
    if (!entryProject) {
      toast({
        title: "Error", 
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentTask || currentTask === "no-tasks") {
      toast({
        title: "Error",
        description: "Please select an ongoing task to track time for",
        variant: "destructive",
      });
      return;
    }
    
    setStartTime(new Date());
    setIsTimerRunning(true);
    setElapsedTime(pausedTime);
  };

  const handlePauseTimer = () => {
    if (startTime) {
      const currentElapsed = Date.now() - startTime.getTime() + pausedTime;
      setPausedTime(currentElapsed);
      setElapsedTime(currentElapsed);
    }
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    setStartTime(new Date());
    setIsTimerRunning(true);
  };

  const handleStopTimer = async () => {
    if (!user) return;

    const endTime = new Date();
    const totalElapsed = elapsedTime || (startTime ? Date.now() - startTime.getTime() + pausedTime : pausedTime);
    const duration = Math.floor(totalElapsed / 1000 / 60); // in minutes

    if (duration < 1) {
      toast({
        title: "Error",
        description: "Timer must run for at least 1 minute",
        variant: "destructive",
      });
      return;
    }

    // Get the selected task details for the description
    const selectedTaskData = projectTasks?.find(task => task.id === currentTask);
    const description = selectedTaskData ? selectedTaskData.title : "Unknown task";

    // Store the time entry data to save after user confirms
    const timeEntryData = {
      description: description,
      duration: duration,
      startTime: startTime,
      endTime: endTime,
      userId: user.uid,
      projectId: entryProject || null,
      taskId: currentTask || null,
    };

    setPendingTimeEntry(timeEntryData);
    setShowTaskCompletionModal(true);
  };

  const handleTaskComplete = async () => {
    if (!pendingTimeEntry || isCompletingTask) return;

    setIsCompletingTask(true);

    try {
      // Save the time entry
      await addDocument("timeEntries", pendingTimeEntry);

      // Mark the task as completed
      if (currentTask) {
        await updateDocument("tasks", currentTask, { status: "completed" });
      }

      // Add 2-second delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Success",
        description: `Task completed! Time saved: ${Math.floor(pendingTimeEntry.duration / 60)}h ${pendingTimeEntry.duration % 60}m`,
      });

      // Reset everything
      resetTimer();
      setShowTaskCompletionModal(false);
      setPendingTimeEntry(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save time entry or update task",
        variant: "destructive",
      });
    } finally {
      setIsCompletingTask(false);
    }
  };

  const handleTakeBreak = () => {
    if (!pendingTimeEntry) return;

    // Don't save the time entry yet - just pause the timer
    setIsTimerRunning(false);
    
    // Keep the accumulated time for when they resume
    const currentElapsed = pendingTimeEntry.duration * 60 * 1000; // Convert back to milliseconds
    setPausedTime(currentElapsed);
    setElapsedTime(currentElapsed);

    toast({
      title: "Break Time!",
      description: `Timer paused at ${Math.floor(pendingTimeEntry.duration / 60)}h ${pendingTimeEntry.duration % 60}m. Resume when you're ready!`,
    });

    // Close modal and clear pending entry
    setShowTaskCompletionModal(false);
    setPendingTimeEntry(null);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setPausedTime(0);
    setCurrentTask("");
    setEntryProject("");
    localStorage.removeItem('timer-state');
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!entryDescription.trim() || !entryProject || !newTaskProgress) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const progressPercentage = parseInt(newTaskProgress);
    if (isNaN(progressPercentage) || progressPercentage <= 0 || progressPercentage > 100) {
      toast({
        title: "Error",
        description: "Please enter a valid progress percentage (1-100)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a new progress task
      await addDocument("tasks", {
        title: entryDescription.trim(),
        description: `Progress task: ${progressPercentage}% contribution`,
        status: "pending",
        priority: "medium",
        progress: progressPercentage,
        projectId: entryProject,
        assigneeId: user.uid,
        createdAt: new Date(),
        dueDate: null,
      });

      toast({
        title: "Success",
        description: `Progress task added: ${entryDescription.trim()} (${progressPercentage}% contribution)`,
      });

      // Reset form
      setEntryDescription("");
      setEntryDuration("");
      setEntryProject("");
      setIsManualEntryOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = (milliseconds: number) => {
    const duration = intervalToDuration({ start: 0, end: milliseconds });
    return `${duration.hours || 0}:${String(duration.minutes || 0).padStart(2, '0')}:${String(duration.seconds || 0).padStart(2, '0')}`;
  };

  const formatDurationMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const totalTimeToday = timeEntries?.filter(entry => {
    if (!entry.startTime) return false;
    const entryDate = entry.startTime.toDate();
    const today = new Date();
    return entryDate.toDateString() === today.toDateString();
  }).reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Time Tracking" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer */}
          <Card className="lg:col-span-2 bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Timer Display */}
              <div className="text-center py-8">
                <div className="text-6xl font-mono font-bold text-emerald-400 mb-4">
                  {formatElapsedTime(elapsedTime)}
                </div>
                <div className="text-slate-400">
                  {isTimerRunning ? "Timer Running" : "Timer Stopped"}
                </div>
              </div>

              {/* Project Selection - Required */}
              <div className="space-y-2">
                <Label className="text-slate-200">Select Project</Label>
                <Select value={entryProject} onValueChange={(value) => {
                  setEntryProject(value);
                  setCurrentTask(""); // Reset task when project changes
                }} disabled={isTimerRunning}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Choose a project to track time for" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Selection - Shows after project selection */}
              {entryProject && entryProject !== "none" && (
                <div className="space-y-2">
                  <Label className="text-slate-200">Select Ongoing Task</Label>
                  <Select value={currentTask} onValueChange={setCurrentTask} disabled={isTimerRunning}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Choose which ongoing task to track time for" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {projectTasks && projectTasks.length > 0 ? (
                        projectTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                task.priority === 'high' ? 'bg-red-400' :
                                task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                              }`} />
                              <span>{task.title}</span>
                              <span className="text-xs text-slate-400">({task.priority})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tasks" disabled>
                          No ongoing tasks - Add tasks in project settings
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {projectTasks && projectTasks.length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Add ongoing tasks to your project to enable task-specific time tracking
                    </p>
                  )}
                </div>
              )}

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                {!isTimerRunning ? (
                  <Button
                    onClick={pausedTime > 0 ? handleResumeTimer : handleStartTimer}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {pausedTime > 0 ? "Resume" : "Start"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopTimer}
                    className="bg-red-600 hover:bg-red-700 text-white px-8"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop & Save
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats & Manual Entry */}
          <div className="space-y-6">
            {/* Today's Time */}
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Today's Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400">
                  {formatDurationMinutes(totalTimeToday)}
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  Total time logged today
                </p>
              </CardContent>
            </Card>

            {/* Add Progress Task */}
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Add Progress Task</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsManualEntryOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Time Entries */}
        <Card className="mt-6 bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-3 ${(timeEntries?.length || 0) > 5 ? 'max-h-[500px] overflow-y-auto' : ''}`}>
              {timeEntries?.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No time entries yet</p>
              ) : (
                timeEntries?.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-200">{entry.description}</h4>
                      <div className="flex items-center text-sm text-slate-400 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {entry.startTime && format(entry.startTime.toDate(), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-emerald-400">
                        {formatDurationMinutes(entry.duration || 0)}
                      </div>
                      <div className="text-xs text-slate-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {entry.startTime && format(entry.startTime.toDate(), "h:mm a")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Progress Task Dialog */}
        <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Add Progress Task</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleManualEntry} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Select Project</Label>
                <Select value={entryProject} onValueChange={setEntryProject} required>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {projects && projects.length > 0 ? (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{project.name}</span>
                            <span className="text-xs text-slate-400 ml-2">{project.progress}%</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects" disabled>
                        No projects available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskDescription" className="text-slate-200">Task Description</Label>
                <Input
                  id="taskDescription"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  placeholder="Task description (e.g., Project meeting)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progressPercentage" className="text-slate-200">Progress Percentage</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="progressPercentage"
                    type="number"
                    value={newTaskProgress}
                    onChange={(e) => setNewTaskProgress(e.target.value)}
                    required
                    min="1"
                    max="100"
                    className="bg-slate-800 border-slate-700 text-slate-100 flex-1"
                    placeholder="10"
                  />
                  <span className="text-slate-400">%</span>
                </div>
                <p className="text-xs text-slate-500">
                  This percentage will be added to the project progress when the task is completed
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsManualEntryOpen(false)}
                  className="flex-1 border-slate-700 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Adding..." : "Add Task Progress"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Task Completion Modal */}
        <Dialog open={showTaskCompletionModal} onOpenChange={setShowTaskCompletionModal}>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-center">
                🎉 Great work!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <p className="text-slate-200">
                  You've been working for <span className="font-semibold text-emerald-400">
                    {pendingTimeEntry && `${Math.floor(pendingTimeEntry.duration / 60)}h ${pendingTimeEntry.duration % 60}m`}
                  </span>
                </p>
                <p className="text-slate-300 text-sm">
                  Are you done with this task or taking a break?
                </p>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Working on:</p>
                <p className="text-slate-200 font-medium">
                  {pendingTimeEntry?.description || "Unknown task"}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleTakeBreak}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  ☕ Take a Break
                </Button>
                <Button
                  onClick={handleTaskComplete}
                  disabled={isCompletingTask}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {isCompletingTask ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      ✅ Task Complete
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                "Take a Break" saves your time but keeps the task ongoing. "Task Complete" marks it as finished.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
