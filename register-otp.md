# Implementation Plan: Register Account with Email OTP Verification

This plan outlines the steps required to implement a secure, professional email-based OTP registration flow for NexPark. The flow consists of a step-by-step wizard (1. Enter email -> 2. Verify OTP -> 3. Complete registration details) with a premium 6-digit OTP input interface and a persistent 60-second cooldown timer.

---

## 📋 Overview
NexPark users currently register via a single-form interface that registers accounts mock-style in `localStorage`. This feature updates the frontend to verify users' email addresses via OTP before final registration, consuming three backend APIs:
1. `POST /api/auth/send-otp` (request OTP for an email, with a 60-second rate limit).
2. `POST /api/auth/verify-otp` (submit OTP to receive a temporary verification token).
3. `POST /api/auth/register-verified` (submit name, phone, password, and the token to create the account).

---

## 📱 Project Type
- **Type:** WEB (Next.js & React Web Application)
- **Primary Agent:** `frontend-specialist`
- **Secondary Agents:** None (All changes are web frontend modifications)

---

## 🎯 Success Criteria
1. **Security & Validation:**
   - Only validated emails containing a valid verification token can proceed to the registration completion phase.
   - Robust input validation (valid email format, 6-digit number constraint, phone number, matching passwords).
2. **Aesthetics & UX:**
   - Premium 6-digit individual box inputs with auto-focus, backspace-handling, and paste functionality.
   - Elegant loading spin state during API calls.
   - Error messages rendered cleanly in toast notifications or inline red notices.
3. **Resiliency:**
   - OTP resend cooldown timer (60 seconds) is synchronized with `localStorage`. If the user refreshes the page mid-cooldown, the countdown resumes accurately.
   - Nút "Resend OTP" is disabled and displays a ticking countdown until cooldown completes.
4. **Transition animations:**
   - Step transitions utilize `framer-motion` for a smooth slide or fade experience.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15.1.6 (App Router)
- **State Management:** React Context (`AuthContext.tsx`)
- **Styling:** Tailwind CSS v3.4.17 + Vanilla CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React

---

## 📁 File Structure Changes
We will modify and create the following files:
```plaintext
src/
├── features/
│   └── auth/
│       ├── context/
│       │   └── AuthContext.tsx        # Update context to include API calls and registerVerified
│       └── components/
│           ├── RegisterForm.tsx       # Complete rewrite to step-by-step wizard
│           └── OtpInput.tsx           # (New Component) Premium 6-digit box input
└── hooks/
    └── useOtpCooldown.ts              # (New Hook) LocalStorage-backed timer hook
```

---

## 📝 Task Breakdown

### Task 1: Update Auth Context Types and Implementation
- **Task ID:** `AUTH_CONTEXT_INTEGRATION`
- **Agent:** `frontend-specialist`
- **Skills:** `api-patterns`, `clean-code`
- **Priority:** High
- **Dependencies:** None
- **Description:** 
  Integrate the new OTP APIs into `AuthContext.tsx` and export functions for `sendOtp`, `verifyOtp`, and `registerVerified`. Handle error formats properly so components can display specific error messages.
- **INPUT:** Giao diện APIs mới từ backend.
- **OUTPUT:** Các hàm `sendOtp(email)`, `verifyOtp(email, otp)`, và `register(fullName, email, phone, password, verificationToken)` có kiểu dữ liệu rõ ràng trong `AuthContextType`.
- **VERIFY:** 
  - Đảm bảo các hàm gọi đúng endpoint API bằng `api.post` từ `@/lib/api/client`.
  - Kiểm tra xem kiểu trả về có khớp với định dạng DTO của API.
  - Compile và chạy không lỗi TypeScript: `npx tsc --noEmit`.

---

### Task 2: Create Persistent Cooldown Hook
- **Task ID:** `OTP_COOLDOWN_HOOK`
- **Agent:** `frontend-specialist`
- **Skills:** `clean-code`
- **Priority:** Medium
- **Dependencies:** None
- **Description:**
  Create a hook `useOtpCooldown` that manages a 60-second countdown timer. It saves the timestamp of when the OTP was sent to `localStorage` (e.g. `nexpark_otp_cooldown_timestamp`). On hook initialization or window focus, it recalculates the remaining seconds, ensuring page refreshes do not skip the cooldown.
