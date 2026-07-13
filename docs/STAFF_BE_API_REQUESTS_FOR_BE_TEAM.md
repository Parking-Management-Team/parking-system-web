# Staff Portal - Backend API Requests

> **Ngày:** 2026-07-14  
> **Người yêu cầu:** FE Staff Team  
> **Mục tiêu:** Liệt kê các **chức năng trên màn hình Staff** đang bị thiếu hoặc không hoạt động đúng vì BE chưa hỗ trợ.

---

## 🔴 P1 – Chức năng bị ảnh hưởng ngay, cần làm trước

### 1. Màn Check-in – Staff không biết booking có còn trong thời hạn check-in không

**Màn hình:** `/dashboard/staff/check-in`  
**Vấn đề:** Khi Staff quét biển số xe và tra cứu booking, API hiện tại không trả về:
- `plannedCheckinTime` — giờ check-in dự kiến của booking
- `checkinGraceUntil` — deadline cuối cùng để check-in (= plannedCheckinTime + grace minutes)
- `depositAmount` — số tiền cọc khách đã nộp

**Hậu quả:** Staff không biết booking còn hợp lệ không, không thấy được thông tin cọc để thông báo cho khách. Các field này hiện hiển thị `—` hoặc `0`.

**API cần sửa:**
```
GET /api/parking-sessions/check-in/booking?licensePlate={plate}&buildingId={buildingId}
```

**Fields cần thêm vào response:**
```json
{
  "plannedCheckinTime": "2026-07-14T10:00:00Z",
  "checkinGraceUntil": "2026-07-14T10:30:00Z",
  "depositAmount": 50000,
  "bookingStatus": "Confirmed"
}
```

---

### 2. Màn Bookings – Danh sách booking thiếu thông tin thời gian và cọc

**Màn hình:** `/dashboard/staff/bookings`  
**Vấn đề:** API `/api/bookings` hiện không trả `plannedCheckinTime`, `checkinGraceUntil`, `depositAmount`. Staff không thể:
- Biết booking nào sắp đến giờ (trong 1 tiếng)
- Biết booking nào đang trong grace period (quá giờ nhưng chưa EXPIRED)
- Thấy số tiền cọc đã thanh toán

**Hậu quả:** Dashboard Booking Review không hiển thị được trạng thái ưu tiên xử lý. Toàn bộ badge "Grace Period / Within 1h / Upcoming" không hoạt động.

**API cần sửa:**
```
GET /api/bookings
```

**Fields cần thêm:**
```json
{
  "plannedCheckinTime": "2026-07-14T10:00:00Z",
  "plannedCheckoutTime": "2026-07-14T18:00:00Z",
  "checkinGraceUntil": "2026-07-14T10:30:00Z",
  "depositAmount": 50000
}
```

---

## 🟡 P2 – Chức năng bị hạn chế, cần làm trong sprint tới

### 3. Màn Slot Monitoring – Staff không xem được phí xe đang trong bãi

**Màn hình:** `/dashboard/staff/monitoring` → modal xem slot đang có xe  
**Vấn đề:** Staff muốn xem phí hiện tại của xe đang gửi (để báo cho khách trước khi checkout). Nhưng API duy nhất tính phí hiện tại là:
```
PATCH /api/parking-sessions/{id}/checkout/start
```
API này **có side-effect** (ghi nhận giờ ra thật), nên FE không được gọi chỉ để xem tiền.

**Hậu quả:** Modal slot detail không hiển thị phí dự kiến. FE đã chuẩn bị UI nhưng bị comment out vì không có API an toàn.

**API mới cần tạo:**
```
GET /api/parking-sessions/{id}/fee-preview
```

**Yêu cầu quan trọng:** Endpoint này KHÔNG ĐƯỢC làm bất kỳ thay đổi nào:
- ❌ Không ghi `checkOutTime`
- ❌ Không đổi trạng thái session
- ❌ Không tạo payment
- ❌ Không release card/slot

