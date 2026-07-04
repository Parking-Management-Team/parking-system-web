# Staff Gate Rework Progress

Ngày bắt đầu: 2026-06-30

## Mục tiêu

- Làm lại Staff Vehicle Check-in theo UI cổng vào: form bên trái, camera demo bên phải.
- Bỏ danh sách Booking hiển thị sẵn khỏi Check-in.
- Khi nhập biển số, nếu BE có Booking phù hợp thì hiển thị mã Booking theo biển số.
- Confirm Check-in hiển thị full-screen success màu xanh trong 3 giây, có thông tin xe/thẻ/thời gian vào/loại xe.
- Lỗi check-in/blacklist/trùng thẻ hiển thị full-screen error màu đỏ trong 3 giây.
- Làm lại Staff Vehicle Check-out theo flow quẹt thẻ/nhập biển số, search active session, đối chiếu biển số, tạo payment/tính tiền bằng BE, complete checkout.
- Card Staff bỏ hoàn toàn luồng Monthly Card, chỉ giữ một luồng parking card.

## API/Docs đã đọc

- Đã đọc source controller/service/DTO BE liên quan đến Parking Session, Booking, Payment, Card, Blacklist.
- Đã đọc nghiệp vụ chính từ `PBMS-SRS-main/PBMS-SRS-main/PBMS_SRS_Document.md` cho luồng cổng vào/cổng ra.

## Trạng thái thực hiện

| Phần | Trạng thái | Ghi chú |
|---|---:|---|
| Đọc API BE | Đã làm phần chính | Đã xác nhận check-in/check-out/payment/card/booking/blacklist. |
| Staff Check-in UI/API | Đã làm | UI form trái + camera demo phải. Booking không còn list sẵn; chỉ detect theo biển số. Success/error overlay full màn hình 3 giây. |
| Staff Check-out UI/API | Đã làm | Flow search card/plate, history, filter, 2 panel check-in/check-out, confirm tạo payment từ BE. |
| Staff Card | Đã làm | Staff UI chỉ còn PARKING_CARD; bỏ Monthly khỏi filter/create/list Staff Card. |
| Build kiểm tra | Đã pass | `npm run build` pass sau lần chỉnh compact UI. Còn warning cũ ở module khác, không thuộc phạm vi sửa lần này. |
| Merge conflict với `origin/main` | Đã xử lý | Resolve conflict ở `VehicleCheckin.tsx` và `vehicle-checkin.service.ts`, build pass. |

## Merge conflict resolution - 2026-07-04

### Nguyên nhân conflict

- GitHub PR báo conflict vì `origin/main` đã có thay đổi mới ở cùng khu vực Staff Check-in.
- Conflict xảy ra ở 2 file:
  - `src/features/vehicles/components/VehicleCheckin.tsx`
  - `src/features/vehicles/services/vehicle-checkin.service.ts`

### Cách đã resolve

- `VehicleCheckin.tsx`
  - Giữ bản Staff Gate Check-in mới của branch `feature/staff-only-fixes`.
  - Không kéo lại UI/mock cũ từ `main` như zone/slot/monthly/booking static list.
  - Mục tiêu là chỉ resolve để merge được, không thay đổi lại FE flow check-in hiện tại.

- `vehicle-checkin.service.ts`
  - Giữ phần booking support của branch:
    - `bookingId?: number`
    - `VehicleCheckinBooking`
    - `fetchCheckinBookingsByBuilding`
    - `fetchCheckinBookings`
    - map thêm `vehicleId`, `buildingId`.
  - Giữ thêm phần service mới từ `main` để tránh làm mất API export nếu code khác cần:
    - `randomizeSlot?: boolean`
    - `checkEntryConditions`
    - `updateCheckinInfo`

### Kiểm tra sau resolve

- Đã kiểm tra không còn conflict marker:
  - `<<<<<<<`
  - `=======`
  - `>>>>>>>`
- Đã chạy `npm run build`.
- Kết quả: build pass, chỉ còn warning cũ ngoài phạm vi conflict.

## API đã xác nhận dùng được

### Check-in

- `POST /api/parking-sessions/check-in`
  - Body: `licensePlate`, `vehicleTypeId`, `cardCode`, `buildingId?`, `staffId?`, `bookingId?`, `monthlySubscriptionId?`.
  - BE tự kiểm tra:
    - Card tồn tại/khả dụng.
    - Xe đã có active session.
    - Card đang active.
    - Booking confirmed/grace nếu truyền `bookingId`.
    - Nếu không truyền `bookingId`, BE có logic tự tìm booking confirmed theo biển số + building + grace window.
    - Slot/zone capacity.

