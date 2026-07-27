# Giải Thích Luồng Code - Staff Features (Dành cho thuyết trình/Review Code)

Tài liệu này giải thích chi tiết **code thực tế đang chạy như thế nào**, file nào đảm nhiệm việc gì, các hàm (function) chính làm nhiệm vụ gì, tập trung 100% vào Frontend và những gì hiển thị trên giao diện UI.

---

## 1. Màn hình Check-in (Xe vào)
**File chính:** `src/features/vehicles/components/VehicleCheckin.tsx`  
**File gọi API:** `src/features/vehicles/services/vehicle-checkin.service.ts`

### Các State (Trạng thái) quan trọng trên UI & Các hàm gọi API tương ứng:

- `cards`: Danh sách tất cả thẻ xe lấy từ API về.
  - **Hàm lấy API:** Hàm `refreshOperationalData()` (Dòng ~324) gọi service `fetchCards()` ở `card.service.ts` (API `GET /cards`).
  - **Xử lý trên UI:** Lọc lấy các thẻ khả dụng qua biến `availableCards` (`cardType === 'PARKING_CARD'` và `cardStatus === 'AVAILABLE'`) để hiển thị gợi ý trên ô nhập mã thẻ.
- `bookings`: Danh sách các lượt đặt chỗ trước của khách hàng.
  - **Hàm lấy API:** Hàm `refreshOperationalData()` (Dòng ~324) gọi service `fetchCheckinBookingsByBuilding(buildingId)` (API `GET /bookings/check-in` hoặc `GET /bookings`). Được bọc catch lỗi mềm để trả về mảng rỗng `[]` nếu API chưa có sẵn.
  - **Xử lý trên UI:** Dùng hàm `isConfirmedBookingForPlate()` để tự động đối chiếu biển số xe nhập/quét được với danh sách Booking đã xác nhận (`CONFIRMED`).
- `activeSessions`: Danh sách các phiên đỗ xe đang hoạt động thực tế trong bãi.
  - **Hàm lấy API:** Hàm `refreshOperationalData()` (Dòng ~324) gọi service `fetchActiveParkingSessions()` (API `GET /parking-sessions/active`).
  - **Xử lý trên UI:** Hiển thị tổng số lượng xe đang trong bãi và render Modal xem danh sách xe active.
- `blacklist`: Danh sách đen các biển số xe hoặc mã thẻ bị cấm/vi phạm.
  - **Hàm lấy API:** Hàm `loadGateData()` (Dòng ~361) gọi `blacklistService.getAll(1, 1000)` (API `GET /blacklist`).
  - **Xử lý trên UI:** Chạy hàm `checkBlacklistBeforeSubmit()` trước khi submit để tự động chặn các xe/thẻ nằm trong danh sách đen và hiển thị popup cảnh báo màu đỏ.
- `buildings` & `vehicleTypes`: Danh mục Tòa nhà & Loại xe (Ô tô, Xe máy, Xe điện).
  - **Hàm lấy API:** Hàm `loadGateData()` (Dòng ~361) gọi `api.get('/Buildings/paged')` và `api.get('/vehicle-types')`.
- `licensePlate`, `cardCode`: Dữ liệu biển số và mã thẻ đang nhập trên ô Input.
- `capturedImage`: Lưu ảnh chụp từ webcam dạng base64 để hiển thị lên khung preview và gửi đi.
- `isSubmitting`: Trạng thái đang gửi yêu cầu, dùng để tắt/bật hiệu ứng loading và disable nút bấm chống double-click trên giao diện.

---

### Quy trình nạp dữ liệu API tự động (`loadGateData` & `refreshOperationalData`):

1. **Hàm `loadGateData()` (Nạp dữ liệu khởi tạo khi mở trang - Dòng ~361):**
   - Được kích hoạt tự động 1 lần qua `useEffect` khi màn hình Check-in mở lên (Mount).
   - Nạp các dữ liệu danh mục tĩnh trước (`buildings`, `vehicleTypes`, `blacklist`), sau đó gọi tiếp hàm `refreshOperationalData()` để nạp dữ liệu vận hành.

