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
      
      // Enhanced mammoth options for better formatting preservation
      const options = {
        convertImage: mammoth.images.imgElement(function(image: any) {
          return image.read("base64").then(function(imageBuffer: string) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        }),
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
          "p[style-name='List Paragraph'] => li:fresh",
          "p[style-name='Quote'] => blockquote:fresh"
        ],
        ignoreEmptyParagraphs: false
      };
      
      // Convert to HTML with enhanced options
      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      const html = result.value;
      
      // Parse HTML and extract all block-level elements (not just paragraphs)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Select all block-level elements that contain content
      const blockElements = doc.querySelectorAll(`
        p, h1, h2, h3, h4, h5, h6, 
        table, ul, ol, blockquote, 
        div, pre, hr
      `);
      
      const paragraphs: Paragraph[] = Array.from(blockElements)
        .map((element, index) => {
          let content = '';
          
          // Handle different element types
          if (element.tagName === 'TABLE') {
            // Preserve table structure with better styling
            const tableHtml = element.outerHTML;
            content = tableHtml.replace(/<table/g, '<table class="border-collapse border border-gray-300 w-full my-4"')
                               .replace(/<th/g, '<th class="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left"')
                               .replace(/<td/g, '<td class="border border-gray-300 px-3 py-2"');
          } else if (element.tagName === 'UL') {
            // Preserve unordered lists
            content = element.outerHTML.replace(/<ul/g, '<ul class="list-disc ml-6 my-2"')
                                      .replace(/<li/g, '<li class="mb-1"');
          } else if (element.tagName === 'OL') {
            // Preserve ordered lists
            content = element.outerHTML.replace(/<ol/g, '<ol class="list-decimal ml-6 my-2"')
                                      .replace(/<li/g, '<li class="mb-1"');
          } else if (element.tagName.match(/^H[1-6]$/)) {
            // Preserve headings with appropriate styling
            const level = element.tagName.charAt(1);
            const headingClasses = {
              '1': 'text-3xl font-bold mb-4 mt-6',
              '2': 'text-2xl font-bold mb-3 mt-5',
              '3': 'text-xl font-bold mb-2 mt-4',
              '4': 'text-lg font-bold mb-2 mt-3',
              '5': 'text-base font-bold mb-1 mt-2',
              '6': 'text-sm font-bold mb-1 mt-2'
            }[level] || 'font-bold';
            content = `<${element.tagName.toLowerCase()} class="${headingClasses}">${element.innerHTML}</${element.tagName.toLowerCase()}>`;
          } else if (element.tagName === 'BLOCKQUOTE') {
            // Preserve blockquotes
            content = `<blockquote class="border-l-4 border-gray-300 pl-4 italic my-4">${element.innerHTML}</blockquote>`;
          } else if (element.tagName === 'PRE') {
            // Preserve preformatted text
            content = `<pre class="bg-gray-100 p-3 rounded overflow-x-auto my-2"><code>${element.innerHTML}</code></pre>`;
          } else if (element.tagName === 'HR') {
            // Preserve horizontal rules
            content = '<hr class="border-t border-gray-300 my-4">';
          } else {
            // For paragraphs and divs, preserve formatting but add basic styling
            content = element.innerHTML.trim();
            if (content && element.tagName === 'P') {
              // Add paragraph styling
              content = `<p class="mb-3 leading-relaxed">${content}</p>`;
            } else if (content && element.tagName === 'DIV') {
              content = `<div class="mb-2">${content}</div>`;
            }
          }
          
          return {
            content: content.trim(),
            originalIndex: index
          };
        })
        .filter(item => item.content.length > 0)
        .map((item, finalIndex) => ({
          id: `paragraph-${finalIndex}-${Date.now()}`,
          content: item.content,
          originalIndex: item.originalIndex
        }));

      if (paragraphs.length === 0) {
        toast({
          title: "No content found",
          description: "The document appears to be empty or couldn't be parsed.",
          variant: "destructive"
        });
        return;
      }

      // Log conversion warnings if any
      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth conversion warnings:', result.messages);
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
