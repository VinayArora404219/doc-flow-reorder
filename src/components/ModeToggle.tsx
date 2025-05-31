
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, ArrowUpDown } from 'lucide-react';
import type { EditorMode } from './DocumentEditor';

interface ModeToggleProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        variant={mode === 'edit' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('edit')}
        className={`${
          mode === 'edit' 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Mode
      </Button>
      <Button
        variant={mode === 'drag' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('drag')}
        className={`${
          mode === 'drag' 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <ArrowUpDown className="h-4 w-4 mr-2" />
        Drag Mode
      </Button>
    </div>
  );
};

export default ModeToggle;
