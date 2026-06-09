# 🚗 NexPark - Hệ Thống Quản Lý Đỗ Xe Thông Minh (Smart Parking Hub)

NexPark là giải pháp quản lý đỗ xe thông minh, tối ưu hóa lưu lượng xe, đặt chỗ thời gian thực, quản lý thẻ tháng và tự động phân bổ luồng gửi xe cho doanh nghiệp và tài xế. 

Hệ thống được thiết kế với giao diện hiện đại, tối giản theo ngôn ngữ thiết kế **Stitch Design System** (kết hợp tông màu Slate/Emerald sang trọng, góc bo sắc nét và typography đồng bộ chuẩn Plus Jakarta Sans & Inter).

---

## 📂 Kiến Trúc Hệ Thống (Directory Structure)

Để đảm bảo codebase luôn sạch sẽ, dễ mở rộng và hỗ trợ teamwork hiệu quả, NexPark được tổ chức theo mô hình **Feature-Based Architecture (Kiến trúc theo Module Tính năng)**:

```
parking-system-web/
├── public/                     # Tài nguyên tĩnh của hệ thống
│   ├── assets/
│   │   ├── placeholders/       # Ảnh chụp thực tế/Mockups độ phân giải cao làm ảnh nền
│   │   └── videos/             # Các tài liệu đa phương tiện động bổ trợ
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router (Chỉ quản lý Định tuyến & Metadata)
│   │   ├── (auth)/             # Nhóm định tuyến Authentication (login, register)
│   │   ├── layout.tsx          # Giao diện khung hệ thống (Root Layout & Provider)
│   │   └── page.tsx            # Trang chủ hệ thống (Landing Page)
│   ├── components/
│   │   └── ui/                 # Thư viện UI nguyên tử dùng chung (Button, Input, Badge...)
│   ├── constants/              # Các biến hằng số dùng chung toàn hệ thống
│   ├── features/               # MODULE TÍNH NĂNG (Đóng gói khép kín toàn bộ logic)
│   │   ├── auth/               # Module Authentication (Đăng nhập, Đăng ký, Google Auth, Context)
│   │   ├── landing/            # Module Landing Page (Hero, Features Bento Grid, CTA...)
│   │   ├── booking/            # Module Đặt chỗ gửi xe
│   │   ├── dashboard/          # Giao diện Quản trị viên & Khách hàng
│   │   └── parking-map/        # Bản đồ vị trí đỗ xe trực quan
│   ├── lib/                    # Các cấu hình thư viện dùng chung (utils, client...)
│   └── types/                  # Các định nghĩa TypeScript dùng chung toàn bộ dự án
├── tailwind.config.ts          # Cấu hình Tokens thiết kế (Bảng màu Emerald/Slate, Fonts...)
└── tsconfig.json               # Cấu hình TypeScript nghiêm ngặt (Strict Type Safety)
```

