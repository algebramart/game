// ==========================================
// core/audio.js — Sistem Audio Modular (BGM & SFX)
// ==========================================

export const BGM_SRC = 'assets/sound/bgm.mp3';

export const SFX_MAP = {
    numpad:               'assets/sound/select_004.ogg',       // Klik tombol angka numpad (0-9)
    product:              'assets/sound/confirmation_004.ogg', // Klik barang/produk di rak (addVariable)
    calc_checkout:        'assets/sound/select_005.ogg',       // Tombol "=" & Konfirmasi checkout
    money_cash:           'assets/sound/confirmation_003.ogg', // Klik uang dompet & laci kembalian
    clear_back:           'assets/sound/question_002.ogg',     // Tombol Clear (C), Backspace, & tarik kembalian
    success_quiz_change:  'assets/sound/select_001.ogg',       // Kuis benar & kembalian pas
    error:                'assets/sound/confirmation_001.ogg', // Rumus salah, kembalian salah, & kuis salah
    badge_reward:         'assets/sound/confirmation_002.ogg', // Notifikasi lencana & reward bintang
    nav:                  'assets/sound/select_006.ogg'        // Navigasi UI umum
};

let bgmVolume = 0.35;
let sfxVolume = 0.7;
let isBgmMuted = false;
let isSfxMuted = false;

let isInitialized = false;
let bgmAudio = null;
const sfxAudioCache = {};
let bgmStarted = false;

// Baca preferensi awal dari localStorage secara aman
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
        const savedBgmVol = localStorage.getItem('algebraMart_bgmVolume');
        if (savedBgmVol !== null) {
            const parsed = parseFloat(savedBgmVol);
            if (!isNaN(parsed)) bgmVolume = Math.min(Math.max(parsed, 0), 1);
        }

        const savedSfxVol = localStorage.getItem('algebraMart_sfxVolume');
        if (savedSfxVol !== null) {
            const parsed = parseFloat(savedSfxVol);
            if (!isNaN(parsed)) sfxVolume = Math.min(Math.max(parsed, 0), 1);
        }

        const savedBgmMuted = localStorage.getItem('algebraMart_bgmMuted');
        if (savedBgmMuted !== null) {
            isBgmMuted = savedBgmMuted === 'true';
        } else {
            // Migrasi dari preferensi lama jika ada
            const legacyMuted = localStorage.getItem('algebraMart_muted');
            if (legacyMuted !== null) isBgmMuted = legacyMuted === 'true';
        }

        const savedSfxMuted = localStorage.getItem('algebraMart_sfxMuted');
        if (savedSfxMuted !== null) {
            isSfxMuted = savedSfxMuted === 'true';
        } else {
            const legacyMuted = localStorage.getItem('algebraMart_muted');
            if (legacyMuted !== null) isSfxMuted = legacyMuted === 'true';
        }
    } catch (e) {
        console.warn('[Audio] Gagal membaca preferensi audio dari localStorage:', e);
    }
}

/**
 * Menginisialisasi sistem audio dan melakukan preload aset.
 */
export function initAudio() {
    if (isInitialized || typeof window === 'undefined') return;

    try {
        // Inisialisasi BGM
        bgmAudio = new Audio(BGM_SRC);
        bgmAudio.loop = true;
        bgmAudio.volume = isBgmMuted ? 0 : bgmVolume;

        // Preload SFX
        for (const [key, path] of Object.entries(SFX_MAP)) {
            const sfx = new Audio(path);
            sfx.preload = 'auto';
            sfxAudioCache[key] = sfx;
        }

        isInitialized = true;
        updateSoundButtonUI();
    } catch (err) {
        console.warn('[Audio] Gagal menginisialisasi audio:', err);
    }
}

/**
 * Memulai pemutaran musik latar belakang (BGM).
 */
export function playBGM() {
    if (!isInitialized) initAudio();
    bgmStarted = true;

    if (isBgmMuted || !bgmAudio) return;

    bgmAudio.volume = bgmVolume;
    const playPromise = bgmAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.warn('[Audio] Autoplay BGM ditunda menunggu interaksi pengguna:', err);
        });
    }
}

/**
 * Menjeda pemutaran musik latar belakang (BGM).
 */
export function pauseBGM() {
    if (bgmAudio) {
        bgmAudio.pause();
    }
}

/**
 * Menghentikan musik latar belakang dan mengembalikan durasi ke awal.
 */
export function stopBGM() {
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }
    bgmStarted = false;
}

/**
 * Memutar efek suara (SFX) berdasarkan identifier.
 * Mendukung polyphonic/concurrent playback melalui kloning instan.
 * @param {keyof typeof SFX_MAP} sfxKey
 */
