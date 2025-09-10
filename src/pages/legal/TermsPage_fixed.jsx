import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadLegalDocument, formatMarkdownContent } from '../../utils/legalDocumentLoader';

const TermsPage = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        setLoading(true);
        const termsDocument = await loadLegalDocument('terms-and-conditions');
        setDocument(termsDocument);
      } catch (error) {
        console.error('Error loading terms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTerms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Terms of Service...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 text-red-500 mx-auto mb-4 text-2xl">⚠️</div>
          <p className="text-gray-600">Unable to load Terms of Service</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 text-orange-200 text-4xl">⚖️</div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{document.title}</h1>
              <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                Please read these terms and conditions carefully before using our service
              </p>
              <div className="mt-6 text-sm text-orange-200">
                <p>Last updated: {document.lastUpdated}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border p-8 space-y-12">
            {document.sections.map((section, index) => {
              const isIntro = section.title.toLowerCase().includes('introduction');
              
              return (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={!isIntro ? "border-b pb-8" : "pb-8"}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                  <div 
                    className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownContent(section.content) }}
                  />
                </motion.section>
              );
            })}

            {/* Last Updated Footer */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-gray-500 mr-2">🕒</span>
                <p className="text-sm text-gray-600">
                  Last updated: {document.lastUpdated}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                We may update these terms from time to time. Please review them periodically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
