import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Search, Filter, Star, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';


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
      image: '/images/plunger.jpg',
      inStock: true
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
      image: '/images/led-bulbs.jpg',
      inStock: true
    },
    {
      id: 3,
      name: 'Eco-Friendly Cleaning Kit',
      category: 'cleaning',
      description: 'Complete cleaning kit with eco-friendly products',
      price: 80.00,
      originalPrice: 100.00,
      rating: 4.7,
      reviews: 189,
      image: '/images/cleaning-kit.jpg',
      inStock: true
    },
    {
      id: 4,
      name: 'Professional Tool Set',
      category: 'tools',
      description: 'Complete tool set for home maintenance',
      price: 150.00,
      originalPrice: 200.00,
      rating: 4.8,
      reviews: 98,
      image: '/images/tool-set.jpg',
      inStock: true
    },
    {
      id: 5,
      name: 'Pipe Wrench',
      category: 'plumbing',
      description: 'Heavy-duty pipe wrench for plumbing work',
      price: 65.00,
      originalPrice: 85.00,
      rating: 4.6,
      reviews: 142,
      image: '/images/pipe-wrench.jpg',
      inStock: true
    },
    {
      id: 6,
      name: 'Circuit Tester',
      category: 'electrical',
      description: 'Professional circuit tester for electrical work',
      price: 35.00,
      originalPrice: 45.00,
      rating: 4.9,
      reviews: 234,
      image: '/images/circuit-tester.jpg',
      inStock: true
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
      <div className="min-h-screen bg-gray-50 py-8">
    {/* 🛠️ Hero Section: Moved OUTSIDE of container for full-width */}
    <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Maintenance Products
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto"
          >
            Quality products for all your property maintenance needs. Durable, affordable, and fast delivery.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/products"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Browse Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/cart"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              View Cart
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
    
    
    <div className="container mx-auto px-4">

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
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>

              {/* Product Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm text-gray-600">{product.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{product.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-orange-600">SGD {product.price.toFixed(2)}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">SGD {product.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">({product.reviews} reviews)</span>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${product.inStock
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
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