'use client';

import React, { useState } from 'react';

/*
  Khai báo kiểu dữ liệu cho loại xe.
  SRS hiện tại chỉ tập trung chính vào Car và Motorcycle.
*/
type VehicleType = 'CAR' | 'MOTORCYCLE';

/*
  Khai báo kiểu khách gửi xe:
  - WALK_IN: khách vãng lai
  - BOOKING: khách đã đặt chỗ trước
  - MONTHLY: khách có vé/thẻ tháng
*/
type CustomerType = 'WALK_IN' | 'BOOKING' | 'MONTHLY';

export default function VehicleCheckin() {
  /*
    State lưu biển số xe.
    Đây là dữ liệu Staff nhập thủ công, không phải camera thật.
  */
  const [licensePlate, setLicensePlate] = useState('51A-123.45');

  /*
    State lưu loại xe hiện tại.
    Mặc định đang chọn CAR.
  */
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');

  /*
    State lưu loại khách gửi xe.
    Mặc định là khách vãng lai.
  */
  const [customerType, setCustomerType] = useState<CustomerType>('WALK_IN');

  /*
    State lưu mã booking.
    Chỉ cần nhập khi customerType = BOOKING.
  */
  const [bookingCode, setBookingCode] = useState('');

  /*
    State lưu mã thẻ/card.
    Walk-in và Booking dùng card NORMAL.
    Monthly Subscription dùng card MONTHLY.
  */
  const [cardCode, setCardCode] = useState('CARD-000001');

  /*
    State lưu zone hệ thống gợi ý.
    Với ô tô Walk-in/Booking, hệ thống chỉ gợi ý GENERAL zone.
    Slot thật sẽ cập nhật sau khi xe đã đậu.
  */
  const [recommendedZone, setRecommendedZone] = useState('B1 - GENERAL');

  /*
    State lưu slot thật sau khi xe đã đậu.
    Chỉ áp dụng cho CAR.
    MOTORCYCLE không cần slot cụ thể.
  */
  const [actualSlot, setActualSlot] = useState('');

  /*
    State dùng để hiện thông báo check-in thành công trên vé ảo.
  */
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  /*
    Đây là dữ liệu giả lập để demo UI.
    Sau này khi có backend thì sẽ gọi API để kiểm tra Pricing Policy.
  */
  const hasValidPricingPolicy = true;

  /*
    Đây là dữ liệu giả lập để kiểm tra xe có session đang mở hay không.
    Sau này sẽ gọi API check theo biển số.
  */
  const hasOpenSession = false;

  /*
    Biến phụ để code dễ đọc hơn.
  */
  const isCar = vehicleType === 'CAR';
  const isBooking = customerType === 'BOOKING';
  const isMonthly = customerType === 'MONTHLY';

  /*
    Hàm xác định loại card hiển thị trên form.
    Nếu là khách tháng thì card là MONTHLY.
    Còn lại là NORMAL.
  */
  const getCardType = () => {
    if (isMonthly) {
      return 'MONTHLY';
    }

    return 'NORMAL';
  };

  /*
    Hàm tự động gợi ý zone dựa trên:
    - Loại xe
    - Loại khách

    Lưu ý:
    - Xe máy: gợi ý khu vực/capacity, không gợi ý slot cụ thể.
    - Ô tô Walk-in/Booking: chỉ gợi ý GENERAL zone.
    - Ô tô Monthly: dùng MONTHLY zone.
  */
  const getRecommendedZone = (type: VehicleType, customer: CustomerType) => {
    if (type === 'MOTORCYCLE') {
      if (customer === 'MONTHLY') {
        return 'MOTORBIKE MONTHLY CAPACITY';
      }

      return 'MOTORBIKE GENERAL ZONE';
    }

    if (customer === 'MONTHLY') {
      return 'B2 - MONTHLY';
    }

    return 'B1 - GENERAL';
  };

  /*
    Hàm xử lý khi Staff đổi loại xe.
    Khi đổi loại xe thì hệ thống tự cập nhật lại recommended zone.
  */
  const handleVehicleTypeChange = (value: VehicleType) => {
    setVehicleType(value);
    setRecommendedZone(getRecommendedZone(value, customerType));

    /*
      Nếu chọn xe máy thì xóa actualSlot,
      vì xe máy không quản lý slot cụ thể.
    */
    if (value === 'MOTORCYCLE') {
      setActualSlot('');
    }
  };

  /*
    Hàm xử lý khi Staff đổi loại khách.
    Ví dụ đổi từ Walk-in sang Booking hoặc Monthly.
  */
  const handleCustomerTypeChange = (value: CustomerType) => {
    setCustomerType(value);
    setRecommendedZone(getRecommendedZone(vehicleType, value));

    /*
      Nếu không phải Booking thì không cần bookingCode.
    */
    if (value !== 'BOOKING') {
      setBookingCode('');
    }

    /*
      Nếu là khách tháng thì tự đổi card code demo thành MONTHLY.
      Nếu không thì dùng card NORMAL.
    */
    if (value === 'MONTHLY') {
      setCardCode('CARD-MONTHLY-001');
    } else {
      setCardCode('CARD-000001');
    }
  };

  /*
    Hàm validate form trước khi cho check-in.
    Đây là validate đơn giản ở frontend để demo.
    Sau này backend vẫn phải validate lại.
  */
  const validateForm = () => {
    /*
      Không cho check-in nếu biển số trống.
    */
    if (!licensePlate.trim()) {
      alert('Please enter license plate.');
      return false;
    }

    /*
      Không cho check-in nếu card code trống.
    */
    if (!cardCode.trim()) {
      alert('Please enter card code.');
      return false;
    }

    /*
      Nếu là khách Booking thì bắt buộc nhập Booking Code.
    */
    if (isBooking && !bookingCode.trim()) {
      alert('Please enter booking code.');
      return false;
    }

    /*
      Không cho tạo session mới nếu xe đang có session đang mở.
    */
    if (hasOpenSession) {
      alert('This vehicle already has an active parking session.');
      return false;
    }

    /*
      Check-in phải có Pricing Policy hợp lệ.
      Nếu không có thì từ chối check-in.
    */
    if (!hasValidPricingPolicy) {
      alert('No valid pricing policy found for this vehicle type.');
      return false;
    }

    return true;
  };

  /*
    Hàm xử lý khi bấm nút Confirm Check-in.
  */
  const handleCheckin = (e: React.FormEvent) => {
    e.preventDefault();

    /*
      Nếu form không hợp lệ thì dừng lại.
    */
    if (!validateForm()) {
      return;
    }

    /*
      Nếu hợp lệ thì hiện thông báo thành công.
      Hiện tại chỉ demo UI, chưa gọi API backend.
    */
    setIsCheckedIn(true);

    /*
      Sau 3 giây thì tắt thông báo thành công.
    */
    setTimeout(() => {
      setIsCheckedIn(false);
    }, 3000);
  };

  return (
    <div className="p-8 space-y-8">
      {/* PHẦN TIÊU ĐỀ TRANG */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Vehicle Check-in Portal
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          Register incoming vehicles by manual input and assign a suitable parking zone.
        </p>
      </div>

      {/* CHIA LAYOUT THÀNH 2 CỘT: FORM BÊN TRÁI, SLIP BÊN PHẢI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: FORM CHECK-IN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">
            Check-in Registration
          </h3>

          <form onSubmit={handleCheckin} className="space-y-6">
            {/* KHU VỰC CÁC Ô INPUT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* INPUT BIỂN SỐ XE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  License Plate
                </label>

                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold uppercase tracking-wider text-slate-700"
                  placeholder="Example: 51A-123.45"
                  required
                />
              </div>

              {/* SELECT LOẠI XE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Vehicle Type
                </label>

                <select
                  value={vehicleType}
                  onChange={(e) => handleVehicleTypeChange(e.target.value as VehicleType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                >
                  <option value="CAR">Car</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                </select>
              </div>

              {/* SELECT LOẠI KHÁCH */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Customer Type
                </label>

                <select
                  value={customerType}
                  onChange={(e) => handleCustomerTypeChange(e.target.value as CustomerType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                >
                  <option value="WALK_IN">Walk-in</option>
                  <option value="BOOKING">Booking</option>
                  <option value="MONTHLY">Monthly Subscription</option>
                </select>
              </div>

              {/* INPUT CARD CODE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Card Code ({getCardType()})
                </label>

                <input
                  type="text"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-700"
                  placeholder="Example: CARD-000001"
                  required
                />
              </div>

              {/* INPUT BOOKING CODE - CHỈ HIỆN KHI CHỌN BOOKING */}
              {isBooking && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Booking Code
                  </label>

                  <input
                    type="text"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-700"
                    placeholder="Example: BK-2026-0001"
                    required
                  />
                </div>
              )}

              {/* ZONE HỆ THỐNG GỢI Ý */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Recommended Zone
                </label>

                <input
                  type="text"
                  value={recommendedZone}
                  onChange={(e) => setRecommendedZone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                  required
                />
              </div>

              {/* ACTUAL SLOT - CHỈ HIỆN KHI LÀ XE Ô TÔ */}
              {isCar && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Actual Slot After Parking
                  </label>

                  <input
                    type="text"
                    value={actualSlot}
                    onChange={(e) => setActualSlot(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                    placeholder="Fill later, example: B1-05"
                  />
                </div>
              )}

              {/* CỔNG CHECK-IN */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Entry Gate / Lane
                </label>

                <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm">
                  Gate 1 - North Entrance
                </div>
              </div>
            </div>

            {/* KHU VỰC KIỂM TRA TRẠNG THÁI HỆ THỐNG */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                System Check
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                {/* Kiểm tra biển số đã nhập */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">
                    check_circle
                  </span>
                  Manual plate input completed
                </div>

                {/* Kiểm tra card */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">
                    check_circle
                  </span>
                  Card code available
                </div>

                {/* Kiểm tra Pricing Policy */}
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      hasValidPricingPolicy ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {hasValidPricingPolicy ? 'check_circle' : 'error'}
                  </span>
                  Pricing policy valid
                </div>

                {/* Kiểm tra xe chưa có session đang mở */}
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-sm ${
                      !hasOpenSession ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {!hasOpenSession ? 'check_circle' : 'error'}
                  </span>
                  No active session found
                </div>
              </div>
            </div>

            {/* GHI CHÚ RIÊNG CHO XE Ô TÔ */}
            {isCar && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
                <b>Note:</b> For cars, the system only recommends a GENERAL zone at check-in.
                The actual slot should be updated after the car has parked.
              </div>
            )}

            {/* NÚT XÁC NHẬN CHECK-IN */}
            <button
              type="submit"
              className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">login</span>
              Confirm Check-in & Print Slip
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: PREVIEW VÀ VÉ XE ẢO */}
        <div className="space-y-8">
          {/* KHUNG GIẢ LẬP NHẬP LIỆU THỦ CÔNG */}
          <div className="bg-slate-900 aspect-video rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center text-slate-500">
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              MANUAL INPUT SIMULATION
            </div>

            <span className="material-symbols-outlined text-4xl text-slate-700">
              directions_car
            </span>

            {/* Preview biển số và zone */}
            <div className="absolute inset-x-8 bottom-4 border border-emerald-500/40 bg-emerald-500/5 rounded px-3 py-3 text-[10px] text-emerald-400 font-mono space-y-1">
              <div className="flex justify-between">
                <span>PLATE</span>
                <span className="font-bold text-xs">{licensePlate || 'NO PLATE'}</span>
              </div>

              <div className="flex justify-between">
                <span>ZONE</span>
                <span className="font-bold text-xs">{recommendedZone}</span>
              </div>
            </div>
          </div>

          {/* VÉ XE ẢO */}
          <div className="bg-amber-50 p-6 rounded-2xl border border-dashed border-amber-200 flex flex-col text-slate-800 font-mono text-sm relative overflow-hidden">
            {/* Header của vé */}
            <div className="text-center pb-4 border-b border-dashed border-amber-200">
              <h4 className="font-bold text-base tracking-widest text-slate-700">
                NEXPARK
              </h4>

              <p className="text-[10px] text-slate-400 mt-1">
                Smart Parking System Slip
              </p>
            </div>

            {/* Thông tin chi tiết trên vé */}
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">PLATE:</span>
                <span className="font-bold">{licensePlate || '-------'}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">TYPE:</span>
                <span className="font-bold">{vehicleType}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">CUSTOMER:</span>
                <span className="font-bold">{customerType}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">CARD:</span>
                <span className="font-bold">{cardCode || '-------'}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">ZONE:</span>
                <span className="font-bold">{recommendedZone}</span>
              </div>

              {/* Chỉ hiện actual slot nếu là xe ô tô */}
              {isCar && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">ACTUAL SLOT:</span>
                  <span className="font-bold">{actualSlot || 'UPDATE LATER'}</span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">ENTRY:</span>
                <span className="font-medium">
                  {new Date().toLocaleString('en-US', { hour12: false })}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">GATE:</span>
                <span className="font-medium">GATE 01</span>
              </div>
            </div>

            {/* Barcode giả lập */}
            <div className="bg-white p-3 rounded border border-amber-100 flex flex-col items-center justify-center gap-1.5 mt-2">
              <div className="h-10 w-full bg-slate-800 flex items-center justify-between px-1 tracking-widest text-[9px] text-slate-400">
                |||||| | |||| | ||||| | ||||| | ||||
              </div>

              <span className="text-[9px] text-slate-400">
                NP-2026-9824-7128
              </span>
            </div>

            {/* Overlay thông báo thành công */}
            {isCheckedIn && (
              <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white font-sans transition-opacity duration-300">
                <span className="material-symbols-outlined text-4xl">
                  check_circle
                </span>

                <p className="font-bold mt-2">Checked In Successfully!</p>

                <p className="text-xs text-white/80 mt-1">
                  Parking session created.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}