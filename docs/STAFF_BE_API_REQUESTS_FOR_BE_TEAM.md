# Staff Portal - Backend API Requests for BE Team

Date: 2026-07-14
Priority: P1 = Critical, P2 = Important, P3 = Nice to have

## Summary

List of missing APIs/fields that the Staff Portal Frontend needs in order to function fully.

---

## P1 - Critical (Needs to be done immediately)

### 1. Add fields to ParkingSessionDto

Endpoints affected:
- `GET /api/parking-sessions/active`
- `GET /api/parking-sessions`
- `POST /api/parking-sessions/check-in` (response)
- `PATCH /api/parking-sessions/{id}/slot` (response)

Fields to add:
```csharp
public int? VehicleTypeId { get; set; }
public string? VehicleTypeName { get; set; }
public DateTime? PlannedCheckoutTime { get; set; }
public string? ZoneName { get; set; }
public string? CardStatus { get; set; }
```

Desired response example:
```json
{
  "id": 1,
  "vehicleTypeId": 1,
  "vehicleTypeName": "Car",
  "plannedCheckoutTime": "2026-07-14T18:00:00Z",
  "zoneCode": "CZ-F1",
  "zoneName": "Car Zone F1",
  "cardId": 1,
  "cardCode": "CARD001",
  "cardStatus": "ASSIGNED"
}
```

**Reason:** FE currently has to call additional `/vehicle-types` and `/cards` endpoints to map data, which is error-prone and wastes extra requests.

---

### 2. Add fields to BookingDto

Endpoints affected:
- `GET /api/bookings`
- `GET /api/bookings/by-building/{buildingId}`
- `GET /api/parking-sessions/check-in/booking?licensePlate=&buildingId=`

Fields to add:
```csharp
public DateTime? PlannedCheckinTime { get; set; }
public decimal DepositAmount { get; set; }
public DateTime? CheckinGraceUntil { get; set; }  // = plannedCheckinTime + checkinGraceMinutes
public bool IsWithinGrace { get; set; }  // server-computed: now <= checkinGraceUntil
```

Desired response example:
```json
{
  "id": 1,
  "bookingStatus": "Confirmed",
  "plannedCheckinTime": "2026-07-14T10:00:00Z",
  "plannedCheckoutTime": "2026-07-14T18:00:00Z",
  "depositAmount": 50000,
  "checkinGraceUntil": "2026-07-14T10:30:00Z",
  "isWithinGrace": false
}
```

**Reason:** Staff Dashboard Booking Review needs to display upcoming bookings and bookings currently within their grace period. Currently FE does not have enough data to compute this.

---

## P2 - Important (Needs to be done next sprint)

### 3. Fee Preview API (no side-effect)

New endpoint:
```
GET /api/parking-sessions/{id}/fee-preview
```

**IMPORTANT: This endpoint MUST NOT:**
- Update `checkOutTime`
- Change session status
- Create a payment record
- Release the card or slot

Desired response:
```json
{
  "success": true,
  "data": {
    "sessionId": 1,
    "parkingFee": 30000,
    "incidentFeeTotal": 100000,
    "totalAmount": 130000,
    "calculatedAt": "2026-07-14T10:00:00Z",
    "breakdown": [
      { "name": "Parking fee", "amount": 30000, "type": "PARKING" },
      { "name": "Lost card", "amount": 100000, "type": "INCIDENT", "incidentId": 1 }
    ]
  }
}
```

**Reason:** Staff Slot Monitoring wants to display the current parking fee for an occupied slot but cannot call checkout/start because those have side-effects (recording check-out time, releasing resources, etc.).

---

### 4. Add fields to IncidentDto

Endpoints affected:
- `GET /api/Incident`
- `GET /api/Incident/{id}`
- `GET /api/Incident/session/{sessionId}`

Fields to add:
```csharp
public string? IncidentCode { get; set; }
public int? CardId { get; set; }
public string? CardCode { get; set; }
public int? VehicleId { get; set; }
public int? VehicleTypeId { get; set; }
public string? VehicleTypeName { get; set; }
```

