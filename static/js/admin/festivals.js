let festivalCurrentPage = 1;

function initFestivals() {
    fetchFestivals(1);
}

function fetchFestivals(page = 1) {
    festivalCurrentPage = page;
    const search = document.getElementById('festival-search')?.value || '';
    
    let url = `/api/festivals/festivals/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    secureFetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Gagal mengambil data festival");
            return res.json();
        })
        .then(data => {
            renderFestivals(data.results);
            updateFestivalPagination(data.count, page);
        })
        .catch(err => {
            console.error('Error fetching festivals:', err);
            showToast('Gagal memuat data festival', 'error');
        });
}

function renderFestivals(festivals) {
    const tbody = document.getElementById('festivals-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!festivals || !Array.isArray(festivals) || festivals.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-stone-500 italic">No festivals found</td></tr>`;
        return;
    }
    
    festivals.forEach(fest => {
        let logoUrl = '';
        if (fest.logo) {
            logoUrl = fest.logo;
        } else if (fest.logo_path) {
            logoUrl = fest.logo_path.startsWith('http') ? fest.logo_path : `https://image.tmdb.org/t/p/w200${fest.logo_path}`;
        }
        
        const logoHtml = logoUrl ? `<img src="${logoUrl}" class="h-10 w-10 object-contain bg-[#141314] rounded p-1">` : `<div class="h-10 w-10 bg-[#141314] rounded flex items-center justify-center text-stone-600"><span class="material-symbols-outlined">emoji_events</span></div>`;
        
        const loc = [fest.city, fest.country].filter(Boolean).join(', ') || '-';
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors group';
        tr.innerHTML = `
            <td class="p-4">${logoHtml}</td>
            <td class="p-4">
                <div class="font-bold text-white">${fest.name}</div>
                <div class="text-xs text-stone-500">${loc}</div>
            </td>
            <td class="p-4">${fest.founded_year || '-'}</td>
            <td class="p-4">
                ${fest.is_active ? '<span class="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-bold">Active</span>' : '<span class="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs font-bold">Inactive</span>'}
            </td>
            <td class="p-4 text-right">
                <button onclick='editFestival(${JSON.stringify(fest).replace(/'/g, "&#39;")})' class="text-stone-400 hover:text-white transition-colors p-1" title="Edit">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button onclick="deleteFestival(${fest.id}, '${fest.name.replace(/'/g, "\\'")}')" class="text-stone-400 hover:text-red-500 transition-colors p-1 ml-2" title="Delete">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateFestivalPagination(total, page) {
    document.getElementById('festival-count').textContent = total;
    const totalPages = Math.ceil(total / 10); // assuming 10 per page
    document.getElementById('festival-page-info').textContent = `Page ${page} of ${Math.max(1, totalPages)}`;
    document.getElementById('festival-prev-page').disabled = page <= 1;
    document.getElementById('festival-next-page').disabled = page >= totalPages;
}

function changeFestivalPage(delta) {
    fetchFestivals(festivalCurrentPage + delta);
}

function openFestivalEditor() {
    document.getElementById('festival-form').reset();
    document.getElementById('festival-id').value = '';
    document.getElementById('festival-active-input').checked = true;
    document.getElementById('festival-logo-path-input').value = ''; // clear hidden logo path
    
    // Hide preview
    const preview = document.getElementById('festival-logo-preview');
    const placeholder = document.getElementById('festival-logo-placeholder');
    if (preview && placeholder) {
        preview.src = ''; 
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
    
    document.getElementById('festival-editor-title').textContent = 'Add Festival';
    
    document.getElementById('view-festivals-manage').classList.add('hidden');
    document.getElementById('view-festival-editor').classList.remove('hidden');
}

function closeFestivalEditor() {
    document.getElementById('view-festival-editor').classList.add('hidden');
    document.getElementById('view-festivals-manage').classList.remove('hidden');
}

function editFestival(fest) {
    document.getElementById('festival-id').value = fest.id;
    document.getElementById('festival-name-input').value = fest.name || '';
    document.getElementById('festival-native-name-input').value = fest.native_name || '';
    document.getElementById('festival-country-input').value = fest.country || '';
    document.getElementById('festival-city-input').value = fest.city || '';
    document.getElementById('festival-founded-input').value = fest.founded_year || '';
    document.getElementById('festival-description-input').value = fest.description || '';
    document.getElementById('festival-editor-title').textContent = 'Edit Festival';
    
    // reset file input visually, keep path in hidden input
    document.getElementById('festival-logo-input').value = ''; 
    document.getElementById('festival-logo-path-input').value = fest.logo_path || '';
    
    // Update preview
    const preview = document.getElementById('festival-logo-preview');
    const placeholder = document.getElementById('festival-logo-placeholder');
    if (preview && placeholder) {
        let logoUrl = '';
        if (fest.logo) {
            logoUrl = fest.logo;
        } else if (fest.logo_path) {
            logoUrl = fest.logo_path.startsWith('http') ? fest.logo_path : `https://image.tmdb.org/t/p/w200${fest.logo_path}`;
        }
        if (logoUrl) {
            preview.src = logoUrl;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            preview.src = '';
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }
    
    document.getElementById('festival-website-input').value = fest.website || '';
    document.getElementById('festival-active-input').checked = fest.is_active;
    
    document.getElementById('view-festivals-manage').classList.add('hidden');
    document.getElementById('view-festival-editor').classList.remove('hidden');
}

