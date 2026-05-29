# 📋 SahabatBradPitt - Mobile Styling Plan

**Date**: 2026-05-29
**Status**: Ready to Implement
**Goal**: Mobile-first responsive styling dengan fokus ke mobile dulu, desktop TIDAK berubah

---

## 🎯 Prinsip Dasar

### Mobile-First Responsive
1. **Tambah mobile styles** — jangan ubah class desktop yang sudah ada
2. **Desktop aman** — kalau ragu, pakai `md:` prefix
3. **Grid 2 kolom mobile** — `grid-cols-2`, desktop tetap 4-6 kolom
4. **Spacing tighter di mobile** — `p-4 md:p-6`, bukan ubah `p-6 md:p-12` jadi `p-4 md:p-4`

---

## 📱 Responsive Breakpoints (Tailwind)

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| `<640px` (default) | Mobile phones | 2 columns, compact spacing |
| `sm:` | 640px+ | Small tablets, large phones |
| `md:` | 768px+ | Tablets, desktop |
| `lg:` | 1024px+ | Desktop |

---

## 📁 Files yang Perlu Diubah

### Tier 1 - Template utama (paling penting)
| File | Target |
|------|--------|
| `templates/home.html` | Grid actors 2 kolom, spacing mobile |
| `templates/movies/film_list.html` | Film grid 2 kolom, sidebar layout |
| `templates/movies/film_detail.html` + partials | Layout compact di mobile |
| `templates/actors/actor_detail.html` | Filmography grid 2 kolom |
| `templates/base.html` | Responsive navbar, footer |

### Tier 2 - Partial templates
| File | Target |
|------|--------|
| `templates/movies/partials/film_hero.html` | Hero mobile layout |
| `templates/movies/partials/film_content.html` | Content grid 1 kolom |

### Tier 3 - JS dynamic cards (perlu update JS)
| File | Target |
|------|--------|
| `static/js/movies/film_list.js` | Film card responsive |
| `static/js/movies/film_detail_cast.js` | Cast grid |
| `templates/actors/actor_detail.html` (inline JS) | Filmography cards |

---

## 🔧 Checklist Implementasi

### 1. Home Page (`home.html`)

```
Section         │ Mobile          │ Desktop
────────────────┼────────────────┼──────────────
Hero banner     │ Full width     │ Full width (udah ok)
Trending        │ Cards 140px    │ Cards 240px
Actors grid     │ 2 cols         │ 6 cols (udah ada)
Featured movies │ 1 col          │ 2 cols (LLG grid)
Spacing        │ py-8           │ py-16 (ubah!)
Padding        │ px-4           │ px-12 (ubah!)
```

**Changes:**
- [ ] Trending carousel card: `w-[140px]` (mobile), `md:w-[240px]`
- [ ] Section padding: `py-8 md:py-16`
- [ ] Container padding: `px-4 md:px-12` (bukan sebaliknya)

### 2. Film List Page (`film_list.html`)

```
Element           │ Mobile               │ Desktop
──────────────────┼─────────────────────┼────────────
Film cards        │ 2 cols              │ flex row
Filter sidebar   │ Below content        │ Right side
Card layout      │ Poster top, info     │ Poster left, info right
Card poster      │ w-full, aspect       │ w-[130px]
```

**Changes:**
- [ ] `#film-grid`: `flex flex-col gap-4` (mobile) → grid cols
- [ ] Filter sidebar: `mt-8` (below content mobile)
- [ ] Main layout: flex col (filter below), lg:flex-row

### 3. Film Detail Page

#### `film_hero.html`
```
Element      │ Mobile          │ Desktop
─────────────┼────────────────┼────────────
Hero height  │ h-[300px]       │ h-[450px]
Poster       │ hidden          │ sm:block (udah ada)
Meta info    │ center aligned │ left aligned (udah ada)
```

**Changes:**
- [ ] Hero height: `h-[300px] md:h-[450px]`
- [ ] Title: `text-2xl md:text-5xl`

####  `film_content.html`
```
Element     │ Mobile          │ Desktop
────────────┼────────────────┼────────────
Grid       │ 1 col           │ grid-cols-3
Cast grid   │ 2 cols         │ 4 cols (udah ada)
Review     │ full width     │ sidebar
```

**Changes:**
- [ ] Main grid: `grid-cols-1 lg:grid-cols-3`

### 4. Actor Detail Page (`actor_detail.html`)

