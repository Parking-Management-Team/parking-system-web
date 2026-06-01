# 🚗 NexPark Component & Design System Integration Guide

Chào mừng bạn đến với tài liệu hướng dẫn chi tiết về cấu trúc UI Component, luồng hoạt động và quy chuẩn tích hợp của dự án **NexPark (Smart Parking Hub)**. 

Dự án sử dụng framework **Next.js (App Router)** kết hợp với **TypeScript**, **Tailwind CSS**, thư viện chuyển động **Framer Motion**, cùng ngôn ngữ thiết kế **Stitch Design System** (tối giản, sắc nét và hiện đại).

---

## 🎨 1. Quy Chuẩn Thiết Kế & Hệ Thống Tokens (Stitch Design System)

Chúng tôi tuân thủ nghiêm ngặt hệ thống thiết kế Stitch để đảm bảo tính đồng bộ cao cấp và chuyên nghiệp cho toàn bộ giao diện:

*   **Bảng màu (Color Palette):**
    *   **Màu chủ đạo (Primary Accent):** **Emerald Green** (`#10B981` / `#059669`) làm màu thương hiệu, màu nút bấm tích cực, màu trạng thái "Còn chỗ" (Available).
    *   **Màu nền canvas:** Tông màu tối Slate hoặc trắng sạch (`bg-white` phối hợp nền phụ xám rất nhẹ `bg-[#f9f9ff]`).
    *   **Banned Colors (CẤM):** Tuyệt đối không sử dụng các màu tím (*purple*), tím violet (*violet*), chàm (*indigo*), hoặc hiệu ứng phát sáng neon kiểu Cyberpunk.
*   **Typography (Phông chữ):**
    *   **Plus Jakarta Sans** (`font-heading`): Font chữ không chân cao cấp, sử dụng cho tiêu đề chính, heading và tên thương hiệu.
    *   **Inter** (`font-sans`): Sử dụng cho văn bản thường, nhãn, ô nhập liệu để tối ưu khả năng đọc.
    *   **JetBrains Mono** / **Font Monospace**: Sử dụng bắt buộc cho các dãy số thẻ, biển số xe, thời gian, và hiển thị tiền tệ VNĐ để đảm bảo các con số luôn thẳng hàng hoàn hảo (tabular numbers).
*   **Góc bo hình học (Border Radius System):**
    *   `rounded-xl` (`12px`) hoặc `rounded-[10px]`: Sử dụng cho nút bấm, ô nhập liệu và các thành phần nhỏ.
    *   `rounded-2xl` (`16px`) hoặc `rounded-3xl` (`24px`): Sử dụng cho khung bao bên ngoài (Cards), bento grids và các popups/drawers.

---

## 🧱 2. Thư Viện UI Nguyên Tử Dùng Chung (`src/components/ui/`)

Tất cả các component tại đây đều là các component thiết kế thuần khiết (pure UI/stateless), có khả năng tái sử dụng cao và được export tập trung tại file `src/components/ui/index.ts`.

### 2.1. Button (`src/components/ui/Button.tsx`)
Nút bấm đa năng hỗ trợ hiệu ứng chuyển động bấm chuột co giãn (`active:scale-[0.98]`) chuẩn Stitch UI.

*   **Props:**
    *   `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger'`
    *   `size?: 'sm' | 'md' | 'lg'`
    *   `className?: string`
    *   *Kế thừa toàn bộ HTMLButtonAttributes*
*   **Mã nguồn / Cách sử dụng:**
    ```tsx
    import { Button } from '@/components/ui';

    // Nút Primary màu Emerald Green
    <Button variant="primary" size="md" onClick={handleAction}>
      Xác Nhận Check-in
    </Button>

    // Nút Outline viền mờ cao cấp
    <Button variant="outline" size="lg">
      Tìm Hiểu Thêm
    </Button>
    ```

### 2.2. Badge (`src/components/ui/Badge.tsx`)
Nhãn trạng thái dạng viên thuốc (pill badge) tích hợp sẵn hiệu ứng nhấp nháy (pulse) dành riêng cho các lượt đỗ xe trực tuyến.

*   **Props:**
    *   `variant?: 'available' | 'occupied' | 'reserved' | 'inactive' | 'default'`
    *   `dot?: boolean`
    *   `className?: string`
*   **Mã nguồn / Cách sử dụng:**
    ```tsx
    import { Badge } from '@/components/ui';

    // Hiển thị trạng thái còn chỗ kèm chấm nhấp nháy xanh
    <Badge variant="available" dot={true}>
      Còn Trống
    </Badge>

    // Hiển thị trạng thái đã có xe đỗ
    <Badge variant="occupied" dot={true}>
      Đã Lấp Đầy
    </Badge>
    ```

### 2.3. Card (`src/components/ui/Card.tsx`)
Khung bao hiển thị cấu trúc nội dung, hỗ trợ bo góc Stitch chuẩn và hiệu ứng bay nhẹ khi hover chuột.

