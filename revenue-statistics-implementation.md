# Revenue Statistics & Reconciliation Implementation

## Goal
Implement the new Revenue Statistics (list with pagination & filters) and Revenue Details (reconciliation showing payments list) APIs for the Manager portal, update the main Manager Dashboard to integrate the real-time revenue API, and clean up mock data logs.

## Tasks
- [ ] Task 1: Update type definitions for Revenue Statistics in `src/features/payments/types/index.ts`. → Verify: Types compile.
- [ ] Task 2: Implement or update hooks in `src/features/payments/hooks/usePayments.ts` to call `/api/Revenue` and `/api/Revenue/{id}`. → Verify: Methods fetch data correctly.
- [ ] Task 3: Rewrite `src/features/payments/components/PaymentWorkspace.tsx` to present a clean, English-language "Revenue Statistics & Reconciliation" table, showing vehicle-type breakdown, excluding Monthly Subscriptions, with filtering by Building, dates, and PeriodType (DAILY/MONTHLY/YEARLY), and showing detail modal for transactions. → Verify: Interface renders correctly without monthly subscriptions.
- [ ] Task 4: Integrate the new `/api/Revenue` API in `src/app/dashboard/manager/page.tsx` (Manager Dashboard), update charts/stat cards, and remove mock activities logs (replacing them with real active sessions or safe states). → Verify: Live dashboard loads.
- [ ] Task 5: Run validation script `python .agents/scripts/checklist.py .` to ensure the project passes all checks. → Verify: Script runs successfully.

## Done When
- Manager can view revenue records in table format.
- Row click opens details dialog calling `/api/Revenue/{id}`.
- Dashboard charts display actual API-sourced revenue statistics.
- Monthly subscriptions display/UI is completely removed.
