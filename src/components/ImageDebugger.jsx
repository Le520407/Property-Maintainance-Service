import React, { useState, useEffect } from 'react';
import ImageService from '../services/ImageService';

const ImageDebugger = () => {
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const testImages = [
      'home-repairs.jpg',
      'interior-painting.jpg',
      'electrical-services.jpg'
    ];

    const results = testImages.map(filename => {
      const url = ImageService.getImageUrl(filename);
      return {
        filename,
        generatedUrl: url,
        isReachable: null // We'll test this
      };
    });

    setTestResults(results);

    // Test if URLs are reachable
    results.forEach((result, index) => {
      const img = new Image();
      img.onload = () => {
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[index].isReachable = true;
          return newResults;
        });
      };
      img.onerror = () => {
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[index].isReachable = false;
          return newResults;
        });
      };
      img.src = result.generatedUrl;
    });
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Service Debugger</h1>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">API Configuration:</h3>
          <p><strong>API Base:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">URL Generation Tests:</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="p-3 border rounded">
                <p><strong>Filename:</strong> {result.filename}</p>
                <p><strong>Generated URL:</strong> {result.generatedUrl}</p>
                <p><strong>Reachable:</strong> 
                  {result.isReachable === null ? (
                    <span className="text-yellow-600"> Testing...</span>
                  ) : result.isReachable ? (
                    <span className="text-green-600"> ✅ Yes</span>
                  ) : (
                    <span className="text-red-600"> ❌ No</span>
                  )}
                </p>
                {result.isReachable !== null && (
                  <img 
                    src={result.generatedUrl} 
                    alt={result.filename}
                    className="w-32 h-24 object-cover mt-2 border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Direct API Test:</h3>
          <div className="space-y-2">
            <button 
              onClick={() => {
                fetch('http://localhost:5000/api/images')
                  .then(res => res.json())
                  .then(data => {
                    console.log('API Response:', data);
                    alert(`Found ${data.length} images in database`);
                  })
                  .catch(err => {
                    console.error('API Error:', err);
                    alert('API call failed: ' + err.message);
                  });
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test API Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDebugger;
