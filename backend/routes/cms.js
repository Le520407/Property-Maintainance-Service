const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Banner = require('../models/Banner');
const HomepageBanner = require('../models/HomepageBanner');
const Blog = require('../models/Blog');
const FAQ = require('../models/FAQ');
const Pricing = require('../models/Pricing');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/blog-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'blog-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
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

// 横幅管理路由
// 获取所有横幅（管理员用）
router.get('/banners', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取活跃的横幅（公共接口）
router.get('/banners/active', async (req, res) => {
  try {
    const { location = 'homepage', limit } = req.query;
    
    // Use HomepageBanner for homepage location
    if (location === 'homepage') {
      const banners = await HomepageBanner.getActiveBanners('homepage', limit ? parseInt(limit) : null);
      
      // Increment view counts for all returned banners
      await Promise.all(banners.map(banner => banner.incrementView()));
      
      return res.json(banners);
    }
    
    // Fallback to old Banner model for other locations
    const banners = await Banner.find({ 
      isActive: true,
      $and: [
        {
          $or: [
            { displayLocation: location },
            { displayLocation: 'global' }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: new Date() } }
          ]
        }
      ]
    }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建横幅
router.post('/banners', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新横幅
router.put('/banners/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除横幅
router.delete('/banners/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== HOMEPAGE BANNER ROUTES ====================

// GET /api/cms/banners/homepage - Get all homepage banners (for admin)
router.get('/banners/homepage', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const banners = await HomepageBanner.find({ location: 'homepage' })
      .populate('createdBy', 'firstName lastName email')
      .sort({ order: 1, createdAt: -1 });
    
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Error fetching homepage banners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
});

// POST /api/cms/banners/homepage - Create new homepage banner
router.post('/banners/homepage', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const bannerData = {
      ...req.body,
      location: 'homepage',
      createdBy: req.user._id
    };

    // Auto-assign order if not provided
    if (!bannerData.order && bannerData.order !== 0) {
      const lastBanner = await HomepageBanner.findOne({ location: 'homepage' })
        .sort({ order: -1 });
      bannerData.order = lastBanner ? lastBanner.order + 1 : 0;
    }

    const banner = new HomepageBanner(bannerData);
    await banner.save();
    
    await banner.populate('createdBy', 'firstName lastName email');
    
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    console.error('Error creating homepage banner:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create banner',
      error: error.message 
    });
  }
});

// PUT /api/cms/banners/homepage/:id - Update homepage banner
router.put('/banners/homepage/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const banner = await HomepageBanner.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Error updating homepage banner:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to update banner',
      error: error.message 
    });
  }
});

// DELETE /api/cms/banners/homepage/:id - Delete homepage banner
router.delete('/banners/homepage/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const banner = await HomepageBanner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting homepage banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete banner',
      error: error.message 
    });
  }
});

// PATCH /api/cms/banners/homepage/:id/toggle - Toggle homepage banner active status
router.patch('/banners/homepage/:id/toggle', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { isActive } = req.body;
    
    const banner = await HomepageBanner.findByIdAndUpdate(
      req.params.id,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Error toggling homepage banner status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle banner status',
      error: error.message 
    });
  }
});

// PATCH /api/cms/banners/homepage/:id/reorder - Reorder homepage banner
router.patch('/banners/homepage/:id/reorder', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { newOrder } = req.body;
    const bannerId = req.params.id;

    const banner = await HomepageBanner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const oldOrder = banner.order;
    
    // Update the target banner's order
    await HomepageBanner.findByIdAndUpdate(bannerId, { order: newOrder });

    // Update orders of other banners in the same location
    if (newOrder > oldOrder) {
      // Moving down: decrease order of banners between oldOrder and newOrder
      await HomepageBanner.updateMany(
        {
          location: 'homepage',
          order: { $gt: oldOrder, $lte: newOrder },
          _id: { $ne: bannerId }
        },
        { $inc: { order: -1 } }
      );
    } else if (newOrder < oldOrder) {
      // Moving up: increase order of banners between newOrder and oldOrder
      await HomepageBanner.updateMany(
        {
          location: 'homepage',
          order: { $gte: newOrder, $lt: oldOrder },
          _id: { $ne: bannerId }
        },
        { $inc: { order: 1 } }
      );
    }

    res.json({ success: true, message: 'Banner order updated successfully' });
  } catch (error) {
    console.error('Error reordering homepage banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reorder banner',
      error: error.message 
    });
  }
});

