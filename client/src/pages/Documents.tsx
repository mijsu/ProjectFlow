import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import DocumentEditor from "@/components/editor/DocumentEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Plus, Search, FileText, Workflow, FileCode, MoreHorizontal } from "lucide-react";

export default function Documents() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const { data: documents, loading } = useCollection("documents", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc")
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

  const filteredDocuments = documents?.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEditDocument = (document: any) => {
    setSelectedDocument(document);
    setIsEditorOpen(true);
  };

  const handleNewDocument = () => {
    setSelectedDocument(null);
    setIsEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Documents" />
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-950 border-slate-800 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Documents" />
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          
          <Button 
            onClick={handleNewDocument}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Create your first document to get started"
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={handleNewDocument}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((document) => {
              const Icon = getDocumentIcon(document.type);
              const colorClasses = getDocumentColor(document.type);
              
              return (
                <Card 
                  key={document.id} 
                  className="bg-slate-950 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                  onClick={() => handleEditDocument(document)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more options
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                      {document.title}
                    </h3>
                    
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {document.content || "No content"}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {document.type}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(document.updatedAt?.toDate() || new Date(), { 
                          addSuffix: true 
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <DocumentEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
}
