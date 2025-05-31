
interface WordParagraph {
  id: string;
  xmlContent: string;
  displayText: string;
  originalIndex: number;
}

interface WordDocumentStructure {
  headerXml: string;
  footerXml: string;
  paragraphs: WordParagraph[];
  styles: string;
  relationships: string;
}

export class WordProcessor {
  private documentStructure: WordDocumentStructure | null = null;

  async parseWordDocument(file: File): Promise<WordParagraph[]> {
    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      const zipContent = await zip.loadAsync(file);
      
      // Extract the main document XML
      const documentXml = await zipContent.file('word/document.xml')?.async('text');
      if (!documentXml) throw new Error('Invalid Word document');

      // Extract styles and relationships
      const stylesXml = await zipContent.file('word/styles.xml')?.async('text') || '';
      const relationshipsXml = await zipContent.file('word/_rels/document.xml.rels')?.async('text') || '';

      // Parse the document XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, 'text/xml');
      
      // Extract document structure
      const body = doc.querySelector('w\\:body, body');
      if (!body) throw new Error('Could not find document body');

      // Get all paragraph elements (w:p)
      const paragraphElements = body.querySelectorAll('w\\:p, p');
      
      const paragraphs: WordParagraph[] = [];
      
      paragraphElements.forEach((pElement, index) => {
        // Get the text content for display
        const textRuns = pElement.querySelectorAll('w\\:t, t');
        const displayText = Array.from(textRuns)
          .map(t => t.textContent || '')
          .join('')
          .trim();
        
        // Skip empty paragraphs
        if (!displayText) return;
        
        // Store the complete XML for this paragraph
        const xmlContent = new XMLSerializer().serializeToString(pElement);
        
        paragraphs.push({
          id: `para-${index}-${Date.now()}`,
          xmlContent,
          displayText,
          originalIndex: index
        });
      });

      // Store the document structure for later export
      const beforeFirstParagraph = this.getDocumentHeader(documentXml);
      const afterLastParagraph = this.getDocumentFooter(documentXml);
      
      this.documentStructure = {
        headerXml: beforeFirstParagraph,
        footerXml: afterLastParagraph,
        paragraphs,
        styles: stylesXml,
        relationships: relationshipsXml
      };

      return paragraphs;
    } catch (error) {
      console.error('Error parsing Word document:', error);
      throw error;
    }
  }

  private getDocumentHeader(documentXml: string): string {
    // Extract everything before the first paragraph
    const firstParagraphIndex = documentXml.indexOf('<w:p ') !== -1 
      ? documentXml.indexOf('<w:p ') 
      : documentXml.indexOf('<w:p>');
    
    return firstParagraphIndex !== -1 
      ? documentXml.substring(0, firstParagraphIndex)
      : documentXml.substring(0, documentXml.indexOf('<w:body>') + 8);
  }

  private getDocumentFooter(documentXml: string): string {
    // Extract everything after the last paragraph
    const lastParagraphIndex = documentXml.lastIndexOf('</w:p>');
    return lastParagraphIndex !== -1 
      ? documentXml.substring(lastParagraphIndex + 6)
      : '</w:body></w:document>';
  }

  async exportReorderedDocument(reorderedParagraphs: WordParagraph[], originalFileName: string): Promise<void> {
    if (!this.documentStructure) {
      throw new Error('No document structure available for export');
    }

    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      
      // Reconstruct the document XML with reordered paragraphs
      const reorderedXml = this.documentStructure.headerXml + 
        reorderedParagraphs.map(p => p.xmlContent).join('') + 
        this.documentStructure.footerXml;

      // Create the basic Word document structure
      zip.file('word/document.xml', reorderedXml);
      zip.file('word/styles.xml', this.documentStructure.styles);
      zip.file('word/_rels/document.xml.rels', this.documentStructure.relationships);
      
      // Add required Word document files
      zip.file('[Content_Types].xml', this.getContentTypesXml());
      zip.file('_rels/.rels', this.getMainRelsXml());
      zip.file('word/fontTable.xml', this.getFontTableXml());
      zip.file('word/settings.xml', this.getSettingsXml());
      zip.file('word/webSettings.xml', this.getWebSettingsXml());
      zip.file('docProps/app.xml', this.getAppPropertiesXml());
      zip.file('docProps/core.xml', this.getCorePropertiesXml());

      // Generate and download the file
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reordered_${originalFileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting document:', error);
      throw error;
    }
  }

  private getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
  }

  private getMainRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  }

  private getFontTableXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Times New Roman">
    <w:panose1 w:val="02020603050405020304"/>
    <w:charset w:val="00"/>
    <w:family w:val="roman"/>
    <w:pitch w:val="variable"/>
    <w:sig w:usb0="E0002EFF" w:usb1="C000785B" w:usb2="00000009" w:usb3="00000000" w:csb0="000001FF" w:csb1="00000000"/>
  </w:font>
</w:fonts>`;
  }

  private getSettingsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="708"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`;
  }

  private getWebSettingsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:optimizeForBrowser/>
</w:webSettings>`;
  }

  private getAppPropertiesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Document Editor</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0000</AppVersion>
</Properties>`;
  }

  private getCorePropertiesXml(): string {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Document Editor</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
  }
}

export type { WordParagraph };
