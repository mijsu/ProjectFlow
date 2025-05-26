import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Calendar() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Calendar" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Calendar Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              Calendar functionality will be implemented here. This will include:
            </p>
            <ul className="list-disc list-inside text-slate-400 mt-4 space-y-2">
              <li>Event scheduling and management</li>
              <li>Project deadlines visualization</li>
              <li>Task due dates</li>
              <li>Meeting scheduling</li>
              <li>Integration with projects and documents</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
