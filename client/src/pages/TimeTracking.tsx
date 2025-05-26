import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimeTracking() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Time Tracking" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Time Tracking Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              Time tracking functionality will be implemented here. This will include:
            </p>
            <ul className="list-disc list-inside text-slate-400 mt-4 space-y-2">
              <li>Start/stop timers for projects and tasks</li>
              <li>Manual time entry</li>
              <li>Time reporting and analytics</li>
              <li>Productivity insights</li>
              <li>Integration with projects and documents</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
