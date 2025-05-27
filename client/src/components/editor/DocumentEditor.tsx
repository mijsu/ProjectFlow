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
  const editorRef = useRef<HTMLDivElement>(null);
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
    if (!editorRef.current) return;

    const editor = editorRef.current;
    editor.focus();

    // Use the modern approach with execCommand fallback
    try {
      let success = false;
      
      switch (command) {
        case "bold":
          success = document.execCommand('bold', false, null);
          break;
        case "italic":
          success = document.execCommand('italic', false, null);
          break;
        case "underline":
          success = document.execCommand('underline', false, null);
          break;
        case "list":
          success = document.execCommand('insertUnorderedList', false, null);
          break;
        case "listOrdered":
          success = document.execCommand('insertOrderedList', false, null);
          break;
        case "link":
          const url = prompt("Enter URL:");
          if (url) {
            success = document.execCommand('createLink', false, url);
          }
          break;
        case "image":
          const imageUrl = prompt("Enter image URL:");
          if (imageUrl) {
            success = document.execCommand('insertImage', false, imageUrl);
          }
          break;
      }
      
      // Update content after any changes
      setTimeout(() => {
        setContent(editor.innerHTML);
      }, 10);
      
    } catch (error) {
      console.warn("Rich text formatting failed:", error);
    }
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
              onClick={() => formatText("image")}
              className="hover:bg-slate-800"
            >
              <Image className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: content }}
            className="w-full h-96 bg-slate-900 border border-slate-700 text-slate-100 p-4 rounded-md overflow-y-auto focus:border-emerald-500 focus:outline-none"
            style={{
              minHeight: '384px',
              lineHeight: '1.6',
              fontSize: '14px'
            }}
          />
          {!content && (
            <div 
              className="absolute top-4 left-4 text-slate-400 pointer-events-none"
              style={{ marginTop: '20px' }}
            >
              Start writing your document here...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
