# 📡 STAFF FEATURE — TOÀN BỘ API REFERENCE (Dòng Code Cụ Thể)

---

## 🏠 PHẦN 0: STAFF DASHBOARD (Trang chủ Staff — Operational Dashboard)
**Route:** `/dashboard/staff`  
**File Page:** `src/app/dashboard/staff/page.tsx` → render `<StaffOverview />`  
**File Component chính:** `src/features/staff/components/StaffOverview.tsx`  
**Hàm gọi API:** `loadDashboard()` — **Dòng 259–313**

### 📡 API được gọi trong Dashboard:
Tất cả 3 API được gọi **cùng lúc** bằng `Promise.allSettled` tại **Dòng 262–266** — nghĩa là dù 1 API lỗi, 2 API còn lại vẫn hoạt động bình thường.

| # | Phương thức | Endpoint | State lưu vào | Dòng trong Component | Hiển thị lên UI |
|---|---|---|---|---|---|
| 1 | `GET` | `/parking-sessions/active` | `activeSessions` | Dòng **263** | Thẻ "In Parking Now" + bảng "Vehicles In Parking" |
| 2 | `GET` | `/Incident` | `incidents` | Dòng **264** | Thẻ "Open Incidents" + dải cảnh báo đỏ |
| 3 | `GET` | `/bookings` | `bookings` | Dòng **265** | Thẻ "Confirmed Bookings" + bảng "Incoming Reservations" |

### ⏱️ Auto-Refresh:
```
useEffect (Mount)
  ├─► loadDashboard() ngay lập tức
  └─► setInterval(loadDashboard, 120,000ms)  ← Tự động refresh mỗi 2 phút (Dòng 317)
```

---

### 🖥️ UI HIỂN THỊ GÌ TRÊN DASHBOARD — CHI TIẾT TỪNG PHẦN:

#### 1. 📊 Thanh KPI Stats (3 Thẻ chỉ số) — Dòng 367–392

| Thẻ | Icon | Số liệu | Màu trạng thái | Data nguồn |
|---|---|---|---|---|
| **In Parking Now** | `directions_car` | `activeSessions.length` — tổng xe đang đỗ | Xám (bình thường) | `GET /parking-sessions/active` |
| **Confirmed Bookings** | `event_available` | `confirmedCount` — vé đặt chỗ status CONFIRMED | Đỏ nếu có Grace, Vàng nếu sắp đến, Xanh nếu bình thường | `GET /bookings` |
| **Open Incidents** | `warning` | `openIncidents.length` — sự cố status OPEN hoặc PROCESSING | Đỏ nếu > 0, Xanh nếu = 0 | `GET /Incident` |

> 🔗 Thẻ "In Parking Now" → click vào → chuyển đến `/dashboard/staff/monitoring`  
> 🔗 Thẻ "Open Incidents" → click vào → chuyển đến `/dashboard/staff/incident`

---

#### 2. 📋 Bảng Trái: "Incoming Reservations" (Booking Review) — Dòng 398–458

Hiển thị danh sách vé đặt chỗ **CONFIRMED** đang có thời gian check-in sắp tới hoặc đang trong Grace Period. Được sắp xếp theo mức độ ưu tiên:

| Trạng thái Badge | Màu | Điều kiện |
|---|---|---|
| `⚠ Grace Period` | Đỏ | Đã qua giờ check-in nhưng còn trong `checkinGraceUntil` |
| `⏰ Within 1h` | Vàng | Giờ check-in còn < 1 tiếng |
| `📅 Upcoming` | Xanh | Giờ check-in còn từ 1–3 tiếng |

> Mặc định hiển thị **4 vé đầu**. Nếu > 4 vé → hiện nút "**+X more bookings**" (Dòng 439)  
> 🔗 Nút "View all bookings" → link tới `/dashboard/staff/bookings`

---

#### 3. 🚗 Bảng Phải: "Vehicles In Parking" (Live Sessions) — Dòng 460–521

Hiển thị danh sách xe đang đỗ trong bãi thời gian thực. Mỗi dòng gồm:
- **Biển số xe** (licensePlateIn)
- **Mã thẻ** (cardCode) + **Vị trí ô đỗ** (slotCode / zoneCode)
- **Giờ vào** (checkInTime, format HH:mm)
- **Loại khách**: Walk-in / Booking / Monthly (badge màu)

