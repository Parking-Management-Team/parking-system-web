# Staff BE TODO - Các phần Backend còn cần làm

## Mục tiêu

Danh sách này là các phần BE cần bổ sung để Staff Portal gắn API đầy đủ hơn, giảm fallback ở FE và tránh các flow có side-effect không mong muốn.

---

## P1 - Cần làm sớm

### 1. Bổ sung field cho `ParkingSessionDto`

Các endpoint liên quan:

```http
GET /api/parking-sessions/active
GET /api/parking-sessions
POST /api/parking-sessions/check-in
PATCH /api/parking-sessions/{id}/slot
PATCH /api/parking-sessions/{id}/checkout/start
```

FE cần BE trả thêm các field sau trong session DTO:

```ts
vehicleTypeId: number | null;
vehicleTypeName: string | null;
plannedCheckoutTime: string | null;
zoneName: string | null;
cardStatus: string | null;
bookingCode: string | null;
```

### Lý do

Hiện FE phải gọi phụ:

- `/vehicle-types` để map loại xe.
- `/cards` để map card status.
- Zone chỉ có `zoneCode`, thiếu tên hiển thị rõ.

Việc này làm Staff Monitoring/Check-out dễ mismatch dữ liệu và tốn request.

---

## P1 - Confirm response nhất quán cho check-in booking lookup

Endpoint:

```http
GET /api/parking-sessions/check-in/booking?licensePlate={plate}&buildingId={buildingId}
```

BE nên trả đầy đủ:

```ts
bookingId: number;
bookingCode: string;
licensePlate: string;
vehicleTypeId: number;
vehicleTypeName: string;
buildingId: number;
buildingName: string;
plannedCheckinTime: string | null;
plannedCheckoutTime: string | null;
checkinGraceUntil: string | null;
depositAmount: number;
bookingStatus: string;
```

### Lý do

FE đã map sẵn các field này. Nếu BE thiếu:

- `plannedCheckoutTime` sẽ hiển thị `—` hoặc `Not scheduled`.
- `depositAmount` sẽ fallback `0`.

---

## P2 - Thêm fee preview không side-effect

Cần endpoint mới:

```http
GET /api/parking-sessions/{id}/fee-preview
```

### Yêu cầu quan trọng

Endpoint này không được:

- Update `checkOutTime`.
- Đổi trạng thái session.
- Tạo payment.
- Release card.
- Release slot.

### Response đề xuất

```ts
{
  sessionId: number;
  baseParkingFee: number;
  incidentFeeTotal: number;
  amountDue: number;
  items: PaymentBreakdownItemDto[];
}
```

```ts
type PaymentBreakdownItemDto = {
  type: string;
  name: string;
  amount: number;
  incidentId?: number | null;
};
```

### Lý do

Màn Staff Slot Monitoring cần xem phí dự kiến nhưng không thể gọi:

```http
PATCH /api/parking-sessions/{id}/checkout/start
```

vì API đó có side-effect ghi nhận giờ checkout thật.

---

## P2 - Bổ sung field cho `IncidentDto`

Các endpoint liên quan:

```http
GET /api/Incident
GET /api/Incident/{id}
GET /api/Incident/session/{sessionId}
POST /api/Incident
```

FE cần BE trả thêm:

```ts
incidentCode: string;
cardCode: string | null;
vehicleTypeId: number | null;
vehicleTypeName: string | null;
```

### Lý do

Staff incident page và slot detail cần hiển thị incident rõ theo card/vehicle type, không chỉ ID.

---

## P2 - Lost card response nên trả session/card/incident mới nhất

Các endpoint:

```http
POST /api/parking-sessions/{id}/lost-card
POST /api/parking-sessions/{id}/lost-card/rollback
PATCH /api/parking-sessions/{id}/replace-card?newCardCode={code}
```

Response nên trả tối thiểu:

```ts
{
  sessionId: number;
  oldCardId?: number | null;
  oldCardCode?: string | null;
  newCardId?: number | null;
  newCardCode?: string | null;
  cardStatus: string;
  incidentId?: number | null;
  penaltyFee?: number | null;
  sessionStatus: string;
}
```

### Lý do

FE đã có service wrappers nhưng chưa thêm UI. Khi thêm UI, cần response này để cập nhật màn hình ngay không cần reload nhiều API.

---

## P3 - Blacklist check detail

Hiện BE check blacklist chủ yếu trả boolean.

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

### Lý do

Staff cần biết vì sao xe/thẻ bị chặn để báo lại cho khách.

---

## P3 - Chuẩn hóa enum/status string

Các status nên trả dạng string thống nhất:

### Parking slot

```ts
'Available' | 'Occupied' | 'Blocked' | 'Maintenance'
```

Không dùng `Reserved` cho slot vì booking giữ theo capacity, không giữ slot cụ thể.

### Session

```ts
'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'LOST_CARD_REPORTED'
```

### Incident

```ts
'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CANCELLED'
```

---

## Tóm tắt ưu tiên

| Priority | Việc cần làm |
|---|---|
| P1 | Bổ sung field cho `ParkingSessionDto` |
| P1 | Booking lookup trả đủ `plannedCheckoutTime`, `depositAmount` |
| P2 | Thêm `fee-preview` không side-effect |
| P2 | Bổ sung field cho `IncidentDto` |
| P2 | Lost card response trả session/card/incident mới nhất |
| P3 | Blacklist check detail |
| P3 | Chuẩn hóa enum/status string |
