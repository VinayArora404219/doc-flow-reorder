
import React from 'react';
import DocumentEditor from '@/components/DocumentEditor';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Document Reorder Studio
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your Word documents and reorganize paragraphs with intuitive drag-and-drop functionality. 
            Edit content seamlessly and export your improved document.
          </p>
        </div>
        <DocumentEditor />
      </div>
    </div>
  );
};

export default Index;