// GET /api/cms/services/homepage - Get homepage services (placeholder)
router.get('/services/homepage', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // This would be implemented when you have a HomepageService model
    // For now, return empty array
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching homepage services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// GET /api/cms/stats/homepage - Get homepage stats (placeholder)
router.get('/stats/homepage', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // This would be implemented when you have a HomepageStats model
    // For now, return mock data
    const stats = [
      { _id: '1', number: '500+', label: 'Happy Customers', isActive: true },
      { _id: '2', number: '50+', label: 'Expert Technicians', isActive: true },
      { _id: '3', number: '24/7', label: 'Support Available', isActive: true },
      { _id: '4', number: '4.9', label: 'Average Rating', isActive: true }
    ];
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// 博客管理路由
// 获取所有博客（管理员用）
router.get('/blogs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const blogs = await Blog.find().populate('author', 'username email').sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取已发布的博客（公共接口）
router.get('/blogs/published', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured } = req.query;
    const filter = { isPublished: true };
    
    if (category) filter.category = category;
    if (featured) filter.isFeatured = true;

    const blogs = await Blog.find(filter)
      .populate('author', 'username')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Blog.countDocuments(filter);
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 根据slug获取单个博客
router.get('/blogs/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'username');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // 增加浏览次数
    blog.views += 1;
    await blog.save();
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建博客
router.post('/blogs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log('Creating blog with user:', {
      userId: req.user._id,
      userIdString: req.user._id.toString(),
      userRole: req.user.role,
      bodyData: req.body
    });
    
    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug: req.body.slug });
    if (existingBlog) {
      return res.status(400).json({ message: 'A blog with this slug already exists' });
    }
    
    const blogData = {
      ...req.body,
      author: req.user._id
    };
    
    console.log('Blog data being created:', blogData);
    
    const blog = new Blog(blogData);
    
    if (blog.isPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    await blog.save();
    const savedBlog = await Blog.findById(blog._id).populate('author', 'username email');
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Blog creation error:', error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'A blog with this slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// 更新博客
router.put('/blogs/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // 如果从未发布状态改为发布状态，设置发布时间
    if (!blog.isPublished && req.body.isPublished) {
      req.body.publishedAt = new Date();
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除博客
router.delete('/blogs/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FAQ管理路由
// 获取所有FAQ（管理员用）
router.get('/faqs', async (req, res) => {
  try {
    const { category, admin } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (!admin) filter.isActive = true;
    
    const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建FAQ
router.post('/faqs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const faq = new FAQ(req.body);
    await faq.save();
    res.status(201).json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新FAQ
router.put('/faqs/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// FAQ有用性投票
router.post('/faqs/:id/vote', async (req, res) => {
  try {
    const { helpful } = req.body; // true for yes, false for no
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    if (helpful) {
      faq.helpful.yes += 1;
    } else {
      faq.helpful.no += 1;
    }
    
    await faq.save();
    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 删除FAQ
router.delete('/faqs/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 价格管理路由
// 获取所有价格方案
router.get('/pricing', async (req, res) => {
  try {
    const { category, admin } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (!admin) filter.isActive = true;
    
    const pricing = await Pricing.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建价格方案
router.post('/pricing', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const pricing = new Pricing(req.body);
    await pricing.save();
    res.status(201).json(pricing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新价格方案
router.put('/pricing/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }
    res.json(pricing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除价格方案
router.delete('/pricing/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const pricing = await Pricing.findByIdAndDelete(req.params.id);
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }
    res.json({ message: 'Pricing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 博客图片上传路由
router.post('/upload/blog-image', auth, upload.single('image'), (req, res) => {
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

// Banner图片上传路由
router.post('/upload/banner-image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // 只有管理员可以上传图片
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }

    // 返回可访问的图片URL
    const imageUrl = `/uploads/blog-images/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'Banner image uploaded successfully',
      data: {
        imageUrl: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Banner image upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload banner image' });
  }
});

// 公告管理路由
// 获取已发布的公告（公共接口）
router.get('/announcements/published', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, targetAudience = 'all', priority } = req.query;
    
    // 构建查询条件
    const filter = { 
      isPublished: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    // 目标受众过滤
    if (targetAudience !== 'all') {
      filter.$or = [
        { targetAudience: 'all' },
        { targetAudience: targetAudience }
      ];
    } else {
      filter.targetAudience = { $in: ['all', 'customers'] };
    }
    
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    const announcements = await Announcement.find(filter)
      .populate('authorId', 'firstName lastName')
      .sort({ isPinned: -1, priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Announcement.countDocuments(filter);
    
    res.json({
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get published announcements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 获取单个公告详情（公共接口）
router.get('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('authorId', 'firstName lastName');
    
    if (!announcement || !announcement.isPublished) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // 检查是否已过期
    if (announcement.expiresAt && announcement.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Announcement has expired' });
    }
    
    // 增加浏览次数
    await announcement.incrementViews();
    
    res.json(announcement);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: 'Only image files are allowed!' });
  }
  
  res.status(500).json({ message: 'Upload failed', error: error.message });
});

// Import FAQ File Manager for static file operations
const faqFileManager = require('../utils/faqFileManager');

// FAQ File Management Routes (for static faqData.js file)

// GET /api/cms/faq-file - Get all FAQ data from file
router.get('/faq-file', async (req, res) => {
  try {
    if (req.query.admin === 'true') {
      // Return flat list for admin management
      const allFAQs = await faqFileManager.getAllFAQs();
      res.json({ faqs: allFAQs });
    } else {
      // Return categorized structure for public display
      const faqCategories = await faqFileManager.readFAQData();
      res.json({ faqCategories });
    }
  } catch (error) {
    console.error('Error fetching FAQ data:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ data' });
  }
});

// POST /api/cms/faq-file - Add new FAQ
router.post('/faq-file', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { question, answer, category, slug } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ error: 'Question, answer, and category are required' });
    }

    const newFAQ = await faqFileManager.addFAQ(category, {
      question,
      answer,
      slug
    });

    res.status(201).json({ faq: newFAQ });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    res.status(500).json({ error: error.message || 'Failed to add FAQ' });
  }
});

// PUT /api/cms/faq-file/:categoryId/:faqId - Update existing FAQ
router.put('/faq-file/:categoryId/:faqId', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { categoryId, faqId } = req.params;
    const { question, answer, slug } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const updatedFAQ = await faqFileManager.updateFAQ(categoryId, faqId, {
      question,
      answer,
      slug
    });

    res.json({ faq: updatedFAQ });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: error.message || 'Failed to update FAQ' });
  }
});

// DELETE /api/cms/faq-file/:categoryId/:faqId - Delete FAQ
router.delete('/faq-file/:categoryId/:faqId', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { categoryId, faqId } = req.params;
    
    const deletedFAQ = await faqFileManager.deleteFAQ(categoryId, faqId);
    
    res.json({ message: 'FAQ deleted successfully', faq: deletedFAQ });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: error.message || 'Failed to delete FAQ' });
  }
});

// GET /api/cms/faq-file/categories - Get available categories
router.get('/faq-file/categories', async (req, res) => {
  try {
    const categoryOptions = [
      { value: 'general', label: 'General Services', icon: '🏠' },
      { value: 'account', label: 'Account & Registration', icon: '👤' },
      { value: 'agent-program', label: 'Agent Referral Program', icon: '⭐' },
      { value: 'cea-verification', label: 'CEA Verification Process', icon: '🛡️' },
      { value: 'privacy-cookies', label: 'Privacy & Cookies', icon: '🍪' },
      { value: 'payments', label: 'Payments & Billing', icon: '💳' },
      { value: 'technical', label: 'Technical Support', icon: '⚙️' },
      { value: 'contact-support', label: 'Contact & Support', icon: '🎧' }
    ];
    
    res.json({ categories: categoryOptions });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;