Phía trên bảng có **3 mini stat** tóm tắt nhanh:
| Mini Stat | Màu | Ý nghĩa |
|---|---|---|
| Walk-in | Xám | Xe vào không có đặt trước |
| Booking | Xanh dương | Xe vào có vé đặt trước |
| Monthly | Xanh ngọc | Xe có vé tháng |

> Mặc định hiển thị **6 xe đầu**. Nếu > 6 → hiện nút "**+X more**" (Dòng 507)  
> 🔗 Link "Slot map →" → `/dashboard/staff/monitoring`

---

#### 4. 🔴 Dải Cảnh Báo Sự Cố (Open Incidents Strip) — Dòng 524–550

Chỉ hiện khi có `openIncidents.length > 0`. Hiển thị tối đa **3 sự cố** đang OPEN/PROCESSING dưới dạng card nhỏ màu đỏ với:
- Tên loại sự cố (incidentName)
- Biển số xe liên quan (licensePlate)
- Giờ xảy ra (createdAt, format HH:mm)
- Chấm đỏ nhấp nháy (animate-pulse)

> 🔗 Link "View all →" → `/dashboard/staff/incident`

---

### 📌 Tóm tắt Layout Tổng thể Dashboard:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header: "Operational Dashboard"                  [Refresh Button]       │
├──────────────────┬──────────────────┬────────────────────────────────────┤
│ 🚗 In Parking Now│📅 Confirmed Bookings│ ⚠ Open Incidents               │
│    (số xe đỗ)    │  (vé đặt chỗ)    │ (sự cố chưa xử lý)               │
├──────────────────────────────────────┬──────────────────────────────────┤
│ LEFT: Incoming Reservations          │ RIGHT: Vehicles In Parking        │
│ (Danh sách booking sắp check-in)     │ (Danh sách xe đang trong bãi)    │
│ - Badge: Grace / Soon / Upcoming     │ - Walk-in / Booking / Monthly    │
│ - Giờ check-in / check-out dự kiến   │ - Biển số, thẻ, ô đỗ, giờ vào   │
│ - Tiền cọc đã đặt                    │                                   │
├──────────────────────────────────────┴──────────────────────────────────┤
│ 🔴 OPEN INCIDENTS STRIP (chỉ hiện khi có sự cố)                          │
│    [Inc 1: Tên - Biển số]  [Inc 2]  [Inc 3]    [View all →]             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

Tài liệu ghi lại **chính xác endpoint, phương thức HTTP, tên hàm service, và dòng code** của toàn bộ API được gọi trong phân hệ Staff.

---

## 🔵 PHẦN 1: CHECK-IN (Xe vào)
**File Service:** `src/features/vehicles/services/vehicle-checkin.service.ts`  
**File Component gọi hàm:** `src/features/vehicles/components/VehicleCheckin.tsx`

| # | Tên Hàm Service | Phương thức | Endpoint API | Dòng trong Service | Gọi từ Component ở Dòng |
|---|---|---|---|---|---|
| 1 | `fetchActiveParkingSessions()` | `GET` | `/parking-sessions/active` | Dòng **204–215** | `refreshOperationalData()` Dòng ~324 |
| 2 | `scanLicensePlate(payload)` | `POST` | `/parking-sessions/ocr` | Dòng **226–238** | `performOCR()` Dòng ~247 |
| 3 | `checkInVehicle(payload)` | `POST` | `/parking-sessions/check-in` | Dòng **240–252** | `handleConfirmCheckin()` Dòng ~514 |
| 4 | `fetchCheckinBookingsByBuilding(buildingId)` | `GET` | `/bookings/by-building/{buildingId}` | Dòng **283–294** | `refreshOperationalData()` Dòng ~324 |
| 5 | `fetchCheckinBookings()` *(fallback)* | `GET` | `/bookings` | Dòng **296–303** | `refreshOperationalData()` Dòng ~324 (fallback nếu API building lỗi) |
| 6 | `fetchAvailableSlotsForReallocation(...)` | `GET` | `/Floors` → `/Zones/floor/{id}` → `/ParkingSlots/zone/{id}` | Dòng **312–354** | `handleOpenReallocate()` Dòng ~580 |
| 7 | `fetchCards()` *(từ card.service.ts)* | `GET` | `/cards` | card.service.ts | `refreshOperationalData()` Dòng ~324 |
| 8 | `blacklistService.getAll(1, 1000)` | `GET` | `/blacklist?pageIndex=1&pageSize=1000` | blacklist.service.ts | `loadGateData()` Dòng ~361 |
| 9 | `api.get('/Buildings/paged')` | `GET` | `/Buildings/paged?pageIndex=1&pageSize=100` | VehicleCheckin.tsx | `loadGateData()` Dòng ~361 |
| 10 | `api.get('/vehicle-types')` | `GET` | `/vehicle-types` | VehicleCheckin.tsx | `loadGateData()` Dòng ~361 |

