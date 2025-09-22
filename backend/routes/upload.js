const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/blog-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 确保订单附件上传目录存在
const orderAttachmentsDir = path.join(__dirname, '../uploads/order-attachments');
if (!fs.existsSync(orderAttachmentsDir)) {
  fs.mkdirSync(orderAttachmentsDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原文件扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'blog-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// 配置 multer for order attachments (images and videos)
const orderAttachmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, orderAttachmentsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原文件扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'order-' + uniqueSuffix + ext);
  }
});

// 文件过滤器 for order attachments (images and videos)
const orderAttachmentFilter = (req, file, cb) => {
  // 检查文件类型 - 允许图片和视频
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const orderAttachmentUpload = multer({
  storage: orderAttachmentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: orderAttachmentFilter
});

// 博客图片上传路由
router.post('/blog-image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // 只有管理员可以上传图片
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    // 返回可访问的图片URL
    const imageUrl = `/uploads/blog-images/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// 订单附件上传路由 (支持多个文件)
router.post('/order-attachments', auth, orderAttachmentUpload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // 只有客户可以上传订单附件
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can upload order attachments' });
    }

    // 返回上传的文件信息
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/order-attachments/${file.filename}`
    }));
    
    res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

// Rating images upload route (for customer feedback)
router.post('/rating-images', auth, orderAttachmentUpload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Only customers can upload rating images
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can upload rating images' });
    }

    // Return uploaded image information
    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/order-attachments/${file.filename}`,
      type: 'GENERAL' // Default type, can be overridden by frontend
    }));
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });

  } catch (error) {
    console.error('Rating images upload error:', error);
    res.status(500).json({ message: 'Failed to upload rating images' });
  }
});

// Vendor job completion photos upload route
router.post('/completion-photos', auth, orderAttachmentUpload.array('photos', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded' });
    }

    // Only vendors can upload completion photos
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can upload completion photos' });
    }

    // Return uploaded photo information
    const uploadedPhotos = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/order-attachments/${file.filename}`,
      serverFilename: file.filename
    }));
    
    res.status(200).json({
      message: 'Completion photos uploaded successfully',
      photos: uploadedPhotos
    });

  } catch (error) {
    console.error('Completion photos upload error:', error);
    res.status(500).json({ message: 'Failed to upload completion photos' });
  }
});

// Single file upload for vendors (generic)
router.post('/vendor-file', auth, orderAttachmentUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Only vendors can upload files via this endpoint
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can upload files via this endpoint' });
    }

    // Return uploaded file information
    const uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/order-attachments/${req.file.filename}`,
      file: `/uploads/order-attachments/${req.file.filename}`,
      serverFilename: req.file.filename
    };
    
    res.status(200).json({
      message: 'File uploaded successfully',
      ...uploadedFile
    });

  } catch (error) {
    console.error('Vendor file upload error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 50MB for videos, 5MB for images.' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: 'Only image files are allowed!' });
  }

  if (error.message === 'Only image and video files are allowed!') {
    return res.status(400).json({ message: 'Only image and video files are allowed!' });
  }
  
  res.status(500).json({ message: 'Upload failed', error: error.message });
});

module.exports = router;