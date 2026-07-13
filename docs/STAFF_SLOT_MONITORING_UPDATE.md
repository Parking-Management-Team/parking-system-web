# Staff Slot Monitoring - cập nhật theo SRS

## Đã làm

- Không dùng lại màn `SlotMonitoring` của `features/facilities` cho Staff nữa.
- Tạo màn Staff riêng:
  - `src/features/staff/components/StaffSlotMonitoring.tsx`
- Tạo component incident riêng có thể tái sử dụng:
  - `src/features/staff/components/StaffIncidentSelector.tsx`
- Cập nhật route Staff Monitoring:
  - `src/app/dashboard/staff/monitoring/page.tsx`
- Export component qua public API của feature Staff:
  - `src/features/staff/index.ts`

## Logic đã chỉnh theo SRS

- Staff chỉ xem nhanh slot để vận hành cổng, không dùng màn quản trị kiểu Manager.
- Màn mới chỉ hiển thị các trạng thái slot cần cho vận hành:
  - `AVAILABLE`
  - `OCCUPIED`
  - `BLOCKED`
  - `MAINTENANCE`
- Không hiển thị `RESERVED` như trạng thái slot chính vì SRS nói Booking không giữ slot cụ thể và `slot_status` không dùng để biểu diễn giữ chỗ booking.
- Không hiển thị chi tiết monthly subscription trong slot card để tránh biến màn Staff thành màn quản lý.
- Có khu vực `Confirm actual slot` để Staff gán slot thực tế cho parking session chưa có slot.
- Đã gắn Card API để slot/session hiển thị đúng `cardCode` và `cardStatus` khi BE active session chỉ trả `cardId`.
- Slot đang `OCCUPIED` có thể bấm vào để mở khung chi tiết lớn ở giữa màn hình:
  - Nền phía sau được làm mờ bằng overlay/backdrop blur.
  - Không còn chiếm cột bên phải làm rối màn hình chính.
  - Có thể đóng bằng nút `x` hoặc click nền mờ.
- License plate
- Slot
- Zone
  - Card code
  - Card status
  - Vehicle type
  - Check-in time
- Trong panel chi tiết có nút `Incidents`.
- Khi bấm `Incidents`, UI xổ danh sách incident type từ BE để Staff chọn nhiều lỗi.
- Incident đã chọn hiển thị dạng chip, có nút `x` để xóa.
- Thêm incident gọi API thật:

```http
POST /api/Incident
```

- Xóa incident gọi API thật:

```http
DELETE /api/Incident/{id}
```

- Khi xác nhận slot, FE gọi:

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

## API đang dùng

- `GET /api/Buildings/paged?pageIndex=1&pageSize=100`
- `GET /api/Floors`
- `GET /api/Zones`
- `GET /api/ParkingSlots/zone/{zoneId}`
- `GET /api/parking-sessions/active`
- `GET /api/cards`
- `GET /api/vehicle-types`
- `GET /api/IncidentType`
- `GET /api/Incident/session/{sessionId}`
- `POST /api/Incident`
- `DELETE /api/Incident/{id}`
- `PATCH /api/parking-sessions/{id}/slot`

## Phần còn thiếu / cần BE cải thiện

### 1. Active session chưa đủ dữ liệu để lọc chính xác xe cần gán slot

Theo SRS:

- Xe máy có thể không cần slot cụ thể.
- Ô tô Walk-in/Booking có thể chưa có slot sau check-in và cần Staff xác nhận slot thực tế.

Hiện `GET /api/parking-sessions/active` trong FE đang map được:

- `id`
- `zoneId`
- `slotId`
- `cardCode`
- `licensePlateIn`
- `checkInTime`

Nhưng chưa chắc có:

- `vehicleTypeId`
- `vehicleTypeName`
- `zoneName`
- `slotCode`

Vì vậy màn `Confirm actual slot` hiện lấy các session chưa có `slotId` làm danh sách cần kiểm tra. Nếu BE bổ sung `vehicleTypeId` hoặc `vehicleTypeName`, FE sẽ lọc chính xác chỉ ô tô cần xác nhận slot.

Đề xuất BE bổ sung vào active session response:

```json
{
  "vehicleTypeId": 1,
  "vehicleTypeName": "CAR",
  "plannedCheckoutTime": "2026-07-10T18:00:00Z",
  "zoneName": "General Zone",
  "slotCode": "A-01"
}
```

FE hiện đã gọi thêm `GET /api/vehicle-types` để map tên loại xe nếu active session có `vehicleTypeId` nhưng thiếu `vehicleTypeName`.

### 2. API slot nên hỗ trợ filter available theo zone

Hiện FE gọi `GET /ParkingSlots/zone/{zoneId}` rồi lọc status ở FE.

Nếu BE có thể hỗ trợ filter rõ hơn thì tốt:

```http
GET /api/ParkingSlots/zone/{zoneId}?statuses=Available
```

hoặc theo enum BE đang dùng.

### 3. Thiếu API preview phí gửi xe an toàn cho màn slot

Màn slot detail cần hiển thị giá tiền hiện tại của xe đang đỗ.

Hiện BE có luồng checkout tính phí qua `PATCH /api/parking-sessions/{id}/checkout/start`, nhưng API này có side effect: ghi nhận checkout time/quy trình checkout. Vì vậy FE không gọi API này trong màn slot detail để tránh làm sai nghiệp vụ.

Đề xuất BE bổ sung API chỉ xem trước phí, không thay đổi session:

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
    "calculatedAt": "2026-07-10T10:00:00Z"
  }
}
```

Khi BE có API này, FE sẽ hiển thị được tiền thật trong slot detail mà không cần bắt đầu checkout.

## Ghi chú kiểm soát

- Không sửa `features/facilities/components/SlotMonitoring.tsx`.
- Không sửa Manager/Admin monitoring.
- Không đổi flow Check-in/Check-out.
- Không tự thêm status `RESERVED` cho Staff.
- Không dùng `isReserved` ở màn Staff vì SRS đã bỏ logic này khỏi `parking_slot`.
