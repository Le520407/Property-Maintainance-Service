import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Star,
  ShoppingCart,
  Check,
  X,
  Clock,
  Tag,
  Wallet,
  AlertCircle,
  RefreshCw,
  Copy,
  Eye,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

const VoucherExchange = ({ onVoucherCreated }) => {
  const [templates, setTemplates] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [userPointsBalance, setUserPointsBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('exchange');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voucherStats, setVoucherStats] = useState({
    totalVouchers: 0,
    activeVouchers: 0,
    usedVouchers: 0,
    totalSaved: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTemplates(),
        fetchMyVouchers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/vouchers/templates');
      if (response.success) {
        setTemplates(response.data);
        setUserPointsBalance(response.userPointsBalance);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load voucher templates');
    }
  };

  const fetchMyVouchers = async () => {
    try {
      const response = await api.get('/vouchers/my-vouchers');
      if (response.success) {
        setMyVouchers(response.data);
        setVoucherStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load your vouchers');
    }
  };

  const handleExchange = async (templateId) => {
    setExchangeLoading(true);
    try {
      const response = await api.post('/vouchers/exchange', { templateId });
      if (response.success) {
        toast.success(response.message);
        setUserPointsBalance(response.newPointsBalance);
        await fetchMyVouchers(); // Refresh vouchers list
        if (onVoucherCreated) {
          onVoucherCreated(response.data);
        }
        setShowConfirmModal(false);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to exchange voucher');
    } finally {
      setExchangeLoading(false);
    }
  };

  const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Voucher code copied to clipboard!');
  };

  const getVoucherStatusBadge = (voucher) => {
    const now = new Date();
    const expiry = new Date(voucher.validUntil);

    if (voucher.usageCount >= voucher.usageLimit) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Check className="w-3 h-3 mr-1" />
          Used
        </span>
      );
    } else if (expiry < now) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Star className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
  };

  const VoucherTemplateCard = ({ template }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          {template.type === 'PERCENTAGE' ? (
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">{template.pointsCost} pts</div>
          <div className={`text-sm font-medium ${template.canAfford ? 'text-green-600' : 'text-red-500'}`}>
            {template.canAfford ? 'Can Afford' : `Need ${template.pointsNeeded} more`}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{template.description}</p>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Discount:</span>
          <span className="font-medium">
            {template.type === 'PERCENTAGE'
              ? `${template.value}% off`
              : `$${template.value} off`
            }
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Min. Order:</span>
          <span className="font-medium">${template.minimumOrderAmount}</span>
        </div>
        {template.maximumDiscountAmount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Max. Discount:</span>
            <span className="font-medium">${template.maximumDiscountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Valid for:</span>
          <span className="font-medium">{template.validForDays} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Category:</span>
          <span className="font-medium capitalize">{template.category.toLowerCase()}</span>
        </div>
      </div>

      <button
        onClick={() => {
          setSelectedTemplate(template);
          setShowConfirmModal(true);
        }}
        disabled={!template.canAfford}
        className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
          template.canAfford
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {template.canAfford ? 'Exchange Now' : 'Insufficient Points'}
      </button>
    </motion.div>
  );

  const MyVoucherCard = ({ voucher }) => {
    const isUsed = voucher.usageCount >= voucher.usageLimit;
    const isExpired = new Date(voucher.validUntil) < new Date();
    const isActive = !isUsed && !isExpired;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl border-2 p-6 transition-all ${
          isActive ? 'border-green-200 shadow-sm' : 'border-gray-200 opacity-75'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Tag className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </div>
          {getVoucherStatusBadge(voucher)}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-900 font-mono">
              {voucher.code}
            </span>
            <button
              onClick={() => copyVoucherCode(voucher.code)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-sm">{voucher.description}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount:</span>
            <span className="font-medium">
              {voucher.type === 'PERCENTAGE'
                ? `${voucher.value}% off`
                : `$${voucher.value} off`
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Min. Order:</span>
            <span className="font-medium">${voucher.minimumOrderAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expires:</span>
            <span className="font-medium">
              {new Date(voucher.validUntil).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Uses:</span>
            <span className="font-medium">{voucher.usageCount}/{voucher.usageLimit}</span>
          </div>
        </div>

        {isUsed && voucher.usedBy.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              ✅ Saved ${voucher.usedBy[0].discountAmount} on order
            </p>
            <p className="text-xs text-green-600 mt-1">
              Used on {new Date(voucher.usedBy[0].usedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {isExpired && !isUsed && (
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">
              ⏰ This voucher has expired
            </p>
          </div>
        )}

        {isActive && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-medium">
              💡 Ready to use at checkout
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Loading vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Points Balance */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Voucher Exchange</h2>
              <p className="text-orange-100">Turn your points into savings!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userPointsBalance}</div>
            <div className="text-orange-100 text-sm">Available Points</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{voucherStats.totalVouchers}</div>
          <div className="text-sm text-gray-600">Total Vouchers</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{voucherStats.activeVouchers}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{voucherStats.usedVouchers}</div>
          <div className="text-sm text-gray-600">Used</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">${voucherStats.totalSaved?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">Total Saved</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('exchange')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'exchange'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ShoppingCart className="w-5 h-5 inline mr-2" />
          Exchange Points
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'vouchers'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Gift className="w-5 h-5 inline mr-2" />
          My Vouchers ({myVouchers.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'exchange' && (
          <motion.div
            key="exchange"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Available Vouchers</h3>
              <button
                onClick={fetchTemplates}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Vouchers Available</h3>
                <p className="text-gray-600">Check back later for new voucher options!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, index) => (
                  <VoucherTemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'vouchers' && (
          <motion.div
            key="vouchers"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">My Vouchers</h3>
              <button
                onClick={fetchMyVouchers}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {myVouchers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Vouchers Yet</h3>
                <p className="text-gray-600">Exchange some points to get your first voucher!</p>
                <button
                  onClick={() => setActiveTab('exchange')}
                  className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Browse Vouchers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myVouchers.map((voucher) => (
                  <MyVoucherCard key={voucher._id} voucher={voucher} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Exchange</h3>
                <p className="text-gray-600">
                  Exchange <span className="font-bold">{selectedTemplate.pointsCost} points</span> for this voucher?
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-gray-900 mb-2">{selectedTemplate.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-medium">
                      {selectedTemplate.type === 'PERCENTAGE'
                        ? `${selectedTemplate.value}% off`
                        : `$${selectedTemplate.value} off`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid for:</span>
                    <span className="font-medium">{selectedTemplate.validForDays} days</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={exchangeLoading}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExchange(selectedTemplate.id)}
                  disabled={exchangeLoading}
                  className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {exchangeLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exchanging...
                    </>
                  ) : (
                    'Confirm Exchange'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoucherExchange;