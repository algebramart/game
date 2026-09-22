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
 * Guru membuat sesi kelas online / membuka ruang.
 */
export function handleCreateHostRoom() {
    const code = startHostRoom(() => {
        // Callback realtime saat progres murid masuk
        renderFasilTableAndEWS();
    });
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
        let accStr = totalLvl === 0 ? '-' : accNum + '%';

        let lastHistory = u.history && u.history.length > 0 ? u.history[u.history.length - 1] : null;
        let lastErrors = lastHistory ? (lastHistory.errors || 0) : 0;

        let totalQuizCorrect = u.history ? u.history.reduce((sum, h) => sum + (h.quizCorrect || 0), 0) : 0;
        let totalQuizCount   = u.history ? u.history.reduce((sum, h) => sum + (h.quizTotal   || 0), 0) : 0;
        let quizStr          = totalQuizCount > 0 ? `${totalQuizCorrect}/${totalQuizCount}` : '-';

        studentMap.set(String(u.id || u.name), {
            id: u.id,
            name: u.name,
            kelas: u.kelas || u.class || '-',
            gender: u.gender || 'Laki-laki',
            maxLevel: u.maxLevel || 1,
            level: lastHistory ? lastHistory.level : (u.maxLevel || 1),
            money: u.money || 0,
            accuracyNum: accNum,
            accuracyStr: accStr,
            errorCount: lastErrors,
            quizStr: quizStr,
            isOnline: false,
            isLocal: true
        });
    });

    // 2. Masukkan / perbarui dengan data online yang diterima
    if (state.onlineStudents) {
        Object.values(state.onlineStudents).forEach(s => {
            const key = String(s.studentId || s.name);
            const existing = studentMap.get(key);
            if (existing) {
                existing.maxLevel = Math.max(existing.maxLevel, s.maxLevel || s.level || 1);
                existing.level = s.level || existing.level;
                existing.money = s.laba !== undefined ? s.laba : existing.money;
                existing.accuracyNum = s.accuracy !== undefined ? s.accuracy : existing.accuracyNum;
                existing.accuracyStr = s.accuracy !== undefined ? `${s.accuracy}%` : existing.accuracyStr;
                existing.errorCount = s.errorCount !== undefined ? s.errorCount : existing.errorCount;
                if (s.quizScore) existing.quizStr = s.quizScore;
                existing.isOnline = true;
            } else {
                studentMap.set(key, {
                    id: s.studentId,
                    name: s.name,
                    kelas: s.kelas || '-',
                    gender: s.gender || 'Laki-laki',
                    maxLevel: s.maxLevel || s.level || 1,
                    level: s.level || 1,
                    money: s.laba || 0,
                    accuracyNum: s.accuracy !== undefined ? s.accuracy : 100,
                    accuracyStr: s.accuracy !== undefined ? `${s.accuracy}%` : '100%',
                    errorCount: s.errorCount || 0,
                    quizStr: s.quizScore || '-',
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
            tbody.innerHTML += `
                <tr class="fasil-tr">
                    <td class="fasil-td">${onlineBadge}<strong>${u.name}</strong></td>
                    <td class="fasil-td">${u.kelas}</td>
                    <td class="fasil-td text-center">Lvl ${u.maxLevel}</td>
                    <td class="fasil-td text-right">${u.money.toLocaleString('id-ID')}</td>
                    <td class="fasil-td text-center">${u.accuracyStr}</td>
                    <td class="fasil-td text-center font-bold" style="color:#1976d2;">${u.quizStr}</td>
                    <td class="fasil-td text-center">
                        ${u.isLocal ? `<button class="btn-delete-user" data-id="${u.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>` : '<span style="color:#94a3b8; font-size:0.75rem;">Sesi Live</span>'}
                    </td>
                </tr>
            `;
        });

        // Pasang event listener tombol hapus
        tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.id));
        });
    }

    // Evaluasi EWS (Early Warning System)
    // Kriteria: Murid dengan akurasi < 70% ATAU kesalahan rumus >= 3 kali pada suatu level
    const ewsAlerts = students.filter(s => {
        return (s.accuracyNum < 70) || (s.errorCount >= 3);
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
            let reasonHtml = '';
            if (s.accuracyNum < 70) {
                reasonHtml += `<div class="ews-reason-item"><i class="fa-solid fa-triangle-exclamation"></i> Akurasi Rendah: ${s.accuracyStr} (Butuh bimbingan konsep)</div>`;
            }
            if (s.errorCount >= 3) {
                reasonHtml += `<div class="ews-reason-item"><i class="fa-solid fa-circle-xmark"></i> ${s.errorCount}x Kesalahan Rumus pada Level ${s.level}</div>`;
            }

            ewsList.innerHTML += `
                <div class="ews-card">
                    <div class="ews-card-header">
                        <span class="ews-card-name">${s.name}</span>
                        <span class="ews-card-class">Kelas ${s.kelas}</span>
                    </div>
                    <div class="ews-card-level"><i class="fa-solid fa-gamepad"></i> Sedang di Level ${s.level}</div>
                    <div class="ews-card-reasons">
                        ${reasonHtml}
                    </div>
                </div>
            `;
        });
    }
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
        state.users = [];
        localStorage.removeItem('algebraMart_users');
        openFasilitator();
    }
}

