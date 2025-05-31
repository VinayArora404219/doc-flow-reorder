
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
import WordParagraphItem from './WordParagraphItem';
import type { EditorMode } from './DocumentEditor';
import type { WordParagraph } from '../utils/wordProcessor';

interface WordParagraphListProps {
  paragraphs: WordParagraph[];
  mode: EditorMode;
  onReorder: (paragraphs: WordParagraph[]) => void;
  onEdit: (id: string, newText: string) => void;
}

const WordParagraphList: React.FC<WordParagraphListProps> = ({
  paragraphs,
  mode,
  onReorder,
  onEdit,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <WordParagraphItem
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={paragraphs.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <WordParagraphItem
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

export default WordParagraphList;
