import { PaymentMethod } from '@/constants/parking.constants';

export interface PaymentTransaction {
  id: string;
  sessionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionCode?: string | null;
  paidAt: string; // ISO date string
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}
