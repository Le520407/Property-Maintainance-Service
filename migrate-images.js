const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

// List of service images to migrate
const serviceImages = [
  'home-repairs.jpg',
  'interior-painting.jpg', 
  'electrical-services.jpg',
  'plumbing-services.jpg',
  'carpentry-services.jpg',
  'flooring-services.jpg',
  'appliance-installation.jpg',
  'furniture-assembly.jpg',
  'moving-services.jpg',
  'renovation.jpg',
  'safety-security.jpg',
  'cleaning-services.jpg'
];

async function migrateImageToDatabase(imageName) {
  try {
    const imagePath = path.join(__dirname, 'public', 'images', imageName);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Image not found: ${imagePath}`);
      return false;
    }

    console.log(`📤 Uploading ${imageName}...`);

    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('category', 'service');
    formData.append('description', `Service image: ${imageName}`);

    // Upload to database (without auth for now - we'll add a public endpoint)
    const response = await axios.post(`${API_BASE}/images/upload-public`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log(`✅ Successfully uploaded ${imageName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${imageName}:`, error.message);
    return false;
  }
}

async function migrateAllImages() {
  console.log('🚀 Starting image migration to database...\n');

  // First, let's check what images are already in the database
  try {
    const existingImages = await axios.get(`${API_BASE}/images`);
    console.log(`📊 Current images in database: ${existingImages.data.length}`);
    
    if (existingImages.data.length > 0) {
      console.log('📋 Existing images:');
      existingImages.data.forEach(img => console.log(`   - ${img.filename}`));
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error checking existing images:', error.message);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Upload each service image
  for (const imageName of serviceImages) {
    const success = await migrateImageToDatabase(imageName);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between uploads
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successfully migrated: ${successCount} images`);
  console.log(`   ❌ Failed to migrate: ${failCount} images`);
  console.log(`   📈 Total processed: ${serviceImages.length} images`);

  if (successCount > 0) {
    console.log(`\n🎉 Images are now stored in the database!`);
    console.log(`📡 Access them via: http://localhost:5000/api/images/serve/[filename]`);
  }
}

// Run the migration
migrateAllImages().catch(console.error);
