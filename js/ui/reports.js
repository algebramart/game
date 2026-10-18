import { state } from '../core/state.js';
import { BADGES_DB } from '../data/items.js';
import { getTitle, saveData, checkBadgeUnlocks } from '../core/engine.js';
import { switchScreen, showMsg, closeModal } from './screens.js';
import { startHostRoom, stopHostRoom, refreshHostStudents, loadSpecificHostRoom, updateStudentProfileInRoom } from '../core/sync.js';
import { playSFX } from '../core/audio.js';

let fasilChartInstance = null;

// ==========================================
// BUKU KAS
// ==========================================

export function openBukuKas() {
    switchScreen('screen-bukukas');

    document.getElementById('bk-kotor').innerText  = "Rp " + state.currentUser.revenue.toLocaleString('id-ID');
    document.getElementById('bk-modal').innerText  = "Rp " + state.currentUser.cost.toLocaleString('id-ID');
    document.getElementById('bk-bersih').innerText = "Rp " + state.currentUser.money.toLocaleString('id-ID');

    const sumbanganEl = document.getElementById('bk-sumbangan');
    if (sumbanganEl) {
        sumbanganEl.innerText = "Rp " + (state.currentUser.sumbangan || 0).toLocaleString('id-ID');
    }

    let totalLevels = state.currentUser.history.length;
    let zeroErrors  = state.currentUser.history.filter(h => h.errors === 0).length;
    let accuracy    = totalLevels === 0 ? 0 : Math.round((zeroErrors / totalLevels) * 100);

    const akurasiEl = document.getElementById('bk-akurasi');
    const akurasiBar = document.getElementById('bk-akurasi-bar');
    if (akurasiEl)  akurasiEl.innerText = totalLevels === 0 ? "–" : accuracy + "%";
    if (akurasiBar) akurasiBar.style.width = accuracy + "%";

    const histList = document.getElementById('bk-history-list');
    histList.innerHTML = '';

    if (totalLevels === 0) {
        histList.innerHTML = '<div style="text-align:center; color:#92400e; font-style:italic; padding:1.25rem;">Belum ada riwayat permainan. Selesaikan pesanan pembeli di toko untuk mencatat performa kasir.</div>';
    } else {
        state.currentUser.history.forEach(h => {
            let d = new Date(h.timestamp);
            histList.innerHTML += `
                <div class="history-item">
                    <div class="history-header">
                        <span>Level ${h.level}</span>
                        <span>${d.toLocaleDateString('id-ID')}</span>
                    </div>
                    <div class="history-stats">
                        <span><i class="fa-regular fa-clock"></i> ${h.duration}s</span>
                        <span><i class="fa-solid fa-triangle-exclamation ${h.errors > 0 ? 'text-error' : 'text-success'}"></i> ${h.errors} Salah</span>
                        <span class="text-success">+Rp ${h.profit.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            `;
        });
    }

    const chartCanvas = document.getElementById('financeChart');
    const chartEmpty  = document.getElementById('finance-chart-empty');

    if (totalLevels === 0) {
        if (chartCanvas) chartCanvas.style.display = 'none';
        if (chartEmpty)  chartEmpty.classList.remove('hidden');
        if (state.chartInstance) {
            state.chartInstance.destroy();
            state.chartInstance = null;
        }
    } else {
        if (chartCanvas) chartCanvas.style.display = 'block';
        if (chartEmpty)  chartEmpty.classList.add('hidden');

        const ctx = chartCanvas.getContext('2d');
        if (state.chartInstance) state.chartInstance.destroy();

        let labels     = state.currentUser.history.map(h => `Lvl ${h.level}`);
        let dataProfit = state.currentUser.history.map(h => h.profit);

        state.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Laba (Rp)',
                    data: dataProfit,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                    borderWidth: 3,
                    pointBackgroundColor: '#d97706',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    }
}

/**
 * Sisihkan donasi kasir untuk kotak sumbangan warga desa.
 * @param {number} nominal 
 */
export function handleDonate(nominal) {
    if (!state.currentUser) return;
    if (state.currentUser.money < nominal) {
        return showMsg("Laba Tidak Cukup", `Laba bersih toko saat ini (Rp ${state.currentUser.money.toLocaleString('id-ID')}) belum mencukupi untuk menyisihkan donasi sebesar Rp ${nominal.toLocaleString('id-ID')}. Ayo layani lebih banyak pelanggan!`);
    }

    state.currentUser.money -= nominal;
    state.currentUser.sumbangan = (state.currentUser.sumbangan || 0) + nominal;
    saveData();

    // Evaluasi lencana dimensi hati
    checkBadgeUnlocks({
        type: 'donation',
        nominal: nominal,
        totalSumbangan: state.currentUser.sumbangan
    });

    // Perbarui angka di Buku Kas
    const bersihEl = document.getElementById('bk-bersih');
    const sumbanganEl = document.getElementById('bk-sumbangan');
    if (bersihEl) bersihEl.innerText = "Rp " + state.currentUser.money.toLocaleString('id-ID');
    if (sumbanganEl) sumbanganEl.innerText = "Rp " + state.currentUser.sumbangan.toLocaleString('id-ID');

    showMsg("Terima Kasih, Kasir Dermawan!", `Anda telah menyisihkan <strong>Rp ${nominal.toLocaleString('id-ID')}</strong> dari laba toko untuk kotak sumbangan sosial warga desa.`);
}

// ==========================================
// PRESTASI & LEADERBOARD
// ==========================================

/**
 * Menampilkan modal detail informasi lencana saat salah satu kartu diklik.
 * @param {Object} badge
 * @param {boolean} isUnlocked
 */
export function showBadgeDetail(badge, isUnlocked) {
    const modal = document.getElementById('modal-badge-detail');
    if (!modal) return;

    const iconWrap = document.getElementById('badge-detail-icon-wrapper');
    const iconEl = document.getElementById('badge-detail-icon');
    const categoryEl = document.getElementById('badge-detail-category');
    const nameEl = document.getElementById('badge-detail-name');
    const statusEl = document.getElementById('badge-detail-status');
    const descEl = document.getElementById('badge-detail-desc');

    if (iconWrap && iconEl) {
        iconWrap.className = isUnlocked
            ? `badge-detail-icon-wrapper ${badge.colorClass || 'icon-gold'}`
            : 'badge-detail-icon-wrapper icon-disabled';
        iconEl.className = `fa-solid ${isUnlocked ? (badge.icon || 'fa-award') : 'fa-lock'}`;
    }

    if (categoryEl) categoryEl.textContent = badge.category || 'Prestasi';
    if (nameEl) nameEl.textContent = badge.name;

    if (statusEl) {
        if (isUnlocked) {
            statusEl.className = 'badge-detail-status-pill status-unlocked';
            statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Sudah Terbuka';
        } else {
            statusEl.className = 'badge-detail-status-pill status-locked';
            statusEl.innerHTML = '<i class="fa-solid fa-lock"></i> Masih Terkunci';
        }
    }

    if (descEl) {
        descEl.textContent = badge.desc || 'Selesaikan tantangan tertentu untuk membuka lencana ini.';
    }

    modal.classList.remove('hidden');
}

