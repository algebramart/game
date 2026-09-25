import { state } from '../core/state.js';
import { BADGES_DB } from '../data/items.js';
import { getTitle, saveData, checkBadgeUnlocks } from '../core/engine.js';
import { switchScreen, showMsg } from './screens.js';
import { startHostRoom, stopHostRoom } from '../core/sync.js';

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

    document.getElementById('bk-akurasi').innerText         = accuracy + "%";
    document.getElementById('bk-akurasi-bar').style.width   = accuracy + "%";

    const histList = document.getElementById('bk-history-list');
    histList.innerHTML = '';

    if (totalLevels === 0) {
        histList.innerHTML = '<div style="text-align:center; color:var(--color-slate-400); font-style:italic; padding:1rem;">Belum ada riwayat permainan.</div>';
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

    const ctx = document.getElementById('financeChart').getContext('2d');
    if (state.chartInstance) state.chartInstance.destroy();

    let labels     = state.currentUser.history.map(h => `Lvl ${h.level}`);
    let dataProfit = state.currentUser.history.map(h => h.profit);
    if (labels.length === 0) { labels = ['-']; dataProfit = [0]; }

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Laba (Rp)',
                data: dataProfit,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#1e3a8a',
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
        badgeContainer.innerHTML += `
            <div class="badge-card ${hasBadge ? 'badge-unlocked' : 'badge-locked'}" title="${b.desc}">
                <div class="badge-icon-wrapper ${hasBadge ? b.colorClass : 'icon-disabled'}">
                    <i class="fa-solid badge-icon ${hasBadge ? b.icon : 'fa-lock'}"></i>
                </div>
                <span class="badge-category-tag">${b.category}</span>
                <h4>${b.name}</h4>
                <p class="badge-desc-text">${b.desc}</p>
            </div>
        `;
    });

    document.getElementById('token-display').innerText = state.currentUser.token;

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

    if (state.hostedRoomCode) {
        if (roomBadge) roomBadge.classList.remove('hidden');
        if (roomCodeDisplay) roomCodeDisplay.innerText = state.hostedRoomCode;
        if (modeDesc) modeDesc.innerText = `Sesi Aktif: ${state.hostedRoomCode} (Menerima Progres Realtime Daring & Luring)`;
        if (btnCreateRoom) btnCreateRoom.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Ganti Kode Ruang`;
    } else {
        if (roomBadge) roomBadge.classList.add('hidden');
        if (modeDesc) modeDesc.innerText = 'Mode Luring - Data Perangkat Lokal';
        if (btnCreateRoom) btnCreateRoom.innerHTML = `<i class="fa-solid fa-tower-broadcast"></i> Buat Sesi Kelas Online`;
    }
}

/**
 * Guru membuat sesi kelas online / membuka ruang baru.
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
 * Render tabel murid aktif dan panel Peringatan Dini (EWS).
 */
export function renderFasilTableAndEWS() {
    const tbody   = document.getElementById('fasil-table-body');
    const ewsList = document.getElementById('fasil-ews-list');
    if (!tbody || !ewsList) return;

    tbody.innerHTML = '';
    ewsList.innerHTML = '';

    // Gabungkan data user lokal dan data murid online
    const studentMap = new Map();

    // 1. Masukkan pengguna lokal
    state.users.forEach(u => {
        let totalLvl = u.history ? u.history.length : 0;
        let zeroErrors = u.history ? u.history.filter(h => (h.errors || 0) === 0).length : 0;
        let accNum = totalLvl === 0 ? 100 : Math.round((zeroErrors / totalLvl) * 100);
        let accStr = totalLvl === 0 ? '100%' : accNum + '%';

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

        studentMap.set(String(u.id || u.name), {
            id: u.id,
            name: u.name,
            kelas: u.kelas || u.class || '-',
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

            if (existing) {
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
                studentMap.set(key, {
                    id: s.studentId,
                    name: s.name,
                    kelas: s.kelas || '-',
                    gender: s.gender || 'Laki-laki',
                    maxLevel: s.maxLevel || s.level || 1,
                    level: s.level || 1,
                    activeLevel: s.activeLevel || null,
                    money: s.laba !== undefined ? s.laba : 0,
                    accuracyNum: s.accuracy !== undefined ? s.accuracy : 100,
                    accuracyStr: s.accuracy !== undefined ? `${s.accuracy}%` : '100%',
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

    const students = Array.from(studentMap.values());

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 1.5rem; color: #64748b;">Belum ada data murid yang terhubung atau tersimpan.</td></tr>';
    } else {
        students.forEach(u => {
            const onlineBadge = u.isOnline ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-right:4px;" title="Online"></span>' : '';

            let levelDisplay = `<span style="color:#94a3b8;">Lvl ${u.maxLevel}</span>`;
            if (u.isOnline) {
                if (u.activeLevel) {
                    levelDisplay = `<div><strong style="color:#22c55e;"><i class="fa-solid fa-gamepad"></i> Sedang di Lvl ${u.activeLevel}</strong><div style="font-size:0.75rem; color:#94a3b8;">Max: Lvl ${u.maxLevel}</div></div>`;
                } else {
                    levelDisplay = `<div><span style="color:#94a3b8;"><i class="fa-solid fa-couch"></i> Di Menu/Lobi</span><div style="font-size:0.75rem; color:#94a3b8;">Max: Lvl ${u.maxLevel}</div></div>`;
                }
            }

            tbody.innerHTML += `
                <tr class="fasil-tr">
                    <td class="fasil-td">${onlineBadge}<strong>${u.name}</strong></td>
                    <td class="fasil-td">${u.kelas}</td>
                    <td class="fasil-td text-center">${levelDisplay}</td>
                    <td class="fasil-td text-right">${u.money.toLocaleString('id-ID')}</td>
                    <td class="fasil-td text-center">${u.accuracyStr}</td>
                    <td class="fasil-td text-center font-bold" style="color:#1976d2;">${u.quizStr}</td>
                    <td class="fasil-td text-center">
                        <div style="display:inline-flex; gap:6px; align-items:center; justify-content:center;">
                            <button class="btn-detail-user" data-id="${u.id}" title="Lihat Rapor Belajar Siswa">
                                <i class="fa-solid fa-chart-line"></i> Detail
                            </button>
                            ${u.isLocal ? `<button class="btn-delete-user" data-id="${u.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>` : '<span style="color:#94a3b8; font-size:0.75rem;">Sesi Live</span>'}
                        </div>
                    </td>
                </tr>
            `;
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
    if (accEl)    accEl.innerText   = student.accuracyStr || '100%';
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
                    <td colspan="5" style="text-align:center; padding:1.5rem; color:#94a3b8; font-style:italic;">
                        Belum ada riwayat level yang diselesaikan.<br>
                        <span style="font-size:0.75rem;">Siswa saat ini sedang aktif di Level ${student.level || 1}.</span>
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
                    ? '<span style="color:#22c55e; font-weight:bold;"><i class="fa-solid fa-circle-check"></i> 0</span>'
                    : `<span style="color:#ef4444; font-weight:bold;"><i class="fa-solid fa-triangle-exclamation"></i> ${h.errors}x</span>`;

                const quizTotal = h.quizTotal || 0;
                let quizBadge = '-';
                if (quizTotal > 0) {
                    const quizCorrect = h.quizCorrect || 0;
                    const isPerfect = quizCorrect === quizTotal;
                    quizBadge = `<span style="color:${isPerfect ? '#22c55e' : '#f59e0b'}; font-weight:bold;">${quizCorrect}/${quizTotal}</span>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight:700; color:#60a5fa;">Level ${h.level}</td>
                        <td><i class="fa-regular fa-clock" style="color:#94a3b8;"></i> ${h.duration || 0}s</td>
                        <td class="text-center">${errBadge}</td>
                        <td class="text-center">${quizBadge}</td>
                        <td class="text-right font-mono" style="color:#94a3b8; font-size:0.75rem;">${timeStr}</td>
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

export function exportCSV() {
    // Kumpulkan data gabungan (lokal + online)
    const studentMap = new Map();
    state.users.forEach(u => {
        let totalLvl    = u.history ? u.history.length : 0;
        let acc         = totalLvl === 0 ? 0 : Math.round((u.history.filter(h => (h.errors || 0) === 0).length / totalLvl) * 100);
        let totalErrors = u.history ? u.history.reduce((sum, h) => sum + (h.errors || 0), 0) : 0;
        let totalQC     = u.history ? u.history.reduce((sum, h) => sum + (h.quizCorrect || 0), 0) : 0;
        let totalQT     = u.history ? u.history.reduce((sum, h) => sum + (h.quizTotal   || 0), 0) : 0;
        let kuisStr     = totalQT > 0 ? `${totalQC}/${totalQT}` : "0/0";
        let sumbangan   = u.sumbangan || u.donasi || 0;
        let reputasi    = getTitle(u.money || 0);

        studentMap.set(String(u.id || u.name), {
            name: u.name,
            kelas: u.kelas || u.class || '-',
            gender: u.gender || 'Laki-laki',
            maxLevel: u.maxLevel || 1,
            money: u.money || 0,
            acc: `${acc}%`,
            totalErrors,
            kuisStr,
            sumbangan,
            reputasi
        });
    });

    if (state.onlineStudents) {
        Object.values(state.onlineStudents).forEach(s => {
            const key = String(s.studentId || s.name);
            const existing = studentMap.get(key);
            if (existing) {
                existing.maxLevel = Math.max(existing.maxLevel, s.maxLevel || s.level || 1);
                existing.money = s.laba !== undefined ? s.laba : existing.money;
                if (s.accuracy !== undefined) existing.acc = `${s.accuracy}%`;
                if (s.quizScore) existing.kuisStr = s.quizScore;
                existing.totalErrors += (s.errorCount || 0);
            } else {
                studentMap.set(key, {
                    name: s.name,
                    kelas: s.kelas || '-',
                    gender: s.gender || 'Laki-laki',
                    maxLevel: s.maxLevel || s.level || 1,
                    money: s.laba || 0,
                    acc: s.accuracy !== undefined ? `${s.accuracy}%` : '100%',
                    totalErrors: s.errorCount || 0,
                    kuisStr: s.quizScore || '0/0',
                    sumbangan: 0,
                    reputasi: getTitle(s.laba || 0)
                });
            }
        });
    }

    const allRecords = Array.from(studentMap.values());
    if (allRecords.length === 0) return showMsg("Tidak Ada Data", "Belum ada data untuk diekspor.");

    const headers = [
        "Nama",
        "Kelas",
        "Gender",
        "Level Max",
        "Laba Bersih",
        "Akurasi Rumus (%)",
        "Total Salah",
        "Kuis (Benar/Total)",
        "Total Sumbangan",
        "Reputasi Toko"
    ];

    const escapeCSV = (val) => {
        let str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = allRecords.map(u => {
        return [
            escapeCSV(u.name),
            escapeCSV(u.kelas),
            escapeCSV(u.gender),
            u.maxLevel || 0,
            u.money || 0,
            u.acc,
            u.totalErrors || 0,
            u.kuisStr,
            u.sumbangan || 0,
            escapeCSV(u.reputasi)
        ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AlgebraMart_Data_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`);
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

