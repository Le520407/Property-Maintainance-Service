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
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BlogManagement = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showForm, setShowForm] = useState(false);
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
      const response = await fetch('/api/cms/blogs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBlogs(data);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
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

  // 提交博客（创建或更新）
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const blogData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const url = editingBlog 
        ? `/api/cms/blogs/${editingBlog._id}`
        : '/api/cms/blogs';
      
      const method = editingBlog ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(blogData)
      });

      if (response.ok) {
        await fetchBlogs();
        resetForm();
        alert(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error saving blog');
    }
  };

  // 删除博客
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        const response = await fetch(`/api/cms/blogs/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchBlogs();
          alert('Blog deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Error deleting blog');
      }
    }
  };

  // 切换博客发布状态
  const togglePublishStatus = async (blog) => {
    try {
      const response = await fetch(`/api/cms/blogs/${blog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          ...blog, 
          isPublished: !blog.isPublished,
          publishedAt: !blog.isPublished ? new Date() : blog.publishedAt
        })
      });

      if (response.ok) {
        await fetchBlogs();
      }
    } catch (error) {
      console.error('Error updating blog status:', error);
    }
  };

  // 切换特色状态
  const toggleFeaturedStatus = async (blog) => {
    try {
      const response = await fetch(`/api/cms/blogs/${blog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...blog, isFeatured: !blog.isFeatured })
      });

      if (response.ok) {
        await fetchBlogs();
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
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
    <div className="pt-24 space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Blog Post
        </button>
      </div>

      {/* 博客表单 */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* 标题 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 特色图片 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional image URL for the blog post"
                />
              </div>

              {/* 标签 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="maintenance, tips, plumbing"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt *
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                required
                maxLength={300}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the blog post (max 300 characters)"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.excerpt.length}/300 characters
              </p>
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={10}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your blog content here..."
              />
            </div>

            {/* SEO字段 */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">SEO Settings</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Meta标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    maxLength={60}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>

                {/* Meta描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    maxLength={160}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>
              </div>
            </div>

            {/* 发布选项 */}
            <div className="flex gap-6 pt-4 border-t">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Publish immediately
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Mark as featured
                </label>
              </div>
            </div>

            {/* 表单按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingBlog ? 'Update' : 'Create'} Blog Post
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 博客列表 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">All Blog Posts</h2>
          
          {blogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No blog posts found. Create your first blog post!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Title</th>
                    <th className="text-left py-3">Category</th>
                    <th className="text-left py-3">Author</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Views</th>
                    <th className="text-left py-3">Published</th>
                    <th className="text-left py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog._id} className="border-b hover:bg-gray-50">
                      {/* 标题和特色状态 */}
                      <td className="py-3">
                        <div className="flex items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{blog.title}</p>
                              {blog.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500" title="Featured" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {blog.excerpt}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {blog.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                              {blog.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{blog.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* 分类 */}
                      <td className="py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {categoryOptions.find(cat => cat.value === blog.category)?.label || blog.category}
                        </span>
                      </td>
                      
                      {/* 作者 */}
                      <td className="py-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm">{blog.author?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      
                      {/* 状态 */}
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => togglePublishStatus(blog)}
                            className={`flex items-center px-2 py-1 rounded-full text-xs ${
                              blog.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {blog.isPublished ? (
                              <><Eye className="w-3 h-3 mr-1" /> Published</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                            )}
                          </button>
                          {blog.isFeatured && (
                            <button
                              onClick={() => toggleFeaturedStatus(blog)}
                              className="flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
                            >
                              <Star className="w-3 h-3 mr-1" /> Featured
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* 浏览量 */}
                      <td className="py-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {blog.views || 0}
                        </div>
                      </td>
                      
                      {/* 发布日期 */}
                      <td className="py-3">
                        <div className="text-xs text-gray-500">
                          {blog.publishedAt ? (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(blog.publishedAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <span>Not published</span>
                          )}
                        </div>
                      </td>
                      
                      {/* 操作 */}
                      <td className="py-3">
                        <div className="flex gap-2">
                          {blog.isPublished && (
                            <a
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="View Blog"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => toggleFeaturedStatus(blog)}
                            className={`${blog.isFeatured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                            title="Toggle Featured"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditing(blog)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Blog"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Blog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;