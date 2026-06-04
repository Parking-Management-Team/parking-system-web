/**
 * AuthDrawer Component - Drawer toàn màn hình cho Login/Register
 *
 * Component drawer (tấm kéo) toàn màn hình, hiển thị LoginForm hoặc RegisterForm.
 * Được sử dụng khi user click "Login" hoặc "Get Started" trên landing page.
 *
 * Tính năng:
 * - Toàn màn hình (fullscreen drawer)
 * - Chuyển đổi giữa Login và Register (animation trượt)
 * - Đóng bằng nút X hoặc phím Escape
 * - Backdrop overlay (nền tối mờ phía sau)
 * - Animation: trượt từ phải vào (spring animation)
 *
 * @param isOpen - Drawer đang mở/đóng
 * @param onClose - Callback đóng drawer
 * @param initialMode - Chế độ ban đầu: 'login' hoặc 'register'
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthDrawer({ isOpen, onClose, initialMode = 'login' }: AuthDrawerProps) {
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);

  // Sync mode with initialMode when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle escape key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay - NO click to close, prevents data loss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Full-Screen Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed inset-0 h-full w-full bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.12)] z-[9999] flex flex-col overflow-hidden"
          >
            {/* Content Area - click propagation stopped to prevent overlay interaction */}
            <div className="flex-1 overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  {mode === 'login' ? (
                    <LoginForm
                      isModal={true}
                      onSuccess={onClose}
                      onClose={onClose}
                      onSwitchMode={() => setMode('register')}
                    />
                  ) : (
                    <RegisterForm
                      isModal={true}
                      onSuccess={onClose}
                      onClose={onClose}
                      onSwitchMode={() => setMode('login')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
