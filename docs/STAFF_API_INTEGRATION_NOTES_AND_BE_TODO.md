# Staff API Integration Notes & BE TODO

## Nguyên tắc thực hiện

- Không chỉnh UI/layout/style.
- Chỉ chỉnh service/API mapping, DTO type, fallback logic và documentation.
- Các phần cần UI mới như nút lost-card rollback / replace-card chỉ được thêm service wrapper, chưa thêm nút vào màn hình.

---

## FE đã gắn API

### 1. Check-in booking lookup

Đã gắn endpoint BE mới:

```http
GET /api/parking-sessions/check-in/booking?licensePlate={plate}&buildingId={buildingId}
```

FE dùng tại lúc submit check-in để lấy booking đúng theo biển số và building.

Fallback:

- Nếu endpoint mới lỗi, FE vẫn dùng cache booking từ:
  - `GET /api/bookings/by-building/{buildingId}`
  - fallback `GET /api/bookings`

Files:

- `vehicle-checkin.service.ts`
- `VehicleCheckin.tsx`

---

### 2. Check-in parking session DTO mapping

Đã mở rộng mapping cho các field BE đã có hoặc dự kiến bổ sung:

- `bookingCode`
- `cardStatus`
- `zoneName`
- `vehicleTypeId`
- `vehicleTypeName`
- `plannedCheckoutTime`
- `totalFee`
- `penaltyFee`
- `amountDue`

Fallback vẫn giữ để không vỡ flow nếu BE chưa trả đủ field.

---

### 3. Staff Slot Monitoring

Đã gắn endpoint lọc slot trống theo zone:

```http
GET /api/ParkingSlots/zone/{zoneId}?statuses=Available
```

Cách dùng:

- Grid tổng vẫn load all slot theo zone để hiển thị đủ trạng thái.
- Khi chọn session cần assign slot, FE gọi endpoint filter `Available` để refresh danh sách slot trống cho zone đó.

File:

- `StaffSlotMonitoring.tsx`

---

### 4. Payment breakdown mapping

Đã map các field BE mới trong `PaymentResponseDto`:

- `baseParkingFee` / `BaseParkingFee`
- `incidentFeeTotal` / `IncidentFeeTotal`
- `items` / `Items`

Fallback tên cũ vẫn hỗ trợ:

- `parkingFee`
- `incidentFees`
- `details`

File:

- `vehicle-checkout.service.ts`

---

### 5. Card lookup by code

Đã thêm service wrapper cho endpoint mới:

```http
GET /api/cards/by-code/{cardCode}
```

Hiện tại chỉ thêm service function, chưa đổi UI scan/search card vì user yêu cầu không chỉnh UI.

Function:

- `fetchCheckoutCardByCode(cardCode)`

---

### 6. Incident / Lost Card atomic endpoints

Đã thêm service wrappers:

```http
POST /api/parking-sessions/{id}/lost-card
POST /api/parking-sessions/{id}/lost-card/rollback
PATCH /api/parking-sessions/{id}/replace-card?newCardCode={code}
```

Functions:

- `incidentService.reportLostCard(sessionId, { staffId, description })`
- `incidentService.rollbackLostCard(sessionId)`
- `incidentService.replaceSessionCard(sessionId, newCardCode)`

Chưa thêm button vào UI vì đây là thay đổi UI.

---

## BE còn cần làm

### P1 - Cần để Staff UI hiển thị đủ, giảm gọi phụ

#### 1. Bổ sung `ParkingSessionDto`

FE đang cần các field sau trong `GET /api/parking-sessions/active` và các response session:

```ts
vehicleTypeId: number | null;
vehicleTypeName: string | null;
plannedCheckoutTime: string | null;
zoneName: string | null;
cardStatus: string | null;
```

Hiện FE vẫn fallback bằng `/vehicle-types` và `/cards`, nhưng cách này tốn request và dễ mismatch.

#### 2. Trả rõ `bookingCode` trong session

FE hiện fallback `SS-{id}` nếu không có code.

---

### P2 - Cần cho checkout/monitoring an toàn

#### 3. Thêm fee preview không side-effect

Cần endpoint:

```http
GET /api/parking-sessions/{id}/fee-preview
```

Yêu cầu:

- Không update `checkOutTime`.
- Không đổi trạng thái session.
- Không tạo payment.
- Trả breakdown giống `PaymentResponseDto`.

#### 4. Bổ sung `IncidentDto`

Cần BE trả thêm:

```ts
incidentCode: string;
cardCode: string | null;
vehicleTypeId: number | null;
vehicleTypeName: string | null;
```

FE đã mở type/mapping sẵn.

---

### P3 - Cải thiện data đầy đủ

#### 5. Bổ sung booking lookup response

Endpoint:

```http
GET /api/parking-sessions/check-in/booking
```

Nên trả thêm:

```ts
plannedCheckoutTime: string | null;
depositAmount: number;
```

FE đã map sẵn, hiện fallback `null/0` nếu BE chưa có.

#### 6. Blacklist check detail

Hiện BE check blacklist trả `boolean`.

Nên thêm endpoint detail:

```http
GET /api/Blacklist/check?licensePlate={plate}&cardCode={cardCode}
```

Response đề xuất:

```ts
{
  blocked: boolean;
  targetType: 'VEHICLE' | 'CARD' | 'BOTH' | null;
  reason: string | null;
  incidentId: number | null;
  blacklistId: number | null;
}
```

---

## Validation

Đã chạy:

```powershell
npx tsc --noEmit
```

Kết quả: pass.
