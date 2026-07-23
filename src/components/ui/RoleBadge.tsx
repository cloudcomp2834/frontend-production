import { getRoleBadgeClasses } from '../../utils/statusStyles';

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => (
  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClasses(role)}`}>
    {role}
  </span>
);
