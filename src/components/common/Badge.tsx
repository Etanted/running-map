import type { RegistrationStatus } from '@/types';
import { statusLabel } from '@/lib/gpxParser';

interface BadgeProps {
  status: RegistrationStatus;
  className?: string;
}

const statusStyles: Record<RegistrationStatus, string> = {
  open: 'bg-green-100 text-green-700 border-green-200',
  upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  closed: 'bg-red-100 text-red-600 border-red-200',
  unknown: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function StatusBadge({ status, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]} ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}

interface CourseChipProps {
  label: string;
  active?: boolean;
}

export function CourseChip({ label, active = false }: CourseChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? 'bg-[#FF5A5F] text-white'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </span>
  );
}
