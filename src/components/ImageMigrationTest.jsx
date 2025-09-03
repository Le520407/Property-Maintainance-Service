import React, { useState } from 'react';
import ImageService from '../services/ImageService';

const ImageMigrationTest = () => {
  const [migrationStatus, setMigrationStatus] = useState('ready');
  const [uploadedImages, setUploadedImages] = useState([]);

  const testImageUpload = async () => {
    setMigrationStatus('testing');
    
    try {
      // Test the image service
      const testImageUrl = ImageService.getImageUrl('home-repairs.jpg');
      console.log('Generated image URL:', testImageUrl);
      
      // Get all images from database
      const images = await ImageService.getAllImages();
      setUploadedImages(images);
      
      setMigrationStatus('success');
    } catch (error) {
      console.error('Test failed:', error);
      setMigrationStatus('error');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Migration Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testImageUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={migrationStatus === 'testing'}
        >
          {migrationStatus === 'testing' ? 'Testing...' : 'Test Image System'}
        </button>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Status: {migrationStatus}</h3>
          
          {uploadedImages.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Images in Database:</h4>
              <ul className="list-disc list-inside">
                {uploadedImages.map((img, index) => (
                  <li key={index} className="text-sm">
                    {img.filename} ({img.category}) - {Math.round(img.size / 1024)}KB
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2">Test Image Display:</h4>
          <img 
            src={ImageService.getImageUrl('home-repairs.jpg')}
            alt="Test service image"
            className="w-64 h-48 object-cover rounded border"
            onError={(e) => {
              console.log('Image failed to load from database, falling back to placeholder');
              e.target.src = '/images/placeholders/default.jpg';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageMigrationTest;
