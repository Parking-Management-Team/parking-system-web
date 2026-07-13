# Staff FE API Integration - Những phần đã làm

## Nguyên tắc

- Không chỉnh UI/layout/style theo yêu cầu.
- Chỉ chỉnh API service, DTO/type mapping, fallback logic và docs.

---

## 1. Check-in: gắn booking lookup mới

### API đã gắn

```http
GET /api/parking-sessions/check-in/booking?licensePlate={plate}&buildingId={buildingId}
```

### Cách FE dùng

- Khi staff bấm check-in, FE gọi API lookup booking theo biển số + building.
- Nếu BE trả booking, FE dùng `bookingId` đó để check-in.
- Nếu API lỗi hoặc không có booking, FE fallback sang booking cached cũ.

### Files đã chỉnh

- `src/features/vehicles/services/vehicle-checkin.service.ts`
- `src/features/vehicles/components/VehicleCheckin.tsx`

### Function thêm mới

```ts
lookupCheckinBookingByPlate(licensePlate, buildingId)
```

---

## 2. Check-in session DTO mapping

Đã mở rộng DTO mapping để nhận các field BE mới hoặc sắp bổ sung:

```ts
bookingCode
cardStatus
zoneName
vehicleTypeId
vehicleTypeName
plannedCheckoutTime
totalFee
penaltyFee
amountDue
```

Nếu BE chưa trả đủ, FE vẫn fallback để không vỡ flow.

---

## 3. Staff Slot Monitoring: gắn filter slot trống

### API đã gắn

```http
GET /api/ParkingSlots/zone/{zoneId}?statuses=Available
```

### Cách FE dùng

- Grid slot vẫn load toàn bộ slot để hiển thị đủ trạng thái.
- Khi chọn session cần assign slot, FE gọi API filter `Available` theo zone để cập nhật danh sách slot trống.

### File đã chỉnh

- `src/features/staff/components/StaffSlotMonitoring.tsx`

---

## 4. Checkout/payment: map breakdown phí

Đã map response payment mới từ BE:

```ts
baseParkingFee
incidentFeeTotal
items
```

Vẫn hỗ trợ fallback tên cũ nếu có:

```ts
parkingFee
incidentFees
details
```

### File đã chỉnh

- `src/features/vehicles/services/vehicle-checkout.service.ts`

---

## 5. Card lookup by code

### API wrapper đã thêm

```http
GET /api/cards/by-code/{cardCode}
```

### Function thêm mới

```ts
fetchCheckoutCardByCode(cardCode)
```

> Hiện chỉ thêm service function, chưa đổi UI scan/search card vì user yêu cầu không chỉnh UI.

---

## 6. Incident / Lost Card atomic endpoints

Đã thêm service wrappers cho luồng mất thẻ atomic của BE:

```http
POST /api/parking-sessions/{id}/lost-card
POST /api/parking-sessions/{id}/lost-card/rollback
PATCH /api/parking-sessions/{id}/replace-card?newCardCode={code}
```

### Functions thêm mới

```ts
incidentService.reportLostCard(sessionId, { staffId, description })
incidentService.rollbackLostCard(sessionId)
incidentService.replaceSessionCard(sessionId, newCardCode)
```

> Chưa thêm button vào UI vì đây là thay đổi UI. Nếu cần dùng trực tiếp trên màn hình, cần xác nhận trước.

### Files đã chỉnh

- `src/features/incident/services/incident.service.ts`
- `src/features/incident/types/index.ts`

---

## 7. Validation

Đã chạy:

```powershell
npx tsc --noEmit
```

Kết quả: pass.
