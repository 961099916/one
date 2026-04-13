# One-Review AI Chat Design System (Stitch Inspired)

This document defines the core design language for the One-Review (壹复盘) AI interaction layer. It is optimized for high readability, professional productivity, and a seamless "AI-native" vibe.

## Design Tokens

### Colors
- **Neutral Background**: `--el-bg-color-page` (#F5F5F7 / #121212)
- **Primary Accent**: `--el-color-primary` (#165DFF)
- **Document Surface**: `--el-bg-color` (#FFFFFF / #17171A)
- **Border**: `--el-border-color-lighter` (Subtle 1px stroke)

### Typography
- **Font Stack**: `Inter`, `-apple-system`, `PingFang SC`, sans-serif.
- **Main Readability**:
  - `font-size`: 16px
  - `line-height`: 1.8 (Golden ratio for long-form financial analysis)
  - `letter-spacing`: 0.2px
- **Headings**: Semibold (600) with generous top margin (32px).

### Shadows (The "Floating" Vibe)
- **Premium Shadow**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **Interactive Shadow**: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`

## Component Standards

### 1. Chat History Sidebar (Collapsible)
- **Style**: Solid neutral background, no blur.
- **Behavior**: Slide-in/out. Width: 260px.
- **Active State**: Subtle background tint, primary color text.

### 2. Message Document Flow
- **Assistant**: 100% width, no bubble container. Clear spacing between paragraphs.
- **User**: Right-aligned, subtle bubble (Radius: 24px) for visual contrast.
- **Markdown**: Optimized table borders and code block headers.

### 3. Floating Input Bar
- **Position**: Fixed bottom, centered.
- **Shape**: Rounded (20px).
- **Vibe**: High-shadow card that feels like it's hovering over the content.
- **Width**: Max 840px.

## Micro-Animations
- **Fade In**: Messages appear with a gentle opacity fade.
- **Input Resize**: Height change should be instantaneous but feel smooth.
- **Sidebar**: 300ms cubic-bezier transition.
