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
  X
} from "lucide-react";

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document?: any;
  projectId?: string;
}

export default function DocumentEditor({ isOpen, onClose, document, projectId }: DocumentEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("document");
  const [saving, setSaving] = useState(false);
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
        ...(projectId && { projectId }),
      };

      if (document?.id) {
        await updateDocument("documents", document.id, documentData);
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        await addDocument("documents", documentData);
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

  const formatText = (command: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = selectedText;
    switch (command) {
      case "bold":
        formattedText = selectedText ? `**${selectedText}**` : "**bold text**";
        break;
      case "italic":
        formattedText = selectedText ? `*${selectedText}*` : "*italic text*";
        break;
      case "underline":
        formattedText = selectedText ? `<u>${selectedText}</u>` : "<u>underlined text</u>";
        break;
      case "list":
        formattedText = selectedText ? `\n- ${selectedText}` : "\n- list item";
        break;
      case "listOrdered":
        formattedText = selectedText ? `\n1. ${selectedText}` : "\n1. numbered item";
        break;
      case "link":
        formattedText = selectedText ? `[${selectedText}](url)` : "[link text](url)";
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-4">
            <DialogTitle className="text-lg font-semibold">Document Editor</DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="bg-transparent border-none text-lg font-medium text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center space-x-4 py-3 border-b border-slate-800">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="diagram">Diagram</SelectItem>
              <SelectItem value="flowchart">Flowchart</SelectItem>
              <SelectItem value="dfd">Data Flow Diagram</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-1 border-l border-slate-700 pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("bold")}
              className="hover:bg-slate-800"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("italic")}
              className="hover:bg-slate-800"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("underline")}
              className="hover:bg-slate-800"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-700 pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("list")}
              className="hover:bg-slate-800"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("listOrdered")}
              className="hover:bg-slate-800"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-700 pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("link")}
              className="hover:bg-slate-800"
            >
              <Link className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-slate-800"
            >
              <Image className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Textarea
            ref={textareaRef}
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your document here..."
            className="w-full h-96 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-400 resize-none focus:border-emerald-500"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
