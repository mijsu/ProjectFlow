import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDocument, updateDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import DiagramCanvas from "./DiagramCanvas";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image,
  Save,
  X,
  Type,
  Quote,
  Code,
  Eye,
  Edit3,
  FileText,
  Workflow,
  FileCode,
  Palette,
  RotateCcw,
  RotateCw,
  Shapes
} from "lucide-react";

interface AdvancedDocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document?: any;
  projectId?: string;
}

export default function AdvancedDocumentEditor({ isOpen, onClose, document, projectId }: AdvancedDocumentEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("document");
  const [saving, setSaving] = useState(false);
  const [isRealTimeView, setIsRealTimeView] = useState(true);
  const [isDiagramMode, setIsDiagramMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [diagramElements, setDiagramElements] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setContent(document.content || "");
      setType(document.type || "document");
    } else {
      setTitle("");
      setContent("");
      setType("document");
    }
    // Reset diagram mode when type changes to non-diagram types
    if (type !== 'flowchart' && type !== 'dfd') {
      setIsDiagramMode(false);
    }
  }, [document, type]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Enhanced formatting functions
  const insertTextAtCursor = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatBold = () => insertTextAtCursor("**", "**");
  const formatItalic = () => insertTextAtCursor("*", "*");
  const formatUnderline = () => insertTextAtCursor("<u>", "</u>");
  const formatCode = () => insertTextAtCursor("`", "`");
  const formatQuote = () => insertTextAtCursor("> ");
  
  const insertHeading = (level: number) => {
    const prefix = "#".repeat(level) + " ";
    insertTextAtCursor(prefix);
  };
  
  const insertList = () => insertTextAtCursor("- ");
  const insertOrderedList = () => insertTextAtCursor("1. ");
  
  const insertTable = () => {
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    insertTextAtCursor(tableTemplate);
  };

  // Advanced Diagram Templates
  const insertFlowchartTemplate = () => {
    const flowchartTemplate = `
# Flowchart Diagram

## Process Flow
\`\`\`
START
  ↓
[Decision Point]
  ↓ YES        ↓ NO
[Process A]   [Process B]
  ↓             ↓
[Result A]    [Result B]
  ↓             ↓
END           END
\`\`\`

## Flowchart Elements:
- **Oval**: Start/End points
- **Rectangle**: Process steps
- **Diamond**: Decision points
- **Arrows**: Flow direction

### Key Components:
1. **Input**: Data or trigger
2. **Process**: Action or operation
3. **Decision**: Yes/No branch
4. **Output**: Final result
`;
    setContent(flowchartTemplate);
  };

  const insertDFDTemplate = () => {
    const dfdTemplate = `
# Data Flow Diagram (DFD)

## Level 0 - Context Diagram
\`\`\`
External Entity 1 ──→ [System Name] ──→ External Entity 2
                       ↓
                   Data Store
\`\`\`

## Level 1 - Detailed Processes
\`\`\`
[Process 1] ──→ D1: Database
     ↓
[Process 2] ──→ [Process 3]
     ↓              ↓
External User ←── Output
\`\`\`

## DFD Components:
- **Circles**: Processes (numbered)
- **Squares**: External entities
- **Open rectangles**: Data stores (D1, D2...)
- **Arrows**: Data flows (labeled)

### Data Flows:
1. **Input flows**: Data entering system
2. **Output flows**: Data leaving system
3. **Internal flows**: Data between processes
4. **Storage flows**: Data to/from storage
`;
    setContent(dfdTemplate);
  };

  const insertERDTemplate = () => {
    const erdTemplate = `
# Entity Relationship Diagram (ERD)

## Database Schema Design

### Entities and Relationships:
\`\`\`
[Customer] ──(1:M)── [Order] ──(M:1)── [Product]
    |                   |
    |                   |
[Address]           [OrderItem]
    |                   |
 (1:1)               (M:M)
\`\`\`

## Entity Details:

### Customer Entity
- **Primary Key**: CustomerID
- **Attributes**: Name, Email, Phone
- **Relationships**: 
  - Has many Orders (1:M)
  - Has one Address (1:1)

### Order Entity
- **Primary Key**: OrderID
- **Foreign Keys**: CustomerID
- **Attributes**: OrderDate, TotalAmount
- **Relationships**:
  - Belongs to Customer (M:1)
  - Contains many OrderItems (1:M)

### Product Entity
- **Primary Key**: ProductID
- **Attributes**: Name, Price, Description
- **Relationships**:
  - Appears in many Orders (M:M via OrderItem)
`;
    setContent(erdTemplate);
  };

  const insertUMLTemplate = () => {
    const umlTemplate = `
# UML Class Diagram

## System Architecture

### Class Structure:
\`\`\`
┌─────────────────┐
│    BaseClass    │
├─────────────────┤
│ - attribute1    │
│ - attribute2    │
├─────────────────┤
│ + method1()     │
│ + method2()     │
└─────────────────┘
         ↑
         │ (inheritance)
         │
┌─────────────────┐
│  DerivedClass   │
├─────────────────┤
│ - newAttribute  │
├─────────────────┤
│ + newMethod()   │
└─────────────────┘
\`\`\`

## Class Relationships:
- **Inheritance**: ──▷ (is-a relationship)
- **Association**: ──── (uses relationship)
- **Aggregation**: ──◇ (has-a relationship)
- **Composition**: ──◆ (part-of relationship)

### Access Modifiers:
- **+** Public
- **-** Private
- **#** Protected
- **~** Package
`;
    setContent(umlTemplate);
  };

  const insertNetworkDiagramTemplate = () => {
    const networkTemplate = `
# Network Architecture Diagram

## Network Topology

### Infrastructure Layout:
\`\`\`
Internet ──→ Router ──→ Firewall ──→ Switch
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
              Web Server         Database Server    File Server
               (Apache)           (MySQL)          (Storage)
                    │                 │                 │
              Load Balancer     Backup Server    Print Server
\`\`\`

## Network Components:

### Core Infrastructure:
1. **Router**: Traffic routing and internet gateway
2. **Firewall**: Security and access control
3. **Switch**: Local network connectivity
4. **Load Balancer**: Traffic distribution

### Servers:
1. **Web Server**: Application hosting
2. **Database Server**: Data storage and management
3. **File Server**: Document and file storage
4. **Backup Server**: Data redundancy

### Security Zones:
- **DMZ**: Public-facing services
- **Internal Network**: Private resources
- **Management Network**: Administrative access
`;
    setContent(networkTemplate);
  };

  const insertProcessFlowTemplate = () => {
    const processTemplate = `
# Business Process Flow

## Workflow Diagram

### Process Steps:
\`\`\`
Request Received
       ↓
[Validation Check] ──→ [Rejected] → End
       ↓ (Valid)
[Assignment] ──→ [Team A] / [Team B]
       ↓
[Processing]
       ↓
[Quality Check] ──→ [Rework] ──┐
       ↓ (Approved)              │
[Final Review] ←─────────────────┘
       ↓
[Delivery/Output]
       ↓
Process Complete
\`\`\`

## Process Elements:

### Decision Points:
- **Validation**: Check requirements
- **Assignment**: Route to appropriate team
- **Quality Check**: Verify standards
- **Final Review**: Management approval

### Parallel Processes:
1. **Team A**: Technical processing
2. **Team B**: Administrative processing

### Loop-backs:
- **Rework**: Return to processing if quality fails
- **Revision**: Return to review if changes needed
`;
    setContent(processTemplate);
  };

  const insertSystemArchitectureTemplate = () => {
    const systemTemplate = `
# System Architecture Diagram

## High-Level Architecture

### System Components:
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  [Web App]     [Mobile App]     [Admin Dashboard]          │
│     │              │                    │                  │
│     └──────────────┼────────────────────┘                  │
│                    │                                        │
├─────────────────────────────────────────────────────────────┤
│                 API Gateway                                 │
├─────────────────────────────────────────────────────────────┤
│  [Authentication] [Rate Limiting] [Load Balancer]          │
│          │              │              │                   │
├─────────────────────────────────────────────────────────────┤
│                 Microservices Layer                        │
├─────────────────────────────────────────────────────────────┤
│ [User Service] [Order Service] [Payment Service] [Notify]  │
│       │            │              │              │         │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│ [User DB]     [Order DB]     [Cache]     [File Storage]    │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Architecture Patterns:
- **Microservices**: Independent, scalable services
- **API Gateway**: Single entry point for all requests
- **Database per Service**: Data isolation and independence
- **Event-Driven**: Asynchronous communication between services

### Technology Stack:
- **Frontend**: React, Vue.js, React Native
- **API Gateway**: Kong, AWS API Gateway, Nginx
- **Backend**: Node.js, Python, Go, Java
- **Databases**: PostgreSQL, MongoDB, Redis
- **Infrastructure**: Docker, Kubernetes, AWS/GCP
`;
    setContent(systemTemplate);
  };

  const insertSequenceDiagramTemplate = () => {
    const sequenceTemplate = `
# Sequence Diagram

## User Authentication Flow

### Interaction Timeline:
\`\`\`
User        →  Frontend     →  API Gateway  →  Auth Service  →  Database
 │               │              │              │              │
 │ Login Request │              │              │              │
 ├──────────────→│              │              │              │
 │               │ POST /login  │              │              │
 │               ├─────────────→│              │              │
 │               │              │ Validate     │              │
 │               │              ├─────────────→│              │
 │               │              │              │ Query User   │
 │               │              │              ├─────────────→│
 │               │              │              │ User Data    │
 │               │              │              │←─────────────┤
 │               │              │ JWT Token    │              │
 │               │              │←─────────────┤              │
 │               │ Success +    │              │              │
 │               │ Token        │              │              │
 │               │←─────────────┤              │              │
 │ Dashboard     │              │              │              │
 │←──────────────┤              │              │              │
\`\`\`

## Sequence Elements:
- **Actors**: User, System components
- **Messages**: Requests and responses
- **Lifelines**: Vertical lines showing object existence
- **Activation**: Boxes showing when object is active

### Alternative Flows:
1. **Invalid Credentials**: Return error message
2. **Account Locked**: Display security notice
3. **Network Error**: Show retry option
`;
    setContent(sequenceTemplate);
  };

  const insertMindMapTemplate = () => {
    const mindMapTemplate = `
# Mind Map

## Project Planning Mind Map

### Central Topic: **New Product Launch**
\`\`\`
                    📱 New Product Launch
                           │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    🎯 Strategy         📊 Research      🛠️ Development
        │                 │                 │
    ┌───┼───┐         ┌───┼───┐         ┌───┼───┐
    │   │   │         │   │   │         │   │   │
 Goals│Comp│Team   Market│User│Tech   Design│Code│Test
      │   │         │     │   │         │    │   │
   Revenue│Brand  Size│ Needs│Trends  UI/UX│API│QA
   Target │       │     │    │        │    │   │
          │       │  Surveys│Analysis Mockup│Unit│
        Share     │         │        │     │   │
                 Focus    Research  Prototype│Integration
                Groups             │        │
                                  MVP     Performance
\`\`\`

## Mind Map Benefits:
- **Visual Organization**: See relationships clearly
- **Brainstorming**: Generate and connect ideas
- **Planning**: Break down complex projects
- **Memory Aid**: Visual structure improves recall

### Branch Categories:
1. **Main Branches**: Primary topics (thick lines)
2. **Sub-branches**: Supporting ideas (medium lines)
3. **Details**: Specific items (thin lines)
4. **Connections**: Relationships between branches

### Customization Tips:
- Use **colors** for different categories
- Add **icons** and **emojis** for visual appeal
- Keep **text short** and meaningful
- Use **keywords** rather than sentences
`;
    setContent(mindMapTemplate);
  };

  const insertWireframeTemplate = () => {
    const wireframeTemplate = `
# UI Wireframe

## Web Application Layout

### Desktop Wireframe:
\`\`\`
┌────────────────────────────────────────────────────────────┐
│  [Logo]           Navigation Menu           [User] [Login] │ Header
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │             │  │                                     │  │
│  │  Sidebar    │  │           Main Content              │  │ Main
│  │             │  │                                     │  │
│  │ □ Menu 1    │  │  ┌─────────────┐ ┌─────────────┐   │  │
│  │ □ Menu 2    │  │  │    Card 1   │ │    Card 2   │   │  │
│  │ □ Menu 3    │  │  │             │ │             │   │  │
│  │ □ Menu 4    │  │  │  Content    │ │  Content    │   │  │
│  │             │  │  │             │ │             │   │  │
│  │             │  │  └─────────────┘ └─────────────┘   │  │
│  └─────────────┘  │                                     │  │
│                   │  [Button]    [Button]    [Button]   │  │
│                   └─────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│         Footer Links    |    Copyright    |    Contact     │ Footer
└────────────────────────────────────────────────────────────┘
\`\`\`

### Mobile Wireframe:
\`\`\`
┌─────────────────┐
│ [☰] App [🔍][⚙] │ Header
├─────────────────┤
│                 │
│  ┌─────────────┐│
│  │   Banner    ││ Main
│  │   Content   ││
│  └─────────────┘│
│                 │
│  ┌─────────────┐│
│  │    Card     ││
│  │             ││
│  │  Content    ││
│  │             ││
│  │  [Action]   ││
│  └─────────────┘│
│                 │
│  ┌─────────────┐│
│  │    Card     ││
│  │             ││
│  │  Content    ││
│  │             ││
│  │  [Action]   ││
│  └─────────────┘│
├─────────────────┤
│ [🏠] [📊] [👤] │ Nav
└─────────────────┘
\`\`\`

## Wireframe Elements:
- **Boxes**: Containers and sections
- **Lines**: Borders and dividers
- **Text**: Content placeholders
- **Icons**: Functional elements

### Design Principles:
1. **Hierarchy**: Important elements are prominent
2. **Alignment**: Elements line up consistently
3. **Spacing**: Adequate white space between elements
4. **Grouping**: Related items are visually connected
`;
    setContent(wireframeTemplate);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const linkText = prompt("Enter link text:") || "Link";
      insertTextAtCursor(`[${linkText}](${url})`);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const altText = prompt("Enter image description:") || "Image";
      insertTextAtCursor(`![${altText}](${url})`);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document title",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const documentData = {
        title: title.trim(),
        content,
        type,
        ownerId: user.uid,
        projectId: projectId || document?.projectId || null,
        updatedAt: new Date(),
      };

      if (document?.id) {
        await updateDocument("documents", document.id, documentData);
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        await addDocument("documents", {
          ...documentData,
          createdAt: new Date(),
        });
        toast({
          title: "Success",
          description: "Document created successfully",
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (docType: string) => {
    switch (docType) {
      case "flowchart":
      case "dfd":
        return <Workflow className="w-4 h-4" />;
      case "code":
        return <FileCode className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderPreview = () => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-300">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-blue-300">$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u class="underline text-purple-300">$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-green-300 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-emerald-400 border-b border-emerald-600 pb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-4 text-emerald-300">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mb-3 text-emerald-200">$1</h3>')
      .replace(/^- (.*$)/gm, '<div class="flex items-start mb-2"><span class="text-emerald-400 mr-2">•</span><span class="text-slate-200">$1</span></div>')
      .replace(/^\d+\. (.*$)/gm, '<div class="flex items-start mb-2"><span class="text-emerald-400 mr-2 font-mono">1.</span><span class="text-slate-200">$1</span></div>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-emerald-500 bg-slate-800/50 pl-4 py-3 italic text-slate-300 my-4 rounded-r">$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline transition-colors">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 border border-slate-700" />')
      .replace(/\n/g, '<br>');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-0 overflow-hidden shadow-2xl flex flex-col">
        <DialogTitle className="sr-only">Document Editor</DialogTitle>
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <Input
                  placeholder="Enter document title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 p-0 h-auto w-96"
                />
                <div className="flex items-center space-x-3 mt-2">
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-64 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(type)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="document">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Document</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="flowchart">
                        <div className="flex items-center space-x-2">
                          <Workflow className="w-4 h-4" />
                          <span>Flowchart</span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Visual Builder</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dfd">
                        <div className="flex items-center space-x-2">
                          <Workflow className="w-4 h-4" />
                          <span>Data Flow Diagram</span>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Visual Builder</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="code">
                        <div className="flex items-center space-x-2">
                          <FileCode className="w-4 h-4" />
                          <span>Code Documentation</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {wordCount} words
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {(type === 'flowchart' || type === 'dfd') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDiagramMode(!isDiagramMode)}
                  className={`${isDiagramMode 
                    ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } shadow-sm`}
                >
                  <Shapes className="w-4 h-4 mr-2" />
                  {isDiagramMode ? "Visual Builder" : "Enable Visual Builder"}
                </Button>
              )}
              {!isDiagramMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRealTimeView(!isRealTimeView)}
                  className={`${isRealTimeView 
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } shadow-sm`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isRealTimeView ? "Live Preview" : "Text Only"}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Document"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Toolbar */}
        {!isDiagramMode && (
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                {/* Template Insertion */}
                <Select onValueChange={(value) => {
                  if (value === "flowchart") insertFlowchartTemplate();
                  else if (value === "dfd") insertDFDTemplate();
                  else if (value === "erd") insertERDTemplate();
                  else if (value === "uml") insertUMLTemplate();
                  else if (value === "network") insertNetworkDiagramTemplate();
                  else if (value === "process") insertProcessFlowTemplate();
                  else if (value === "system") insertSystemArchitectureTemplate();
                  else if (value === "sequence") insertSequenceDiagramTemplate();
                  else if (value === "mindmap") insertMindMapTemplate();
                  else if (value === "wireframe") insertWireframeTemplate();
                }}>
                  <SelectTrigger className="w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Workflow className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>📋 Insert Template</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="flowchart">
                      <div className="flex items-center space-x-2">
                        <span>🔄</span>
                        <span>Flowchart</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dfd">
                      <div className="flex items-center space-x-2">
                        <span>📊</span>
                        <span>Data Flow Diagram</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="erd">
                      <div className="flex items-center space-x-2">
                        <span>🗄️</span>
                        <span>Database Schema</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="uml">
                      <div className="flex items-center space-x-2">
                        <span>📐</span>
                        <span>UML Class Diagram</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="network">
                      <div className="flex items-center space-x-2">
                        <span>🌐</span>
                        <span>Network Architecture</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="process">
                      <div className="flex items-center space-x-2">
                        <span>⚙️</span>
                        <span>Business Process</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center space-x-2">
                        <span>🏗️</span>
                        <span>System Architecture</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sequence">
                      <div className="flex items-center space-x-2">
                        <span>🔄</span>
                        <span>Sequence Diagram</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mindmap">
                      <div className="flex items-center space-x-2">
                        <span>🧠</span>
                        <span>Mind Map</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="wireframe">
                      <div className="flex items-center space-x-2">
                        <span>📱</span>
                        <span>UI Wireframe</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                💡 Use markdown formatting or select templates above
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-3 px-4 pb-4">
              {/* Text Formatting */}
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatBold}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none first:rounded-l-lg"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatItalic}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatUnderline}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatCode}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none last:rounded-r-lg"
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </div>

              {/* Headings */}
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(1)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 text-xs font-bold px-3 rounded-none first:rounded-l-lg"
                  title="Heading 1"
                >
                  H1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(2)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 text-xs font-bold px-3 rounded-none"
                  title="Heading 2"
                >
                  H2
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(3)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 text-xs font-bold px-3 rounded-none last:rounded-r-lg"
                  title="Heading 3"
                >
                  H3
                </Button>
              </div>

              {/* Lists */}
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertList}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none first:rounded-l-lg"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertOrderedList}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatQuote}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none last:rounded-r-lg"
                  title="Quote Block"
                >
                  <Quote className="w-4 h-4" />
                </Button>
              </div>

              {/* Media & Tools */}
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertLink}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none first:rounded-l-lg"
                  title="Insert Link"
                >
                  <Link className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertImage}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-none"
                  title="Insert Image"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertTable}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 text-xs px-3 rounded-none last:rounded-r-lg"
                  title="Insert Table"
                >
                  Table
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area - Visual Builder or Text Editor */}
        <div className="flex-1 overflow-hidden">
          {isDiagramMode ? (
            // Visual Diagram Builder
            <DiagramCanvas
              onSave={(elements) => {
                setDiagramElements(elements);
                // Convert diagram to text representation
                const diagramText = `# Visual Diagram\n\nDiagram created with ${elements.length} elements.\n\n${JSON.stringify(elements, null, 2)}`;
                setContent(diagramText);
                toast({
                  title: "Success",
                  description: "Diagram saved to document content",
                });
              }}
              initialElements={diagramElements}
            />
          ) : isRealTimeView ? (
            // Modern Split-screen Editor
            <div className="h-full flex bg-gray-50 dark:bg-gray-900">
              {/* Left side - Editor */}
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Editor</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Type using markdown syntax
                    </div>
                  </div>
                  <div className="flex-1 p-4 min-h-0">
                    <Textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Start writing your document...

✨ **Formatting Guide:**
• **Bold text** for emphasis
• *Italic text* for style  
• # Heading 1, ## Heading 2, ### Heading 3
• - Bullet lists or 1. Numbered lists
• > Block quotes for important notes
• `inline code` for technical terms
• [link text](url) for hyperlinks

💡 **Pro Tip:** Use the template dropdown above to insert professional diagram templates!"
                      className="w-full h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 leading-relaxed p-4 rounded-lg shadow-sm"
                      style={{ minHeight: '400px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Right side - Live Preview */}
              <div className="w-1/2">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Preview</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      See your formatted output
                    </div>
                  </div>
                  <div className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 min-h-0">
                    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm" style={{ minHeight: '400px' }}>
                      <div 
                        className="prose prose-gray dark:prose-invert prose-lg max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderPreview() }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Clean Full-screen Editor
            <div className="h-full bg-gray-50 dark:bg-gray-900">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Type className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Text Editor</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Raw markdown editing mode
                  </div>
                </div>
                <div className="flex-1 p-6 min-h-0">
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your document using markdown syntax...

✨ **Markdown Reference:**
• **Bold text** for emphasis
• *Italic text* for style  
• # Heading 1, ## Heading 2, ### Heading 3
• - Bullet lists or 1. Numbered lists
• > Block quotes for important notes
• `inline code` for technical terms
• [link text](url) for hyperlinks
• ![alt text](image-url) for images

🚀 **Happy writing!** Your content will be beautifully formatted when saved."
                    className="w-full h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 leading-relaxed p-6 rounded-lg shadow-sm overflow-y-auto"
                    style={{ minHeight: '500px' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}