function saveFestival(e) {
    e.preventDefault();
    const id = document.getElementById('festival-id').value;
    
    const formData = new FormData();
    formData.append('name', document.getElementById('festival-name-input').value);
    formData.append('native_name', document.getElementById('festival-native-name-input').value);
    formData.append('country', document.getElementById('festival-country-input').value);
    formData.append('city', document.getElementById('festival-city-input').value);
    
    const founded = document.getElementById('festival-founded-input').value;
    if (founded) formData.append('founded_year', founded);
    
    formData.append('description', document.getElementById('festival-description-input').value);
    formData.append('website', document.getElementById('festival-website-input').value);
    formData.append('is_active', document.getElementById('festival-active-input').checked);
    
    const logoInput = document.getElementById('festival-logo-input');
    if (logoInput.files && logoInput.files[0]) {
        formData.append('logo', logoInput.files[0]);
    }
    
    // Also append the hidden fallback path if it exists
    const logoPath = document.getElementById('festival-logo-path-input').value;
    if (logoPath) {
        formData.append('logo_path', logoPath);
    }
    
    const url = id ? `/api/festivals/festivals/${id}/` : '/api/festivals/festivals/';
    const method = id ? 'PUT' : 'POST';
    
    secureFetch(url, {
        method: method,
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error("Gagal menyimpan festival");
        return res.json();
    })
    .then(() => {
        showToast('Festival berhasil disimpan', 'success');
        closeFestivalEditor();
        fetchFestivals(festivalCurrentPage);
    })
    .catch(err => {
        console.error('Error saving festival:', err);
        showToast('Gagal menyimpan festival', 'error');
    });
}

function deleteFestival(id, name) {
    const toast = _buildConfirmToast(`Hapus Festival '${name}'?`, () => {
        secureFetch(`/api/festivals/festivals/${id}/`, { method: 'DELETE' })
            .then(res => { if (!res.ok) throw new Error(); showToast('Festival terhapus.', 'success'); fetchFestivals(festivalCurrentPage); })
            .catch(err => {
                console.error('Error deleting festival:', err);
                showToast('Gagal menghapus festival', 'error');
            });
    });
}

