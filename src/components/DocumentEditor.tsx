
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FileUploader from './FileUploader';
import ParagraphList from './ParagraphList';
import ModeToggle from './ModeToggle';
import { Upload, Download, FileText } from 'lucide-react';

export interface Paragraph {
  id: string;
  content: string;
  originalIndex: number;
}

export type EditorMode = 'edit' | 'drag';

const DocumentEditor = () => {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDocumentParsed = useCallback((parsedParagraphs: Paragraph[], fileName: string) => {
    setParagraphs(parsedParagraphs);
    setOriginalFileName(fileName);
    toast({
      title: "Document loaded successfully!",
      description: `Parsed ${parsedParagraphs.length} paragraphs from ${fileName}`,
    });
  }, [toast]);

  const handleParagraphsReorder = useCallback((newParagraphs: Paragraph[]) => {
    setParagraphs(newParagraphs);
  }, []);

  const handleParagraphEdit = useCallback((id: string, newContent: string) => {
    setParagraphs(prev => 
      prev.map(p => p.id === id ? { ...p, content: newContent } : p)
    );
  }, []);

  const handleExport = useCallback(async () => {
    if (paragraphs.length === 0) {
      toast({
        title: "No content to export",
        description: "Please upload a document first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { Document, Packer, Paragraph: DocxParagraph, TextRun } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs.map(para => 
            new DocxParagraph({
              children: [new TextRun(para.content)],
              spacing: { after: 200 }
            })
          )
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName ? `reordered_${originalFileName}` : 'reordered_document.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Document exported successfully!",
        description: "Your reordered document has been downloaded.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your document.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [paragraphs, originalFileName, toast]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Controls */}
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Document Workspace</h2>
              {originalFileName && (
                <p className="text-sm text-gray-600">Editing: {originalFileName}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {paragraphs.length > 0 && (
              <ModeToggle mode={mode} onModeChange={setMode} />
            )}
            
            <FileUploader onDocumentParsed={handleDocumentParsed} />
            
            {paragraphs.length > 0 && (
              <Button 
                onClick={handleExport}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Exporting...' : 'Export .docx'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {paragraphs.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-white/50">
          <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Document Loaded</h3>
          <p className="text-gray-500 mb-6">
            Upload a Word document to start editing and reordering paragraphs
          </p>
          <FileUploader onDocumentParsed={handleDocumentParsed} />
        </Card>
      ) : (
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Document Content ({paragraphs.length} paragraphs)
            </h3>
            <div className="text-sm text-gray-600">
              Mode: <span className="font-medium capitalize">{mode}</span>
            </div>
          </div>
          
          <ParagraphList
            paragraphs={paragraphs}
            mode={mode}
            onReorder={handleParagraphsReorder}
            onEdit={handleParagraphEdit}
          />
        </Card>
      )}
    </div>
  );
};

export default DocumentEditor;