export function openPrestasi() {
    switchScreen('screen-prestasi');

    const badgeContainer = document.getElementById('badges-container');
    const badgesCounter  = document.getElementById('badges-counter');
    badgeContainer.innerHTML = '';

    const userBadges = Array.isArray(state.currentUser.badges) ? state.currentUser.badges : [];
    const unlockedCount = userBadges.filter(id => BADGES_DB.some(b => b.id === id)).length;
    const totalCount = BADGES_DB.length;
    const percent = Math.round((unlockedCount / totalCount) * 100);

    if (badgesCounter) {
        badgesCounter.innerText = `${unlockedCount} / ${totalCount} Terbuka (${percent}%)`;
    }

    BADGES_DB.forEach(b => {
        const hasBadge = userBadges.includes(b.id);
        const card = document.createElement('div');
        card.className = `badge-card ${hasBadge ? 'badge-unlocked' : 'badge-locked'}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.title = `Klik untuk melihat detail lencana: ${b.name}`;
        card.innerHTML = `
            <div class="badge-icon-wrapper ${hasBadge ? b.colorClass : 'icon-disabled'}">
                <i class="fa-solid badge-icon ${hasBadge ? b.icon : 'fa-lock'}"></i>
            </div>
            <span class="badge-category-tag">${b.category}</span>
            <h4>${b.name}</h4>
        `;
        card.addEventListener('click', () => {
            showBadgeDetail(b, hasBadge);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showBadgeDetail(b, hasBadge);
            }
        });
        badgeContainer.appendChild(card);
    });

    const tokenDisplay = document.getElementById('token-display');
    if (tokenDisplay) tokenDisplay.innerText = state.currentUser?.token || '';

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    let sortedUsers = [...state.users].sort((a, b) => b.money - a.money);

    sortedUsers.forEach((u, idx) => {
        let rankIcon = idx === 0
            ? '<i class="fa-solid fa-trophy rank-1"></i>'
            : (idx === 1
                ? '<i class="fa-solid fa-medal rank-2"></i>'
                : (idx === 2
                    ? '<i class="fa-solid fa-medal rank-3"></i>'
                    : `${idx + 1}`));

        let isMeClass = u.id === state.currentUser.id ? 'table-row-me' : '';
        tbody.innerHTML += `
            <tr class="table-row ${isMeClass}">
                <td>${rankIcon}</td>
                <td><span class="rank-name">${u.name}</span><span class="rank-title">${getTitle(u.money, u.sumbangan || 0)}</span></td>
                <td class="text-right font-mono">Rp ${u.money.toLocaleString('id-ID')}</td>
            </tr>
        `;
    });

    const minSlots = 5;
    for (let idx = sortedUsers.length; idx < minSlots; idx++) {
        tbody.innerHTML += `
            <tr class="table-row table-row-empty" style="opacity: 0.55;">
                <td style="color:#94a3b8; text-align:center;">${idx + 1}</td>
                <td><span class="rank-name" style="color:#94a3b8; font-style:italic;">Slot Kasir Kosong</span><span class="rank-title" style="color:#cbd5e1;">Belum ada data pemain</span></td>
                <td class="text-right font-mono" style="color:#cbd5e1;">–</td>
            </tr>
        `;
    }
}

export function copyToken() {
    navigator.clipboard.writeText(state.currentUser.token)
        .then(() => showMsg('Berhasil', 'Kode prestasi berhasil disalin!'));
}

// ==========================================
// FASILITATOR
// ==========================================

export function showFasilitatorLogin() {
    document.getElementById('pin-input').value = '';
    document.getElementById('modal-pin').classList.remove('hidden');
}

export function checkPIN() {
    if (document.getElementById('pin-input').value === '1234') {
        document.getElementById('modal-pin').classList.add('hidden');
        openFasilitator();
    } else {
        showMsg('Akses Ditolak', 'PIN salah.');
    }
}

export function openFasilitator() {
    switchScreen('screen-fasilitator');

    // Tugas 2: Jika sudah ada sesi room dari localStorage/state,
    // otomatis jalankan ulang listener Firebase tanpa membuat kode baru
    if (state.hostedRoomCode) {
        startHostRoom(() => {
            renderFasilTableAndEWS();
        }, false);
    }

    updateFasilTopBarUI();
    renderFasilTableAndEWS();
}

/**
 * Memperbarui tampilan topbar fasilitator (apakah sedang ada sesi room live atau luring).
 */
export function updateFasilTopBarUI() {
    const roomBadge = document.getElementById('fasil-room-badge');
    const roomCodeDisplay = document.getElementById('fasil-room-code-display');
    const modeDesc = document.getElementById('fasil-mode-desc');
    const btnCreateRoom = document.getElementById('btn-create-room');
    const roomInput = document.getElementById('input-fasil-room-code');

    if (state.hostedRoomCode) {
        if (roomBadge) roomBadge.classList.remove('hidden');
        if (roomCodeDisplay) roomCodeDisplay.innerText = state.hostedRoomCode;
        if (modeDesc) modeDesc.innerText = `Sesi Aktif: ${state.hostedRoomCode} (Menerima Progres Realtime Daring & Luring)`;
        if (btnCreateRoom) btnCreateRoom.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Buat Ruang Baru`;
        if (roomInput && document.activeElement !== roomInput) {
            roomInput.value = state.hostedRoomCode;
        }
    } else {
        if (roomBadge) roomBadge.classList.add('hidden');
        if (modeDesc) modeDesc.innerText = 'Mode Luring - Data Perangkat Lokal';
        if (btnCreateRoom) btnCreateRoom.innerHTML = `<i class="fa-solid fa-tower-broadcast"></i> Buat Sesi Kelas Online`;
        if (roomInput && document.activeElement !== roomInput) {
            roomInput.value = '';
        }
    }
}

/**
 * Guru membuat sesi kelas online / membuka ruang baru secara acak.
 */
export function handleCreateHostRoom() {
    // forceNew = true: menghasilkan kode baru saat guru sengaja klik Buat / Ganti Ruang
    const code = startHostRoom(() => {
        // Callback realtime saat progres murid masuk
        renderFasilTableAndEWS();
    }, true);
    updateFasilTopBarUI();
    renderFasilTableAndEWS();
    showMsg('Sesi Kelas Aktif', `Kode Ruang Kelas: ${code}\nBagikan kode 6 digit ini kepada murid-murid.`);
}

/**
 * Fasilitator memuat data kelas tertentu berdasarkan input Kode Ruang dinamis.
 */
export async function handleLoadSpecificRoom() {
    const roomInput = document.getElementById('input-fasil-room-code');
    const loadBtn = document.getElementById('btn-load-fasil-room');
    if (!roomInput) return;

    const rawCode = roomInput.value.trim();
    if (!rawCode) {
        showMsg('Kode Ruang Kosong', 'Masukkan kode ruang kelas yang ingin dimuat (contoh: ALJ7A1).');
        roomInput.focus();
        return;
    }

    const origBtnHtml = loadBtn ? loadBtn.innerHTML : '';
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuat...';
    }

    try {
        const result = await loadSpecificHostRoom(rawCode, () => {
            renderFasilTableAndEWS();
        });

        updateFasilTopBarUI();
        renderFasilTableAndEWS();

        if (!result.success) {
            showMsg('Gagal Memuat Ruang', result.message);
        } else {
            roomInput.value = result.code || rawCode.toUpperCase();
            showMsg(result.isOffline ? 'Mode Luring Aktif' : 'Ruang Kelas Dimuat', result.message);
        }
    } catch (err) {
        console.warn('[Reports] Gagal memuat kode ruang spesifik:', err);
        showMsg('Peringatan', 'Terjadi kendala saat memuat kode ruang. Pastikan format kode benar.');
    } finally {
        if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.innerHTML = origBtnHtml;
        }
    }
}

/**
 * Mengatur pengurutan (sorting) kolom pada tabel fasilitator saat header diklik.
 * @param {string} field 'name' | 'kelas' | 'level' | 'money' | 'accuracy' | 'quiz'
 */
export function handleSortFasilTable(field) {
    if (!field) return;
    if (state.fasilSortField === field) {
        state.fasilSortOrder = state.fasilSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        state.fasilSortField = field;
        // Default: Nama & Kelas urut A-Z ('asc'), metrik numerik urut tertinggi ('desc') atau 'asc'
        state.fasilSortOrder = 'asc';
    }
    renderFasilTableAndEWS();
}

/**
 * Mengurutkan daftar murid berdasarkan state.fasilSortField dan state.fasilSortOrder.
 * @param {Array<Object>} students
 * @returns {Array<Object>}
 */
export function sortFasilStudents(students) {
    if (!Array.isArray(students)) return [];
    const sorted = [...students];
    const field = state.fasilSortField;
    if (!field) return sorted;

    const dir = state.fasilSortOrder === 'desc' ? -1 : 1;

    const getQuizRatio = (s) => {
        if (!s || !s.quizStr || !s.quizStr.includes('/')) return -1;
        const [c, t] = s.quizStr.split('/').map(Number);
        if (!t || isNaN(c) || isNaN(t)) return -1;
        return (c / t) * 1000 + c;
    };

    sorted.sort((a, b) => {
        let cmp = 0;
        switch (field) {
            case 'name':
                cmp = String(a.name || '').localeCompare(String(b.name || ''), 'id-ID', { sensitivity: 'base', numeric: true });
                break;
            case 'kelas':
                cmp = String(a.kelas || '').localeCompare(String(b.kelas || ''), 'id-ID', { sensitivity: 'base', numeric: true });
                break;
            case 'level': {
                const lvlA = Number(a.maxLevel) || 1;
                const lvlB = Number(b.maxLevel) || 1;
                cmp = lvlA !== lvlB ? (lvlA - lvlB) : ((Number(a.level) || 1) - (Number(b.level) || 1));
                break;
            }
            case 'money':
                cmp = (Number(a.money) || 0) - (Number(b.money) || 0);
                break;
            case 'accuracy':
                cmp = (Number(a.accuracyNum) || 0) - (Number(b.accuracyNum) || 0);
                break;
            case 'quiz':
                cmp = getQuizRatio(a) - getQuizRatio(b);
                break;
            default:
                cmp = 0;
        }
        return cmp * dir;
    });

    return sorted;
}

/**
 * Memperbarui ikon indikator sorting pada elemen <th> tabel fasilitator.
 */
export function updateFasilSortHeadersUI() {
    const headers = document.querySelectorAll('.fasil-table thead th.sortable-th');
    headers.forEach(th => {
        const field = th.dataset.sort;
        const icon = th.querySelector('.sort-icon');
        if (!icon) return;

        if (state.fasilSortField === field) {
            th.classList.add('sorted-active');
            icon.className = state.fasilSortOrder === 'asc'
                ? 'fa-solid fa-sort-up sort-icon active'
                : 'fa-solid fa-sort-down sort-icon active';
        } else {
            th.classList.remove('sorted-active');
            icon.className = 'fa-solid fa-sort sort-icon';
        }
    });
}

// Pelacak ID murid yang barisnya sedang dalam mode edit di dasbor fasilitator
export let activeEditingStudentId = null;

export function setActiveEditingStudentId(id) {
    activeEditingStudentId = id;
}

/**
 * Menyimpan editan fasilitator (HANYA nama_fasil dan kelas_fasil) ke Firebase
 * serta cache lokal tanpa menimpa data asli perangkat murid.
 * @param {string} studentId
 */