**Reason:** Staff Incident view currently cannot display card and vehicle information associated with an incident without additional API calls.

---

### 5. Payment Response - Fee Breakdown

Endpoints affected:
- `POST /api/payments` (response)

Fields to add:
```csharp
public decimal ParkingFee { get; set; }
public decimal IncidentFees { get; set; }
public List<PaymentBreakdownItem> Details { get; set; }
```

Desired response addition:
```json
{
  "amount": 130000,
  "parkingFee": 30000,
  "incidentFees": 100000,
  "details": [
    { "name": "Parking fee", "amount": 30000 },
    { "name": "Lost card", "amount": 100000, "incidentId": 1 }
  ]
}
```

**Reason:** Staff checkout flow needs to show a clear breakdown of what was charged so the staff can confirm with the customer before payment.

---

### 6. Atomic Lost Card Endpoints

New endpoints:
```
POST /api/parking-sessions/{id}/lost-card
POST /api/parking-sessions/{id}/lost-card/rollback
PATCH /api/parking-sessions/{id}/replace-card?newCardCode={code}
```

Desired response for `POST /lost-card`:
```json
{
  "sessionId": 1,
  "oldCardId": 10,
  "oldCardCode": "CARD001",
  "newCardId": null,
  "newCardCode": null,
  "cardStatus": "LOST",
  "incidentId": 5,
  "penaltyFee": 100000,
  "sessionStatus": "ACTIVE"
}
```

**Reason:** The current flow requires FE to call multiple endpoints (create incident -> update card -> update session) which is not atomic and can leave data in an inconsistent state if any step fails.

---

## P3 - Nice to Have

### 7. Blacklist Check by LicensePlate / CardCode

New endpoint:
```
GET /api/Blacklist/check?licensePlate={plate}&cardCode={code}
```

Desired response:
```json
{
  "blocked": true,
  "targetType": "VEHICLE",
  "reason": "Reported for unpaid parking",
  "incidentId": 3,
  "blacklistId": 1
}
```

**Reason:** Staff Check-in currently loads the entire blacklist and filters on the FE side. This dedicated endpoint enables fast, accurate checks and reduces payload size.

---

### 8. Shift Summary Stats

New endpoint:
```
GET /api/parking-sessions/shift-summary?from={datetime}&to={datetime}
```

Desired response:
```json
{
  "totalVehiclesIn": 45,
  "totalVehiclesOut": 38,
  "currentInParking": 7,
  "cashRevenue": 450000,
  "onlineRevenue": 320000,
  "totalRevenue": 770000,
  "openIncidents": 2,
  "resolvedIncidents": 1
}
```

**Reason:** Staff Dashboard Shift Summary currently has to aggregate data from multiple separate APIs, which is slow and prone to race conditions.

---

## Enum Standards (Please standardize these)

We request that BE returns status values as consistent strings:

**ParkingSlot status:**
```
"Available" | "Occupied" | "Blocked" | "Maintenance"
```
Do **NOT** use `"Reserved"` for slots — bookings only hold capacity at the Building level per SRS.

**ParkingSession status:**
```
"ACTIVE" | "COMPLETED" | "CANCELLED" | "LOST_CARD_REPORTED"
```

**Incident status:**
```
"OPEN" | "PROCESSING" | "RESOLVED" | "CANCELLED"
```

**Booking status:**
```
"PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED"
```

---

## Notes for BE Team

- FE has already mapped the new fields with fallback logic. Once BE adds them, FE will pick them up automatically with no further changes needed on the FE side.
- **Fee Preview API** is a high-priority ask because FE cannot use `checkout` or `start` endpoints just to preview a fee — those endpoints have irreversible side-effects.
- `PlannedCheckinTime` and `DepositAmount` in `BookingDto` are required for the Staff Dashboard Booking Review feature.
- For the Lost Card flow, atomic endpoints are strongly preferred over the current multi-step approach to ensure data consistency.
