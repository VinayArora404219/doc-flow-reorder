
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpDown, Edit, Save } from 'lucide-react';
import type { EditorMode } from './DocumentEditor';
import type { WordParagraph } from '../utils/wordProcessor';

interface WordParagraphItemProps {
  paragraph: WordParagraph;
  index: number;
  mode: EditorMode;
  onEdit: (id: string, newText: string) => void;
}

const WordParagraphItem: React.FC<WordParagraphItemProps> = ({
  paragraph,
  index,
  mode,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(paragraph.displayText);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: paragraph.id,
    disabled: mode === 'edit'
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onEdit(paragraph.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(paragraph.displayText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-all duration-200 ${
        isDragging 
          ? 'shadow-lg scale-105 rotate-1 border-blue-300 bg-blue-50' 
          : 'shadow-sm hover:shadow-md border-gray-200'
      } ${
        mode === 'drag' 
          ? 'cursor-grab active:cursor-grabbing' 
          : ''
      }`}
      {...(mode === 'drag' ? attributes : {})}
      {...(mode === 'drag' ? listeners : {})}
    >
      <div className="flex items-start gap-3">
        {/* Paragraph Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
          {index + 1}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none border-blue-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                placeholder="Enter paragraph content..."
                autoFocus
              />
              <div className="text-xs text-gray-500">
                Note: Only text content can be edited. Original formatting will be preserved.
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 group">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {paragraph.displayText}
              </div>
              {mode === 'edit' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Text
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Drag Handle */}
        {mode === 'drag' && !isEditing && (
          <div className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default WordParagraphItem;
