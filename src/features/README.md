# Hướng Dẫn Phát Triển Tính Năng Theo Module (Feature-Based Architecture)

Chào mừng các bạn tham gia phát triển dự án **NexPark**. Để đảm bảo codebase luôn sạch sẽ, dễ bảo trì và hạn chế tối đa xung đột (git conflicts) khi nhiều người cùng tham gia làm giao diện (UI) và tính năng mới, dự án áp dụng mô hình **Feature-Based Architecture**.

---

## 📂 Cấu trúc một Feature (`src/features/[feature-name]/`)

Tất cả các tính năng riêng biệt (ví dụ: Đăng nhập, Đặt chỗ, Quản lý gửi xe, v.v.) sẽ được đặt trong thư mục `src/features/`. Mỗi module tính năng sẽ tự đóng gói các thành phần của nó:

```
src/features/[feature_name]/
├── components/           # Các UI components chỉ dành riêng cho tính năng này
├── hooks/                # Custom React hooks riêng của tính năng này (ví dụ: useAuth, useBooking)
├── services/             # Hàm gọi API, xử lý data fetching (ví dụ: authService.ts)
├── types/                # Định nghĩa TypeScript Types riêng của tính năng
├── utils/                # Các hàm tiện ích bổ trợ nội bộ của tính năng
└── index.ts              # PUBLIC API: Chỉ export những gì cho phép bên ngoài sử dụng
```

---

## ⚙️ Nguyên Tắc Hoạt Động (Rất Quan Trọng)

### 1. Nguyên Tắc "Hộp Kín" (Encapsulation)
* Các file bên trong một feature chỉ nên import từ chính thư mục của nó hoặc từ các thư mục dùng chung toàn hệ thống (`@/components/ui`, `@/lib`, `@/constants`).
* **Tránh tối đa** việc import chéo trực tiếp giữa các feature với nhau (ví dụ: `auth` import trực tiếp từ sâu bên trong `booking/components/BookingCard.tsx`).

### 2. Sử Dụng `index.ts` Làm Cổng Kết Nối (Public API)
Mỗi feature bắt buộc phải có một file `index.ts` ở thư mục gốc của nó. File này đóng vai trò như một bộ lọc, chỉ export những thành phần mà các trang hoặc feature khác được phép sử dụng.
* **Cách export (Ví dụ trong `src/features/auth/index.ts`):**
  ```typescript
  export { LoginForm } from './components/LoginForm';
  export { useAuth } from './hooks/useAuth';
  ```
* **Cách sử dụng ở ngoài (Ví dụ trong `src/app/login/page.tsx`):**
  ```tsx
  // ✅ ĐÚNG: Import trực tiếp từ thư mục gốc của feature
  import { LoginForm } from '@/features/auth';

  // ❌ SAI: Import sâu vào cấu trúc thư mục nội bộ
  import LoginForm from '@/features/auth/components/LoginForm';
  ```

---

## 🛠️ Quy Trình Thêm Một Tính Năng Mới (Giao Diện Mới)

Nếu bạn được giao xây dựng một màn hình/tính năng mới (ví dụ: `ticket-history` - Lịch sử vé gửi xe):

1. **Tạo thư mục**: Tạo `src/features/ticket-history/`.
2. **Cơ cấu nội bộ**: Tạo các thư mục con tùy nhu cầu (`components`, `hooks`, `types`).
3. **Viết code**: Viết UI components (ví dụ: `TicketList.tsx`, `TicketDetail.tsx`) và hooks lấy dữ liệu.
4. **Tạo cổng kết nối**: Tạo file `src/features/ticket-history/index.ts` và export các component chính ra ngoài.
5. **Gắn vào Routing (Next.js)**: Tạo file `src/app/tickets/page.tsx` và chỉ render component đã export từ feature:
   ```tsx
   import { TicketList } from '@/features/ticket-history';

    export default function TicketsPage() {
      return <TicketList />;
    }
    ```

---

## 🗺️ Bản Đồ Các Module Tính Năng Hiện Có

Để tránh tạo thư mục lộn xộn hoặc trùng lặp, hãy đối chiếu với bản đồ dưới đây trước khi viết code:

### 1. Nhóm Tính Năng "Dùng Riêng" Theo Vai Trò (Role Dashboard Portals)
Nơi chứa trang tổng quan (Dashboard overview) và các màn hình chỉ dành riêng cho một vai trò duy nhất:
* `admin/`: Dành cho Quản trị viên hệ thống (quản lý tài khoản, thiết bị, phân quyền).
* `manager/`: Dành cho Quản lý bãi xe (biểu đồ doanh thu tổng quan, duyệt ca trực, liên kết nhanh).
* `staff/`: Dành cho Nhân viên trực bốt (báo cáo ca trực, ghi nhận sự cố, xử lý sự cố).

### 2. Nhóm Tính Năng "Dùng Chung" Nghiệp Vụ (Core Shared Features)
Nơi chứa các logic nghiệp vụ cốt lõi mà nhiều vai trò có thể cùng gọi sử dụng:
* `auth/`: Quản lý đăng nhập, đăng ký, khôi phục session, phân quyền tài khoản.
* `facilities/`: Quản lý cơ sở vật chất (cơ cấu Tòa nhà -> Tầng -> Zone).
* `vehicles/`: Theo dõi phương tiện (check-in/out, live feeds camera, danh sách xe đang đỗ).
* `parking-map/`: Sơ đồ bản đồ bãi đỗ xe trực quan (hiển thị trạng thái các slot xanh/đỏ).
* `card/`: Quản lý các loại thẻ vật lý RFID (thẻ tháng cố định, thẻ vãng lai).
* `booking/`: Đặt chỗ đỗ xe trước trực tuyến cho khách hàng.
* `landing/`: Các thành phần giao diện của trang chủ giới thiệu bên ngoài.

Chúc các bạn code vui vẻ và giữ gìn codebase NexPark thật sạch đẹp! 🚀
