const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = express.Router();
const Image = require('../models/Image');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload single image (public endpoint for migration)
router.post('/upload-public', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(processedImage).metadata();

    // Create image document with all required fields
    const imageDoc = new Image({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      description: req.body.description || '',
      category: req.body.category || 'service',
      altText: req.body.altText || req.body.description || req.file.originalname,
      fileSize: processedImage.length,
      mimeType: 'image/jpeg',
      data: processedImage,
      contentType: 'image/jpeg',
      size: processedImage.length,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      }
    });

    await imageDoc.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: imageDoc._id,
        filename: imageDoc.filename,
        originalName: imageDoc.originalName,
        size: imageDoc.size,
        fileSize: imageDoc.fileSize,
        category: imageDoc.category,
        dimensions: imageDoc.dimensions,
        uploadedAt: imageDoc.uploadedAt
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload single image
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { category = 'other', description = '', altText, tags = [] } = req.body;

    // Process image with sharp to get dimensions and optimize
    const imageBuffer = await sharp(req.file.buffer)
      .jpeg({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(imageBuffer).metadata();

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = req.file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const filename = `${baseName}-${timestamp}${ext}`;

    // Create image document
    const image = new Image({
      filename,
      originalName,
      description,
      category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      altText: altText || description || originalName,
      fileSize: imageBuffer.length,
      mimeType: req.file.mimetype,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      data: imageBuffer,
      createdBy: req.user._id
    });

    await image.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: image.toJSON()
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images
router.post('/upload-multiple', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const { category = 'other', descriptions = [], altTexts = [], tags = [] } = req.body;
    
    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Process image
      const imageBuffer = await sharp(file.buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      const metadata = await sharp(imageBuffer).metadata();

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.originalname;
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      const filename = `${baseName}-${timestamp}-${i}${ext}`;

      const image = new Image({
        filename,
        originalName,
        description: descriptions[i] || '',
        category,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        altText: altTexts[i] || descriptions[i] || originalName,
        fileSize: imageBuffer.length,
        mimeType: file.mimetype,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        data: imageBuffer,
        createdBy: req.user._id
      });

      await image.save();
      uploadedImages.push(image.toJSON());
    }

    res.status(201).json({
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Get image by filename (serves the actual image)
router.get('/serve/:filename', async (req, res) => {
  try {
    // Set CORS headers for image serving
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    const image = await Image.findOne({ 
      filename: req.params.filename, 
      isActive: true 
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Increment usage count
    await image.incrementUsage();

    // Set appropriate headers including CORS
    res.set({
      'Content-Type': image.mimeType,
      'Content-Length': image.data.length,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': `"${image._id}-${image.updatedAt.getTime()}"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    res.send(image.data);
  } catch (error) {
    console.error('Image serve error:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Get image by filename (serves the actual image) - Legacy route
router.get('/:filename', async (req, res) => {
  try {
    // Set CORS headers for image serving
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    const image = await Image.findOne({ 
      filename: req.params.filename, 
      isActive: true 
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Increment usage count
    await image.incrementUsage();

    // Set appropriate headers including CORS
    res.set({
      'Content-Type': image.mimeType,
      'Content-Length': image.data.length,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': `"${image._id}-${image.updatedAt.getTime()}"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    res.send(image.data);
  } catch (error) {
    console.error('Image serve error:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Get all images (metadata only)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      tags, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { altText: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const images = await Image.find(query)
      .select('-data')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Image.countDocuments(query);

    res.json({
      images,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: images.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get images by category
router.get('/category/:category', async (req, res) => {
  try {
    const images = await Image.getByCategory(req.params.category);
    res.json(images);
  } catch (error) {
    console.error('Get images by category error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Update image metadata
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { description, category, tags, altText } = req.body;
    
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update fields
    if (description !== undefined) image.description = description;
    if (category !== undefined) image.category = category;
    if (tags !== undefined) {
      image.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }
    if (altText !== undefined) image.altText = altText;

    await image.save();

    res.json({
      message: 'Image updated successfully',
      image: image.toJSON()
    });
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Delete image (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    image.isActive = false;
    await image.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Migrate existing images from file system to database
router.post('/migrate', authenticateToken, async (req, res) => {
  try {
    const imagesDir = path.join(__dirname, '../../public/images');
    
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file) && 
      file !== 'README.md'
    );

    const migratedImages = [];

    for (const filename of imageFiles) {
      const filePath = path.join(imagesDir, filename);
      
      try {
        // Check if image already exists in database
        const existingImage = await Image.findOne({ originalName: filename });
        if (existingImage) {
          console.log(`Image ${filename} already exists in database, skipping...`);
          continue;
        }

        // Read file
        const fileBuffer = await fs.readFile(filePath);
        
        // Process with sharp
        const processedBuffer = await sharp(fileBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();

        const metadata = await sharp(processedBuffer).metadata();

        // Determine category based on filename
        let category = 'service';
        if (filename.includes('banner')) category = 'banner';
        if (filename.includes('blog')) category = 'blog';

        // Create database entry
        const image = new Image({
          filename: filename,
          originalName: filename,
          description: `Service image: ${filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/-/g, ' ')}`,
          category,
          tags: [category, 'migrated'],
          altText: filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/-/g, ' '),
          fileSize: processedBuffer.length,
          mimeType: `image/${metadata.format}`,
          dimensions: {
            width: metadata.width,
            height: metadata.height
          },
          data: processedBuffer,
          createdBy: req.user._id
        });

        await image.save();
        migratedImages.push(image.toJSON());
        
        console.log(`Migrated: ${filename}`);
      } catch (fileError) {
        console.error(`Error migrating ${filename}:`, fileError);
      }
    }

    res.json({
      message: `Successfully migrated ${migratedImages.length} images`,
      images: migratedImages
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Failed to migrate images' });
  }
});

module.exports = router;