export async function handleSaveStudentEdit(studentId) {
    if (!studentId) return;
    const tbody = document.getElementById('fasil-table-body');
    const row = tbody?.querySelector(`tr[data-student-id="${studentId}"]`);
    if (!row) return;

    const nameInput = row.querySelector('.fasil-edit-name');
    const kelasInput = row.querySelector('.fasil-edit-kelas');
    const newName = nameInput ? nameInput.value.trim() : '';
    const newKelas = kelasInput ? kelasInput.value.trim() : '';

    if (!newName) {
        showMsg('Peringatan', 'Nama siswa tidak boleh kosong.');
        if (nameInput) nameInput.focus();
        return;
    }

    try {
        playSFX('success');
    } catch (e) { /* ignore */ }

    // 1. Simpan ke local user jika akun lokal
    if (Array.isArray(state.users)) {
        const localUser = state.users.find(u => String(u.id) === String(studentId) || String(u.name) === String(studentId));
        if (localUser) {
            localUser.nama_fasil = newName;
            if (newKelas) localUser.kelas_fasil = newKelas;
            saveData();
        }
    }

    // 2. Simpan secara parsial (HANYA nama_fasil & kelas_fasil) ke Firebase & cache lokal
    await updateStudentProfileInRoom(studentId, {
        nama_fasil: newName,
        kelas_fasil: newKelas || '-'
    });

    // 3. Matikan mode edit dan render ulang tabel
    const savedId = studentId;
    activeEditingStudentId = null;
    renderFasilTableAndEWS();

    // 4. Efek visual flash tersimpan pada baris yang baru diedit
    const updatedRow = tbody.querySelector(`tr[data-student-id="${savedId}"]`);
    if (updatedRow) {
        updatedRow.classList.add('row-saved-flash');
        setTimeout(() => {
            updatedRow.classList.remove('row-saved-flash');
        }, 1200);
    }

    // 5. Perbarui grafik kelas
    const updatedStudents = sortFasilStudents(getAggregatedStudents());
    renderFasilClassChart(updatedStudents);
}

/**
 * Wrapper kompatibilitas mundur untuk pembaruan inline jika dipanggil langsung
 */
export async function handleInlineStudentUpdate(studentId, field, newValue, inputEl) {
    if (field !== 'name' && field !== 'kelas' && field !== 'nama_fasil' && field !== 'kelas_fasil') return;
    const targetKey = (field === 'name' || field === 'nama_fasil') ? 'nama_fasil' : 'kelas_fasil';
    await updateStudentProfileInRoom(studentId, { [targetKey]: newValue });
}

/**
 * Menyalin kode ruang fasilitator ke clipboard.
 */
export function handleCopyHostRoomCode() {
    if (!state.hostedRoomCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(state.hostedRoomCode)
            .then(() => showMsg('Berhasil Disalin', `Kode ruang ${state.hostedRoomCode} berhasil disalin ke papan klip.`))
            .catch(() => showMsg('Kode Ruang', `Kode: ${state.hostedRoomCode}`));
    } else {
        showMsg('Kode Ruang', `Kode: ${state.hostedRoomCode}`);
    }
}

/**
 * Memuat ulang data murid aktif dari server secara manual.
 */
export async function forceRefreshFasilData() {
    const refreshBtn = document.getElementById('btn-refresh-fasil');
    const icon = refreshBtn?.querySelector('i');
    if (icon) icon.classList.add('fa-spin');

    try {
        if (state.hostedRoomCode) {
            await refreshHostStudents();
        }
    } catch (err) {
        console.warn('[Reports] Gagal memuat ulang data fasilitator secara manual:', err);
    } finally {
        renderFasilTableAndEWS();
        if (icon) {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 450);
        }
    }
}

/**
 * Mengonversi timestamp ke format waktu relatif.
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTimeAgo(timestamp) {
    if (!timestamp || isNaN(timestamp)) return 'Baru saja';
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - Number(timestamp)) / 1000));

    if (diffSec < 60) {
        return 'Baru saja';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
        return `${diffMin} menit yang lalu`;
    }
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} jam yang lalu`;
}

/**
 * Mengambil dan menggabungkan data seluruh murid (lokal dan sesi daring) ke dalam satu array.
 * @returns {Array<Object>}
 */
export function getAggregatedStudents() {
    const studentMap = new Map();

    // 1. Masukkan pengguna lokal
    state.users.forEach(u => {
        let totalLvl = u.history ? u.history.length : 0;
        let zeroErrors = u.history ? u.history.filter(h => (h.errors || 0) === 0).length : 0;
        let accNum = totalLvl === 0 ? 0 : Math.round((zeroErrors / totalLvl) * 100);
        let accStr = totalLvl === 0 ? '–' : accNum + '%';

        let lastHistory = u.history && u.history.length > 0 ? u.history[u.history.length - 1] : null;
        let lastErrors = lastHistory ? (lastHistory.errors || 0) : 0;

        let totalQuizCorrect = u.history ? u.history.reduce((sum, h) => sum + (h.quizCorrect || 0), 0) : 0;
        let totalQuizCount   = u.history ? u.history.reduce((sum, h) => sum + (h.quizTotal   || 0), 0) : 0;
        let quizStr          = totalQuizCount > 0 ? `${totalQuizCorrect}/${totalQuizCount}` : '-';

        // Deteksi kegagalan kuis pada level terakhir
        let lastQuizFailed = false;
        let lastQuizScore = '-';
        if (lastHistory && (lastHistory.quizTotal > 0)) {
            lastQuizScore = `${lastHistory.quizCorrect}/${lastHistory.quizTotal}`;
            if (lastHistory.quizCorrect < lastHistory.quizTotal || lastHistory.quizCorrect === 0) {
                lastQuizFailed = true;
            }
        }
        let lastTimestamp = lastHistory && lastHistory.timestamp ? lastHistory.timestamp : Date.now();

        const localIdStr = String(u.id || u.name);
        const fasilName = u.nama_fasil || (state.fasilEdits && (state.fasilEdits[localIdStr]?.nama_fasil || state.fasilEdits[String(u.name)]?.nama_fasil));
        const fasilKelas = u.kelas_fasil || (state.fasilEdits && (state.fasilEdits[localIdStr]?.kelas_fasil || state.fasilEdits[String(u.name)]?.kelas_fasil));
        const resolvedName = fasilName || u.name;
        const resolvedKelas = fasilKelas || u.kelas || u.class || '-';

        studentMap.set(localIdStr, {
            id: u.id,
            name: resolvedName,
            rawName: u.name,
            nama_fasil: fasilName || null,
            kelas: resolvedKelas,
            rawKelas: u.kelas || u.class || '-',
            kelas_fasil: fasilKelas || null,
            gender: u.gender || 'Laki-laki',
            maxLevel: u.maxLevel || 1,
            level: lastHistory ? lastHistory.level : (u.maxLevel || 1),
            activeLevel: null,
            money: u.money || 0,
            accuracyNum: accNum,
            accuracyStr: accStr,
            errorCount: lastErrors,
            quizStr: quizStr,
            quizFailed: lastQuizFailed,
            quizWrong: (lastHistory && lastHistory.quizTotal > 0) ? Math.max(0, lastHistory.quizTotal - (lastHistory.quizCorrect || 0)) : 0,
            quizLastScore: lastQuizScore,
            history: u.history || [],
            lastUpdated: lastTimestamp,
            isOnline: false,
            isLocal: true
        });
    });

    // 2. Masukkan / perbarui dengan data online yang diterima
    if (state.onlineStudents) {
        Object.values(state.onlineStudents).forEach(s => {
            const key = String(s.studentId || s.name);
            const existing = studentMap.get(key);

            // Deteksi kegagalan kuis dari data online (jawaban salah >= 1 atau skor 0)
            let onlineQuizFailed = false;
            if (s.quizWrong !== undefined && Number(s.quizWrong) > 0) {
                onlineQuizFailed = true;
            } else if (s.quizScore && s.quizScore.includes('/')) {
                const [qc, qt] = s.quizScore.split('/').map(Number);
                if (qt > 0 && (qc < qt || qc === 0)) {
                    onlineQuizFailed = true;
                }
            }

            const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
            const onlineFasilName = s.nama_fasil || (state.fasilEdits && (state.fasilEdits[key]?.nama_fasil || state.fasilEdits[cleanKey]?.nama_fasil));
            const onlineFasilKelas = s.kelas_fasil || (state.fasilEdits && (state.fasilEdits[key]?.kelas_fasil || state.fasilEdits[cleanKey]?.kelas_fasil));

            if (existing) {
                if (s.name) existing.rawName = s.name;
                if (s.kelas) existing.rawKelas = s.kelas;
                existing.nama_fasil = onlineFasilName || existing.nama_fasil || null;
                existing.kelas_fasil = onlineFasilKelas || existing.kelas_fasil || null;
                existing.name = existing.nama_fasil || s.name || existing.name;
                existing.kelas = existing.kelas_fasil || s.kelas || existing.kelas;
                existing.maxLevel = Math.max(existing.maxLevel, s.maxLevel || s.level || 1);
                existing.level = s.level || existing.level;
                existing.activeLevel = s.activeLevel || null;
                existing.money = s.laba !== undefined ? s.laba : existing.money;
                existing.accuracyNum = s.accuracy !== undefined ? s.accuracy : existing.accuracyNum;
                existing.accuracyStr = s.accuracy !== undefined ? `${s.accuracy}%` : existing.accuracyStr;
                existing.errorCount = s.errorCount !== undefined ? Number(s.errorCount) : existing.errorCount;
                if (s.quizScore) existing.quizStr = s.quizScore;
                existing.quizFailed = onlineQuizFailed;
                existing.quizWrong = s.quizWrong !== undefined ? Number(s.quizWrong) : existing.quizWrong;
                existing.quizLastScore = s.quizScore || existing.quizLastScore;
                existing.lastUpdated = s.lastUpdated || existing.lastUpdated || Date.now();
                if (s.history && s.history.length > 0) {
                    existing.history = s.history;
                }
                existing.isOnline = true;
            } else {
                const resolvedName = onlineFasilName || s.name || 'Siswa';
                const resolvedKelas = onlineFasilKelas || s.kelas || '-';
                studentMap.set(key, {
                    id: s.studentId,
                    name: resolvedName,
                    rawName: s.name || 'Siswa',
                    nama_fasil: onlineFasilName || null,
                    kelas: resolvedKelas,
                    rawKelas: s.kelas || '-',
                    kelas_fasil: onlineFasilKelas || null,
                    gender: s.gender || 'Laki-laki',
                    maxLevel: s.maxLevel || s.level || 1,
                    level: s.level || 1,
                    activeLevel: s.activeLevel || null,
                    money: s.laba !== undefined ? s.laba : 0,
                    accuracyNum: s.accuracy !== undefined ? s.accuracy : 0,
                    accuracyStr: s.accuracy !== undefined ? `${s.accuracy}%` : '–',
                    errorCount: s.errorCount !== undefined ? Number(s.errorCount) : 0,
                    quizStr: s.quizScore || '-',
                    quizFailed: onlineQuizFailed,
                    quizWrong: s.quizWrong !== undefined ? Number(s.quizWrong) : 0,
                    quizLastScore: s.quizScore || '-',
                    history: s.history || [],
                    lastUpdated: s.lastUpdated || Date.now(),
                    isOnline: true,
                    isLocal: false
                });
            }
        });
    }

    return Array.from(studentMap.values());
}