```
Element           │ Mobile          │ Desktop
──────────────────┼────────────────┼──────────
Profile photo     │ w-28 h-28      │ w-44 h-44
Filmography grid  │ 2 cols         │ 5 cols (udah ada)
Bio text          │ text-sm        │ text-base
```

**Changes:**
- [ ] Profile: `w-28 h-28 md:w-44 md:h-44`
- [ ] Name: `text-2xl md:text-5xl`
- [ ] Bio: `text-sm md:text-base`

### 5. Base Template (`base.html`)

```
Element        │ Mobile          │ Desktop
───────────────┼────────────────┼──────────
Navbar height  │ 60px           │ 80px
Nav links      │ hidden (menu)  │ visible (udah ada)
Footer layout │ 2 cols grid   │ row (flex)
```

**Changes:**
- [ ] Navbar height: `h-[60px] md:h-[80px]`
- [ ] Mobile menu top: `top-[60px] md:top-[80px]`

---

## 📝 CSS Classes Quick Reference

### Spacing Mobile Override
```html
<!-- ✅ Benar - mobile base, desktop enhancement -->
<div class="px-4 py-6 md:px-12 md:py-16">

<!-- ✅ Benar - hide di mobile, show desktop -->
<div class="hidden md:block">

<!-- ✅ Benar - show mobile, hide desktop -->
<div class="block md:hidden">

<!-- ✅ Benar - grid 2mobile, 4desktop -->
<div class="grid grid-cols-2 md:grid-cols-4">
```

### Typography
```html
<!-- Title sizes -->
<h1 class="text-2xl md:text-5xl">

<!-- Body text -->
<p class="text-sm md:text-base">

<!-- Meta info -->
<span class="text-xs md:text-sm">
```

### Card Sizes
```html
<!-- Film card - mobile compact -->
<div class="flex flex-col gap-3">
  <div class="aspect-[2/3]">
    <img class="object-cover w-full h-full">
  </div>
  <div class="p-3">...</div>
</div>

<!-- Film card - desktop horizontal -->
<div class="flex">
  <div class="w-[130px] shrink-0">...</div>
  <div class="p-4">...</div>
</div>
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ SALAH
```html
<!-- Mengubah default desktop -->
<div class="grid-cols-4 md:grid-cols-2">

<!-- Tidak ada mobile base -->
<div class="md:px-12">

<!-- Mobile override desktop -->
<div class="grid-cols-2" md:grid-cols-4">
```

### ✅ BENAR
```html
<!-- Mobile base, desktop enhancement -->
<div class="px-4 md:px-12">

<!-- Mobile 2 cols, desktop 4+ cols -->
<div class="grid grid-cols-2 md:grid-cols-4">

<!-- Mobile hidden, desktop visible -->
<nav class="hidden md:block">
```

---

## 🧪 Testing Checklist

### Mobile (< 768px)
- [ ] Grid 2 kolom di film list ✓
- [ ] Grid 2 kolom di actor filmography ✓
- [ ] Hamburger menu berfungsi ✓
- [ ] Spacing nyaman (tidak terlalu lebar) ✓
- [ ] Text readable tanpa zoom ✓
- [ ] Card tidak terpotong ✓
- [ ] Filter sidebar accessible ✓
- [ ] Hero image tidak terlalu besar ✓

### Desktop (>= 768px)
- [ ] Grid 4-6 kolom di film list ✓
- [ ] Grid 6 kolom di actors ✓
- [ ] Navbar horizontal visible ✓
- [ ] Layout tidak rusak ✓
- [ ] Spacing desktop normal ✓
- [ ] Film cards horizontal layout ✓

---

## ✅ PR Ready Checklist

- [ ] Semua perubahan pake mobile-first approach
- [ ] Desktop TIDAK mengalami regresi
- [ ] Test di Chrome DevTools (iPhone, iPad
- [ ] Commit message jelas: `feat(mobile): add responsive grid for film list`
- [ ] Branch name: `feature/responsive-frontend`

---

## 📋 Implementation Order

1. **Base template** — navbar & footer responsive
2. **Home page** — actors grid 2 kolom, spacing
3. **Film list** — grid 2 kolom, sidebar layout
4. **Film detail** — compact layout
5. **Actor detail** — filmography grid
6. **JS cards** — update film card render

---

**Catatan**: Prioritas Tier 1 dulu. Desktop adalah prioritas utama, JANGAN ubah class desktop yang sudah fungsional.
