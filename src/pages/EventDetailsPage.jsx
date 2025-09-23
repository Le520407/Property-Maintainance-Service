import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Tag,
  CheckCircle,
  X,
  Heart,
  Share2,
  Download,
  ExternalLink,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  UserMinus,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response);
    } catch (error) {
      console.error('Error fetching event details:', error);
      if (error.response?.status === 404) {
        toast.error('Event not found');
        navigate('/events');
      } else if (error.response?.status === 403) {
        toast.error('You do not have access to this event');
        navigate('/events');
      } else {
        toast.error('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please login to register for this event');
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);
      await api.post(`/events/${id}/register`);
      toast.success('Successfully registered for the event!');
      fetchEventDetails(); // Refresh event data
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user) return;

    try {
      setRegistering(true);
      await api.delete(`/events/${id}/register`);
      toast.success('Registration cancelled successfully');
      fetchEventDetails(); // Refresh event data
    } catch (error) {
      console.error('Cancel registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel registration');
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user) return;

    try {
      await api.post(`/events/${id}/feedback`, feedback);
      toast.success('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      fetchEventDetails(); // Refresh to show updated rating
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = () => {
    if (!event) return null;

    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const registrationDeadline = new Date(event.registrationDeadline);

    if (now > endDate) return 'completed';
    if (now >= startDate && now <= endDate) return 'ongoing';
    if (now > registrationDeadline) return 'registration_closed';
    if (event.isFull) return 'full';
    return 'open';
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { label: 'Registration Open', color: 'bg-green-100 text-green-800' },
      full: { label: 'Fully Booked', color: 'bg-red-100 text-red-800' },
      registration_closed: { label: 'Registration Closed', color: 'bg-yellow-100 text-yellow-800' },
      ongoing: { label: 'Event Ongoing', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Event Completed', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[status] || badges.open;
  };

  const canUserRegister = () => {
    if (!user || !event) return false;
    const status = getEventStatus();
    return status === 'open' && !event.isUserRegistered;
  };

  const canUserCancelRegistration = () => {
    if (!user || !event) return false;
    const status = getEventStatus();
    return event.isUserRegistered && ['open', 'full', 'registration_closed'].includes(status);
  };

  const canUserLeaveFeedback = () => {
    if (!user || !event) return false;
    const status = getEventStatus();
    return event.userRegistration && event.userRegistration.attended && status === 'completed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventStatus = getEventStatus();
  const statusBadge = getStatusBadge(eventStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600"></div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Back Button */}
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-white hover:text-orange-200 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Events
                </Link>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {event.title}
                </h1>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {event.location.type === 'virtual' ? 'Virtual Event' :
                       event.location.type === 'hybrid' ? 'Hybrid Event' :
                       event.location.address || 'In-Person Event'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Prerequisites */}
                {event.prerequisites && event.prerequisites.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Prerequisites</h3>
                    <ul className="space-y-2">
                      {event.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materials */}
                {event.materials && event.materials.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Event Materials</h3>
                    <div className="space-y-3">
                      {event.materials.map((material, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Download className="w-5 h-5 text-orange-500" />
                          <span className="flex-1 text-gray-700">{material.name}</span>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizer */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Organizer</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {event.organizer.firstName?.[0]}{event.organizer.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {event.organizer.firstName} {event.organizer.lastName}
                      </p>
                      <p className="text-gray-600">{event.organizer.email}</p>
                    </div>
                  </div>
                </div>

                {/* Feedback Section for Completed Events */}
                {eventStatus === 'completed' && event.analytics.averageRating > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Event Feedback</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.round(event.analytics.averageRating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold">
                        {event.analytics.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-600">
                        ({event.attendees.filter(a => a.feedback).length} reviews)
                      </span>
                    </div>

                    {canUserLeaveFeedback() && !event.userRegistration.feedback && (
                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Leave Feedback
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center mb-6">
                  {event.pricing.isFree ? (
                    <div className="text-3xl font-bold text-green-600 mb-2">FREE</div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${event.pricing.price}
                      <span className="text-base text-gray-600"> {event.pricing.currency}</span>
                    </div>
                  )}
                </div>

                {/* Registration Status */}
                {event.isUserRegistered && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">You're registered for this event!</span>
                    </div>
                  </div>
                )}

                {event.isUserOnWaitlist && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">You're on the waitlist</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {canUserRegister() && (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {registering ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {registering ? 'Registering...' : 'Register for Event'}
                    </button>
                  )}

                  {canUserCancelRegistration() && (
                    <button
                      onClick={handleCancelRegistration}
                      disabled={registering}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {registering ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                      {registering ? 'Cancelling...' : 'Cancel Registration'}
                    </button>
                  )}

                  {!user && (
                    <Link
                      to="/login"
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Login to Register
                    </Link>
                  )}
                </div>

                {/* Event Stats */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-semibold">{event.capacity} people</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Registered</span>
                    <span className="font-semibold">{event.attendees.length} people</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Available</span>
                    <span className="font-semibold text-green-600">{event.availableSpots} spots</span>
                  </div>
                  {event.cpdPoints > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">CPD Points</span>
                      <span className="font-semibold text-blue-600">{event.cpdPoints} points</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Date & Time</p>
                      <p className="text-gray-600">{formatDate(event.startDate)}</p>
                      <p className="text-gray-600">{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600 capitalize">{event.location.type} Event</p>
                      {event.location.address && (
                        <p className="text-gray-600">{event.location.address}</p>
                      )}
                      {event.location.instructions && (
                        <p className="text-sm text-gray-500 mt-1">{event.location.instructions}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Category</p>
                      <p className="text-gray-600 capitalize">{event.category.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Leave Feedback</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedback.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;