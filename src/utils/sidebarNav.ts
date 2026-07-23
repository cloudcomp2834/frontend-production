import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Users,
  Clock,
  CalendarCheck,
  CalendarPlus,
  UserCircle,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Appointments', to: '/admin/appointments', icon: CalendarDays },
  { label: 'Doctors', to: '/admin/doctors', icon: Stethoscope },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Payment Reports', to: '/admin/payment-reports', icon: CreditCard },
];

export const DOCTOR_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/doctor', icon: LayoutDashboard, end: true },
  { label: 'My Timetable', to: '/doctor/schedule', icon: Clock },
  { label: 'My Appointments', to: '/doctor/appointments', icon: CalendarCheck },
  { label: 'My Profile', to: '/doctor/profile', icon: UserCircle },
];

export const PATIENT_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/patient', icon: LayoutDashboard, end: true },
  { label: 'View Doctors', to: '/patient/doctors', icon: Stethoscope },
  { label: 'Book Appointment', to: '/patient/book', icon: CalendarPlus },
  { label: 'My Appointments', to: '/patient/appointments', icon: CalendarDays },
  { label: 'My Profile', to: '/patient/profile', icon: UserCircle },
];
