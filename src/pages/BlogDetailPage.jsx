import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Eye, 
  Tag, 
  ArrowLeft, 
  Clock,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  CheckCircle
} from 'lucide-react';
import { api } from '../services/api';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareDropdown, setShareDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // 博客分类选项
  const categoryOptions = [
    { value: 'maintenance-tips', label: 'Maintenance Tips' },
    { value: 'company-news', label: 'Company News' },
    { value: 'industry-insights', label: 'Industry Insights' },
    { value: 'how-to-guides', label: 'How-to Guides' },
    { value: 'case-studies', label: 'Case Studies' }
  ];

  // 获取博客详情
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await api.cms.blogs.getBySlug(slug);
        setBlog(data);
        
        // 获取相关博客
        if (data.category) {
          fetchRelatedBlogs(data.category, data._id);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        setError('An error occurred while loading the blog post');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  // 获取相关博客
  const fetchRelatedBlogs = async (category, currentBlogId) => {
    try {
      const data = await api.cms.blogs.getPublished({ category, limit: '4' });
      // 过滤掉当前博客
      const related = data.blogs.filter(blog => blog._id !== currentBlogId);
      setRelatedBlogs(related.slice(0, 3));
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 计算阅读时间
  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  // 分享功能
  const shareUrl = window.location.href;
  
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Check out this article: ${blog?.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Go Back
            </button>
            <Link
              to="/blog"
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              View All Blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 返回按钮 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blog
          </button>
        </div>
      </div>

      {/* 文章头部 */}
      <article className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* 元信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {categoryOptions.find(cat => cat.value === blog.category)?.label}
                </span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(blog.publishedAt)}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {blog.author?.username}
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {blog.views || 0} views
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {calculateReadingTime(blog.content)} min read
                </div>
              </div>
            </motion.div>

            {/* 标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight"
            >
              {blog.title}
            </motion.h1>

            {/* 摘要 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              {blog.excerpt}
            </motion.p>

            {/* 分享按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mb-8 pb-8 border-b"
            >
              {/* 标签 */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-2 flex-wrap">
                    {blog.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 分享按钮 */}
              <div className="relative">
                <button
                  onClick={() => setShareDropdown(!shareDropdown)}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                {shareDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border p-2 min-w-[160px] z-10">
                    <button
                      onClick={shareOnFacebook}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded"
                    >
                      <Facebook className="w-4 h-4 text-orange-600" />
                      Facebook
                    </button>
                    <button
                      onClick={shareOnTwitter}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded"
                    >
                      <Twitter className="w-4 h-4 text-sky-500" />
                      Twitter
                    </button>
                    <button
                      onClick={shareOnLinkedIn}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded"
                    >
                      <Linkedin className="w-4 h-4 text-orange-700" />
                      LinkedIn
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-gray-600" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 特色图片 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </motion.div>

            {/* 文章内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="prose prose-lg max-w-none mb-12"
            >
              <div 
                className="text-gray-800 leading-relaxed"
                style={{ whiteSpace: 'pre-line' }}
                dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }}
              />
            </motion.div>
          </div>
        </div>
      </article>

      {/* 相关文章 */}
      {relatedBlogs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog, index) => (
                  <motion.div
                    key={relatedBlog._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <img
                      src={relatedBlog.featuredImage}
                      alt={relatedBlog.title}
                      className="w-full h-32 object-cover"
                    />
                    
                    <div className="p-4">
                      <div className="text-sm text-gray-500 mb-2">
                        {formatDate(relatedBlog.publishedAt)}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedBlog.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {relatedBlog.excerpt}
                      </p>
                      
                      <Link
                        to={`/blog/${relatedBlog.slug}`}
                        className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center"
                      >
                        Read More
                        <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 页脚CTA */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Professional Maintenance Services?</h2>
          <p className="text-orange-100 mb-8">
            Our expert technicians are ready to help with all your property maintenance needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/services"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Our Services
            </Link>
            <Link
              to="/booking"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>

      {/* 点击外部关闭分享下拉菜单 */}
      {shareDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShareDropdown(false)}
        />
      )}
    </div>
  );
};

export default BlogDetailPage;