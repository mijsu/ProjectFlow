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
import { useCollection, addDocument } from "@/hooks/useFirestore";
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
  const [loading, setLoading] = useState(false);
  
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
    if (!currentTask.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task description",
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

    try {
      await addDocument("timeEntries", {
        description: currentTask,
        duration: duration,
        startTime: startTime,
        endTime: endTime,
        userId: user.uid,
        projectId: entryProject || null,
      });

      toast({
        title: "Success",
        description: `Time entry saved: ${Math.floor(duration / 60)}h ${duration % 60}m`,
      });

      // Reset timer
      setIsTimerRunning(false);
      setStartTime(null);
      setElapsedTime(0);
      setPausedTime(0);
      setCurrentTask("");
      localStorage.removeItem('timer-state');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!entryDescription.trim() || !entryDuration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const durationMinutes = parseInt(entryDuration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid duration in minutes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const entryStartTime = new Date(`${entryDate}T12:00:00`);
      const entryEndTime = new Date(entryStartTime.getTime() + durationMinutes * 60 * 1000);

      await addDocument("timeEntries", {
        description: entryDescription.trim(),
        duration: durationMinutes,
        startTime: entryStartTime,
        endTime: entryEndTime,
        userId: user.uid,
        projectId: entryProject || null,
      });

      toast({
        title: "Success",
        description: `Manual time entry added: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
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

              {/* Task Input */}
              <div className="space-y-2">
                <Label htmlFor="currentTask" className="text-slate-200">
                  What are you working on?
                </Label>
                <Input
                  id="currentTask"
                  type="text"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder="Enter task description..."
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  disabled={isTimerRunning}
                />
              </div>

              {/* Project Selection */}
              <div className="space-y-2">
                <Label className="text-slate-200">Project (Optional)</Label>
                <Select value={entryProject} onValueChange={setEntryProject} disabled={isTimerRunning}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="none">No project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  <>
                    <Button
                      onClick={handlePauseTimer}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      onClick={handleStopTimer}
                      className="bg-red-600 hover:bg-red-700 text-white px-8"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop & Save
                    </Button>
                  </>
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

            {/* Manual Entry */}
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsManualEntryOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Entry
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

        {/* Manual Entry Dialog */}
        <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Add Manual Time Entry</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleManualEntry} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">Description</Label>
                <Textarea
                  id="description"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100 resize-none"
                  placeholder="What did you work on?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-200">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-slate-200">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={entryDuration}
                  onChange={(e) => setEntryDuration(e.target.value)}
                  required
                  min="1"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  placeholder="e.g., 60"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Project (Optional)</Label>
                <Select value={entryProject} onValueChange={setEntryProject}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="none">No project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsManualEntryOpen(false)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? "Adding..." : "Add Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
