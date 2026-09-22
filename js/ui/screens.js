// ==========================================
// ui/screens.js — Navigasi & Render Layar
// ==========================================
import { state } from '../core/state.js';
import { getTitle } from '../core/engine.js';
import { playSFX } from '../core/audio.js';

/**
 * Menampilkan modal pesan umum.
 * @param {string} title
 * @param {string} desc
 * @param {Function|null} onCloseCallback
 */
export function showMsg(title, desc, onCloseCallback = null) {
    document.getElementById('msg-title').innerHTML = title;
    document.getElementById('msg-desc').innerHTML  = desc;

    const modalMsg = document.getElementById('modal-msg');
    const btnOk    = modalMsg.querySelector('.btn-primary');

    btnOk.onclick = () => {
        modalMsg.classList.add('hidden');
        if (onCloseCallback) onCloseCallback();
    };

    modalMsg.classList.remove('hidden');
}

/**
 * Menutup modal berdasarkan id elemen.
 * @param {string} id
 */
export function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

/**
 * Memperbarui tombol aksi kontekstual pada modal pengaturan berdasarkan layar aktif.
 * @param {string} screenId
 */
export function updateUniversalSettingsContext(screenId) {
    const btnUniversalSettings = document.getElementById('btn-universal-settings');
    if (btnUniversalSettings) {
        if (screenId === 'screen-welcome') {
            btnUniversalSettings.classList.add('hidden');
        } else {
            btnUniversalSettings.classList.remove('hidden');
        }
    }

    const btnFasil = document.getElementById('btn-settings-fasil');
    const btnSwitchUser = document.getElementById('btn-settings-switch-user');
    const btnExitGame = document.getElementById('btn-settings-exit-game');

    if (btnFasil) {
        if (screenId === 'screen-login') btnFasil.classList.remove('hidden');
        else btnFasil.classList.add('hidden');
    }

    if (btnSwitchUser) {
        if (screenId === 'screen-lobby') btnSwitchUser.classList.remove('hidden');
        else btnSwitchUser.classList.add('hidden');
    }

    if (btnExitGame) {
        if (screenId === 'screen-game') btnExitGame.classList.remove('hidden');
        else btnExitGame.classList.add('hidden');
    }
}

/**
 * Berpindah ke layar yang ditentukan.
 * @param {string} screenId
 */
export function switchScreen(screenId) {
    // endTutorial dipanggil dari app.js jika tersedia
    if (typeof window._endTutorial === 'function') window._endTutorial();
    playSFX('nav');

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    updateUniversalSettingsContext(screenId);

    if (screenId === 'screen-lobby')  renderLobby();
    if (screenId === 'screen-levels') renderLevels();
}

/**
 * Merender daftar profil pemain di layar login.
 */
