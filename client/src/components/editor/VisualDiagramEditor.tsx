import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addDocument, updateDocument } from "@/hooks/useFirestore";
import { useAuth } from "@/hooks/useAuth";
import { 
  Save,
  X,
  Square,
  Circle,
  ArrowRight,
  Diamond,
  Database,
  User,
  FileText,
  Trash2,
  Move,
  Eye,
  Undo,
  Redo
} from "lucide-react";

interface DiagramElement {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'database' | 'user' | 'document';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

interface DiagramConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface VisualDiagramEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document?: any;
  projectId?: string;
}

export default function VisualDiagramEditor({ isOpen, onClose, document, projectId }: VisualDiagramEditorProps) {
  const [title, setTitle] = useState(document?.title || "");
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [connections, setConnections] = useState<DiagramConnection[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const canvasRef = useRef<SVGSVGElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const addElement = (type: DiagramElement['type']) => {
    const newElement: DiagramElement = {
      id: `element-${Date.now()}`,
      type,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      width: type === 'diamond' ? 120 : 100,
      height: type === 'diamond' ? 80 : 60,
      text: `New ${type}`,
      color: '#3b82f6'
    };
    setElements(prev => [...prev, newElement]);
  };

  const updateElementText = (id: string, text: string) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, text } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
    setSelectedElement(null);
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setDraggedElement(elementId);
    
    const element = elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedElement && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      setElements(prev => prev.map(el => 
        el.id === draggedElement 
          ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
          : el
      ));
    }
  }, [draggedElement, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedElement(null);
  }, []);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (draggedElement && typeof window !== 'undefined' && window.document) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();
      
      window.document.addEventListener('mousemove', handleMove);
      window.document.addEventListener('mouseup', handleUp);
      
      return () => {
        window.document.removeEventListener('mousemove', handleMove);
        window.document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [draggedElement, handleMouseMove, handleMouseUp]);

  const renderElement = (element: DiagramElement) => {
    const isSelected = selectedElement === element.id;
    
    const commonProps = {
      x: element.x,
      y: element.y,
      fill: element.color,
      stroke: isSelected ? '#10b981' : '#64748b',
      strokeWidth: isSelected ? 2 : 1,
      cursor: 'move',
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, element.id)
    };

    let shape;
    switch (element.type) {
      case 'rectangle':
        shape = <rect {...commonProps} width={element.width} height={element.height} rx={4} />;
        break;
      case 'circle':
        shape = <ellipse {...commonProps} cx={element.x + element.width/2} cy={element.y + element.height/2} 
                        rx={element.width/2} ry={element.height/2} />;
        break;
      case 'diamond':
        const cx = element.x + element.width/2;
        const cy = element.y + element.height/2;
        shape = <polygon {...commonProps} 
                        points={`${cx},${element.y} ${element.x + element.width},${cy} ${cx},${element.y + element.height} ${element.x},${cy}`} />;
        break;
      case 'database':
        shape = (
          <g>
            <ellipse {...commonProps} cx={element.x + element.width/2} cy={element.y + 10} 
                    rx={element.width/2} ry={10} />
            <rect {...commonProps} x={element.x} y={element.y + 10} 
                  width={element.width} height={element.height - 20} />
            <ellipse {...commonProps} cx={element.x + element.width/2} cy={element.y + element.height - 10} 
                    rx={element.width/2} ry={10} />
          </g>
        );
        break;
      default:
        shape = <rect {...commonProps} width={element.width} height={element.height} rx={4} />;
    }

    return (
      <g key={element.id}>
        {shape}
        <text
          x={element.x + element.width/2}
          y={element.y + element.height/2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="12"
          fontWeight="500"
          pointerEvents="none"
          className="select-none"
        >
          {element.text}
        </text>
      </g>
    );
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
      const diagramData = {
        elements,
        connections
      };

      const documentData = {
        title: title.trim(),
        content: JSON.stringify(diagramData),
        type: 'diagram',
        ownerId: user.uid,
        projectId: projectId || document?.projectId || null,
        updatedAt: new Date(),
      };

      if (document?.id) {
        await updateDocument("documents", document.id, documentData);
        toast({
          title: "Success",
          description: "Diagram saved successfully",
        });
      } else {
        await addDocument("documents", {
          ...documentData,
          createdAt: new Date(),
        });
        toast({
          title: "Success",
          description: "Diagram created successfully",
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save diagram",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Load existing diagram data
  React.useEffect(() => {
    if (document?.content) {
      try {
        const data = JSON.parse(document.content);
        if (data.elements) setElements(data.elements);
        if (data.connections) setConnections(data.connections);
      } catch (e) {
        // Handle old text-based content
      }
    }
  }, [document]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-800">
          <DialogTitle className="sr-only">Visual Diagram Editor</DialogTitle>
          <Input
            placeholder="Diagram title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium bg-transparent border-none text-slate-100 placeholder-slate-400 focus:ring-0 w-80"
          />
          <div className="flex items-center space-x-2">
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
        </DialogHeader>

        {!isPreviewMode && (
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/30">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Add Shape:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addElement('rectangle')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                title="Add Rectangle"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addElement('circle')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                title="Add Circle"
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addElement('diamond')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                title="Add Diamond"
              >
                <Diamond className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addElement('database')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                title="Add Database"
              >
                <Database className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addElement('user')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                title="Add User"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>

            {selectedElement && (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Element text..."
                  value={elements.find(el => el.id === selectedElement)?.text || ''}
                  onChange={(e) => updateElementText(selectedElement, e.target.value)}
                  className="w-40 bg-slate-800 border-slate-700 text-slate-100 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteElement(selectedElement)}
                  className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                  title="Delete Element"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 p-4 bg-slate-900/20 overflow-hidden">
          <div className="w-full h-full bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <svg
              ref={canvasRef}
              width="100%"
              height="100%"
              viewBox="0 0 800 600"
              className="w-full h-full"
              style={{ minHeight: '500px' }}
            >
              {/* Grid Pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Render connections */}
              {connections.map(conn => {
                const fromEl = elements.find(el => el.id === conn.from);
                const toEl = elements.find(el => el.id === conn.to);
                if (!fromEl || !toEl) return null;
                
                return (
                  <line
                    key={conn.id}
                    x1={fromEl.x + fromEl.width/2}
                    y1={fromEl.y + fromEl.height/2}
                    x2={toEl.x + toEl.width/2}
                    y2={toEl.y + toEl.height/2}
                    stroke="#64748b"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              
              {/* Arrow marker */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
              </defs>
              
              {/* Render elements */}
              {elements.map(renderElement)}
            </svg>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}