**Response mong muốn:**
```json
{
  "sessionId": 1,
  "parkingFee": 30000,
  "incidentFeeTotal": 100000,
  "totalAmount": 130000,
  "calculatedAt": "2026-07-14T10:00:00Z",
  "breakdown": [
    { "name": "Parking fee", "amount": 30000, "type": "PARKING" },
    { "name": "Lost card penalty", "amount": 100000, "type": "INCIDENT", "incidentId": 1 }
  ]
}
```

---

### 4. Màn Check-in – Không kiểm tra được blacklist theo biển số/thẻ một cách chính xác

**Màn hình:** `/dashboard/staff/check-in`  
**Vấn đề:** FE hiện load toàn bộ blacklist (`GET /api/Blacklist`) rồi tự lọc client-side theo biển số. Cách này:
- Chậm (load cả nghìn record)
- Không kiểm tra được card code
- Không biết lý do bị block để thông báo cho khách

**Hậu quả:** Staff thấy "blocked" nhưng không biết lý do, không biết xe hay thẻ bị chặn.

**API mới cần tạo:**
```
GET /api/Blacklist/check?licensePlate={plate}&cardCode={code}
```

**Response mong muốn:**
```json
{
  "blocked": true,
  "targetType": "VEHICLE",
  "reason": "Unpaid parking fee reported",
  "incidentId": 3,
  "blacklistId": 1
}
```

---

### 5. Màn Slot Monitoring – Không xử lý được trường hợp mất thẻ ngay tại chỗ

**Màn hình:** `/dashboard/staff/monitoring` → modal slot có xe  
**Vấn đề:** FE đã viết service wrappers cho lost card flow nhưng chưa thêm UI vì chưa xác nhận atomic endpoints hoạt động. Cần confirm 3 endpoints sau đã được implement và test:
```
POST /api/parking-sessions/{id}/lost-card
POST /api/parking-sessions/{id}/lost-card/rollback
PATCH /api/parking-sessions/{id}/replace-card?newCardCode={code}
```

**Hậu quả:** Staff không có nút "Report Lost Card" trong UI. Phải xử lý thủ công qua incident thông thường.

**Response mong muốn cho `lost-card`:**
```json
{
  "sessionId": 1,
  "oldCardCode": "CARD001",
  "newCardCode": null,
  "cardStatus": "LOST",
  "incidentId": 5,
  "penaltyFee": 100000,
  "sessionStatus": "ACTIVE"
}
```

---

## 🟢 P3 – Cải thiện trải nghiệm, làm sau khi P1/P2 xong

### 6. Dashboard Staff – Không có tổng hợp ca làm việc từ BE

**Màn hình:** `/dashboard/staff` (Shift Revenue card)  
**Vấn đề:** Dashboard hiện tính doanh thu ca bằng cách load toàn bộ `/api/payments` rồi lọc FE-side theo giờ bắt đầu ca. Tốn bandwidth và dễ sai nếu có nhiều payment.

**API mới cần tạo (optional):**
```
GET /api/parking-sessions/shift-summary?from={datetime}&to={datetime}
```

**Response mong muốn:**
```json
{
  "totalVehiclesIn": 45,
  "totalVehiclesOut": 38,
  "currentInParking": 7,
  "cashRevenue": 450000,
  "onlineRevenue": 320000,
  "totalRevenue": 770000,
  "openIncidents": 2
}
```

---

## Tóm tắt

| Priority | Màn hình | Chức năng bị thiếu |
|---|---|---|
| 🔴 P1 | Check-in | Không hiển thị plannedCheckinTime, checkinGraceUntil, depositAmount của booking |
| 🔴 P1 | Bookings list | Không phân biệt được booking Grace/Soon/Upcoming |
| 🟡 P2 | Slot Monitoring | Không xem được phí hiện tại của xe đang gửi |
| 🟡 P2 | Check-in | Blacklist check không chính xác, không có lý do |
| 🟡 P2 | Slot Monitoring | Không có nút Report Lost Card |
| 🟢 P3 | Dashboard | Shift revenue tính client-side, không hiệu quả |
