/**
 * Custom 404 Page - Trang không tìm thấy nội dung
 * 
 * File này xử lý hiển thị khi người dùng truy cập vào một URL không tồn tại.
 * Theo yêu cầu của dự án:
 * - Bình luận và ghi chú bằng Tiếng Việt
 * - Thông báo, tiêu đề, mã lỗi hiển thị bằng Tiếng Anh
 * - Tông màu đồng bộ với NexPark (Xanh lá / Emerald và Navy / Slate)
 */

import Link from 'next/link';
import { Home, HelpCircle, AlertOctagon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-12">
      {/* Background radial grid trang trí theo phong cách tối giản của Stripe/NexPark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none">
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: 'radial-gradient(#006d43 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        />
      </div>

      {/* Ambient glow effects - Tạo các quầng sáng mờ làm nổi bật giao diện */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-100 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-100 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      {/* Khung nội dung chính */}
      <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center animate-fade-in">
        {/* Brand Header */}
        <div className="mb-12 md:mb-16">
          <span className="text-[#006d43] font-bold text-3xl md:text-4xl tracking-tight font-heading">
            NexPark
          </span>
        </div>

        {/* Số 404 và icon chìm phía sau */}
        <div className="relative mb-8 md:mb-12 flex items-center justify-center select-none">
          <div className="font-bold text-[10rem] md:text-[14rem] text-[#cfdaf2] leading-none opacity-40 font-heading">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertOctagon className="text-[#006d43] opacity-[0.12] w-32 h-32 md:w-44 md:h-44" />
          </div>
        </div>

        {/* Copywriting */}
        <div className="space-y-4 px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-[#111c2d]">
            Page Not Found
          </h2>
          <p className="font-sans text-[#3d4a41] text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            The link you followed may be broken, or the page has been moved. Please verify the URL or return to the main dashboard to continue your session.
          </p>
        </div>

        {/* Action Buttons - Các nút tương tác */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full justify-center">
          <Link 
            href="/"
            className="w-full sm:w-auto bg-[#006d43] hover:bg-[#005232] text-white font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <a 
            href="mailto:support@nexpark.com"
            className="w-full sm:w-auto bg-transparent border border-[#6d7a70] text-[#3d4a41] hover:bg-gray-100 font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Contact Support</span>
          </a>
        </div>

        {/* Error Reference Code - Mã tham chiếu lỗi */}
        <div className="mt-16 md:mt-24 font-mono text-xs md:text-sm text-[#505f79]/60">
          <span>Error Reference: ERR-404-NX</span>
        </div>
      </div>
    </div>
  );
}
