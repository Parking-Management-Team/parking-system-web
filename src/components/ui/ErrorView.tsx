'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Home, HelpCircle, AlertTriangle, ShieldAlert, AlertOctagon, RefreshCw } from 'lucide-react';

export interface ErrorViewProps {
  statusCode: number | string;                  // Mã lỗi (Ví dụ: 403, 404, 500,...)
  title: string;                                // Tiêu đề lỗi
  description: string;                          // Mô tả chi tiết lỗi cho người dùng
  errorDetails?: string;                        // Thông tin kỹ thuật chi tiết (nếu có, để debug)
  onReset?: () => void;                         // Callback thử tải lại (dùng cho 500 system error)
  showSupportLink?: boolean;                    // Có hiển thị nút Liên hệ hỗ trợ không (Mặc định: true)
  customActions?: React.ReactNode;              // Nút hành động tùy chỉnh thay cho các nút mặc định
}

export function ErrorView({
  statusCode,
  title,
  description,
  errorDetails,
  onReset,
  showSupportLink = true,
  customActions
}: ErrorViewProps) {
  const router = useRouter();

  // Chọn icon phù hợp với mã lỗi
  const renderIcon = () => {
    switch (String(statusCode)) {
      case '403':
        return <ShieldAlert className="text-red-600 w-16 h-16 md:w-20 md:h-20 opacity-90" />;
      case '404':
        return <AlertOctagon className="text-[#006d43] w-16 h-16 md:w-20 md:h-20 opacity-90" />;
      default:
        return <AlertTriangle className="text-red-600 w-16 h-16 md:w-20 md:h-20 opacity-90 animate-pulse" />;
    }
  };

  // Chọn màu nền chìm phù hợp với tính chất của lỗi
  const bgGlowClass = String(statusCode) === '404' 
    ? 'bg-emerald-100' 
    : 'bg-red-100';

  const containerBorderClass = String(statusCode) === '404'
    ? 'bg-emerald-50/50 border-emerald-100'
    : 'bg-red-50/50 border-red-100';

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-12 animate-fade-in">
      {/* Background radial grid trang trí theo phong cách tối giản */}
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
      <div className={`absolute top-1/4 left-1/4 w-[300px] h-[300px] ${bgGlowClass} rounded-full blur-[100px] opacity-30 pointer-events-none`} />
      <div className={`absolute bottom-1/4 right-1/4 w-[300px] h-[300px] ${bgGlowClass} rounded-full blur-[100px] opacity-30 pointer-events-none`} />

      {/* Khung nội dung chính */}
      <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center space-y-8">
        {/* Brand Header */}
        <div>
          <span className="text-[#006d43] font-bold text-3xl md:text-4xl tracking-tight font-heading">
            NexPark
          </span>
        </div>

        {/* Đồ họa mã lỗi */}
        <div className={`relative w-full aspect-square max-w-[200px] md:max-w-[240px] mx-auto flex items-center justify-center rounded-full border shadow-sm select-none ${containerBorderClass}`}>
          {renderIcon()}
          
          {/* Số mã lỗi hiển thị mờ đằng sau */}
          <div className="absolute font-bold text-6xl md:text-7xl text-[#cfdaf2]/50 leading-none font-heading -z-10 select-none">
            {statusCode}
          </div>
          
          {/* Vòng tròn nét đứt quay xung quanh */}
          <div className="absolute w-full h-full animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-gray-300/30" />
        </div>

        {/* Copywriting */}
        <div className="space-y-3 px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-[#111c2d]">
            {title}
          </h2>
          <p className="font-sans text-[#3d4a41] text-sm md:text-base max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Khung hiển thị thông báo lỗi kỹ thuật ngắn gọn (nếu có) */}
        {errorDetails && (
          <div className="w-full max-w-md bg-red-50/50 border border-red-100 rounded-lg p-3 text-left max-h-24 overflow-y-auto">
            <span className="font-mono text-xs text-red-700 block break-words">
              Details: {errorDetails}
            </span>
          </div>
        )}

        {/* Nút hành động */}
        <div className="w-full pt-4">
          {customActions ? (
            customActions
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              {onReset ? (
                <button
                  onClick={onReset}
                  className="w-full sm:w-auto bg-[#006d43] hover:bg-[#005232] text-white font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] min-w-[160px]"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/')}
                  className="w-full sm:w-auto bg-[#006d43] hover:bg-[#005232] text-white font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] min-w-[160px]"
                >
                  <Home className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              )}
              
              {showSupportLink && (
                <a 
                  href="mailto:support@nexpark.com"
                  className="w-full sm:w-auto bg-transparent border border-[#6d7a70] text-[#3d4a41] hover:bg-gray-100 font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-w-[160px]"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Contact Support</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Error Reference Code - Mã tham chiếu lỗi */}
        <div className="font-mono text-xs text-[#505f79]/60">
          <span>Error Reference: ERR-{statusCode}-NX</span>
        </div>
      </div>
    </div>
  );
}
