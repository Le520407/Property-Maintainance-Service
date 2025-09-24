import {
  AlertCircle,
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Crown,
  DollarSign,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  Gift,
  Grid,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  XCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [editingUser, setEditingUser] = useState(null);
  
  // Agent and invite code management states
  const [showInviteCodes, setShowInviteCodes] = useState(false);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [showCreateInviteCode, setShowCreateInviteCode] = useState(false);
  const [inviteCodeForm, setInviteCodeForm] = useState({
    userType: 'referral',
    maxUses: 1,
    expiresInDays: 30,
    description: '',
    campaign: ''
  });

  // Points management states
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsModalUser, setPointsModalUser] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [pointsForm, setPointsForm] = useState({
    points: '',
    reason: '',
    type: 'ADMIN_ADJUSTMENT'
  });
  const [pointsLoading, setPointsLoading] = useState(false);
  const [adjustingPoints, setAdjustingPoints] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: 'Singapore',
    role: 'customer',
    skills: [],
    experience: 0,
    hourlyRate: 0,
    permissions: [],
    isSuper: false,
    status: 'ACTIVE'
  });

  // 角色选项
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'customer', label: 'Customer', color: 'blue' },
    { value: 'vendor', label: 'Vendor', color: 'purple' },
    { value: 'referral', label: 'Agent', color: 'violet' },
    { value: 'admin', label: 'Admin', color: 'orange' }
  ];

  // 状态选项
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'PENDING', label: 'Pending', color: 'yellow' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
    { value: 'SUSPENDED', label: 'Suspended', color: 'red' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'last_login', label: 'Last Login' }
  ];

  // 权限选项
  const permissionOptions = [
    { value: 'manage_users', label: 'Manage Users' },
    { value: 'manage_content', label: 'Manage Content' },
    { value: 'manage_services', label: 'Manage Services' },
    { value: 'manage_payments', label: 'Manage Payments' },
    { value: 'view_analytics', label: 'View Analytics' },
    { value: 'manage_system', label: 'Manage System' }
  ];

  // 技能选项 (Vendor Skills Options)
  const skillsOptions = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'painting', label: 'Painting' },
    { value: 'hvac', label: 'HVAC (Heating & Cooling)' },
    { value: 'appliance_repair', label: 'Appliance Repair' },
    { value: 'flooring', label: 'Flooring Installation' },
    { value: 'roofing', label: 'Roofing' },
    { value: 'gardening', label: 'Gardening & Landscaping' },
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'handyman', label: 'General Handyman' },
    { value: 'locksmith', label: 'Locksmith' },
    { value: 'masonry', label: 'Masonry & Brickwork' },
    { value: 'drywall', label: 'Drywall & Insulation' },
    { value: 'windows_doors', label: 'Windows & Doors' }
  ];

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (selectedRole) params.append('role', selectedRole);
      if (selectedStatus) params.append('status', selectedStatus);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const response = await fetch(`http://localhost:5000/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // 获取邀请码列表
  const fetchInviteCodes = async () => {
    try {
      const response = await api.get('/invite-codes');
      if (response.success) {
        setInviteCodes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching invite codes:', error);
      toast.error('Failed to load invite codes');
    }
  };

  // 生成邀请码
  const generateInviteCode = async () => {
    try {
      const response = await api.post('/invite-codes/generate', inviteCodeForm);
      if (response.success) {
        toast.success(`Invite code generated: ${response.data.code}`);
        setShowCreateInviteCode(false);
        setInviteCodeForm({
          userType: 'referral',
          maxUses: 1,
          expiresInDays: 30,
          description: '',
          campaign: ''
        });
        fetchInviteCodes();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate code');
    }
  };

  // 更新代理状态
  const updateAgentStatus = async (userId, isActive) => {
    try {
      await api.patch(`/api/admin/agents/${userId}/status`, { isAgentActive: isActive });
      toast.success(`Agent ${isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  // 更新代理佣金率
  const updateAgentCommission = async (userId, rate) => {
    try {
      await api.patch(`/api/admin/agents/${userId}/commission`, { commissionRate: rate });
      toast.success('Commission rate updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Points management functions
  const openPointsModal = (userData) => {
    console.log('openPointsModal called with:', userData);

    // Immediately open modal and set user data
    setPointsModalUser(userData);
    setShowPointsModal(true);
    setPointsForm({
      points: '',
      reason: '',
      type: 'ADMIN_ADJUSTMENT'
    });

    console.log('Modal state set to true');

    // Start loading state for data fetching only
    setPointsLoading(true);

    // Fetch points history for this user in the background
    const fetchPointsData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userData._id}/points`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPointsHistory(data.data.recentTransactions || []);
          // Update user data with latest points balance
          setPointsModalUser(prev => ({
            ...prev,
            ...data.data.user
          }));
        }
      } catch (error) {
        console.error('Error fetching points data:', error);
        toast.error('Failed to load points data');
      } finally {
        setPointsLoading(false);
      }
    };

    fetchPointsData();
  };

  const adjustUserPoints = async (e) => {
    e.preventDefault();

    if (!pointsForm.points || !pointsForm.reason) {
      toast.error('Points amount and reason are required');
      return;
    }

    const pointsValue = parseInt(pointsForm.points);
    if (isNaN(pointsValue) || pointsValue === 0) {
      toast.error('Please enter a valid points amount');
      return;
    }

    setAdjustingPoints(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${pointsModalUser._id}/points/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          points: pointsValue,
          reason: pointsForm.reason,
          type: pointsForm.type
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);

        // Update the user's points balance in the modal
        setPointsModalUser(prev => ({
          ...prev,
          pointsBalance: data.data.newBalance
        }));

        // Refresh points history
        await openPointsModal({ ...pointsModalUser, pointsBalance: data.data.newBalance });

        // Reset form
        setPointsForm({
          points: '',
          reason: '',
          type: 'ADMIN_ADJUSTMENT'
        });

        // Refresh users list to show updated points
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('Failed to adjust points');
    } finally {
      setAdjustingPoints(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchStats();
    }
  }, [user, currentPage, selectedRole, selectedStatus, debouncedSearch]);

  // Fetch invite codes when the invite codes section is shown
  useEffect(() => {
    if (showInviteCodes) {
      fetchInviteCodes();
    }
  }, [showInviteCodes]);

  // 处理搜索
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // 处理筛选
  const handleFilter = (type, value) => {
    if (type === 'role') setSelectedRole(value);
    if (type === 'status') setSelectedStatus(value);
    setCurrentPage(1);
  };

  // 创建用户
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
        resetForm();
        toast.success(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} user created successfully!`);
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error creating user');
    }
  };

  // 更新用户状态
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
        const statusText = newStatus === 'ACTIVE' ? 'approved' : 'updated';
        toast.success(`User status ${statusText} successfully!`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // 批量操作
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const promises = selectedUsers.map(userId => {
        if (action === 'activate') {
          return updateUserStatus(userId, 'ACTIVE');
        } else if (action === 'suspend') {
          return updateUserStatus(userId, 'SUSPENDED');
        }
      });

      await Promise.all(promises);
      setSelectedUsers([]);
      toast.success(`Bulk ${action} completed successfully!`);
    } catch (error) {
      toast.error(`Failed to ${action} users`);
    }
  };

  // 删除用户
  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchUsers();
          await fetchStats();
          toast.success('User deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  // 编辑用户
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      // Create a copy of formData and remove password if it's empty
      const updateData = { ...formData };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }

      const response = await fetch(`http://localhost:5000/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
        resetForm();
        toast.success(`User updated successfully!`);
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user');
    }
  };

  // 开始编辑用户
  const startEditUser = (userData) => {
    setEditingUser(userData);
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      password: '', // Don't pre-fill password for security
      phone: userData.phone || '',
      city: userData.city || '',
      country: userData.country || 'Singapore',
      role: userData.role || 'customer',
      skills: processSkillsArray(userData.skills || []),
      experience: userData.experience || 0,
      hourlyRate: userData.hourlyRate || 0,
      permissions: userData.permissions || [],
      isSuper: userData.isSuper || false,
      status: userData.status || 'ACTIVE'
    });
    setShowCreateForm(true); // Reuse the same modal
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      city: '',
      country: 'Singapore',
      role: 'customer',
      skills: [],
      experience: 0,
      hourlyRate: 0,
      permissions: [],
      isSuper: false,
      status: 'ACTIVE'
    });
    setShowCreateForm(false);
    setEditingUser(null);
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 处理权限变更
  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // 处理技能变更
  const handleSkillChange = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // 获取技能标签
  const getSkillLabel = (skillValue) => {
    const skill = skillsOptions.find(s => s.value === skillValue);
    return skill ? skill.label : skillValue;
  };

  // 映射旧技能到新技能值 (Migration helper)
  const mapLegacySkillToValue = (skillText) => {
    const skillLower = skillText.toLowerCase().trim();
    const mapping = {
      'plumbing': 'plumbing',
      'electrical': 'electrical', 
      'carpentry': 'carpentry',
      'painting': 'painting',
      'hvac': 'hvac',
      'heating': 'hvac',
      'cooling': 'hvac',
      'appliance repair': 'appliance_repair',
      'appliances': 'appliance_repair',
      'flooring': 'flooring',
      'roofing': 'roofing',
      'gardening': 'gardening',
      'landscaping': 'gardening',
      'cleaning': 'cleaning',
      'pest control': 'pest_control',
      'handyman': 'handyman',
      'general': 'handyman',
      'locksmith': 'locksmith',
      'masonry': 'masonry',
      'brickwork': 'masonry',
      'drywall': 'drywall',
      'insulation': 'drywall',
      'windows': 'windows_doors',
      'doors': 'windows_doors'
    };
    
    return mapping[skillLower] || skillLower;
  };

  // 处理技能数组，支持旧格式迁移
  const processSkillsArray = (skills) => {
    if (!Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      // If skill is already a valid value, keep it
      if (skillsOptions.some(opt => opt.value === skill)) {
        return skill;
      }
      // Otherwise, try to map it from legacy format
      return mapLegacySkillToValue(skill);
    }).filter(skill => skillsOptions.some(opt => opt.value === skill));
  };

  // 获取状态样式
  const getStatusStyle = (status) => {
    const styles = {
      'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'INACTIVE': 'bg-gray-100 text-gray-800 border-gray-200',
      'SUSPENDED': 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // 获取角色样式
  const getRoleStyle = (role) => {
    const styles = {
      'customer': 'bg-orange-100 text-orange-700 border-orange-200',
      'vendor': 'bg-orange-200 text-orange-800 border-orange-300',
      'admin': 'bg-orange-300 text-orange-900 border-orange-400'
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  // 用户卡片组件
  const UserCard = ({ userData }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {userData.firstName?.[0] || userData.email[0].toUpperCase()}
            </div>
            {userData.status === 'ACTIVE' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {userData.fullName || `${userData.firstName} ${userData.lastName}`}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleStyle(userData.role)}`}>
                {userData.role}
              </span>
              {userData.isSuper && (
                <Crown className="w-4 h-4 text-yellow-500" title="Super Admin" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(userData.status)}`}>
            {userData.status}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600 text-sm">
          <Mail className="w-4 h-4 mr-2" />
          {userData.email}
        </div>
        {userData.phone && (
          <div className="flex items-center text-gray-600 text-sm">
            <Phone className="w-4 h-4 mr-2" />
            {userData.phone}
          </div>
        )}
        {userData.city && (
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            {userData.city}, {userData.country}
          </div>
        )}
        {userData.role === 'customer' && typeof userData.pointsBalance !== 'undefined' && (
          <div className="flex items-center text-gray-600 text-sm">
            <Star className="w-4 h-4 mr-2" />
            {userData.pointsBalance || 0} points available
          </div>
        )}
      </div>

      {userData.role === 'vendor' && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="space-y-3">
            {/* Service Categories */}
            {(userData.serviceCategories || userData.vendorProfile?.serviceCategories) && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Service Categories</p>
                <div className="flex flex-wrap gap-1">
                  {(userData.serviceCategories || userData.vendorProfile?.serviceCategories || []).slice(0, 3).map((category, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  ))}
                  {(userData.serviceCategories || userData.vendorProfile?.serviceCategories || []).length > 3 && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                      +{(userData.serviceCategories || userData.vendorProfile?.serviceCategories || []).length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {userData.skills && userData.skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {userData.skills.slice(0, 2).map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {getSkillLabel(skill)}
                      </span>
                    ))}
                    {userData.skills.length > 2 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                        +{userData.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Experience</p>
                <p className="text-sm font-medium">{userData.experience || userData.vendorProfile?.experience || 0} years</p>
              </div>
              {(userData.hourlyRate > 0 || userData.vendorProfile?.hourlyRate > 0) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rate</p>
                  <p className="text-sm font-medium">${userData.hourlyRate || userData.vendorProfile?.hourlyRate}/hr</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">
                    {userData.accurateRating ? 
                      `${userData.accurateRating.averageRating.toFixed(1)}/5 (${userData.accurateRating.totalRatings} reviews)` :
                      `${userData.rating || userData.vendorProfile?.averageRating || 0}/5`
                    }
                  </span>
                </div>
              </div>
            </div>
            
            {/* Service Area */}
            {(userData.serviceArea || userData.vendorProfile?.serviceArea) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Service Area</p>
                <p className="text-sm font-medium">{userData.serviceArea || userData.vendorProfile?.serviceArea}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {userData.role === 'referral' && (
        <div className="bg-purple-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Agent Code</p>
              <p className="text-sm font-mono font-medium text-purple-600">{userData.agentCode || 'N/A'}</p>
            </div>
            {/* Agent Tier removed - no tier system for agents */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Commission Rate</p>
              <p className="text-sm font-medium">{userData.commissionRate || 15}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
              <p className="text-sm font-medium">${(userData.totalCommissionEarned || 0).toFixed(2)}</p>
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateAgentStatus(userData._id, !userData.isAgentActive)}
                    className={`p-1 rounded ${userData.isAgentActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                    title={userData.isAgentActive ? 'Deactivate agent' : 'Activate agent'}
                  >
                    {userData.isAgentActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <span className={`text-xs font-medium ${userData.isAgentActive ? 'text-green-600' : 'text-red-600'}`}>
                    {userData.isAgentActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <button
                  onClick={() => {
                    const newRate = prompt('Enter new commission rate (%):', userData.commissionRate || 15);
                    if (newRate && !isNaN(newRate)) {
                      updateAgentCommission(userData._id, parseFloat(newRate));
                    }
                  }}
                  className="text-purple-600 hover:bg-purple-50 p-1 rounded"
                  title="Update commission rate"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>Joined: {new Date(userData.createdAt).toLocaleDateString()}</span>
        <span>
          Last login: {userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      </div>

      {userData.status === 'PENDING' && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => updateUserStatus(userData._id, 'ACTIVE')}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Approve
            </button>
            <button
              onClick={() => updateUserStatus(userData._id, 'SUSPENDED')}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <UserX className="w-4 h-4 mr-1" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => startEditUser(userData)}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit User
            </button>

            {userData.role === 'customer' && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Points button clicked for user:', userData.firstName);
                  openPointsModal(userData);
                }}
                className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <Gift className="w-4 h-4 mr-1" />
                Manage Points
              </button>
            )}

            {userData.role === 'vendor' && (
              <button
                onClick={() => {
                  console.log('Managing vendor data for:', userData._id);
                  toast.success(`Opening vendor management for ${userData.firstName} ${userData.lastName}`);
                }}
                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                <Settings className="w-4 h-4 mr-1" />
                Vendor Settings
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Status Change Button */}
            {userData.ceaNumberStatus !== 'PENDING' && (
              <button
                onClick={() => updateUserStatus(userData._id, userData.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  userData.status === 'ACTIVE'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {userData.status === 'ACTIVE' ? (
                  <>
                    <UserX className="w-4 h-4 mr-1" />
                    Suspend
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    Activate
                  </>
                )}
              </button>
            )}

            {/* Delete Button (Super Admin Only) */}
            {user.isSuper && (
              <button
                onClick={() => deleteUser(userData._id)}
                className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-white">User Management</h1>
              <p className="text-orange-100 mt-1">Manage users, approve vendors, and monitor system activity</p>
              {stats.pendingUsers > 0 && (
                <div className="flex items-center mt-2 px-3 py-2 bg-orange-800 text-orange-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {stats.pendingUsers} user{stats.pendingUsers > 1 ? 's' : ''} pending approval
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {stats.pendingUsers > 0 && (
                <button
                  onClick={() => {
                    setSelectedStatus('PENDING');
                    setSelectedRole('vendor');
                    setCurrentPage(1);
                  }}
                  className="flex items-center px-4 py-2 bg-orange-800 text-white rounded-lg hover:bg-orange-900 transition-colors"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Pending ({stats.pendingUsers})
                </button>
              )}
              
              <button
                onClick={() => fetchUsers()}
                className="flex items-center px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              {user.isSuper && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setShowInviteCodes(false)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                !showInviteCodes
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="inline w-4 h-4 mr-2" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setShowInviteCodes(true)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                showInviteCodes
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Gift className="inline w-4 h-4 mr-2" />
              Invite Codes ({inviteCodes.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showInviteCodes ? (
          <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalCustomers || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vendors</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalVendors || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalAdmins || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingUsers || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {searchQuery !== debouncedSearch && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedRole}
                onChange={(e) => handleFilter('role', e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => handleFilter('status', e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-3 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-3 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Suspend
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : users.length > 0 ? (
          <div className={viewMode === 'cards' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {users.map((userData) => (
              <UserCard key={userData._id} userData={userData} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedRole || selectedStatus
                ? 'No users match your search criteria.'
                : 'No users have been created yet.'}
            </p>
            {(searchQuery || selectedRole || selectedStatus) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('');
                  setSelectedStatus('');
                  setCurrentPage(1);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                const page = index + Math.max(1, currentPage - 2);
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      page === currentPage
                        ? 'text-white bg-blue-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        <AnimatePresence>
          {showCreateForm && (
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
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingUser ? 'Edit User' : 'Create New User'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={editingUser ? handleEditUser : handleCreateUser} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role *
                        </label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          {user?.role === 'admin' && <option value="admin">Admin</option>}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status *
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="PENDING">Pending</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password {editingUser ? '' : '*'}
                        </label>
                        {editingUser && (
                          <p className="text-sm text-gray-500 mb-2">
                            Leave blank to keep current password
                          </p>
                        )}
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required={!editingUser}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Vendor specific fields */}
                    {formData.role === 'vendor' && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Information</h3>
                        
                        {/* Skills Section */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Skills & Services
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                            {skillsOptions.map(skill => (
                              <div key={skill.value} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={skill.value}
                                  checked={formData.skills.includes(skill.value)}
                                  onChange={() => handleSkillChange(skill.value)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={skill.value} className="ml-2 block text-sm text-gray-700 cursor-pointer">
                                  {skill.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Select all skills and services this vendor can provide
                          </p>
                        </div>

                        {/* Experience and Rate */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Years of Experience
                            </label>
                            <input
                              type="number"
                              name="experience"
                              value={formData.experience}
                              onChange={handleInputChange}
                              min="0"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hourly Rate ($)
                            </label>
                            <input
                              type="number"
                              name="hourlyRate"
                              value={formData.hourlyRate}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin specific fields */}
                    {formData.role === 'admin' && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Permissions</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {permissionOptions.map(permission => (
                            <div key={permission.value} className="flex items-center">
                              <input
                                type="checkbox"
                                id={permission.value}
                                checked={formData.permissions.includes(permission.value)}
                                onChange={() => handlePermissionChange(permission.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={permission.value} className="ml-2 block text-sm text-gray-700">
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>

                        {user?.isSuper && (
                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                name="isSuper"
                                checked={formData.isSuper}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm font-medium text-gray-700">
                                Super Administrator
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 pt-6 border-t">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {editingUser ? 'Update User' : `Create ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}`}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        ) : (
          /* Invite Codes Section */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Invite Code Management</h2>
              <button
                onClick={() => setShowCreateInviteCode(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Code
              </button>
            </div>

            {/* Invite Codes List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {inviteCodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No invite codes generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inviteCodes.map((code) => (
                      <div key={code._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <code className="text-lg font-mono font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded">
                                {code.code}
                              </code>
                              <button
                                onClick={() => copyToClipboard(code.code)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy to clipboard"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                code.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                code.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {code.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Uses:</span>
                                <span className="ml-2">{code.currentUses}/{code.maxUses}</span>
                              </div>
                              <div>
                                <span className="font-medium">Expires:</span>
                                <span className="ml-2">{new Date(code.expiresAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="font-medium">Created:</span>
                                <span className="ml-2">{new Date(code.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="font-medium">Type:</span>
                                <span className="ml-2 capitalize">{code.userType}</span>
                              </div>
                            </div>
                            
                            {code.metadata?.description && (
                              <p className="mt-2 text-sm text-gray-600">{code.metadata.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Generate Invite Code Modal */}
            {showCreateInviteCode && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg max-w-md w-full p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Generate Invite Code</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                      <select
                        value={inviteCodeForm.userType}
                        onChange={(e) => setInviteCodeForm(prev => ({ ...prev, userType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="referral">Referral Agent</option>
                        <option value="vendor">Vendor</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                      <input
                        type="number"
                        value={inviteCodeForm.maxUses}
                        onChange={(e) => setInviteCodeForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (Days)</label>
                      <input
                        type="number"
                        value={inviteCodeForm.expiresInDays}
                        onChange={(e) => setInviteCodeForm(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={inviteCodeForm.description}
                        onChange={(e) => setInviteCodeForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateInviteCode(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateInviteCode}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Generate Code
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Points Management Modal */}
            <AnimatePresence>
              {showPointsModal && pointsModalUser && (
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
                    className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <Gift className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Points Management</h2>
                            <p className="text-gray-600">{pointsModalUser.firstName} {pointsModalUser.lastName}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPointsModal(false)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Current Points Balance */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 mb-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-purple-600 mb-2">
                            {pointsModalUser.pointsBalance || 0}
                          </div>
                          <div className="text-purple-600 font-medium">Available Points</div>
                          {pointsModalUser.totalPointsEarned && (
                            <div className="text-sm text-purple-500 mt-1">
                              Total Earned: {pointsModalUser.totalPointsEarned} •
                              Total Redeemed: {pointsModalUser.totalPointsRedeemed || 0}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Points Adjustment Form */}
                      <form onSubmit={adjustUserPoints} className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Adjust Points</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points Amount *
                            </label>
                            <input
                              type="number"
                              value={pointsForm.points}
                              onChange={(e) => setPointsForm(prev => ({ ...prev, points: e.target.value }))}
                              placeholder="Enter points (+ to add, - to subtract)"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use positive numbers to add points, negative to subtract
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adjustment Type
                            </label>
                            <select
                              value={pointsForm.type}
                              onChange={(e) => setPointsForm(prev => ({ ...prev, type: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
                              <option value="BONUS_POINTS">Bonus Points</option>
                              <option value="COMPENSATION">Compensation</option>
                              <option value="CORRECTION">Correction</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason *
                          </label>
                          <textarea
                            value={pointsForm.reason}
                            onChange={(e) => setPointsForm(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Explain why you're adjusting points..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={adjustingPoints}
                          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {adjustingPoints && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          )}
                          {adjustingPoints ? 'Adjusting Points...' : 'Adjust Points'}
                        </button>
                      </form>

                      {/* Recent Points History */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                        {pointsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-600">Loading transaction history...</span>
                          </div>
                        ) : pointsHistory.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {pointsHistory.map((transaction, index) => (
                              <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${
                                      transaction.type === 'EARNED_REFERRAL' ? 'bg-green-500' :
                                      transaction.type === 'ADMIN_ADJUSTMENT' ? 'bg-purple-500' :
                                      transaction.type === 'REDEEMED_DISCOUNT' ? 'bg-orange-500' :
                                      'bg-gray-500'
                                    }`}></div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {transaction.description}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.type.replace('_', ' ')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-sm font-semibold ${
                                  transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No points activity yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Points Management Modal - Moved outside tab content */}
      {showPointsModal && pointsModalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Points Management</h2>
                    <p className="text-gray-600">{pointsModalUser.firstName} {pointsModalUser.lastName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Current Points Balance */}
              <div className="bg-purple-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Current Balance</p>
                    <p className="text-3xl font-bold text-purple-800">
                      {pointsModalUser.pointsBalance || 0} points
                    </p>
                  </div>
                  <div className="text-purple-500">
                    <Award className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Add/Deduct Points Form */}
              <form onSubmit={adjustUserPoints} className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Points</h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points Amount</label>
                    <input
                      type="number"
                      value={pointsForm.points}
                      onChange={(e) => setPointsForm(prev => ({ ...prev, points: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter points (+ or -)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Use negative numbers to deduct points</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                    <select
                      value={pointsForm.type}
                      onChange={(e) => setPointsForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
                      <option value="BONUS">Bonus</option>
                      <option value="PENALTY">Penalty</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={pointsForm.reason}
                    onChange={(e) => setPointsForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Enter reason for points adjustment..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={adjustingPoints}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {adjustingPoints ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <DollarSign className="w-5 h-5 mr-2" />
                  )}
                  {adjustingPoints ? 'Processing...' : 'Adjust Points'}
                </button>
              </form>

              {/* Points History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>

                {pointsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : pointsHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No transaction history found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pointsHistory.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </p>
                          <p className="text-sm text-gray-500">
                            Balance: {transaction.newBalance}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;