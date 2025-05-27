import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Square, 
  Circle, 
  Triangle, 
  ArrowRight, 
  ArrowDown, 
  Database, 
  Server, 
  Monitor, 
  Smartphone,
  Trash2,
  Edit3,
  Plus,
  Move,
  Save
} from "lucide-react";

interface DiagramElement {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'cylinder' | 'arrow' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  strokeColor: string;
}

interface DiagramCanvasProps {
  onSave: (elements: DiagramElement[]) => void;
  initialElements?: DiagramElement[];
}

export default function DiagramCanvas({ onSave, initialElements = [] }: DiagramCanvasProps) {
  const [elements, setElements] = useState<DiagramElement[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const shapes = [
    { type: 'rectangle', icon: Square, name: 'Rectangle' },
    { type: 'circle', icon: Circle, name: 'Circle' },
    { type: 'diamond', icon: Triangle, name: 'Diamond' },
    { type: 'cylinder', icon: Database, name: 'Database' },
  ];

  const addElement = (type: DiagramElement['type']) => {
    const newElement: DiagramElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'circle' ? 80 : 120,
      height: type === 'circle' ? 80 : 60,
      text: `New ${type}`,
      color: '#1e293b',
      strokeColor: '#10b981'
    };
    setElements(prev => [...prev, newElement]);
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const updateElement = (id: string, updates: Partial<DiagramElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setDraggedElement(elementId);
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setDragStart({ x: e.clientX - element.x, y: e.clientY - element.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedElement && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragStart.x;
      const y = e.clientY - rect.top - dragStart.y;
      updateElement(draggedElement, { x: Math.max(0, x), y: Math.max(0, y) });
    }
  }, [draggedElement, dragStart, updateElement]);

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

  const startEditing = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setIsEditing(elementId);
      setEditText(element.text);
    }
  };

  const finishEditing = () => {
    if (isEditing) {
      updateElement(isEditing, { text: editText });
      setIsEditing(null);
      setEditText("");
    }
  };

  const renderElement = (element: DiagramElement) => {
    const isSelected = selectedElement === element.id;
    const isEditingThis = isEditing === element.id;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      cursor: 'move',
      border: `2px solid ${isSelected ? '#10b981' : element.strokeColor}`,
      backgroundColor: element.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e2e8f0',
      fontSize: '12px',
      fontWeight: 'bold',
      userSelect: 'none',
      zIndex: isSelected ? 10 : 1,
    };

    let shapeStyle: React.CSSProperties = { ...baseStyle };
    
    switch (element.type) {
      case 'circle':
        shapeStyle.borderRadius = '50%';
        break;
      case 'diamond':
        shapeStyle.transform = 'rotate(45deg)';
        shapeStyle.borderRadius = '8px';
        break;
      case 'cylinder':
        shapeStyle.borderRadius = '20px 20px 8px 8px';
        break;
      default:
        shapeStyle.borderRadius = '8px';
    }

    return (
      <div
        key={element.id}
        style={shapeStyle}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        onDoubleClick={() => startEditing(element.id)}
      >
        {isEditingThis ? (
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
            className="text-xs h-6 border-none bg-transparent text-white text-center"
            autoFocus
          />
        ) : (
          <span style={element.type === 'diamond' ? { transform: 'rotate(-45deg)' } : {}}>
            {element.text}
          </span>
        )}
        
        {isSelected && (
          <div className="absolute -top-8 -right-8 flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(element.id);
              }}
              className="h-6 w-6 p-0 bg-slate-800 hover:bg-slate-700"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element.id);
              }}
              className="h-6 w-6 p-0 bg-red-900 hover:bg-red-800"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Toolbar */}
      <div className="w-64 bg-slate-900 border-r border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Diagram Elements</h3>
        
        {/* Shape Tools */}
        <div className="space-y-2 mb-6">
          <h4 className="text-xs text-slate-400 mb-2">Shapes</h4>
          {shapes.map(({ type, icon: Icon, name }) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => addElement(type as DiagramElement['type'])}
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Icon className="w-4 h-4 mr-2" />
              {name}
            </Button>
          ))}
        </div>

        {/* Element Properties */}
        {selectedElement && (
          <div className="space-y-3">
            <h4 className="text-xs text-slate-400 mb-2">Properties</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Fill Color</label>
                <input
                  type="color"
                  value={elements.find(el => el.id === selectedElement)?.color || '#1e293b'}
                  onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                  className="w-full h-8 rounded border border-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Border Color</label>
                <input
                  type="color"
                  value={elements.find(el => el.id === selectedElement)?.strokeColor || '#10b981'}
                  onChange={(e) => updateElement(selectedElement, { strokeColor: e.target.value })}
                  className="w-full h-8 rounded border border-slate-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6">
          <Button
            onClick={() => onSave(elements)}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Diagram
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <div
          ref={canvasRef}
          className="w-full h-full bg-slate-950 relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => setSelectedElement(null)}
        >
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #475569 1px, transparent 1px),
                linear-gradient(to bottom, #475569 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Instructions */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Start Building Your Diagram</p>
                <p className="text-sm">
                  Click shapes from the toolbar to add elements<br/>
                  Double-click elements to edit text<br/>
                  Drag elements to move them around
                </p>
              </div>
            </div>
          )}

          {/* Render all elements */}
          {elements.map(renderElement)}
        </div>
      </div>
    </div>
  );
}