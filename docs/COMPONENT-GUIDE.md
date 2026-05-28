# NexPark Component & Design System Integration Guide

Welcome to the **NexPark** developer onboarding guide. This document explains our Next.js frontend component tree, how they integrate with the Google Stitch design tokens, dynamic bilingual configurations, and standard Vietnamese pricing calculators.

---

## 🎨 1. Core Design Guidelines

We adhere strictly to the custom **Stitch Design System** configured in `src/app/globals.css`.

- **Primary Colors:** We use a custom **Emerald/Forest Green** (`#059669`) for all high-signal alerts, active statuses, and call-to-actions.
- **Background System:** All layouts are rendered on a high-end dark canvas:
  - **Canvas Background:** Deep Slate (`#0F172A`)
  - **Surface/Card Background:** Midnight Slate (`#1E293B`)
- **Strict Visual Rules:**
  - **Geometric Radius:** Keep border-radius for action buttons crisp at exactly `0.5rem` (`8px`) and structural panels/cards at exactly `1rem` (`16px`).
  - **Absolute Purple Ban:** Under no circumstances should you introduce *purple, violet, indigo, or neon glow effects*.
- **Typography:**
  - **Be Vietnam Pro** (loaded via Google Fonts) is our native font supporting complete Vietnamese diacritical marks.
  - **JetBrains Mono** is utilized for numbers, duration counters, vehicle plates, and cash values.

---

## 🧱 2. Atomic UI Elements (`src/components/ui/`)

These are our highly reusable, pure design atom components.

### 2.1. Button (`src/components/ui/Button.tsx`)
A flexible, styled button wrapping standard HTML actions.

* **Props:**
  - `variant?: 'primary' | 'ghost' | 'outline'`
  - `size?: 'sm' | 'md' | 'lg'`
  - `isLoading?: boolean`
* **Usage:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg" onClick={handleBook}>
  Book a Spot
</Button>
```

### 2.2. Badge (`src/components/ui/Badge.tsx`)
A pill container commonly used for status display.

* **Props:**
  - `variant?: 'default' | 'available' | 'occupied' | 'reserved' | 'inactive'`
  - `dot?: boolean`
* **Usage:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="available" dot={true}>
  Available
</Badge>
```

---

## 🏢 3. Domain Business Components (`src/components/domain/`)

These elements implement our core parking logic, ticket stubs, and interactive calculation engines.

### 3.1. SlotBadge (`parking/SlotBadge.tsx`)
Translates `SlotStatus` and maps it to a localized status pill with custom theme indicator dots.

* **Props:**
  - `status: SlotStatus` ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'INACTIVE')
  - `dot?: boolean`

### 3.2. ZoneSelector (`parking/ZoneSelector.tsx`)
An interactive layout displaying the real-time slot occupancy capacity ratio for each section.

* **Props:**
  - `zones: ParkingZone[]`
  - `selectedZoneId: string`
  - `onSelectZone: (zoneId: string) => void`

### 3.3. SlotGrid (`parking/SlotGrid.tsx`)
Displays a highly styled interactive grid representing physical parking bays. Shows simulated bay outlines and allows users or guards to click available positions.

* **Props:**
  - `slots: ParkingSlot[]`
  - `selectedSlotId?: string | null`
  - `onSelectSlot?: (slot: ParkingSlot) => void`
  - `interactive?: boolean`

### 3.4. BookingForm (`booking/BookingForm.tsx`)
A robust reservation submission wizard validating vehicle plates, selecting buildings, picking times, and highlighting deposit notices.

* **Props:**
  - `onSubmit: (data: BookingInput) => void`
  - `isLoading?: boolean`

### 3.5. BookingCard (`booking/BookingCard.tsx`)
A stunning digital boarding-pass style ticket receipt featuring a perforated tear divider and fake barcode stripes.

* **Props:**
  - `booking: Booking`

### 3.6. BookingStatus (`booking/BookingStatus.tsx`)
A visual horizontal/vertical step timeline tracking reservations.

* **Props:**
  - `currentStatus: BookingStatus` ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED')

### 3.7. SessionCard (`session/SessionCard.tsx`)
A card summarizing checks-ins. For running sessions, it auto-updates active times and live fees every 10 seconds.

* **Props:**
  - `session: ParkingSession`

### 3.8. FeeCalculator (`session/FeeCalculator.tsx`)
An interactive VND fee calculation sheet. Features live checkbox toggles for simulating wrong zones, lost tags, or booking deposits.

* **Props:**
  - `entryTime: string` (ISO format)
  - `exitTime?: string`
  - `vehicleType: VehicleType`

### 3.9. PaymentMethodSelect (`payment/PaymentMethodSelect.tsx`)
A billing gate selection panel (supporting Cash, QR Transfer, or Wallet options) with dynamic guides.

* **Props:**
  - `selectedMethod: PaymentMethod`
  - `onChange: (method: PaymentMethod) => void`

### 3.10. PaymentSummary (`payment/PaymentSummary.tsx`)
An invoice summary mapping entry fees, cash rounding corrections, and itemized surcharges.

* **Props:**
  - `durationFee: number`
  - `depositDeducted?: number`
  - `surcharges?: { name: string; amount: number }[]`
  - `onPay: () => void`

---

## 🧮 4. Core Calculation Utilities

We implement highly precise Vietnamese Dong logic:

- **Day/Night Time Boundary:** Day shifts operate between `06:00` and `18:00`. Night shifts operate between `18:00` and `06:00`.
- **Motorbike Pricing:** Base `5.000 VNĐ` for 4 hours. Days block: `+1.000 VNĐ/h` (Cap: `10.000 VNĐ`). Night block: `+2.000 VNĐ/h` (Cap: `20.000 VNĐ`).
- **Car Pricing:** Base `30.000 VNĐ` for 4 hours. Days block: `+10.000 VNĐ/h` (Cap: `100.000 VNĐ`). Night block: `+12.000 VNĐ/h` (Cap: `120.000 VNĐ`).
- **Cash Rounding Rules:** We round computed values to the nearest physically available `1.000 VNĐ` bills (`fraction < 500` rounds down, `≥ 500` rounds up).

* **Pricing Utility Code (`src/lib/utils/pricing.ts`):**
```typescript
import { calculateParkingFee } from '@/lib/utils/pricing';

const feeObj = calculateParkingFee(
  '2026-05-28T08:00:00Z', // Entry
  '2026-05-28T14:30:00Z', // Exit (6.5 hours)
  'CAR'
);

console.log(feeObj.totalAmount); // Outputs formatted rounded fee
```
