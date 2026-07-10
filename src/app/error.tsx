'use client'; // Next.js Error Components bắt buộc phải là Client Component

/**
 * Custom 500/System Error Page - Màn hình báo lỗi hệ thống
 * 
 * File này hoạt động như một Error Boundary của Next.js App Router.
 * Sử dụng component ErrorView dùng chung để thống nhất thiết kế.
 */

import * as React from 'react';
import { ErrorView } from '@/components/ui';

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
    <ErrorView
      statusCode="500"
      title="System Error"
      description="Something went wrong on our end. We are working to fix it. Please try your request again shortly."
      errorDetails={error.message}
      onReset={reset}
    />
  );
}