// Wikipedia Import Functions
function openWikiImportModal() {
    const filmSelect = document.getElementById('wiki-import-film-select');
    if (!filmSelect) return;
    
    // Clear and show loading state in select
    filmSelect.innerHTML = '<option value="">Loading films...</option>';
    
    // Reset form
    document.getElementById('wiki-import-form').reset();
    
    // Hide status
    const statusDiv = document.getElementById('wiki-import-status');
    if (statusDiv) statusDiv.classList.add('hidden');
    
    // Open modal
    document.getElementById('wiki-import-modal').classList.remove('hidden');
    
    // Fetch films to populate select list
    secureFetch('/api/films/?limit=100')
        .then(res => {
            if (!res.ok) throw new Error("Gagal memuat film");
            return res.json();
        })
        .then(data => {
            const films = data.results || data;
            filmSelect.innerHTML = '<option value="">-- Pilih Film --</option>';
            films.forEach(film => {
                const opt = document.createElement('option');
                opt.value = film.id;
                opt.textContent = `${film.title} (${film.release_date ? film.release_date.split('-')[0] : '-'})`;
                filmSelect.appendChild(opt);
            });
        })
        .catch(err => {
            console.error('Error fetching films for import:', err);
            filmSelect.innerHTML = '<option value="">Gagal memuat film</option>';
            showToast('Gagal memuat daftar film', 'error');
        });
}

function closeWikiImportModal() {
    document.getElementById('wiki-import-modal').classList.add('hidden');
}

function submitWikiImport(e) {
    e.preventDefault();
    
    const filmId = document.getElementById('wiki-import-film-select').value;
    const wikiUrl = document.getElementById('wiki-import-url-input').value;
    
    if (!filmId) {
        showToast('Pilih film terlebih dahulu', 'warning');
        return;
    }
    
    const statusDiv = document.getElementById('wiki-import-status');
    const statusText = document.getElementById('wiki-import-status-text');
    const statusDetails = document.getElementById('wiki-import-status-details');
    const submitBtn = document.getElementById('wiki-import-submit-btn');
    
    // Show loading state
    statusDiv.classList.remove('hidden');
    statusText.textContent = 'Menghubungi Wikipedia & memproses tabel penghargaan...';
    statusText.className = 'text-blue-400 font-bold';
    statusDetails.textContent = 'Mencari halaman Wikipedia yang sesuai dan mem-parsing data. Proses ini memerlukan waktu 5-15 detik.';
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    
    const payload = {
        film_id: filmId,
        wikipedia_url: wikiUrl
    };
    
    secureFetch('/api/festivals/wikipedia-import/', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error || "Gagal mengimpor penghargaan"); });
        }
        return res.json();
    })
    .then(data => {
        statusText.textContent = 'Import Berhasil!';
        statusText.className = 'text-green-400 font-bold';
        
        let detailsHtml = `Halaman Wikipedia: "${data.page_title}"\n`;
        detailsHtml += `Total Record Ditemukan: ${data.total_extracted}\n`;
        detailsHtml += `Baru Diimpor: ${data.imported}\n`;
        detailsHtml += `Sudah Ada (Dilewati): ${data.skipped}`;
        statusDetails.textContent = detailsHtml;
        
        showToast(`Berhasil mengimpor ${data.imported} penghargaan baru!`, 'success');
        
        // Refresh grid
        fetchFestivals(1);
    })
    .catch(err => {
        console.error('Error importing from Wikipedia:', err);
        statusText.textContent = 'Import Gagal!';
        statusText.className = 'text-red-400 font-bold';
        statusDetails.textContent = err.message || 'Terjadi kesalahan saat mem-parsing data dari Wikipedia.';
        showToast('Gagal mengimpor penghargaan', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('festival-editor-cancel-btn')?.addEventListener('click', closeFestivalEditor);
    
    document.getElementById('festival-logo-trigger-btn')?.addEventListener('click', () => {
        document.getElementById('festival-logo-input')?.click();
    });
    
    const logoInput = document.getElementById('festival-logo-input');
    const logoPreview = document.getElementById('festival-logo-preview');
    const logoPlaceholder = document.getElementById('festival-logo-placeholder');
    if (logoInput && logoPreview && logoPlaceholder) {
        logoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    logoPreview.src = e.target.result;
                    logoPreview.classList.remove('hidden');
                    logoPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(this.files[0]);
            } else {
                logoPreview.src = '';
                logoPreview.classList.add('hidden');
                logoPlaceholder.classList.remove('hidden');
            }
        });
    }
});
