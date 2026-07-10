/**
 * Custom 404 Page - Trang không tìm thấy nội dung
 * 
 * File này xử lý hiển thị khi người dùng truy cập vào một URL không tồn tại.
 * Sử dụng component ErrorView dùng chung để thống nhất thiết kế.
 */

import { ErrorView } from '@/components/ui';

export default function NotFound() {
  return (
    <ErrorView
      statusCode="404"
      title="Page Not Found"
      description="The link you followed may be broken, or the page has been moved."
    />
  );
}

