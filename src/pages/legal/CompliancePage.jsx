import { Award, CheckCircle, Download, ExternalLink, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatMarkdownContent, loadLegalDocument } from '../../utils/legalDocumentLoader';

import { motion } from 'framer-motion';

const CompliancePage = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompliance = async () => {
      try {
        setLoading(true);
        const complianceDocument = await loadLegalDocument('compliance-certifications');
        setDocument(complianceDocument);
      } catch (error) {
        console.error('Error loading compliance document:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompliance();
  }, []);

  // Compliance badges/logos data
  const complianceBadges = [
    {
      name: "ISO 27001 Certified",
      description: "Information Security Management",
      icon: "🔒",
      color: "orange",
      verified: true
    },
    {
      name: "GDPR Compliant",
      description: "Data Protection Regulation",
      icon: "🛡️",
      color: "orange",
      verified: true
    },
    {
      name: "PCI DSS Compliant",
      description: "Payment Card Industry Security",
      icon: "💳",
      color: "orange",
      verified: true
    },
    {
      name: "SSL Secured",
      description: "256-bit Encryption",
      icon: "🔐",
      color: "orange",
      verified: true
    },
    {
      name: "Singapore Licensed",
      description: "ACRA Registered Business",
      icon: "🏢",
      color: "orange",
      verified: true
    },
    {
      name: "Fully Insured",
      description: "$2M Public Liability",
      icon: "🛡️",
      color: "orange",
      verified: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Compliance Information...</p>
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
              <div className="w-16 h-16 mx-auto mb-4 text-orange-200 text-4xl">
                <Shield size={64} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Compliance & Certifications
              </h1>
              <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                Your trust is our priority. See our security, compliance, and professional certifications.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compliance Badges Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trust & Security Badges
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We maintain the highest standards of security, compliance, and professional certification
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceBadges.map((badge, index) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-${badge.color}-50 border border-${badge.color}-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow`}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="flex items-center justify-center mb-2">
                  <h3 className={`text-lg font-semibold text-${badge.color}-900`}>
                    {badge.name}
                  </h3>
                  {badge.verified && (
                    <CheckCircle size={16} className={`ml-2 text-${badge.color}-600`} />
                  )}
                </div>
                <p className={`text-sm text-${badge.color}-700`}>
                  {badge.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Level Commitment */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Award size={48} className="mx-auto text-orange-600 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Service Commitments
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We guarantee specific service levels and quality standards
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-2">99.9%</div>
                  <div className="text-sm text-gray-600">Platform Uptime</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-2">2 Hours</div>
                  <div className="text-sm text-gray-600">Vendor Assignment</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Emergency Support</div>
                </div>
              </div>

              <motion.a
                href="/sla"
                className="inline-flex items-center bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Full SLA
                <ExternalLink size={16} className="ml-2" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Detailed Compliance Content */}
      {document && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-8 space-y-12">
              {document.sections.map((section, index) => {
                const isIntro = section.title.toLowerCase().includes('introduction') || 
                               section.title.toLowerCase().includes('trust & security');
                
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={!isIntro ? "border-b border-orange-100 pb-8" : "pb-8"}
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

              {/* Certificate Downloads Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 rounded-lg p-6 border border-orange-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Download size={20} className="mr-2 text-orange-600" />
                  Certificate Downloads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-3 bg-white rounded border border-orange-200 hover:bg-orange-50 hover:shadow-sm transition-all">
                    <span className="text-sm">ISO 27001 Certificate</span>
                    <Download size={16} className="text-orange-500" />
                  </button>
                  <button className="flex items-center justify-between p-3 bg-white rounded border border-orange-200 hover:bg-orange-50 hover:shadow-sm transition-all">
                    <span className="text-sm">Business License</span>
                    <Download size={16} className="text-orange-500" />
                  </button>
                  <button className="flex items-center justify-between p-3 bg-white rounded border border-orange-200 hover:bg-orange-50 hover:shadow-sm transition-all">
                    <span className="text-sm">Insurance Certificates</span>
                    <Download size={16} className="text-orange-500" />
                  </button>
                  <button className="flex items-center justify-between p-3 bg-white rounded border border-orange-200 hover:bg-orange-50 hover:shadow-sm transition-all">
                    <span className="text-sm">PCI DSS Compliance</span>
                    <Download size={16} className="text-orange-500" />
                  </button>
                </div>
              </motion.section>

              {/* Last Updated Footer */}
              <div className="bg-orange-50 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-orange-500 mr-2">🔄</span>
                  <p className="text-sm text-orange-700">
                    Last updated: {document?.lastUpdated || 'September 11, 2025'}
                  </p>
                </div>
                <p className="text-xs text-orange-600">
                  Our compliance certifications are regularly audited and renewed to maintain the highest standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompliancePage;
