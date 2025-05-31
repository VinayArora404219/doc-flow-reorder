
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import type { Paragraph } from './DocumentEditor';

interface FileUploaderProps {
  onDocumentParsed: (paragraphs: Paragraph[], fileName: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDocumentParsed }) => {
  const { toast } = useToast();

  const parseDocument = useCallback(async (file: File) => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      // Split into paragraphs, filter out empty ones
      const paragraphTexts = text
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const paragraphs: Paragraph[] = paragraphTexts.map((content, index) => ({
        id: `paragraph-${index}-${Date.now()}`,
        content,
        originalIndex: index
      }));

      if (paragraphs.length === 0) {
        toast({
          title: "No content found",
          description: "The document appears to be empty or couldn't be parsed.",
          variant: "destructive"
        });
        return;
      }

      onDocumentParsed(paragraphs, file.name);
    } catch (error) {
      console.error('Error parsing document:', error);
      toast({
        title: "Parsing failed",
        description: "There was an error reading your document. Please try again.",
        variant: "destructive"
      });
    }
  }, [onDocumentParsed, toast]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .docx file.",
        variant: "destructive"
      });
      return;
    }

    parseDocument(file);
    // Reset the input
    event.target.value = '';
  }, [parseDocument, toast]);

  return (
    <div className="relative">
      <input
        type="file"
        accept=".docx"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id="document-upload"
      />
      <Button 
        asChild
        className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
      >
        <label htmlFor="document-upload" className="cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          Upload .docx
        </label>
      </Button>
    </div>
  );
};

export default FileUploader;
