// Utility functions for loading and parsing legal documents

export const loadLegalDocument = async (documentType) => {
  try {
    const response = await fetch(`/legal/${documentType}.md`);
    if (!response.ok) {
      throw new Error(`Failed to load ${documentType}`);
    }
    const text = await response.text();
    return parseLegalDocument(text);
  } catch (error) {
    console.error(`Error loading legal document ${documentType}:`, error);
    return {
      title: 'Document Not Found',
      lastUpdated: new Date().toLocaleDateString(),
      sections: [
        {
          id: 'error',
          title: 'Error',
          content: 'Unable to load document content. Please try again later.'
        }
      ]
    };
  }
};

export const parseLegalDocument = (markdownText) => {
  const lines = markdownText.split('\n');
  const sections = [];
  let currentSection = null;
  let title = '';
  let lastUpdated = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract main title (first # heading)
    if (line.startsWith('# ') && !title) {
      title = line.substring(2).trim();
      continue;
    }

    // Extract last updated date
    if (line.includes('**Last updated:**')) {
      const match = line.match(/\*\*Last updated:\*\*\s*(.+)/);
      if (match) {
        lastUpdated = match[1].trim();
      }
      continue;
    }

    // Handle section headings (## headings)
    if (line.startsWith('## ')) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      const sectionTitle = line.substring(3).trim();
      currentSection = {
        id: generateSectionId(sectionTitle),
        title: sectionTitle,
        content: []
      };
      continue;
    }

    // Add content to current section
    if (currentSection && line) {
      currentSection.content.push(line);
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    title: title || 'Legal Document',
    lastUpdated: lastUpdated || new Date().toLocaleDateString(),
    sections: sections.map(section => ({
      ...section,
      content: section.content.join('\n')
    }))
  };
};

export const generateSectionId = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);
};

// Format markdown content for display
export const formatMarkdownContent = (content) => {
  let formatted = content;

  // Convert ### headings to bold text
  formatted = formatted.replace(/^### (.+)$/gm, '**$1**');

  // Convert bold text
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert bullet points
  formatted = formatted.replace(/^- (.+)$/gm, '• $1');

  // Convert paragraphs (double newlines)
  formatted = formatted.replace(/\n\n/g, '</p><p>');

  // Wrap in paragraph tags
  if (formatted && !formatted.startsWith('<p>')) {
    formatted = `<p>${formatted}</p>`;
  }

  return formatted;
};

// Get section icon based on content
export const getSectionIcon = (sectionTitle) => {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('introduction') || title.includes('acceptance')) return 'CheckCircle';
  if (title.includes('service') || title.includes('delivery')) return 'Users';
  if (title.includes('account') || title.includes('user')) return 'Shield';
  if (title.includes('conduct') || title.includes('prohibited')) return 'Scale';
  if (title.includes('privacy') || title.includes('data')) return 'FileText';
  if (title.includes('payment') || title.includes('fee')) return 'CreditCard';
  if (title.includes('termination') || title.includes('violation')) return 'AlertTriangle';
  if (title.includes('liability') || title.includes('limitation')) return 'AlertTriangle';
  if (title.includes('contact') || title.includes('support')) return 'Mail';
  if (title.includes('cookie') || title.includes('tracking')) return 'Eye';
  if (title.includes('update') || title.includes('change')) return 'Settings';
  if (title.includes('right') || title.includes('legal')) return 'UserCheck';
  if (title.includes('information') || title.includes('collect')) return 'Database';
  if (title.includes('security') || title.includes('protection')) return 'Lock';
  if (title.includes('retention') || title.includes('storage')) return 'Clock';
  if (title.includes('sharing') || title.includes('disclosure')) return 'Globe';
  
  return 'FileText'; // Default icon
};

const legalDocumentUtils = {
  loadLegalDocument,
  parseLegalDocument,
  generateSectionId,
  formatMarkdownContent,
  getSectionIcon
};

export default legalDocumentUtils;