2. **Hàm `refreshOperationalData()` (Nạp dữ liệu vận hành thời gian thực - Dòng ~324):**
   - Sử dụng `Promise.all([...])` để gửi đồng thời 3 HTTP Request song song: `fetchCards()`, `fetchActiveParkingSessions()`, và `fetchCheckinBookingsByBuilding()`.
   - Giúp giảm thiểu thời gian chờ (latency) và tải toàn bộ dữ liệu mới nhất về FE cùng một lúc.
   - Hàm này cũng được gọi tự động mỗi khi prop `refreshTrigger` thay đổi (khi có xe Check-out thành công ở cổng đối diện trong màn hình Combined Gate).

---

### Hàm `handleConfirmCheckin` (Xử lý khi bấm nút "Confirm Check-in" - Dòng ~455):
1. **Validate (Kiểm tra dữ liệu trên UI):**
   - Kiểm tra xem đã điền `licensePlate` và `cardCode` chưa. Nếu thiếu, gọi `showGateOverlay` hiển thị popup lỗi màu đỏ trên màn hình.
   - Chạy hàm `checkBlacklistBeforeSubmit()` đối chiếu biển số và mã thẻ với danh sách đen.
   - Tìm thẻ trong danh sách và kiểm tra xem `cardStatus` có phải là `AVAILABLE` không.
2. **Đóng gói dữ liệu và gọi API (Dòng ~514):**
   - Gọi hàm `checkInVehicle` truyền cục dữ liệu: `licensePlate`, `vehicleTypeId`, `cardCode`, `buildingId`, `staffId`, `imageIn` (ảnh chụp từ Camera).
   - Hàm này gọi API thực tế: `api.post('/parking-sessions/check-in', payload)` ở file service dòng ~240.
3. **Cập nhật giao diện lập tức (Tối ưu State):**
   - Khi BE phản hồi thành công, FE tự cập nhật dữ liệu hiển thị:
     - `setActiveSessions(...)`: Chèn xe vừa vào lên đầu bảng danh sách xe Đang ở trong bãi.
     - `setCards(...)`: Cập nhật thẻ này thành trạng thái `ACTIVE` trên UI.
     - Reset form: Xóa trắng biển số, mã thẻ và ảnh chụp camera trên giao diện.

### Hàm `captureFrame` & `performOCR` (Chụp ảnh & Nhận diện biển số):
#### 1. Chụp ảnh từ Camera (`captureFrame` - Dòng 175 trong file UI `VehicleCheckin.tsx`):
*   **Cơ chế hoạt động:**
    1. Trình duyệt sử dụng API của HTML5 là `navigator.mediaDevices.getUserMedia` để mở camera và truyền trực tiếp hình ảnh vào thẻ `<video>` hiển thị trên UI.
    2. Khi kích hoạt hàm `captureFrame`, code sẽ khởi tạo một thẻ `<canvas>` ẩn dưới bộ nhớ (`document.createElement('canvas')`).
    3. Sử dụng bộ vẽ 2D (`canvas.getContext('2d')`) để chụp lại khung hình hiện tại của thẻ `<video>` bằng lệnh `ctx.drawImage(video, 0, 0, width, height)`.
    4. Trích xuất hình ảnh đó ra thành một chuỗi văn bản định dạng **Base64** (ảnh JPEG chất lượng 75%) bằng lệnh `canvas.toDataURL('image/jpeg', 0.75)` và lưu vào State `capturedImage` để hiển thị ảnh preview.

#### 2. Nhận diện biển số (`performOCR` - Dòng 247 trong file UI `VehicleCheckin.tsx`):
*   **Cơ chế hoạt động:**
    1. Hàm này nhận vào chuỗi Base64 vừa chụp từ bước trên.
    2. Gọi service `scanLicensePlate` được định nghĩa tại file **`src/features/vehicles/services/vehicle-checkin.service.ts` (Dòng ~247)**.
    3. Gửi một HTTP request dạng POST qua axios: `api.post('/parking-sessions/ocr', { image: base64Img })`.
    4. Backend nhận ảnh Base64 này, sử dụng các thuật toán xử lý ảnh và nhận dạng ký tự quang học (OCR) để đọc biển số xe, sau đó trả về kết quả dạng JSON: `{ "licensePlate": "29A12345", "success": true }`.
    5. Sau khi nhận kết quả thành công, FE chạy lệnh `setLicensePlate(result.licensePlate)` để điền tự động biển số vừa nhận diện vào ô nhập trên UI.