- `GET /api/parking-sessions/active`
  - Dùng để refresh active sessions sau check-in.

### Booking

- `GET /api/bookings`
- `GET /api/bookings/by-building/{buildingId}`
- Không có endpoint `GET /api/bookings/active`.
- FE sẽ lấy booking theo building hoặc all rồi lọc theo biển số/status/grace ở FE để chỉ hiển thị mã booking khi người dùng nhập biển số.
- `BookingDto` BE hiện không có field `bookingCode`; FE tạm hiển thị mã dạng `BK-{id}`.

### Check-out/Payment

- `GET /api/parking-sessions/active`
- `PATCH /api/parking-sessions/{id}/checkout/start`
  - Ghi nhận `checkOutTime`, `licensePlateOut`, `outStaffId`.
- `POST /api/payments`
  - Body: `sessionId`, `paymentMethod`.
  - BE tự tính tiền theo session/checkIn/checkOut/pricing policy/booking deposit/penalty.
  - Với `CASH`, BE tạo payment `PAID` và tự complete business flow.
  - Với `ONLINE_BANKING`, BE trả `PENDING` + payment url nếu gateway hoạt động.
- `PATCH /api/parking-sessions/{id}/complete`
  - Có sẵn, nhưng với CASH payment BE đã gọi complete trong payment service.

### Incident / Report manager

- `GET /api/IncidentType`
- `POST /api/Incident`
- Dùng cho nút `Report to manager` ở màn hình thanh toán check-out.
- FE chỉ tạo incident nếu tìm được incident type phù hợp với unpaid/refused payment:
  - `UNPAID_VEHICLE`
  - hoặc code/name có `UNPAID`, `PAYMENT`, `REFUSE`, `KHÔNG THANH TOÁN`.

### Card

- `GET /api/cards`
- `POST /api/cards`
- `PUT /api/cards/{id}/status`
- `GET /api/cards/by-code/{cardCode}`

### Blacklist

- `GET /api/Blacklist`
- `GET /api/Blacklist/check-vehicle/{vehicleId}`
- `GET /api/Blacklist/check-card/{cardId}`
- Không có endpoint check blacklist trực tiếp bằng licensePlate/cardCode.
- FE có thể lấy danh sách blacklist và so sánh licensePlate/cardCode để hiển thị lỗi trước khi check-in.

## API thiếu/cần Backend xác nhận

- Chưa có endpoint history completed sessions riêng cho Staff Check-out. FE tạm lấy dữ liệu lịch sử từ thao tác checkout trong phiên hiện tại/local state, hoặc cần BE bổ sung `GET /api/parking-sessions/completed` / filter theo thời gian.
- Active session DTO hiện không trả rõ `vehicleTypeId` hoặc `vehicleTypeName`; FE chỉ có thể hiển thị `UNKNOWN/Not returned by BE` nếu BE chưa trả.
- Không có endpoint tính phí preview riêng trước payment. FE sẽ dùng `POST /api/payments` sau khi staff confirm checkout để BE trả amount.
- `BookingDto` chưa có `bookingCode` thật. Nếu cần mã booking nghiệp vụ riêng, BE nên bổ sung field `bookingCode`.
- Chưa có API đổi phương thức thanh toán sau khi payment đã được tạo.
- Chưa có API cancel/void pending payment. Nếu khách đổi từ online banking sang cash sau khi đã tạo payment pending, BE nên bổ sung một trong các API:
  - `PATCH /api/payments/{id}/method`
  - hoặc `POST /api/payments/{id}/cancel`
  - hoặc endpoint tạo lại payment có xử lý hủy pending payment cũ.
- Cần BE seed/confirm `IncidentType` cho trường hợp khách không chịu thanh toán, ví dụ `UNPAID_VEHICLE`.

## Cập nhật FE đã làm

### Cập nhật layout gọn theo feedback mới

