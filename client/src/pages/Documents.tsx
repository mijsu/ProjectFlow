import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import DocumentEditor from "@/components/editor/DocumentEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Plus, Search, FileText, Workflow, FileCode, MoreHorizontal, FolderOpen, Layers } from "lucide-react";

export default function Documents() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState("document");
  const [newDocumentProject, setNewDocumentProject] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { user } = useAuth();
  
  const { data: documents, loading } = useCollection("documents", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("updatedAt", "desc")
  ]);

  // Get user's projects for document linking
  const { data: projects } = useCollection("projects", [
    where("ownerId", "==", user?.uid || ""),
    orderBy("name", "asc")
  ]);

  // Document templates for quick creation
  const documentTemplates = [
    {
      id: "blank",
      name: "Blank Document",
      description: "Start with a clean slate",
      type: "document",
      icon: FileText,
      content: ""
    },
    {
      id: "meeting-notes",
      name: "Meeting Notes",
      description: "Template for meeting documentation",
      type: "document", 
      icon: FileText,
      content: `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Attendees:** 
**Duration:** 

## Agenda
- 
- 
- 

## Discussion Points
### Topic 1


### Topic 2


## Action Items
- [ ] 
- [ ] 
- [ ] 

## Next Steps

`
    },
    {
      id: "project-plan",
      name: "Project Plan",
      description: "Structured project planning template",
      type: "document",
      icon: FolderOpen,
      content: `# Project Plan

## Project Overview
**Project Name:** 
**Start Date:** 
**End Date:** 
**Project Manager:** 

## Objectives
- 
- 
- 

## Scope
### In Scope
- 
- 

### Out of Scope
- 
- 

## Timeline
| Phase | Start Date | End Date | Deliverables |
|-------|------------|----------|--------------|
|       |            |          |              |

## Resources
- 
- 

## Risk Assessment
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
|      |        |             |            |

## Success Criteria
- 
- 
`
    },
    {
      id: "flowchart",
      name: "Flowchart",
      description: "Process flow diagram",
      type: "flowchart",
      icon: Workflow,
      content: "# Process Flowchart\n\n[Start your flowchart here]"
    },
    {
      id: "dfd",
      name: "Data Flow Diagram",
      description: "System data flow visualization",
      type: "dfd",
      icon: Workflow,
      content: "# Data Flow Diagram\n\n[Design your data flow here]"
    }
  ];

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
    setIsCreateDialogOpen(true);
  };

  const handleCreateDocument = () => {
    const template = documentTemplates.find(t => t.id === selectedTemplate);
    const newDocument = {
      title: template?.name === "Blank Document" ? "Untitled Document" : template?.name || "New Document",
      content: template?.content || "",
      type: template?.type || newDocumentType,
      projectId: newDocumentProject || null
    };
    
    setSelectedDocument(newDocument);
    setIsCreateDialogOpen(false);
    setIsEditorOpen(true);
    
    // Reset form
    setSelectedTemplate("");
    setNewDocumentType("document");
    setNewDocumentProject("");
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
        projectId={newDocumentProject}
      />

      {/* Enhanced Document Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="text-slate-200 font-medium">Choose a Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {documentTemplates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.id;
                  
                  return (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all border-2 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-600/10' 
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-emerald-600' : 'bg-slate-800'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-100">{template.name}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">{template.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Project Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Link to Project (Optional)</Label>
                <Select value={newDocumentProject} onValueChange={setNewDocumentProject}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="">No project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Document Type</Label>
                <Select value={newDocumentType} onValueChange={setNewDocumentType}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="flowchart">Flowchart</SelectItem>
                    <SelectItem value="dfd">Data Flow Diagram</SelectItem>
                    <SelectItem value="code">Code Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDocument}
                disabled={!selectedTemplate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Create Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
