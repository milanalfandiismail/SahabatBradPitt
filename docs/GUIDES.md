# 📖 Implementation Guides

**Step-by-step guides for implementing and using SahabatBradPitt features.**

---

## Table of Contents

1. [Adding a New Film](#adding-a-new-film)
2. [Using Gallery Lightbox](#using-gallery-lightbox)
3. [Watching Trailers](#watching-trailers)
4. [Film Approval Workflow](#film-approval-workflow)
5. [Submitting Ratings](#submitting-ratings)
6. [Getting Recommendations](#getting-recommendations)

---

## Adding a New Film

### Via Admin Panel (Recommended)

**Step 1: Create Film**
1. Go to Admin Panel (`/admin`)
2. Click "Films" → "Add Film"
3. Fill in film details:
   - Title
   - Synopsis
   - Release Year
   - Duration (minutes)
   - Trailer URL (YouTube)
   - Poster Path

**Step 2: Add Images**
1. Click "Add Image" button
2. Upload gallery images (JPG, PNG, WebP)
3. Max 2-5MB per image
4. Max 8 images per film

**Step 3: Select Genres**
1. Check relevant genres
2. Can select multiple

**Step 4: Submit for Approval**
1. Click "Submit for Approval" button
2. Status changes to "Pending Approval"
3. Wait for super admin review

### Via API

```bash
# Create film
curl -X POST http://localhost:8000/api/films/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Film",
    "synopsis": "Description",
    "release_year": 2024,
    "duration": 120,
    "trailer_url": "https://www.youtube.com/watch?v=...",
    "genre": [1, 2, 3]
  }'

# Response
{
  "id": 100,
  "title": "New Film",
  "status": "draft",
  ...
}
```

---

## Using Gallery Lightbox

### Viewing Gallery

**Step 1: Open Film Detail**
1. Click on any film from the list
2. Scroll to "Galeri" section

**Step 2: Open Lightbox**
1. Click any gallery image
2. Lightbox modal opens with full-resolution image

**Step 3: Navigate Images**
- **Next**: Click right arrow or press →
- **Previous**: Click left arrow or press ←
- **Close**: Click X button, press ESC, or click outside

**Step 4: View Image Counter**
- Shows current image position (e.g., "3 / 8")
- Indicates total images available

### Features

- ✅ Full-resolution images
- ✅ Smooth navigation
- ✅ Keyboard shortcuts
- ✅ Click-outside to close
- ✅ Image counter

---

## Watching Trailers

### Playing Trailer

**Step 1: Open Film Detail**
1. Click on any film
2. Look for "Watch Trailer" button

**Step 2: Click Play**
1. Click "Watch Trailer" button
2. YouTube player opens in modal
3. Video auto-plays at 1080p

**Step 3: Control Playback**
- **Play/Pause**: Click video
- **Volume**: Use volume slider
- **Fullscreen**: Click fullscreen button
- **Quality**: Select from quality menu (default 1080p)

**Step 4: Close Player**
1. Click X button
2. Press ESC
3. Click outside modal

### Trailer Features

- ✅ Auto-play at 1080p
- ✅ YouTube embed player
- ✅ Fullscreen support
- ✅ Quality selection
- ✅ Keyboard shortcuts

---

## Film Approval Workflow

### Admin Workflow

**Step 1: Create Film (Draft)**
```
Admin creates film → Status: Draft
```

**Step 2: Submit for Approval**
```
Admin clicks "Submit for Approval" → Status: Pending Approval
```

**Step 3: Super Admin Reviews**
```
Super admin reviews film details and images
```

**Step 4: Approve or Reject**

**Approve:**
```
Super admin clicks "Approve" → Status: Published
Film visible to public
```

**Reject:**
```
Super admin clicks "Reject" + reason → Status: Rejected
Admin can resubmit after fixing issues
```

### Status Meanings

| Status | Visibility | Can Edit | Can Submit |
|--------|-----------|----------|-----------|
| Draft | Admin only | Yes | Yes |
| Pending | Admin only | No | No |
| Published | Public | No | No |
| Rejected | Admin only | Yes | Yes |

### API Workflow

```bash
# 1. Create film (draft)
POST /api/films/
{
  "title": "New Film",
  ...
}
# Response: status = "draft"

# 2. Submit for approval
POST /api/films/{id}/submit-approval/
# Response: status = "pending_approval"

# 3. Approve (super admin)
POST /api/films/{id}/approve/
# Response: status = "published"

# OR Reject (super admin)
POST /api/films/{id}/reject/
{
  "reason": "Image quality is poor"
}
# Response: status = "rejected"
```

---

## Submitting Ratings

### Via Web Interface

**Step 1: Open Film Detail**
1. Click on any published film
2. Scroll to "Ulasan Cinephiles" section

**Step 2: Rate Film**
1. Click stars (1-10)
2. Selected stars highlight in yellow

**Step 3: Write Review**
1. Click review text area
2. Type your review (optional)
3. Max 500 characters

**Step 4: Submit**
1. Click "Submit Ulasan" button
2. Review appears in feed
3. Film rating updates

### Via API

```bash
# Submit rating
curl -X POST http://localhost:8000/api/ratings/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "film": 1,
    "score": 8,
    "review": "Great film!"
  }'

# Response
{
  "id": 1,
  "film": 1,
  "user": 1,
  "score": 8,
  "review": "Great film!",
  "created_at": "2026-05-25T11:00:00Z"
}
```

### Rating Guidelines

- **1-3**: Poor - Not recommended
- **4-6**: Average - Some good parts
- **7-8**: Good - Worth watching
- **9-10**: Excellent - Must watch

---

## Getting Recommendations

### Recommendation Algorithm

The system uses **TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)** to recommend films based on:

1. **Genre Similarity** - Films with similar genres
2. **Era Matching** - Films from similar time periods
3. **Duration Category** - Films with similar length

### Getting Recommendations

**Via Web Interface**

1. Go to "Recommendations" page
2. System analyzes your ratings
3. Shows personalized recommendations
4. Click to view film details

**Via API**

```bash
# Get recommendations
curl -X GET http://localhost:8000/api/recommendations/ \
  -H "Authorization: Token YOUR_TOKEN"

# Response
[
  {
    "id": 1,
    "title": "Recommended Film",
    "similarity_score": 0.92,
    "reason": "Similar genre and era"
  }
]
```

### How It Works

1. **Analyze Your Ratings**
   - Identify genres you like
   - Determine preferred era
   - Calculate duration preference

2. **Score Candidates**
   - Compare with all films
   - Calculate similarity score
   - Rank by score

3. **Return Top Results**
   - Show top 6 recommendations
   - Include similarity score
   - Explain why recommended

---

## Syncing Films from TMDB

### Manual Sync

**Via Admin Panel**

1. Go to Admin Panel
2. Click "Films" → "Sync from TMDB"
3. Enter limit (default 15)
4. Click "Sync"
5. Wait for completion

**Via API**

```bash
# Sync films
curl -X POST http://localhost:8000/api/films/sync/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 15
  }'

# Response
{
  "message": "Sinkronisasi berhasil diselesaikan.",
  "synced_count": 15,
  "mocked": false
}
```

### What Gets Synced

- ✅ Film details (title, synopsis, year)
- ✅ Genres
- ✅ Cast information
- ✅ Gallery images (max 8)
- ✅ Trailer URL (from TMDB or YouTube API)
- ✅ Popularity score
- ✅ Poster image

### Sync Frequency

- **Development**: Manual sync as needed
- **Production**: Scheduled daily sync (recommended)

---

## Searching Films

### Search Features

**By Title**
```
Search: "Brad"
Results: All films with "Brad" in title
```

**By Genre**
```
Filter: Drama
Results: All drama films
```

**By Year Range**
```
Filter: 2010-2020
Results: Films released 2010-2020
```

**By Rating**
```
Filter: Min 7.5
Results: Films rated 7.5+
```

**Combine Filters**
```
Search: "Brad" + Genre: Drama + Year: 2010-2020 + Rating: 7.5+
Results: Drama films with Brad, 2010-2020, rated 7.5+
```

---

## Troubleshooting

### Gallery Not Loading

**Problem**: Gallery images not showing

**Solution**:
1. Check internet connection
2. Verify TMDB API key is set
3. Check browser console for errors
4. Try refreshing page

### Trailer Not Playing

**Problem**: "Error 153" when playing trailer

**Solution**:
1. Check YouTube URL is valid
2. Verify video is not region-restricted
3. Check video allows embedding
4. Try different video

### Ratings Not Saving

**Problem**: Rating submission fails

**Solution**:
1. Verify you're logged in
2. Check authentication token
3. Verify film is published
4. Check browser console for errors

### Recommendations Not Showing

**Problem**: No recommendations available

**Solution**:
1. Submit at least 3 ratings
2. Wait for algorithm to process
3. Refresh page
4. Check if films have similar genres

---

## Best Practices

### For Admins

- ✅ Always submit films for approval before publishing
- ✅ Use high-quality images (2-5MB)
- ✅ Verify trailer URLs before saving
- ✅ Keep film information up-to-date
- ✅ Review user ratings regularly

### For Users

- ✅ Rate films you've watched
- ✅ Write detailed reviews
- ✅ Use accurate ratings (1-10)
- ✅ Check recommendations regularly
- ✅ Report inappropriate content

---

**Last Updated**: 2026-05-28
**Version**: 2.0.0