- Staff Check-out:
  - Đã bỏ hẳn màn/cột `Active cards/vehicles`.
  - Check-out hiện chỉ load session bằng phương pháp search card code hoặc biển số.
  - Nút `Filter` chỉ mở bộ lọc khi bấm, không chiếm chỗ mặc định.
  - Nút `History` nằm cạnh `Refresh`; bấm vào sẽ mở màn hình lịch sử riêng.
  - Đã bỏ khối `Exit history` nhỏ trong màn hình chính để chừa chỗ cho hai panel thao tác.
  - `Checked-in info` và `Check-out confirmation` nằm chung một khung nhìn dạng 2 cột, hạn chế kéo trang.
  - Màn hình thanh toán sau confirm có nút `Back to checkout` nếu payment chưa `PAID`.
  - Nếu payment đã `PAID` thì không cho back đổi phương thức vì BE đã complete business flow cho session.
  - Thêm nút `Report to manager` gọi Incident API thật.
  - `Report to manager` không tạo demo giả; nếu thiếu incident type phù hợp thì FE báo lỗi để Backend/Manager bổ sung.

- Staff Check-in:
  - Đã bỏ `Gate clock` ở header.
  - Đã bỏ câu mô tả kỹ thuật về API khỏi UI.
  - Camera panel gọn hơn, bỏ dòng mô tả demo dài.
  - Đã nới lại khối camera để phần chữ phía cuối không bị che/cắt.
  - `Booking/WALK-IN` trên camera đã đổi thành badge `Entry` gọn hơn.
  - Active sessions không còn là section dài bên dưới; chuyển thành nút mở modal riêng.

### Staff Vehicle Check-in

- File: `src/features/vehicles/components/VehicleCheckin.tsx`
- Đã đổi UI theo layout cổng vào:
  - Form nhập bên trái: biển số, loại xe, card code.
  - Camera demo bên phải.
  - Active sessions mở bằng nút/modal, không chiếm chiều dài màn hình chính.
- Đã bỏ danh sách booking hiển thị sẵn.
- Đã detect booking theo biển số:
  - FE gọi `GET /api/bookings/by-building/{buildingId}`.
  - Nếu endpoint theo building lỗi thì fallback `GET /api/bookings`.
  - Nếu booking API chưa sẵn sàng thì chỉ `console.warn`, set booking rỗng, không chặn check-in.
- Confirm check-in gọi `POST /api/parking-sessions/check-in`.
- Sau check-in thành công gọi lại:
  - `GET /api/parking-sessions/active`
  - `GET /api/cards`
- Success overlay full màn hình màu xanh trong 3 giây, có biển số, card code, loại xe, thời gian vào.
- Error overlay full màn hình màu đỏ trong 3 giây, hiển thị lỗi BE hoặc lỗi pre-check.
- Blacklist:
  - FE đọc `GET /api/Blacklist` nếu có.
  - Nếu tìm thấy license plate/card code trong blacklist thì chặn trước và hiện overlay đỏ.
  - BE hiện chưa có endpoint check trực tiếp bằng licensePlate/cardCode; nếu muốn chuẩn hơn nên bổ sung.

### Staff Vehicle Check-out

- File: `src/features/vehicles/components/VehicleCheckout.tsx`
- Đã đổi sang flow vận hành nhanh:
  - Thanh tìm kiếm card code/biển số.
  - Không còn danh sách active card/session mặc định.
  - Lịch sử xe đã ra mở bằng nút `History`.
  - Bộ lọc thời gian/loại xe mở bằng nút `Filter`.
  - Hai panel chính: thông tin đã check-in và thông tin check-out.
- Search card/plate sẽ tự chọn active session và fill panel check-in.
- Staff nhập biển số ở cổng ra để đối chiếu với biển số lúc check-in.
- Confirm check-out gọi:
  - `PATCH /api/parking-sessions/{id}/checkout/start`
  - `POST /api/payments`
- Tổng tiền lấy từ BE response của `POST /api/payments`, FE không tự tính phí.
- Checkout overlay full màn hình hiển thị biển số, card, check-in time, check-out time, duration, payment method/status, amount.
- Checkout overlay có `Back to checkout` cho payment chưa `PAID`.
- Checkout overlay có `Report to manager`, gọi `GET /api/IncidentType` rồi `POST /api/Incident` nếu có incident type phù hợp.
- Lịch sử check-out đang lưu localStorage/session browser vì BE chưa có API completed-session history.
- Lost card gọi `PUT /api/cards/{id}/status` thông qua `markCardLost(cardId)`.

### Staff Card Management

- File: `src/features/card/components/CardManager.tsx`
- Đã bỏ Monthly khỏi Staff UI:
  - Không còn filter card type.
  - Không còn option tạo Monthly card.
  - Create card luôn gửi `cardType: PARKING_CARD`.
  - Danh sách Staff Card chỉ hiển thị `PARKING_CARD`.
- Service Card không bị refactor để tránh ảnh hưởng module khác.
