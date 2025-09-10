import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  ArrowLeft,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Award,
  User,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const RateVendor = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  
  // Rating form state
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [criteria, setCriteria] = useState({
    quality: 0,
    timeliness: 0,
    professionalism: 0,
    communication: 0,
    cleanliness: 0
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [positiveAspects, setPositiveAspects] = useState([]);
  const [negativeAspects, setNegativeAspects] = useState([]);
  const [images, setImages] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const criteriaLabels = {
    quality: 'Work Quality',
    timeliness: 'Timeliness',
    professionalism: 'Professionalism',
    communication: 'Communication',
    cleanliness: 'Cleanliness'
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const positiveOptions = [
    { value: 'ON_TIME', label: 'On Time' },
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'GOOD_QUALITY', label: 'Good Quality' },
    { value: 'FAIR_PRICING', label: 'Fair Pricing' },
    { value: 'CLEAN_WORK', label: 'Clean Work' },
    { value: 'GOOD_COMMUNICATION', label: 'Good Communication' },
    { value: 'PROBLEM_SOLVER', label: 'Problem Solver' },
    { value: 'COURTEOUS', label: 'Courteous' },
    { value: 'WELL_EQUIPPED', label: 'Well Equipped' },
    { value: 'KNOWLEDGEABLE', label: 'Knowledgeable' }
  ];

  const negativeOptions = [
    { value: 'LATE', label: 'Late' },
    { value: 'UNPROFESSIONAL', label: 'Unprofessional' },
    { value: 'POOR_QUALITY', label: 'Poor Quality' },
    { value: 'OVERPRICED', label: 'Overpriced' },
    { value: 'MESSY_WORK', label: 'Messy Work' },
    { value: 'POOR_COMMUNICATION', label: 'Poor Communication' },
    { value: 'INCOMPLETE_WORK', label: 'Incomplete Work' },
    { value: 'RUDE_BEHAVIOR', label: 'Rude Behavior' },
    { value: 'LACK_OF_TOOLS', label: 'Lack of Tools' },
    { value: 'INEXPERIENCED', label: 'Inexperienced' }
  ];

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await api.jobs.getById(jobId);
      const jobData = jobResponse.job;
      
      if (!jobData) {
        toast.error('Job not found');
        navigate('/jobs');
        return;
      }

      if (jobData.customerId._id !== user._id) {
        toast.error('You can only rate your own jobs');
        navigate('/jobs');
        return;
      }

      if (jobData.status !== 'COMPLETED') {
        toast.error('Job must be completed to submit a rating');
        navigate(`/jobs/${jobId}`);
        return;
      }

      setJob(jobData);

      // Check if rating already exists
      try {
        const ratingResponse = await api.jobs.getRating(jobId);
        if (ratingResponse.rating) {
          setExistingRating(ratingResponse.rating);
          // Pre-fill form with existing rating
          const rating = ratingResponse.rating;
          setOverallRating(rating.overallRating);
          setCriteria(rating.criteria);
          setTitle(rating.title || '');
          setComment(rating.comment || '');
          setWouldRecommend(rating.wouldRecommend);
          setPositiveAspects(rating.positiveAspects || []);
          setNegativeAspects(rating.negativeAspects || []);
          setIsAnonymous(rating.isAnonymous || false);
        }
      } catch (ratingError) {
        // No existing rating found, that's fine
        console.log('No existing rating found');
      }

    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  }, [jobId, user._id, navigate]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleCriteriaRating = (criterion, value) => {
    setCriteria(prev => ({
      ...prev,
      [criterion]: value
    }));
  };

  const handleAspectToggle = (aspect, isPositive) => {
    if (isPositive) {
      setPositiveAspects(prev => 
        prev.includes(aspect) 
          ? prev.filter(a => a !== aspect)
          : [...prev, aspect]
      );
    } else {
      setNegativeAspects(prev => 
        prev.includes(aspect) 
          ? prev.filter(a => a !== aspect)
          : [...prev, aspect]
      );
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // In a real app, you would upload these to a cloud storage service
    const imageUrls = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: 'GENERAL'
    }));
    
    setImages(prev => [...prev, ...imageUrls]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    if (wouldRecommend === null) {
      toast.error('Please indicate if you would recommend this vendor');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please provide some comments about your experience');
      return;
    }

    setSubmitting(true);
    
    try {
      const ratingData = {
        overallRating,
        criteria,
        title: title.trim(),
        comment: comment.trim(),
        wouldRecommend,
        positiveAspects,
        negativeAspects,
        images: images.map(img => ({ url: img.url, type: img.type || 'GENERAL' })),
        isAnonymous
      };

      await api.jobs.submitRating(jobId, ratingData);
      
      toast.success('Rating submitted successfully!');
      navigate('/jobs', { state: { message: 'Thank you for your feedback!' } });
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (value, onChange, size = 'w-8 h-8') => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          disabled={!onChange}
        >
          <Star
            className={`${size} transition-colors ${
              star <= (hoverRating || value)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
        <button
          onClick={() => navigate('/jobs')}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/jobs')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {existingRating ? 'Update Rating' : 'Rate Your Experience'}
          </h1>
          <p className="text-gray-600 mt-1">
            Share your feedback to help other customers
          </p>
        </div>
      </div>

      {/* Job Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>{job.vendorId.firstName} {job.vendorId.lastName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{job.location?.city}</span>
              </div>
              {job.totalAmount && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>${job.totalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Completed
          </span>
        </div>
      </div>

      {/* Rating Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
        {/* Overall Rating */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-4">
            {renderStarRating(overallRating, setOverallRating, 'w-10 h-10')}
            {overallRating > 0 && (
              <span className="text-lg font-medium text-gray-700">
                {ratingLabels[overallRating]}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Criteria */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Rate Specific Aspects
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(criteriaLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700">{label}</span>
                {renderStarRating(
                  criteria[key], 
                  (value) => handleCriteriaRating(key, value),
                  'w-6 h-6'
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your experience"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            maxLength={100}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-2">
            Your Review *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your experience with this vendor..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            maxLength={1000}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        {/* Recommendation */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Would you recommend this vendor? *
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`flex items-center px-6 py-3 rounded-lg border transition-colors ${
                wouldRecommend === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              Yes, I recommend
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`flex items-center px-6 py-3 rounded-lg border transition-colors ${
                wouldRecommend === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ThumbsDown className="w-5 h-5 mr-2" />
              No, I don't recommend
            </button>
          </div>
        </div>

        {/* Positive Aspects */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            What did they do well? (Optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {positiveOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAspectToggle(option.value, true)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  positiveAspects.includes(option.value)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Negative Aspects */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            What could be improved? (Optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {negativeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAspectToggle(option.value, false)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  negativeAspects.includes(option.value)
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Add Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer text-orange-600 hover:text-orange-700"
            >
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <span>Upload photos of the completed work</span>
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Options */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
          />
          <label htmlFor="anonymous" className="text-gray-700">
            Submit this review anonymously
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || overallRating === 0 || wouldRecommend === null || !comment.trim()}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Award className="w-4 h-4 mr-2" />
                {existingRating ? 'Update Rating' : 'Submit Rating'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RateVendor;
