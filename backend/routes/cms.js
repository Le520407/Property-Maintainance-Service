const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const Blog = require('../models/Blog');
const FAQ = require('../models/FAQ');
const Pricing = require('../models/Pricing');
const { auth } = require('../middleware/auth');

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
    const { location = 'homepage' } = req.query;
    const banners = await Banner.find({ 
      isActive: true,
      $or: [
        { displayLocation: location },
        { displayLocation: 'global' }
      ],
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } }
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
    const blog = new Blog({
      ...req.body,
      author: req.user.userId
    });
    
    if (blog.isPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
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

module.exports = router;