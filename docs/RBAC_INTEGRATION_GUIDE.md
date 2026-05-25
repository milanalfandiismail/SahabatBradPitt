# RBAC & Approval Workflow Integration Guide

## Overview
This guide explains how to integrate the RBAC (Role-Based Access Control) and approval workflow system into the admin_films.html template.

## Files Created
1. **rbac-approval.js** - Core module with RBAC managers and UI components
2. **rbac-integration.js** - Integration helper with functions for the template

## Step 1: Include JavaScript Files in HTML

Add these script tags to the `<head>` or before closing `</body>` tag in admin_films.html:

```html
<!-- RBAC & Approval Workflow Scripts -->
<script src="/static/js/rbac-approval.js"></script>
<script src="/static/js/rbac-integration.js"></script>
```

## Step 2: Add Approvals Navigation Button

In the sidebar navigation (around line 80-100), add this button after the "Genre Kustom" button:

```html
<button id="sidebar-approvals-btn"
    class="hidden w-full px-4 py-3 rounded-lg text-left font-medium text-sm flex items-center gap-3 transition-all hover:bg-white/5 text-stone-400 hover:text-white">
    <span class="material-symbols-outlined text-lg">verified_user</span>
    Persetujuan Konten
</button>
```

Add click handler in the JavaScript section:

```javascript
document.getElementById('sidebar-approvals-btn')?.addEventListener('click', () => {
    showSection('section-approvals');
});
```

## Step 3: Add Approvals Section to Main Content

Add this section after the movies section (around line 270+):

```html
<!-- ======================= APPROVALS SECTION ======================= -->
<div id="section-approvals" class="hidden flex flex-col gap-8">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-white/5 pb-6">
        <div class="flex flex-col gap-1">
            <h1 class="font-['Playfair_Display'] text-3xl text-stone-100 font-bold tracking-tight">
                Persetujuan Konten
            </h1>
            <p class="font-['DM_Sans'] text-xs text-[#c9c5cb]/70">
                Tinjau dan setujui film serta aktor yang menunggu persetujuan dari Admin.
            </p>
        </div>
    </div>

    <!-- Approval Tabs -->
    <div class="flex gap-2 border-b border-white/5">
        <button class="tab-btn active px-4 py-3 text-sm font-medium text-stone-200 border-b-2 border-[#715A5A] transition-all" 
            onclick="showApprovalTab('films')">
            <span class="material-symbols-outlined text-sm align-middle mr-2">movie</span>
            Film Pending
        </button>
        <button class="tab-btn px-4 py-3 text-sm font-medium text-stone-400 border-b-2 border-transparent hover:text-stone-200 transition-all" 
            onclick="showApprovalTab('actors')">
            <span class="material-symbols-outlined text-sm align-middle mr-2">person</span>
            Aktor Pending
        </button>
    </div>

    <!-- Pending Films Tab -->
    <div id="approval-films" class="flex flex-col gap-4">
        <div id="pending-films-list" class="grid grid-cols-1 gap-4">
            <!-- Films will be loaded here -->
        </div>
    </div>

    <!-- Pending Actors Tab -->
    <div id="approval-actors" class="hidden flex flex-col gap-4">
        <div id="pending-actors-list" class="grid grid-cols-1 gap-4">
            <!-- Actors will be loaded here -->
        </div>
    </div>
</div>
```

## Step 4: Add Poster Upload UI to Film Editor

In the film editor form/modal, add these input fields:

```html
<!-- Poster Upload Section -->
<div class="flex flex-col gap-1.5">
    <label for="film-poster-input" class="text-[10px] font-bold text-stone-400 tracking-wider uppercase">
        Upload Poster
    </label>
    <div class="flex gap-2">
        <input id="film-poster-input" 
            type="file" 
            accept="image/jpeg,image/png,image/webp"
            class="flex-1 bg-[#141314] border border-white/10 rounded-md py-2 px-3 text-xs text-stone-200 focus:border-[#715A5A] focus:ring-1 focus:ring-[#715A5A] focus:outline-none transition-all" />
        <button type="button" 
            onclick="handlePosterUpload(currentFilmId)"
            class="px-4 py-2 rounded bg-[#715A5A] hover:bg-[#8A6E6E] text-white text-xs font-semibold transition-all">
            Upload
        </button>
    </div>
    <p class="text-[10px] text-[#c9c5cb]/50">Format: JPG, PNG, WebP. Maks 5MB</p>
</div>

<!-- Backdrop Upload Section -->
<div class="flex flex-col gap-1.5">
    <label for="film-backdrop-input" class="text-[10px] font-bold text-stone-400 tracking-wider uppercase">
        Upload Backdrop
    </label>
    <div class="flex gap-2">
        <input id="film-backdrop-input" 
            type="file" 
            accept="image/jpeg,image/png,image/webp"
            class="flex-1 bg-[#141314] border border-white/10 rounded-md py-2 px-3 text-xs text-stone-200 focus:border-[#715A5A] focus:ring-1 focus:ring-[#715A5A] focus:outline-none transition-all" />
        <button type="button" 
            onclick="handleBackdropUpload(currentFilmId)"
            class="px-4 py-2 rounded bg-[#715A5A] hover:bg-[#8A6E6E] text-white text-xs font-semibold transition-all">
            Upload
        </button>
    </div>
    <p class="text-[10px] text-[#c9c5cb]/50">Format: JPG, PNG, WebP. Maks 5MB</p>
</div>

<!-- Film Images Gallery -->
<div class="flex flex-col gap-1.5">
    <label class="text-[10px] font-bold text-stone-400 tracking-wider uppercase">
        Galeri Gambar
    </label>
    <div id="film-images-gallery" class="grid grid-cols-3 gap-2">
        <!-- Images will be displayed here -->
    </div>
</div>
```