### Chi tiết Luồng gọi API trong Check-in:
```
useEffect (Mount) 
  └─► loadGateData() [Dòng ~361]
        ├─► GET /Buildings/paged          (lấy danh sách tòa nhà)
        ├─► GET /vehicle-types            (lấy loại xe: ô tô, xe máy)
        ├─► GET /blacklist                (lấy danh sách đen xe/thẻ bị cấm)
        └─► refreshOperationalData() [Dòng ~324]
              ├─► GET /cards               (lấy danh sách thẻ từ RFID khả dụng)
              ├─► GET /parking-sessions/active  (xe đang trong bãi)
              └─► GET /bookings/by-building/{id} (vé đặt chỗ trước theo tòa nhà)
                    └── [fallback] GET /bookings (nếu API by-building lỗi)

Nhân viên bấm "Scan Camera"
  └─► captureFrame() → performOCR() [Dòng ~247]
        └─► POST /parking-sessions/ocr   (gửi ảnh Base64, nhận biển số)

Nhân viên bấm "Confirm Check-in"
  └─► handleConfirmCheckin() [Dòng ~455]
        ├─► checkBlacklistBeforeSubmit()  (kiểm tra local state, không gọi API)
        └─► POST /parking-sessions/check-in  (tạo phiên đỗ xe mới)

Khi slot bị chiếm (SLOT_NOT_AVAILABLE)
  └─► handleOpenReallocate() [Dòng ~580]
        └─► GET /Floors → /Zones/floor/{id} → /ParkingSlots/zone/{id}
```

---

## 🔴 PHẦN 2: CHECK-OUT (Xe ra)
**File Service:** `src/features/vehicles/services/vehicle-checkout.service.ts`  
**File Component gọi hàm:** `src/features/vehicles/components/VehicleCheckout.tsx`

| # | Tên Hàm Service | Phương thức | Endpoint API | Dòng trong Service | Gọi từ Component ở Dòng |
|---|---|---|---|---|---|
| 1 | `fetchCheckoutActiveSessions()` | `GET` | `/parking-sessions/active` + `/cards` | Dòng **225–240** | `loadActiveSessions()` Dòng ~340 |
| 2 | `scanLicensePlate(payload)` | `POST` | `/parking-sessions/ocr` | checkin.service.ts Dòng 226 | `performOCR()` Dòng ~320 |
| 3 | `startCheckout(sessionId, input)` | `PATCH` | `/parking-sessions/{id}/checkout/start` | Dòng **248–271** | `handleStartCheckout()` Dòng ~541 |
| 4 | `createCheckoutPayment(session, method)` | `POST` | `/payments` | Dòng **273–288** | `executeCompleteCheckout()` Dòng ~680 |
| 5 | `completeCheckout(sessionId)` | `PATCH` | `/parking-sessions/{id}/complete` | Dòng **290–296** | `executeCompleteCheckout()` Dòng ~680 |
| 6 | `reportLostCard(sessionId, input)` | `POST` | `/parking-sessions/{id}/lost-card` | Dòng **298–314** | `proceedWithMarkLost()` Dòng ~450 |
| 7 | `fetchCards()` *(từ card.service.ts)* | `GET` | `/cards` | card.service.ts | `loadCards()` Dòng ~360 |

