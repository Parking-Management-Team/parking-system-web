/**
 * Payment Types - Kiểu dữ liệu thanh toán
 *
 * PaymentTransaction: Giao dịch thanh toán
 *
 * Phương thức: CASH (tiền mặt), QR_CODE (mã QR), EWALLET (ví điện tử)
 * Trạng thái: SUCCESS, FAILED, PENDING
 */

import { PaymentMethod } from '@/constants/parking.constants';

/** Giao dịch thanh toán */
export interface PaymentTransaction {
  id: string;
  sessionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionCode?: string | null;
  paidAt: string; // ISO date string
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}
