/**
 * ===================================================================================
 * 🔀 FE COMPONENT: combined-gate/page.tsx (Cổng Gộp Song Song / Combined Staff Gate Workspace)
 * ===================================================================================
 *
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Giao diện gộp 2 làn xe đỗ (Check-in & Check-out) song song trên cùng 1 màn hình duy nhất cho Nhân viên bảo vệ (Staff).
 * - Render side-by-side 2 Component chính:
 *   + Nửa bên trái: [VehicleCheckin.tsx](file:///c:/Users/HUNG%20NGHI/OneDrive/文档/FPTU/SEMESTER%205/SWP/parking-system-web/src/features/vehicles/components/VehicleCheckin.tsx) (Xử lý xe vào)
 *   + Nửa bên phải: [VehicleCheckout.tsx](file:///c:/Users/HUNG%20NGHI/OneDrive/文档/FPTU/SEMESTER%205/SWP/parking-system-web/src/features/vehicles/components/VehicleCheckout.tsx) (Xử lý xe ra & thanh toán)
 * - Tự động đồng bộ State liên động (State Triggering): Khi xe check-in xong -> Tự động nạp lại danh sách xe đỗ active bên cổng Check-out và ngược lại.
 *
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - Kế thừa trực tiếp các endpoint từ CheckinSessionController.cs và CheckoutController.cs.
 *
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - ParkingSessions, ParkingCards, Payments
 *
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Nạp Trang: Render song song 2 khung điều phối lối ra/vào.
 * 2. Kích Hoạt Liên Động: `handleCheckinSuccess` tăng `checkoutRefreshTrigger` -> Tự động nạp lại danh sách xe đang trong bãi.
 * ===================================================================================
 */

"use client";

import React, { useState } from "react";
import VehicleCheckin from "@/features/vehicles/components/VehicleCheckin";
import VehicleCheckout from "@/features/vehicles/components/VehicleCheckout";

export default function CombinedGatePage() {
  const [checkoutRefreshTrigger, setCheckoutRefreshTrigger] = useState(0);
  const [checkinRefreshTrigger, setCheckinRefreshTrigger] = useState(0);

  const handleCheckinSuccess = () => {
    setCheckoutRefreshTrigger((prev) => prev + 1);
  };

  const handleCheckoutSuccess = () => {
    setCheckinRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto flex flex-col gap-4 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900">
            Staff Gate Combined
          </h1>
        </div>

        {/* Two independent gate panels side by side */}
        <div className="grid gap-4 xl:grid-cols-2">
          {/* CHECK-IN panel */}
          <section className="rounded-3xl border border-emerald-200/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl">
                login
              </span>
              <h2 className="text-base font-black text-slate-900">
                ENTRY GATE (CHECK-IN)
              </h2>
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 ml-auto">
                IN
              </span>
            </div>
            <VehicleCheckin
              compact
              refreshTrigger={checkinRefreshTrigger}
              onCheckinSuccess={handleCheckinSuccess}
            />
          </section>

          {/* CHECK-OUT panel */}
          <section className="rounded-3xl border border-rose-200/60 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <span className="material-symbols-outlined text-rose-600 text-xl">
                logout
              </span>
              <h2 className="text-base font-black text-slate-900">
                EXIT GATE (CHECK-OUT)
              </h2>
              <span className="text-[9px] font-bold bg-rose-50 text-rose-600 rounded-full px-2 py-0.5 ml-auto">
                OUT
              </span>
            </div>
            <VehicleCheckout
              compact
              refreshTrigger={checkoutRefreshTrigger}
              onCheckoutSuccess={handleCheckoutSuccess}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