*   *Lưu ý thuyết trình:* Cơ chế này hoạt động theo nguyên lý **Client chụp ảnh -> Chuyển thành Base64 -> Đẩy lên Cloud/Server xử lý OCR -> Trả văn bản về Client**. FE không tự nhận diện chữ trực tiếp trên trình duyệt mà thông qua API của BE để giảm tải hiệu năng cho máy Client.

---

## 2. Màn hình Check-out (Xe ra)
**File chính:** `src/features/vehicles/components/VehicleCheckout.tsx`  
**File gọi API:** `src/features/vehicles/services/vehicle-checkout.service.ts`

### Các State quan trọng trên UI:
- `sessions`: Danh sách các xe đang đỗ trong bãi (được load từ API qua hàm `loadActiveSessions()` gọi `fetchCheckoutActiveSessions()`).
- `selectedSessionId`: ID của chiếc xe được chọn để làm thủ tục ra.
- `exitPlate`, `checkoutCardCode`: Biển số xe ra và mã thẻ xe ra (quét hoặc nhập tay).
- `calculatedFee`: Thông tin tiền phí đỗ xe nhận về từ Backend sau khi tính toán.

### Luồng xử lý xe ra trên UI gồm 2 chặng:

**Chặng 1: Bấm nút tính tiền (Hàm `handleStartCheckout` - Dòng ~541):**
1. **Validate:** Kiểm tra xem đã chọn xe chưa và có nhập/quét biển số ra (`exitPlate`) chưa.
2. **So khớp biển số:** So sánh `exitPlate` với biển số lúc vào `licensePlate` (sử dụng hàm `isPlateMatched` so khớp không tính ký tự đặc biệt).
   - **Luồng xử lý sai lệch biển số:** Nếu không khớp, FE sẽ hiện Toast lỗi: `"Exit plate does not match check-in plate. Please route to incident handling."` và chặn không cho đi tiếp. Lúc này nhân viên phải chuyển sang tab Incident (Sự cố) để làm thủ tục bằng tay.
3. **Tính phí:** Nếu khớp biển số, gọi API `startCheckout` - Dòng 259 (`api.patch('/parking-sessions/{id}/checkout/start')`) gửi thông tin biển ra, ảnh ra, thời điểm ra. Nhận về số tiền phí hiển thị lên màn hình.

**Chặng 2: Staff bấm "Hoàn tất thanh toán" (Hàm `handleCompleteCheckout` - Dòng ~680):**
1. Nhân viên chọn phương thức thanh toán (Tiền mặt / Chuyển khoản) và bấm xác nhận.
2. FE gọi API lưu giao dịch: `createCheckoutPayment(...)` - Dòng 273 (`api.post('/parking-sessions/{id}/checkout-payment')`).
3. FE gọi API hoàn tất phiên: `completeCheckout(...)` (`api.patch('/parking-sessions/{id}/complete')`).
4. **Cập nhật UI:** Loại bỏ xe vừa ra khỏi mảng state `sessions` trên giao diện và đổi trạng thái thẻ đó về `AVAILABLE` cục bộ để không cần reload toàn bộ trang.

---

## 3. Màn hình Dashboard (Tổng quan vận hành)
**File chính:** `src/features/staff/components/StaffOverview.tsx`  
**API Sử dụng (Gửi đồng thời bằng `Promise.allSettled` - Dòng ~230):**
- `/parking-sessions/active` (GET): Lấy danh sách xe đang trong bãi.
- `/Incident` (GET): Lấy danh sách toàn bộ sự cố đã báo cáo.
- `/bookings` (GET): Lấy danh sách lượt đặt chỗ trước.

### Các State quan trọng trên UI:
- `activeSessions`: Mảng danh sách các xe đang đỗ thực tế.
- `incidents`: Mảng danh sách các sự cố.
- `bookings`: Mảng danh sách các lượt đặt trước.
- `loading`: Trạng thái load dữ liệu để hiển thị spinner xoay tròn trên nút Refresh.

