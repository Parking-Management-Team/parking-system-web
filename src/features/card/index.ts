/**
 * Card Feature - Public API (Cổng xuất công khai)
 *
 * Quản lý tất cả các loại thẻ giữ xe trong hệ thống (Thẻ tháng & Thẻ vãng lai).
 * Bao gồm các tác vụ: Đăng ký thẻ tháng, Gia hạn thẻ, Kích hoạt/Khóa thẻ vật lý (RFID).
 *
 * Trạng thái: Placeholder (chưa có component)
 */

// Components
export { default as CardManager } from './components/CardManager';
export { default as ManagerCardWorkspace } from './components/ManagerCardWorkspace';

export { useCardManagement } from './hooks/useCardManagement';
export type {
  AssignMonthlySubscriptionInput,
  AssignSessionInput,
  CardOperationResult,
  CardStatus,
  CardType,
  CreateCardInput,
  ParkingCard,
} from './types/card';

