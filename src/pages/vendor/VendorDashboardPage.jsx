import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Award, 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Activity,
  BarChart3,
  Users,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowLeft,
  CreditCard,
  MessageSquare,
  Shield,
  History,
  Send
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import VendorPricingManagement from '../../components/vendor/VendorPricingManagement';
import { CurrentPlanTab, UpgradePlansTab, UsageStatsTab, BillingHistoryTab } from '../../components/vendor/VendorMembership';

const ProfileTab = ({ vendor, onUpdate, activeSection: initialSection }) => {
  const [activeSection, setActiveSection] = useState(initialSection || 'services');
  const [servicePackages, setServicePackages] = useState(vendor.servicePackages || []);
  const [priceLists, setPriceLists] = useState(vendor.priceLists || []);
  const [availabilitySchedule, setAvailabilitySchedule] = useState(vendor.availabilitySchedule || []);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  const serviceCategories = ['plumbing', 'electrical', 'cleaning', 'gardening', 'painting', 'security', 'hvac', 'general'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const saveProfile = async (updatedData) => {
    try {
      setLoading(true);
      await api.vendor.updateProfile(updatedData);
      toast.success('Profile updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddServicePackage = () => {
    const newPackage = {
      id: Date.now(),
      name: '',
      description: '',
      category: 'general',
      price: 0,
      duration: 1,
      isActive: true
    };
    setEditingPackage(newPackage);
  };

  const handleSaveServicePackage = async () => {
    if (!editingPackage.name || !editingPackage.description || editingPackage.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedPackages = editingPackage.id && servicePackages.find(p => p.id === editingPackage.id)
      ? servicePackages.map(p => p.id === editingPackage.id ? editingPackage : p)
      : [...servicePackages, { ...editingPackage, id: editingPackage._id || Date.now() }];

    setServicePackages(updatedPackages);
    await saveProfile({ servicePackages: updatedPackages });
    setEditingPackage(null);
  };

  const handleDeleteServicePackage = async (packageId) => {
    const updatedPackages = servicePackages.filter(p => (p.id || p._id) !== packageId);
    setServicePackages(updatedPackages);
    await saveProfile({ servicePackages: updatedPackages });
  };

  const handleAddPriceList = () => {
    const newPriceList = {
      id: Date.now(),
      category: 'general',
      baseRate: 0,
      emergencyRate: 0,
      weekendRate: 0,
      nightRate: 0
    };
    setEditingPrice(newPriceList);
  };

  const handleSavePriceList = async () => {
    if (editingPrice.baseRate <= 0) {
      toast.error('Base rate must be greater than 0');
      return;
    }

    const updatedPriceLists = editingPrice.id && priceLists.find(p => p.id === editingPrice.id)
      ? priceLists.map(p => p.id === editingPrice.id ? editingPrice : p)
      : [...priceLists, { ...editingPrice, id: editingPrice._id || Date.now() }];

    setPriceLists(updatedPriceLists);
    await saveProfile({ priceLists: updatedPriceLists });
    setEditingPrice(null);
  };

  const handleDeletePriceList = async (priceId) => {
    const updatedPriceLists = priceLists.filter(p => (p.id || p._id) !== priceId);
    setPriceLists(updatedPriceLists);
    await saveProfile({ priceLists: updatedPriceLists });
  };

  const handleAddAvailabilitySlot = () => {
    const newSlot = {
      id: Date.now(),
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    };
    setEditingSchedule(newSlot);
  };

  const handleSaveAvailabilitySlot = async () => {
    if (editingSchedule.startTime >= editingSchedule.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    const updatedSchedule = editingSchedule.id && availabilitySchedule.find(s => s.id === editingSchedule.id)
      ? availabilitySchedule.map(s => s.id === editingSchedule.id ? editingSchedule : s)
      : [...availabilitySchedule, { ...editingSchedule, id: editingSchedule._id || Date.now() }];

    setAvailabilitySchedule(updatedSchedule);
    await saveProfile({ availabilitySchedule: updatedSchedule });
    setEditingSchedule(null);
  };

  const handleDeleteAvailabilitySlot = async (slotId) => {
    const updatedSchedule = availabilitySchedule.filter(s => (s.id || s._id) !== slotId);
    setAvailabilitySchedule(updatedSchedule);
    await saveProfile({ availabilitySchedule: updatedSchedule });
  };

  const sections = [
    { id: 'services', name: 'Service Packages', icon: FileText },
    { id: 'pricing', name: 'Price Lists', icon: DollarSign },
    { id: 'schedule', name: 'Availability', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Service Packages Section */}
      {activeSection === 'services' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Service Packages</h3>
            <button
              onClick={handleAddServicePackage}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </button>
          </div>

          <div className="space-y-4">
            {servicePackages.map((pkg) => (
              <div key={pkg.id || pkg._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">Category: {pkg.category}</span>
                      <span className="text-sm text-gray-500">Price: ${pkg.price}</span>
                      <span className="text-sm text-gray-500">Duration: {pkg.duration}h</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPackage(pkg)}
                      className="p-2 text-gray-400 hover:text-orange-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServicePackage(pkg.id || pkg._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {servicePackages.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No service packages yet</p>
              </div>
            )}
          </div>

          {/* Edit Service Package Modal */}
          {editingPackage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingPackage._id ? 'Edit Service Package' : 'Add Service Package'}
                  </h3>
                  <button
                    onClick={() => setEditingPackage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={editingPackage.name}
                      onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Basic Plumbing Service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={editingPackage.description}
                      onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Describe what's included in this package"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={editingPackage.category}
                        onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      >
                        {serviceCategories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        value={editingPackage.price}
                        onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      value={editingPackage.duration}
                      onChange={(e) => setEditingPackage({ ...editingPackage, duration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      min="0.5"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingPackage(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveServicePackage}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Package'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Lists Section */}
      {activeSection === 'pricing' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Price Lists</h3>
            <button
              onClick={handleAddPriceList}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Price List
            </button>
          </div>

          <div className="space-y-4">
            {priceLists.map((priceList) => (
              <div key={priceList.id || priceList._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 capitalize">{priceList.category} Services</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Base Rate:</span>
                        <span className="ml-2 font-medium">${priceList.baseRate}/hr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Emergency:</span>
                        <span className="ml-2 font-medium">${priceList.emergencyRate}/hr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Weekend:</span>
                        <span className="ml-2 font-medium">${priceList.weekendRate}/hr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Night:</span>
                        <span className="ml-2 font-medium">${priceList.nightRate}/hr</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPrice(priceList)}
                      className="p-2 text-gray-400 hover:text-orange-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePriceList(priceList.id || priceList._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {priceLists.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No price lists yet</p>
              </div>
            )}
          </div>

          {/* Edit Price List Modal */}
          {editingPrice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingPrice._id ? 'Edit Price List' : 'Add Price List'}
                  </h3>
                  <button
                    onClick={() => setEditingPrice(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Category *
                    </label>
                    <select
                      value={editingPrice.category}
                      onChange={(e) => setEditingPrice({ ...editingPrice, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      {serviceCategories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Rate ($/hr) *
                      </label>
                      <input
                        type="number"
                        value={editingPrice.baseRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, baseRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.emergencyRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, emergencyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weekend Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.weekendRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, weekendRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Night Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.nightRate}
                        onChange={(e) => setEditingPrice({ ...editingPrice, nightRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingPrice(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePriceList}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Price List'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Availability Schedule Section */}
      {activeSection === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Availability Schedule</h3>
            <button
              onClick={handleAddAvailabilitySlot}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </button>
          </div>

          <div className="space-y-4">
            {availabilitySchedule.map((slot) => (
              <div key={slot.id || slot._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{days[slot.dayOfWeek]}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        slot.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {slot.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingSchedule(slot)}
                      className="p-2 text-gray-400 hover:text-orange-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAvailabilitySlot(slot.id || slot._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {availabilitySchedule.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No availability schedule set</p>
              </div>
            )}
          </div>

          {/* Edit Availability Slot Modal */}
          {editingSchedule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingSchedule._id ? 'Edit Time Slot' : 'Add Time Slot'}
                  </h3>
                  <button
                    onClick={() => setEditingSchedule(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week *
                    </label>
                    <select
                      value={editingSchedule.dayOfWeek}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      {days.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={editingSchedule.startTime}
                        onChange={(e) => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={editingSchedule.endTime}
                        onChange={(e) => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingSchedule.isAvailable}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, isAvailable: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Available for bookings
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingSchedule(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAvailabilitySlot}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const VendorDashboardPage = () => {
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Handle URL parameters for navigation
  const searchParams = new URLSearchParams(location.search);
  const sectionFromUrl = searchParams.get('section');
  const tabFromUrl = searchParams.get('tab');
  
  const [activeSection, setActiveSection] = useState(sectionFromUrl || 'dashboard');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching vendor dashboard data...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (token) {
        // Decode token to check user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('👤 User info:', { id: payload._id, role: payload.role, email: payload.email });
      }
      
      const response = await api.vendor.getDashboard();
      console.log('✅ Dashboard data received:', response);
      setDashboardData(response);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('📝 Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Auto-load demo data as fallback
      console.log('🔄 Auto-loading demo data as fallback...');
      setDashboardData({
        vendor: { 
          userId: { firstName: 'Demo' }, 
          verificationStatus: 'VERIFIED',
          servicePackages: [],
          priceLists: [],
          availabilitySchedule: [],
          serviceCategories: ['plumbing'],
          serviceArea: 'Singapore',
          qualityScore: 4.5,
          onTimePercentage: 95,
          customerSatisfactionScore: 4.7,
          currentRating: 4.8,
          totalJobsCompleted: 28
        },
        stats: { jobs: {}, earnings: {}, ratings: {} },
        recentJobs: []
      });
      
      toast.error(`API failed, loaded demo data. Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">Check the browser console for detailed error information</p>
          <div className="space-x-4">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Retry
            </button>
            <button
              onClick={() => setDashboardData({
                vendor: { 
                  userId: { firstName: 'Demo' }, 
                  verificationStatus: 'VERIFIED',
                  servicePackages: [],
                  priceLists: [],
                  availabilitySchedule: [],
                  serviceCategories: ['plumbing'],
                  serviceArea: 'Singapore',
                  qualityScore: 4.5,
                  onTimePercentage: 95,
                  customerSatisfactionScore: 4.7
                },
                stats: { jobs: {}, earnings: {}, ratings: {} },
                recentJobs: []
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Load Demo Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { vendor, stats, recentJobs } = dashboardData;

  const mainNavigation = [
    { 
      name: 'Dashboard', 
      section: 'dashboard',
      icon: BarChart3,
      description: 'Business Overview',
      tabs: [
        { name: 'Overview', tab: 'overview' },
        { name: 'Analytics', tab: 'analytics' },
        { name: 'Performance', tab: 'performance' }
      ]
    },
    { 
      name: 'Job Assignments', 
      section: 'assignments',
      icon: AlertCircle,
      description: 'Pending & New Jobs',
      tabs: [
        { name: 'Pending Assignments', tab: 'pending' },
        { name: 'Accepted Jobs', tab: 'accepted' },
        { name: 'Completed Jobs', tab: 'completed' }
      ]
    },
    { 
      name: 'Business', 
      section: 'business',
      icon: FileText,
      description: 'Jobs & Services',
      tabs: [
        { name: 'Active Jobs', tab: 'jobs' },
        { name: 'Job History', tab: 'job-history' },
        { name: 'Service Packages', tab: 'services' },
        { name: 'Pricing', tab: 'pricing' },
        { name: 'Schedule', tab: 'schedule' }
      ]
    },
    { 
      name: 'Earnings', 
      section: 'earnings',
      icon: DollarSign,
      description: 'Revenue & Payments',
      tabs: [
        { name: 'Overview', tab: 'earnings-overview' },
        { name: 'Transactions', tab: 'transactions' },
        { name: 'Payouts', tab: 'payouts' },
        { name: 'Tax Reports', tab: 'tax-reports' }
      ]
    },
    { 
      name: 'Customer Relations', 
      section: 'customers',
      icon: Star,
      description: 'Reviews & Feedback',
      tabs: [
        { name: 'Reviews', tab: 'reviews' },
        { name: 'Customer List', tab: 'customer-list' },
        { name: 'Feedback', tab: 'feedback' },
        { name: 'Communication', tab: 'communication' }
      ]
    },
    { 
      name: 'Membership', 
      section: 'membership',
      icon: CreditCard,
      description: 'Plans & Benefits',
      tabs: [
        { name: 'Current Plan', tab: 'current-plan' },
        { name: 'Upgrade Plans', tab: 'upgrade-plans' },
        { name: 'Usage Stats', tab: 'usage-stats' },
        { name: 'Billing History', tab: 'billing-history' }
      ]
    },
    { 
      name: 'Account', 
      section: 'account',
      icon: User,
      description: 'Profile & Settings',
      tabs: [
        { name: 'Profile', tab: 'profile' },
        { name: 'Verification', tab: 'verification' },
        { name: 'Settings', tab: 'settings' }
      ]
    }
  ];

  const StatCard = ({ title, value, change, changeType, icon: Icon, color = 'orange' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Jobs"
          value={stats.jobs.completed || 0}
          change="+12% this month"
          changeType="positive"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Total Earnings"
          value={`$${stats.earnings.total?.toLocaleString() || '0'}`}
          change="+18% this month"
          changeType="positive"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Average Rating"
          value={stats.ratings.averageRating?.toFixed(1) || '0.0'}
          change="★ from ratings"
          icon={Star}
          color="yellow"
        />
        <StatCard
          title="Active Jobs"
          value={stats.jobs.in_progress || 0}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Verification Status */}
      {vendor.verificationStatus !== 'VERIFIED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            vendor.verificationStatus === 'PENDING' 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center">
            {vendor.verificationStatus === 'PENDING' ? (
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            )}
            <div>
              <h3 className={`font-medium ${
                vendor.verificationStatus === 'PENDING' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                Account {vendor.verificationStatus === 'PENDING' ? 'Pending Verification' : 'Verification Required'}
              </h3>
              <p className={`text-sm ${
                vendor.verificationStatus === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {vendor.verificationStatus === 'PENDING' 
                  ? 'Your account is under review. You will be able to receive job assignments once approved.'
                  : 'Your account verification was not successful. Please contact support for assistance.'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentJobs.length > 0 ? (
            recentJobs.slice(0, 5).map((job) => (
              <div key={job._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Customer: {job.customerId?.firstName} {job.customerId?.lastName}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        ${job.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No jobs yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Score</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quality Score</span>
              <span className="text-sm font-medium">{vendor.qualityScore}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${(vendor.qualityScore / 5) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On-Time Performance</span>
              <span className="text-sm font-medium">{vendor.onTimePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${vendor.onTimePercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium">{vendor.customerSatisfactionScore}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(vendor.customerSatisfactionScore / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Areas</h3>
          <div className="space-y-3">
            {vendor.serviceCategories?.map((category) => (
              <div key={category} className="flex items-center">
                <div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700 capitalize">
                  {category.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              Service Area
            </div>
            <p className="text-sm font-medium text-gray-900">{vendor.serviceArea}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // Dashboard Section
    if (activeSection === 'dashboard') {
      if (activeTab === 'overview') return <OverviewTab />;
      if (activeTab === 'analytics') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Analytics</h3>
          <p className="text-gray-600">Analytics dashboard coming soon...</p>
        </div>
      );
      if (activeTab === 'performance') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <p className="text-gray-600">Performance tracking coming soon...</p>
        </div>
      );
    }

    // Job Assignments Section
    if (activeSection === 'assignments') {
      if (activeTab === 'pending') return <VendorJobAssignments status="ASSIGNED" />;
      if (activeTab === 'accepted') return <VendorJobAssignments status="IN_DISCUSSION,QUOTE_SENT,QUOTE_ACCEPTED,PAID,IN_PROGRESS" />;
      if (activeTab === 'completed') return <VendorJobAssignments status="COMPLETED" />;
    }

    // Business Section
    if (activeSection === 'business') {
      if (activeTab === 'jobs') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Jobs</h3>
          <p className="text-gray-600">Job management interface coming soon...</p>
        </div>
      );
      if (activeTab === 'job-history') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Job History</h3>
          <p className="text-gray-600">Job history interface coming soon...</p>
        </div>
      );
      if (activeTab === 'services') return <ProfileTab vendor={vendor} onUpdate={fetchDashboardData} activeSection="services" />;
      if (activeTab === 'pricing') return <VendorPricingManagement />;
      if (activeTab === 'schedule') return <ProfileTab vendor={vendor} onUpdate={fetchDashboardData} activeSection="schedule" />;
    }

    // Earnings Section
    if (activeSection === 'earnings') {
      if (activeTab === 'earnings-overview') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Overview</h3>
          <p className="text-gray-600">Earnings dashboard coming soon...</p>
        </div>
      );
      if (activeTab === 'transactions') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
          <p className="text-gray-600">Transaction history coming soon...</p>
        </div>
      );
      if (activeTab === 'payouts') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payouts</h3>
          <p className="text-gray-600">Payout management coming soon...</p>
        </div>
      );
      if (activeTab === 'tax-reports') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Reports</h3>
          <p className="text-gray-600">Tax reporting coming soon...</p>
        </div>
      );
    }

    // Customer Relations Section
    if (activeSection === 'customers') {
      if (activeTab === 'reviews') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews</h3>
          <p className="text-gray-600">Reviews interface coming soon...</p>
        </div>
      );
      if (activeTab === 'customer-list') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer List</h3>
          <p className="text-gray-600">Customer management coming soon...</p>
        </div>
      );
      if (activeTab === 'feedback') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Management</h3>
          <p className="text-gray-600">Feedback management coming soon...</p>
        </div>
      );
      if (activeTab === 'communication') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Communication</h3>
          <p className="text-gray-600">Communication tools coming soon...</p>
        </div>
      );
    }

    // Membership Section
    if (activeSection === 'membership') {
      if (activeTab === 'current-plan') return <CurrentPlanTab />;
      if (activeTab === 'upgrade-plans') return <UpgradePlansTab />;
      if (activeTab === 'usage-stats') return <UsageStatsTab />;
      if (activeTab === 'billing-history') return <BillingHistoryTab />;
    }

    // Account Section  
    if (activeSection === 'account') {
      if (activeTab === 'profile') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <p className="text-gray-600">Profile management coming soon...</p>
        </div>
      );
      if (activeTab === 'verification') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Verification</h3>
          <p className="text-gray-600">Verification status and documents...</p>
        </div>
      );
      if (activeTab === 'settings') return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
          <p className="text-gray-600">Settings and preferences coming soon...</p>
        </div>
      );
    }

    return <OverviewTab />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Vendor Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-6">
              Welcome back, {vendor.userId?.firstName || 'Vendor'}!
            </p>
            <div className="flex items-center justify-center space-x-6 text-orange-100">
              {vendor.verificationStatus === 'VERIFIED' && (
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  <span className="text-lg font-medium">Verified Vendor</span>
                </div>
              )}
              <div className="flex items-center">
                <Star className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">{vendor.currentRating || '5.0'} Rating</span>
              </div>
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">{vendor.totalJobsCompleted || 0} Jobs Completed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-12 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">$8,450</h3>
            <p className="text-gray-600">Total Earnings</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">28</h3>
            <p className="text-gray-600">Active Jobs</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
            <p className="text-gray-600">Customer Rating</p>
          </motion.div>
        </div>

        {/* Main Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.section}
                    onClick={() => {
                      setActiveSection(item.section);
                      setActiveTab(item.tabs[0].tab);
                    }}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeSection === item.section
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-400 font-normal">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Sub Navigation */}
          {activeSection && (
            <div className="px-6 py-3 bg-gray-50">
              <nav className="flex space-x-6">
                {mainNavigation.find(item => item.section === activeSection)?.tabs?.map((tab) => (
                  <button
                    key={tab.tab}
                    onClick={() => setActiveTab(tab.tab)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.tab
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
};

// Vendor Job Assignments Component
const VendorJobAssignments = ({ status }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, [status]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log('Loading jobs with status:', status); // Debug log
      console.log('Current user from localStorage token:', localStorage.getItem('token')); // Debug log
      const response = await api.vendor.getJobs(status);
      console.log('Jobs response:', response); // Debug log
      const jobsArray = response.jobs || [];
      console.log('Setting jobs array length:', jobsArray.length); // Debug log
      setJobs(jobsArray);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJobResponse = async (jobId, response, reason = '') => {
    // If rejecting, ask for a reason
    if (response === 'REJECTED' && !reason) {
      const userReason = window.prompt('Please provide a reason for rejecting this job:');
      if (!userReason) {
        return; // User cancelled
      }
      reason = userReason;
    }

    try {
      console.log('Sending response:', { response, reason, jobId }); // Debug log
      const result = await api.vendor.respondToJob(jobId, { response, reason });
      console.log('Response result:', result); // Debug log
      toast.success(`Job ${response.toLowerCase()} successfully!`);
      loadJobs(); // Reload jobs
    } catch (error) {
      console.error('Error responding to job:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Failed to ${response.toLowerCase()} job: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {status === 'ASSIGNED' ? 'Pending Job Assignments' : 
             status.includes('COMPLETED') ? 'Completed Jobs' : 'Active Jobs'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Status filter: {status} | Found: {jobs.length} jobs
          </p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">
            {status === 'ASSIGNED' ? 'No pending assignments at the moment.' :
             status.includes('COMPLETED') ? 'No completed jobs yet.' : 'No active jobs currently.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      Job #{job.jobNumber}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{job.customerId?.firstName} {job.customerId?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium capitalize">{job.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{job.location?.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preferred Date</p>
                      <p className="font-medium">
                        {job.preferredTimeSlots?.[0] ? 
                          new Date(job.preferredTimeSlots[0].date).toLocaleDateString() : 'Flexible'}
                      </p>
                    </div>
                  </div>

                  {job.status === 'ASSIGNED' && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleJobResponse(job._id, 'ACCEPTED')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Job
                      </button>
                      <button
                        onClick={() => handleJobResponse(job._id, 'REJECTED')}
                        className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject Job
                      </button>
                    </div>
                  )}

                  {(job.status === 'IN_DISCUSSION' || job.status === 'QUOTE_SENT' || job.status === 'QUOTE_ACCEPTED' || job.status === 'PAID' || job.status === 'IN_PROGRESS') && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded-full">
                        ✓ Job Accepted - Use message icon in header to communicate with customer
                      </span>
                      <button
                        onClick={() => {
                          // Update job status to next stage
                          console.log('Update job progress for:', job._id);
                        }}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};


export default VendorDashboardPage;