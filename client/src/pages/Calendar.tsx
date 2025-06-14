import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useCollection, addDocument } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";
import { format, isSameDay } from "date-fns";
import { Plus, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: events } = useCollection("events", [
    where("userId", "==", user?.uid || "")
  ]);

  const eventsForSelectedDate = events?.filter(event => 
    event.startTime && isSameDay(event.startTime.toDate(), selectedDate)
  ) || [];

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!eventTitle.trim() || !eventStartTime || !eventEndTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${format(eventDate, "yyyy-MM-dd")}T${eventStartTime}`);
      const endDateTime = new Date(`${format(eventDate, "yyyy-MM-dd")}T${eventEndTime}`);

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      const eventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        type: eventType,
        startTime: startDateTime,
        endTime: endDateTime,
        userId: user.uid,
      };

      await addDocument("events", eventData);
      
      toast({
        title: "Success",
        description: "Schedule created successfully!",
      });
      
      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventType("meeting");
      setEventStartTime("");
      setEventEndTime("");
      setEventDate(selectedDate);
      setIsEventFormOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Calendar" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 bg-slate-950 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-100">Calendar</CardTitle>
              <Button 
                onClick={() => setIsEventFormOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg font-semibold text-slate-100">
                    {format(selectedDate, "MMMM yyyy")}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Advanced Calendar Grid */}
                <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center text-xs font-medium text-slate-400">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 42 }, (_, i) => {
                      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - 6);
                      const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                      const isSelected = isSameDay(date, selectedDate);
                      const isToday = isSameDay(date, new Date());
                      const hasEvents = events?.some(event => 
                        event.startTime && isSameDay(event.startTime.toDate(), date)
                      );

                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            relative p-2 h-12 text-sm rounded transition-colors
                            ${isCurrentMonth ? 'text-slate-200' : 'text-slate-500'}
                            ${isSelected ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}
                            ${isToday && !isSelected ? 'bg-blue-600/20 text-blue-400' : ''}
                          `}
                        >
                          {date.getDate()}
                          {hasEvents && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events for Selected Date */}
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Schedule for {format(selectedDate, "MMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventsForSelectedDate.length === 0 ? (
                  <p className="text-slate-400 text-sm">No schedule items</p>
                ) : (
                  eventsForSelectedDate.map((event) => (
                    <div key={event.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <h4 className="font-medium text-slate-200 mb-1">{event.title}</h4>
                      <div className="flex items-center text-xs text-slate-400 mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(event.startTime.toDate(), "h:mm a")} - {format(event.endTime.toDate(), "h:mm a")}
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-400">{event.description}</p>
                      )}
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          event.type === "meeting" ? "bg-blue-600/20 text-blue-400" :
                          event.type === "deadline" ? "bg-red-600/20 text-red-400" :
                          "bg-green-600/20 text-green-400"
                        }`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Creation Dialog */}
        <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Create New Schedule</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">Schedule Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  placeholder="Enter schedule title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">Description</Label>
                <Textarea
                  id="description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 resize-none"
                  placeholder="Enter schedule description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Schedule Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(eventDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={eventDate}
                      onSelect={(date) => date && setEventDate(date)}
                      initialFocus
                      className="bg-slate-900"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-200">Schedule Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-slate-200">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-slate-200">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEventFormOpen(false)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? "Creating..." : "Create Schedule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}