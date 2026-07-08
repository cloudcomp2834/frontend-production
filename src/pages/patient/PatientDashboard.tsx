import { Link } from 'react-router-dom';

export const PatientDashboard = () => {
  const menuItems = [
    {
      title: 'View Doctors',
      description: 'Browse our specialist doctors',
      link: '/patient/doctors',
      icon: '👨‍⚕️',
      color: 'bg-pantai-600',
    },
    {
      title: 'Book Appointment',
      description: 'Schedule a new appointment with a doctor',
      link: '/patient/book',
      icon: '➕',
      color: 'bg-primary',
    },
    {
      title: 'My Appointments',
      description: 'View your scheduled and past appointments',
      link: '/patient/appointments',
      icon: '📋',
      color: 'bg-green-500',
    },
    {
      title: 'My Profile',
      description: 'View your personal information',
      link: '/patient/profile',
      icon: '👤',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Pantai Hospital Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.link}
            to={item.link}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl text-white`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Info */}
      <div className="mt-8 card bg-pantai-50 border border-pantai-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Book appointments with our specialist doctors</li>
          <li>• Upload payment receipts to confirm your bookings</li>
          <li>• Download invoices for your records</li>
          <li>• Contact hospital at +60123456789 for assistance</li>
        </ul>
      </div>
    </div>
  );
};
