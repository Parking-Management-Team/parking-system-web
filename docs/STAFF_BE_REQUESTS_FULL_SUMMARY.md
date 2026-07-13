# Tổng hợp yêu cầu Backend cho Staff Portal

File này gom lại các điểm FE Staff đã làm và các API/response BE cần bổ sung hoặc chuẩn hóa để demo/triển khai đúng nghiệp vụ.

## 1. Staff Check-in

### FE đã làm

- Gắn API check-in thật:
  - `POST /api/parking-sessions/check-in`
  - `GET /api/parking-sessions/active`
- Gắn Card API để chọn thẻ:
  - `GET /api/cards`
- Gắn Booking detection theo biển số:
  - `GET /api/bookings/by-building/{buildingId}`
  - fallback `GET /api/bookings`
- Gắn Vehicle Type API:
  - `GET /api/vehicle-types`
- Gắn Blacklist API để chặn trước ở FE nếu có dữ liệu:
  - `GET /api/Blacklist`
- Khi booking match theo biển số, FE hiển thị:
  - Booking code
  - Deposit
  - Check-in grace
  - Expected check-in
  - Expected check-out
  - Building
  - Vehicle type

### BE cần chuẩn hóa/bổ sung

1. `GET /api/bookings/by-building/{buildingId}` cần trả đủ:

```json
{
  "id": 1,
  "licensePlate": "51A-12345",
  "vehicleTypeId": 1,
  "vehicleTypeName": "CAR",
  "buildingId": 1,
  "buildingName": "Building A",
  "plannedCheckinTime": "2026-07-10T08:00:00Z",
  "plannedCheckoutTime": "2026-07-10T18:00:00Z",
  "depositAmount": 30000,
  "bookingStatus": "CONFIRMED",
  "checkinGraceUntil": "2026-07-10T08:30:00Z"
}
```

2. `POST /api/parking-sessions/check-in` nên tự kiểm tra ở BE:

- Card hợp lệ/AVAILABLE.
- Xe đang có active session hay chưa.
- Booking còn hợp lệ không.
- Vehicle/card blacklist.
- Pricing policy hợp lệ.
- Capacity/zone phù hợp.

3. Response check-in nên trả đủ để FE overlay hiển thị chính xác:

```json
{
  "id": 1,
  "licensePlateIn": "51A-12345",
  "cardId": 1,
  "cardCode": "CARD001",
  "vehicleTypeId": 1,
  "vehicleTypeName": "CAR",
  "bookingId": 1,
  "bookingCode": "BK-0001",
  "plannedCheckoutTime": "2026-07-10T18:00:00Z",
  "checkInTime": "2026-07-10T08:05:00Z",
  "zoneId": 1,
  "zoneCode": "GENERAL-F1",
  "slotId": null,
  "slotCode": null,
  "sessionStatus": "ACTIVE"
}
```

4. `GET /api/parking-sessions/active` nên trả thêm:

- `vehicleTypeId`
- `vehicleTypeName`
- `bookingCode`
- `plannedCheckoutTime`
- `zoneName`
- `slotCode`
- `cardCode`

Hiện FE vẫn chạy nếu thiếu, nhưng không hiển thị đầy đủ được.

## 2. Staff Slot Monitoring / Confirm actual slot

### FE đã làm

- Tạo màn Staff Slot riêng, không dùng màn Manager/Facility.
- Gọi:
  - `GET /api/Buildings/paged`
  - `GET /api/Floors`
  - `GET /api/Zones`
  - `GET /api/ParkingSlots/zone/{zoneId}`
  - `GET /api/parking-sessions/active`
  - `GET /api/cards`
  - `GET /api/vehicle-types`
  - `PATCH /api/parking-sessions/{id}/slot`
- Slot occupied có thể click để xem detail bằng modal full màn hình/blur.
- Slot detail hiện check-in đủ ngày và giờ.
- Vehicle type trong slot detail được map từ `GET /api/vehicle-types` nếu active session chưa trả tên loại xe.
- Gán slot thực tế bằng body đúng DTO BE:

```json
{
  "zoneId": 1,
  "slotId": 1
}
```

### BE cần chuẩn hóa/bổ sung

1. `GET /api/parking-sessions/active` cần trả đủ session-slot-card data:

```json
{
  "id": 1,
  "vehicleId": 1,
  "cardId": 1,
  "cardCode": "CARD001",
  "licensePlateIn": "51A-12345",
  "vehicleTypeId": 1,
  "vehicleTypeName": "CAR",
  "zoneId": 1,
  "zoneCode": "GENERAL-F1",
  "zoneName": "Car Zone F1",
  "slotId": 1,
  "slotCode": "ZC01-01",
  "checkInTime": "2026-07-10T08:05:00Z",
  "plannedCheckoutTime": "2026-07-10T18:00:00Z",
  "sessionStatus": "ACTIVE"
}
```

Nếu BE không trả `vehicleTypeName`, FE có thể map từ `vehicleTypeId` qua `GET /api/vehicle-types`. Nhưng tốt nhất active session trả sẵn cả `vehicleTypeId` và `vehicleTypeName`.

Nếu BE không trả `plannedCheckoutTime`, Staff không kiểm soát được xe booking dự kiến ra ngày nào trong Slot Monitoring.

2. `GET /api/ParkingSlots/zone/{zoneId}` nên hỗ trợ filter available:

```http
GET /api/ParkingSlots/zone/{zoneId}?statuses=Available
```

3. Không dùng `isReserved` cho slot nếu theo SRS đã bỏ field này. Booking giữ capacity ở Building, không giữ slot cụ thể.

4. `GET /api/ParkingSlots/zone/{zoneId}` nếu có thể nên trả thêm:

```json
{
  "id": 1,
  "zoneId": 1,
  "code": "ZC01-01",
  "status": "Occupied",
  "vehicleTypeId": 1,
  "occupiedLicensePlate": "51A-12345"
}
```

Nhưng nguồn chính để biết xe/card/session đang chiếm slot vẫn nên là `GET /api/parking-sessions/active`.

## 3. Fee preview cho Staff Slot Detail

### FE hiện tại

- FE chưa hiển thị tiền thật trong slot detail vì không có API preview fee an toàn.
- FE không gọi `checkout/start` ở slot detail vì API này có side effect: ghi nhận checkout time/quy trình checkout.

### BE cần thêm

API preview phí không thay đổi session:

```http
GET /api/parking-sessions/{id}/fee-preview
```