export function renderUserList() {
    const list = document.getElementById('user-list');
    list.innerHTML = '';

    if (state.users.length === 0) {
        list.innerHTML = '<p style="font-size:0.75rem; color:var(--color-slate-500); text-align:center; font-style:italic;">Belum ada data pemain. Silakan buat baru.</p>';
        return;
    }

    state.users.forEach(u => {
        const btn = document.createElement('button');
        btn.className = 'user-btn';
        btn.innerHTML = `
            <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${u.name}</div>
                <div class="user-meta">${u.kelas} | Rp ${u.money.toLocaleString('id-ID')}</div>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;
        btn.addEventListener('click', () => {
            // login dipanggil dari app.js
            if (typeof window._login === 'function') window._login(u.id);
        });
        list.appendChild(btn);
    });
}

/**
 * Menampilkan pop-up notifikasi animasi saat lencana baru terbuka.
 * @param {Object} badge
 */
export function showBadgeUnlockedPopup(badge) {
    if (!badge) return;
    const container = document.getElementById('badge-toast-container');
    if (!container) return;

    playSFX('badge_reward');

    const toast = document.createElement('div');
    toast.className = 'badge-toast animate-badge-pop';
    toast.innerHTML = `
        <div class="badge-toast-glow"></div>
        <div class="badge-toast-icon-wrapper ${badge.colorClass || 'icon-gold'}">
            <i class="fa-solid ${badge.icon || 'fa-award'}"></i>
        </div>
        <div class="badge-toast-content">
            <div class="badge-toast-tag"><i class="fa-solid fa-star"></i> LENCANA DIBUKA!</div>
            <h4 class="badge-toast-name">${badge.name}</h4>
            <p class="badge-toast-desc">${badge.desc}</p>
        </div>
        <button class="badge-toast-close" title="Tutup">&times;</button>
    `;

    const closeBtn = toast.querySelector('.badge-toast-close');
    const dismiss = () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    };

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
    });
    toast.addEventListener('click', dismiss);

    container.appendChild(toast);

    // Otomatis hilang setelah 4.5 detik
    setTimeout(() => {
        if (toast.parentElement) dismiss();
    }, 4500);
}

// Daftarkan ke window agar dapat dipanggil dari engine.js
if (typeof window !== 'undefined') {
    window._showBadgeNotification = showBadgeUnlockedPopup;
}

/**
 * Merender informasi profil di layar lobi.
 */
export function renderLobby() {
    document.getElementById('lobby-name').innerText   = state.currentUser.name;
    document.getElementById('lobby-gender').innerText = state.currentUser.gender;
    document.getElementById('lobby-class').innerText  = state.currentUser.kelas;

    const title = getTitle(state.currentUser.money, state.currentUser.sumbangan || state.currentUser.donasi || 0);
    document.getElementById('lobby-title').innerText    = title;
    document.getElementById('lobby-id-name').innerText  = state.currentUser.name;
    document.getElementById('lobby-id-title').innerText = title;

    state.currentUser.token = `${state.currentUser.name.substring(0, 3).toUpperCase()}${state.currentUser.money}-${state.currentUser.maxLevel}LV`;

    const avatarMini    = document.getElementById('lobby-avatar-mini');
    const characterFull = document.getElementById('lobby-character');

    if (state.currentUser.gender === "Perempuan") {
        avatarMini.src    = "assets/character/avatar-female.svg";
        characterFull.src = "assets/character/character-female.svg";
    } else {
        avatarMini.src    = "assets/character/avatar-male.svg";
        characterFull.src = "assets/character/character-male.svg";
    }

    // Status Sinkronisasi Kelas Guru
    const btnJoinRoom = document.getElementById('btn-open-join-room');
    const roomLabel   = document.getElementById('lobby-room-label');
    if (roomLabel && btnJoinRoom) {
        if (state.activeRoomCode) {
            roomLabel.innerText = `Kelas: ${state.activeRoomCode}`;
            btnJoinRoom.classList.add('joined');
            btnJoinRoom.title = `Terhubung ke kelas guru: ${state.activeRoomCode}. Klik untuk melihat atau keluar.`;
        } else {
            roomLabel.innerText = 'Gabung Kelas';
            btnJoinRoom.classList.remove('joined');
            btnJoinRoom.title = 'Gabung Kelas Guru (Opsional)';
        }
    }
}

/**
 * Merender grid tombol level di layar pemilihan level.
 */
export function renderLevels() {
    const container = document.getElementById('level-grid-container');
    if (!container || !state.currentUser) return;
    container.innerHTML = '';

    const tabEasy = document.getElementById('tab-level-easy');
    const tabHard = document.getElementById('tab-level-hard');
    const maxLevel = state.currentUser.maxLevel || 0;
    const isHardUnlocked = maxLevel >= 10;

    // Pastikan tab aktif konsisten
    if (!state.currentLevelTab) state.currentLevelTab = 'easy';
    if (!isHardUnlocked && state.currentLevelTab === 'hard') {
        state.currentLevelTab = 'easy';
    }

    // Perbarui visual tombol tab Easy
    if (tabEasy) {
        tabEasy.className = state.currentLevelTab === 'easy' ? 'tab-active' : 'tab-inactive';
    }

    // Perbarui visual tombol tab Hard
    if (tabHard) {
        if (!isHardUnlocked) {
            tabHard.className = 'tab-disabled';
            tabHard.innerHTML = 'Tantangan Sulit (C4-C6) <i class="fa-solid fa-lock"></i>';
            tabHard.title = 'Selesaikan 10 Level Tantangan Mudah untuk membuka!';
        } else {
            tabHard.className = state.currentLevelTab === 'hard' ? 'tab-active tab-hard-theme' : 'tab-inactive';
            tabHard.innerHTML = 'Tantangan Sulit (C4-C6) <i class="fa-solid fa-fire text-amber-400"></i>';
            tabHard.removeAttribute('title');
        }
    }

    // Tentukan rentang level yang ditampilkan berdasarkan tab
    const isHardMode = state.currentLevelTab === 'hard';
    const startLevel = isHardMode ? 11 : 1;
    const endLevel   = isHardMode ? 20 : 10;

    for (let i = startLevel; i <= endLevel; i++) {
        let isUnlocked = false;
        if (!isHardMode) {
            isUnlocked = i <= (maxLevel + 1);
        } else {
            isUnlocked = isHardUnlocked && (i <= Math.max(11, maxLevel + 1));
        }

        const btn = document.createElement('button');

        if (isUnlocked) {
            const hist = state.currentUser.history.find(h => h.level === i);
            let starsHTML = '';

            if (hist) {
                const stars = hist.errors === 0 ? 3 : (hist.errors <= 2 ? 2 : 1);
                for (let s = 0; s < 3; s++) {
                    starsHTML += `<i class="fa-solid fa-star ${s < stars ? 'star-active' : 'star-inactive'}"></i>`;
                }
            } else {
                starsHTML = `<i class="fa-regular fa-star star-inactive"></i><i class="fa-regular fa-star star-inactive"></i><i class="fa-regular fa-star star-inactive"></i>`;
            }

            btn.className = isHardMode ? "btn-level-hard-unlocked" : "btn-level-unlocked";
            btn.innerHTML = `<span>${i}</span><div class="level-stars">${starsHTML}</div>`;
            btn.addEventListener('click', () => {
                playSFX('nav');
                if (typeof window._startLevel === 'function') window._startLevel(i);
            });
        } else {
            btn.className = "btn-level-locked";
            btn.innerHTML = `<span>${i}</span><i class="fa-solid fa-lock"></i>`;
            btn.addEventListener('click', () => {
                playSFX('error');
            });
        }

        container.appendChild(btn);
    }
}

