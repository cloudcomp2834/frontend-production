import { Link } from 'react-router-dom';

export const DoctorDashboard = () => {
  const menuItems = [
    {
      title: 'My Timetable',
      description: 'Manage your availability and schedule',
      link: '/doctor/schedule',
      icon: '📅',
      color: 'bg-blue-500',
    },
    {
      title: 'My Appointments',
      description: 'View and manage your appointments',
      link: '/doctor/appointments',
      icon: '🗓️',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your schedule and appointments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.link}
            to={item.link}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
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
    </div>
  );
};
