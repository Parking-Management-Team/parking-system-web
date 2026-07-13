# Staff Monitoring - Backend status sau khi pull API mới nhất

Ngày cập nhật: 2026-07-10

## Kết quả pull backend

Repo backend:

```txt
parking-system-api
branch: main
remote: origin/main
result: Already up to date
```

Nghĩa là local backend hiện tại đã là bản mới nhất từ Git. Không có commit mới được kéo về trong lần pull này.

## Màn FE đang cần backend hỗ trợ

Màn:

```txt
/dashboard/staff/monitoring
```

Mục tiêu màn này:

```txt
Staff xem nhanh trạng thái slot
→ bấm slot đang có xe
→ xem chi tiết xe/thẻ/loại xe/ngày giờ check-in/dự kiến ra
→ chọn incident nếu có lỗi
→ xác nhận actual slot cho session chưa có slot
```

## API backend hiện đã có và FE đang dùng được

### 1. Lấy building

```http
GET /api/Buildings/paged?pageIndex=1&pageSize=100
```

FE dùng để chọn Building trong Staff Monitoring.

### 2. Lấy floor

```http
GET /api/Floors
```

FE dùng để chọn Floor theo Building.

### 3. Lấy zone

```http
GET /api/Zones
GET /api/Zones/floor/{floorId}
```

FE hiện đang dùng `GET /api/Zones`, sau đó tự lọc theo `floorId`.

### 4. Lấy slot theo zone

Backend hiện có:

```http
GET /api/ParkingSlots/zone/{zoneId}
```

Controller hiện đã hỗ trợ query:

```http
GET /api/ParkingSlots/zone/{zoneId}?statuses=Available&vehicleTypeIds=1&search=ZC01
```

Code BE hiện tại:

```csharp
[HttpGet("zone/{zoneId}")]
public async Task<IActionResult> GetSlotsByZone(
    int zoneId,
    [FromQuery] List<SlotStatus>? statuses = null,
    [FromQuery] List<int>? vehicleTypeIds = null,
    [FromQuery] string? search = null)
```

Enum slot hiện có:

```txt
Available
Occupied
Blocked
Maintenance
```

Response DTO hiện có:

```json
{
  "id": 1,
  "zoneId": 1,
  "vehicleTypeId": 1,
  "code": "ZC01-01",
  "name": "Slot 01",
  "status": "Occupied",
  "occupiedLicensePlate": "51A-12345"
}
```

Đánh giá: đủ cho FE hiển thị slot grid và filter slot trống.

### 5. Lấy vehicle type

Backend hiện có:

```http
GET /api/vehicle-types
```

Response DTO hiện có:

```json
{
  "id": 1,
  "name": "Car",
  "description": "Car",
  "vehicleTypeStatus": "ACTIVE"
}
```

FE đã gắn API này để map `vehicleTypeId -> vehicleTypeName`.

### 6. Lấy active parking sessions

Backend hiện có:

```http
GET /api/parking-sessions/active
```

DTO hiện tại:

```json
{
  "id": 1,
  "vehicleId": 1,
  "buildingId": 1,
  "cardId": 1,
  "zoneId": 1,
  "slotId": 1,
  "bookingId": null,
  "monthlySubscriptionId": null,
  "inStaffId": 2,
  "outStaffId": null,
  "checkInTime": "2026-07-10T08:00:00Z",
  "checkOutTime": null,
  "licensePlateIn": "51A-12345",
  "licensePlateOut": null,
  "sessionStatus": "ACTIVE",
  "cardCode": "CARD001",
  "zoneCode": "GENERAL-F1",
  "slotCode": "ZC01-01"
}
```

Đánh giá: FE dùng được để map xe đang nằm ở slot nào, nhưng còn thiếu field quan trọng cho Staff Monitoring.

### 7. Gán actual slot cho session

Backend hiện có:

```http
PATCH /api/parking-sessions/{id}/slot
```

Body đúng theo DTO BE:

```json
{
  "zoneId": 1,
  "slotId": 1
}
```

Đánh giá: FE đã dùng được để Staff confirm actual slot.

### 8. Card API

Backend hiện có:

```http
GET /api/cards
```

FE dùng để map `cardId -> cardCode/cardStatus` nếu active session thiếu card detail.

### 9. Incident API

Backend hiện có:

```http
GET /api/IncidentType
GET /api/Incident/session/{sessionId}
POST /api/Incident
DELETE /api/Incident/{id}
PATCH /api/Incident/{id}/status
```

FE đã dùng để Staff chọn/xóa incident ngay trong slot detail modal.

## Backend còn thiếu cho Staff Monitoring

### Thiếu 1: Active session chưa trả vehicle type

Hiện `ParkingSessionDto` chưa có:

```txt
vehicleTypeId
vehicleTypeName
```

FE đang phải fallback:

```txt
activeSession.vehicleTypeName
→ activeSession.vehicleTypeId map qua /vehicle-types
→ slot.vehicleTypeId hoặc zone.vehicleTypeId map qua /vehicle-types
```

Nhưng cách fallback này không chắc 100% vì session mới là nguồn nghiệp vụ chính.

Backend nên thêm vào `ParkingSessionDto`:

```csharp
public int? VehicleTypeId { get; set; }
public string? VehicleTypeName { get; set; }
```

Response mong muốn:

```json
{
  "id": 1,
  "vehicleTypeId": 1,
  "vehicleTypeName": "Car"
}
```

Lý do:

- Staff cần kiểm soát loại xe ngay khi xem slot occupied.
- FE không nên đoán loại xe từ zone/slot vì session là dữ liệu đúng nhất.

### Thiếu 2: Active session chưa trả planned checkout time

Hiện `ParkingSessionDto` chưa có:

```txt
plannedCheckoutTime
```

Màn Staff Monitoring cần hiện ngày/giờ dự kiến ra để kiểm soát xe booking.

Backend nên thêm:

```csharp
public DateTime? PlannedCheckoutTime { get; set; }
```

Nguồn lấy:

- Nếu session từ booking: lấy `booking.plannedCheckoutTime`.
- Nếu walk-in: có thể `null`.
- Nếu monthly: có thể `null` hoặc field riêng nếu BE có nghiệp vụ dự kiến rời.

Response mong muốn:

```json
{
  "plannedCheckoutTime": "2026-07-10T18:00:00Z"
}
```

### Thiếu 3: Active session chỉ có zoneCode, chưa có zoneName

Hiện DTO có:

```txt
zoneCode
```

Nhưng Staff UI cần tên dễ đọc:

```txt
Car Zone F1
Motorbike Zone F1
```

Backend nên thêm:

```csharp
public string? ZoneName { get; set; }
```

Response mong muốn:

```json
{
  "zoneCode": "CZ-F1",
  "zoneName": "Car Zone F1"
}
```

### Thiếu 4: Active session chưa trả card status

Hiện active session có `cardId` và `cardCode`, nhưng chưa có:

```txt
cardStatus
```

FE đang phải gọi thêm:

```http
GET /api/cards
```

rồi map `cardId -> cardStatus`.

Backend nên thêm nếu muốn giảm request:

```csharp
public string? CardStatus { get; set; }
```

Response mong muốn:

```json
{
  "cardId": 1,
  "cardCode": "CARD001",
  "cardStatus": "ASSIGNED"
}
```

### Thiếu 5: Chưa có fee preview API an toàn

Staff Slot Detail cần hiện tiền hiện tại của xe trong slot.

Hiện backend có:

```http
PATCH /api/parking-sessions/{id}/checkout/start
```

Nhưng API này có side effect:

- ghi nhận checkout time
- bắt đầu checkout flow

FE không được gọi API này chỉ để xem tiền trong monitoring.

Backend nên thêm API chỉ preview, không thay đổi session:

