import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Search, Filter, Star, ShoppingCart, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageService from '../services/ImageService';

const ProductsPage = () => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'cleaning', name: 'Cleaning' },
    { id: 'tools', name: 'Tools' }
  ];

  const products = [
    {
      id: 1,
      name: 'Professional Plunger',
      category: 'plumbing',
      description: 'High-quality plunger for effective drain clearing',
      price: 25.00,
      originalPrice: 35.00,
      rating: 4.8,
      reviews: 156,
      image: 'plunger.jpg',
      inStock: true,
      features: [
        'Heavy-duty rubber cup',
        'Ergonomic handle',
        'Professional grade',
        'Corrosion resistant'
      ]
    },
    {
      id: 2,
      name: 'LED Light Bulbs Pack',
      category: 'electrical',
      description: 'Energy-efficient LED bulbs, pack of 4',
      price: 45.00,
      originalPrice: 60.00,
      rating: 4.9,
      reviews: 203,
      image: 'led-bulbs.jpg',
      inStock: true,
      features: [
        '10,000 hour lifespan',
        'Energy efficient',
        'Warm white light',
        'Pack of 4 bulbs'
      ]
    },
    {
      id: 3,
      name: 'All-Purpose Cleaning Kit',
      category: 'cleaning',
      description: 'Complete cleaning solution for all surfaces',
      price: 35.00,
      originalPrice: 50.00,
      rating: 4.7,
      reviews: 89,
      image: 'cleaning-kit.jpg',
      inStock: true,
      features: [
        'Multi-surface cleaner',
        'Microfiber cloths',
        'Spray bottles included',
        'Eco-friendly formula'
      ]
    },
    {
      id: 4,
      name: 'Professional Tool Set',
      category: 'tools',
      description: 'Essential tools for home maintenance and repairs',
      price: 120.00,
      originalPrice: 150.00,
      rating: 4.9,
      reviews: 312,
      image: 'tool-set.jpg',
      inStock: true,
      features: [
        '50-piece tool set',
        'Durable carrying case',
        'Lifetime warranty',
        'Professional grade'
      ]
    },
    {
      id: 5,
      name: 'Heavy-Duty Pipe Wrench',
      category: 'plumbing',
      description: 'Adjustable pipe wrench for plumbing work',
      price: 65.00,
      originalPrice: 80.00,
      rating: 4.6,
      reviews: 127,
      image: 'pipe-wrench.jpg',
      inStock: true,
      features: [
        'Adjustable jaw',
        'Non-slip grip',
        'Cast iron construction',
        '14-inch length'
      ]
    },
    {
      id: 6,
      name: 'Digital Circuit Tester',
      category: 'electrical',
      description: 'Professional circuit tester for electrical work',
      price: 85.00,
      originalPrice: 100.00,
      rating: 4.8,
      reviews: 94,
      image: 'circuit-tester.jpg',
      inStock: false,
      features: [
        'Digital display',
        'Auto-ranging',
        'Safety rated',
        'Battery included'
      ]
    }
  ];

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      type: 'product'
    });
    toast.success(`${product.name} added to cart!`);
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section - Modern Style */}
      <section className="relative overflow-hidden">
        {/* Background with geometric patterns */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-30 rounded-full text-orange-100 text-sm font-medium mb-4 backdrop-blur-sm">
                Quality Maintenance Products
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Professional Grade
              <span className="block text-orange-200">Products & Tools</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg md:text-xl text-orange-100 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Quality products for all your property maintenance needs. Durable, affordable, and fast delivery nationwide.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/contact"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center shadow-lg"
              >
                Get Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/services"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors inline-flex items-center justify-center"
              >
                View Services
              </Link>
            </motion.div>

            {/* Stats or features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-orange-200 text-sm">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-orange-200 text-sm">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Fast</div>
                <div className="text-orange-200 text-sm">Delivery</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Container */}
      <div className="container mx-auto px-4 py-12">

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Product Number */}
              <div className="px-6 pt-6">
                <div className="text-4xl font-bold text-gray-300 mb-4">
                  {(index + 1).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Product Image */}
              <div className="px-6 mb-4">
                <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={ImageService.getImageUrl(product.image)} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center" style={{display: 'none'}}>
                    <span className="text-orange-600 font-semibold">Product Image</span>
                  </div>
                </div>
              </div>

              {/* Product Content */}
              <div className="px-6 pb-6">
                {/* Product Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-roboto">{product.name}</h3>
                
                {/* Description */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{product.description}</p>

                {/* Features List */}
                <ul className="space-y-2 mb-4">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="text-gray-700 flex items-center font-roboto text-sm">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {product.originalPrice > product.price && (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                      Save ${(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    product.inStock
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredAndSortedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No products found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-orange-600 rounded-lg p-8 text-center text-white"
        >
          <h3 className="text-2xl font-bold mb-4">Need Professional Services?</h3>
          <p className="text-orange-100 mb-6">
            Our expert technicians are ready to help with your maintenance needs
          </p>
          <Link
            to="/services"
            className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            View Services
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductsPage; 