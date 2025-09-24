const fs = require('fs').promises;
const path = require('path');

class FAQFileManager {
  constructor() {
    this.faqFilePath = path.join(__dirname, '../../src/data/faqData.js');
  }

  // Read the current FAQ data from the file
  async readFAQData() {
    try {
      const fileContent = await fs.readFile(this.faqFilePath, 'utf8');
      
      // Use dynamic import to load the module safely
      // First, write a temporary version for import
      const tempModulePath = path.join(__dirname, 'temp_faq_data.js');
      await fs.writeFile(tempModulePath, fileContent);
      
      // Clear require cache and import fresh
      delete require.cache[tempModulePath];
      const { faqCategories } = require(tempModulePath);
      
      // Clean up temp file
      await fs.unlink(tempModulePath);
      
      return faqCategories;
    } catch (error) {
      console.error('Error reading FAQ data:', error);
      throw new Error('Failed to read FAQ data');
    }
  }

  // Write FAQ data back to the file
  async writeFAQData(faqCategories) {
    try {
      const fileContent = this.generateFileContent(faqCategories);
      await fs.writeFile(this.faqFilePath, fileContent, 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing FAQ data:', error);
      throw new Error('Failed to write FAQ data');
    }
  }

  // Generate the complete file content with proper formatting
  generateFileContent(faqCategories) {
    const formattedData = this.formatFAQData(faqCategories);
    
    return `// FAQ data for Swift Fix Pro Property Maintenance Service
export const faqCategories = ${formattedData};
`;
  }

  // Format the FAQ data with proper indentation and structure
  formatFAQData(faqCategories, indent = 0) {
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(faqCategories)) {
      let result = '[\n';
      faqCategories.forEach((category, index) => {
        result += `${spaces}  {\n`;
        result += `${spaces}    id: '${category.id}',\n`;
        result += `${spaces}    title: '${category.title}',\n`;
        result += `${spaces}    icon: '${category.icon}',\n`;
        result += `${spaces}    faqs: [\n`;
        
        category.faqs.forEach((faq, faqIndex) => {
          result += `${spaces}      {\n`;
          result += `${spaces}        id: '${faq.id}',\n`;
          result += `${spaces}        question: ${this.escapeString(faq.question)},\n`;
          result += `${spaces}        answer: ${this.escapeString(faq.answer)}\n`;
          result += `${spaces}      }${faqIndex < category.faqs.length - 1 ? ',' : ''}\n`;
        });
        
        result += `${spaces}    ]\n`;
        result += `${spaces}  }${index < faqCategories.length - 1 ? ',' : ''}\n`;
      });
      result += `${spaces}]`;
      return result;
    }
    
    return JSON.stringify(faqCategories, null, 2);
  }

  // Properly escape strings for JavaScript
  escapeString(str) {
    if (!str) return "''";
    
    // Handle multi-line strings and escape quotes
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    
    return `'${escaped}'`;
  }

  // Add a new FAQ to a category
  async addFAQ(categoryId, faqData) {
    const faqCategories = await this.readFAQData();
    const category = faqCategories.find(cat => cat.id === categoryId);
    
    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const newFAQ = {
      id: faqData.slug || this.generateSlug(faqData.question),
      question: faqData.question,
      answer: faqData.answer
    };

    category.faqs.push(newFAQ);
    await this.writeFAQData(faqCategories);
    return newFAQ;
  }

  // Update an existing FAQ
  async updateFAQ(categoryId, faqId, faqData) {
    const faqCategories = await this.readFAQData();
    const category = faqCategories.find(cat => cat.id === categoryId);
    
    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const faqIndex = category.faqs.findIndex(faq => faq.id === faqId);
    if (faqIndex === -1) {
      throw new Error(`FAQ ${faqId} not found in category ${categoryId}`);
    }

    category.faqs[faqIndex] = {
      id: faqData.slug || faqId,
      question: faqData.question,
      answer: faqData.answer
    };

    await this.writeFAQData(faqCategories);
    return category.faqs[faqIndex];
  }

  // Delete an FAQ
  async deleteFAQ(categoryId, faqId) {
    const faqCategories = await this.readFAQData();
    const category = faqCategories.find(cat => cat.id === categoryId);
    
    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const faqIndex = category.faqs.findIndex(faq => faq.id === faqId);
    if (faqIndex === -1) {
      throw new Error(`FAQ ${faqId} not found in category ${categoryId}`);
    }

    const deletedFAQ = category.faqs.splice(faqIndex, 1)[0];
    await this.writeFAQData(faqCategories);
    return deletedFAQ;
  }

  // Generate a slug from a question
  generateSlug(question) {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Get all FAQs across categories (for admin management)
  async getAllFAQs() {
    const faqCategories = await this.readFAQData();
    const allFAQs = [];
    
    faqCategories.forEach(category => {
      category.faqs.forEach(faq => {
        allFAQs.push({
          ...faq,
          category: category.id,
          categoryTitle: category.title
        });
      });
    });
    
    return allFAQs;
  }
}

module.exports = new FAQFileManager();