- **INPUT:** `localStorage` API và React Hooks.
- **OUTPUT:** File `src/hooks/useOtpCooldown.ts`.
- **VERIFY:**
  - Viết code chạy thử đếm ngược trong React component.
  - Nhấn F5 lại trang giữa chừng đếm ngược, bộ đếm vẫn tiếp tục chạy đúng với số giây thực tế còn lại.

---

### Task 3: Create Premium 6-Digit OTP Input Component
- **Task ID:** `OTP_INPUT_COMPONENT`
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`, `clean-code`
- **Priority:** High
- **Dependencies:** None
- **Description:**
  Develop a premium 6-digit input component `OtpInput.tsx` in `src/features/auth/components/`.
  - Render 6 individual `<input type="text" maxLength={1} />` boxes.
  - Auto-focus the next box on input.
  - Go back to the previous box on Backspace key.
  - Support pasting a full 6-digit string, filling all inputs.
  - Input filtering: only allow digits (0-9).
- **INPUT:** Yêu cầu UI và Tailwind CSS.
- **OUTPUT:** File `src/features/auth/components/OtpInput.tsx`.
- **VERIFY:**
  - Nhập từng số -> con trỏ tự động nhảy sang phải.
  - Nhấn backspace -> con trỏ quay lại và xóa số trước.
  - Copy mã `123456` và paste vào ô đầu tiên -> 6 ô tự động điền đầy đủ.

---

### Task 4: Implement Step-by-Step Register Form Wizard
- **Task ID:** `REGISTER_FORM_REWRITE`
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`, `tailwind-patterns`, `nextjs-react-expert`
- **Priority:** High
- **Dependencies:** `AUTH_CONTEXT_INTEGRATION`, `OTP_COOLDOWN_HOOK`, `OTP_INPUT_COMPONENT`
- **Description:**
  Rewrite `RegisterForm.tsx` into a 3-step wizard using `framer-motion` for transitions.
  - **Step 1 (Email Input):** Enter email, trigger `sendOtp(email)`. Displays Google Sign Up.
  - **Step 2 (OTP Verification):** Render `OtpInput`, countdown cooldown timer, and a disabled/enabled "Resend OTP" button. Trigger `verifyOtp` on fill or submission, saving the returned `verificationToken` in component state.
  - **Step 3 (Details Registration):** Enter Full Name, Phone Number, Password, and Confirm Password. Submit `registerVerified` along with the saved verification token.
  - Displays beautiful state transitions, loading spinners on buttons, and error toasts.
- **INPUT:** `RegisterForm.tsx` gốc, `OtpInput` và `useOtpCooldown`.
- **OUTPUT:** `src/features/auth/components/RegisterForm.tsx` hoàn thiện.
- **VERIFY:**
  - Màn hình chuyển đổi mượt mà giữa các bước bằng animation.
  - Nếu API lỗi, thông báo lỗi được hiển thị tương ứng trên nút/form.
  - Đăng ký thành công điều hướng về trang đăng nhập hoặc đóng modal.

---

## 🏁 Phase X: Final Verification

> [!IMPORTANT]
> A task is not complete until all scripts in the verification suite return success.

### 1. Manual Checklist Audit
- [ ] UI complies with NexPark's design language (emerald themes, dark inputs, clean lines).
- [ ] No purple/violet color hex values used in styling (compliance with agent design rules).
- [ ] Transition animations feel responsive and performant.

### 2. Auto Validation Scripts
Run the following commands in the workspace root to check for issues before shipping:
```bash
# Verify TypeScript compiles without error
npx tsc --noEmit

# Run project linter
npm run lint

# Run security checks
python .agents/skills/vulnerability-scanner/scripts/security_scan.py .

# Run UX audit
python .agents/skills/frontend-design/scripts/ux_audit.py .
```

### 3. Build & Runtime Check
```bash
# Build the project to confirm bundler success
npm run build

# Start local server to preview changes
npm run dev
```
Check in browser that the flow registers correctly and errors are elegantly caught.
