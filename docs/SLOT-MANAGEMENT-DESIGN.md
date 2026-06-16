# Thiết kế Cấu trúc Dữ liệu cho Quản lý Chỗ đỗ (Slot Management)

Tài liệu này đề xem xét và đề xuất mô hình thực thể cơ sở dữ liệu (Database Schema) cùng các API payload cần thiết để triển khai tính năng **Slot Management (Quản lý chỗ đỗ)** theo đúng tài liệu đặc tả SRS.

### ⚠️ Lưu ý nghiệp vụ quan trọng:
* **Ô tô (Car/SUV):** Quản lý chi tiết đến từng **Slot (Ô đỗ)** cố định. Có đầy đủ trạng thái trống/bận, hỗ trợ cấp phát dài hạn (vé tháng) và gán xe thực tế vào từng ô đỗ.
* **Xe máy (Motorbike):** **Không quản lý theo Slot**. Xe máy chỉ đỗ tự do trong các phân khu chung (**Zone** dành riêng cho xe máy). Hệ thống chỉ kiểm soát tổng dung lượng (Capacity) và đếm số lượng xe máy đang đỗ tại phân khu đó.
* **Quyền ưu tiên đỗ xe tháng:** Quyền giữ slot cho xe tháng được kiểm soát ở cấp độ logic thông qua cột `monthly_subscription.assigned_slot_id`. Trạng thái của Slot (`slot_status`) không dùng để biểu diễn việc đặt chỗ dài hạn mà chỉ phản ánh đúng tình trạng vật lý/vận hành của ô đỗ.

---

## 1. Sơ đồ Quan hệ Thực thể (ERD)

Dưới đây là sơ đồ mối quan hệ giữa các bảng để hỗ trợ việc phân cấp chỗ đỗ và theo dõi phương tiện:

```mermaid
erDiagram
    BUILDING ||--o{ FLOOR : "chứa"
    FLOOR ||--o{ ZONE : "chứa"
    FLOOR ||--o{ SLOT : "chứa (chỉ áp dụng cho Ô tô)"
    ZONE ||--o{ SLOT : "phân loại (chỉ áp dụng cho Ô tô)"
    SLOT ||--o{ SLOT_ALLOCATION : "cấp phát dài hạn (chỉ Ô tô)"
    SLOT ||--o{ PARKING_SESSION : "giao dịch đỗ xe thực tế (chỉ Ô tô)"
    ZONE ||--o{ PARKING_SESSION : "giao dịch đỗ xe thực tế (cho Xe máy)"
    VEHICLE ||--o{ SLOT_ALLOCATION : "sở hữu"
    VEHICLE ||--o{ PARKING_SESSION : "đỗ trong"

    BUILDING {
        int id PK
        string code "Unique (BLD01)"
        string name
        string address
        int totalFloor
        int status
    }
    FLOOR {
        int id PK
        int buildingId FK "Liên kết tòa nhà"
        int floorNumber
        string name
        int totalSlots
        string status
    }
    ZONE {
        int id PK
        int floorId FK "Liên kết tầng"
        string name "Zone A, Zone Xe Máy B..."
        string vehicleType "Car | Motorbike"
        int slotCapacity "Sức chứa tối đa của phân khu"
        string status
    }
    SLOT {
        int id PK "Chỉ áp dụng cho Ô tô"
        string slotCode "Unique (Ví dụ: A1-012)"
        int floorId FK "Liên kết tầng"
        int zoneId FK "Liên kết phân khu ô tô (Nullable)"
        string slotType "Standard | VIP | EV Charging"
        string status "AVAILABLE | OCCUPIED | BLOCKED | MAINTENANCE"
    }
    VEHICLE {
        string plate PK "Biển số xe (Unique)"
        string model "Dòng xe (VinFast VF8, ...)"
        string ownerName "Tên chủ xe"
        string memberId "Mã thành viên (Nếu có)"
        string vehicleType "Car | Motorbike | SUV"
    }
    SLOT_ALLOCATION {
        int id PK "Chỉ áp dụng cho Ô tô"
        int slotId FK "Liên kết ô đỗ"
        string vehiclePlate FK "Liên kết biển số ô tô"
        string allocationType "Short-term | Monthly | VIP"
        datetime startDate
        datetime endDate
        string status "Active | Expired | Suspended"
        string notes
    }
    PARKING_SESSION {
        int id PK "Phiên đỗ xe thực tế"
        int slotId FK "Liên kết ô đỗ (NULL đối với Xe máy)"
        int zoneId FK "Liên kết phân khu (Bắt buộc đối với Xe máy)"
        string vehiclePlate FK "Liên kết biển số xe"
        datetime checkInTime
        datetime checkOutTime "Nullable"
        string status "Active | Completed"
    }
```

---

## 2. Chi tiết các Bảng dữ liệu chính

### A. Thực thể Ô đỗ (Slot) - *Chỉ dành cho Ô tô*
Ô đỗ thừa hưởng gián tiếp từ **Building** và trực tiếp từ **Floor** / **Zone**.

| Tên trường (Field) | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `Id` | `int` | Primary Key, Auto-increment | ID định danh duy nhất của ô đỗ. |
| `SlotCode` | `string` | Unique, Required | Mã hiển thị trực quan (Ví dụ: `A1-012` hoặc `B1-VIP-05`). |
| `FloorId` | `int` | Foreign Key (`Floor.Id`) | Thuộc về tầng nào. |
| `ZoneId` | `int` | Foreign Key (`Zone.Id`), Nullable | Thuộc về phân khu ô tô nào (Ví dụ: Khu VIP, Khu sạc điện EV). |
| `SlotType` | `string` | Required | Loại ô đỗ (`Standard`, `VIP`, `EV Charging`). *Không có loại Motorbike*. |
| `Status` | `string` | Required | Trạng thái hiện tại: `AVAILABLE` (trống), `OCCUPIED` (đang có xe đỗ), `BLOCKED` (bị khóa), `MAINTENANCE` (đang bảo trì). |

---

## 3. Quản lý Trạng thái Slot (slot_status)

Theo tài liệu đặc tả SRS, trạng thái của Slot (`slot_status`) không dùng để biểu diễn việc giữ chỗ của Monthly Subscription. Thay vào đó, **`slot_status` chỉ đại diện cho trạng thái vật lý/vận hành thực tế** của ô đỗ và có đúng **4 giá trị**:

1. **`AVAILABLE`**: Chỗ trống, sẵn sàng cho xe vào đỗ hoặc đỗ theo lịch đặt (Booking).
2. **`OCCUPIED`**: Đang có phương tiện đỗ thực tế (có phiên đỗ xe `Active` tại ô đó).
3. **`BLOCKED`**: Bị khóa thủ công do quản lý chỉ định (không khả dụng cho đỗ xe).
4. **`MAINTENANCE`**: Đang bảo trì thiết bị hoặc cảm biến (không khả dụng cho đỗ xe).
