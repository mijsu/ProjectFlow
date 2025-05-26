import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileCode, Workflow, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy, limit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function RecentDocuments() {
  const { user } = useAuth();
  
  const { data: documents, loading } = useCollection("documents", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc"),
    limit(5)
  ]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "diagram":
      case "flowchart":
      case "dfd":
        return Workflow;
      case "code":
        return FileCode;
      default:
        return FileText;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case "diagram":
      case "flowchart":
      case "dfd":
        return "text-purple-400 bg-purple-500/10";
      case "code":
        return "text-green-400 bg-green-600/10";
      default:
        return "text-blue-400 bg-blue-600/10";
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950 border-slate-800 h-[500px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="text-slate-100">Recent Documents</CardTitle>
        <Link href="/documents">
          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className={`space-y-3 h-full ${documents?.length > 5 ? 'overflow-y-auto pr-2' : 'overflow-y-hidden'}`}>
          {documents?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No documents yet</p>
              <Link href="/documents/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Create Your First Document
                </Button>
              </Link>
            </div>
          ) : (
            documents?.map((document) => {
              const Icon = getDocumentIcon(document.type);
              const colorClasses = getDocumentColor(document.type);
              
              return (
                <div
                  key={document.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/documents/${document.id}`}>
                      <p className="font-medium text-sm text-slate-200 hover:text-emerald-400 transition-colors truncate">
                        {document.title}
                      </p>
                    </Link>
                    <p className="text-xs text-slate-400">
                      Modified {formatDistanceToNow(document.updatedAt?.toDate() || new Date(), { 
                        addSuffix: true 
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
