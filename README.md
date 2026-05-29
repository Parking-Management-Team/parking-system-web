# 🚗 NexPark - Smart Parking Management System

NexPark is a premium, high-performance, and visually stunning landing page for the next-generation Smart Parking Management System (PBMS). Built with **Next.js**, **React**, **Tailwind CSS**, and **Framer Motion**, NexPark features a clinical, premium dark cinematic aesthetic with state-of-the-art animations.

---

## 🎨 Design System & Color Palette

The visual identity of NexPark centers on a curated, clinical, and high-end technical aesthetic. We deliberately avoid generic UI styles in favor of sharp lines, monospaced tech overlays, and a singular luminous accent.

### 🟢 Primary Brand Colors

| Role | HEX / Value | Tailwind Utility | Visual Description |
|---|---|---|---|
| **Primary Accent** | `#10b981` (Emerald 500) | `text-emerald-500` / `bg-emerald-500` | The core brand spotlight used for key CTAs, typewriter text highlights, and active status indicators. |
| **Dark Primary** | `#059669` (Emerald 600) | `hover:bg-emerald-600` | Used for hover states on primary interactive elements to maintain elegant micro-transitions. |
| **Luminous Mint** | `#34d399` (Emerald 400) | `bg-emerald-400` | Utilized for monospaced label titles and typewriter active caret pulse effects. |
| **Deep Cinematic Onyx** | `#000000` / `#0B0F17` | `bg-black` / `bg-gray-950` | Background canvas for high-contrast presentation of the dynamic video backdrops. |
| **Clean Pure White** | `#FFFFFF` | `text-white` / `bg-white` | Pristine white typography and elegant glass outlines. |

### ✨ Styling Rules (Stitch UI Philosophy)
*   **Sharp Borders & Outlines:** Rounded corner radii are locked to standard clinical values (`rounded-xl` / `rounded-2xl`) for a clean hardware-terminal look.
*   **Transparent Glass Taskbar:** Translucent blurring (`backdrop-blur-md bg-black/40 border-white/10`) dynamically converts on scroll.
*   **Zero Placeholders:** Realistic parking assets including cinematic background loops and dynamic monospaced count-ups.

---

## 📁 Standardized Folder Directory

We have organized the codebase using a highly standard, modular directory structure optimized for future feature scalability and collaborative teamwork:

```text
src/
├── app/                        # Next.js App Router core routing
│   ├── globals.css             # Main styling, Tailwind layers & utility rules
│   ├── layout.tsx              # Root HTML wrapper and global page layout
│   └── page.tsx                # Main entry landing page (composed of modular sections)
├── components/                 # Standardized reusable components
│   ├── layout/                 # Global structural frame components
│   │   ├── Navbar.tsx          # Dynamic responsive glass navigation header
│   │   └── Footer.tsx          # Premium 4-column brand grid footer
│   ├── sections/               # Large page section components
│   │   ├── About.tsx           # Brand presentation and core statistics
│   │   ├── CTA.tsx             # Interactive, high-converting registration call-to-action
│   │   ├── Contact.tsx         # Verified contact/enquiry input fields
│   │   ├── Features.tsx        # Responsive grid highlighting parking capabilities
│   │   ├── Hero.tsx            # Cinematic video hero section with live HUD metrics
│   │   ├── HowItWorks.tsx      # Step-by-step visual system workflow guide
│   │   └── Pricing.tsx         # Detailed shift-switched pricing option grids
│   └── ui/                     # Low-level reusable Atomic elements
│       ├── Button.tsx          # Framer Motion animated interactive button
│       ├── CountUp.tsx         # Intersection-observed monospaced number counter
│       ├── TypewriterText.tsx  # Dynamic infinite typewriter effect component
│       └── WavyNavLink.tsx     # Animated bottom-sliding underline nav links
```

---

## 📦 Modular Components & Reuse Guide

To maintain dry, reusable UI consistency, developers should use the following pre-built elements:

### 1. **Interactive Premium Button (`Button.tsx`)**
An animated component featuring scale-up on hover and press indentation transitions via Framer Motion.

```tsx
import Button from '@/components/ui/Button'

// Primary CTA
<Button variant="primary" size="lg" onClick={handleAction}>
  Reserve Space
</Button>

// Outlined Glass
<Button variant="outline" size="md" onClick={handleAction}>
  Learn More
</Button>
```

### 2. **Monospaced Stats Counter (`CountUp.tsx`)**
Triggers a smooth count-up animation automatically *only when* the element scrolls into viewport view.

```tsx
import CountUp from '@/components/ui/CountUp'

<div className="text-center">
  <p className="text-4xl font-extrabold text-white">
    <CountUp end={500} suffix="+" duration={2500} />
  </p>
  <span className="text-xs text-emerald-400">ACTIVE SPOTS</span>
</div>
```

### 3. **Dynamic Typewriter Text (`TypewriterText.tsx`)**
Performs a crisp typing and deleting loop across an array of terms.

```tsx
import TypewriterText from '@/components/ui/TypewriterText'

<h1 className="text-5xl font-extrabold">
  Park Smarter with{' '}
  <TypewriterText 
    words={["NexPark.", "Efficiency.", "Automation."]} 
    typingSpeed={90} 
    deletingSpeed={45} 
    delayBetweenWords={2500}
  />
</h1>
```

---

## 🚀 Running the Project Locally

To run the Next.js development server locally:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start development server:**
    ```bash
    npm run dev
    ```
3.  **Build production version:**
    ```bash
    npm run build
    ```
