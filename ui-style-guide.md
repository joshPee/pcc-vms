# UI Style Guide - Pentecost Convention Center App

This document captures the complete UI styling system for reuse in other projects (e.g., visitor management system).

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Utilities**: clsx + tailwind-merge

## Color Palette

The app uses a custom forest-themed color palette defined in `tailwind.config.ts`:

```typescript
colors: {
  forest: '#0B3D2E',           // Primary forest green
  'forest-deep': '#082C21',    // Darker forest shade
  gold: '#C89B3C',             // Accent gold
  'gold-soft': '#E4C77E',      // Lighter gold
  cream: '#F6F1E4',            // Background cream
  ink: '#1F2420',              // Dark text
  brick: '#A9333A',            // Accent red
  sage: '#E4EBDF',             // Soft green
  line: '#D8CFB8',             // Border/line color
  'admin-bg': '#FBFAF6',       // Admin background
}
```

## Typography

### Fonts (from `src/lib/fonts.ts`)

1. **Fraunces** (Serif)
   - Weights: 400, 500, 600
   - CSS variable: `--font-fraunces`
   - Use for: Headings, display text

2. **IBM Plex Sans** (Sans-serif)
   - Weights: 400, 500, 600, 700
   - CSS variable: `--font-ibm-plex-sans`
   - Use for: Body text, UI elements

3. **IBM Plex Mono** (Monospace)
   - Weights: 500, 600
   - CSS variable: `--font-ibm-plex-mono`
   - Use for: Code, data, technical text

4. **Geist** (Default Sans)
   - CSS variable: `--font-sans`
   - Use for: General UI text

### Tailwind Config

```typescript
fontFamily: {
  fraunces: ['var(--font-fraunces)', 'serif'],
  'ibm-plex-sans': ['var(--font-ibm-plex-sans)', 'sans-serif'],
  'ibm-plex-mono': ['var(--font-ibm-plex-mono)', 'monospace'],
}
```

## Key UI Components

### 1. Summary Card (`src/components/ui/summary-card.tsx`)

**Features:**
- Large value display with icon
- Mini bar chart visualization
- Badge/trend indicators
- Live indicator (pulsing dot)
- Footer with avatars or text
- Hover lift effect
- Optional link wrapping

**Usage Example:**
```tsx
<SummaryCard
  title="Total Visitors"
  value="1,234"
  subtitle="This month"
  icon={Users}
  iconColor="text-blue-600"
  iconBgColor="bg-blue-100"
  badge={{ text: "Active", variant: "emerald" }}
  trend={{ value: "+12%", positive: true }}
  footerText="26 Attended"
  footerAvatars={["JD", "AS", "MK"]}
  chartData={[40, 60, 45, 70, 55, 80, 65, 75, 50, 60]}
  chartColor="bg-blue-400/70"
/>
```

**Badge Variants:** `emerald`, `amber`, `rose`, `blue`, `slate`, `purple`

### 2. Card (`src/components/ui/card.tsx`)

Modern card component with slots:
- `Card` - Container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Subtitle/description
- `CardAction` - Action button area
- `CardContent` - Main content
- `CardFooter` - Footer section

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### 3. Other UI Components

Located in `src/components/ui/`:
- `badge.tsx` - Status badges
- `button.tsx` - Buttons with variants
- `input.tsx` - Form inputs
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `select.tsx` - Select dropdowns
- `tabs.tsx` - Tab navigation
- `toast.tsx` - Toast notifications
- `status-badge.tsx` - Specialized status badges
- `empty-state.tsx` - Empty state displays
- `page-header.tsx` - Page headers
- `section-card.tsx` - Section containers

## Custom CSS Classes

### Animation Classes
- `animate-fade-in-up` - Fade in with upward movement
- `animate-slide-in-left` - Slide in from left
- `animate-scale-in` - Scale in effect
- `animation-delay-0` through `animation-delay-6` - Staggered delays

### Background Classes
- `dashboard-bg` - Gradient background for dashboard
- `login-bg` - Gradient background for login page
- `login-dots` - Dot pattern overlay
- `sidebar-gradient` - Gradient sidebar background
- `topbar-glass` - Glassmorphism topbar

### Interactive Classes
- `card-lift` - Card hover lift effect
- `table-enhanced` - Enhanced table with hover effects
- `nav-active-indicator` - Active nav item indicator
- `section-header-accent` - Header gradient accent