### Chi tiết Luồng gọi API trong Check-out:
```
useEffect (Mount)
  ├─► loadActiveSessions() [Dòng ~340]
  │     └─► GET /parking-sessions/active  (xe đang trong bãi chờ ra)
  │           + GET /cards                (lấy mã thẻ để map vào session)
  └─► loadCards() [Dòng ~360]
        └─► GET /cards                    (danh sách thẻ để dropdown gợi ý)

Nhân viên bấm "Scan Camera"
  └─► handleCheckoutScan() → performOCR()
        └─► POST /parking-sessions/ocr    (nhận diện biển số xe ra)

Nhân viên nhập/quét biển số → khớp với biển lúc vào
  └─► handleStartCheckout() [Dòng ~541]    ← Tự động trigger qua useEffect
        └─► PATCH /parking-sessions/{id}/checkout/start  (tính tiền phí đỗ xe)

Nhân viên bấm "Lost Card" → Báo mất thẻ
  └─► proceedWithMarkLost() [Dòng ~450]
        └─► POST /parking-sessions/{id}/lost-card  (đánh dấu thẻ LOST, tính phí phạt)

Nhân viên bấm "Confirm Payment & Checkout"
  └─► executeCompleteCheckout() [Dòng ~680]
        ├─► POST /payments                (tạo giao dịch thanh toán: Cash/Online)
        └─► PATCH /parking-sessions/{id}/complete  (đóng phiên đỗ xe)
```

---

## 🟠 PHẦN 3: COMBINED GATE (Cổng gộp)
**File chính:** `src/app/dashboard/staff/combined-gate/page.tsx`

> Không gọi API trực tiếp. Đóng vai trò **Component Cha** điều phối:
> - Truyền prop `refreshTrigger` vào `<VehicleCheckin>` và `<VehicleCheckout>`.
> - Khi Check-in xong → tăng `checkoutRefreshTrigger` → `<VehicleCheckout>` tự `loadActiveSessions()`.
> - Khi Check-out xong → tăng `checkinRefreshTrigger` → `<VehicleCheckin>` tự `refreshOperationalData()`.

---

## 🟡 PHẦN 4: INCIDENT HANDLING (Xử lý sự cố)
**File Service:** `src/features/incident/services/incident.service.ts`  
**File Component gọi hàm:** `src/features/staff/components/IncidentHandling.tsx`

| # | Tên Hàm Service | Phương thức | Endpoint API | Dòng trong Service | Dùng để làm gì |
|---|---|---|---|---|---|
| 1 | `incidentService.getAll()` | `GET` | `/Incident?pageIndex=1&pageSize=100` | Dòng **206–216** | Load danh sách sự cố |
| 2 | `incidentService.getById(id)` | `GET` | `/Incident/{id}` | Dòng **218–225** | Xem chi tiết 1 sự cố |
| 3 | `incidentService.getBySessionId(sessionId)` | `GET` | `/Incident/session/{sessionId}` | Dòng **227–236** | Tìm sự cố theo phiên xe |
| 4 | `incidentService.getIncidentTypes()` | `GET` | `/IncidentType` + `/penalty-configs` | Dòng **238–257** | Load danh sách loại sự cố + tiền phạt |
| 5 | `incidentService.getActiveSessions()` | `GET` | `/parking-sessions/active` | Dòng **259–272** | Load danh sách xe đang đỗ để chọn |
| 6 | `incidentService.create(data)` | `POST` | `/Incident` | Dòng **274–287** | Tạo mới sự cố |
| 7 | `incidentService.update(id, data)` | `PUT` | `/Incident/{id}` | Dòng **289–296** | Cập nhật thông tin sự cố |
| 8 | `incidentService.updateStatus(id, data)` | `PATCH` | `/Incident/{id}/status` | Dòng **298–314** | Cập nhật trạng thái (OPEN/PROCESSING/RESOLVED) |
| 9 | `incidentService.createBlacklistRecord(data)` | `POST` | `/Blacklist` | Dòng **316–328** | Thêm xe/thẻ vào danh sách đen sau sự cố |
| 10 | `incidentService.delete(id)` | `DELETE` | `/Incident/{id}` | Dòng **330–337** | Xóa sự cố |
| 11 | `incidentService.reportLostCard(sessionId, input)` | `POST` | `/parking-sessions/{id}/lost-card` | Dòng **339–355** | Báo mất thẻ từ màn hình Incident |
| 12 | `incidentService.rollbackLostCard(sessionId)` | `POST` | `/parking-sessions/{id}/lost-card/rollback` | Dòng **357–367** | Hoàn tác báo mất thẻ |
| 13 | `incidentService.replaceSessionCard(sessionId, newCardCode)` | `PATCH` | `/parking-sessions/{id}/replace-card` | Dòng **369–379** | Thay thẻ mới cho xe đỗ |