### Cơ chế hoạt động của Dashboard trên FE:
1. **Tự động tải lại (Auto Polling - Dòng ~283):**
   - Khi màn hình Dashboard mở ra, hook `useEffect` sẽ chạy hàm `loadDashboard()` lần đầu tiên để lấy dữ liệu.
   - Đồng thời, code cài đặt một bộ hẹn giờ `setInterval` cứ mỗi **2 phút (120,000 ms)** sẽ tự động gọi lại hàm `loadDashboard()` để cập nhật các chỉ số (xe đỗ, đặt chỗ khẩn cấp, sự cố mới) mà nhân viên không cần phải bấm F5 tải lại trang.
2. **Xử lý logic hiển thị các thẻ thống kê (Stat Cards - Dòng ~296):**
   - **Thẻ Xe đang đỗ (In Parking Now):** Hiển thị tổng số lượng của mảng `activeSessions.length`.
   - **Thẻ Lượt đặt trước (Confirmed Bookings):** Dùng `useMemo` lọc ra những booking có trạng thái `CONFIRMED`. FE còn tự động tính toán khoảng thời gian đến hạn của booking:
     - Nếu sắp quá hạn hoặc đang trong thời gian ân hạn -> Hiện màu đỏ cảnh báo (`⚠ Grace Period`).
     - Nếu sắp đến trong vòng 1 giờ -> Hiện màu vàng (`⏰ Within 1h`).
   - **Thẻ Sự cố chưa xử lý (Open Incidents):** FE tự động lọc (`incidents.filter(...)`) những sự cố nào có trạng thái là `OPEN` hoặc `PROCESSING` để in ra số lượng sự cố khẩn cấp cần giải quyết ngay.

---

## 4. Màn hình Cổng Kết Hợp (Combined Gate - Check-in & Check-out Song Song)
**File chính:** `src/app/dashboard/staff/combined-gate/page.tsx`

### Cấu trúc giao diện & Ý nghĩa nghiệp vụ:
- Màn hình Combined Gate được thiết kế dành cho mô hình bãi xe vừa và nhỏ, nơi **một Nhân viên duy nhất có thể quản lý cả làn xe vào (Check-in) và làn xe ra (Check-out) cùng lúc trên 1 màn hình**.
- Giao diện sử dụng Tailwind Grid Layout 2 cột (`grid gap-4 xl:grid-cols-2`):
  - **Cột bên trái:** Component `<VehicleCheckin compact={true} refreshTrigger={checkinRefreshTrigger} onCheckinSuccess={handleCheckinSuccess} />`.
  - **Cột bên phải:** Component `<VehicleCheckout compact={true} refreshTrigger={checkoutRefreshTrigger} onCheckoutSuccess={handleCheckoutSuccess} />`.

### Chế độ hiển thị Thu Gọn (`compact={true}`):
- Khi prop `compact = true` được truyền vào, cả hai component `<VehicleCheckin>` và `<VehicleCheckout>` sẽ tự động ẩn đi các phần header tiêu đề trang lớn trùng lặp, tối ưu lại khoảng cách padding/margin và thu gọn các ô nhập liệu.
- Giúp toàn bộ giao diện 2 cổng vừa vặn trong tầm mắt bảo vệ mà không bị vỡ layout hay phải cuộn trang quá nhiều.

### Cơ chế đồng bộ dữ liệu liên động 2 chiều (Bi-directional State Triggering):
File `page.tsx` đóng vai trò là **Component Cha (Parent Component)** điều phối dữ liệu giữa hai cổng:

1. **Luồng Cổng Vào ➔ Cổng Ra (`handleCheckinSuccess`):**
   - Khi một xe làm thủ tục Check-in thành công ở làn bên trái, `<VehicleCheckin>` sẽ gọi hàm callback `onCheckinSuccess()`.
   - Trang cha nhận sự kiện và thực thi `handleCheckinSuccess`, làm tăng state `checkoutRefreshTrigger` lên +1 (`setCheckoutRefreshTrigger(prev => prev + 1)`).
   - Component `<VehicleCheckout>` ở làn bên phải lắng nghe sự thay đổi của prop `refreshTrigger` qua `useEffect`. Ngay lập tức, nó kích hoạt hàm `loadActiveSessions()` để **tải lại danh sách xe đang trong bãi**.
   - **Kết quả trên UI:** Xe vừa quẹt thẻ vào bên làn Check-in sẽ xuất hiện ngay lập tức trong danh sách chờ Check-out ở làn bên phải mà nhân viên không cần phải bấm F5 hay tải lại trang.

