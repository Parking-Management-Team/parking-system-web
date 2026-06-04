'use client'; // Next.js Error Components bắt buộc phải là Client Component

/**
 * Custom 500/System Error Page - Màn hình báo lỗi hệ thống
 * 
 * File này hoạt động như một Error Boundary của Next.js App Router.
 * Bất cứ lỗi runtime nào xảy ra trong ứng dụng sẽ được bắt ở đây và hiển thị giao diện này.
 * Theo yêu cầu của dự án:
 * - Bình luận và ghi chú bằng Tiếng Việt
 * - Thông báo, tiêu đề, mã lỗi hiển thị bằng Tiếng Anh
 * - Tông màu đồng bộ với NexPark (Xanh lá / Emerald và đỏ nhạt của Error container)
 */

import * as React from 'react';
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string }; // Đối tượng chứa thông tin chi tiết về lỗi xảy ra
  reset: () => void;                 // Hàm reset giúp thử tải lại phần bị lỗi (retry segment render)
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Ghi nhận lỗi lỗi hệ thống vào console để hỗ trợ dev kiểm tra/debug
    console.error('Runtime System Error occurred:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-12">
      {/* Decorative ambient background - Các mảng màu nền khuếch tán tạo chiều sâu */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Vệt sáng đỏ nhẹ báo lỗi góc trên bên phải */}
        <div className="w-[120vw] h-[120vw] sm:w-[80vw] sm:h-[80vw] rounded-full bg-red-100/40 blur-[100px] absolute -top-1/4 -right-1/4 pointer-events-none" />
        {/* Vệt sáng xanh emerald góc dưới bên trái */}
        <div className="w-[100vw] h-[100vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-emerald-100/30 blur-[100px] absolute bottom-0 left-0 pointer-events-none" />
      </div>

      {/* Khung nội dung chính */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center space-y-8 animate-fade-in">
        {/* Logo Header */}
        <header className="w-full text-center">
          <h1 className="font-heading text-3xl md:text-4xl text-[#006d43] tracking-tight font-bold">
            NexPark
          </h1>
        </header>

        {/* Khu vực vòng tròn đồ họa thông tin lỗi */}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center rounded-full bg-red-50 border border-red-200 shadow-sm select-none">
          <AlertTriangle className="text-red-600 w-24 h-24 opacity-80 animate-pulse" />
          
          {/* Vòng tròn quỹ đạo nét đứt tạo chuyển động thẩm mỹ */}
          <div className="absolute w-full h-full animate-[spin_15s_linear_infinite] rounded-full border border-dashed border-red-500/20" />
        </div>

        {/* Tiêu đề & Nội dung mô tả */}
        <div className="space-y-3 px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-[#111c2d]">
            500 - System Error
          </h2>
          <p className="font-sans text-[#3d4a41] text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Something went wrong on our end. We are working to fix it. Please try your request again shortly.
          </p>
        </div>

        {/* Khung hiển thị thông báo lỗi kỹ thuật ngắn gọn (Dev debug) */}
        {error.message && (
          <div className="w-full bg-red-50 border border-red-100 rounded-lg p-3 text-left max-h-24 overflow-y-auto">
            <span className="font-mono text-xs text-red-700 block break-words">
              Details: {error.message}
            </span>
          </div>
        )}

        {/* Các nút hành động */}
        <div className="w-full flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 justify-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#006d43] hover:bg-[#005232] text-white font-semibold py-3.5 px-8 rounded-lg flex justify-center items-center gap-2 transition-all shadow-sm active:scale-[0.98] min-w-[160px]"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <a
            href="mailto:support@nexpark.com"
            className="w-full sm:w-auto bg-transparent text-[#006d43] border border-[#006d43]/50 hover:bg-emerald-50/50 font-semibold py-3.5 px-8 rounded-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98] min-w-[160px]"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}
