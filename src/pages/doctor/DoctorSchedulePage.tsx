import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { scheduleService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { TimePicker } from '../../components/ui/TimePicker';
import { DatePicker } from '../../components/ui/DatePicker';
import type { DoctorScheduleDto, CreateDoctorScheduleRequest } from '../../types';

const todayIso = () => new Date().toISOString().split('T')[0];

export const DoctorSchedulePage = () => {
  const { doctorId } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateDoctorScheduleRequest>({
    date: '',
    startTime: '',
    endTime: '',
  });

  const loadSchedules = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      const data = await scheduleService.getSchedules(doctorId);
      setSchedules(data.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load schedules');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;

    setError('');

    if (!formData.date) {
      setError('Please select a date');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError('Please select both start and end time');
      return;
    }

    try {
      // Append :00 seconds to match backend TimeOnly format (HH:mm:ss)
      const scheduleData: CreateDoctorScheduleRequest = {
        date: formData.date,
        startTime: formData.startTime + ':00',
        endTime: formData.endTime + ':00',
      };
      await scheduleService.createSchedule(doctorId, scheduleData);
      setFormData({ date: '', startTime: '', endTime: '' });
      setShowAddForm(false);
      await loadSchedules();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to create schedule');
      if (message) setError(message);
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
      await scheduleService.deleteSchedule(doctorId, scheduleId);
      await loadSchedules();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to delete schedule');
      if (message) toast.error(message);
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-600 mt-2">Manage your availability schedule</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Time Slot'}
        </button>
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
              <DatePicker
                id="date"
                label="Date"
                value={formData.date}
                onChange={(v) => setFormData({ ...formData, date: v })}
                minDate={todayIso()}
              />
              <TimePicker
                id="startTime"
                label="Start Time"
                value={formData.startTime}
                onChange={(v) => setFormData({ ...formData, startTime: v })}
              />
              <TimePicker
                id="endTime"
                label="End Time"
                value={formData.endTime}
                onChange={(v) => setFormData({ ...formData, endTime: v })}
              />
            </div>
            <button type="submit" className="btn-primary">Create Schedule</button>
          </form>
        </div>
      )}

      <div className="card">
        {schedules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No schedules found. Add your first time slot to get started.
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