export function playSFX(sfxKey) {
    if (isSfxMuted) return;
    if (!isInitialized) initAudio();

    const masterSfx = sfxAudioCache[sfxKey];
    if (!masterSfx) {
        // Fallback jika belum ter-cache
        const path = SFX_MAP[sfxKey];
        if (!path) return;
        try {
            const tempAudio = new Audio(path);
            tempAudio.volume = sfxVolume;
            tempAudio.play().catch(() => {});
        } catch (e) {}
        return;
    }

    try {
        // Kloning objek audio agar klik cepat bertubi-tubi tidak memotong suara sebelumnya
        const clone = masterSfx.cloneNode();
        clone.volume = sfxVolume;
        const playPromise = clone.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    } catch (err) {
        // Fallback jika cloneNode tidak diizinkan
        masterSfx.currentTime = 0;
        masterSfx.volume = sfxVolume;
        masterSfx.play().catch(() => {});
    }
}

/**
 * Mengatur volume BGM (0.0 sampai 1.0).
 * @param {number} val
 */
export function setBGMVolume(val) {
    bgmVolume = Math.min(Math.max(Number(val) || 0, 0), 1);
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('algebraMart_bgmVolume', bgmVolume.toString()); } catch (e) {}
    }
    if (bgmAudio && !isBgmMuted) {
        bgmAudio.volume = bgmVolume;
    }
}

/**
 * Mengatur volume SFX (0.0 sampai 1.0).
 * @param {number} val
 */
export function setSFXVolume(val) {
    sfxVolume = Math.min(Math.max(Number(val) || 0, 0), 1);
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('algebraMart_sfxVolume', sfxVolume.toString()); } catch (e) {}
    }
}

/**
 * Mengaktifkan atau menonaktifkan mute BGM.
 * @returns {boolean} Status isBgmMuted terbaru
 */
export function toggleBGMMute() {
    if (!isInitialized) initAudio();

    isBgmMuted = !isBgmMuted;
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('algebraMart_bgmMuted', isBgmMuted ? 'true' : 'false'); } catch (e) {}
    }

    if (bgmAudio) {
        if (isBgmMuted) {
            bgmAudio.pause();
        } else if (bgmStarted) {
            bgmAudio.volume = bgmVolume;
            bgmAudio.play().catch(() => {});
        }
    }

    updateSoundButtonUI();
    return isBgmMuted;
}

/**
 * Mengaktifkan atau menonaktifkan mute SFX.
 * @returns {boolean} Status isSfxMuted terbaru
 */
export function toggleSFXMute() {
    if (!isInitialized) initAudio();

    isSfxMuted = !isSfxMuted;
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('algebraMart_sfxMuted', isSfxMuted ? 'true' : 'false'); } catch (e) {}
    }

    updateSoundButtonUI();
    return isSfxMuted;
}

/**
 * Mengambil volume BGM saat ini (0.0 - 1.0).
 */
export function getBGMVolume() {
    return bgmVolume;
}

/**
 * Mengambil volume SFX saat ini (0.0 - 1.0).
 */
export function getSFXVolume() {
    return sfxVolume;
}

/**
 * Mengembalikan status apakah BGM dibisukan.
 */
export function isBgmMutedStatus() {
    return isBgmMuted;
}

/**
 * Mengembalikan status apakah SFX dibisukan.
 */
export function isSfxMutedStatus() {
    return isSfxMuted;
}

// ==========================================
// FUNGSI KOMPATIBILITAS MUNDUR
// ==========================================

export function toggleMute() {
    const nextState = !(isBgmMuted && isSfxMuted);
    isBgmMuted = nextState;
    isSfxMuted = nextState;

    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('algebraMart_bgmMuted', isBgmMuted ? 'true' : 'false');
            localStorage.setItem('algebraMart_sfxMuted', isSfxMuted ? 'true' : 'false');
            localStorage.setItem('algebraMart_muted', nextState ? 'true' : 'false');
        } catch (e) {}
    }

    if (bgmAudio) {
        if (isBgmMuted) {
            bgmAudio.pause();
        } else if (bgmStarted) {
            bgmAudio.volume = bgmVolume;
            bgmAudio.play().catch(() => {});
        }
    }

    updateSoundButtonUI();
    return nextState;
}

export function isAudioMuted() {
    return isBgmMuted && isSfxMuted;
}

export function updateSoundButtonUI() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('btn-toggle-sound');
    if (!btn) return;

    const isAllMuted = isBgmMuted && isSfxMuted;
    if (isAllMuted) {
        btn.classList.add('muted');
        btn.title = 'Nyalakan Suara';
        btn.setAttribute('aria-label', 'Nyalakan Suara');
        btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    } else {
        btn.classList.remove('muted');
        btn.title = 'Bisukan Suara';
        btn.setAttribute('aria-label', 'Bisukan Suara');
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    }
}
