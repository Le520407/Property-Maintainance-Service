const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Image service utility for fetching images from database API
 */
class ImageService {
  /**
   * Get the URL for serving an image from the database
   * @param {string} filename - The filename of the image
   * @returns {string} - The full URL to serve the image
   */
  static getImageUrl(filename) {
    if (!filename) return '/images/placeholders/default.jpg';
    
    // If it's already a full URL or placeholder, return as-is
    if (filename.startsWith('http') || filename.startsWith('/images/placeholders/')) {
      return filename;
    }
    
    // Remove leading slash if present
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    
    // Remove 'images/' prefix if present (for migration from static paths)
    const finalFilename = cleanFilename.startsWith('images/') 
      ? cleanFilename.replace('images/', '') 
      : cleanFilename;
    
    // Return the database image URL
    return `${API_BASE}/images/serve/${finalFilename}`;
  }

  /**
   * Get all images from the database
   * @returns {Promise<Array>} - Array of image objects
   */
  static async getAllImages() {
    try {
      const response = await fetch(`${API_BASE}/images`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching images:', error);
      return [];
    }
  }

  /**
   * Upload a new image to the database
   * @param {File} file - The image file to upload
   * @param {string} category - The category for the image
   * @param {string} description - Description of the image
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - The uploaded image object
   */
  static async uploadImage(file, category = 'general', description = '', token) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);
      formData.append('description', description);

      const response = await fetch(`${API_BASE}/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get images by category
   * @param {string} category - The category to filter by
   * @returns {Promise<Array>} - Array of image objects in the category
   */
  static async getImagesByCategory(category) {
    try {
      const response = await fetch(`${API_BASE}/images?category=${category}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching images by category:', error);
      return [];
    }
  }

  /**
   * Migrate images from filesystem to database
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - Migration result
   */
  static async migrateImages(token) {
    try {
      const response = await fetch(`${API_BASE}/images/migrate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error migrating images:', error);
      throw error;
    }
  }
}

export default ImageService;
