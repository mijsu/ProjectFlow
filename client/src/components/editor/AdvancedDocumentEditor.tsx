import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDocument, updateDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
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
  RotateCw
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
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
  }, [document]);

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

  // Professional diagram templates
  const getTemplateContent = (docType: string) => {
    switch (docType) {
      case "flowchart":
        return `# Flowchart Template

## Process Flow
\`\`\`
┌─────────────┐
│    Start    │
└─────┬───────┘
      │
      v
┌─────────────┐
│  Input Data │
└─────┬───────┘
      │
      v
┌─────────────┐     No
│  Validation │────────┐
│   Process   │        │
└─────┬───────┘        │
      │ Yes            │
      v                │
┌─────────────┐        │
│   Process   │        │
│    Data     │        │
└─────┬───────┘        │
      │                │
      v                │
┌─────────────┐        │
│   Output    │        │
│   Results   │        │
└─────┬───────┘        │
      │                │
      v                │
┌─────────────┐        │
│     End     │←───────┘
└─────────────┘
\`\`\`

## Key Steps:
1. **Start Process** - Initialize workflow
2. **Input Data** - Collect required information
3. **Validation** - Check data integrity
4. **Process Data** - Execute main logic
5. **Output Results** - Display final outcome
6. **End Process** - Complete workflow

## Decision Points:
- **Validation Check**: Determines if data meets criteria
- **Error Handling**: Routes to appropriate error resolution

## Notes:
- Replace text above with your specific process steps
- Use ASCII art for visual flow representation
- Add decision diamonds where needed`;

      case "dfd":
        return `# Data Flow Diagram Template

## Level 0: Context Diagram
\`\`\`
External Entity 1    ┌─────────────────┐    External Entity 2
     │               │                 │               │
     │    Data A     │   System Name   │    Data C     │
     └──────────────→│                 │←──────────────┘
                     │   (Process 0)   │
     ┌──────────────→│                 │←──────────────┐
     │    Data B     │                 │    Data D     │
     │               └─────────────────┘               │
External Entity 3                              External Entity 4
\`\`\`

## Level 1: Decomposition
\`\`\`
External A
     │
     │ Data Input
     v
┌─────────────┐    Process Data    ┌─────────────┐
│  Process 1  │──────────────────→│  Process 2  │
│   Validate  │                   │   Transform │
└─────┬───────┘                   └─────┬───────┘
      │                                 │
      │ Validated Data                  │ Processed Data
      v                                 v
┌─────────────┐                   ┌─────────────┐
│   Data      │                   │  Process 3  │
│   Store 1   │                   │   Output    │
└─────────────┘                   └─────┬───────┘
                                        │
                                        │ Results
                                        v
                                  External B
\`\`\`

## Data Stores:
- **D1: Data Store 1** - Validated input data
- **D2: Data Store 2** - Processed results
- **D3: Data Store 3** - Configuration data

## External Entities:
- **User Interface** - System user interaction
- **Database** - Persistent data storage
- **External API** - Third-party services
- **Reports** - Generated output

## Data Flows:
1. **Input Validation** - Raw data → Validated data
2. **Data Processing** - Validated data → Processed data
3. **Output Generation** - Processed data → Final results

## Notes:
- Customize processes for your specific system
- Add/remove data stores as needed
- Include all external data sources`;

      default:
        return "";
    }
  };

  // Load template when type changes to diagram types
  const handleTypeChange = (newType: string) => {
    setType(newType);
    
    // If switching to a diagram type and content is empty, load template
    if ((newType === "flowchart" || newType === "dfd") && !content.trim()) {
      const template = getTemplateContent(newType);
      setContent(template);
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
      <DialogContent className="max-w-5xl h-[85vh] bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50">
          <Input
            placeholder="Document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium bg-transparent border-none text-slate-100 placeholder-slate-400 focus:ring-0 w-80"
          />
          <div className="flex items-center space-x-2">
            <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
              {wordCount} words
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`${isPreviewMode ? 'bg-slate-700 text-emerald-400' : 'text-slate-300'} hover:bg-slate-700`}
            >
              <Eye className="w-4 h-4 mr-1" />
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Compact Toolbar */}
        <div className="bg-slate-900/30 border-b border-slate-800">
          <div className="flex items-center justify-between p-2">
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-44 bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="document">📄 Document</SelectItem>
                <SelectItem value="flowchart">🔄 Flowchart</SelectItem>
                <SelectItem value="dfd">📊 Data Flow Diagram</SelectItem>
                <SelectItem value="code">💻 Code Documentation</SelectItem>
              </SelectContent>
            </Select>

            {!isPreviewMode && (
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={formatBold} className="text-slate-300 hover:text-white" title="Bold">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={formatItalic} className="text-slate-300 hover:text-white" title="Italic">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => insertHeading(1)} className="text-slate-300 hover:text-white text-xs px-2" title="Heading">
                  H1
                </Button>
                <Button variant="ghost" size="sm" onClick={insertList} className="text-slate-300 hover:text-white" title="List">
                  <List className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={insertLink} className="text-slate-300 hover:text-white" title="Link">
                  <Link className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={insertTable} className="text-slate-300 hover:text-white text-xs px-2" title="Table">
                  Table
                </Button>
              </div>
            )}
          </div>

          {/* Template Load Section for Diagrams */}
          {(type === 'flowchart' || type === 'dfd') && !isPreviewMode && (
            <div className="px-3 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const template = getTemplateContent(type);
                  setContent(template);
                }}
                className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 text-xs"
              >
                <Palette className="w-3 h-3 mr-1" />
                Load {type === 'flowchart' ? 'Flowchart' : 'DFD'} Template
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Scrollable Content Area */}
        <div className="flex-1 overflow-hidden min-h-0">
          {isPreviewMode ? (
            <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-slate-900 to-slate-950">
              <div className="max-w-5xl mx-auto">
                <div 
                  className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed"
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: type === 'flowchart' || type === 'dfd' ? 'monospace' : 'inherit' 
                  }}
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 p-2 overflow-hidden flex flex-col">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={type === 'flowchart' || type === 'dfd' 
                  ? `Create your ${type === 'flowchart' ? 'flowchart' : 'data flow diagram'}...

🔥 Diagram Tips:
• Use the "Load Template" button in toolbar for professional templates
• Edit the template directly - all text is customizable
• Use ASCII art for visual flow representation
• ┌─┐ │ └─┘ for boxes, ── for lines, ↓→← for arrows
• Replace template text with your specific process steps

Start with a template or create from scratch! 🚀`
                  : `Start writing your document...

✨ Pro Tips:
• **Bold text** for emphasis
• *Italic text* for style  
• # Heading 1, ## Heading 2, ### Heading 3
• - Bullet lists
• 1. Numbered lists
• > Block quotes
• \`inline code\`
• [link text](url)
• ![image description](image-url)

Happy writing! 🚀`}
                className="w-full bg-slate-900 border-slate-700 text-slate-100 font-mono text-sm resize-none focus:ring-2 focus:ring-emerald-500 leading-relaxed p-3 rounded-lg"
                style={{ height: '550px' }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}