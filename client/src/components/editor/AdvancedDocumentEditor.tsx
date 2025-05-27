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
      <DialogContent className="max-w-7xl max-h-[95vh] bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-5 h-5 text-emerald-400" />
            <Input
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium bg-transparent border-none text-slate-100 placeholder-slate-400 focus:ring-0 w-96"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded">
              {wordCount} words
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`${isPreviewMode ? 'bg-slate-700 text-emerald-400' : 'text-slate-300'} hover:bg-slate-700`}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
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

        {/* Professional Toolbar */}
        <div className="bg-slate-900/30 border-b border-slate-800">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-4">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-52 bg-slate-900 border-slate-700">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(type)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
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
                    </div>
                  </SelectItem>
                  <SelectItem value="dfd">
                    <div className="flex items-center space-x-2">
                      <Workflow className="w-4 h-4" />
                      <span>Data Flow Diagram</span>
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
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
              💡 Select text and use formatting buttons, or type markdown directly
            </div>
          </div>

          {!isPreviewMode && (
            <div className="flex items-center space-x-2 px-3 pb-3">
              {/* Text Formatting Group */}
              <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatBold}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatItalic}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatUnderline}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatCode}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </div>

              {/* Headings Group */}
              <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(1)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold px-3"
                  title="Heading 1"
                >
                  H1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(2)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold px-3"
                  title="Heading 2"
                >
                  H2
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(3)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold px-3"
                  title="Heading 3"
                >
                  H3
                </Button>
              </div>

              {/* Lists Group */}
              <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertList}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertOrderedList}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={formatQuote}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Quote Block"
                >
                  <Quote className="w-4 h-4" />
                </Button>
              </div>

              {/* Media & Tools Group */}
              <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertLink}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Insert Link"
                >
                  <Link className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertImage}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  title="Insert Image"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertTable}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs px-3"
                  title="Insert Table"
                >
                  Table
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Content Area */}
        <div className="flex-1 overflow-hidden">
          {isPreviewMode ? (
            <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-slate-900 to-slate-950">
              <div className="max-w-4xl mx-auto">
                <div 
                  className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full p-6">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your document...

✨ Pro Tips:
• **Bold text** for emphasis
• *Italic text* for style  
• # Heading 1, ## Heading 2, ### Heading 3
• - Bullet lists
• 1. Numbered lists
• > Block quotes
• `inline code`
• [link text](url)
• ![image description](image-url)

Happy writing! 🚀"
                className="w-full h-full bg-slate-900 border-slate-700 text-slate-100 font-mono text-sm resize-none focus:ring-2 focus:ring-emerald-500 leading-relaxed p-4 rounded-lg"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}