*   **Components đi kèm:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`
*   **Props (`CardProps`):**
    *   `hover?: boolean` (Có bật hiệu ứng hover bay lên kèm bóng đổ mờ hay không)
    *   `noPad?: boolean` (Loại bỏ padding mặc định `p-6`)
*   **Cách sử dụng:**
    ```tsx
    import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';

    <Card hover={true}>
      <CardHeader>
        <CardTitle>Bãi Xe Tòa Nhà A</CardTitle>
        <CardDescription>Trực thuộc khu vực Trung tâm Phía Tây</CardDescription>
      </CardHeader>
      <div className="text-gray-600">Nội dung thẻ hiển thị ở đây...</div>
    </Card>
    ```

### 2.4. PriceTag (`src/components/ui/PriceTag.tsx`)
Component chuyên dụng dùng để hiển thị giá tiền tệ VNĐ. Sử dụng font chữ Monospace, hiển thị chuẩn `tabular-nums` và tự động làm tròn/định dạng chuyên nghiệp.

*   **Props:**
    *   `amount: number` (Số tiền VNĐ)
    *   `compact?: boolean` (Chuyển đổi viết tắt, ví dụ: 200,000₫ thành 200K₫)
    *   `size?: 'sm' | 'md' | 'lg'`
    *   `accent?: boolean` (Bật màu nhấn thương hiệu Emerald Green)
*   **Cách sử dụng:**
    ```tsx
    import { PriceTag } from '@/components/ui';

    // Hiển thị tiền dạng lớn nổi bật màu xanh lá
    <PriceTag amount={1500000} size="lg" accent={true} />
    // Kết quả render: 1.500.000 ₫ (hoặc 1.5M ₫ nếu compact)
    ```

### 2.5. Input, Textarea, Select (`src/components/ui/...`)
Bộ ba thành phần form nhập liệu tiêu chuẩn được tinh chỉnh đồng bộ giao diện Stitch. Các ô nhập liệu có viền xám mỏng mờ, khi focus sẽ đổi sang viền Emerald Green rất tinh tế, loại bỏ hoàn toàn cảm giác thô cứng.

*   **Cách sử dụng:**
    ```tsx
    import { Input, Select } from '@/components/ui';

    // Text Input cho Biển số xe
    <Input 
      label="Biển số xe" 
      placeholder="Ví dụ: 30A-12345" 
      required 
    />

    // Select Option dạng sang trọng
    <Select
      label="Loại phương tiện"
      options={[
        { value: 'CAR', label: 'Ô tô / Car' },
        { value: 'MOTORBIKE', label: 'Xe máy / Motorcycle' }
      ]}
      onChange={(val) => console.log(val)}
    />
    ```

### 2.6. Hiệu Ứng Trực Quan (`CountUp.tsx`, `TypewriterText.tsx`, `WavyNavLink.tsx`)
*   `CountUp`: Tự động kích hoạt hiệu ứng chạy số tăng dần (Animation) ngay khi phần tử cuộn màn hình đến điểm nhìn thấy (Intersection Observer).
*   `TypewriterText`: Hiệu ứng đánh chữ động trên trang chủ để thu hút sự chú ý của người dùng.
*   `WavyNavLink`: Nút điều hướng thông minh hỗ trợ hiệu ứng sóng lượn khi di chuột qua.

---

## 🏢 3. Thành Phần Tính Năng Theo Module (`src/features/`)

Chúng tôi phân rã toàn bộ logic nghiệp vụ của NexPark vào thư mục `src/features/` theo chuẩn **Feature-Based Architecture**. Mỗi thư mục tính năng là một "hộp kín" tự đóng gói hoàn hảo:

```plaintext
src/features/[feature-name]/
├── components/          # UI Components nội bộ chỉ tính năng này cần
├── hooks/               # Các custom React Hooks quản lý state & API
├── index.ts             # Public API: Cổng xuất (export) duy nhất
```

### 3.1. Module Đăng Nhập & Xác Thực (`src/features/auth/`)
Chịu trách nhiệm quản lý phiên đăng nhập và các form nhập thông tin người dùng.

*   **`LoginForm.tsx` & `RegisterForm.tsx`:** Form đăng nhập/đăng ký hỗ trợ lưu trữ trạng thái người dùng cục bộ thông qua `localStorage` và phát ra thông báo Toast tùy chỉnh không cần phụ thuộc thư viện ngoài.
*   **`AuthDrawer.tsx`:** Thanh Panel Side Drawer trượt ra từ bên phải màn hình vô cùng hiện đại. 
    > [!IMPORTANT]
    > Để đảm bảo an toàn trải nghiệm người dùng, `AuthDrawer` đã được thiết kế **vô hiệu hóa tính năng bấm ra ngoài màn hình để đóng (click-to-close overlay)**. Người dùng bắt buộc phải bấm nút đóng thủ công hoặc nút Hủy để tránh việc vô tình làm mất dữ liệu đã nhập trong form.

### 3.2. Module Trang Chủ (`src/features/landing/`)
Chứa toàn bộ các khối nội dung cấu thành trang giới thiệu NexPark:
*   **`Hero.tsx`:** Giao diện Cinematic tích hợp video nền chạy ngầm (`/assets/videos/parking-landingpage.mp4`) kèm các hiệu ứng chồng lớp mịn màng.
*   **`Features.tsx`:** Thiết kế Bento Grid bất đối xứng đột phá, biểu diễn 4 tính năng lõi với màu sắc tối giản sang trọng.
*   **`Pricing.tsx`:** Tích hợp bộ chuyển đổi (Tab Switcher) trực quan giữa các khung giờ Ngày (☀️) và Đêm (🌙) để cập nhật bảng phí động của xe máy và ô tô theo thời gian thực.
*   **`HowItWorks.tsx` & `About.tsx` & `Contact.tsx`:** Các khối giới thiệu 3 bước sử dụng, thông tin dự án, và form liên hệ tối giản.

---

## ⚙️ 4. Quy Tắc Gọi Component & Feature (Public API Gate)

Để giữ codebase luôn sạch sẽ và tránh phụ thuộc chồng chéo (circular dependencies), mọi nhà phát triển bắt buộc phải tuân thủ nguyên tắc **Public API**:

```
❌ SAI (Import trực tiếp từ sâu bên trong thư mục con):
import { LoginForm } from '@/features/auth/components/LoginForm';

