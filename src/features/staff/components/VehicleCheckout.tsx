'use client';

import React, { useState } from 'react';

/*
  Khai báo loại phương thức thanh toán.
  Theo SRS hiện tại:
  - Chỉ hỗ trợ tiền mặt
  - Và thanh toán online qua ngân hàng
  - Không có POS Card / Credit Card
*/
type PaymentMethod = 'ONLINE_BANKING' | 'CASH';

/*
  Khai báo trạng thái payment đơn giản để demo UI.
  Thực tế backend sẽ quản lý trạng thái này.
*/
type PaymentStatus = 'IDLE' | 'PENDING' | 'PAID' | 'FAILED';

/*
  Khai báo kiểu dữ liệu cho Parking Session.
  Đây là dữ liệu của một lượt gửi xe đang mở.
*/
type ParkingSession = {
  sessionId: string;
  plate: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  customerType: 'WALK_IN' | 'BOOKING' | 'MONTHLY';
  cardCode: string;
  bookingCode?: string;
  zone: string;
  slot?: string;
  entryTime: string;
  duration: string;
  pricingPolicy: string;

  /*
    Các khoản tiền dùng để hiển thị breakdown.
    amountDue = parkingFee + penaltyFee + surchargeFee - depositPaid
  */
  parkingFee: number;
  depositPaid: number;
  penaltyFee: number;
  surchargeFee: number;
};

/*
  Dữ liệu giả lập để sinh viên demo giao diện.
  Sau này khi có backend thì phần này sẽ được thay bằng API.
*/
const MOCK_SESSION: ParkingSession = {
  sessionId: 'PS-2026-0001',
  plate: '51A-123.45',
  vehicleType: 'CAR',
  customerType: 'BOOKING',
  cardCode: 'CARD-000001',
  bookingCode: 'BK-2026-0001',
  zone: 'B1 - GENERAL',
  slot: 'B1-05',
  entryTime: '2026-06-07 08:15:30',
  duration: '3 hours',
  pricingPolicy: 'CAR-GENERAL-2026',
  parkingFee: 30000,
  depositPaid: 10000,
  penaltyFee: 0,
  surchargeFee: 0,
};

