# 📋 SahabatBradPitt - Mobile Responsive Planning

**Last Updated**: 2026-05-29
**Status**: In Progress
**Branch**: `feature/responsive-frontend`

---

## 🎯 Goals

**MOBILE ONLY - Jangan ganggu desktop sama sekali!**

1. **Mobile Grid 2 Kolom** - Film & actor grid 2 kolom di mobile
2. **Mobile Hamburger Menu** - Navbar responsive dengan hamburger
3. **Mobile Spacing** - Padding, margin yang nyaman di mobile
4. **Mobile Typography** - Font size yang readable di mobile

---

## 📱 Mobile-First Approach

### Grid System (MOBILE)
```css
/* Mobile: 2 columns - Desktop jangan diubah! */
.film-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
```

### Spacing Mobile
```css
/* Mobile only - jangan pakai md:/lg: */
.main-padding {
  padding: 16px; /* bukan px-6 */
}
```

---

## 📋 Task List

### Task 1: Base Template - Mobile Hamburger Menu
- [ ] Tambah hamburger button di navbar (mobile only)
- [ ] Mobile dropdown menu dengan semua nav links
- [ ] Navbar height responsive (mobile: 56px)
- [ ] Active nav highlight tetap works

### Task 2: Home Page - Mobile Grid
- [ ] Trending carousel tetap horizontal scroll
- [ ] Featured actors grid 2 kolom di mobile
- [ ] Featured movies 2 kolom di mobile
- [ ] Section padding mobile (py-10 bukan py-16)

### Task 3: Film List - Mobile Grid
- [ ] Film cards grid 2 kolom
- [ ] Filter sidebar di bawah content di mobile
- [ ] Card size lebih kecil di mobile

### Task 4: Film Detail - Mobile Layout
- [ ] Poster hidden di mobile
- [ ] Meta info lebih compact
- [ ] Cast grid 2 kolom
- [ ] Gallery grid 2 kolom

### Task 5: Actor Detail - Mobile Grid
- [ ] Filmography grid 2 kolom
- [ ] Bio text size mobile

---

## ⚠️ RULES - MOBILE ONLY

### YANG BOLEH DIUBAH (Mobile):
```html
<!-- Tambah class mobile-only -->
<div class="md:hidden">...</div>
<div class="px-4 py-3">...</div>
```

### YANG JANGAN DIUBAH (Desktop):
```html
<!-- Jangan ubah class desktop yang sudah ada! -->
<div class="md:px-12 lg:px-24">...</div>
<div class="md:grid-cols-4">...</div>
```

### Contoh Benar:
```html
<!-- ✅ Benar - mobile only change -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">

<!-- ❌ Salah - desktop change -->
<div class="grid grid-cols-4 md:grid-cols-2 gap-4">
```

---

## 📁 Files to Update

### Templates (Mobile only)
| File | Changes |
|------|---------|
| `base.html` | Hamburger menu + mobile nav |
| `home.html` | Mobile grid 2 kolom |
| `movies/film_list.html` | Mobile film grid 2 kolom |
| `movies/film_detail.html` | Mobile layout |
| `actors/actor_detail.html` | Mobile grid |

---

## 🔧 Mobile Classes Reference

```html
<!-- Spacing Mobile Only -->
<div class="px-4 md:px-12">        <!-- padding mobile 16px -->
<div class="py-6 md:py-16">         <!-- padding mobile 24px -->
<div class="gap-3 md:gap-8">        <!-- gap mobile 12px -->

<!-- Grid Mobile 2 Kolom -->
<div class="grid grid-cols-2 md:grid-cols-4">

<!-- Typography Mobile -->
<h1 class="text-xl md:text-4xl">   <!-- mobile 20px -->

<!-- Visibility Mobile -->
<div class="md:hidden">              <!-- show only mobile -->
<div class="hidden md:block">         <!-- hide mobile -->
```

---

## ✅ Checklist Sebelum Commit

- [ ] Grid 2 kolom di mobile ✓
- [ ] Hamburger menu works ✓
- [ ] Desktop TIDAK berubah sama sekali ✓
- [ ] Test di mobile (Chrome DevTools)
- [ ] Test di desktop - harus masih normal ✓

---

## 📱 Test Checklist

### Mobile Test (Paling Penting)
- [ ] Grid 2 kolom di film list
- [ ] Grid 2 kolom di actor filmography
- [ ] Hamburger menu open/close
- [ ] Spacing nyaman di mobile
- [ ] Text readable di mobile

### Desktop Test (Harus Tetap Aman)
- [ ] Grid tetap 4-6 kolom di desktop
- [ ] Navbar tetap horizontal
- [ ] Spacing desktop tidak berubah
- [ ] Layout desktop tidak rusak

---

**Catatan**: Desktop adalah prioritas utama. MOBILE ONLY!
