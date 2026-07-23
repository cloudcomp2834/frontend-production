import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from './ui/SidebarProvider';
import { ADMIN_NAV, DOCTOR_NAV, PATIENT_NAV, type NavItem } from '../utils/sidebarNav';
import icon from '../assets/icon.png';

const NAV_BY_ROLE: Record<'Admin' | 'Doctor' | 'Patient', NavItem[]> = {
  Admin: ADMIN_NAV,
  Doctor: DOCTOR_NAV,
  Patient: PATIENT_NAV,
};

const SidebarContent = ({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) => (
  <>
    <div className="flex items-center space-x-2 px-5 h-16 border-b border-gray-200 shrink-0">
      <img src={icon} alt="Pantai Hospital" className="w-8 h-8" />
      <span className="text-lg font-bold text-gray-900">Pantai Hospital</span>
    </div>
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-pantai-50 text-primary'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  </>
);

export const Sidebar = () => {
  const { role, isAuthenticated } = useAuth();
  const { isOpen, close } = useSidebar();

  if (!isAuthenticated || !role) return null;

  const items = NAV_BY_ROLE[role];

  return (
    <>
      {/* Desktop: fixed, always visible */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 bg-white border-r border-gray-200 z-30">
        <SidebarContent items={items} />
      </aside>

      {/* Mobile: off-canvas drawer + backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-gray-900/40 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent items={items} onNavigate={close} />
      </aside>
    </>
  );
};