/*
  Hàm format tiền theo kiểu Việt Nam.
  Ví dụ: 20000 -> 20.000 VND
*/
const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('vi-VN')} VND`;
};

/*
  Hàm lấy thời gian hiện tại.
  Dùng để giả lập thời điểm bắt đầu check-out.
*/
const getCurrentDateTime = () => {
  return new Date().toLocaleString('en-US', { hour12: false });
};

/**
 * VehicleCheckout Component
 *
 * Module check-out cho Staff:
 * - Tìm parking session đang mở
 * - Xác nhận biển số xe ra
 * - Ghi nhận check_out_time
 * - Khóa số tiền cần thanh toán
 * - Xử lý payment
 * - Hoàn tất checkout
 */
export default function VehicleCheckout() {
  /*
    State lưu từ khóa tìm kiếm.
    Staff có thể nhập biển số, mã vé hoặc mã thẻ.
  */
  const [searchTerm, setSearchTerm] = useState('51A-123.45');

  /*
    State lưu thông tin session tìm được.
    Ban đầu là null vì chưa tìm session.
  */
  const [sessionData, setSessionData] = useState<ParkingSession | null>(null);

  /*
    State lưu biển số thực tế Staff nhìn thấy lúc xe ra.
    Vì không có camera thật nên Staff nhập/xác nhận thủ công.
  */
  const [actualExitPlate, setActualExitPlate] = useState('');

  /*
    State lưu thời điểm bắt đầu checkout.
    Theo SRS, check_out_time được ghi nhận ngay khi bắt đầu checkout,
    trước khi xử lý thanh toán.
  */
  const [checkoutTime, setCheckoutTime] = useState('');

  /*
    State lưu phương thức thanh toán đang chọn.
  */
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('ONLINE_BANKING');

  /*
    State lưu trạng thái payment.
  */
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('IDLE');

  /*
    State dùng để hiển thị loading khi đang xử lý payment.
  */
  const [isProcessing, setIsProcessing] = useState(false);

  /*
    State dùng để hiển thị overlay thành công.
  */
  const [isDone, setIsDone] = useState(false);

  /*
    State đếm số lần tạo payment.
    Nếu payment FAILED thì retry sẽ tạo payment mới.
  */
  const [paymentAttempt, setPaymentAttempt] = useState(1);

  /*
    Tính tổng tiền trước khi trừ deposit.
  */
  const getTotalBeforeDeposit = (session: ParkingSession) => {
    return session.parkingFee + session.penaltyFee + session.surchargeFee;
  };

  /*
    Tính số tiền cần thanh toán cuối cùng.
    Theo SRS:
    amountDue = parking fee + penalty + surcharge - valid booking deposit
    Nếu deposit lớn hơn phí thực tế thì amountDue = 0.
  */
  const getAmountDue = (session: ParkingSession) => {
    const total = getTotalBeforeDeposit(session) - session.depositPaid;
    return Math.max(0, total);
  };

  /*
    Kiểm tra biển số hệ thống và biển số Staff xác nhận lúc xe ra có khớp không.
  */
  const isPlateMatched =
    sessionData !== null &&
    actualExitPlate.trim().toUpperCase() === sessionData.plate.toUpperCase();

  /*
    Hàm tìm session.
    Hiện tại dùng mock data.
    Sau này sẽ gọi API theo biển số / ticket id / card code.
  */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      alert('Please enter license plate, ticket ID, or card code.');
      return;
    }

    /*
      Reset lại trạng thái checkout cũ trước khi load session mới.
    */
    setSessionData(MOCK_SESSION);
    setActualExitPlate(MOCK_SESSION.plate);
    setCheckoutTime('');
    setPaymentStatus('IDLE');
    setPaymentAttempt(1);
    setIsDone(false);
  };

  /*
    Hàm bắt đầu checkout.
    Bước này ghi nhận check_out_time và khóa phí.
    Payment PENDING sau đó sẽ không làm phí tiếp tục tăng.
  */
  const handleStartCheckout = () => {
    if (!sessionData) {
      return;
    }

    if (!isPlateMatched) {
      alert('License plate does not match. Please verify before checkout.');
      return;
    }

    /*
      Ghi nhận thời điểm checkout.
      Trong backend thật, check_out_time sẽ được lưu vào Parking Session.
    */
    setCheckoutTime(getCurrentDateTime());

    /*
      Tạo payment ở trạng thái PENDING.
    */
    setPaymentStatus('PENDING');
  };

  /*
    Hàm xử lý thanh toán thành công.
    Nếu amountDue = 0 thì vẫn cho complete checkout.
  */
  const handleCompletePayment = () => {
    if (!sessionData) {
      return;
    }

    if (!checkoutTime) {
      alert('Please start checkout before processing payment.');
      return;
    }

    setIsProcessing(true);

    /*
      Giả lập thời gian xử lý payment.
      Thực tế sẽ gọi API payment hoặc xác nhận tiền mặt.
    */
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStatus('PAID');
      setIsDone(true);

      /*
        Sau khi thành công, reset form để Staff xử lý xe tiếp theo.
      */
      setTimeout(() => {
        setIsDone(false);
        setSessionData(null);
        setSearchTerm('');
        setActualExitPlate('');
        setCheckoutTime('');
        setPaymentStatus('IDLE');
        setPaymentAttempt(1);
      }, 2000);
    }, 1500);
  };

  /*
    Hàm giả lập payment bị failed.
    Theo SRS, payment FAILED không reset về PENDING.
    Nếu muốn retry thì tạo payment mới.
  */
  const handlePaymentFailed = () => {
    if (!checkoutTime) {
      alert('Please start checkout before marking payment as failed.');
      return;
    }

    setPaymentStatus('FAILED');
  };

  /*
    Hàm retry payment.
    Theo SRS, retry tạo payment mới.
    Ở UI demo, mình tăng số attempt lên để thể hiện payment mới.
  */
  const handleRetryPayment = () => {
    setPaymentAttempt((prev) => prev + 1);
    setPaymentStatus('PENDING');
  };

  return (
    <div className="p-8 space-y-8">
      {/* PHẦN TIÊU ĐỀ TRANG */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Vehicle Check-out Portal
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          Verify vehicle departure details, lock checkout time, process payment, and complete parking session.
        </p>
      </div>

      {/* LAYOUT CHÍNH: BÊN TRÁI LÀ SESSION, BÊN PHẢI LÀ PAYMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: TÌM KIẾM VÀ XÁC NHẬN SESSION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">
            Exiting Vehicle Search
          </h3>

          {/* FORM TÌM KIẾM SESSION */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Enter license plate, ticket ID, or card code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
            />

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Find Session
            </button>
          </form>

          {/* NẾU TÌM THẤY SESSION */}
          {sessionData ? (
            <div className="space-y-6 animate-fadeIn">
              {/* KHỐI XÁC NHẬN BIỂN SỐ THỦ CÔNG */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Manual Vehicle Verification
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    Staff manually compares the vehicle plate at exit with the plate stored in the active parking session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* BIỂN SỐ LƯU TRONG HỆ THỐNG */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Plate in System
                    </label>

                    <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-700">
                      {sessionData.plate}
                    </div>
                  </div>

                  {/* BIỂN SỐ THỰC TẾ KHI XE RA */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Actual Exit Plate
                    </label>

                    <input
                      type="text"
                      value={actualExitPlate}
                      onChange={(e) => setActualExitPlate(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-700"
                    />
                  </div>
                </div>

                {/* TRẠNG THÁI SO KHỚP BIỂN SỐ */}
                <div
                  className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                    isPlateMatched
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isPlateMatched ? 'check_circle' : 'error'}
                  </span>

                  {isPlateMatched
                    ? 'License plate matched. Checkout can continue.'
                    : 'License plate does not match. Please verify before checkout.'}
                </div>
              </div>

              {/* THÔNG TIN SESSION */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Session ID
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {sessionData.sessionId}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Vehicle Type
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {sessionData.vehicleType}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Customer Type
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {sessionData.customerType}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Card Code
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {sessionData.cardCode}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Zone
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {sessionData.zone}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Actual Slot
                  </span>
                  <p className="text-sm font-bold mt-0.5">
                    {sessionData.slot || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Entry Time
                  </span>
                  <p className="text-sm font-semibold mt-0.5">
                    {sessionData.entryTime}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Duration
                  </span>
                  <p className="text-sm font-semibold mt-0.5">
                    {sessionData.duration}
                  </p>
                </div>
              </div>

              {/* KHỐI GHI NHẬN CHECK_OUT_TIME */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">
                    schedule
                  </span>

                  <div>
                    <h4 className="text-sm font-bold text-blue-800">
                      Checkout Time Lock
                    </h4>

                    <p className="text-xs text-blue-700 mt-1">
                      When checkout starts, the system records check_out_time and locks the fee.
                      Pending payment will not make the fee continue increasing.
                    </p>
                  </div>
                </div>

                {checkoutTime ? (
                  <div className="px-4 py-3 bg-white rounded-xl border border-blue-100 text-sm font-semibold text-slate-700">
                    Check-out time recorded: {checkoutTime}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCheckout}
                    disabled={!isPlateMatched}
                    className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Start Checkout & Lock Fee
                  </button>
                )}
              </div>
            </div>
          ) : (
            /*
              NẾU CHƯA TÌM SESSION
            */
            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">
                search
              </span>

              <p className="text-sm mt-2">
                Search for an active parking session by license plate, ticket ID, or card code.
              </p>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: PAYMENT PROCESS */}
        {sessionData && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">
                Payment Process
              </h3>

              {/* BREAKDOWN PHÍ */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Parking Fee</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(sessionData.parkingFee)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Penalty Fee</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(sessionData.penaltyFee)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Surcharge Fee</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(sessionData.surchargeFee)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Booking Deposit</span>
                  <span className="font-bold text-red-500">
                    - {formatCurrency(sessionData.depositPaid)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">
                    Amount Due
                  </span>

                  <span className="text-xl font-black text-emerald-600">
                    {formatCurrency(getAmountDue(sessionData))}
                  </span>
                </div>
              </div>

              {/* THÔNG TIN AUDIT ĐƠN GIẢN */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Pricing Policy</span>
                  <span className="font-bold">{sessionData.pricingPolicy}</span>
                </div>

                <div className="flex justify-between">
                  <span>Payment Source</span>
                  <span className="font-bold">SESSION</span>
                </div>

                <div className="flex justify-between">
                  <span>Payment Attempt</span>
                  <span className="font-bold">#{paymentAttempt}</span>
                </div>

                <div className="flex justify-between">
                  <span>Status</span>
                  <span
                    className={`font-bold ${
                      paymentStatus === 'PAID'
                        ? 'text-emerald-600'
                        : paymentStatus === 'FAILED'
                          ? 'text-red-500'
                          : paymentStatus === 'PENDING'
                            ? 'text-amber-500'
                            : 'text-slate-500'
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>

              {/* CHỌN PHƯƠNG THỨC THANH TOÁN */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'ONLINE_BANKING',
                      label: 'Online Banking',
                      icon: 'qr_code_2',
                    },
                    {
                      id: 'CASH',
                      label: 'Cash',
                      icon: 'payments',
                    },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`py-3 px-2 border rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 font-bold'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {method.icon}
                      </span>

                      <span className="text-[10px]">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* NÚT XỬ LÝ PAYMENT */}
            <div className="mt-8 space-y-3">
              {paymentStatus === 'FAILED' ? (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">
                    replay
                  </span>
                  Retry With New Payment
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={isProcessing || !checkoutTime}
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">
                        exit_to_app
                      </span>
                      Complete Checkout
                    </>
                  )}
                </button>
              )}

              {/* NÚT GIẢ LẬP PAYMENT FAILED */}
              {checkoutTime && paymentStatus !== 'PAID' && (
                <button
                  type="button"
                  onClick={handlePaymentFailed}
                  className="w-full py-3 bg-white border border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">
                    error
                  </span>
                  Simulate Payment Failed
                </button>
              )}
            </div>

            {/* OVERLAY CHECKOUT THÀNH CÔNG */}
            {isDone && (
              <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white font-sans transition-opacity duration-300">
                <span className="material-symbols-outlined text-4xl">
                  check_circle
                </span>

                <p className="font-bold mt-2">
                  Checked Out Successfully!
                </p>

                <p className="text-xs text-white/80 mt-1">
                  Parking session completed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}