```http
GET /api/parking-sessions/{id}/fee-preview
```

Response mong muốn:

```json
{
  "success": true,
  "data": {
    "sessionId": 1,
    "parkingFee": 30000,
    "incidentFees": 100000,
    "totalAmount": 130000,
    "calculatedAt": "2026-07-10T10:00:00Z",
    "details": [
      {
        "name": "Parking fee",
        "amount": 30000
      },
      {
        "name": "Lost card",
        "amount": 100000,
        "incidentId": 1
      }
    ]
  }
}
```

### Thiếu 6: Incident DTO thiếu thông tin để Staff xem ngay trong slot detail

`IncidentDto` hiện có:

```txt
id
sessionId
licensePlate
incidentTypeId
incidentName
description
penaltyFee
status
createdAt
resolvedAt
```

Nên bổ sung:

```txt
incidentCode
sessionCode
cardId
cardCode
vehicleId
vehicleTypeId
vehicleTypeName
```

Response mong muốn:

```json
{
  "id": 1,
  "sessionId": 1,
  "sessionCode": "SS-0001",
  "incidentTypeId": 1,
  "incidentCode": "LOST_CARD",
  "incidentName": "Lost card",
  "licensePlate": "51A-12345",
  "cardId": 1,
  "cardCode": "CARD001",
  "vehicleId": 1,
  "vehicleTypeId": 1,
  "vehicleTypeName": "Car",
  "penaltyFee": 100000,
  "status": "OPEN",
  "createdAt": "2026-07-10T10:00:00Z",
  "resolvedAt": null
}
```

### Thiếu 7: Payment response chưa có fee breakdown

`PaymentResponseDto` hiện có:

```txt
id
sessionId
bookingId
monthlySubscriptionId
amount
paymentMethod
paymentStatus
paymentTime
orderCode
paymentUrl
qrCodeUrl
```

Để Staff thấy tiền trong checkout/monitoring rõ ràng, nên thêm:

```txt
parkingFee
incidentFees
details[]
```

Response mong muốn:

```json
{
  "id": 1,
  "sessionId": 1,
  "amount": 130000,
  "parkingFee": 30000,
  "incidentFees": 100000,
  "details": [
    {
      "name": "Parking fee",
      "amount": 30000
    },
    {
      "name": "Lost card",
      "amount": 100000,
      "incidentId": 1
    }
  ]
}
```

## Response active session đề xuất đầy đủ cho Staff Monitoring

Backend nên chỉnh `GET /api/parking-sessions/active` trả được dạng này:

```json
{
  "id": 1,
  "vehicleId": 1,
  "vehicleTypeId": 1,
  "vehicleTypeName": "Car",
  "buildingId": 1,
  "cardId": 1,
  "cardCode": "CARD001",
  "cardStatus": "ASSIGNED",
  "zoneId": 1,
  "zoneCode": "CZ-F1",
  "zoneName": "Car Zone F1",
  "slotId": 1,
  "slotCode": "ZC01-01",
  "bookingId": 10,
  "monthlySubscriptionId": null,
  "checkInTime": "2026-07-10T08:00:00Z",
  "plannedCheckoutTime": "2026-07-10T18:00:00Z",
  "licensePlateIn": "51A-12345",
  "sessionStatus": "ACTIVE"
}
```

## Ưu tiên backend nên làm trước

1. Bổ sung `vehicleTypeId`, `vehicleTypeName`, `plannedCheckoutTime`, `zoneName`, `cardStatus` vào `ParkingSessionDto`.
2. Thêm `GET /api/parking-sessions/{id}/fee-preview`.
3. Bổ sung incident response có `incidentCode`, `cardCode`, `vehicleId`, `cardId`, `vehicleTypeName`.
4. Bổ sung payment breakdown: `parkingFee`, `incidentFees`, `details`.
5. Giữ slot status đúng enum hiện tại: `Available`, `Occupied`, `Blocked`, `Maintenance`; không thêm `Reserved` vào slot status.
