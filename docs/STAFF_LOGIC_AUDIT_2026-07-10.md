# Staff logic audit sau khi merge main

Ngày kiểm tra: 2026-07-10

## Kết quả Git/conflict

- Local branch: `feature/staff-only-fixes`.
- Đã fetch `origin`.
- Local đã fast-forward lên `origin/feature/staff-only-fixes`.
- Đã merge `origin/main` vào feature.
- Conflict thật phát sinh ở:
  - `src/features/vehicles/components/VehicleCheckin.tsx`
- Đã resolve bằng cách giữ cả hai luồng:
  - Load Vehicle Type thật từ BE.
  - Reallocate slot từ main.
  - Booking query theo `currentBuildingId`, không hard-code building cũ.

## Đối chiếu SRS/API với Staff code

### Check-in

Phù hợp:

- Staff nhập biển số, loại xe, card code.
- FE load card thật, active sessions thật.
- FE gọi `POST /api/parking-sessions/check-in`.
- FE refresh active sessions.
- FE có blacklist pre-check bằng dữ liệu hiện có.
- Vehicle Type cố gắng lấy từ `GET /api/vehicle-types`, fallback tạm nếu API lỗi.

Cần Backend bổ sung:

- Check blacklist theo biển số tại BE hoặc endpoint `check-license-plate`.
- Booking/monthly check-in đầy đủ theo SRS nếu cần làm thật.
- API chính thức cho reallocate/override slot cần xác nhận DTO.

### Check-out

Phù hợp:

- Staff search card/plate để load active session.
- Staff nhập biển số ra để đối chiếu.
- FE gọi checkout start, payment, rollback.
- Payment `PENDING` không xem là complete.
- Payment `PAID` mới resolve selected incidents.
- Summary hiển thị `TOTAL TO PAY`, parking fee, incident fees.

Cần Backend bổ sung:

- Payment breakdown thật thay vì FE tự suy ra parking fee = amount - incidentTotal.
- Payment history theo session để checkout history có amount/method/status thật.

### Incident / lost card

Phù hợp:

- Incident type lấy từ BE.
- Chọn incident tạo record thật.
- Xóa incident gọi API thật.
- Lost card hiện gọi Card status API `Lost`.

Cần Backend bổ sung:

- Atomic lost-card endpoint.
- Rollback lost-card endpoint.
- Incident status/payment rule rõ ràng để không lệch phí khi chuyển `PROCESSING`.

## Điểm cần lưu ý

- FE hiện tính `Parking fee = payment.amount - selected incident fee` để hiển thị. Đây chỉ là hiển thị tạm; Backend nên trả breakdown chính thức.
- Không nên tạo payment nguồn `incident_id` riêng nếu chưa sửa SRS/schema, vì SRS quy định payment có đúng một nguồn chính: session/booking/monthly.
- File docs cũ `STAFF_BACKEND_REQUESTS_2026-07-05.md` không còn trong HEAD hiện tại, nên đã tạo file mới ngày 2026-07-10.