### Utility Classes
- `scrollbar-hide` - Hide scrollbar
- `safe-area-bottom` - Mobile safe area padding
- `safe-area-top` - Mobile safe area padding
- `touch-target` - Minimum touch target size

## Dark Mode

Dark mode is configured with:
- `darkMode: 'class'` in tailwind.config
- CSS variables for dark theme colors in `globals.css`
- All components support dark mode via `dark:` prefixes

## Setup Instructions for New Project

### 1. Install Dependencies

```bash
npm install next@latest react@latest react-dom@latest
npm install tailwindcss@latest @tailwindcss/postcss@latest postcss@latest autoprefixer@latest
npm install clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install class-variance-authority
npm install tw-animate-css
npm install shadcn@latest
```

### 2. Copy Configuration Files

**tailwind.config.ts:**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#0B3D2E',
        'forest-deep': '#082C21',
        gold: '#C89B3C',
        'gold-soft': '#E4C77E',
        cream: '#F6F1E4',
        ink: '#1F2420',
        brick: '#A9333A',
        sage: '#E4EBDF',
        line: '#D8CFB8',
        'admin-bg': '#FBFAF6',
      },
      fontFamily: {
        fraunces: ['var(--font-fraunces)', 'serif'],
        'ibm-plex-sans': ['var(--font-ibm-plex-sans)', 'sans-serif'],
        'ibm-plex-mono': ['var(--font-ibm-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
```

**src/lib/fonts.ts:**
```typescript
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});
```

**src/lib/utils.ts:**
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. Copy globals.css

Copy the entire `src/app/globals.css` file from the cocobod-app to your new project. This contains:
- Tailwind imports
- CSS custom properties
- Dark mode variables
- Animation keyframes
- Custom utility classes
- Scrollbar styling

### 4. Copy UI Components

Copy these components from `src/components/ui/`:
- `summary-card.tsx` - The main summary card component
- `card.tsx` - Base card component
- Other components as needed (badge, button, input, etc.)

### 5. Update Root Layout

```tsx
import type { Metadata, Viewport } from "next";
import { fraunces, ibmPlexSans, ibmPlexMono } from "@/lib/fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", fraunces.variable, ibmPlexSans.variable, ibmPlexMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
```

## Design Patterns

### Card Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <SummaryCard />
  <SummaryCard />
  <SummaryCard />
</div>
```

### Section with Card
```tsx
<section className="mt-6">
  <div className="section-header-accent mb-4">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
      Section Title
    </h2>
  </div>
  <Card>
    <CardContent>
      Content here
    </CardContent>
  </Card>
</section>
```

### Table with Enhanced Styling
```tsx
<table className="table-enhanced w-full">
  <thead>
    <tr>
      <th className="text-left text-sm font-medium text-slate-600 dark:text-slate-400">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="text-sm text-slate-900 dark:text-white">Data</td>
    </tr>
  </tbody>
</table>
```

## Best Practices

1. **Use the `cn()` utility** for merging Tailwind classes
2. **Apply dark mode** with `dark:` prefix for all colored elements
3. **Use animation delays** for staggered entrance effects in card grids
4. **Leverage the color palette** - use forest, gold, cream instead of arbitrary colors
5. **Keep consistent spacing** - use the existing spacing patterns
6. **Use the custom scrollbar** styling for consistency
7. **Apply card-lift** for interactive cards that need hover effects

## Theme Customization

To adapt this theme for your visitor management system:

1. **Keep the color palette** - it's well-designed and cohesive
2. **Adjust font usage** - keep Fraunces for headings, IBM Plex Sans for body
3. **Reuse the SummaryCard** - perfect for visitor statistics
4. **Use the card components** - consistent container styling
5. **Apply the same animations** - for smooth, professional feel
6. **Keep dark mode support** - all components are dark-mode ready

## File Structure Reference

```
src/
├── app/
│   ├── globals.css          # Global styles, CSS variables, animations
│   └── layout.tsx           # Root layout with fonts
├── components/
│   └── ui/
│       ├── summary-card.tsx # Main summary card component
│       ├── card.tsx         # Base card component
│       ├── badge.tsx        # Status badges
│       ├── button.tsx       # Button component
│       └── ...              # Other UI components
└── lib/
    ├── fonts.ts             # Font configurations
    └── utils.ts             # cn() utility function
```
