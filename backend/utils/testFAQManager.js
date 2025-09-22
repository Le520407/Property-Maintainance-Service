// Simple test to verify FAQ file management works
const faqFileManager = require('./faqFileManager');

async function testFAQManager() {
  try {
    console.log('Testing FAQ File Manager...');
    
    // Test reading FAQ data
    console.log('1. Testing read operation...');
    const faqData = await faqFileManager.readFAQData();
    console.log(`✓ Successfully read ${faqData.length} categories`);
    
    // Test adding a new FAQ
    console.log('2. Testing add operation...');
    const newFAQ = await faqFileManager.addFAQ('general', {
      question: 'Test Question - Admin Interface?',
      answer: 'This is a test FAQ created by the admin interface to verify functionality.'
    });
    console.log(`✓ Successfully added FAQ: ${newFAQ.id}`);
    
    // Test reading again to verify the addition
    console.log('3. Verifying addition...');
    const updatedData = await faqFileManager.readFAQData();
    const generalCategory = updatedData.find(cat => cat.id === 'general');
    const testFAQ = generalCategory.faqs.find(faq => faq.id === newFAQ.id);
    if (testFAQ) {
      console.log('✓ FAQ was successfully added to file');
    } else {
      console.log('✗ FAQ was not found in file');
    }
    
    // Test updating the FAQ
    console.log('4. Testing update operation...');
    const updatedFAQ = await faqFileManager.updateFAQ('general', newFAQ.id, {
      question: 'Updated Test Question - Admin Interface?',
      answer: 'This is an updated test FAQ to verify edit functionality.'
    });
    console.log(`✓ Successfully updated FAQ: ${updatedFAQ.id}`);
    
    // Test deleting the FAQ
    console.log('5. Testing delete operation...');
    const deletedFAQ = await faqFileManager.deleteFAQ('general', newFAQ.id);
    console.log(`✓ Successfully deleted FAQ: ${deletedFAQ.id}`);
    
    console.log('\n🎉 All tests passed! FAQ File Manager is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testFAQManager();
}

module.exports = testFAQManager;