2. **Luồng Cổng Ra ➔ Cổng Vào (`handleCheckoutSuccess`):**
   - Khi một xe làm thủ tục Check-out & thanh toán thành công ở làn bên phải, `<VehicleCheckout>` gọi callback `onCheckoutSuccess()`.
   - Trang cha nhận sự kiện và thực thi `handleCheckoutSuccess`, làm tăng state `checkinRefreshTrigger` lên +1 (`setCheckinRefreshTrigger(prev => prev + 1)`).
   - Component `<VehicleCheckin>` bên trái nhận `refreshTrigger` thay đổi, tự động kích hoạt hàm `refreshOperationalData()`.
   - **Kết quả trên UI:** Thẻ từ RFID vừa thu hồi từ xe ra sẽ lập tức chuyển trạng thái về `AVAILABLE` (sẵn sàng) trên danh sách thẻ bên cổng Check-in để nhân viên tiếp tục cấp cho xe vào tiếp theo.

---

## 5. Giám Sát Bãi Đỗ (Slot Monitoring)
**File chính:** `src/features/facilities/components/SlotMonitoring.tsx`

### Cách FE xử lý hiển thị bản đồ bãi xe:
1. Gọi API lấy danh sách các ô đỗ tĩnh (`slots`) theo từng khu vực (`zones`).
2. Gọi API lấy danh sách phiên đỗ xe thực tế đang hoạt động (`activeSessions`).
3. **Thuật toán Map dữ liệu trên FE:** 
   - Duyệt qua mảng các ô đỗ, tìm kiếm: `activeSessions.find(s => s.slotId === slot.id)`.
   - Nếu tìm thấy phiên hoạt động: Render ô đỗ đó có màu đỏ (`bg-rose-50 border-rose-200`) và ghi biển số xe đang đỗ.
   - Nếu không tìm thấy: Render ô đỗ màu xanh lá cây đại diện cho chỗ trống còn trống (`AVAILABLE`).

---

## 6. Quản Lý Thẻ (Card Management)
**File chính:** `src/features/card/services/card.service.ts` và component `CardManager.tsx`

- **Tải danh sách:** FE gọi API `/cards` lấy danh sách thẻ và đối chiếu với danh sách xe đang đỗ trong bãi. Thẻ nào đang gắn với một phiên hoạt động sẽ được FE cập nhật thuộc tính trạng thái thành `ACTIVE` ngay trên giao diện để nhân viên phân biệt.
- **Tạo thẻ mới:** Form nhập mã thẻ và loại thẻ, bấm Submit sẽ đóng gói và gọi `api.post('/cards', data)`.

---

## 7. Xử Lý Sự Cố (Incident Handling)
**File chính:** `src/features/staff/components/IncidentHandling.tsx`  
**File gửi API:** `src/features/incident/services/incident.service.ts`

- **Khởi tạo sự cố:** Form trên giao diện cho phép nhân viên chọn phiên đỗ xe bị lỗi, chọn loại sự cố (mất thẻ, hỏng xe), nhập mô tả (`description`) và tiền phạt (`penaltyFee`).
- **Gửi dữ liệu:** Khi bấm nút "Create Incident", hàm `handleCreateIncident` (Dòng ~190) sẽ validate dữ liệu:
  - Kiểm tra xem đã chọn phiên đỗ và loại sự cố chưa.
  - Ràng buộc mô tả không quá 100 ký tự (theo giới hạn của BE).
  - Gọi service gửi request `api.post('/Incident', payload)`.
- **Hoàn thành sự cố:** Khi bấm "Mark as Resolved", FE gửi request `PUT /api/Incident/{id}/status` với body là `'RESOLVED'` để cập nhật trạng thái của sự cố thành đã xử lý trên giao diện.
