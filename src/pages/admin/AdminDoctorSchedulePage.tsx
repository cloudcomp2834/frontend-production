import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { scheduleService, doctorService } from '../../services';
import { ApiError } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import type { DoctorScheduleDto, CreateDoctorScheduleRequest, DoctorDto } from '../../types';

export const AdminDoctorSchedulePage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const toast = useToast();
  const confirm = useConfirm();
  const [doctor, setDoctor] = useState<DoctorDto | null>(null);
  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateDoctorScheduleRequest>({
    date: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (doctorId) {
      loadDoctorAndSchedules();
    }
  }, [doctorId]);

  const loadDoctorAndSchedules = async () => {
    if (!doctorId) return;
    
    try {
      const [doctorData, schedulesData] = await Promise.all([
        doctorService.getById(parseInt(doctorId)),
        scheduleService.getSchedules(parseInt(doctorId)),
      ]);
      
      setDoctor(doctorData);
      setSchedules(schedulesData.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;

    setError('');
    try {
      // Append :00 seconds to match backend TimeOnly format (HH:mm:ss)
      const scheduleData: CreateDoctorScheduleRequest = {
        date: formData.date,
        startTime: formData.startTime + ':00',
        endTime: formData.endTime + ':00',
      };
      await scheduleService.createSchedule(parseInt(doctorId), scheduleData);
      setFormData({ date: '', startTime: '', endTime: '' });
      setShowAddForm(false);
      await loadDoctorAndSchedules();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to create schedule');
      }
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!doctorId) return;
    if (!(await confirm({
      title: 'Delete Schedule Slot',
      message: 'Are you sure you want to delete this schedule slot?',
      danger: true,
    }))) return;

    try {
      await scheduleService.deleteSchedule(parseInt(doctorId), scheduleId);
      await loadDoctorAndSchedules();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.data?.error || 'Failed to delete schedule');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Doctor Schedule
            </h1>
            {doctor && (
              <p className="text-gray-600 mt-2">
                {doctor.name} - {doctor.specialismName} at {doctor.hospitalName}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : '+ Add Time Slot'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Time Slot</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date" className="label">Date</label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label htmlFor="startTime" className="label">Start Time</label>
                <input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime" className="label">End Time</label>
                <input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">Add Schedule</button>
          </form>
        </div>
      )}

      <div className="card">
        {schedules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No schedules found. Add the first time slot for this doctor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.scheduleId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.startTime.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.endTime.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(schedule.scheduleId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
