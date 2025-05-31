
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ParagraphItem from './ParagraphItem';
import type { Paragraph, EditorMode } from './DocumentEditor';

interface ParagraphListProps {
  paragraphs: Paragraph[];
  mode: EditorMode;
  onReorder: (paragraphs: Paragraph[]) => void;
  onEdit: (id: string, content: string) => void;
}

const ParagraphList: React.FC<ParagraphListProps> = ({
  paragraphs,
  mode,
  onReorder,
  onEdit,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = paragraphs.findIndex(p => p.id === active.id);
      const newIndex = paragraphs.findIndex(p => p.id === over.id);
      
      const newParagraphs = arrayMove(paragraphs, oldIndex, newIndex);
      onReorder(newParagraphs);
    }
  };

  if (mode === 'edit') {
    // In edit mode, render paragraphs without drag functionality
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <ParagraphItem
            key={paragraph.id}
            paragraph={paragraph}
            index={index}
            mode={mode}
            onEdit={onEdit}
          />
        ))}
      </div>
    );
  }

  // In drag mode, use DndContext
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={paragraphs.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <ParagraphItem
              key={paragraph.id}
              paragraph={paragraph}
              index={index}
              mode={mode}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default ParagraphList;
