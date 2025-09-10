import 'react-big-calendar/lib/css/react-big-calendar.css';
import './VendorCalendar.css';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  Save,
  User,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { api } from '../../services/api';
import moment from 'moment';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Import calendar CSS



const localizer = momentLocalizer(moment);

const VendorCalendar = ({ vendor, onUpdate }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state for adding/editing availability slots
  const [slotForm, setSlotForm] = useState({
    title: '',
    start: '',
    end: '',
    isAvailable: true,
    recurring: false,
    recurringDays: []
  });

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load jobs and availability in parallel
      const [jobsResponse] = await Promise.all([
        api.vendor.getJobs('ASSIGNED,IN_DISCUSSION,QUOTE_SENT,QUOTE_ACCEPTED,PAID,IN_PROGRESS')
        // api.vendor.getAvailability() // Assuming this endpoint exists - will add later
      ]);

      const jobsData = jobsResponse.jobs || [];
      const availabilityData = vendor.availabilitySchedule || [];
      
      // Convert jobs and availability to calendar events
      const calendarEvents = [...generateJobEvents(jobsData), ...generateAvailabilityEvents(availabilityData)];
      setEvents(calendarEvents);

    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar data');
      
      // Fallback to existing data
      const availabilityData = vendor.availabilitySchedule || [];
      setEvents(generateAvailabilityEvents(availabilityData));
    } finally {
      setLoading(false);
    }
  }, [vendor.availabilitySchedule]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const generateJobEvents = (jobsData) => {
    return jobsData.map(job => {
      let eventColor, status;
      
      switch (job.status) {
        case 'ASSIGNED':
          eventColor = '#f59e0b'; // amber
          status = 'Pending Acceptance';
          break;
        case 'IN_DISCUSSION':
        case 'QUOTE_SENT':
          eventColor = '#3b82f6'; // blue
          status = 'In Discussion';
          break;
        case 'QUOTE_ACCEPTED':
        case 'PAID':
          eventColor = '#10b981'; // green
          status = 'Ready to Start';
          break;
        case 'IN_PROGRESS':
          eventColor = '#8b5cf6'; // purple
          status = 'In Progress';
          break;
        default:
          eventColor = '#6b7280'; // gray
          status = 'Unknown';
      }

      // Use preferred time slot or create a default slot
      const jobDate = job.preferredTimeSlots?.[0]?.date 
        ? new Date(job.preferredTimeSlots[0].date) 
        : new Date();
      
      const startTime = job.preferredTimeSlots?.[0]?.startTime || '09:00';
      const endTime = job.preferredTimeSlots?.[0]?.endTime || '17:00';
      
      const [startHour, startMinute] = startTime.split(':');
      const [endHour, endMinute] = endTime.split(':');
      
      const start = new Date(jobDate);
      start.setHours(parseInt(startHour), parseInt(startMinute), 0);
      
      const end = new Date(jobDate);
      end.setHours(parseInt(endHour), parseInt(endMinute), 0);

      return {
        id: job._id,
        title: `${job.category} - ${job.customerId?.firstName} ${job.customerId?.lastName}`,
        start,
        end,
        resource: {
          type: 'job',
          status: job.status,
          job: job,
          color: eventColor,
          statusText: status
        }
      };
    });
  };

  const generateAvailabilityEvents = (availabilityData) => {
    const events = [];
    const today = new Date();
    const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // Next 30 days

    availabilityData.forEach(slot => {
      let currentDate = new Date(today);
      
      while (currentDate <= endDate) {
        if (currentDate.getDay() === slot.dayOfWeek) {
          const [startHour, startMinute] = slot.startTime.split(':');
          const [endHour, endMinute] = slot.endTime.split(':');
          
          const start = new Date(currentDate);
          start.setHours(parseInt(startHour), parseInt(startMinute), 0);
          
          const end = new Date(currentDate);
          end.setHours(parseInt(endHour), parseInt(endMinute), 0);

          events.push({
            id: `availability-${slot._id || slot.id}-${currentDate.toISOString().split('T')[0]}`,
            title: slot.isAvailable ? 'Available' : 'Unavailable',
            start,
            end,
            resource: {
              type: 'availability',
              available: slot.isAvailable,
              slot: slot,
              color: slot.isAvailable ? '#dcfce7' : '#fee2e2', // light green or light red
              textColor: slot.isAvailable ? '#166534' : '#dc2626'
            }
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return events;
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSelectSlot = ({ start, end }) => {
    setSlotForm({
      title: 'Available Time',
      start: moment(start).format('YYYY-MM-DDTHH:mm'),
      end: moment(end).format('YYYY-MM-DDTHH:mm'),
      isAvailable: true,
      recurring: false,
      recurringDays: []
    });
    setShowAddSlotModal(true);
  };

  const handleSaveAvailabilitySlot = async () => {
    try {
      const startDate = new Date(slotForm.start);
      const endDate = new Date(slotForm.end);
      
      const newSlot = {
        dayOfWeek: startDate.getDay(),
        startTime: moment(startDate).format('HH:mm'),
        endTime: moment(endDate).format('HH:mm'),
        isAvailable: slotForm.isAvailable,
        title: slotForm.title
      };

      // For now, we'll just update the local state
      // TODO: Save to backend via api.vendor.addAvailabilitySlot(newSlot);
      console.log('Saving availability slot:', newSlot);
      
      toast.success('Availability slot added successfully!');
      setShowAddSlotModal(false);
      loadCalendarData();
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving availability slot:', error);
      toast.error('Failed to save availability slot');
    }
  };

  const eventStyleGetter = (event) => {
    const { resource } = event;
    return {
      style: {
        backgroundColor: resource.color,
        color: resource.textColor || '#ffffff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const EventComponent = ({ event }) => {
    const { resource } = event;
    
    return (
      <div className="flex items-center text-xs">
        {resource.type === 'job' ? (
          <>
            <User className="w-3 h-3 mr-1" />
            <span className="truncate">{event.title}</span>
          </>
        ) : (
          <>
            <Clock className="w-3 h-3 mr-1" />
            <span className="truncate">{event.title}</span>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Availability Calendar
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your schedule, view jobs, and set availability
          </p>
        </div>
        <button
          onClick={() => setShowAddSlotModal(true)}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Availability
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Pending Jobs</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Active Jobs</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Ready to Start</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
          <span className="text-sm text-gray-700">In Progress</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Unavailable</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="h-96">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent
          }}
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
          max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEvent.resource.type === 'job' ? 'Job Details' : 'Availability Slot'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-600">
                  {moment(selectedEvent.start).format('MMMM D, YYYY')}
                </p>
                <p className="text-sm text-gray-600">
                  {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                </p>
              </div>

              {selectedEvent.resource.type === 'job' && (
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        {selectedEvent.resource.job.customerId?.firstName} {selectedEvent.resource.job.customerId?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">{selectedEvent.resource.job.location?.address}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">{selectedEvent.resource.statusText}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedEvent.resource.type === 'job' && (
                <button
                  onClick={() => {
                    // Navigate to job details or messaging
                    setShowEventModal(false);
                    // Add navigation logic here
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  View Job
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Availability Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Availability Slot</h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={slotForm.title}
                  onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Available Time"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={slotForm.start}
                    onChange={(e) => setSlotForm({ ...slotForm, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={slotForm.end}
                    onChange={(e) => setSlotForm({ ...slotForm, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={slotForm.isAvailable}
                  onChange={(e) => setSlotForm({ ...slotForm, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Available for bookings
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvailabilitySlot}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Slot
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VendorCalendar;