Response đề xuất:

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
        "amount": 100000
      }
    ]
  }
}
```

## 4. Incident Handling / Incident selector

### FE đã làm

- Tạo component incident tái sử dụng:
  - `StaffIncidentSelector`
- Dùng trong slot detail.
- Gọi API thật:
  - `GET /api/IncidentType`
  - `GET /api/Incident/session/{sessionId}`
  - `POST /api/Incident`
  - `DELETE /api/Incident/{id}`
- Staff có thể chọn nhiều incident type cho một session.
- Incident đã chọn có thể xóa bằng nút `x`.

### BE cần chuẩn hóa/bổ sung

1. `GET /api/IncidentType` cần trả:

```json
{
  "id": 1,
  "incidentCode": "LOST_CARD",
  "incidentName": "Lost card",
  "description": "Customer lost parking card",
  "defaultPenaltyFee": 100000
}
```

2. `POST /api/Incident` hiện FE gửi:

```json
{
  "sessionId": 1,
  "incidentTypeId": 1,
  "description": "Lost card - 51A-12345 - CARD001",
  "penaltyFee": 100000
}
```

3. `GET /api/Incident/session/{sessionId}` cần trả đủ:

- `id`
- `sessionId`
- `incidentTypeId`
- `incidentCode`
- `incidentName`
- `description`
- `penaltyFee`
- `status`
- `createdAt`
- `resolvedAt`
- `licensePlate`
- `cardCode`

4. Cần rule rõ cho incident fee:

- OPEN/PROCESSING incident có được tính vào checkout payment không?
- CANCELLED incident không tính phí.
- RESOLVED incident có tính phí nếu đã thanh toán không?

Đề xuất: checkout payment tính các incident đang `OPEN` hoặc `PROCESSING` có `penaltyFee > 0`, trừ khi BE có field riêng `isChargeable`.

## 5. Staff Check-out / Payment

### FE đã làm

- Luồng checkout vận hành nhanh:
  - Search card/plate.
  - Load checked-in info.
  - Nhập plate out để đối chiếu.
  - Start checkout.
  - Tạo payment.
  - Complete checkout khi paid.
- Checkout summary full screen có:
  - Total to pay
  - Parking fee
  - Incident fees
  - Added incident fees
- Không hiển thị quá nhiều internal ids cho Staff.

### BE cần chuẩn hóa/bổ sung

1. Payment checkout nên trả breakdown:

```json
{
  "id": 1,
  "sessionId": 1,
  "amount": 130000,
  "parkingFee": 30000,
  "incidentFees": 100000,
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "paymentUrl": null,
  "qrCodeUrl": null,
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

2. Không tạo payment source riêng theo `incidentId` nếu SRS vẫn giữ rule payment chỉ có một nguồn chính:

- `session_id`
- `booking_id`
- `monthly_subscription_id`

Incident fee nên là breakdown/detail của session payment.

3. Cần API completed checkout/history rõ:

```http
GET /api/parking-sessions/completed
```

hoặc filter:

```http
GET /api/parking-sessions?status=COMPLETED
```

Response nên có:

- license plate
- card code
- vehicle type
- check-in time
- check-out time
- duration
- amount paid
- payment method
- payment status

## 6. Card Management / Lost Card

### FE đã làm

- Card Management dùng:
  - `GET /api/cards`
  - `POST /api/cards`
  - `PUT /api/cards/{id}/status`
- Slot/check-in/check-out dùng Card API để map `cardId -> cardCode`.

### BE cần chuẩn hóa/bổ sung

1. Card status nên thống nhất enum trả về:

- `AVAILABLE`
- `ACTIVE` hoặc `ASSIGNED`
- `LOST`
- `BLOCKED`

Hiện cần thống nhất giữa BE và FE vì có nơi dùng `Active`, `Available`, `Assigned`.

2. Lost card nên có endpoint atomic để đúng nghiệp vụ:

```http
POST /api/incidents/lost-card
```

hoặc:

```http
POST /api/parking-sessions/{id}/lost-card
```

Endpoint này nên làm cùng lúc:

- tạo incident LOST_CARD
- update card status LOST
- cộng penalty vào checkout payment/breakdown

3. Cần rollback/cancel lost card nếu Staff bấm nhầm:

```http
POST /api/incidents/{id}/cancel
```

hoặc dùng `PATCH /api/Incident/{id}/status` sang `CANCELLED`, đồng thời restore card nếu hợp lệ.

## 7. Blacklist

### FE đã làm

- Check-in dùng blacklist list để pre-check plate/card.
- Incident unpaid có thể tạo blacklist nếu BE trả đủ vehicleId/cardId/incidentId.

### BE cần chuẩn hóa/bổ sung

1. API check nhanh blacklist theo plate/card:

```http
GET /api/Blacklist/check?licensePlate=51A-12345&cardCode=CARD001
```

Response:

```json
{
  "success": true,
  "data": {
    "blocked": true,
    "target": "VEHICLE",
    "reason": "Unpaid incident",
    "incidentId": 1
  }
}
```

2. Check-in BE phải tự chặn blacklist, FE pre-check chỉ là hỗ trợ UI.

## 8. Manager notification / Shift report

### FE expectation

- Staff gửi report hoặc incident quan trọng thì Manager thấy thông báo.

### BE cần thêm/xác nhận

1. API tạo notification cho Manager khi:

- Staff tạo incident nghiêm trọng.
- Staff report unpaid/refuse payment.
- Staff gửi shift report.

2. Nếu đã có notification endpoint, cần docs rõ:

- endpoint
- request body
- target role/user
- status read/unread

## Ưu tiên BE nên làm trước để demo mượt

1. Bổ sung `vehicleTypeId`, `vehicleTypeName`, `cardCode`, `zoneName`, `slotCode`, `plannedCheckoutTime` vào `GET /parking-sessions/active`.
2. Thêm `GET /parking-sessions/{id}/fee-preview`.
3. Chuẩn hóa incident fee được cộng vào checkout payment breakdown.
4. Chuẩn hóa Card status enum.
5. Thêm API blacklist check nhanh.
6. Thêm completed checkout history API.