> 💡 **Chi tiết nguyên tắc hoạt động của thư mục `src/features/`**: Xem hướng dẫn đầy đủ tại [src/features/README.md](file:///Users/vinhh/Documents/parking-system-web/src/features/README.md).

---

## 🏗️ Kiến Trúc Xử Lý Logic (Core Logic & Architecture)

Để tối ưu hóa việc phát triển song song, giảm thiểu xung đột mã nguồn (Git Conflict) và bảo vệ dữ liệu, dự án NexPark áp dụng các quy chuẩn lập trình sau:

### 1. Thư mục Tiện Ích Hệ Thống (`src/lib/`)
Thư mục `src/lib/` chứa mã nguồn phục vụ cơ sở hạ tầng hoặc các hàm bổ trợ phi nghiệp vụ mà bất cứ component/trang nào cũng có thể gọi:
* **`lib/api/`**: Chứa cỗ máy HTTP Client (`client.ts`), tự động đính kèm Token và xử lý logout khi token hết hạn.
* **`lib/utils/`**: Các hàm tính toán, định dạng dữ liệu (tiền tệ VNĐ, ngày tháng, định giá gửi xe...).
* **`lib/hooks/`**: Custom hooks bổ trợ giao diện (ví dụ: hiệu ứng cuộn trang, theo dõi kích thước cửa sổ...).

### 2. Cơ Chế Custom Hooks (Tách Biệt Logic Khỏi UI)
Dự án áp dụng triệt để việc **tách biệt logic xử lý khỏi giao diện hiển thị** thông qua Custom Hooks:
* **UI Component (File `.tsx`)**: Chỉ lo hiển thị thẻ HTML, CSS và tương tác trực quan.
* **Custom Hook (File `.ts` bắt đầu bằng `use`)**: Quản lý State, gọi API, xác thực dữ liệu và thực hiện các logic tính toán phức tạp.
* **Phân cấp Hooks**:
  * *Hooks Giao diện* (`src/lib/hooks/`): Không chứa API nghiệp vụ, phục vụ hiệu ứng/giao diện chung.
  * *Hooks Nghiệp vụ* (`src/features/[feature]/hooks/`): Trực tiếp quản lý dữ liệu đặc thù của tính năng đó (ví dụ: `useFacilities` để CRUD tòa nhà, `useAuth` để quản lý tài khoản).

### 3. Cơ Chế Gọi API (API Infrastructure & Endpoint Services)
Tuyệt đối không viết trực tiếp các hàm gọi `fetch` hay `axios` trong file giao diện `.tsx`:
* **Cỗ máy API**: Sử dụng đối tượng `api` từ `src/lib/api/client.ts` để gọi request (`api.get`, `api.post`, `api.put`, `api.delete`).
* **Endpoint Services**: Định nghĩa các API cụ thể bên trong từng module tính năng (`src/features/[feature-name]/services/` hoặc trong hooks). Cách này giúp quản lý tập trung và dễ thay đổi URL API của Backend mà không cần sửa giao diện.

### 4. Cơ Chế Phân Quyền 3 Lớp (3-Layer Authorization)
Hệ thống NexPark bảo vệ tài nguyên và phân quyền chặt chẽ theo 3 lớp độc lập:
* **Lớp 1: Route-Level Guard (Bảo vệ đường dẫn)**: Sử dụng `<ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ADMIN']}>` bọc ở file `layout.tsx` của từng dashboard để chặn đứng các truy cập trái phép cấp độ URL.
* **Lớp 2: UI-Level Guard (Ẩn/Hiện nút bấm)**: Đọc thông tin vai trò từ `useAuth()` để hiển thị hoặc ẩn các nút thao tác tương ứng (ví dụ: Staff chỉ được xem, Manager mới được thấy nút Thêm/Sửa/Xóa Tòa nhà).
* **Lớp 3: API-Level Guard (Bảo vệ backend)**: Mọi HTTP request đều đính kèm JWT Token ở header. Backend .NET sẽ kiểm tra và từ chối xử lý (trả về lỗi `403 Forbidden`) nếu vai trò của tài khoản không được phép gọi API đó.

---

## ⚡ Bắt Đầu Phát Triển Nhanh (Getting Started)

Dự án sử dụng framework **Next.js** phiên bản mới nhất kết hợp đồng thời giữa **React** và **TypeScript** cùng **Tailwind CSS**.

### 🔧 Nguyên tắc Công nghệ (React & TypeScript)

Để tránh nhầm lẫn cho các thành viên mới tham gia phát triển:
- **React (thông qua Next.js):** Là thư viện giao diện (UI Library) cốt lõi của ứng dụng. Tất cả các màn hình, component, layout và state trong dự án này đều chạy trên nền tảng React.
- **TypeScript (TS):** Là ngôn ngữ lập trình chính. Tất cả mã nguồn React phải được viết chặt chẽ bằng TypeScript (các file `.ts` và `.tsx`) để hỗ trợ kiểm tra kiểu dữ liệu tĩnh (Static Typing), giúp phát hiện lỗi sớm khi viết code và nâng cao khả năng tự động gợi ý (Autocomplete).
- **Lưu ý:** Chúng ta sử dụng cả hai công nghệ này bổ trợ cho nhau chứ không chọn một trong hai.


### 1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

### 2. Chạy ứng dụng trong môi trường phát triển (Local Development):
```bash
npm run dev
```
Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000).

### 3. Kiểm tra tính toàn vẹn của Typescript (Type Check):
Trước khi thực hiện commit mã nguồn, luôn chạy lệnh sau để kiểm tra lỗi kiểu dữ liệu:
```bash
npx tsc --noEmit
```

### 4. Biên dịch ứng dụng cho môi trường sản phẩm (Production Build):
```bash
npm run build
```

---

## 🎨 Quy Chuẩn Giao Diện (Stitch Design System Rules)

Khi phát triển thêm màn hình hoặc thành phần UI mới, vui lòng tuân thủ các quy tắc thiết kế sau:

* **Typography (Phông chữ):**
  - Tiêu đề chính, Tên thương hiệu, Heading: Sử dụng chuẩn font `Plus Jakarta Sans` (`font-heading`) cực kỳ uy tín và hiện đại.
  - Văn bản thường, nhãn, ô nhập liệu: Sử dụng font `Inter` (`font-sans`) tối ưu khả năng đọc.
* **Bảng màu (Color Palette):**
  - Màu nền sáng: Nền trắng sạch (`bg-white`) phối hợp nền phụ xám rất nhẹ (`bg-[#f9f9ff]`).
  - Màu điểm nhấn chủ đạo (Primary Accent): **Emerald Green** (Ngọc lục bảo) làm màu thương hiệu (`#059669` / `#10b981`).
  - Màu tối chủ đạo (Dark Accents): Slate Deep Blue (`#0f172a` / `#1e293b`).
* **Không lạm dụng Placeholder hoặc Icons thừa:**
  - Loại bỏ các biểu tượng trang trí không rõ mục tiêu. Chỉ sử dụng biểu tượng khi cần hỗ trợ hành động cụ thể.
  - Sử dụng ảnh nền thật từ thư mục `public/assets/placeholders/` để tạo cảm giác chuyên nghiệp cao cấp.

---

Chúc nhóm phát triển dự án NexPark gặt hái nhiều thành công và xây dựng được một sản phẩm vượt trội! 🚀