## Step 5: Add Global Variable for Current Film ID

In the JavaScript section, add:

```javascript
let currentFilmId = null;

// Update this when opening film editor
function openFilmEditor(filmId) {
    currentFilmId = filmId;
    // ... rest of your film editor code
}
```

## Step 6: Add Section Navigation Function

Add this function to handle section switching:

```javascript
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('[id^="section-"]').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
    }
    
    // Update sidebar button styles
    document.querySelectorAll('[id^="sidebar-"]').forEach(btn => {
        btn.classList.remove('bg-[#715A5A]', 'text-white');
        btn.classList.add('text-stone-400', 'hover:text-white');
    });
    
    const activeBtn = document.getElementById(`sidebar-${sectionId.replace('section-', '')}-btn`);
    if (activeBtn) {
        activeBtn.classList.remove('text-stone-400', 'hover:text-white');
        activeBtn.classList.add('bg-[#715A5A]', 'text-white');
    }
}
```

## Step 7: Update Film Status Display

When displaying films in the list, show the status:

```html
<span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
    ${film.status === 'published' ? 'bg-green-500/10 text-green-400' : 
      film.status === 'pending_approval' ? 'bg-amber-500/10 text-amber-400' : 
      film.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' : 
      'bg-stone-500/10 text-stone-400'}">
    ${film.status_display || film.status}
</span>
```

## Usage Examples

### Upload Poster
```javascript
// User selects file and clicks upload button
// handlePosterUpload(filmId) is called automatically
```

### Approve Film
```javascript
// Superadmin clicks approve button on pending film
// handleApproveFilm(film) is called
// Film status changes to 'published'
```

### Reject Film
```javascript
// Superadmin clicks reject button on pending film
// Modal appears asking for rejection reason
// handleRejectFilm(film) is called with reason
// Film status changes to 'rejected'
```

## API Endpoints Used

### Film Endpoints
- `POST /api/films/` - Create film (Admin/Superadmin)
- `PUT /api/films/{id}/` - Update film (Admin/Superadmin)
- `POST /api/films/{id}/images/` - Upload image (Admin/Superadmin)
- `DELETE /api/films/{id}/images/{image_id}/` - Delete image (Admin/Superadmin)
- `POST /api/films/{id}/approve/` - Approve film (Superadmin only)
- `POST /api/films/{id}/reject/` - Reject film (Superadmin only)
- `GET /api/films/?status=pending_approval` - Get pending films (Superadmin)

### Actor Endpoints
- `POST /api/actors/` - Create actor (Admin/Superadmin)
- `PUT /api/actors/{id}/` - Update actor (Admin/Superadmin)
- `POST /api/actors/{id}/approve/` - Approve actor (Superadmin only)
- `POST /api/actors/{id}/reject/` - Reject actor (Superadmin only)
- `GET /api/actors/?status=pending_approval` - Get pending actors (Superadmin)

## Status Flow

### For Admin Users
1. Create/Edit film or actor
2. Status automatically set to `pending_approval`
3. Content not visible to public users
4. Superadmin reviews and approves/rejects

### For Superadmin Users
1. Create/Edit film or actor
2. Status automatically set to `published`
3. Content immediately visible to public users
4. Can approve/reject content from Admin users

## Styling Notes

- Uses Tailwind CSS classes from the existing template
- Color scheme: `#715A5A` (primary brand), `#201f20` (surface), `#141314` (background)
- Icons use Material Symbols Outlined
- Responsive design with mobile support

## Testing Checklist

- [ ] Include both JS files in HTML
- [ ] Add Approvals button to sidebar
- [ ] Add Approvals section to main content
- [ ] Add poster/backdrop upload fields to film editor
- [ ] Test poster upload as Admin user
- [ ] Test film creation as Admin (should be pending_approval)
- [ ] Test film creation as Superadmin (should be published)
- [ ] Test approval workflow as Superadmin
- [ ] Test rejection workflow with reason
- [ ] Verify public users only see published content
- [ ] Verify Admin users can see all content in admin panel
- [ ] Test actor approval workflow

## Troubleshooting

### Approvals button not showing
- Check if user is Superadmin
- Check browser console for errors
- Verify rbac-integration.js is loaded

### Poster upload fails
- Check file size (max 5MB)
- Check file format (JPG, PNG, WebP only)
- Check browser console for API errors
- Verify user has Admin or Superadmin role

### Approval buttons not working
- Check if user is Superadmin
- Check browser console for errors
- Verify API endpoints are accessible
- Check network tab for failed requests

## Future Enhancements

- Add bulk approval/rejection
- Add approval history/audit log
- Add email notifications for approvals
- Add approval comments/feedback
- Add scheduled publishing
- Add version history for edits
