'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Badge, BadgeVariant } from '@/components/ui';
import { SlotStatus } from '@/constants/parking.constants';

interface SlotBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: SlotStatus;
  dot?: boolean;
}

export function SlotBadge({ status, dot = true, className, ...props }: SlotBadgeProps) {
  const t = useTranslations('status');

  const variantMap: Record<SlotStatus, BadgeVariant> = {
    AVAILABLE: 'available',
    OCCUPIED:  'occupied',
    RESERVED:  'reserved',
    INACTIVE:  'inactive',
  };

  return (
    <Badge
      variant={variantMap[status] || 'default'}
      dot={dot}
      className={className}
      {...props}
    >
      {t(status)}
    </Badge>
  );
}