✅ ĐÚNG (Import thông qua file index.ts của thư mục gốc Feature):
import { LoginForm } from '@/features/auth';
```

---

## 🧮 5. Bộ Tiện Ích Tính Phí Nghiệp Vụ (`src/lib/utils/pricing.ts`)

Bảng giá và các phụ phí cấu hình hoàn toàn động tại `src/constants/parking.constants.ts`. Mọi hoạt động tính toán phí gửi xe đều tập trung tại file tiện ích `pricing.ts` để đảm bảo tính nhất quán tuyệt đối giữa nhân viên soát vé (Staff) và tài xế (Driver):

*   **Chính sách cơ sở (Base Rate):**
    *   **Xe máy (Motorcycle):** 4 giờ đầu mặc định `5.000₫`.
    *   **Ô tô (Car):** 4 giờ đầu mặc định `30.000₫`.
*   **Phí phát sinh theo giờ (Block Pricing):**
    *   *Ban ngày (06:00 - 18:00):* Xe máy: `+1.000₫/giờ` (Cap tối đa: `10.000₫`). Ô tô: `+10.000₫/giờ` (Cap tối đa: `100.000₫`).
    *   *Ban đêm (18:00 - 06:00):* Xe máy: `+2.000₫/giờ` (Cap tối đa: `20.000₫`). Ô tô: `+12.000₫/giờ` (Cap tối đa: `120.000₫`).
*   **Quy tắc làm tròn tiền mặt (Cash Rounding):**
    *   Hệ thống tự động sử dụng hàm `roundCashVND` để làm tròn số tiền mặt thu thực tế về bội số gần nhất của các tờ tiền vật lý phổ thông là `1.000₫` (Ví dụ: 12.400₫ làm tròn thành 12.000₫, 12.500₫ làm tròn thành 13.000₫). Thanh toán online qua cổng ngân hàng sẽ giữ nguyên giá trị tiền lẻ chính xác.

*   **Ví dụ gọi hàm tính toán trong code:**
    ```typescript
    import { calculateParkingFee } from '@/lib/utils/pricing';

    const result = calculateParkingFee(
      '2026-06-01T08:00:00', // Giờ xe vào (8h sáng - Ngày)
      '2026-06-01T15:30:00', // Giờ xe ra (15h30 chiều - 7.5 tiếng)
      'CAR',                 // Loại xe
      { isBooking: true }    // Có trừ cọc đặt chỗ trước (5.000₫)
    );

    console.log(result.totalAmount); 
    // Trả về số tiền thực tế đã tính toán, khấu trừ cọc và làm tròn chuẩn VNĐ.
    ```

---

## 🚀 6. Hướng Dẫn Mở Rộng & Viết Mã Nguồn Mới

Khi bạn nhận nhiệm vụ thiết kế thêm một màn hình hoặc module mới cho NexPark, quy trình chuẩn bao gồm:

1.  **Phát triển UI tĩnh (Pure UI):** Nếu là thành phần dùng chung toàn cục, hãy tạo nó tại `src/components/ui/` hoặc `src/components/layout/`.
2.  **Đóng gói module:** Nếu là tính năng nghiệp vụ cụ thể, tạo thư mục con mới tại `src/features/[feature_name]/components/`.
3.  **Mở cổng xuất:** Đăng ký các component chính cần dùng ra ngoài thông qua `src/features/[feature_name]/index.ts`.
4.  **Tích hợp:** Nhúng các component này vào luồng route chính (`src/app/`) và cấu hình Framer Motion để mang lại trải nghiệm mượt mà, cao cấp nhất.
