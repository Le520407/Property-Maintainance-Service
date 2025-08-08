import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Star,
  FileText,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const BlogManagement = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: 'maintenance-tips',
    tags: '',
    isPublished: false,
    isFeatured: false,
    metaTitle: '',
    metaDescription: ''
  });

  // 博客分类选项
  const categoryOptions = [
    { value: 'maintenance-tips', label: 'Maintenance Tips' },
    { value: 'company-news', label: 'Company News' },
    { value: 'industry-insights', label: 'Industry Insights' },
    { value: 'how-to-guides', label: 'How-to Guides' },
    { value: 'case-studies', label: 'Case Studies' }
  ];

  // 获取所有博客
  const fetchBlogs = async () => {
    try {
      const data = await api.cms.blogs.getAll();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert('Failed to fetch blogs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBlogs();
    }
  }, [user]);

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 自动生成slug
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  // 处理图片选择
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // 验证文件大小 (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传图片 (暂时使用 base64 存储)
  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    setUploading(true);
    try {
      // 为了简化，直接使用预览的 base64 数据
      // 在生产环境中，应该实现真正的文件上传
      return imagePreview;
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to process image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 移除选中的图片
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 提交博客（创建或更新）
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        alert('Title is required');
        return;
      }
      if (!formData.slug.trim()) {
        alert('Slug is required');
        return;
      }
      if (!formData.excerpt.trim()) {
        alert('Excerpt is required');
        return;
      }
      if (!formData.content.trim()) {
        alert('Content is required');
        return;
      }

      // Upload image if selected
      let featuredImageUrl = formData.featuredImage;
      if (selectedImage) {
        featuredImageUrl = await uploadImage();
        if (!featuredImageUrl) {
          alert('Failed to upload image. Please try again.');
          return;
        }
      }

      const blogData = {
        ...formData,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        featuredImage: featuredImageUrl,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      console.log('Submitting blog data:', blogData);
      console.log('Current user:', user);

      if (editingBlog) {
        await api.cms.blogs.update(editingBlog._id, blogData);
        alert('Blog updated successfully!');
      } else {
        await api.cms.blogs.create(blogData);
        alert('Blog created successfully!');
      }
      
      await fetchBlogs();
      resetForm();
    } catch (error) {
      console.error('Error saving blog:', error);
      if (error.message.includes('slug already exists')) {
        alert('Error: A blog with this slug already exists. Please use a different title or modify the slug.');
      } else if (error.message.includes('Access denied') || error.message.includes('403')) {
        alert('Error: You do not have permission to create blogs. Please ensure you are logged in as an admin.');
      } else if (error.message.includes('401')) {
        alert('Error: Your session has expired. Please log in again.');
        // Optionally redirect to login
      } else {
        alert('Error saving blog: ' + error.message);
      }
    }
  };

  // 删除博客
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await api.cms.blogs.delete(id);
        await fetchBlogs();
        alert('Blog deleted successfully!');
      } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Error deleting blog: ' + error.message);
      }
    }
  };

  // 切换博客发布状态
  const togglePublishStatus = async (blog) => {
    try {
      await api.cms.blogs.update(blog._id, { 
        ...blog, 
        isPublished: !blog.isPublished,
        publishedAt: !blog.isPublished ? new Date() : blog.publishedAt
      });
      await fetchBlogs();
    } catch (error) {
      console.error('Error updating blog status:', error);
      alert('Error updating blog status: ' + error.message);
    }
  };

  // 切换特色状态
  const toggleFeaturedStatus = async (blog) => {
    try {
      await api.cms.blogs.update(blog._id, { ...blog, isFeatured: !blog.isFeatured });
      await fetchBlogs();
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('Error updating featured status: ' + error.message);
    }
  };

  // 编辑博客
  const startEditing = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      featuredImage: blog.featuredImage,
      category: blog.category,
      tags: blog.tags.join(', '),
      isPublished: blog.isPublished,
      isFeatured: blog.isFeatured,
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || ''
    });
    setShowForm(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      category: 'maintenance-tips',
      tags: '',
      isPublished: false,
      isFeatured: false,
      metaTitle: '',
      metaDescription: ''
    });
    setEditingBlog(null);
    setShowForm(false);
    setSelectedImage(null);
    setImagePreview(null);
    setUploading(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading blogs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Management</h1>
              <p className="text-xl text-orange-100 max-w-2xl">
                Create, edit, and manage your blog content to engage and inform your audience
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-orange-600 px-8 py-4 rounded-lg hover:bg-orange-50 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Post
            </button>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">

        {/* 博客表单 */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-6"
          >
            {/* Form Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {editingBlog ? 'Update your blog post content' : 'Share your insights with the world'}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6">

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Essential details for your blog post</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* 标题 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter an engaging title for your blog post"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      placeholder="url-friendly-version"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated from title, but can be edited</p>
                  </div>

                  {/* 分类 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 特色图片上传 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Featured Image
                  </label>
                  
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload" 
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium hover:text-blue-700">
                            Click to upload
                          </span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {selectedImage?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedImage && (selectedImage.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    📸 Upload an eye-catching image to make your blog post stand out
                  </p>
                </div>

                {/* 标签 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="maintenance, tips, plumbing, repair"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas to help categorize your content</p>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                    Content
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">The main content of your blog post</p>
                </div>

                {/* 摘要 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Excerpt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    required
                    maxLength={300}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Write a compelling excerpt that summarizes your blog post and entices readers to continue..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">A brief summary that appears in blog listings</p>
                    <p className={`text-xs font-medium ${formData.excerpt.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.excerpt.length}/300 characters
                    </p>
                  </div>
                </div>

                {/* 内容 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={12}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm"
                    placeholder="Write your blog content here. You can use markdown formatting for better structure..."
                  />
                  <p className="text-xs text-gray-500 mt-2">Tip: Use headings (##), bullet points (-), and links for better readability</p>
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    SEO Optimization
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Help your content rank better in search engines</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Meta标题 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      maxLength={60}
                      placeholder="SEO optimized title for search engines"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">Appears in search results</p>
                      <p className={`text-xs font-medium ${formData.metaTitle.length > 50 ? 'text-red-500' : 'text-gray-500'}`}>
                        {formData.metaTitle.length}/60 characters
                      </p>
                    </div>
                  </div>

                  {/* Meta描述 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      maxLength={160}
                      rows={4}
                      placeholder="Brief description for search engines and social media"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">Shown in search results preview</p>
                      <p className={`text-xs font-medium ${formData.metaDescription.length > 140 ? 'text-red-500' : 'text-gray-500'}`}>
                        {formData.metaDescription.length}/160 characters
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-blue-600" />
                    Publishing Options
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Control how your blog post appears</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Publish immediately
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Make this post visible to public readers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Mark as featured
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Highlight this post on the homepage</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editingBlog ? 'Update Post' : 'Create Post'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center font-semibold"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </motion.div>
        )}

        {/* Blog List */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* List Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Blog Posts</h2>
                <p className="text-gray-600 mt-1">Manage and organize your blog content</p>
              </div>
              <div className="text-sm text-gray-500">
                {blogs.length} {blogs.length === 1 ? 'post' : 'posts'} total
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {blogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No blog posts yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Get started by creating your first blog post to share your insights with readers.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Title</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Category</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Author</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Views</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Published</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blogs.map((blog, index) => (
                      <motion.tr 
                        key={blog._id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        {/* 标题和特色状态 */}
                        <td className="py-4 px-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 text-sm leading-5">{blog.title}</h3>
                                {blog.isFeatured && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-md">
                                {blog.excerpt}
                              </p>
                              {blog.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {blog.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span key={tagIndex} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                      {tag}
                                    </span>
                                  ))}
                                  {blog.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                      +{blog.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      
                        {/* 分类 */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {categoryOptions.find(cat => cat.value === blog.category)?.label || blog.category}
                          </span>
                        </td>
                        
                        {/* 作者 */}
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <span className="text-sm font-medium text-gray-900">
                                {blog.author?.username || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        {/* 状态 */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => togglePublishStatus(blog)}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                blog.isPublished 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                            >
                              {blog.isPublished ? (
                                <><Eye className="w-3 h-3 mr-1" /> Published</>
                              ) : (
                                <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                              )}
                            </button>
                          </div>
                        </td>
                      
                        {/* 浏览量 */}
                        <td className="py-4 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{blog.views || 0}</span>
                            </div>
                          </div>
                        </td>
                        
                        {/* 发布日期 */}
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {blog.publishedAt ? (
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not published</span>
                            )}
                          </div>
                        </td>
                        
                        {/* 操作 */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {blog.isPublished && (
                              <a
                                href={`/blog/${blog.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Blog"
                              >
                                <FileText className="w-5 h-5" />
                              </a>
                            )}
                            <button
                              onClick={() => toggleFeaturedStatus(blog)}
                              className={`transition-colors ${blog.isFeatured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                              title="Toggle Featured"
                            >
                              <Star className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => startEditing(blog)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Edit Blog"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(blog._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Blog"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;