---

## 🟢 PHẦN 5: STAFF OVERVIEW DASHBOARD
**File chính:** `src/features/staff/components/StaffOverview.tsx`

| # | Endpoint API | Phương thức | Gọi từ hàm | Dùng để hiển thị |
|---|---|---|---|---|
| 1 | `/parking-sessions/active` | `GET` | `loadDashboard()` qua `Promise.allSettled` | Thẻ "In Parking Now" - số xe đang đỗ |
| 2 | `/Incident?pageIndex=1&pageSize=100` | `GET` | `loadDashboard()` qua `Promise.allSettled` | Thẻ "Open Incidents" - sự cố chưa xử lý |
| 3 | `/bookings` | `GET` | `loadDashboard()` qua `Promise.allSettled` | Thẻ "Confirmed Bookings" - vé đặt chỗ trước |

> **Auto Polling:** `setInterval` mỗi **120,000ms (2 phút)** gọi lại `loadDashboard()` tự động.

---

## 📋 TỔNG HỢP NHANH — TẤT CẢ ENDPOINT STAFF

| Endpoint | Phương thức | Dùng ở đâu |
|---|---|---|
| `/parking-sessions/active` | `GET` | Check-in, Check-out, Incident, Dashboard |
| `/parking-sessions/check-in` | `POST` | Check-in — Tạo phiên xe vào |
| `/parking-sessions/ocr` | `POST` | Check-in & Check-out — Quét biển số camera |
| `/parking-sessions/{id}/checkout/start` | `PATCH` | Check-out — Tính phí đỗ xe |
| `/parking-sessions/{id}/complete` | `PATCH` | Check-out — Đóng phiên, xác nhận thanh toán |
| `/parking-sessions/{id}/lost-card` | `POST` | Check-out & Incident — Báo mất thẻ |
| `/parking-sessions/{id}/lost-card/rollback` | `POST` | Incident — Hoàn tác báo mất thẻ |
| `/parking-sessions/{id}/replace-card` | `PATCH` | Incident — Thay thẻ mới |
| `/payments` | `POST` | Check-out — Tạo giao dịch thanh toán |
| `/bookings/by-building/{id}` | `GET` | Check-in — Vé đặt chỗ theo tòa nhà |
| `/bookings` | `GET` | Check-in (fallback) & Dashboard |
| `/cards` | `GET` | Check-in & Check-out — Danh sách thẻ RFID |
| `/Incident` | `GET` | Incident & Dashboard — Danh sách sự cố |
| `/Incident` | `POST` | Incident — Tạo sự cố mới |
| `/Incident/{id}` | `PUT` | Incident — Cập nhật sự cố |
| `/Incident/{id}/status` | `PATCH` | Incident — Đổi trạng thái sự cố |
| `/Incident/{id}` | `DELETE` | Incident — Xóa sự cố |
| `/IncidentType` | `GET` | Incident — Lấy danh mục loại sự cố |
| `/penalty-configs` | `GET` | Incident — Lấy mức tiền phạt tương ứng |
| `/Blacklist` | `POST` | Incident — Thêm vào danh sách đen |
| `/blacklist?pageIndex=1&pageSize=1000` | `GET` | Check-in — Kiểm tra xe/thẻ bị cấm |
| `/Buildings/paged` | `GET` | Check-in — Lấy danh sách tòa nhà |
| `/vehicle-types` | `GET` | Check-in — Lấy loại xe |
| `/Floors` | `GET` | Check-in — Tìm sơ đồ tầng khi realloc slot |
| `/Zones/floor/{id}` | `GET` | Check-in — Tìm khu vực theo tầng |
| `/ParkingSlots/zone/{id}` | `GET` | Check-in — Tìm ô đỗ trống theo khu vực |