/**
 * Helper mengamankan teks di dalam atribut HTML value="..."
 * @param {string} str
 * @returns {string}
 */
function escapeHtmlAttr(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Render tabel murid aktif dan panel Peringatan Dini (EWS).
 */
export function renderFasilTableAndEWS() {
    const tbody   = document.getElementById('fasil-table-body');
    const ewsList = document.getElementById('fasil-ews-list');
    if (!tbody || !ewsList) return;

    updateFasilSortHeadersUI();

    const rawStudents = getAggregatedStudents();
    const students = sortFasilStudents(rawStudents);

    // Ambil nilai yang sedang diketik jika mode edit sedang aktif pada salah satu baris
    let typingName = null;
    let typingKelas = null;
    if (activeEditingStudentId) {
        const activeRow = tbody.querySelector(`tr[data-student-id="${activeEditingStudentId}"]`);
        if (activeRow) {
            const nIn = activeRow.querySelector('.fasil-edit-name');
            const kIn = activeRow.querySelector('.fasil-edit-kelas');
            if (nIn) typingName = nIn.value;
            if (kIn) typingKelas = kIn.value;
        }
    }

    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1.5rem; color: #64748b;">Belum ada data murid yang terhubung atau tersimpan.</td></tr>';
    } else {
        students.forEach((u, idx) => {
            const onlineBadge = u.isOnline ? '<span class="fasil-online-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-right:6px; flex-shrink:0;" title="Online"></span>' : '';

            let levelDisplay = `<span style="color:#94a3b8;">Lvl ${u.maxLevel}</span>`;
            if (u.isOnline) {
                if (u.activeLevel) {
                    levelDisplay = `<div><strong style="color:#22c55e;"><i class="fa-solid fa-gamepad"></i> Sedang di Lvl ${u.activeLevel}</strong><div style="font-size:0.75rem; color:#94a3b8;">Max: Lvl ${u.maxLevel}</div></div>`;
                } else {
                    levelDisplay = `<div><span style="color:#94a3b8;"><i class="fa-solid fa-couch"></i> Di Menu/Lobi</span><div style="font-size:0.75rem; color:#94a3b8;">Max: Lvl ${u.maxLevel}</div></div>`;
                }
            }

            const safeId = escapeHtmlAttr(u.id);
            const safeName = escapeHtmlAttr(u.name);
            const safeKelas = escapeHtmlAttr(u.kelas);
            const isEditing = (activeEditingStudentId !== null && String(u.id) === String(activeEditingStudentId));

            if (isEditing) {
                const valName = escapeHtmlAttr(typingName !== null ? typingName : u.name);
                const valKelas = escapeHtmlAttr(typingKelas !== null ? typingKelas : u.kelas);

                tbody.innerHTML += `
                    <tr class="fasil-tr fasil-tr-editing" data-student-id="${safeId}">
                        <td class="fasil-td text-center font-bold fasil-col-no">${idx + 1}</td>
                        <td class="fasil-td">
                            <div class="fasil-edit-cell">
                                ${onlineBadge}
                                <input type="text" class="fasil-edit-input fasil-edit-name" data-id="${safeId}" value="${valName}" placeholder="Nama Siswa" aria-label="Edit Nama Siswa">
                            </div>
                        </td>
                        <td class="fasil-td text-center">
                            <div class="fasil-edit-cell fasil-edit-cell-center">
                                <input type="text" class="fasil-edit-input fasil-edit-kelas" data-id="${safeId}" value="${valKelas}" placeholder="Kelas" aria-label="Edit Kelas Siswa">
                                <small class="fasil-jk-suffix">(${u.gender === 'Perempuan' ? 'P' : 'L'})</small>
                            </div>
                        </td>
                        <td class="fasil-td text-center">${levelDisplay}</td>
                        <td class="fasil-td text-right">${u.money.toLocaleString('id-ID')}</td>
                        <td class="fasil-td text-center">${u.accuracyStr}</td>
                        <td class="fasil-td text-center font-bold" style="color:#1976d2;">${u.quizStr}</td>
                        <td class="fasil-td text-center">
                            <div class="fasil-action-buttons">
                                <button class="btn-save-student" data-id="${safeId}" title="Simpan Perubahan Nama & Kelas">
                                    <i class="fa-solid fa-floppy-disk"></i> Simpan
                                </button>
                                <button class="btn-cancel-edit" data-id="${safeId}" title="Batal Mengedit">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML += `
                    <tr class="fasil-tr" data-student-id="${safeId}">
                        <td class="fasil-td text-center font-bold fasil-col-no">${idx + 1}</td>
                        <td class="fasil-td">
                            <div class="fasil-inline-cell">
                                ${onlineBadge}
                                <span class="fasil-student-name font-bold">${safeName}</span>
                            </div>
                        </td>
                        <td class="fasil-td text-center">
                            <span class="fasil-student-kelas">${safeKelas} <small class="fasil-jk-suffix">(${u.gender === 'Perempuan' ? 'P' : 'L'})</small></span>
                        </td>
                        <td class="fasil-td text-center">${levelDisplay}</td>
                        <td class="fasil-td text-right">${u.money.toLocaleString('id-ID')}</td>
                        <td class="fasil-td text-center">${u.accuracyStr}</td>
                        <td class="fasil-td text-center font-bold" style="color:#1976d2;">${u.quizStr}</td>
                        <td class="fasil-td text-center">
                            <div class="fasil-action-buttons">
                                <button class="btn-detail-user" data-id="${safeId}" title="Lihat Rapor Belajar Siswa">
                                    <i class="fa-solid fa-chart-line"></i> Detail
                                </button>
                                <button class="btn-edit-student" data-id="${safeId}" title="Edit Nama & Kelas Siswa">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                ${u.isLocal ? `<button class="btn-delete-user" data-id="${safeId}" title="Hapus"><i class="fa-solid fa-trash"></i></button>` : '<span style="color:#94a3b8; font-size:0.75rem;">Sesi Live</span>'}
                            </div>
                        </td>
                    </tr>
                `;
            }
        });

        // Pasang event listener tombol edit
        tbody.querySelectorAll('.btn-edit-student').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                try { playSFX('click'); } catch (err) {}
                activeEditingStudentId = String(btn.dataset.id);
                renderFasilTableAndEWS();
                const activeRow = tbody.querySelector(`tr[data-student-id="${activeEditingStudentId}"]`);
                const nameInput = activeRow?.querySelector('.fasil-edit-name');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            });
        });

        // Pasang event listener tombol batal
        tbody.querySelectorAll('.btn-cancel-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                try { playSFX('click'); } catch (err) {}
                activeEditingStudentId = null;
                renderFasilTableAndEWS();
            });
        });

        // Pasang event listener tombol simpan
        tbody.querySelectorAll('.btn-save-student').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleSaveStudentEdit(btn.dataset.id);
            });
        });

        // Keyboard navigation pada input edit
        tbody.querySelectorAll('.fasil-edit-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveStudentEdit(input.dataset.id);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    try { playSFX('click'); } catch (err) {}
                    activeEditingStudentId = null;
                    renderFasilTableAndEWS();
                }
            });
        });

        // Pasang event listener tombol detail
        tbody.querySelectorAll('.btn-detail-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const sId = btn.dataset.id;
                const targetStudent = students.find(s => String(s.id) === String(sId));
                if (targetStudent) openStudentDetailModal(targetStudent);
            });
        });

        // Pasang event listener tombol hapus
        tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.id));
        });
    }

    ewsList.innerHTML = '';

    // Evaluasi EWS (Early Warning System)
    // Filter HANYA mendeteksi kejadian nyata pada level berjalan:
    // a. Kesalahan Rumus: errorCount >= 3 pada level yang sedang dimainkan
    // b. Kesalahan Kuis: memiliki jawaban kuis yang salah (quizWrong > 0 atau quizFailed) pada level tersebut
    const ewsAlerts = students.filter(s => {
        const hasFormulaError = Number(s.errorCount) >= 3;
        const hasQuizError = s.quizFailed === true || (s.quizWrong !== undefined && Number(s.quizWrong) > 0);
        return hasFormulaError || hasQuizError;
    });

    if (ewsAlerts.length === 0) {
        ewsList.innerHTML = `
            <div class="ews-empty">
                <i class="fa-solid fa-circle-check"></i>
                <span>Semua murid belajar lancar tanpa kendala signifikan.</span>
            </div>
        `;
    } else {
        ewsAlerts.forEach(s => {
            const hasFormulaError = Number(s.errorCount) >= 3;
            const hasQuizError = s.quizFailed === true || (s.quizWrong !== undefined && Number(s.quizWrong) > 0);

            let reasonHtml = '';
            if (hasFormulaError) {
                const errorCountText = s.errorCount >= 3 ? `${s.errorCount}x` : '3x';
                reasonHtml += `<div class="ews-reason-item">⚠️ Terkendala Rumus di Level ${s.level}: Sudah ${errorCountText} salah memasukkan rumus kasir.</div>`;
            }
            if (hasQuizError) {
                reasonHtml += `<div class="ews-reason-item">❌ Terkendala Konsep di Level ${s.level}: Salah saat menjawab evaluasi kuis.</div>`;
            }

            const timeAgoStr = formatTimeAgo(s.lastUpdated);

            ewsList.innerHTML += `
                <div class="ews-card">
                    <div class="ews-card-header">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span class="ews-card-name">${s.name}</span>
                            <span class="ews-card-class">Kelas ${s.kelas}</span>
                        </div>
                        <span class="ews-card-time" style="font-size:0.75rem; color:#94a3b8; font-weight:600;"><i class="fa-regular fa-clock"></i> ${timeAgoStr}</span>
                    </div>
                    <div class="ews-card-reasons" style="margin-top:6px;">
                        ${reasonHtml}
                    </div>
                </div>
            `;
        });
    }

    // ==========================================
    // AGREGASI STATISTIK KELAS & GRAFIK VISUAL
    // ==========================================

    // a. Rata-rata Level (maxLevel seluruh murid)
    let avgLevelStr = '–';
    if (students.length > 0) {
        const sumLevel = students.reduce((sum, s) => sum + (Number(s.maxLevel) || 1), 0);
        avgLevelStr = `Lvl ${(sumLevel / students.length).toFixed(1)}`;
    }
    const avgLevelEl = document.getElementById('fasil-stat-avg-level');
    const avgSubEl   = document.getElementById('fasil-stat-avg-sub');
    if (avgLevelEl) avgLevelEl.textContent = avgLevelStr;
    if (avgSubEl)   avgSubEl.textContent   = students.length > 0 ? `Dari ${students.length} murid terdata` : 'Belum ada murid';

    // b. Ketuntasan Kelas (Target: Min. Level 5)
    const TARGET_LEVEL = 5;
    const completedCount = students.filter(s => (Number(s.maxLevel) || 1) >= TARGET_LEVEL).length;
    const masteryPct = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;
    const masteryEl    = document.getElementById('fasil-stat-mastery');
    const masterySubEl = document.getElementById('fasil-stat-mastery-sub');
    if (masteryEl)    masteryEl.textContent    = `${masteryPct}%`;
    if (masterySubEl) masterySubEl.textContent = students.length > 0 ? `${completedCount}/${students.length} capai ≥ Lvl 5` : 'Target: Min. Level 5';

    // c. Perlu Pendampingan (EWS: errorCount >= 3 atau gagal kuis)
    const needsHelpEl = document.getElementById('fasil-stat-needs-help');
    const ewsSubEl    = document.getElementById('fasil-stat-ews-sub');
    if (needsHelpEl) needsHelpEl.textContent = `${ewsAlerts.length} Murid`;
    if (ewsSubEl)    ewsSubEl.textContent    = ewsAlerts.length > 0 ? 'Terkendala rumus/kuis' : 'Semua aman lancar';

    // d. Render / Perbarui Bar Chart Capaian Murid
    const chartTagEl = document.getElementById('fasil-chart-tag');
    if (chartTagEl) chartTagEl.textContent = `${students.length} Murid Terdata`;

    renderFasilClassChart(students);
}

/**
 * Menghancurkan instance grafik kelas fasilitator jika ada.
 */
export function destroyFasilChart() {
    if (fasilChartInstance) {
        fasilChartInstance.destroy();
        fasilChartInstance = null;
    }
}

/**
 * Render atau perbarui Bar Chart distribusi kemampuan murid berdasarkan rentang level.
 * @param {Array} students Daftar seluruh siswa teragregasi
 */
export function renderFasilClassChart(students) {
    const canvas = document.getElementById('fasilClassChart');
    if (!canvas) return;

    // Hancurkan chartInstance lama jika ada untuk mencegah error canvas tumpang tindih
    destroyFasilChart();

    if (typeof Chart === 'undefined') return;

    // Distribusi level murid: "Level 1-3", "Level 4-7", "Level 8-10", "Level 11+"
    let c1_3 = 0, c4_7 = 0, c8_10 = 0, c11plus = 0;
    if (Array.isArray(students)) {
        students.forEach(s => {
            const lvl = Number(s.maxLevel) || 1;
            if (lvl <= 3) c1_3++;
            else if (lvl <= 7) c4_7++;
            else if (lvl <= 10) c8_10++;
            else c11plus++;
        });
    }

    const counts = [c1_3, c4_7, c8_10, c11plus];

    const ctx = canvas.getContext('2d');
    fasilChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Level 1-3', 'Level 4-7', 'Level 8-10', 'Level 11+'],
            datasets: [{
                label: 'Jumlah Murid',
                data: counts,
                backgroundColor: [
                    'rgba(245, 158, 11, 0.78)',  // Emas / Amber hangat
                    'rgba(217, 119, 6, 0.82)',   // Amber pekat
                    'rgba(180, 83, 9, 0.88)',    // Cokelat keemasan
                    'rgba(16, 185, 129, 0.85)'   // Emerald hijau tuntas
                ],
                borderColor: [
                    '#f59e0b',
                    '#d97706',
                    '#b45309',
                    '#10b981'
                ],
                borderWidth: 1.5,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 56
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#78350f',
                    titleColor: '#fef3c7',
                    bodyColor: '#ffffff',
                    padding: 8,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => `${ctx.raw} murid`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#78350f',
                        font: { weight: 'bold', size: 11 }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        color: '#92400e',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(254, 230, 138, 0.45)'
                    }
                }
            }
        }
    });
}

/**
 * Menampilkan Modal Detail Rapor Siswa lengkap dengan profil dan riwayat perjalanan level.
 * @param {Object} student Objek data siswa
 */
export function openStudentDetailModal(student) {
    if (!student) return;

    const modal = document.getElementById('modal-student-detail');
    if (!modal) return;

    // 1. Profil ringkas siswa
    const nameEl   = document.getElementById('student-detail-name');
    const metaEl   = document.getElementById('student-detail-meta');
    const lvlEl    = document.getElementById('student-stat-level');
    const moneyEl  = document.getElementById('student-stat-money');
    const accEl    = document.getElementById('student-stat-acc');
    const statusEl = document.getElementById('student-stat-status');

    if (nameEl)   nameEl.innerText  = student.name || 'Siswa';
    if (metaEl)   metaEl.innerText  = `Kelas: ${student.kelas || '-'} | Gender: ${student.gender || 'Laki-laki'}`;
    if (lvlEl)    lvlEl.innerText   = `Lvl ${student.maxLevel || 1}`;
    if (moneyEl)  moneyEl.innerText = `Rp ${(student.money || 0).toLocaleString('id-ID')}`;
    if (accEl)    accEl.innerText   = student.accuracyStr || '–';
    if (statusEl) {
        statusEl.innerHTML = student.isOnline
            ? '<span style="color:#22c55e;"><i class="fa-solid fa-circle" style="font-size:0.6rem;"></i> Live Online</span>'
            : '<span style="color:#94a3b8;">Lokal</span>';
    }

    // 2. Tabel riwayat perjalanan level
    const tbody = document.getElementById('student-detail-history-body');
    if (tbody) {
        tbody.innerHTML = '';
        const history = Array.isArray(student.history) ? student.history : [];

        if (history.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:1.5rem; color:#92400e; font-style:italic;">
                        Belum ada riwayat level yang diselesaikan.<br>
                        <span style="font-size:0.75rem; color:#b45309;">Siswa saat ini sedang aktif di Level ${student.level || 1}.</span>
                    </td>
                </tr>
            `;
        } else {
            history.forEach(h => {
                const dateObj = h.timestamp ? new Date(h.timestamp) : null;
                const timeStr = dateObj
                    ? `${dateObj.toLocaleDateString('id-ID')} ${dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                    : '-';

                const errBadge = (h.errors || 0) === 0
                    ? '<span style="color:#15803d; font-weight:bold;"><i class="fa-solid fa-circle-check"></i> 0</span>'
                    : `<span style="color:#dc2626; font-weight:bold;"><i class="fa-solid fa-triangle-exclamation"></i> ${h.errors}x</span>`;

                const quizTotal = h.quizTotal || 0;
                let quizBadge = '-';
                if (quizTotal > 0) {
                    const quizCorrect = h.quizCorrect || 0;
                    const isPerfect = quizCorrect === quizTotal;
                    quizBadge = `<span style="color:${isPerfect ? '#15803d' : '#d97706'}; font-weight:bold;">${quizCorrect}/${quizTotal}</span>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight:800; color:#d97706;">Level ${h.level}</td>
                        <td><i class="fa-regular fa-clock" style="color:#b45309;"></i> ${h.duration || 0}s</td>
                        <td class="text-center">${errBadge}</td>
                        <td class="text-center">${quizBadge}</td>
                        <td class="text-right font-mono" style="color:#78350f; font-size:0.75rem;">${timeStr}</td>
                    </tr>
                `;
            });
        }
    }

    modal.classList.remove('hidden');
}

/**
 * Menutup Modal Detail Rapor Siswa.
 */
export function closeStudentDetailModal() {
    const modal = document.getElementById('modal-student-detail');
    if (modal) modal.classList.add('hidden');
}

/**
 * Menyalin teks bantuan fallback jika navigator.clipboard tidak tersedia/diblokir.
 * @param {string} text 
 */
function fallbackCopyText(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
            showMsg('Laporan Berhasil Disalin', 'Ringkasan laporan kelas siap ditempelkan (paste) ke grup WhatsApp guru/wali murid.');
        } else {
            showMsg('Salin Teks', 'Silakan salin teks laporan secara manual.');
        }
    } catch (e) {
        showMsg('Gagal Menyalin', 'Tidak dapat menyalin laporan secara otomatis.');
    }
}

/**
 * Mengidentifikasi kendala teknis dan konseptual (EWS) pada siswa.
 * @param {Object} student 
 * @returns {Array<string>}
 */
function getStudentDiagnosis(student) {
    const issues = [];
    const history = Array.isArray(student.history) ? student.history : [];

    // Periksa riwayat level yang pernah diselesaikan
    history.forEach(h => {
        if ((h.errors || 0) >= 3) {
            issues.push(`Kendala Kesalahan Rumus pada Level ${h.level} (${h.errors}x kesalahan)`);
        }
        if ((h.quizTotal || 0) > 0 && (h.quizCorrect || 0) < h.quizTotal) {
            issues.push(`Kendala Evaluasi Kuis pada Level ${h.level} (Skor kuis tidak tuntas)`);
        }
    });

    // Periksa status terkini / level berjalan jika belum tercatat di riwayat selesai
    if ((student.errorCount || 0) >= 3) {
        const alreadyInHistory = history.some(h => h.level === student.level && (h.errors || 0) >= 3);
        if (!alreadyInHistory) {
            issues.push(`Kendala Kesalahan Rumus pada Level ${student.level || 1} (${student.errorCount}x kesalahan)`);
        }
    }
    if (student.quizFailed || (student.quizWrong !== undefined && Number(student.quizWrong) > 0)) {
        const alreadyInHistory = history.some(h => h.level === student.level && (h.quizTotal || 0) > 0 && (h.quizCorrect || 0) < h.quizTotal);
        if (!alreadyInHistory) {
            issues.push(`Kendala Evaluasi Kuis pada Level ${student.level || 1} (Skor kuis tidak tuntas)`);
        }
    }

    return issues;
}

/**
 * Menyusun ringkasan laporan kelas terformat formal tanpa emotikon dan menyalinnya ke clipboard untuk dibagikan ke WhatsApp.
 */
export function handleCopyWhatsAppReport() {
    const students = getAggregatedStudents();
    if (students.length === 0) {
        return showMsg('Tidak Ada Data', 'Belum ada data peserta didik untuk menyusun laporan rekapitulasi kelas.');
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const sessionStr = state.hostedRoomCode 
        ? state.hostedRoomCode 
        : 'Mode Luring (Perangkat Lokal)';

    const totalStudents = students.length;
    const sumLevel = students.reduce((sum, s) => sum + (Number(s.maxLevel) || 1), 0);
    const avgLevel = (sumLevel / totalStudents).toFixed(1);

    const TARGET_LEVEL = 5;
    const completedCount = students.filter(s => (Number(s.maxLevel) || 1) >= TARGET_LEVEL).length;
    const masteryPct = Math.round((completedCount / totalStudents) * 100);

    // B. Catatan Diagnosis & Tindak Lanjut (EWS)
    const ewsStudents = [];
    students.forEach(s => {
        const issues = getStudentDiagnosis(s);
        if (issues.length > 0) {
            ewsStudents.push({ student: s, issues });
        }
    });

    let ewsSection = '';
    if (ewsStudents.length === 0) {
        ewsSection = 'Seluruh peserta didik mencapai ketuntasan tanpa kendala signifikan.';
    } else {
        ewsSection = ewsStudents.map((item, idx) => {
            const lines = [
                `${idx + 1}. ${item.student.name} (Kelas ${item.student.kelas})`,
                ...item.issues.map(iss => `   - ${iss}`),
                '   - Catatan: Perlu penguatan pemahaman konsep sifat aljabar terkait.'
            ];
            return lines.join('\n');
        }).join('\n\n');
    }

    // C. Peringkat Capaian Hasil Belajar Peserta Didik
    const sortedStudents = [...students].sort((a, b) => {
        const lvlDiff = (Number(b.maxLevel) || 1) - (Number(a.maxLevel) || 1);
        if (lvlDiff !== 0) return lvlDiff;
        return (Number(b.money) || 0) - (Number(a.money) || 0);
    });

    const rankSection = sortedStudents.map((s, idx) => {
        const acc = s.accuracyStr && s.accuracyStr !== '–' 
            ? s.accuracyStr 
            : (s.accuracyNum ? `${s.accuracyNum}%` : '100%');
        const labaStr = `Rp ${(s.money || 0).toLocaleString('id-ID')}`;
        return `${idx + 1}. ${s.name} (Kelas ${s.kelas}) - Capaian: Level ${s.maxLevel || 1} | Total Laba: ${labaStr} | Akurasi Rumus: ${acc}`;
    }).join('\n');

    // D. Rincian Riwayat Pembelajaran per Siswa
    const historySection = sortedStudents.map(s => {
        const hist = Array.isArray(s.history) ? s.history : [];
        const lines = [`Siswa: ${s.name} (Kelas ${s.kelas})`];
        if (hist.length === 0) {
            lines.push(`- Belum ada riwayat level yang diselesaikan (sedang aktif di Level ${s.level || 1}).`);
        } else {
            hist.forEach(h => {
                const quizStr = (h.quizTotal || 0) > 0 ? `${h.quizCorrect || 0}/${h.quizTotal}` : '-';
                const profitVal = h.profit !== undefined ? h.profit : ((h.revenue || 0) - (h.cost || 0));
                const profitStr = `Rp ${Number(profitVal || 0).toLocaleString('id-ID')}`;
                lines.push(`- Level ${h.level}: Durasi ${h.duration || 0} detik | Kesalahan Rumus: ${h.errors || 0} kali | Kuis: ${quizStr} | Laba: ${profitStr}`);
            });
        }
        return lines.join('\n');
    }).join('\n\n');

    const DIVIDER = '----------------------------------------';

    const reportText = [
        DIVIDER,
        '*LAPORAN REKAPITULASI HASIL BELAJAR ALGEBRA-MART*',
        DIVIDER,
        `Tanggal: ${dateFormatted}`,
        `Sesi / Kode Kelas: ${sessionStr}`,
        `Total Peserta Didik: ${totalStudents} Siswa`,
        `Rata-rata Capaian: Level ${avgLevel}`,
        `Ketuntasan Belajar: ${masteryPct}% (Target: Level 5)`,
        '',
        DIVIDER,
        '*DIAGNOSIS & SISWA PERLU PENDAMPINGAN*',
        DIVIDER,
        ewsSection,
        '',
        DIVIDER,
        '*PERINGKAT CAPAIAN PESERTA DIDIK*',
        '*(Berdasarkan Akumulasi Level dan Efisiensi Keuangan)*',
        DIVIDER,
        rankSection,
        '',
        DIVIDER,
        '*RINCIAN RIWAYAT PEMBELAJARAN SISWA*',
        DIVIDER,
        historySection,
        '',
        DIVIDER,
        'Dokumen ini disusun secara otomatis oleh sistem evaluasi pembelajaran Algebra-Mart.',
        DIVIDER
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(reportText)
            .then(() => {
                showMsg('Laporan Berhasil Disalin', 'Teks laporan formal rekapitulasi hasil belajar telah disalin ke papan klip.');
            })
            .catch(() => {
                fallbackCopyText(reportText);
            });
    } else {
        fallbackCopyText(reportText);
    }
}

/**
 * Helper untuk sanitasi teks HTML agar aman saat diinjeksi ke dokumen cetak.
 * @param {string|number} str 
 * @returns {string}
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Mencetak atau mengekspor dokumen rapor hasil belajar formal lengkap ke PDF via iframe terisolasi.
 */
export function handlePrintDetailedPDF() {
    const students = getAggregatedStudents();
    if (students.length === 0) {
        return showMsg('Tidak Ada Data', 'Belum ada data peserta didik untuk mencetak laporan hasil belajar.');
    }

    const now = new Date();
    const fullDateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) + ' WIB';

    const dateOnlyStr = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const sessionStr = state.hostedRoomCode 
        ? state.hostedRoomCode 
        : 'Mode Luring (Perangkat Lokal)';

    const totalStudents = students.length;
    const sumLevel = students.reduce((sum, s) => sum + (Number(s.maxLevel) || 1), 0);
    const avgLevel = (sumLevel / totalStudents).toFixed(1);

    const TARGET_LEVEL = 5;
    const completedCount = students.filter(s => (Number(s.maxLevel) || 1) >= TARGET_LEVEL).length;
    const masteryPct = Math.round((completedCount / totalStudents) * 100);

    // Urutkan siswa: level tertinggi, lalu laba terbesar
    const sortedStudents = [...students].sort((a, b) => {
        const lvlDiff = (Number(b.maxLevel) || 1) - (Number(a.maxLevel) || 1);
        if (lvlDiff !== 0) return lvlDiff;
        return (Number(b.money) || 0) - (Number(a.money) || 0);
    });

    // 1. Baris Tabel Rekapitulasi Capaian
    const summaryRowsHtml = sortedStudents.map((s, idx) => {
        const isCompleted = (Number(s.maxLevel) || 1) >= TARGET_LEVEL;
        const genderShort = (s.gender && s.gender.toLowerCase().startsWith('p')) ? 'P' : 'L';
        const acc = s.accuracyStr && s.accuracyStr !== '–' 
            ? s.accuracyStr 
            : (s.accuracyNum ? `${s.accuracyNum}%` : '100%');
        
        const hist = Array.isArray(s.history) ? s.history : [];
        const totalCorrect = hist.reduce((accVal, h) => accVal + (h.quizCorrect || 0), 0);
        const totalQuiz = hist.reduce((accVal, h) => accVal + (h.quizTotal || 0), 0);
        const quizDisplay = totalQuiz > 0 ? `${totalCorrect}/${totalQuiz}` : (s.quizStr || '-');

        return `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td class="text-center">${escapeHtml(s.kelas)}</td>
                <td class="text-center">${escapeHtml(genderShort)}</td>
                <td class="text-center font-bold">Level ${escapeHtml(s.maxLevel || 1)}</td>
                <td class="text-center font-mono">${escapeHtml(acc)}</td>
                <td class="text-center font-mono">${escapeHtml(quizDisplay)}</td>
                <td class="text-right font-mono">Rp ${(s.money || 0).toLocaleString('id-ID')}</td>
                <td class="text-center"><strong>${isCompleted ? 'Tuntas' : 'Belum Tuntas'}</strong></td>
            </tr>
        `;
    }).join('');

    // 2. Baris Tabel Diagnosis Kendala Belajar (EWS)
    const ewsEntries = [];
    sortedStudents.forEach(s => {
        const hist = Array.isArray(s.history) ? s.history : [];
        hist.forEach(h => {
            if ((h.errors || 0) >= 3) {
                ewsEntries.push({
                    name: s.name,
                    kelas: s.kelas,
                    level: `Level ${h.level}`,
                    type: 'Kesalahan Rumus Aljabar',
                    detail: `${h.errors} kali salah input rumus`,
                    rec: 'Penguatan konsep variabel, koefisien, dan substitusi aljabar'
                });
            }
            if ((h.quizTotal || 0) > 0 && (h.quizCorrect || 0) < h.quizTotal) {
                ewsEntries.push({
                    name: s.name,
                    kelas: s.kelas,
                    level: `Level ${h.level}`,
                    type: 'Evaluasi Konsep Kuis',
                    detail: `Skor kuis tidak tuntas (${h.quizCorrect || 0}/${h.quizTotal})`,
                    rec: 'Bimbingan terarah konsep sifat operasi aljabar dan soal kontekstual'
                });
            }
        });

        // Periksa data level aktif terkini jika belum tersimpan di riwayat
        if ((s.errorCount || 0) >= 3) {
            const already = hist.some(h => h.level === s.level && (h.errors || 0) >= 3);
            if (!already) {
                ewsEntries.push({
                    name: s.name,
                    kelas: s.kelas,
                    level: `Level ${s.level || 1}`,
                    type: 'Kesalahan Rumus Aljabar',
                    detail: `${s.errorCount} kali salah input rumus`,
                    rec: 'Pendampingan langsung saat perakitan formula kasir'
                });
            }
        }
        if (s.quizFailed || (s.quizWrong !== undefined && Number(s.quizWrong) > 0)) {
            const already = hist.some(h => h.level === s.level && (h.quizTotal || 0) > 0 && (h.quizCorrect || 0) < h.quizTotal);
            if (!already) {
                ewsEntries.push({
                    name: s.name,
                    kelas: s.kelas,
                    level: `Level ${s.level || 1}`,
                    type: 'Evaluasi Konsep Kuis',
                    detail: 'Skor kuis belum tuntas',
                    rec: 'Remedial pemahaman konsep aljabar pada level berjalan'
                });
            }
        }
    });

    let ewsRowsHtml = '';
    if (ewsEntries.length === 0) {
        ewsRowsHtml = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 10px; font-style: italic; color: #475569;">
                    Seluruh siswa mencapai ketuntasan tanpa kendala signifikan.
                </td>
            </tr>
        `;
    } else {
        ewsRowsHtml = ewsEntries.map((e, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${escapeHtml(e.name)}</strong> (${escapeHtml(e.kelas)})</td>
                <td class="text-center font-bold">${escapeHtml(e.level)}</td>
                <td>${escapeHtml(e.type)}</td>
                <td>${escapeHtml(e.detail)}</td>
                <td>${escapeHtml(e.rec)}</td>
            </tr>
        `).join('');
    }

    // 3. Rincian Riwayat Pembelajaran Siswa (Sangat Lengkap per Siswa)
    const studentHistoriesHtml = sortedStudents.map((s, idx) => {
        const acc = s.accuracyStr && s.accuracyStr !== '–' 
            ? s.accuracyStr 
            : (s.accuracyNum ? `${s.accuracyNum}%` : '100%');
        const hist = Array.isArray(s.history) ? s.history : [];

        let rowsHtml = '';
        if (hist.length === 0) {
            rowsHtml = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 9px; font-style: italic; color: #64748b;">
                        Siswa sedang aktif di Level ${escapeHtml(s.level || 1)} dan belum menyelesaikan transaksi.
                    </td>
                </tr>
            `;
        } else {
            rowsHtml = hist.map(h => {
                const dateObj = h.timestamp ? new Date(h.timestamp) : null;
                const timeStr = dateObj
                    ? `${dateObj.toLocaleDateString('id-ID')} ${dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                    : '-';
                
                const quizScoreStr = (h.quizTotal || 0) > 0 
                    ? `${h.quizCorrect || 0}/${h.quizTotal}` 
                    : '-';

                const revenueVal = h.revenue !== undefined ? h.revenue : (h.profit || 0);
                const costVal = h.cost !== undefined ? h.cost : 0;
                const profitVal = h.profit !== undefined ? h.profit : (revenueVal - costVal);

                return `
                    <tr>
                        <td class="text-center font-bold">Level ${escapeHtml(h.level)}</td>
                        <td class="text-center">${escapeHtml(h.duration || 0)} detik</td>
                        <td class="text-center">${escapeHtml(h.errors || 0)} kali</td>
                        <td class="text-center font-mono">${escapeHtml(quizScoreStr)}</td>
                        <td class="text-right font-mono">Rp ${Number(revenueVal).toLocaleString('id-ID')}</td>
                        <td class="text-right font-mono">Rp ${Number(costVal).toLocaleString('id-ID')}</td>
                        <td class="text-right font-mono font-bold">Rp ${Number(profitVal).toLocaleString('id-ID')}</td>
                        <td class="text-center" style="font-size: 7.5pt;">${escapeHtml(timeStr)}</td>
                    </tr>
                `;
            }).join('');
        }

        return `
            <div class="student-history-block">
                <div class="student-header-info">
                    <strong>3.${idx + 1}. Siswa: ${escapeHtml(s.name)}</strong> (Kelas ${escapeHtml(s.kelas)} | Gender: ${escapeHtml(s.gender || 'Laki-laki')}) &mdash; 
                    <span>Capaian: Level ${escapeHtml(s.maxLevel || 1)} | Akumulasi Laba: Rp ${(s.money || 0).toLocaleString('id-ID')} | Akurasi Rumus: ${escapeHtml(acc)}</span>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 10%;">Level</th>
                            <th class="text-center" style="width: 11%;">Durasi Waktu</th>
                            <th class="text-center" style="width: 13%;">Kesalahan Rumus</th>
                            <th class="text-center" style="width: 10%;">Skor Kuis</th>
                            <th class="text-right" style="width: 13%;">Pendapatan</th>
                            <th class="text-right" style="width: 13%;">Modal</th>
                            <th class="text-right" style="width: 14%;">Laba Bersih Level</th>
                            <th class="text-center" style="width: 16%;">Waktu Pengerjaan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');

    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Asesmen Hasil Belajar - Algebra-Mart</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm;
        }
        *, *::before, *::after {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.35;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        .doc-header {
            text-align: center;
            margin-bottom: 10px;
        }
        .doc-title {
            font-size: 13pt;
            font-weight: 800;
            color: #111827;
            margin: 0 0 3px 0;
            letter-spacing: 0.4px;
            text-transform: uppercase;
        }
        .doc-subtitle {
            font-size: 9pt;
            color: #374151;
            margin: 0 0 8px 0;
            font-weight: 500;
        }
        .doc-divider {
            border-bottom: 2px solid #111827;
            margin-bottom: 12px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 8.5pt;
        }
        .meta-table td {
            padding: 2.5px 4px;
            border: none;
            vertical-align: top;
        }
        .section-title {
            font-size: 9.5pt;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            margin: 14px 0 4px 0;
            border-left: 3.5px solid #111827;
            padding-left: 6px;
            page-break-after: avoid;
        }
        .section-desc {
            font-size: 8pt;
            color: #4b5563;
            margin: 0 0 6px 0;
            page-break-after: avoid;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 8pt;
            page-break-inside: auto;
        }
        table.data-table thead {
            display: table-header-group;
        }
        table.data-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        table.data-table th {
            background-color: #f1f5f9;
            color: #111827;
            font-weight: 700;
            border: 1px solid #94a3b8;
            padding: 5px 6px;
            text-align: left;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        table.data-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            color: #111827;
        }
        table.data-table tr:nth-child(even) td {
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

        .student-history-block {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        .student-header-info {
            background-color: #f8fafc;
            border: 1px solid #94a3b8;
            border-bottom: none;
            padding: 5px 8px;
            font-size: 8.5pt;
            color: #111827;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .document-footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 18px;
            padding-top: 10px;
            page-break-inside: avoid;
        }
        .footer-left {
            max-width: 58%;
            font-size: 7.5pt;
            color: #4b5563;
            line-height: 1.4;
        }
        .footer-note {
            margin: 0 0 2px 0;
        }
        .footer-right {
            min-width: 200px;
            text-align: center;
            font-size: 8.5pt;
            color: #111827;
        }
        .sign-place-date {
            margin: 0 0 2px 0;
        }
        .sign-role {
            margin: 0;
            font-weight: 600;
        }
        .sign-space {
            height: 48px;
        }
        .sign-name {
            margin: 0;
            font-weight: 700;
            border-bottom: 1px solid #111827;
            display: inline-block;
            min-width: 170px;
        }
        .sign-nip {
            margin: 3px 0 0 0;
            font-size: 8pt;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="doc-header">
        <div class="doc-title">LAPORAN REKAPITULASI DAN ASESMEN HASIL BELAJAR SISWA</div>
        <div class="doc-subtitle">Media Pembelajaran Matematika Interaktif Algebra-Mart</div>
        <div class="doc-divider"></div>
    </div>

    <table class="meta-table">
        <tr>
            <td style="width: 18%;"><strong>Tanggal Cetak</strong></td>
            <td style="width: 2%;">:</td>
            <td style="width: 35%;">${escapeHtml(fullDateStr)}</td>
            <td style="width: 20%;"><strong>Rata-rata Capaian</strong></td>
            <td style="width: 2%;">:</td>
            <td style="width: 23%;">Level ${escapeHtml(avgLevel)}</td>
        </tr>
        <tr>
            <td><strong>Sesi / Kode Kelas</strong></td>
            <td>:</td>
            <td>${escapeHtml(sessionStr)}</td>
            <td><strong>Ketuntasan Belajar</strong></td>
            <td>:</td>
            <td>${escapeHtml(masteryPct)}% (Target: Minimal Level 5)</td>
        </tr>
        <tr>
            <td><strong>Total Peserta Didik</strong></td>
            <td>:</td>
            <td>${escapeHtml(totalStudents)} Siswa</td>
            <td><strong>Kriteria Kelulusan</strong></td>
            <td>:</td>
            <td>${escapeHtml(completedCount)}/${escapeHtml(totalStudents)} Siswa Capai &ge; Lvl 5</td>
        </tr>
    </table>

    <div class="section-title">I. REKAPITULASI CAPAIAN HASIL BELAJAR PESERTA DIDIK</div>
    <p class="section-desc">Peringkat hasil belajar berdasarkan akumulasi capaian level maksimum dan efisiensi finansial laba bersih toko.</p>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 4%;">No</th>
                <th style="width: 22%;">Nama Siswa</th>
                <th class="text-center" style="width: 9%;">Kelas</th>
                <th class="text-center" style="width: 6%;">L/P</th>
                <th class="text-center" style="width: 12%;">Level Maks.</th>
                <th class="text-center" style="width: 12%;">Akurasi Rumus</th>
                <th class="text-center" style="width: 11%;">Skor Kuis</th>
                <th class="text-right" style="width: 14%;">Akumulasi Laba</th>
                <th class="text-center" style="width: 10%;">Ketuntasan</th>
            </tr>
        </thead>
        <tbody>
            ${summaryRowsHtml}
        </tbody>
    </table>

    <div class="section-title">II. CATATAN DIAGNOSIS KENDALA BELAJAR (EARLY WARNING SYSTEM)</div>
    <p class="section-desc">Identifikasi kendala teknis (kesalahan input rumus &ge; 3 kali) atau evaluasi kuis belum sempurna untuk perencanaan remedial.</p>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 4%;">No</th>
                <th style="width: 20%;">Nama Siswa</th>
                <th class="text-center" style="width: 12%;">Level Terkendala</th>
                <th style="width: 18%;">Jenis Kendala</th>
                <th style="width: 20%;">Frekuensi Kesalahan</th>
                <th style="width: 26%;">Rekomendasi Remedial</th>
            </tr>
        </thead>
        <tbody>
            ${ewsRowsHtml}
        </tbody>
    </table>

    <div class="section-title">III. RINCIAN RIWAYAT PEMBELAJARAN PER SISWA</div>
    <p class="section-desc">Dokumentasi transaksi dan performa lengkap per level yang telah diselesaikan setiap peserta didik.</p>
    ${studentHistoriesHtml}

    <div class="document-footer-section">
        <div class="footer-left">
            <p class="footer-note"><strong>Catatan Penting:</strong></p>
            <p class="footer-note">&bull; Laporan asesmen ini disusun dan diekspor secara otomatis melalui sistem pembelajaran terpadu Algebra-Mart.</p>
            <p class="footer-note">&bull; Digunakan sebagai bukti evaluasi portofolio literasi aljabar, penalaran matematika, dan literasi finansial peserta didik.</p>
        </div>
        <div class="footer-right">
            <p class="sign-place-date">${escapeHtml(dateOnlyStr)}</p>
            <p class="sign-role">Guru Pengampu Matematika / Fasilitator Kelas,</p>
            <div class="sign-space"></div>
            <p class="sign-name">________________________________________</p>
            <p class="sign-nip">NIP. ...................................................</p>
        </div>
    </div>
</body>
</html>`;

    // Buat iframe terisolasi untuk proses pencetakan dokumen PDF
    let printFrame = document.getElementById('print-pdf-frame');
    if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'print-pdf-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(fullHtmlDoc);
    frameDoc.close();

    setTimeout(() => {
        try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        } catch (printErr) {
            console.error('Gagal memicu cetak iframe, beralih ke window.print():', printErr);
            window.print();
        }
    }, 250);
}

export const handlePrintReport = handlePrintDetailedPDF;

export function exportCSV() {
    const allStudents = getAggregatedStudents();
    if (allStudents.length === 0) return showMsg("Tidak Ada Data", "Belum ada data untuk diekspor.");

    // 2. Format baris CSV detail per level sama persis dengan tabel riwayat di detail rapor siswa
    const headers = [
        "Nama Siswa",
        "Kelas",
        "Jenis Kelamin",
        "Level",
        "Durasi",
        "Salah Rumus",
        "Skor Kuis",
        "Total Laba Bersih",
        "Waktu"
    ];

    const escapeCSV = (val) => {
        let str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = [];

    allStudents.forEach(student => {
        const history = Array.isArray(student.history) ? student.history : [];
        const studentMoneyStr = `Rp ${(student.money || 0).toLocaleString('id-ID')}`;

        if (history.length === 0) {
            rows.push([
                escapeCSV(student.name),
                escapeCSV(student.kelas),
                escapeCSV(student.gender),
                `Level ${student.level || 1} (Sedang Aktif)`,
                "-",
                "0",
                "-",
                escapeCSV(studentMoneyStr),
                "-"
            ].join(","));
        } else {
            history.forEach(h => {
                const dateObj = h.timestamp ? new Date(h.timestamp) : null;
                const timeStr = dateObj
                    ? `${dateObj.toLocaleDateString('id-ID')} ${dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                    : '-';

                const quizTotal = h.quizTotal || 0;
                let quizScoreStr = '-';
                if (quizTotal > 0) {
                    const quizCorrect = h.quizCorrect || 0;
                    quizScoreStr = `${quizCorrect}/${quizTotal}`;
                }

                rows.push([
                    escapeCSV(student.name),
                    escapeCSV(student.kelas),
                    escapeCSV(student.gender),
                    `Level ${h.level}`,
                    `${h.duration || 0}s`,
                    `${h.errors || 0}`,
                    escapeCSV(quizScoreStr),
                    escapeCSV(studentMoneyStr),
                    escapeCSV(timeStr)
                ].join(","));
            });
        }
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AlgebraMart_Detail_Siswa_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function deleteUser(id) {
    if (confirm("Hapus data pemain ini?")) {
        state.users = state.users.filter(u => u.id !== id);
        saveData();
        openFasilitator();
    }
}

export function resetAllData() {
    if (confirm("Hapus SEMUA data di perangkat ini? Tindakan ini tidak dapat dibatalkan.")) {
        stopHostRoom();
        state.users = [];
        localStorage.removeItem('algebraMart_users');
        openFasilitator();
    }
}

