(function() {
'use strict';

// ==========================================
// FILE: js/core/state.js
// ==========================================
// ==========================================
// core/state.js — Pusat State Aplikasi
// ==========================================

/**
 * Satu objek terpusat untuk semua state gameplay.
 * Diimpor oleh modul lain yang perlu membaca/menulis state.
 */
const state = {
    // --- Auth ---
    /** @type {Array} */ users: JSON.parse(localStorage.getItem('algebraMart_users')) || [],
    /** @type {Object|null} */ currentUser: null,

    // --- Chart ---
    /** @type {Object|null} */ chartInstance: null,

    // --- Mode Kembalian ---
    kembalianModeActive: false,
    targetKembalian: 0,
    /** @type {number[]} */ arrayUangKembalian: [],

    // --- Kuis ---
    currentQuizCorrect: 0,
    currentQuizIndex: 0,

    // --- Gameplay Kasir ---
    /** @type {HTMLElement|null} */ activeInput: null,
    tagihanTervalidasi: 0,
    currentLevelParams: { order: {}, errorCount: 0, startTime: 0, totalCost: 0 },
    /** @type {Object} */ uangDibayarDetail: {},
    /** @type {string[]} */ selectedProducts: [],

    // --- Level & Pelanggan ---
    currentLevelTab: 'easy', // 'easy' (1-10) atau 'hard' (11-20)
    currentLevelIdx: 1,
    activePlayingLevel: null,
    currentCustomerIdx: 0,
    /** @type {Array} */ levelCustomers: [],
    levelAccumulation: { revenue: 0, cost: 0, profit: 0, errors: 0 },

    // --- Tutorial ---
    isTutorialActive: false,
    currentTutorialStep: 0,

    // --- Sinkronisasi Kelas & Dasbor Fasilitator (Hybrid Offline + Realtime) ---
    /** @type {string|null} */ activeRoomCode: localStorage.getItem('algebraMart_roomCode') || null,
    /** @type {string|null} */ hostedRoomCode: localStorage.getItem('algebraMart_hostedRoom') || null,
    /** @type {Object} */ onlineStudents: {},
    /** @type {string|null} */ fasilSortField: null,
    /** @type {'asc'|'desc'} */ fasilSortOrder: 'asc',

    // --- Papan Kehormatan / Leaderboard ---
    /** @type {'accuracy'|'quiz'} */ leaderboardSortBy: 'accuracy',
};



// ==========================================
// FILE: js/core/audio.js
// ==========================================
// ==========================================
// core/audio.js — Sistem Audio Modular (BGM & SFX)
// ==========================================

const BGM_SRC = 'assets/sound/bgm.mp3';

const SFX_MAP = {
    numpad:               'assets/sound/select_004.ogg',       // Klik tombol angka numpad (0-9)
    product:              'assets/sound/confirmation_004.ogg', // Klik barang/produk di rak (addVariable)
    calc_checkout:        'assets/sound/select_005.ogg',       // Tombol "=" & Konfirmasi checkout
    money_cash:           'assets/sound/confirmation_003.ogg', // Klik uang dompet & laci kembalian
    clear_back:           'assets/sound/question_002.ogg',     // Tombol Clear (C), Backspace, & tarik kembalian
    success_quiz_change:  'assets/sound/select_001.ogg',       // Kuis benar & kembalian pas
    error:                'assets/sound/confirmation_001.ogg', // Rumus salah, kembalian salah, & kuis salah
    badge_reward:         'assets/sound/confirmation_002.ogg', // Notifikasi lencana & reward bintang
    nav:                  'assets/sound/select_006.ogg',       // Navigasi UI umum
    star_pop:             'assets/sound/confirmation_002.ogg', // Pop bintang kemenangan
    tally_tick:           'assets/sound/select_004.ogg',       // Tick counter angka skor
    victory:              'assets/sound/select_001.ogg'        // Fanfar penyelesaian level
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
function initAudio() {
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

const lastSfxTime = {};

/**
 * Memulai pemutaran musik latar belakang (BGM).
 */
function playBGM() {
    if (!isInitialized) initAudio();
    bgmStarted = true;

    if (isBgmMuted || !bgmAudio) return;
    if (!bgmAudio.paused) return; // Jika BGM sudah berjalan, jangan trigger ulang agar tidak terjadi tumpang tindih

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
function pauseBGM() {
    if (bgmAudio) {
        bgmAudio.pause();
    }
}

/**
 * Menghentikan musik latar belakang dan mengembalikan durasi ke awal.
 */
function stopBGM() {
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
function playSFX(sfxKey) {
    if (isSfxMuted) return;

    // Cegah trigger ganda instan (debouncing 80ms)
    const now = Date.now();
    if (lastSfxTime[sfxKey] && now - lastSfxTime[sfxKey] < 80) return;
    lastSfxTime[sfxKey] = now;

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
function setBGMVolume(val) {
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
function setSFXVolume(val) {
    sfxVolume = Math.min(Math.max(Number(val) || 0, 0), 1);
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('algebraMart_sfxVolume', sfxVolume.toString()); } catch (e) {}
    }
}

/**
 * Mengaktifkan atau menonaktifkan mute BGM.
 * @returns {boolean} Status isBgmMuted terbaru
 */
function toggleBGMMute() {
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
function toggleSFXMute() {
    if (!isInitialized) initAudio();

    isSfxMuted = !isSfxMuted;
    if (isSfxMuted) {
        stopNarrator();
    }
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('algebraMart_sfxMuted', isSfxMuted ? 'true' : 'false'); } catch (e) {}
    }

    updateSoundButtonUI();
    return isSfxMuted;
}

/**
 * Mengambil volume BGM saat ini (0.0 - 1.0).
 */
function getBGMVolume() {
    return bgmVolume;
}

/**
 * Mengambil volume SFX saat ini (0.0 - 1.0).
 */
function getSFXVolume() {
    return sfxVolume;
}

/**
 * Mengembalikan status apakah BGM dibisukan.
 */
function isBgmMutedStatus() {
    return isBgmMuted;
}

/**
 * Mengembalikan status apakah SFX dibisukan.
 */
function isSfxMutedStatus() {
    return isSfxMuted;
}

// ==========================================
// FUNGSI KOMPATIBILITAS MUNDUR
// ==========================================

function toggleMute() {
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

function isAudioMuted() {
    return isBgmMuted && isSfxMuted;
}

function updateSoundButtonUI() {
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

// ==========================================
// WEB SPEECH API — SUARA NARATOR INTERAKTIF
// ==========================================

let activeUtterance = null;
let cachedIndonesianVoice = null;

function resolveIndonesianVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (cachedIndonesianVoice) return cachedIndonesianVoice;
    try {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;
        // Prioritaskan suara asli id-ID, lalu fallback ke yang memuat 'id' atau 'indonesia'
        const match = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID') ||
                      voices.find(v => v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase().includes('indonesia'));
        if (match) cachedIndonesianVoice = match;
        return match;
    } catch (e) {
        return null;
    }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        cachedIndonesianVoice = null;
        resolveIndonesianVoice();
    };
}

/**
 * Membacakan teks narator otomatis menggunakan Web Speech API (bahasa Indonesia).
 * Digunakan untuk walkthrough tutorial dan modul pengantar Level 0.
 * @param {string} text
 */
function speakNarrator(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSfxMuted) return;

    try {
        window.speechSynthesis.cancel();

        // Hapus tag HTML dan rapikan teks
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'id-ID';
        utterance.rate = 0.95; // Kecepatan artikulasi ramah siswa
        utterance.pitch = 1.05;
        utterance.volume = Math.max(0.1, sfxVolume);

        const voice = resolveIndonesianVoice();
        if (voice) {
            utterance.voice = voice;
        }

        activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    } catch (err) {
        console.warn('[Audio] Gagal membacakan teks narator:', err);
    }
}

/**
 * Menghentikan pembacaan narator suara seketika.
 */
function stopNarrator() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}
    }
    activeUtterance = null;
}


// ==========================================
// FILE: js/data/items.js
// ==========================================
// ==========================================
// data/items.js — Database Barang & Lencana
// ==========================================

/** @type {Object.<string, {name: string, price: number, cost: number, img: string}>} */
const ITEM_DB = {
    'a': { name: 'Apel',         price: 2000,  cost: 1000,  img: 'assets/barangbelanja/apel.png' },
    'b': { name: 'Beras',        price: 15000, cost: 12000, img: 'assets/barangbelanja/beras.png' },
    'c': { name: 'Buku',         price: 5000,  cost: 3000,  img: 'assets/barangbelanja/buku.png' },
    'd': { name: 'Dodol Nanas',  price: 3000,  cost: 1500,  img: 'assets/barangbelanja/dodolnanas.png' },
    'e': { name: 'Gandus',       price: 1500,  cost: 800,   img: 'assets/barangbelanja/gandus.png' },
    'f': { name: 'Gula',         price: 12000, cost: 10000, img: 'assets/barangbelanja/gula.png' },
    'g': { name: 'Jeruk',        price: 2500,  cost: 1500,  img: 'assets/barangbelanja/jeruk.png' },
    'h': { name: 'Kopi AAA',     price: 4000,  cost: 2500,  img: 'assets/barangbelanja/kopiaaa.png' },
    'i': { name: 'Minyak Goreng',price: 14000, cost: 12000, img: 'assets/barangbelanja/minyakgoreng.png' },
    'j': { name: 'Padamaran',    price: 2000,  cost: 1000,  img: 'assets/barangbelanja/padamaran.png' },
    'k': { name: 'Pena',         price: 3000,  cost: 1500,  img: 'assets/barangbelanja/pena.png' },
    'l': { name: 'Roti',         price: 6000,  cost: 4000,  img: 'assets/barangbelanja/roti.png' },
    'm': { name: 'Sabun',        price: 4000,  cost: 2500,  img: 'assets/barangbelanja/sabun.png' },
    'n': { name: 'Telur',        price: 2000,  cost: 1200,  img: 'assets/barangbelanja/telur.png' },
    'o': { name: 'Tempoyak',     price: 15000, cost: 10000, img: 'assets/barangbelanja/tempoyak.png' },
    'p': { name: 'Tepung',       price: 8000,  cost: 6000,  img: 'assets/barangbelanja/tepung.png' },
    'q': { name: 'Terong',       price: 3000,  cost: 1500,  img: 'assets/barangbelanja/terong.png' }
};

/** 
 * @type {Array<{id: string, name: string, icon: string, tier: number, badgeImg: string, colorClass: string, category: string, desc: string}>} 
 */
const BADGES_DB = [
    // --- Kategori Akurasi & Matematika ---
    { id: 'si_teliti',          name: 'Si Teliti',          icon: 'fa-crosshairs',           tier: 1, badgeImg: 'assets/badges/badge-tier-1.svg', colorClass: 'icon-blue',    category: 'Akurasi & Matematika', desc: 'Menyelesaikan satu level tanpa pernah salah mengetik rumus aljabar.' },
    { id: 'master_variabel',    name: 'Master Variabel',    icon: 'fa-cubes',                tier: 2, badgeImg: 'assets/badges/badge-tier-2.svg', colorClass: 'icon-indigo',  category: 'Akurasi & Matematika', desc: 'Berhasil menuntaskan level yang memuat 3 variabel berbeda.' },
    { id: 'ahli_komutatif',     name: 'Ahli Komutatif',     icon: 'fa-right-left',           tier: 2, badgeImg: 'assets/badges/badge-tier-2.svg', colorClass: 'icon-cyan',    category: 'Akurasi & Matematika', desc: 'Membuktikan sifat komutatif pesanan tanpa kesalahan pada Level 2 atau Level 8.' },
    { id: 'pembedah_suku',      name: 'Pembedah Suku',      icon: 'fa-scissors',             tier: 3, badgeImg: 'assets/badges/badge-tier-3.svg', colorClass: 'icon-purple',  category: 'Akurasi & Matematika', desc: 'Berhasil menyederhanakan ekspresi gabungan suku sejenis pada Level 3/6.' },
    { id: 'penakluk_nol',       name: 'Penakluk Nol',       icon: 'fa-circle-notch',         tier: 3, badgeImg: 'assets/badges/badge-tier-3.svg', colorClass: 'icon-teal',    category: 'Akurasi & Matematika', desc: 'Memahami makna koefisien nol dan melewati pesanan kosong pada Level 9.' },
    { id: 'jenius_aljabar',     name: 'Jenius Aljabar',     icon: 'fa-brain',                tier: 4, badgeImg: 'assets/badges/badge-tier-4.svg', colorClass: 'icon-amber',   category: 'Akurasi & Matematika', desc: 'Meraih akurasi rata-rata rumus aljabar 100% minimal setelah 5 level.' },
    { id: 'bintang_tiga',       name: 'Bintang Tiga',       icon: 'fa-star',                 tier: 4, badgeImg: 'assets/badges/badge-tier-4.svg', colorClass: 'icon-yellow',  category: 'Akurasi & Matematika', desc: 'Mengumpulkan bintang 3 sempurna pada 5 level berbeda.' },
    { id: 'kolektor_sempurna',  name: 'Kolektor Sempurna',  icon: 'fa-crown',                tier: 5, badgeImg: 'assets/badges/badge-tier-5.svg', colorClass: 'icon-gold',    category: 'Akurasi & Matematika', desc: 'Menyelesaikan Level 10 dengan 0 kesalahan.' },

    // --- Kategori Finansial & Kasir ---
    { id: 'si_jujur',           name: 'Si Jujur',           icon: 'fa-hand-holding-heart',   tier: 1, badgeImg: 'assets/badges/badge-tier-1.svg', colorClass: 'icon-emerald', category: 'Finansial & Kasir',   desc: 'Memberikan kembalian uang fisik dari laci kasir dengan tepat tanpa salah ambil.' },
    { id: 'saudagar_cilik',     name: 'Saudagar Cilik',     icon: 'fa-coins',                tier: 2, badgeImg: 'assets/badges/badge-tier-2.svg', colorClass: 'icon-green',   category: 'Finansial & Kasir',   desc: 'Mengumpulkan total laba bersih di atas Rp 50.000.' },
    { id: 'juragan_pasar',      name: 'Juragan Pasar',      icon: 'fa-shop',                 tier: 3, badgeImg: 'assets/badges/badge-tier-3.svg', colorClass: 'icon-blue',    category: 'Finansial & Kasir',   desc: 'Mengumpulkan total laba bersih di atas Rp 150.000.' },
    { id: 'sultan_aljabar',     name: 'Sultan Aljabar',     icon: 'fa-gem',                  tier: 5, badgeImg: 'assets/badges/badge-tier-5.svg', colorClass: 'icon-purple',  category: 'Finansial & Kasir',   desc: 'Mengumpulkan total laba bersih di atas Rp 300.000.' },
    { id: 'uang_pas',           name: 'Uang Pas',           icon: 'fa-money-bill-1-wave',    tier: 1, badgeImg: 'assets/badges/badge-tier-1.svg', colorClass: 'icon-lime',    category: 'Finansial & Kasir',   desc: 'Berhasil melayani transaksi pesanan uang pas (tanpa kembalian).' },
    { id: 'laci_kilat',         name: 'Laci Kilat',         icon: 'fa-bolt-lightning',       tier: 3, badgeImg: 'assets/badges/badge-tier-3.svg', colorClass: 'icon-orange',  category: 'Finansial & Kasir',   desc: 'Menyiapkan uang kembalian pecahan dalam waktu kurang dari 15 detik.' },

    // --- Kategori Karakter & Dimensi Hati ---
    { id: 'dermawan_muda',      name: 'Dermawan Muda',      icon: 'fa-seedling',             tier: 2, badgeImg: 'assets/badges/badge-tier-2.svg', colorClass: 'icon-emerald', category: 'Karakter & Dimensi Hati', desc: 'Menyisihkan laba toko untuk total sumbangan sosial minimal Rp 5.000.' },
    { id: 'pahlawan_desa',      name: 'Pahlawan Desa',      icon: 'fa-handshake-angle',      tier: 4, badgeImg: 'assets/badges/badge-tier-4.svg', colorClass: 'icon-pink',    category: 'Karakter & Dimensi Hati', desc: 'Akumulasi sumbangan sosial mencapai lebih dari Rp 20.000.' },
    { id: 'reputasi_emas',      name: 'Reputasi Emas',      icon: 'fa-award',                tier: 5, badgeImg: 'assets/badges/badge-tier-5.svg', colorClass: 'icon-gold',    category: 'Karakter & Dimensi Hati', desc: 'Meraih status reputasi toko "Pedagang Dermawan".' },

    // --- Kategori Evaluasi & Persistensi ---
    { id: 'skor_kuis_sempurna', name: 'Kuis Sempurna',      icon: 'fa-circle-check',         tier: 2, badgeImg: 'assets/badges/badge-tier-2.svg', colorClass: 'icon-teal',    category: 'Evaluasi & Persistensi', desc: 'Menjawab seluruh soal kuis evaluasi level dengan benar (100%).' },
    { id: 'pantang_menyerah',   name: 'Pantang Menyerah',   icon: 'fa-shield-halved',        tier: 1, badgeImg: 'assets/badges/badge-tier-1.svg', colorClass: 'icon-red',     category: 'Evaluasi & Persistensi', desc: 'Berhasil menyelesaikan level meski sempat melakukan kesalahan input >= 3 kali.' },
    { id: 'penakluk_tantangan', name: 'Penakluk Tantangan', icon: 'fa-trophy',               tier: 4, badgeImg: 'assets/badges/badge-tier-4.svg', colorClass: 'icon-amber',   category: 'Evaluasi & Persistensi', desc: 'Membuka dan menyelesaikan level pada mode Tantangan Sulit.' }
];



// ==========================================
// FILE: js/data/levels.js
// ==========================================
// ==========================================
// data/levels.js — Data Kurikulum & Level Scaffolding Algebra-Mart
// ==========================================

/**
 * Konfigurasi 10 Level Tantangan Mudah (C1–C3)
 * @type {Object.<number, Array<{order: Object, text: string, image: string, uangDibayarDetail: Object}>>}
 */
const LEVEL_DATA = {
    // ----------------------------------------------------
    // FASE 1: VARIABEL MURNI (1 JENIS BARANG PER TRANSAKSI)
    // ----------------------------------------------------
    1: [ // Fase 1: Konsep Variabel Tunggal & Koefisien
        { 
            order: { 'j': 4 }, 
            text: "Harga satu wadah kue padamaran adalah j rupiah. Tolong bungkuskan 4 wadah kue padamaran ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'd': 5 }, 
            text: "Harga satu batang dodol nanas adalah d rupiah. Saya ingin membeli 5 batang dodol nanas untuk camilan keluarga.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'c': 6 }, 
            text: "Harga satu buah buku tulis adalah c rupiah. Tolong siapkan 6 buah buku tulis untuk catatan belajar saya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    2: [ // Fase 1: Penjumlahan Suku Sejenis
        { 
            order: { 'd': 7 }, 
            text: "Harga satu batang dodol nanas adalah d rupiah. Tolong siapkan 3 batang dodol nanas seharga d rupiah. Eh, tambahkan 4 batang dodol nanas lagi untuk oleh-oleh.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'e': 5 }, 
            text: "Harga satu piring kue gandus adalah e rupiah. Saya pesan 2 kue gandus seharga e rupiah, lalu tolong tambahkan 3 kue gandus lagi ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 10000: 1 } 
        },
        { 
            order: { 'c': 6 }, 
            text: "Harga satu buah buku tulis adalah c rupiah. Saya beli 4 buku tulis seharga c rupiah, lalu adik saya minta ditambah 2 buku tulis lagi.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    3: [ // Fase 1: Pengurangan Suku Sejenis (Pembatalan Pesanan)
        { 
            order: { 'j': 3 }, 
            text: "Harga satu wadah kue padamaran adalah j rupiah. Awalnya saya mau beli 5 wadah kue padamaran seharga j rupiah. Tapi maaf, batalkan 2 wadah kue padamaran ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 10000: 1 } 
        },
        { 
            order: { 'd': 4 }, 
            text: "Harga satu batang dodol nanas adalah d rupiah. Tolong siapkan 6 batang dodol nanas. Aduh tas belanja saya sempit, tolong batalkan 2 batang dodol nanas ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'c': 4 }, 
            text: "Harga satu buah buku tulis adalah c rupiah. Tadi saya minta ambilkan 7 buku tulis, tetapi karena uang saya pas-pasan, batalkan 3 buku tulis ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1 } 
        }
    ],

    // ----------------------------------------------------
    // FASE 2: DUA VARIABEL (GABUNGAN 2 JENIS BARANG BERBEDA)
    // ----------------------------------------------------
    4: [ // Fase 2: Pengenalan Dua Variabel Berbeda
        { 
            order: { 'b': 2, 'i': 3 }, 
            text: "Harga satu kantong beras adalah b rupiah, dan harga satu kantong minyak goreng adalah i rupiah. Tolong bungkuskan 2 kantong beras dan 3 kantong minyak goreng.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 4, 'g': 3 }, 
            text: "Harga satu buah apel adalah a rupiah, dan harga satu buah jeruk adalah g rupiah. Saya mau beli 4 buah apel dan 3 buah jeruk.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'e': 4, 'd': 2 }, 
            text: "Harga satu kue gandus adalah e rupiah, dan harga satu batang dodol nanas adalah d rupiah. Siapkan 4 kue gandus dan 2 batang dodol nanas ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1 } 
        }
    ],

    5: [ // Fase 2: Penjumlahan Suku Sejenis pada Dua Variabel
        { 
            order: { 'b': 2, 'i': 3 }, 
            text: "Harga satu kantong beras adalah b rupiah, dan harga satu kantong minyak goreng adalah i rupiah. Ambilkan 2 kantong beras dan 1 kantong minyak. Eh, tambahkan 2 kantong minyak lagi ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 5, 'b': 2 }, 
            text: "Harga satu buah apel adalah a rupiah, dan harga satu kantong beras adalah b rupiah. Saya pesan 3 apel dan 2 kantong beras, lalu tolong tambahkan 2 apel lagi.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'c': 6, 'k': 3 }, 
            text: "Harga satu buku tulis adalah c rupiah, dan harga satu pena adalah k rupiah. Saya ambil 4 buku dan 2 pena, lalu adik saya menambah 2 buku dan 1 pena lagi.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    6: [ // Fase 2: Pengurangan Suku Sejenis pada Dua Variabel
        { 
            order: { 'b': 3, 'i': 3 }, 
            text: "Harga satu kantong beras adalah b rupiah, dan harga satu kantong minyak goreng adalah i rupiah. Tadi saya minta 4 kantong beras dan 3 kantong minyak. Tapi tolong batalkan 1 kantong beras ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 5, 'g': 2 }, 
            text: "Harga satu buah apel adalah a rupiah, dan harga satu buah jeruk adalah g rupiah. Keranjang saya berisi 5 apel dan 4 jeruk. Tolong kurangi 2 buah jeruk karena terlalu berat.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'f': 2, 'i': 3 }, 
            text: "Harga satu bungkus gula adalah f rupiah, dan harga satu kantong minyak goreng adalah i rupiah. Tolong siapkan 4 bungkus gula dan 4 kantong minyak. Tapi tolong batalkan 2 gula dan batalkan 1 minyak ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1, 20000: 1 } 
        }
    ],

    7: [ // Fase 2: Penegasan Suku Tidak Sejenis (Tidak Dapat Digabung)
        { 
            order: { 'b': 3, 'i': 2 }, 
            text: "Harga satu kantong beras adalah b rupiah dan harga satu kantong minyak goreng adalah i rupiah. Saya beli 3 kantong beras dan 2 kantong minyak. Ingat kasir, beras dan minyak barang berbeda sehingga tidak bisa disatukan jadi 5bi.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 6, 'g': 4 }, 
            text: "Harga satu buah apel adalah a rupiah dan harga satu buah jeruk adalah g rupiah. Ambil 4 apel dan 5 jeruk. Lalu tambah 2 apel lagi, tapi kurangi 1 jeruk ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'e': 3, 'j': 8 }, 
            text: "Harga satu kue gandus adalah e rupiah dan harga satu kue padamaran adalah j rupiah. Saya pesan 4 gandus dan 6 padamaran. Kurangi 1 gandus dan tambah 2 padamaran.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        }
    ],

    // ----------------------------------------------------
    // FASE 3: SIFAT-SIFAT OPERASI ALJABAR
    // ----------------------------------------------------
    8: [ // Sifat Komutatif Penjumlahan Aljabar
        { 
            order: { 'a': 4, 'd': 2 }, 
            text: "Harga satu apel adalah a rupiah dan harga satu dodol adalah d rupiah. Tolong bungkuskan 4 apel dan 2 dodol. Menurut sifat komutatif, urutan penyebutan barang tidak mengubah nilai belanjaan.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'b': 2, 'c': 3 }, 
            text: "Harga satu kantong beras adalah b rupiah dan harga satu buku adalah c rupiah. Saya sebut buku dulu: 3 buku dan 2 kantong beras. Disusun terbalik pun harganya tetap sama.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'f': 4, 'i': 1 }, 
            text: "Harga satu kantong minyak goreng adalah i rupiah dan harga satu bungkus gula adalah f rupiah. Siapkan 1 kantong minyak dan 4 bungkus gula. Urutan barang mana pun yang dicatat duluan harganya tetap sama.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    9: [ // Makna Koefisien Nol (0)
        { 
            order: { 'a': 4 }, 
            text: "Harga satu buah apel adalah a rupiah dan harga satu kantong beras adalah b rupiah. Saya beli 4 apel dan 0 kantong beras. Karena barang yang bernilai nol tidak perlu dihitung, kasir cukup mencatat apelnya saja.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 10000: 1 } 
        },
        { 
            order: { 'd': 5 }, 
            text: "Harga satu batang dodol nanas adalah d rupiah dan harga satu kue gandus adalah e rupiah. Tadi mau beli gandus tapi batal. Jadi saya hanya membeli 5 batang dodol nanas saja.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'c': 4 }, 
            text: "Harga satu buku adalah c rupiah, harga apel adalah a rupiah, dan beras b rupiah. Saya hanya beli 4 buku, berasnya 0 dan apelnya 0.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1 } 
        }
    ],

    10: [ // Sintesis & Evaluasi Akhir
        { 
            order: { 'b': 5, 'i': 2 }, 
            text: "Harga satu kantong beras adalah b rupiah, kantong minyak adalah i rupiah, dan apel adalah a rupiah. Pesanan meja satu: 3 beras dan 2 minyak. Meja dua: 2 beras dan 0 apel.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1, 20000: 1 } 
        },
        { 
            order: { 'a': 8, 'd': 1 }, 
            text: "Harga satu apel adalah a rupiah dan harga satu dodol adalah d rupiah. Saya bawa 6 apel dan 2 dodol, lalu tambah 2 apel lagi, tapi batalkan 1 dodol.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'j': 5, 'e': 4, 'd': 3 }, 
            text: "Harga satu wadah kue padamaran adalah j rupiah, gandus e rupiah, dan batang dodol d rupiah. Siapkan paket kue tradisional: 5 padamaran, 4 gandus, dan 3 dodol seharga masing-masing rupiah.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ]
};

/**
 * Data 10 Level Tantangan Sulit (C4–C6) HOTS
 * @type {Object.<number, Array<{order: Object, text: string, image: string, uangDibayarDetail: Object}>>}
 */
const LEVEL_DATA_HARD = {
    // ----------------------------------------------------
    // FASE 4: SUBSTITUSI RIIL NILAI VARIABEL (HOTS C4–C5)
    // ----------------------------------------------------
    11: [ // C4 - Substitusi Riil Dua Variabel
        { 
            order: { 'b': 3, 'i': 2 }, 
            text: "Harga satu kantong beras adalah b rupiah dengan nilai b = 15.000, dan harga satu kantong minyak adalah i rupiah dengan i = 14.000. Tolong bungkuskan 3 kantong beras dan 2 kantong minyak.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'e': 6, 'd': 4 }, 
            text: "Harga satu kue gandus adalah e rupiah dengan e = 1.500, dan harga satu batang dodol adalah d rupiah dengan d = 3.000. Saya pesan 6 kue gandus dan 4 batang dodol nanas.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        },
        { 
            order: { 'f': 4, 'h': 5 }, 
            text: "Harga satu bungkus gula adalah f rupiah dengan f = 12.000, dan harga satu bungkus kopi adalah h rupiah dengan h = 4.000. Ambilkan 4 bungkus gula dan 5 bungkus kopi ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    12: [ // C4 - Revisi Keranjang Bertingkat (Substitusi Riil)
        { 
            order: { 'b': 3, 'i': 5 }, 
            text: "Harga satu kantong beras adalah b rupiah (b = 15.000), dan harga satu kantong minyak adalah i rupiah (i = 14.000). Awalnya bawa 5 beras dan 4 minyak. Tolong kembalikan 2 beras dan tambah 1 minyak ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1, 20000: 1 } 
        },
        { 
            order: { 'a': 5, 'g': 8 }, 
            text: "Harga satu apel adalah a rupiah (a = 2.000) dan satu jeruk adalah g rupiah (g = 2.500). Tadi ambil 8 apel dan 6 jeruk. Tolong batalkan 3 apel dan tambahkan 2 jeruk lagi.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'l': 5, 'm': 4 }, 
            text: "Harga satu bungkus roti adalah l rupiah (l = 6.000) dan satu batang sabun adalah m rupiah (m = 4.000). Keranjang berisi 7 roti dan 5 sabun. Karena tas berat, kurangi 2 roti dan kurangi 1 sabun ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    13: [ // C5 - Suku Campuran Tiga Variabel dengan Substitusi
        { 
            order: { 'n': 6, 'p': 1, 'f': 3 }, 
            text: "Harga satu butir telur adalah n rupiah (n = 2.000), satu kantong tepung adalah p rupiah (p = 8.000), dan satu bungkus gula adalah f rupiah (f = 12.000). Pesanan: 4 telur, 2 tepung, 3 gula. Lalu tambah 2 telur dan batalkan 1 tepung.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1, 10000: 1 } 
        },
        { 
            order: { 'q': 6, 'b': 2, 'i': 2 }, 
            text: "Harga satu buah terong adalah q rupiah (q = 3.000), kantong beras b rupiah (b = 15.000), dan kantong minyak i rupiah (i = 14.000). Beli 5 terong, 3 beras, 2 minyak. Terongnya tambah 1, berasnya batal 1 ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'c': 4, 'k': 3, 'l': 3 }, 
            text: "Harga satu buku c rupiah (c = 5.000), batang pena k rupiah (k = 3.000), dan bungkus roti l rupiah (l = 6.000). Ambil 6 buku, 4 pena, 3 roti. Teman batal titip, jadi kurangi 2 buku dan kurangi 1 pena ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    14: [ // C5 - Jebakan Informasi Tidak Relevan (Substitusi Riil)
        { 
            order: { 'g': 4, 'h': 2 }, 
            text: "Harga satu jeruk adalah g rupiah (g = 2.500) dan kopi h rupiah (h = 4.000). Saya mau beli 4 jeruk dan 2 kopi. Kemarin saya beli 3 apel seharga a rupiah, tapi hari ini tidak beli apel sama sekali.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'l': 3, 'a': 2 }, 
            text: "Harga satu bungkus roti adalah l rupiah (l = 6.000) dan satu apel adalah a rupiah (a = 2.000). Adik saya minta 5 batang sabun, tapi dibeli di toko lain. Di sini saya hanya beli 3 roti dan 2 apel saja ya kasir.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'b': 2, 'f': 4 }, 
            text: "Harga satu kantong beras b rupiah (b = 15.000) dan bungkus gula f rupiah (f = 12.000). Di spanduk ada promo 10 minyak, tapi motor saya hanya muat belanja 2 kantong beras dan 4 bungkus gula saja.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    15: [ // C5 - Gabungan Pesanan Rombongan / 3 Orang
        { 
            order: { 'd': 6, 'e': 3 }, 
            text: "Harga satu batang dodol d rupiah (d = 3.000) dan gandus e rupiah (e = 1.500). Titipan belanja: Budi pesan 2 dodol dan 1 gandus; Siti pesan 3 dodol dan 2 gandus; Rian pesan 1 dodol saja.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        },
        { 
            order: { 'h': 6, 'l': 6 }, 
            text: "Harga satu bungkus kopi h rupiah (h = 4.000) dan bungkus roti l rupiah (l = 6.000). Pesanan 3 meja: Meja satu 2 kopi dan 1 roti; Meja dua 3 kopi dan 2 roti; Meja tiga 1 kopi dan 3 roti.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1, 20000: 1 } 
        },
        { 
            order: { 'i': 5, 'p': 5 }, 
            text: "Harga satu kantong minyak i rupiah (i = 14.000) dan kantong tepung p rupiah (p = 8.000). Bu Ani titip 2 minyak; Bu Tina titip 1 minyak dan 3 tepung; Bu Mega titip 2 minyak dan 2 tepung.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1, 20000: 1 } 
        }
    ],

    // ----------------------------------------------------
    // FASE 5: SIFAT DISTRIBUTIF PAKET & HAJATAN (HOTS C6)
    // ----------------------------------------------------
    16: [ // C6 - Sifat Distributif Paket Hajatan
        { 
            order: { 'a': 6, 'b': 3 }, 
            text: "Harga satu buah apel adalah a rupiah dan harga satu kantong beras adalah b rupiah. Saya membutuhkan 3 paket hajatan. Setiap paket berisi 2 apel dan 1 kantong beras.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1, 10000: 1 } 
        },
        { 
            order: { 'e': 6, 'd': 4 }, 
            text: "Harga satu piring kue gandus adalah e rupiah dan harga satu batang dodol adalah d rupiah. Tolong siapkan 2 bingkisan hajatan. Setiap bingkisan berisi 3 kue gandus dan 2 dodol.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        },
        { 
            order: { 'f': 4, 'h': 8 }, 
            text: "Harga satu bungkus gula adalah f rupiah dan harga satu kopi adalah h rupiah. Ibu memesan 4 paket arisan. Tiap paket berisi 1 gula dan 2 kopi.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    17: [ // C6 - Distributif Pecahan (Setengah Pesanan)
        { 
            order: { 'c': 6, 'k': 3 }, 
            text: "Harga satu buku tulis adalah c rupiah dan satu batang pena k rupiah. Awalnya pesan 12 buku dan 6 pena. Karena uang kurang, tolong ambil separuhnya saja.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'a': 5, 'g': 4 }, 
            text: "Harga satu apel adalah a rupiah dan satu jeruk g rupiah. Pesanan awal 10 apel dan 8 jeruk. Tolong bagi dua (50%) untuk masing-masing buah.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'm': 3, 'i': 2 }, 
            text: "Harga satu batang sabun m rupiah dan satu kantong minyak i rupiah. Kami pesan 6 sabun dan 4 minyak. Tapi layani separuh pesanan saja dulu.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    18: [ // C6 - Distributif Paket Bertingkat (Kurung Ganda)
        { 
            order: { 'g': 7, 'a': 8 }, 
            text: "Harga satu jeruk adalah g rupiah dan satu apel adalah a rupiah. Beli 2 paket berisi (3g + 2a) ditambah 1 paket berisi (1g + 4a).", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'n': 8, 'l': 7 }, 
            text: "Harga satu butir telur n rupiah dan satu bungkus roti l rupiah. Paket sarapan: 3 porsi (2n + 1l) ditambah 2 porsi (1n + 2l).", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1, 10000: 1 } 
        },
        { 
            order: { 'c': 12, 'k': 11 }, 
            text: "Harga satu buku c rupiah dan satu batang pena k rupiah. Paket kantor: 2 paket (3c + 4k) ditambah 3 paket (2c + 1k).", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    19: [ // C6 - Distributif dengan Koefisien Nol & Barang Batal
        { 
            order: { 'j': 5, 'm': 3 }, 
            text: "Harga satu wadah kue padamaran j rupiah, gandus e rupiah, dan batang sabun m rupiah. Saya pesan 5 padamaran dan 0 gandus, ditambah 3 sabun.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'q': 6, 'o': 2 }, 
            text: "Harga satu buah terong q rupiah, mangkuk tempoyak o rupiah, dan batang dodol d rupiah. Tolong siapkan 6 terong, 2 tempoyak, dan 0 dodol. Dodol nanasnya dibatalkan.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'e': 8, 'j': 6 }, 
            text: "Harga satu gandus e rupiah, wadah kue padamaran j rupiah, dan bungkus roti l rupiah. Mau borong 8 gandus dan 6 padamaran. Rotinya batal semua jadi 0 roti.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    20: [ // C6 - Ujian Akhir Sindikat Kelontong HOTS (Distributif Akbar)
        { 
            order: { 'o': 6, 'b': 7, 'n': 5, 'i': 3, 'j': 2 }, 
            text: "Harga mangkuk tempoyak o rupiah, kantong beras b rupiah, butir telur n rupiah, kantong minyak i rupiah, dan wadah kue padamaran j rupiah. Borongan hajatan: 2 paket (3o + 4b), ditambah 5n + 3i + 2j, lalu batalkan 1 kantong beras.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 3 } 
        },
        { 
            order: { 'f': 8, 'q': 9, 'i': 4, 'a': 8 }, 
            text: "Harga bungkus gula f rupiah, buah terong q rupiah, kantong minyak i rupiah, dan buah apel a rupiah. Koperasi pesan 3 paket (2f + 3q) ditambah 2 paket (1f + 2i + 4a).", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 100000: 2 } 
        },
        { 
            order: { 'b': 8, 'f': 7, 'd': 8, 'e': 6, 'm': 5 }, 
            text: "Harga kantong beras b rupiah, bungkus gula f rupiah, batang dodol d rupiah, kue gandus e rupiah, dan batang sabun m rupiah. Awalnya bawa 10 kantong beras, 10 bungkus gula, 8 batang dodol, 6 kue gandus, dan 5 batang sabun. Karena dipindah ke pos lain, kurangi 2 beras dan 3 gula.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 3 } 
        }
    ]
};

// Gabungkan LEVEL_DATA_HARD ke dalam LEVEL_DATA utama
Object.assign(LEVEL_DATA, LEVEL_DATA_HARD);

/** @type {Object.<number, string>} */
const LEVEL_OBJECTIVES = {
    1:  "Fase 1: Konsep Variabel Tunggal & Koefisien",
    2:  "Fase 1: Penjumlahan Suku Sejenis",
    3:  "Fase 1: Pengurangan Suku Sejenis (Pembatalan)",
    4:  "Fase 2: Pengenalan Dua Variabel Berbeda",
    5:  "Fase 2: Penjumlahan Suku Sejenis pada Dua Variabel",
    6:  "Fase 2: Pengurangan Suku Sejenis pada Dua Variabel",
    7:  "Fase 2: Penegasan Suku Tidak Sejenis",
    8:  "Sifat Operasi: Sifat Komutatif Penjumlahan Aljabar",
    9:  "Sifat Operasi: Makna Koefisien Nol (0)",
    10: "Sifat Operasi: Sintesis & Evaluasi Akhir",
    11: "Substitusi Riil Dua Variabel",
    12: "Revisi Keranjang Bertingkat",
    13: "Suku Campuran Tiga Variabel",
    14: "Jebakan Informasi Tidak Relevan",
    15: "Gabungan Pesanan Rombongan",
    16: "Sifat Distributif Paket",
    17: "Distributif Pecahan (Setengah Pesanan)",
    18: "Distributif Paket Bertingkat",
    19: "Distributif dengan Koefisien Nol",
    20: "Ujian Akhir Sindikat Kelontong"
};


// ==========================================
// FILE: js/data/quiz.js
// ==========================================
// ==========================================
// data/quiz.js — Database Soal Kuis per Level
// ==========================================

/** @type {Object.<number, Array<{q: string, options: string[], ans: number}>>} */
const QUIZ_DB = {
    // ----------------------------------------------------
    // FASE 1: VARIABEL MURNI & SUKU SEJENIS (LEVEL 1 - 3)
    // ----------------------------------------------------
    1: [ // Fase 1: Konsep Variabel Tunggal & Koefisien
        { 
            q: "Pada transaksi 3a + 2b, apa makna dari huruf a?", 
            options: [
                "A. Harga satu satuan barang yang belum diketahui nilainya",
                "B. Nama fisik buah apel",
                "C. Jumlah buah apel yang dibeli",
                "D. Merek apel"
            ], 
            ans: 0 
        },
        { 
            q: "Jika harga satu wadah kue padamaran adalah j rupiah, maka bentuk aljabar untuk pembelian 4 wadah kue padamaran adalah...", 
            options: [
                "A. j + 4",
                "B. 4j",
                "C. j^4",
                "D. 4 - j"
            ], 
            ans: 1 
        }
    ],

    2: [ // Fase 1: Penjumlahan Suku Sejenis
        { 
            q: "Pelanggan memesan 3 kue seharga a rupiah (3a) lalu menambah 4 kue lagi (4a). Bentuk aljabar yang tepat adalah...", 
            options: [
                "A. 3a + 4a = 7a",
                "B. 3a + 4a = 7a^2",
                "C. 3a + 4a = 12a",
                "D. 3a + 4a = 7"
            ], 
            ans: 0 
        },
        { 
            q: "Hasil penjumlahan suku sejenis dari 2e + 3e untuk kue gandus seharga e rupiah adalah...", 
            options: [
                "A. 6e",
                "B. 5e",
                "C. 5e^2",
                "D. 5"
            ], 
            ans: 1 
        }
    ],

    3: [ // Fase 1: Pengurangan Suku Sejenis (Pembatalan Pesanan)
        { 
            q: "Bentuk sederhana dari 5x + 2y - 2y adalah...", 
            options: [
                "A. 5x (karena 2y - 2y = 0)",
                "B. 5x + 4y",
                "C. 7xy",
                "D. 5x - 4y"
            ], 
            ans: 0 
        },
        { 
            q: "Pelanggan memesan 5 wadah kue padamaran (5j) tetapi membatalkan 2 wadah (-2j). Bentuk aljabar penyederhanaannya adalah...", 
            options: [
                "A. 5j - 2j = 7j",
                "B. 5j - 2j = 3j",
                "C. 5j - 2j = 3",
                "D. 5j - 2j = 10j"
            ], 
            ans: 1 
        }
    ],

    // ----------------------------------------------------
    // FASE 2: DUA VARIABEL & SUKU TIDAK SEJENIS (LEVEL 4 - 7)
    // ----------------------------------------------------
    4: [ // Fase 2: Pengenalan Dua Variabel Berbeda
        { 
            q: "Harga 1 kantong beras adalah b rupiah dan harga 1 kantong minyak adalah i rupiah. Bentuk aljabar untuk 2 kantong beras dan 3 kantong minyak adalah...", 
            options: [
                "A. 2b + 3i",
                "B. 5bi",
                "C. 6bi",
                "D. 2b - 3i"
            ], 
            ans: 0 
        },
        { 
            q: "Mengapa suku 2b (beras) dan 3i (minyak) TIDAK DAPAT digabung menjadi 5bi?", 
            options: [
                "A. Karena harga minyak selalu lebih mahal dari beras",
                "B. Karena keduanya bukan suku sejenis (variabelnya menyatakan harga barang berbeda)",
                "C. Karena angka 2 dan 3 tidak boleh dijumlahkan",
                "D. Bisa digabung jika pembeli membayar dengan uang pas"
            ], 
            ans: 1 
        }
    ],

    5: [ // Fase 2: Penjumlahan Suku Sejenis pada Dua Variabel
        { 
            q: "Bentuk paling sederhana dari ekspresi transaksi 2b + 1i + 2i adalah...", 
            options: [
                "A. 2b + 3i",
                "B. 5bi",
                "C. 4b + 1i",
                "D. 3b + 2i"
            ], 
            ans: 0 
        },
        { 
            q: "Pelanggan memesan 3 apel (3a) dan 2 kantong beras (2b), lalu menambah 2 apel lagi (2a). Bentuk sederhananya adalah...", 
            options: [
                "A. 7ab",
                "B. 5a + 2b",
                "C. 3a + 4b",
                "D. 5ab"
            ], 
            ans: 1 
        }
    ],

    6: [ // Fase 2: Pengurangan Suku Sejenis pada Dua Variabel
        { 
            q: "Bentuk sederhana dari ekspresi belanja (4b - 1b) + 3i adalah...", 
            options: [
                "A. 3b + 3i",
                "B. 6bi",
                "C. 5b + 3i",
                "D. 3b - 3i"
            ], 
            ans: 0 
        },
        { 
            q: "Hasil penyederhanaan dari pesanan 5a + 4g - 2g adalah...", 
            options: [
                "A. 7ag",
                "B. 3a + 2g",
                "C. 5a + 2g",
                "D. 9ag"
            ], 
            ans: 2 
        }
    ],

    7: [ // Fase 2: Penegasan Suku Tidak Sejenis
        { 
            q: "Di antara pilihan berikut, manakah pasangan suku yang TERGOLONG suku sejenis?", 
            options: [
                "A. 4a dan 2d",
                "B. 5b dan 3b",
                "C. 3i dan 3f",
                "D. 2c dan 5j"
            ], 
            ans: 1 
        },
        { 
            q: "Bentuk sederhana dari ekspresi belanja (4a + 2a) + (5g - 1g) adalah...", 
            options: [
                "A. 6a + 4g",
                "B. 10ag",
                "C. 2a + 4g",
                "D. 6a - 4g"
            ], 
            ans: 0 
        }
    ],

    // ----------------------------------------------------
    // SIFAT OPERASI ALJABAR (LEVEL 8 - 10)
    // ----------------------------------------------------
    8: [ // Sifat Komutatif Penjumlahan Aljabar
        { 
            q: "Apakah ekspresi 4a + 2d menghasilkan total tagihan yang SAMA dengan 2d + 4a?", 
            options: [
                "A. Ya, karena penjumlahan aljabar memenuhi sifat komutatif (pertukaran)",
                "B. Tidak, karena urutan penulisan barang berbeda",
                "C. Hanya sama jika harga a sama dengan d",
                "D. Tidak, karena kasir menghitung dari kiri ke kanan"
            ], 
            ans: 0 
        },
        { 
            q: "Sifat matematika yang menyatakan bahwa 3c + 2b = 2b + 3c disebut...", 
            options: [
                "A. Sifat Distributif",
                "B. Sifat Komutatif",
                "C. Sifat Asosiatif",
                "D. Sifat Identitas"
            ], 
            ans: 1 
        }
    ],

    9: [ // Makna Koefisien Nol (0)
        { 
            q: "Pelanggan memesan 4 apel seharga a rupiah dan 0 kantong beras (4a + 0b). Bentuk aljabar paling sederhana yang dicatat kasir adalah...", 
            options: [
                "A. 4ab",
                "B. 4a + 0b",
                "C. 4a",
                "D. 0"
            ], 
            ans: 2 
        },
        { 
            q: "Apa arti matematis dari koefisien 0 pada suku 0e (di mana e adalah harga satuan kue gandus)?", 
            options: [
                "A. Kue gandus diberikan secara gratis",
                "B. Nilai total suku tersebut adalah 0 rupiah karena tidak ada barang yang dibeli (0 × e = 0)",
                "C. Harga kue gandus adalah Rp 0",
                "D. Kue gandus rusak dan diganti"
            ], 
            ans: 1 
        }
    ],

    10: [ // Sintesis & Evaluasi Akhir
        { 
            q: "Sederhanakan ekspresi belanja berikut: (3b + 2b) + 2i + 0a...", 
            options: [
                "A. 5b + 2i",
                "B. 7bi",
                "C. 5b + 2i + a",
                "D. 7bia"
            ], 
            ans: 0 
        },
        { 
            q: "Bentuk paling sederhana dari gabungan transaksi 6a + 2a + 2d - 1d adalah...", 
            options: [
                "A. 9ad",
                "B. 8a + d",
                "C. 8a + 3d",
                "D. 4a + d"
            ], 
            ans: 1 
        }
    ],

    // ----------------------------------------------------
    // TANTANGAN SULIT (HOTS C4 - C6) (LEVEL 11 - 20)
    // ----------------------------------------------------
    11: [ // C4 - Substitusi Riil Dua Variabel
        { 
            q: "Jika harga satuan beras b = Rp 15.000 dan harga satuan minyak i = Rp 14.000, berapakah tagihan untuk 3b + 2i?", 
            options: [
                "A. Rp 73.000",
                "B. Rp 70.000",
                "C. Rp 65.000",
                "D. Rp 87.000"
            ], 
            ans: 0 
        },
        { 
            q: "Jika harga satuan gandus e = Rp 1.500 dan harga satuan dodol d = Rp 3.000, berapakah nilai tagihan untuk 6e + 4d?", 
            options: [
                "A. Rp 25.000",
                "B. Rp 21.000",
                "C. Rp 18.000",
                "D. Rp 27.000"
            ], 
            ans: 1 
        }
    ],

    12: [ // C4 - Revisi Keranjang Bertingkat
        { 
            q: "Pelanggan membawa belanjaan awal (5b + 4i), lalu mengembalikan 2 kantong beras (-2b) dan menambah 1 kantong minyak (+i). Bentuk aljabar akhirnya adalah...", 
            options: [
                "A. 7b + 5i",
                "B. 3b + 3i",
                "C. 3b + 5i",
                "D. 3b + 4i"
            ], 
            ans: 2 
        },
        { 
            q: "Sederhanakan suku-suku sejenis pada ekspresi belanja bertingkat: 8a + 6g - 3a + 2g...", 
            options: [
                "A. 5a + 8g",
                "B. 11a + 8g",
                "C. 5a + 4g",
                "D. 13ag"
            ], 
            ans: 0 
        }
    ],

    13: [ // C5 - Suku Campuran Tiga Variabel
        { 
            q: "Bentuk sederhana dari ekspresi belanja tiga jenis barang: (4n + 2p + 3f) + 2n - 1p adalah...", 
            options: [
                "A. 6n + p + 3f",
                "B. 6n + 3p + 3f",
                "C. 2n + p + 3f",
                "D. 8npf"
            ], 
            ans: 0 
        },
        { 
            q: "Pada pesanan 5q + 3b + 2i + q - b, koefisien untuk variabel b dan q setelah disederhanakan berturut-turut adalah...", 
            options: [
                "A. 2 dan 5",
                "B. 2 dan 6",
                "C. 4 dan 6",
                "D. 3 dan 5"
            ], 
            ans: 1 
        }
    ],

    14: [ // C5 - Jebakan Informasi Tidak Relevan
        { 
            q: "Pelanggan berkata: 'Kemarin saya beli 3 apel, uang saya Rp 100.000, tapi hari ini saya HANYA membeli 4 jeruk (g) dan 2 kopi (h)'. Bentuk aljabar transaksi hari ini adalah...", 
            options: [
                "A. 3a + 4g + 2h",
                "B. 100g + 2h",
                "C. 4g + 2h",
                "D. 4g + 2h - 3a"
            ], 
            ans: 2 
        },
        { 
            q: "Mengapa informasi 'kemarin beli 3 apel' dan 'uang Rp 100.000' TIDAK dimasukkan ke dalam rumus kasir?", 
            options: [
                "A. Karena bukan bagian dari barang yang ditransaksikan saat ini (informasi distraktor)",
                "B. Karena harga apel terlalu murah",
                "C. Karena uang Rp 100.000 terlalu banyak",
                "D. Karena kasir lupa mencatat"
            ], 
            ans: 0 
        }
    ],

    15: [ // C5 - Gabungan Pesanan Rombongan
        { 
            q: "Budi memesan (2d + e), Siti memesan (3d + 2e), dan Rian memesan 1d. Berapakah jumlah total aljabar pesanan ketiga orang tersebut?", 
            options: [
                "A. 5d + 3e",
                "B. 6d + 3e",
                "C. 6d + 2e",
                "D. 9de"
            ], 
            ans: 1 
        },
        { 
            q: "Gabungan pesanan 3 meja kafe: (2h + l) + (3h + 2l) + (h + 3l). Setelah suku sejenis digabungkan, hasilnya adalah...", 
            options: [
                "A. 6h + 6l",
                "B. 5h + 5l",
                "C. 6h + 5l",
                "D. 12hl"
            ], 
            ans: 0 
        }
    ],

    16: [ // C6 - Sifat Distributif Paket
        { 
            q: "Pelanggan membeli 3 paket hajatan, di mana tiap paket berisi 2 apel dan 1 kantong beras (2a + b). Bentuk distributif 3(2a + b) adalah...", 
            options: [
                "A. 5a + 3b",
                "B. 6a + 3b",
                "C. 6a + b",
                "D. 2a + 3b"
            ], 
            ans: 1 
        },
        { 
            q: "Jika bentuk aljabar 4(f + 2h) dijabarkan menggunakan sifat distributif perkalian, hasilnya adalah...", 
            options: [
                "A. 4f + 8h",
                "B. 4f + 2h",
                "C. 5f + 6h",
                "D. 8fh"
            ], 
            ans: 0 
        }
    ],

    17: [ // C6 - Distributif Pecahan (Setengah Pesanan)
        { 
            q: "Pelanggan ingin mengambil setengah (1/2) dari pesanan awal (12c + 6k). Bentuk aljabar 1/2(12c + 6k) bernilai...", 
            options: [
                "A. 6c + 6k",
                "B. 12c + 3k",
                "C. 6c + 3k",
                "D. 24c + 12k"
            ], 
            ans: 2 
        },
        { 
            q: "Jika pesanan 10 apel (10a) dan 8 jeruk (8g) dipotong separuhnya (dikali 1/2), bentuk aljabar yang tersisa adalah...", 
            options: [
                "A. 5a + 4g",
                "B. 10a + 4g",
                "C. 5a + 8g",
                "D. 2a + 2g"
            ], 
            ans: 0 
        }
    ],

    18: [ // C6 - Distributif Paket Bertingkat (Kurung Ganda)
        { 
            q: "Selesaikan bentuk aljabar kurung ganda: 2(3g + 2a) + 1(g + 4a)...", 
            options: [
                "A. 7g + 8a",
                "B. 5g + 6a",
                "C. 7g + 6a",
                "D. 15ga"
            ], 
            ans: 0 
        },
        { 
            q: "Hasil penjabaran dan penyederhanaan dari ekspresi 3(2n + l) + 2(n + 2l) adalah...", 
            options: [
                "A. 7n + 5l",
                "B. 8n + 7l",
                "C. 6n + 4l",
                "D. 9n + 8l"
            ], 
            ans: 1 
        }
    ],

    19: [ // C6 - Distributif dengan Koefisien Nol & Barang Batal
        { 
            q: "Pelanggan membeli 2 paket (2j + 3m), tetapi pada masing-masing paket kue gandusnya batal (0e). Bentuk aljabar 2(2j + 0e + 3m) disederhanakan menjadi...", 
            options: [
                "A. 4j + 0e + 6m",
                "B. 4j + 6m",
                "C. 10jm",
                "D. 4j + 2e + 6m"
            ], 
            ans: 1 
        },
        { 
            q: "Jika dalam evaluasi distributif tertulis 3(2q + 0d) - 2q, maka hasil akhirnya adalah...", 
            options: [
                "A. 6q + 0d",
                "B. 4q",
                "C. 4qd",
                "D. 0"
            ], 
            ans: 1 
        }
    ],

    20: [ // C6 - Ujian Akhir Sindikat Kelontong
        { 
            q: "Sederhanakan ekspresi transaksi akbar berikut: 2(3o + 4b) + 5n + 3i + 2j - b...", 
            options: [
                "A. 6o + 7b + 5n + 3i + 2j",
                "B. 6o + 8b + 5n + 3i + 2j",
                "C. 5o + 7b + 5n + 3i + 2j",
                "D. 6o + 3b + 5n + 3i + 2j"
            ], 
            ans: 0 
        },
        { 
            q: "Pesanan koperasi: 3(2f + 3q) + 2(f + 2i + 4a). Bentuk aljabar gabungan setelah disederhanakan adalah...", 
            options: [
                "A. 8f + 9q + 4i + 8a",
                "B. 7f + 9q + 4i + 8a",
                "C. 8f + 6q + 4i + 8a",
                "D. 6f + 9q + 2i + 4a"
            ], 
            ans: 0 
        }
    ]
};


// ==========================================
// FILE: js/core/engine.js
// ==========================================
// ==========================================
// core/engine.js — Logika Murni (tanpa DOM)
// ==========================================



/**
 * Menyimpan data users ke localStorage.
 */
function saveData() {
    localStorage.setItem('algebraMart_users', JSON.stringify(state.users));
}

/**
 * Mendapatkan gelar pemain berdasarkan laba dan sumbangan sosial.
 * @param {number} laba
 * @param {number} sumbangan
 * @returns {string}
 */
function getTitle(laba, sumbangan = 0) {
    if (sumbangan >= 20000) return "Pedagang Dermawan";
    if (laba > 300000)      return "Sultan Aljabar";
    if (laba > 150000)      return "Juragan Pasar";
    if (laba > 50000)       return "Pedagang Ahli";
    if (laba > 15000)       return "Kasir Junior";
    return "Kasir Magang";
}

/**
 * Memicu notifikasi UI pop-up saat lencana baru terbuka.
 * @param {Object} badge
 */
function triggerBadgeNotification(badge) {
    if (typeof window !== 'undefined' && typeof window._showBadgeNotification === 'function') {
        window._showBadgeNotification(badge);
    }
}

/**
 * Mengevaluasi pembukaan 20 lencana prestasi secara otomatis berdasarkan kriteria.
 * @param {Object} context Konteks peristiwa (transaksi, kembalian, kuis, level_complete, donasi)
 * @returns {Array} Daftar lencana yang baru saja terbuka
 */
function checkBadgeUnlocks(context = {}) {
    if (!state.currentUser) return [];

    const user = state.currentUser;
    if (!Array.isArray(user.badges)) {
        user.badges = [];
    }

    // Kompatibilitas id lama
    if (user.badges.includes('saudagar') && !user.badges.includes('saudagar_cilik')) {
        user.badges.push('saudagar_cilik');
    }

    const money = Number(user.money) || 0;
    const sumbangan = Number(user.sumbangan || user.donasi) || 0;
    const history = Array.isArray(user.history) ? user.history : [];
    const unlockedNow = [];

    const award = (badgeId) => {
        if (!user.badges.includes(badgeId)) {
            user.badges.push(badgeId);
            const badgeObj = BADGES_DB.find(b => b.id === badgeId);
            if (badgeObj) {
                unlockedNow.push(badgeObj);
            }
        }
    };

    // --- Kategori 1: Akurasi & Matematika ---
    // 1. 'si_teliti': Menyelesaikan satu level tanpa pernah salah rumus
    if ((context.type === 'level_complete' && context.errors === 0) || history.some(h => (h.errors || 0) === 0)) {
        award('si_teliti');
    }

    // 2. 'master_variabel': Berhasil menuntaskan level yang memuat 3 variabel berbeda
    const is3Vars = (context.distinctVariables && context.distinctVariables >= 3) ||
                    (context.level === 4 || context.level === 7 || context.level === 10) ||
                    history.some(h => h.level === 4 || h.level === 7 || h.level === 10);
    if (is3Vars && (context.type === 'level_complete' || history.length > 0)) {
        award('master_variabel');
    }

    // 3. 'ahli_komutatif': Membuktikan sifat komutatif pesanan tanpa kesalahan pada Level 2 atau Level 8
    const komutatifSuccess = (context.type === 'level_complete' && (context.level === 2 || context.level === 8) && context.errors === 0) ||
                             history.some(h => (h.level === 2 || h.level === 8) && (h.errors || 0) === 0);
    if (komutatifSuccess) {
        award('ahli_komutatif');
    }

    // 4. 'pembedah_suku': Berhasil menyederhanakan ekspresi gabungan suku sejenis pada Level 3/6
    const sukuSuccess = (context.type === 'level_complete' && (context.level === 3 || context.level === 6)) ||
                        history.some(h => h.level === 3 || h.level === 6);
    if (sukuSuccess) {
        award('pembedah_suku');
    }

    // 5. 'penakluk_nol': Memahami makna koefisien nol dan melewati pesanan kosong pada Level 9
    const nolSuccess = (context.type === 'level_complete' && context.level === 9) ||
                       history.some(h => h.level === 9);
    if (nolSuccess) {
        award('penakluk_nol');
    }

    // 6. 'jenius_aljabar': Meraih akurasi rata-rata rumus aljabar 100% minimal setelah 5 level
    if (history.length >= 5 && history.every(h => (h.errors || 0) === 0)) {
        award('jenius_aljabar');
    }

    // 7. 'bintang_tiga': Mengumpulkan bintang 3 sempurna pada 5 level berbeda
    const star3Count = history.filter(h => (h.errors || 0) === 0).length;
    if (star3Count >= 5) {
        award('bintang_tiga');
    }

    // 8. 'kolektor_sempurna': Menyelesaikan Level 10 dengan 0 kesalahan
    const lvl10Perfect = (context.type === 'level_complete' && context.level === 10 && context.errors === 0) ||
                         history.some(h => h.level === 10 && (h.errors || 0) === 0);
    if (lvl10Perfect) {
        award('kolektor_sempurna');
    }

    // --- Kategori 2: Finansial & Kasir ---
    // 9. 'si_jujur': Memberikan kembalian uang fisik dari laci kasir dengan tepat tanpa salah ambil
    if (context.type === 'kembalian_success' && context.kembalianAccurate !== false) {
        award('si_jujur');
    }

    // 10. 'saudagar_cilik': Mengumpulkan total laba bersih di atas Rp 50.000
    if (money > 50000) {
        award('saudagar_cilik');
    }

    // 11. 'juragan_pasar': Mengumpulkan total laba bersih di atas Rp 150.000
    if (money > 150000) {
        award('juragan_pasar');
    }

    // 12. 'sultan_aljabar': Mengumpulkan total laba bersih di atas Rp 300.000
    if (money > 300000) {
        award('sultan_aljabar');
    }

    // 13. 'uang_pas': Berhasil melayani transaksi pesanan uang pas (tanpa kembalian)
    if (context.type === 'exact_money' || (context.type === 'transaction_receipt' && context.kembalian === 0)) {
        award('uang_pas');
    }

    // 14. 'laci_kilat': Menyiapkan uang kembalian pecahan dalam waktu kurang dari 15 detik
    if (context.type === 'kembalian_success' && typeof context.duration === 'number' && context.duration < 15) {
        award('laci_kilat');
    }

    // --- Kategori 3: Karakter & Dimensi Hati ---
    // 15. 'dermawan_muda': Menyisihkan laba toko untuk total sumbangan sosial minimal Rp 5.000
    if (sumbangan >= 5000) {
        award('dermawan_muda');
    }

    // 16. 'pahlawan_desa': Akumulasi sumbangan sosial mencapai lebih dari Rp 20.000
    if (sumbangan > 20000) {
        award('pahlawan_desa');
    }

    // 17. 'reputasi_emas': Meraih status reputasi toko "Pedagang Dermawan"
    if (sumbangan >= 20000 || getTitle(money, sumbangan) === "Pedagang Dermawan") {
        award('reputasi_emas');
    }

    // --- Kategori 4: Evaluasi & Persistensi ---
    // 18. 'skor_kuis_sempurna': Menjawab seluruh soal kuis evaluasi level dengan benar (100%)
    if ((context.type === 'quiz_complete' && context.quizCorrect > 0 && context.quizCorrect === context.quizTotal) ||
        history.some(h => (h.quizTotal || 0) > 0 && h.quizCorrect === h.quizTotal)) {
        award('skor_kuis_sempurna');
    }

    // 19. 'pantang_menyerah': Berhasil menyelesaikan level meski sempat melakukan kesalahan input >= 3 kali
    if ((context.type === 'level_complete' && (context.errors || 0) >= 3) ||
        history.some(h => (h.errors || 0) >= 3)) {
        award('pantang_menyerah');
    }

    // 20. 'penakluk_tantangan': Membuka dan menyelesaikan level pada mode Tantangan Sulit
    if ((context.type === 'level_complete' && context.level === 10) ||
        history.some(h => h.level === 10)) {
        award('penakluk_tantangan');
    }

    if (unlockedNow.length > 0) {
        saveData();
        unlockedNow.forEach(b => triggerBadgeNotification(b));
    }

    return unlockedNow;
}

/**
 * Merender ekspresi matematika formal dengan KaTeX jika tersedia, atau fallback HTML.
 * Menjamin variabel aljabar (a sampai q) otomatis dirender miring (italic math-serif),
 * sedangkan angka, simbol operasi (+, -, =, ×), dan 'Rp' tetap tegak (roman).
 * @param {string} expr
 * @returns {string}
 */
function renderMathExpression(expr) {
    if (!expr) return "";

    if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
        try {
            let tex = expr;

            // 1. Tangani pangkat ([a-zA-Z0-9()]+)^(\d+) -> $1^{$2}
            tex = tex.replace(/([a-zA-Z0-9()]+)\^(\d+)/g, '$1^{$2}');

            // 2. Ganti simbol perkalian unicode '×' atau '*' menjadi \times
            tex = tex.replace(/\s*[×*]\s*/g, ' \\times ');

            // 3. Ganti operator kali huruf 'x' yang berdiri sendiri (misal "3 x 2") menjadi \times
            // Gunakan lookbehind dan lookahead agar tidak merusak perintah TeX seperti \text atau \times
            tex = tex.replace(/(?<=\d|\))\s*x\s*(?=\d|\()/gi, ' \\times ');

            // 4. Pastikan format mata uang Rp dibungkus \text{Rp } secara aman tanpa duplikasi
            tex = tex.replace(/(\\text\{)?Rp\s*([\d\.]+)(\})?/g, (match, openTag, amount, closeTag) => {
                return `\\text{Rp }${amount}`;
            });

            return window.katex.renderToString(tex, {
                throwOnError: false,
                displayMode: false
            });
        } catch (e) {
            console.warn("KaTeX render error:", e);
        }
    }

    // Fallback jika KaTeX offline/belum dimuat
    return formatMathText(expr);
}

// Daftar nama barang belanjaan yang perlu ditebalkan (bold) dalam kalimat transaksi
const ITEM_NAMES_LIST = [
    'wadah kue padamaran', 'takir kue padamaran', 'kue padamaran', 'padamaran',
    'batang dodol nanas', 'batang dodol', 'dodol nanas', 'dodol',
    'kantong beras', 'karung beras', 'beras',
    'kantong minyak goreng', 'kemasan minyak goreng', 'kantong minyak', 'kemasan minyak', 'botol minyak goreng', 'botol minyak', 'minyak goreng', 'minyak',
    'mangkuk tempoyak', 'tempoyak',
    'kantong tepung', 'bungkus tepung', 'tepung',
    'batang sabun', 'sabun',
    'bungkus roti', 'buah roti', 'roti',
    'piring kue gandus', 'kue gandus', 'gandus',
    'bungkus gula', 'gula',
    'buah jeruk', 'jeruk',
    'buah apel', 'apel',
    'bungkus kopi', 'kopi aaa', 'kopi',
    'batang pena', 'buah pena', 'pena',
    'butir telur', 'telur',
    'buah terong', 'terong',
    'buku tulis', 'buku'
].sort((a, b) => b.length - a.length);

const ITEM_NAME_REGEX = new RegExp('\\b(' + ITEM_NAMES_LIST.map(s => s.replace(/\s+/g, '\\s+')).join('|') + ')\\b', 'gi');

/**
 * Memformat teks campuran (seperti balon pesan atau kuis) agar:
 * 1. Kalimat utama tetap font biasa (normal weight).
 * 2. Nama barang otomatis ditebalkan (<b class="item-name-bold">...</b>).
 * 3. Variabel aljabar (a-q, x, y) dan suku aljabar ditebalkan dan berfont matematika.
 * 4. Notasi eksponen/pangkat dan operator diformat rapi.
 * @param {string} text
 * @returns {string}
 */
function formatMathText(text) {
    if (!text) return "";

    // Bersihkan tag \text{...} jika ada sisa perintah TeX yang masuk ke fallback teks
    let formatted = text.replace(/\\text\{([^}]+)\}/g, '$1');

    const hasKaTeX = typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function';

    // Helper: proses penggantian teks matematika hanya pada bagian yang bukan tag HTML
    const processNonHtmlParts = (str, fn) => {
        const parts = str.split(/(<[^>]+>)/g);
        for (let i = 0; i < parts.length; i += 2) {
            parts[i] = fn(parts[i]);
        }
        return parts.join('');
    };

    // 1. Tebalkan nama-nama barang belanjaan jika berada di luar tag HTML
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(ITEM_NAME_REGEX, '<b class="item-name-bold">$1</b>');
    });

    // 2. Format notasi eksponen / pangkat aljabar: misal c^5 atau 5a^2
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s+=\-(>,])(\d*)([a-qxy])\^(\d+)(?=[\s+=\-)<,.?!;:]|$)/gi, (match, prefix, num, v, p) => {
            if (hasKaTeX) {
                try {
                    let texTerm = `${num || ''}${v}^{${p}}`;
                    return prefix + window.katex.renderToString(texTerm, { throwOnError: false, displayMode: false });
                } catch (e) {}
            }
            let numHtml = num ? `<span class="math-num">${num}</span>` : "";
            return `${prefix}${numHtml}<span class="math-var">${v}</span><sup>${p}</sup>`;
        });
    });

    // Format eksponen angka murni jika ada (misal 2^3)
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s+=\-(>,])(\d+)\^(\d+)(?=[\s+=\-)<,.?!;:]|$)/g, (match, prefix, base, exp) => {
            if (hasKaTeX) {
                try {
                    return prefix + window.katex.renderToString(`${base}^{${exp}}`, { throwOnError: false, displayMode: false });
                } catch (e) {}
            }
            return `${prefix}<span class="math-num">${base}</span><sup>${exp}</sup>`;
        });
    });

    // 3. Ganti huruf variabel aljabar tunggal dalam kurung, misal (a) -> (<span class="math-var">a</span>)
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/\(([a-qxy])\)/gi, '(<span class="math-var">$1</span>)');
    });

    // 4. Ganti suku aljabar dengan koefisien atau ekspresi, misal 3a -> 3<span class="math-var">a</span> atau 5ab -> 5<span class="math-var">ab</span>
    // Serta variabel tunggal yang berdiri sendiri, misal " a " -> " <span class="math-var">a</span> "
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s+=\-\(\/])(?:(\d+)([a-qxy]+)|([a-qxy]))(?=[\s+=\-\)<,\/.?!;:]|$)/gi, (match, prefix, num, varsMulti, varsSingle) => {
            let numHtml = num ? `<span class="math-num">${num}</span>` : "";
            let v = varsMulti || varsSingle;
            return `${prefix}${numHtml}<span class="math-var">${v}</span>`;
        });
    });

    // 5. Ganti simbol perkalian unicode '×' agar terbungkus span rapi jika bukan di dalam tag HTML
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s\d\)])×([\s\d\(]|$)/g, '$1<span class="math-op">×</span>$2');
    });

    return formatted;
}

/**
 * Mengurai ekspresi aljabar pemain menjadi map koefisien bersih tiap variabel:
 * @param {string} rawStr
 * @returns {Object.<string, number>|null}
 */
function parseAlgebraicExpression(rawStr) {
    if (!rawStr) return null;
    let str = rawStr.replace(/\s+/g, '').toLowerCase();

    // Tolak ekspresi yang diakhiri operator gantung atau kurung kosong
    if (/[+\-]$/.test(str)) return null;
    if (/\(\s*\)/.test(str)) return null;

    // 1. Tangani ekspansi sifat distributif perkalian tanda kurung: [+-]?k(ax + by + ...)
    const parenRegex = /([+-]?\d*)\(([^()]+)\)/g;
    let matchParen;
    let maxParenExpansions = 10;
    while ((matchParen = parenRegex.exec(str)) !== null && maxParenExpansions > 0) {
        maxParenExpansions--;
        const fullMatch = matchParen[0];
        const signMultStr = matchParen[1];
        let mult = 1;
        if (signMultStr === '' || signMultStr === '+') mult = 1;
        else if (signMultStr === '-') mult = -1;
        else mult = parseInt(signMultStr, 10);

        const inner = matchParen[2];
        if (/[+\-]$/.test(inner)) return null;

        const innerTerms = inner.match(/[+-]?[^+-]+/g) || [];
        if (innerTerms.length === 0) return null;

        let expanded = '';
        for (const it of innerTerms) {
            const isNeg = it.startsWith('-');
            const clean = it.replace(/^[+-]/, '');
            const termMatch = clean.match(/^(\d*)([a-q])$/);
            if (!termMatch) return null; // Format tidak sah di dalam kurung
            const baseCoef = termMatch[1] === '' ? 1 : parseInt(termMatch[1], 10);
            const netCoef = baseCoef * mult * (isNeg ? -1 : 1);
            expanded += (netCoef >= 0 ? '+' : '') + netCoef + termMatch[2];
        }

        str = str.replace(fullMatch, expanded);
        parenRegex.lastIndex = 0;
    }

    // Jika masih ada tanda kurung tersisa (misal kurung tak berpasangan), tolak
    if (str.includes('(') || str.includes(')')) return null;
    if (/[+\-]$/.test(str)) return null;

    // 2. Ekstrak seluruh suku bertanda (+ / -)
    const terms = str.match(/[+-]?[^+-]+/g);
    if (!terms) return null;

    const netCounts = {};

    for (const term of terms) {
        const isNeg = term.startsWith('-');
        const clean = term.replace(/^[+-]/, '');
        const match = clean.match(/^(\d*)([a-q])$/);
        if (!match) {
            // Miskonsepsi penggabungan suku tidak sejenis (misal "5bi") atau karakter tak terduga
            return null;
        }

        const coef = (match[1] === '' ? 1 : parseInt(match[1], 10)) * (isNeg ? -1 : 1);
        const variable = match[2];
        netCounts[variable] = (netCounts[variable] || 0) + coef;
    }

    return netCounts;
}

/**
 * Menghitung dan memvalidasi rumus aljabar dari input pemain.
 * @returns {{ isBenar: boolean, tagihan: number, cost: number, simplifiedFormula: string }}
 */
function calculateFormula() {
    const formulaInput = document.getElementById("formula-box");
    if (!formulaInput) return { isBenar: false, tagihan: 0, cost: 0, simplifiedFormula: '' };

    let rumusBersih = formulaInput.value.replace(/\s+/g, '').toLowerCase();
    if (!rumusBersih) return { isBenar: false, tagihan: 0, cost: 0, simplifiedFormula: '' };

    const parsed = parseAlgebraicExpression(rumusBersih);
    if (!parsed) return { isBenar: false, tagihan: 0, cost: 0, simplifiedFormula: '' };

    // Susun formula kanonik aljabar yang telah disederhanakan
    const simplifiedTerms = [];
    for (let key in ITEM_DB) {
        if (parsed[key] && parsed[key] > 0) {
            const count = parsed[key];
            simplifiedTerms.push(`${count === 1 ? '' : count}${key}`);
        }
    }
    const simplifiedFormula = simplifiedTerms.length > 0 ? simplifiedTerms.join(' + ') : '0';

    let isRumusBenar      = true;
    let calculatedTagihan = 0;
    let calculatedCost    = 0;

    const order = state.currentLevelParams?.order || {};

    // Periksa kesesuaian koefisien bersih tiap barang pesanan
    for (let key in ITEM_DB) {
        let expectedQty = order[key] || 0;
        let userQty = parsed[key] || 0;

        if (userQty !== expectedQty) {
            isRumusBenar = false;
            break;
        }

        if (expectedQty > 0) {
            calculatedTagihan += expectedQty * ITEM_DB[key].price;
            calculatedCost    += expectedQty * ITEM_DB[key].cost;
        }
    }

    // Pastikan tidak ada variabel lain yang bernilai > 0 di luar pesanan,
    // dan tidak ada variabel yang memiliki koefisien bersih negatif (< 0)
    if (isRumusBenar) {
        for (let key in parsed) {
            let expectedQty = order[key] || 0;
            if (parsed[key] > 0 && expectedQty === 0) {
                isRumusBenar = false;
                break;
            }
            if (parsed[key] < 0) {
                isRumusBenar = false;
                break;
            }
        }
    }

    if (isRumusBenar) {
        return { isBenar: true, tagihan: calculatedTagihan, cost: calculatedCost, simplifiedFormula };
    }
    return { isBenar: false, tagihan: 0, cost: 0, simplifiedFormula };
}

/**
 * Menghasilkan teks rincian pecahan uang yang dibayarkan pelanggan.
 * @param {Object} [uangDetail]
 * @returns {string}
 */
function tentukanPecahanUang(uangDetail = state.uangDibayarDetail) {
    let hasilTeks = [];
    if (!uangDetail) return "(Tidak ada rincian)";
    const daftarPecahan = Object.keys(uangDetail).map(Number).sort((a, b) => b - a);
    for (let pecahan of daftarPecahan) {
        let jumlahLembar = uangDetail[pecahan];
        if (jumlahLembar > 0) hasilTeks.push(`${jumlahLembar} Lbr Rp${pecahan.toLocaleString('id-ID')}`);
    }
    if (hasilTeks.length === 0) return "(Tidak ada rincian)";
    return "(" + hasilTeks.join(" + ") + ")";
}

/**
 * Menghitung jumlah bintang kemenangan level (1 - 3 bintang).
 * - 3 Bintang: 0 kesalahan rumus/kembalian DAN kuis sempurna (atau level tanpa kuis).
 * - 2 Bintang: kesalahan <= 2 DAN rasio kuis >= 50%.
 * - 1 Bintang: level selesai.
 * @param {{ errors?: number, quizCorrect?: number, quizTotal?: number }} params
 * @returns {1|2|3}
 */
function computeLevelStars({ errors = 0, quizCorrect = 0, quizTotal = 0 } = {}) {
    const err = Math.max(0, Number(errors) || 0);
    const qTotal = Math.max(0, Number(quizTotal) || 0);
    const qCorrect = Math.max(0, Number(quizCorrect) || 0);
    const quizRatio = qTotal === 0 ? 1 : (qCorrect / qTotal);

    if (err === 0 && quizRatio >= 1) {
        return 3;
    }
    if (err <= 2 && quizRatio >= 0.5) {
        return 2;
    }
    return 1;
}

/**
 * Menghitung persentase akurasi rumus/transaksi dalam satu level.
 * @param {{ customers?: number, errors?: number }} params
 * @returns {number} Persentase 0 - 100
 */
function computeLevelAccuracy({ customers = 1, errors = 0 } = {}) {
    const c = Math.max(1, Number(customers) || 1);
    const e = Math.max(0, Number(errors) || 0);
    return Math.round((c / (c + e)) * 100);
}

/**
 * Meminta browser masuk ke mode fullscreen.
 */
function requestFullScreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        return;
    }
    const elem = document.documentElement;
    try {
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                // Kebijakan browser memerlukan interaksi pengguna (user gesture)
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } catch (_) {}
}

/**
 * Keluar dari mode fullscreen.
 */
function exitFullScreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen)            document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen)     document.msExitFullscreen();
    }
}

let wakeLockSentinel = null;

/**
 * Meminta Screen Wake Lock agar layar HP tetap menyala saat bermain game
 * dan tidak mati otomatis.
 */
async function requestWakeLock() {
    if ('wakeLock' in navigator && typeof navigator.wakeLock.request === 'function') {
        try {
            if (wakeLockSentinel && !wakeLockSentinel.released) return;
            wakeLockSentinel = await navigator.wakeLock.request('screen');
            wakeLockSentinel.addEventListener('release', () => {
                wakeLockSentinel = null;
            });
            console.log('[WakeLock] Screen wake lock aktif (layar dicegah mati otomatis)');
        } catch (err) {
            // Browser mungkin membatasi jika baterai sangat rendah atau tab belum aktif
            console.warn('[WakeLock] Status wake lock:', err.message || err);
        }
    }
}

/**
 * Melepaskan Screen Wake Lock jika tidak dibutuhkan.
 */
async function releaseWakeLock() {
    if (wakeLockSentinel) {
        try {
            await wakeLockSentinel.release();
            wakeLockSentinel = null;
        } catch (err) {
            console.warn('[WakeLock] Gagal melepas wake lock:', err);
        }
    }
}



// ==========================================
// FILE: js/core/sync.js
// ==========================================
// ==========================================
// core/sync.js — Sinkronisasi Hybrid (Firebase Realtime Database + BroadcastChannel)
// ==========================================




// ==========================================
// KONFIGURASI FIREBASE REALTIME DATABASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBWAqxM-Vf5eLdYz-8pAhqhxM_16XMz3fA",
  authDomain: "algebramart-f0255.firebaseapp.com",
  databaseURL: "https://algebramart-f0255-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "algebramart-f0255",
  storageBucket: "algebramart-f0255.firebasestorage.app",
  messagingSenderId: "1062066477662",
  appId: "1:1062066477662:web:f0569b13e3b825f5f032cf"
};


let app = null;
let db = null;

try {
    if (typeof firebase !== 'undefined') {
        app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }
} catch (e) {
    console.warn('[Sync] Inisialisasi Firebase Compat:', e);
}

function ref(database, path) {
    if (database && typeof database.ref === 'function') {
        return database.ref(path);
    }
    return { path };
}

function set(dbRef, val) {
    if (dbRef && typeof dbRef.set === 'function') {
        return dbRef.set(val);
    }
    return Promise.resolve();
}

function update(dbRef, val) {
    if (dbRef && typeof dbRef.update === 'function') {
        return dbRef.update(val);
    }
    return Promise.resolve();
}

function get(dbRef) {
    if (dbRef && typeof dbRef.once === 'function') {
        return dbRef.once('value');
    }
    if (dbRef && typeof dbRef.get === 'function') {
        return dbRef.get();
    }
    return Promise.resolve({ exists: () => false, val: () => null });
}

function onValue(dbRef, callback) {
    if (dbRef && typeof dbRef.on === 'function') {
        return dbRef.on('value', callback);
    }
}

function off(dbRef) {
    if (dbRef && typeof dbRef.off === 'function') {
        return dbRef.off();
    }
}




// Channel & listener states
let syncChannel = null;
let storageEventHandler = null;

// Inisialisasi BroadcastChannel untuk komunikasi antar-tab/perangkat luring instan (Cadangan Luring)
try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        syncChannel = new BroadcastChannel('algebra_mart_room_sync');
    }
} catch (e) {
    console.warn('[Sync] BroadcastChannel tidak tersedia:', e);
}

/**
 * Menghasilkan Kode Ruang acak 6 karakter (misal ALJ7A1)
 * @returns {string}
 */
function generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ALJ${randomPart}`;
}

/**
 * Memulai sesi hosting oleh Fasilitator/Guru menggunakan Firebase onValue.
 * @param {Function} onStudentsUpdate Callback yang dipanggil saat ada update data siswa
 * @param {boolean} forceNew Apakah memaksa membuat kode ruang baru
 * @param {string|null} customRoomCode Kode ruang spesifik yang ingin dimuat fasilitator
 * @returns {string} roomCode Kode ruang yang aktif
 */
function startHostRoom(onStudentsUpdate, forceNew = false, customRoomCode = null) {
    // Putuskan listener pada ruang sebelumnya jika berpindah ruang
    if (state.hostedRoomCode) {
        try {
            off(ref(db, 'rooms/' + state.hostedRoomCode + '/students'));
        } catch (e) { /* ignore */ }
    }

    let roomCode = state.hostedRoomCode;
    if (customRoomCode && typeof customRoomCode === 'string' && customRoomCode.trim() !== '') {
        let cleaned = customRoomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (cleaned.length === 3) {
            cleaned = 'ALJ' + cleaned;
        }
        roomCode = cleaned;
        state.hostedRoomCode = roomCode;
    } else if (forceNew || !roomCode) {
        roomCode = generateRoomCode();
        state.hostedRoomCode = roomCode;
    }

    try {
        localStorage.setItem('algebraMart_hostedRoom', roomCode);
    } catch (e) { /* ignore */ }

    state.onlineStudents = {};
    console.log(`[Sync] Fasilitator membuka sesi kelas: ${roomCode}`);

    // 1. Kanal Lokal / Luring (BroadcastChannel & Storage Event) sebagai cadangan
    if (syncChannel) {
        syncChannel.onmessage = (event) => {
            try {
                const msg = event.data;
                if (msg && msg.type === 'STUDENT_PROGRESS' && msg.roomCode === roomCode && msg.data) {
                    const student = msg.data;
                    state.onlineStudents[student.studentId] = student;
                    if (typeof onStudentsUpdate === 'function') {
                        onStudentsUpdate(state.onlineStudents);
                    }
                }
            } catch (err) {
                console.warn('[Sync] Kesalahan membaca pesan lokal:', err);
            }
        };
    }

    if (typeof window !== 'undefined') {
        if (storageEventHandler) {
            window.removeEventListener('storage', storageEventHandler);
        }
        storageEventHandler = (event) => {
            if (event.key === 'algebramart_sync_msg' && event.newValue) {
                try {
                    const msg = JSON.parse(event.newValue);
                    if (msg && msg.roomCode === roomCode && msg.data) {
                        state.onlineStudents[msg.data.studentId] = msg.data;
                        if (typeof onStudentsUpdate === 'function') {
                            onStudentsUpdate(state.onlineStudents);
                        }
                    }
                } catch (e) { /* ignore parse error */ }
            }
        };
        window.addEventListener('storage', storageEventHandler);
    }

    // 2. Kanal Firebase Realtime Database
    try {
        // Tulis info room ke Firebase agar terdaftar aktif
        set(ref(db, 'rooms/' + roomCode + '/info'), {
            code: roomCode,
            active: true,
            createdAt: Date.now()
        }).catch(err => console.warn('[Sync] Gagal inisialisasi room info di Firebase:', err));

        // Pasang realtime listener onValue pada data murid di room
        onValue(ref(db, 'rooms/' + roomCode + '/students'), (snapshot) => {
            try {
                state.onlineStudents = {};
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data && typeof data === 'object') {
                        Object.entries(data).forEach(([keyId, s]) => {
                            if (!s || typeof s !== 'object') return;
                            const studentId = s.studentId || keyId;
                            if (!state.onlineStudents[studentId]) {
                                state.onlineStudents[studentId] = {};
                            }
                            const st = state.onlineStudents[studentId];
                            st.studentId = studentId;
                            st.name = s.name || 'Siswa';
                            st.kelas = s.kelas || '-';
                            st.nama_fasil = s.nama_fasil || (state.fasilEdits && (state.fasilEdits[studentId]?.nama_fasil || state.fasilEdits[keyId]?.nama_fasil)) || null;
                            st.kelas_fasil = s.kelas_fasil || (state.fasilEdits && (state.fasilEdits[studentId]?.kelas_fasil || state.fasilEdits[keyId]?.kelas_fasil)) || null;
                            st.gender = s.gender || 'Laki-laki';
                            st.level = s.level || 1;
                            st.laba = s.laba !== undefined ? s.laba : (s.money || 0);
                            st.money = st.laba;
                            st.errorCount = s.errorCount !== undefined ? s.errorCount : (s.error_count || 0);
                            st.quizCorrect = s.quizCorrect !== undefined ? s.quizCorrect : (s.quiz_correct || 0);
                            st.quizTotal = s.quizTotal !== undefined ? s.quizTotal : (s.quiz_total || 0);
                            st.quizScore = s.quizScore || `${st.quizCorrect}/${st.quizTotal}`;
                            st.quizWrong = s.quizWrong !== undefined ? s.quizWrong : 0;
                            if (s.activeLevel !== undefined) st.activeLevel = s.activeLevel;
                            if (s.maxLevel !== undefined) st.maxLevel = s.maxLevel;
                            if (s.accuracy !== undefined) st.accuracy = s.accuracy;
                            if (s.history !== undefined) st.history = s.history;
                            if (s.lastUpdated !== undefined) st.lastUpdated = s.lastUpdated;
                        });
                    }
                }
                if (typeof onStudentsUpdate === 'function') {
                    onStudentsUpdate(state.onlineStudents);
                }
            } catch (err) {
                console.warn('[Sync] Gagal memproses pembaruan data murid dari Firebase:', err);
            }
        });
        console.log(`[Sync] Berhasil mendengarkan data murid di Firebase: rooms/${roomCode}/students`);
    } catch (err) {
        console.warn('[Sync] Gagal memasang Firebase onValue listener:', err);
    }

    return roomCode;
}

/**
 * Mematikan sesi hosting fasilitator dan memutus listener data Firebase.
 */
function stopHostRoom() {
    if (state.hostedRoomCode) {
        try {
            off(ref(db, 'rooms/' + state.hostedRoomCode + '/students'));
        } catch (e) {
            console.warn('[Sync] Gagal mematikan listener Firebase via off:', e);
        }
        try {
            set(ref(db, 'rooms/' + state.hostedRoomCode + '/info/active'), false);
        } catch (e) { /* ignore */ }
    }

    if (typeof window !== 'undefined' && storageEventHandler) {
        window.removeEventListener('storage', storageEventHandler);
        storageEventHandler = null;
    }

    state.hostedRoomCode = null;
    state.onlineStudents = {};
    try {
        localStorage.removeItem('algebraMart_hostedRoom');
    } catch (e) { /* ignore */ }
    console.log('[Sync] Sesi host fasilitator telah dihentikan.');
}

/**
 * Memperbarui data murid secara manual dari Firebase Realtime Database.
 */
async function refreshHostStudents() {
    if (!state.hostedRoomCode) return;
    try {
        const snapshot = await get(ref(db, 'rooms/' + state.hostedRoomCode + '/students'));
        state.onlineStudents = {};
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                Object.entries(data).forEach(([keyId, s]) => {
                    if (!s || typeof s !== 'object') return;
                    const studentId = s.studentId || keyId;
                    if (!state.onlineStudents[studentId]) {
                        state.onlineStudents[studentId] = {};
                    }
                    const st = state.onlineStudents[studentId];
                    st.studentId = studentId;
                    st.name = s.name || 'Siswa';
                    st.kelas = s.kelas || '-';
                    st.nama_fasil = s.nama_fasil || (state.fasilEdits && (state.fasilEdits[studentId]?.nama_fasil || state.fasilEdits[keyId]?.nama_fasil)) || null;
                    st.kelas_fasil = s.kelas_fasil || (state.fasilEdits && (state.fasilEdits[studentId]?.kelas_fasil || state.fasilEdits[keyId]?.kelas_fasil)) || null;
                    st.gender = s.gender || 'Laki-laki';
                    st.level = s.level || 1;
                    st.laba = s.laba !== undefined ? s.laba : (s.money || 0);
                    st.money = st.laba;
                    st.errorCount = s.errorCount !== undefined ? s.errorCount : (s.error_count || 0);
                    st.quizCorrect = s.quizCorrect !== undefined ? s.quizCorrect : (s.quiz_correct || 0);
                    st.quizTotal = s.quizTotal !== undefined ? s.quizTotal : (s.quiz_total || 0);
                    st.quizScore = s.quizScore || `${st.quizCorrect}/${st.quizTotal}`;
                    st.quizWrong = s.quizWrong !== undefined ? s.quizWrong : 0;
                    if (s.activeLevel !== undefined) st.activeLevel = s.activeLevel;
                    if (s.maxLevel !== undefined) st.maxLevel = s.maxLevel;
                    if (s.accuracy !== undefined) st.accuracy = s.accuracy;
                    if (s.history !== undefined) st.history = s.history;
                    if (s.lastUpdated !== undefined) st.lastUpdated = s.lastUpdated;
                });
            }
        }
    } catch (e) {
        console.warn('[Sync] Gagal memuat ulang data manual dari Firebase:', e);
    }
}

/**
 * Memuat sesi kelas spesifik berdasarkan Kode Ruang yang dimasukkan oleh Fasilitator.
 * Menangani kondisi luring (offline) maupun daring (Firebase) secara graceful.
 * @param {string} rawCode
 * @param {Function} onStudentsUpdate
 * @returns {Promise<{success: boolean, code?: string, studentCount?: number, message: string, isOffline?: boolean}>}
 */
async function loadSpecificHostRoom(rawCode, onStudentsUpdate) {
    if (!rawCode || !rawCode.trim()) {
        return { success: false, message: 'Masukkan Kode Ruang kelas terlebih dahulu (contoh: ALJ7A1).' };
    }

    let cleaned = rawCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    let stripped = cleaned.replace(/[^A-Z0-9]/g, '');
    if (stripped.length === 3) {
        cleaned = 'ALJ' + stripped;
    } else {
        cleaned = stripped;
    }

    if (cleaned.length < 4 || cleaned.length > 8) {
        return { success: false, message: 'Format Kode Ruang tidak valid (harus 4–8 karakter, contoh: ALJ7A1).' };
    }

    let resolvedCode = cleaned;
    let isOfflineFallback = false;

    try {
        if (!db || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
            isOfflineFallback = true;
        } else {
            let snapshot = await get(ref(db, 'rooms/' + resolvedCode));
            if (!snapshot.exists() && resolvedCode.startsWith('ALJ')) {
                const altCode = 'ALJ-' + resolvedCode.substring(3);
                const altSnap = await get(ref(db, 'rooms/' + altCode));
                if (altSnap.exists()) {
                    resolvedCode = altCode;
                    snapshot = altSnap;
                }
            }
        }
    } catch (err) {
        console.warn('[Sync] Mode luring / gagal memeriksa ruang di Firebase, beralih ke sesi lokal:', err);
        isOfflineFallback = true;
    }

    // Aktifkan listener ruang kelas pada kode tersebut
    startHostRoom(onStudentsUpdate, false, resolvedCode);

    if (!isOfflineFallback) {
        try {
            await refreshHostStudents();
            if (typeof onStudentsUpdate === 'function') {
                onStudentsUpdate(state.onlineStudents);
            }
        } catch (e) { /* ignore */ }
    }

    const count = Object.keys(state.onlineStudents || {}).length;
    if (isOfflineFallback) {
        return {
            success: true,
            code: resolvedCode,
            studentCount: count,
            isOffline: true,
            message: `Ruang ${resolvedCode} diaktifkan dalam Mode Luring (Koneksi server tidak tersedia).`
        };
    }

    return {
        success: true,
        code: resolvedCode,
        studentCount: count,
        isOffline: false,
        message: `Berhasil memuat ruang kelas ${resolvedCode} (${count} murid daring terdata).`
    };
}

/**
 * Memperbarui data identitas murid (HANYA nama_fasil dan kelas_fasil) secara parsial di Firebase
 * Memisahkan data editan fasilitator dari data asli perangkat murid ('name' dan 'kelas').
 * @param {string} studentId
 * @param {{ nama_fasil?: string, kelas_fasil?: string, name?: string, kelas?: string }} partialData
 * @returns {Promise<boolean>}
 */
async function updateStudentProfileInRoom(studentId, partialData) {
    if (!studentId || !partialData || typeof partialData !== 'object') return false;

    const cleanId = String(studentId).replace(/[^a-zA-Z0-9_-]/g, '_');

    // Filter ketat: Hanya izinkan key 'nama_fasil' dan 'kelas_fasil'
    const safeUpdate = {};
    const candidateName = partialData.nama_fasil !== undefined ? partialData.nama_fasil : partialData.name;
    const candidateKelas = partialData.kelas_fasil !== undefined ? partialData.kelas_fasil : partialData.kelas;

    if (typeof candidateName === 'string' && candidateName.trim() !== '') {
        safeUpdate.nama_fasil = candidateName.trim();
    }
    if (typeof candidateKelas === 'string' && candidateKelas.trim() !== '') {
        safeUpdate.kelas_fasil = candidateKelas.trim();
    }

    if (Object.keys(safeUpdate).length === 0) return false;

    // 1. Simpan ke cache fasilEdits di state memory dan localStorage
    if (!state.fasilEdits) state.fasilEdits = {};
    if (!state.fasilEdits[cleanId]) state.fasilEdits[cleanId] = {};
    if (!state.fasilEdits[studentId]) state.fasilEdits[studentId] = {};
    if (safeUpdate.nama_fasil !== undefined) {
        state.fasilEdits[cleanId].nama_fasil = safeUpdate.nama_fasil;
        state.fasilEdits[studentId].nama_fasil = safeUpdate.nama_fasil;
    }
    if (safeUpdate.kelas_fasil !== undefined) {
        state.fasilEdits[cleanId].kelas_fasil = safeUpdate.kelas_fasil;
        state.fasilEdits[studentId].kelas_fasil = safeUpdate.kelas_fasil;
    }

    const roomCode = state.hostedRoomCode;
    try {
        const cacheKey = 'algebraMart_fasilEdits_' + (roomCode || 'default');
        localStorage.setItem(cacheKey, JSON.stringify(state.fasilEdits));
    } catch (e) { /* ignore */ }

    // 2. Perbarui state memori onlineStudents jika ada
    const targetOnline = (state.onlineStudents && state.onlineStudents[studentId]) || 
                         (state.onlineStudents && state.onlineStudents[cleanId]);
    if (targetOnline) {
        if (safeUpdate.nama_fasil !== undefined) targetOnline.nama_fasil = safeUpdate.nama_fasil;
        if (safeUpdate.kelas_fasil !== undefined) targetOnline.kelas_fasil = safeUpdate.kelas_fasil;
    }

    // 3. Jika ada kode ruang yang sedang aktif di-host, kirim pembaruan parsial ke Firebase
    if (roomCode && db) {
        try {
            const studentRef = ref(db, 'rooms/' + roomCode + '/students/' + cleanId);
            await update(studentRef, safeUpdate);
            console.log(`[Sync] Pembaruan editan fasilitator berhasil disimpan ke Firebase (rooms/${roomCode}/students/${cleanId}):`, safeUpdate);
            return true;
        } catch (err) {
            console.warn('[Sync] Gagal melakukan update parsial ke Firebase:', err);
            return false;
        }
    }

    return true;
}

/**
 * Bergabung ke sesi kelas oleh Murid.
 * Memvalidasi apakah kode ruang aktif/ada di Firebase sebelum bergabung.
 * @param {string} code
 * @returns {Promise<{success: boolean, message: string, code?: string}>}
 */
async function joinRoom(code) {
    if (!code) {
        return { success: false, message: 'Kode ruang tidak boleh kosong.' };
    }
    // Bersihkan karakter strip, spasi, atau simbol lain yang mungkin diketik murid
    let raw = code.trim().toUpperCase();
    let cleanedCode = raw.replace(/[^A-Z0-9]/g, '');

    // Jika murid hanya mengetik 3 karakter belakang (misal 7A1), lengkapi prefix ALJ
    if (cleanedCode.length === 3) {
        cleanedCode = 'ALJ' + cleanedCode;
    }

    if (cleanedCode.length < 4 || cleanedCode.length > 8) {
        return { success: false, message: 'Kode ruang tidak valid (harus 6 karakter, contoh: ALJ7A1).' };
    }

    // Validasi keberadaan ruang kelas di Firebase Realtime Database
    try {
        let checkCode = cleanedCode;
        let snapshot = await get(ref(db, 'rooms/' + checkCode));

        // Kompatibilitas dengan sesi lama yang mungkin memiliki strip (ALJ-XXX)
        if (!snapshot.exists()) {
            let altCode = checkCode.startsWith('ALJ') ? 'ALJ-' + checkCode.substring(3) : checkCode;
            let altSnapshot = await get(ref(db, 'rooms/' + altCode));
            if (altSnapshot.exists()) {
                checkCode = altCode;
                snapshot = altSnapshot;
            }
        }

        if (!snapshot.exists()) {
            return {
                success: false,
                message: `Ruang kelas "${cleanedCode}" tidak ditemukan atau belum dibuka oleh Fasilitator.`
            };
        }

        const roomData = snapshot.val();
        if (roomData && roomData.info && roomData.info.active === false) {
            return {
                success: false,
                message: `Sesi kelas "${cleanedCode}" sudah ditutup oleh Fasilitator.`
            };
        }

        cleanedCode = checkCode;
    } catch (err) {
        console.warn('[Sync] Gagal memvalidasi kode ruang via Firebase:', err);
        return {
            success: false,
            message: 'Gagal terhubung ke database Firebase. Pastikan koneksi internet stabil.'
        };
    }

    state.activeRoomCode = cleanedCode;
    try {
        localStorage.setItem('algebraMart_roomCode', cleanedCode);
    } catch (e) { /* ignore */ }

    console.log(`[Sync] Murid berhasil bergabung ke ruang: ${cleanedCode}`);
    return { success: true, message: `Berhasil terhubung ke kelas ${cleanedCode}!`, code: cleanedCode };
}

function leaveRoom() {
    state.activeRoomCode = null;
    try {
        localStorage.removeItem('algebraMart_roomCode');
    } catch (e) { /* ignore */ }
    console.log('[Sync] Murid keluar dari kelas.');
}

/**
 * Mengirim progres murid ke fasilitator via Firebase Realtime Database
 * (dan cadangan lokal BroadcastChannel/localStorage).
 */
async function sendStudentProgress(user, levelIdx, errors = 0, quizCorrect = 0, quizTotal = 0) {
    if (!user) return false;
    const roomCode = state.activeRoomCode;
    if (!roomCode) {
        return false;
    }

    const history = Array.isArray(user.history) ? user.history : [];
    const totalLevels = history.length;
    const zeroErrors = history.filter(h => (h.errors || 0) === 0).length;
    const accuracy = totalLevels === 0 ? 100 : Math.round((zeroErrors / totalLevels) * 100);

    const studentId = String(user.id || user.name || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');

    const payload = {
        studentId: studentId,
        roomCode: roomCode,
        name: user.name || 'Siswa',
        kelas: user.kelas || user.class || '-',
        gender: user.gender || 'Laki-laki',
        level: levelIdx || 1,
        activeLevel: state.activePlayingLevel || null,
        maxLevel: Math.max(user.maxLevel || 1, levelIdx || 1),
        money: user.money !== undefined ? user.money : (user.laba || 0),
        laba: user.money !== undefined ? user.money : (user.laba || 0),
        accuracy: accuracy,
        errorCount: Number(errors) || 0,
        quizCorrect: Number(quizCorrect) || 0,
        quizTotal: Number(quizTotal) || 0,
        quizScore: `${quizCorrect}/${quizTotal}`,
        quizWrong: (Number(quizTotal) - Number(quizCorrect)) || 0,
        history: user.history || [],
        lastUpdated: Date.now()
    };

    console.log(`[Sync] Mengirim progres murid ke ruang [${roomCode}]:`, payload);

    // 1. Cadangan Lokal (BroadcastChannel)
    if (syncChannel) {
        try {
            syncChannel.postMessage({
                type: 'STUDENT_PROGRESS',
                roomCode: roomCode,
                data: payload
            });
        } catch (err) {
            console.warn('[Sync] Gagal postMessage BroadcastChannel:', err);
        }
    }

    // 2. Cadangan Lokal (localStorage event)
    try {
        localStorage.setItem('algebramart_sync_msg', JSON.stringify({
            roomCode: roomCode,
            data: payload,
            t: Date.now()
        }));
    } catch (e) { /* ignore */ }

    // 3. Kirim ke Firebase Realtime Database
    try {
        await set(ref(db, 'rooms/' + roomCode + '/students/' + studentId), payload);
        console.log(`[Sync] Progres murid tersinkron ke Firebase: rooms/${roomCode}/students/${studentId}`);
    } catch (err) {
        console.warn('[Sync] Gagal sinkronisasi ke Firebase (tetap tersimpan luring/broadcast):', err.message);
    }

    return true;
}

/**
 * Menyinkronkan profil akun pengguna ke Firebase Realtime Database (users/{studentId}).
 * Memastikan profil akun setiap orang yang masuk secara daring tersimpan di Firebase,
 * tidak hanya saat bergabung ke sesi kelas.
 * @param {Object} user Objek profil murid/pengguna
 * @returns {Promise<boolean>}
 */
async function syncUserProfile(user) {
    if (!user || (!user.id && !user.name)) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return false;
    }

    const studentId = String(user.id || user.name || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');
    const history = Array.isArray(user.history) ? user.history : [];
    const totalLevels = history.length;
    const zeroErrors = history.filter(h => (h.errors || 0) === 0).length;
    const accuracy = totalLevels === 0 ? 100 : Math.round((zeroErrors / totalLevels) * 100);

    const profilePayload = {
        id: String(user.id || studentId),
        studentId: studentId,
        name: user.name || 'Siswa',
        gender: user.gender || 'Laki-laki',
        kelas: user.kelas || user.class || '-',
        money: user.money !== undefined ? user.money : (user.laba || 0),
        revenue: user.revenue || 0,
        cost: user.cost || 0,
        maxLevel: user.maxLevel || 0,
        sumbangan: user.sumbangan || 0,
        badges: user.badges || [],
        accuracy: accuracy,
        totalLevelsCompleted: totalLevels,
        history: history,
        createdAt: user.createdAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        lastUpdated: Date.now()
    };

    try {
        if (db) {
            await set(ref(db, 'users/' + studentId), profilePayload);
            console.log(`[Sync] Profil akun pengguna tersinkron ke Firebase: users/${studentId}`);
            return true;
        }
    } catch (err) {
        console.warn('[Sync] Gagal menyinkronkan profil akun ke Firebase:', err);
    }
    return false;
}


// ==========================================
// FILE: js/core/tutorial.js
// ==========================================
// ==========================================
// core/tutorial.js — Interactive Guided Walkthrough
// ==========================================





/**
 * Konfigurasi 9 Langkah Tutorial Interaktif (Level 1 Pelanggan 1)
 * Pesanan: 4 Kue Padamaran (4j) | Uang: Rp 20.000 | Kembalian: Rp 12.000
 */
const TUTORIAL_STEPS = [
    {
        step: 1,
        target: '.speech-bubble',
        actionType: 'speech',
        reqCount: 1,
        handPos: 'left',
        title: 'Pesanan Pelanggan',
        text: 'Halo Kasir! Perhatikan baik-baik pesanan pelanggan. Klik <b>balon pesan</b> untuk mulai mencatat pesanan.'
    },
    {
        step: 2,
        target: '.product-item[data-var="j"]',
        actionType: 'addVar',
        expectedValue: 'j',
        reqCount: 4,
        handPos: 'left',
        title: 'Pilih Kue Padamaran (j)',
        text: 'Harga satu <b>kue padamaran</b> adalah <b>j</b> rupiah. Pelanggan membeli 4 <b>kue padamaran</b> (<b>4j</b>). Klik <b>Kue Padamaran</b> di rak sebanyak <b>4 kali</b>!'
    },
    {
        step: 3,
        target: '.btn-calc',
        actionType: 'calc',
        reqCount: 1,
        handPos: 'left',
        title: 'Kalkulasi Rumus Aljabar',
        text: 'Rumus aljabar pesanan sudah tersusun (<b>4j</b>). Tekan tombol <b>"="</b> untuk mengalkulasi harga belanjaan!'
    },
    {
        step: 4,
        target: '.money-5k',
        actionType: 'payMoney',
        expectedValue: 20000,
        reqCount: 1,
        handPos: 'left',
        title: 'Ambil Uang Pelanggan',
        text: 'Pelanggan membayar dengan uang <b>Rp 20.000</b>. Klik uang di dompet pelanggan untuk dimasukkan ke mesin kasir.'
    },
    {
        step: 5,
        target: '#btn-final-checkout',
        actionType: 'checkout',
        reqCount: 1,
        handPos: 'right',
        title: 'Konfirmasi Transaksi',
        text: 'Harga belanja dan nominal bayar sudah sesuai. Tekan tombol <b>"Konfirmasi"</b> untuk mencetak struk transaksi!'
    },
    {
        step: 6,
        target: '#btn-close-modal',
        actionType: 'closeReceipt',
        reqCount: 1,
        handPos: 'left',
        title: 'Periksa Struk Transaksi',
        text: 'Belanja <b>Rp 8.000</b>, dibayar <b>Rp 20.000</b>. Kembalian: <b>Rp 12.000</b>. Klik tombol <b>"Berikan Kembalian"</b> di bawah struk!'
    },
    {
        step: 7,
        target: '.btn-uang[data-nominal="10000"]',
        actionType: 'giveChange',
        expectedValue: 10000,
        reqCount: 1,
        handPos: 'left',
        title: 'Ambil Uang Rp 10.000',
        text: 'Laci kasir terbuka! Siapkan kembalian <b>Rp 12.000</b>. Pertama, ambil 1 lembar <b>Rp 10.000</b> dari laci kasir.'
    },
    {
        step: 8,
        target: '.btn-uang[data-nominal="2000"]',
        actionType: 'giveChange',
        expectedValue: 2000,
        reqCount: 1,
        handPos: 'left',
        title: 'Ambil Uang Rp 2.000',
        text: 'Sisa kembalian adalah <b>Rp 2.000</b>. Klik uang <b>Rp 2.000</b> sebanyak <b>1 kali</b>!'
    },
    {
        step: 9,
        target: '#btn-final-checkout',
        actionType: 'confirmChange',
        reqCount: 1,
        handPos: 'right',
        title: 'Serahkan Kembalian',
        text: 'Uang kembalian sudah tepat <b>Rp 12.000</b>! Tekan tombol <b>"Konfirmasi"</b> untuk menyerahkan ke pelanggan.'
    }
];

let currentStepIndex = 0;
let currentActionCount = 0;
let unlockedParents = [];
let renderStepTimeoutId = null;

/**
 * Memeriksa apakah tutorial sedang berjalan.
 */
function isTutorialRunning() {
    return state.isTutorialActive;
}

/**
 * Memulai rangkaian tutorial dari langkah pertama.
 */
function startTutorial() {
    if (state.currentLevelIdx !== 1 || state.currentCustomerIdx !== 0) return;

    state.isTutorialActive = true;
    currentStepIndex = 0;
    currentActionCount = 0;

    initSpeechBubbleListener();
    renderStep(currentStepIndex);
}

/**
 * Menghubungkan klik pada balon chat khusus langkah 1.
 */
function initSpeechBubbleListener() {
    const bubble = document.querySelector('.speech-bubble');
    if (bubble && !bubble.dataset.tutorialListenerAttached) {
        bubble.dataset.tutorialListenerAttached = 'true';
        bubble.addEventListener('click', () => {
            if (state.isTutorialActive && currentStepIndex === 0) {
                checkTutorialAction('speech');
            }
        });
    }
}

let isTransitioning = false;

/**
 * Fungsi pencegat tindakan pemain. Hanya mengizinkan aksi yang sesuai target tutorial aktif.
 * @param {string} actionType
 * @param {any} value
 * @returns {boolean}
 */
function checkTutorialAction(actionType, value = null) {
    if (!state.isTutorialActive) return true;
    if (isTransitioning) return false;

    const currentStep = TUTORIAL_STEPS[currentStepIndex];
    if (!currentStep) return true;

    if (currentStep.actionType !== actionType) {
        return false;
    }

    if (currentStep.expectedValue !== undefined) {
        if (currentStep.expectedValue !== value) {
            return false;
        }
    }

    // Aksi valid! Tambah progres
    currentActionCount++;
    updateProgressText(currentStep);

    // Animasi denyut saat klik berhasil
    triggerFingertipPulse();

    if (currentActionCount >= currentStep.reqCount) {
        isTransitioning = true;
        advanceStep();
    }

    return true;
}

/**
 * Melanjutkan ke langkah tutorial berikutnya.
 */
function advanceStep() {
    currentStepIndex++;
    currentActionCount = 0;

    if (currentStepIndex >= TUTORIAL_STEPS.length) {
        isTransitioning = false;
        endTutorial();
        return;
    }

    // Berikan jeda singkat agar DOM / transisi modal sempat merender
    setTimeout(() => {
        if (state.isTutorialActive) {
            renderStep(currentStepIndex);
        }
    }, 50);
}

/**
 * Memberikan efek riak ekstra saat input valid diterima.
 */
function triggerFingertipPulse() {
    const pulseRing = document.querySelector('.pulse-ring');
    if (pulseRing) {
        pulseRing.style.animation = 'none';
        void pulseRing.offsetWidth;
        pulseRing.style.animation = 'pulseRing 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
}

/**
 * Memperbarui teks instruksi dan indikator progres.
 */
function updateProgressText(stepObj) {
    const tooltipText = document.getElementById('tutorial-text');
    if (!tooltipText) return;

    let progressStr = '';
    if (stepObj.reqCount > 1) {
        progressStr = `<br><span class="tutorial-progress">Hitungan: ${currentActionCount} / ${stepObj.reqCount}</span>`;
    }
    tooltipText.innerHTML = `<strong>${stepObj.title}</strong><br>${formatMathText(stepObj.text)}${progressStr}`;
}

/**
 * Merender sorotan (spotlight), tangan penunjuk, dan tooltip pada target.
 */
function renderStep(index) {
    const stepObj = TUTORIAL_STEPS[index];
    if (!stepObj) return;

    const overlay       = document.getElementById('tutorial-overlay');
    const highlight     = document.getElementById('tutorial-highlight');
    const tooltip       = document.getElementById('tutorial-tooltip');
    const handContainer = document.getElementById('tutorial-hand-container');
    const handImg       = document.getElementById('tutorial-hand-img');
    const pulseRing     = document.querySelector('.pulse-ring');

    if (!overlay || !highlight || !tooltip || !handContainer || !handImg) return;

    const targetEl = document.querySelector(stepObj.target);
    if (!targetEl || targetEl.offsetParent === null) {
        setTimeout(() => renderStep(index), 100);
        return;
    }

    if (renderStepTimeoutId) {
        clearTimeout(renderStepTimeoutId);
        renderStepTimeoutId = null;
    }

    // Bersihkan target sebelumnya & segera buka akses untuk target ini
    clearUnlocked();
    unlockElement(targetEl);

    // Pastikan target tampak HANYA jika berada di dalam kontainer yang dapat di-scroll
    // (misal di dalam modal struk), TANPA pernah menggulir window atau seluruh layar game
    scrollTargetIntoParentIfNeeded(targetEl);

    // Sembunyikan sementara tooltip & tangan selama jeda transisi
    tooltip.classList.add('hidden');
    handContainer.classList.add('hidden');

    // Berikan jeda waktu (250ms) sebelum menghitung getBoundingClientRect() dan meletakkan tooltip
    // karena modal (seperti struk transaksi) atau kontainer scroll memerlukan waktu untuk menyelesaikan animasi/transisi
    renderStepTimeoutId = setTimeout(() => {
        renderStepTimeoutId = null;
        if (!state.isTutorialActive || currentStepIndex !== index) return;
        isTransitioning = false;

        // Pastikan kembali posisi scroll aman stabil setelah layout settle
        scrollTargetIntoParentIfNeeded(targetEl);

        // Hitung koordinat relatif terhadap #app-container (dinormalisasi terhadap skala transform scale())
        const appContainer  = document.getElementById('app-container');
        const containerRect = appContainer.getBoundingClientRect();
        const targetRect    = targetEl.getBoundingClientRect();

        // Dapatkan faktor skala aktif dari auto-scaling (#app-container)
        let scale = 1;
        if (appContainer) {
            if (appContainer.dataset.scale) {
                scale = parseFloat(appContainer.dataset.scale) || 1;
            } else if (appContainer.offsetWidth) {
                scale = containerRect.width / appContainer.offsetWidth;
            }
        }
        if (!scale || scale <= 0) scale = 1;

        const canvasWidth  = appContainer ? (appContainer.offsetWidth || parseFloat(appContainer.dataset.virtualWidth) || 1280) : 1280;
        const canvasHeight = appContainer ? (appContainer.offsetHeight || parseFloat(appContainer.dataset.virtualHeight) || 720) : 720;
        const safeLeft     = Math.max(0, (canvasWidth - 1240) / 2);
        const safeRight    = safeLeft + 1240;

        const relTop  = (targetRect.top - containerRect.top) / scale;
        const relLeft = (targetRect.left - containerRect.left) / scale;
        const width   = targetRect.width / scale;
        const height  = targetRect.height / scale;
        const centerX = relLeft + width / 2;
        const centerY = relTop + height / 2;

        // 1. Posisikan Spotlight Cutout & SVG Cutout Mask
        highlight.style.top    = `${relTop - 6}px`;
        highlight.style.left   = `${relLeft - 6}px`;
        highlight.style.width  = `${width + 12}px`;
        highlight.style.height = `${height + 12}px`;

        const maskPath = document.getElementById('tutorial-mask-path');
        if (maskPath) {
            const pad = 6;
            const hx = Math.max(0, relLeft - pad);
            const hy = Math.max(0, relTop - pad);
            const hw = width + pad * 2;
            const hh = height + pad * 2;
            const r = 10;
            // Layar penuh 1280x720 + lubang persegi dengan sudut melengkung pada target (evenodd)
            maskPath.setAttribute('d',
                `M 0 0 H ${canvasWidth} V ${canvasHeight} H 0 Z ` +
                `M ${hx + r} ${hy} ` +
                `H ${hx + hw - r} Q ${hx + hw} ${hy} ${hx + hw} ${hy + r} ` +
                `V ${hy + hh - r} Q ${hx + hw} ${hy + hh} ${hx + hw - r} ${hy + hh} ` +
                `H ${hx + r} Q ${hx} ${hy + hh} ${hx} ${hy + hh - r} ` +
                `V ${hy + r} Q ${hx} ${hy} ${hx + r} ${hy} Z`
            );
        }

        // 2. Konfigurasi Tangan Penunjuk (Left: Kiri Atas | Right: Kanan Atas)
        const isLeft = stepObj.handPos === 'left';
        handImg.src       = isLeft ? 'image/indexfingerleft.svg' : 'image/indexfingerright.svg';
        handImg.className = `tutorial-hand-img ${isLeft ? 'hand-left' : 'hand-right'}`;

        if (pulseRing) {
            pulseRing.className = `pulse-ring ${isLeft ? 'pulse-left' : 'pulse-right'}`;
        }

        // Offset jari menunjuk tepat ke pusat elemen
        let handTop  = centerY + 4;
        let handLeft = isLeft ? (centerX + 4) : (centerX - 66);

        handContainer.style.top  = `${handTop}px`;
        handContainer.style.left = `${handLeft}px`;

        // 3. Teks Instruksi
        updateProgressText(stepObj);

        // 4. Ukur Dimensi Nyata Tooltip Secara Presisi (Hindari pembacaan 0 saat hidden)
        let tooltipWidth = 380;
        let tooltipHeight = 140;

        const prevDisplay = tooltip.style.display;
        const prevVis = tooltip.style.visibility;
        tooltip.style.visibility = 'hidden';
        tooltip.classList.remove('hidden');
        tooltip.style.display = 'block';

        const measuredRect = tooltip.getBoundingClientRect();
        if (measuredRect.width > 0 && measuredRect.height > 0) {
            tooltipWidth = (measuredRect.width / scale) || 380;
            tooltipHeight = (measuredRect.height / scale) || 140;
        }

        tooltip.style.visibility = prevVis;
        tooltip.style.display = prevDisplay;

        const maxLeftBound = canvasWidth - tooltipWidth - 20;
        const maxTopBound  = canvasHeight - tooltipHeight - 20;

        function rectsOverlap(r1, r2) {
            return !(
                r1.left + r1.width <= r2.left ||
                r1.left >= r2.left + r2.width ||
                r1.top + r1.height <= r2.top ||
                r1.top >= r2.top + r2.height
            );
        }

        // Zona Bounding Box Target (+ buffer 20px agar area sentuh jari tidak terhalang)
        const targetZone = {
            left: relLeft - 20,
            top: relTop - 20,
            width: width + 40,
            height: height + 40
        };

        // Zona Tangan Penunjuk (+ buffer 18px)
        const handZone = {
            left: handLeft - 18,
            top: handTop - 18,
            width: 68 + 36,
            height: 68 + 36
        };

        // Zona Proteksi Kontainer Khusus (Dompet Pelanggan, Laci Kasir, Struk Transaksi)
        let containerZone = null;

        // A. Jika target berada di dompet pelanggan (Step 4: Ambil Uang Pelanggan)
        const walletEl = targetEl.closest('.customer-wallet') || (stepObj.actionType === 'payMoney' ? document.querySelector('.customer-wallet') : null);
        if (walletEl) {
            const wRect = walletEl.getBoundingClientRect();
            containerZone = {
                left: (wRect.left - containerRect.left) / scale - 16,
                top: (wRect.top - containerRect.top) / scale - 16,
                width: wRect.width / scale + 32,
                height: wRect.height / scale + 32
            };
        }

        // B. Jika target berada di laci kasir (Step 7 & 8: Ambil Uang Kembalian)
        const laciEl = targetEl.closest('#laci-kasir') || (stepObj.actionType === 'giveChange' ? document.getElementById('laci-kasir') : null);
        if (laciEl && !laciEl.classList.contains('hidden')) {
            const lRect = laciEl.getBoundingClientRect();
            containerZone = {
                left: (lRect.left - containerRect.left) / scale - 16,
                top: (lRect.top - containerRect.top) / scale - 16,
                width: lRect.width / scale + 32,
                height: lRect.height / scale + 32
            };
        }

        // C. Jika target berada di struk transaksi (Step 6: Periksa Struk)
        const receiptCardEl = targetEl.closest('.final-receipt-card') || (stepObj.actionType === 'closeReceipt' ? document.querySelector('.final-receipt-card') : null);
        if (receiptCardEl) {
            const rcRect = receiptCardEl.getBoundingClientRect();
            containerZone = {
                left: (rcRect.left - containerRect.left) / scale - 20,
                top: (rcRect.top - containerRect.top) / scale - 20,
                width: rcRect.width / scale + 40,
                height: rcRect.height / scale + 40
            };
        }

        function isColliding(l, t, w, h) {
            const tipRect = { left: l, top: t, width: w, height: h };
            if (rectsOverlap(tipRect, targetZone)) return true;
            if (rectsOverlap(tipRect, handZone)) return true;
            if (containerZone && rectsOverlap(tipRect, containerZone)) return true;
            return false;
        }

        const candidates = [];

        if (walletEl && containerZone) {
            // STEP 4: AMBIL UANG PELANGGAN
            // Dompet pelanggan berada di kanan bawah.
            // Posisi terbaik: Tepat di samping KIRI dompet pelanggan (di atas nampan saji, dekat dan bebas rintangan)
            const leftOfWallet = containerZone.left - tooltipWidth - 22;
            candidates.push({ left: leftOfWallet, top: Math.max(16, Math.min(380, centerY - tooltipHeight / 2)) });
            candidates.push({ left: leftOfWallet, top: 400 });
            candidates.push({ left: leftOfWallet, top: 250 });
            candidates.push({ left: Math.max(safeLeft + 16, containerZone.left - tooltipWidth / 2 - 100), top: 210 });
        } else if (receiptCardEl && containerZone) {
            // STEP 6: STRUK TRANSAKSI
            // Struk berada di tengah layar. Letakkan di samping kiri atau samping kanan struk:
            candidates.push({ left: Math.max(safeLeft + 16, containerZone.left - tooltipWidth - 24), top: 180 });
            candidates.push({ left: Math.min(safeRight - tooltipWidth - 16, containerZone.left + containerZone.width + 24), top: 180 });
            candidates.push({ left: Math.max(safeLeft + 16, containerZone.left - tooltipWidth - 24), top: 270 });
            candidates.push({ left: Math.min(safeRight - tooltipWidth - 16, containerZone.left + containerZone.width + 24), top: 270 });
        } else if (laciEl && containerZone) {
            // STEP 7 & 8: AMBIL UANG DARI LACI KASIR
            // Laci kasir berada di kiri bawah. Letakkan tepat di samping KANAN laci (area nampan saji):
            const rightOfLaci = containerZone.left + containerZone.width + 24;
            candidates.push({ left: rightOfLaci, top: 420 });
            candidates.push({ left: rightOfLaci, top: Math.max(16, centerY - tooltipHeight / 2) });
            candidates.push({ left: rightOfLaci, top: 260 });
            candidates.push({ left: containerZone.left, top: 210 });
        } else if (targetEl.id === 'btn-final-checkout') {
            // STEP 5 & 9: TOMBOL KONFIRMASI CHECKOUT
            // Tombol di kiri bawah. Letakkan tepat di samping kanan tombol:
            candidates.push({ left: relLeft + width + 28, top: 460 });
            candidates.push({ left: relLeft + width + 28, top: 380 });
            candidates.push({ left: Math.max(safeLeft + 16, relLeft), top: 210 });
        } else if (targetEl.classList.contains('btn-calc')) {
            // STEP 3: TOMBOL "=" KALKULATOR
            // Tombol di numpad kiri bawah. Letakkan tepat di samping kanan numpad:
            candidates.push({ left: relLeft + width + 30, top: 460 });
            candidates.push({ left: relLeft + width + 30, top: 380 });
            candidates.push({ left: Math.max(safeLeft + 16, centerX - tooltipWidth / 2), top: 210 });
        } else if (targetEl.closest('.product-item')) {
            // STEP 2: KUE PADAMARAN DI RAK
            // Rak berada di atas. Letakkan tepat di BAWAH rak barang (dekat dan rapi):
            candidates.push({ left: Math.max(safeLeft + 16, Math.min(centerX - tooltipWidth / 2, maxLeftBound)), top: relTop + height + 20 });
            candidates.push({ left: Math.max(safeLeft + 16, relLeft - tooltipWidth - 24), top: relTop });
            candidates.push({ left: Math.min(maxLeftBound, relLeft + width + 24), top: relTop });
        } else if (targetEl.closest('.speech-bubble')) {
            // STEP 1: BALON PESAN PELANGGAN
            // Balon pesan di kanan atas. Letakkan tepat di samping KIRI balon pesan:
            candidates.push({ left: Math.max(safeLeft + 16, relLeft - tooltipWidth - 24), top: 60 });
            candidates.push({ left: Math.max(safeLeft + 16, relLeft - tooltipWidth - 24), top: 140 });
            candidates.push({ left: Math.max(safeLeft + 16, relLeft - 100), top: relTop + height + 20 });
        } else {
            // Fallback umum terdekat
            const gap = 20;
            candidates.push({ left: Math.max(safeLeft + 16, relLeft - tooltipWidth - gap), top: Math.max(16, centerY - tooltipHeight / 2) });
            candidates.push({ left: Math.min(maxLeftBound, relLeft + width + gap), top: Math.max(16, centerY - tooltipHeight / 2) });
            candidates.push({ left: Math.max(safeLeft + 16, Math.min(centerX - tooltipWidth / 2, maxLeftBound)), top: relTop - tooltipHeight - gap });
            candidates.push({ left: Math.max(safeLeft + 16, Math.min(centerX - tooltipWidth / 2, maxLeftBound)), top: relTop + height + gap });
        }

        let tipTop = 24;
        let tipLeft = safeLeft + 24;
        let foundSafePos = false;

        for (const cand of candidates) {
            const clampedL = Math.max(safeLeft + 16, Math.min(cand.left, maxLeftBound));
            const clampedT = Math.max(16, Math.min(cand.top, maxTopBound));

            if (!isColliding(clampedL, clampedT, tooltipWidth, tooltipHeight)) {
                tipLeft = clampedL;
                tipTop  = clampedT;
                foundSafePos = true;
                break;
            }
        }

        // Fallback darurat (jika semua posisi khusus tertolak)
        if (!foundSafePos) {
            if (centerY >= 340) {
                // Target di area bawah -> letakkan di atas area aman
                tipTop = 210;
                tipLeft = (centerX >= 640) ? Math.max(safeLeft + 16, centerX - tooltipWidth - 40) : Math.min(maxLeftBound, centerX + width + 40);
            } else {
                // Target di area atas -> letakkan di bawah area aman
                tipTop = 380;
                tipLeft = Math.max(safeLeft + 16, Math.min(centerX - tooltipWidth / 2, maxLeftBound));
            }
        }

        tooltip.style.top  = `${tipTop}px`;
        tooltip.style.left = `${tipLeft}px`;

        overlay.classList.remove('hidden');
        tooltip.classList.remove('hidden');
        handContainer.classList.remove('hidden');

        // Suara Interaktif Narator (Web Speech API) membacakan panduan setiap pergantian langkah
        const speechTitle = stepObj.title || '';
        const speechText = stepObj.text || '';
        speakNarrator(`${speechTitle}. ${speechText}`);
    }, 250);
}

/**
 * Menggulir kontainer modal internal jika target berada di dalam kontainer yang dapat di-scroll
 * (seperti modal struk belanja), sekaligus mengunci window/dokumen agar tidak bergeser sama sekali.
 * @param {HTMLElement} targetEl
 */
function scrollTargetIntoParentIfNeeded(targetEl) {
    if (!targetEl) return;

    const scrollParent = targetEl.closest('.final-receipt-card');
    if (scrollParent) {
        const pRect = scrollParent.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        if (tRect.bottom > pRect.bottom || tRect.top < pRect.top) {
            scrollParent.scrollTop += (tRect.top - pRect.top) - (pRect.height / 2 - tRect.height / 2);
        }
    }

    // Kunci mutlak agar window dan dokumen tidak pernah bergeser dari (0, 0)
    window.scrollTo(0, 0);
    if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
    if (document.documentElement.scrollTop !== 0)  document.documentElement.scrollTop = 0;
    if (document.body.scrollLeft !== 0)            document.body.scrollLeft = 0;
    if (document.body.scrollTop !== 0)             document.body.scrollTop = 0;
}

/**
 * Membuka akses interaksi untuk elemen target.
 */
function unlockElement(targetEl) {
    targetEl.classList.add('tutorial-unlocked');
    const compPos = window.getComputedStyle(targetEl).position;
    if (compPos === 'static') {
        targetEl.dataset.tutAddedRel = 'true';
        targetEl.style.setProperty('position', 'relative', 'important');
    }
    targetEl.style.setProperty('pointer-events', 'auto', 'important');
}

/**
 * Mengembalikan styling z-index dan menghapus class .tutorial-unlocked.
 */
function clearUnlocked() {
    document.querySelectorAll('.tutorial-unlocked').forEach(el => {
        el.classList.remove('tutorial-unlocked');
        if (el.dataset.tutAddedRel === 'true') {
            el.style.removeProperty('position');
            delete el.dataset.tutAddedRel;
        }
        el.style.removeProperty('z-index');
        el.style.removeProperty('pointer-events');
    });

    unlockedParents.forEach(p => {
        p.classList.remove('tutorial-unlocked-parent');
        if (p.dataset.tutOrigZ !== undefined && p.dataset.tutOrigZ !== '') {
            p.style.zIndex = p.dataset.tutOrigZ;
        } else {
            p.style.removeProperty('z-index');
        }
        if (p.dataset.tutOrigPos !== undefined && p.dataset.tutOrigPos !== '') {
            p.style.position = p.dataset.tutOrigPos;
        } else {
            p.style.removeProperty('position');
        }
        if (p.dataset.tutOrigPE !== undefined && p.dataset.tutOrigPE !== '') {
            p.style.pointerEvents = p.dataset.tutOrigPE;
        } else {
            p.style.removeProperty('pointer-events');
        }
        delete p.dataset.tutOrigZ;
        delete p.dataset.tutOrigPos;
        delete p.dataset.tutOrigPE;
    });
    unlockedParents = [];
}

/**
 * Memperbarui posisi overlay jika ukuran layar berubah / fullscreen.
 */
function updateTutorialPosition() {
    if (state.isTutorialActive && TUTORIAL_STEPS[currentStepIndex]) {
        renderStep(currentStepIndex);
    }
}

/**
 * Melewati tutorial secara langsung dan mengembalikan kontrol ke pemain (hanya fallback internal).
 */
function skipTutorial() {
    endTutorial();
}

/**
 * Mengakhiri tutorial dan menyembunyikan overlay.
 */
function endTutorial() {
    state.isTutorialActive = false;
    isTransitioning = false;
    currentStepIndex = 0;
    currentActionCount = 0;

    if (renderStepTimeoutId) {
        clearTimeout(renderStepTimeoutId);
        renderStepTimeoutId = null;
    }

    clearUnlocked();
    stopNarrator();

    const overlay       = document.getElementById('tutorial-overlay');
    const tooltip       = document.getElementById('tutorial-tooltip');
    const handContainer = document.getElementById('tutorial-hand-container');
    const maskPath      = document.getElementById('tutorial-mask-path');

    if (overlay) overlay.classList.add('hidden');
    if (tooltip) tooltip.classList.add('hidden');
    if (handContainer) handContainer.classList.add('hidden');
    if (maskPath) maskPath.setAttribute('d', '');
}

/**
 * Menginisialisasi event tutorial (responsif resize & fullscreen).
 * Catatan: Tombol lewati telah dihapus agar panduan bersifat wajib (action-gated).
 */
function initTutorialEvents() {
    window.addEventListener('resize', updateTutorialPosition);
    document.addEventListener('fullscreenchange', updateTutorialPosition);
    document.addEventListener('webkitfullscreenchange', updateTutorialPosition);
    document.addEventListener('mozfullscreenchange', updateTutorialPosition);
    document.addEventListener('MSFullscreenChange', updateTutorialPosition);
}


// ==========================================
// FILE: js/ui/levelZero.js
// ==========================================
// ==========================================
// ui/levelZero.js — Modul Materi Pengantar Level 0
// Konsep Aljabar Kasir: Koefisien, Variabel, Konstanta
// & Simulasi Interaktif Pencocokan Nilai (5x = 25.000)
// ==========================================



let currentStage = 1;
let cakeSlots = [false, false, false, false, false];
let allocatedCount = 0;
let isLevelZeroInitialized = false;

const NARRATIONS = {
    1: 'Level 0: Pengenalan Konsep Aljabar Kasir. Mari pahami tiga komponen aljabar: Koefisien adalah banyaknya barang yang dibeli pelanggan, Variabel adalah nilai harga satuan barang yang belum diketahui kasir, dan Konstanta adalah biaya tambahan yang nilainya tetap pasti seperti kantong belanja.',
    2: 'Tahap 2: Simulasi Pencocokan Nilai. Pelanggan membeli 5 kotak kue seharga total 25 ribu rupiah. Persamaannya adalah 5x = 25.000. Bagikan pecahan uang 5 ribu rupiah ke setiap kotak kue untuk menemukan harga satuannya!',
    success2: 'Luar biasa! Seluruh 5 kotak kue tepat dipasangkan dengan uang 5 ribu rupiah. Total belanja pas 25 ribu rupiah. Klik Periksa Pembuktian untuk melihat kesimpulan aljabar!',
    3: 'Tahap 3: Pembuktian Matematis. Persamaan 5x = 25.000, kedua ruas dibagi 5 sehingga diperoleh nilai x = 5.000. Variabel x terbukti adalah harga satuan 1 kue yaitu 5 ribu rupiah. Sekarang kamu siap melayani transaksi di Level 1!'
};

/**
 * Membuka modal materi pengantar Level 0.
 */
function openLevelZeroModal() {
    const modal = document.getElementById('modal-level-zero');
    if (!modal) return;

    modal.classList.remove('hidden');
    goToStage(1);
    playSFX('nav');
}

/**
 * Menutup modal materi pengantar Level 0.
 */
function closeLevelZeroModal() {
    const modal = document.getElementById('modal-level-zero');
    if (modal) modal.classList.add('hidden');
    stopNarrator();
}

/**
 * Berpindah ke tahap materi tertentu (1, 2, atau 3).
 * @param {number} stageNum
 */
function goToStage(stageNum) {
    currentStage = Math.max(1, Math.min(stageNum, 3));

    // Update Nav Bar Info (Sebelumnya & Setelahnya)
    const prevBtn = document.getElementById('btn-zero-nav-prev');
    const nextBtn = document.getElementById('btn-zero-nav-next');
    const badgeEl = document.getElementById('zero-nav-badge');
    const titleEl = document.getElementById('zero-nav-title-text');

    const STAGE_TITLES = {
        1: '3 Komponen Aljabar',
        2: 'Simulasi Pencocokan',
        3: 'Kesimpulan Aljabar'
    };

    if (badgeEl) badgeEl.textContent = `Tahap ${currentStage} / 3`;
    if (titleEl) titleEl.textContent = STAGE_TITLES[currentStage] || '';

    if (prevBtn) {
        if (currentStage === 1) {
            prevBtn.disabled = true;
            prevBtn.style.visibility = 'hidden';
        } else {
            prevBtn.disabled = false;
            prevBtn.style.visibility = 'visible';
            prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Sebelumnya';
        }
    }

    if (nextBtn) {
        if (currentStage === 3) {
            nextBtn.innerHTML = '<i class="fa-solid fa-cash-register"></i> Mulai Level 1';
            nextBtn.classList.add('btn-start-game-glow');
        } else {
            nextBtn.innerHTML = 'Setelahnya <i class="fa-solid fa-arrow-right"></i>';
            nextBtn.classList.remove('btn-start-game-glow');
        }
        nextBtn.disabled = false;
    }

    // Toggle Stage Containers
    for (let s = 1; s <= 3; s++) {
        const stageEl = document.getElementById(`zero-stage-${s}`);
        if (stageEl) {
            if (s === currentStage) {
                stageEl.classList.remove('hidden');
            } else {
                stageEl.classList.add('hidden');
            }
        }
    }

    // Scroll ke atas
    const scrollContainer = document.querySelector('.level-zero-content-scroll');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // Logika Khusus per Tahap
    if (currentStage === 2) {
        initSimulation();
    }

    // Web Speech API: Bacakan narasi otomatis
    const narrationText = NARRATIONS[currentStage];
    if (narrationText) {
        speakNarrator(narrationText);
    }
}

/**
 * Inisialisasi dan render area simulasi tahap 2 (5 kue & 5 uang Rp 5.000).
 */
function initSimulation() {
    renderCakeSlots();
    renderMoneyTray();
    updateSimulationProgress();
}

/**
 * Merender 5 slot kotak kue.
 */
function renderCakeSlots() {
    const container = document.getElementById('sim-cakes-grid');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const isFilled = cakeSlots[i];
        const card = document.createElement('div');
        card.className = `cake-slot-card ${isFilled ? 'filled' : ''}`;
        card.title = isFilled ? `Kue ${i + 1} (Klik untuk menarik uang Rp 5.000)` : `Kue ${i + 1} (Klik untuk mencocokkan Rp 5.000)`;

        card.innerHTML = `
            <img src="assets/barangbelanja/padamaran.png" alt="Kue ${i + 1}" class="cake-slot-img">
            <span class="cake-slot-title">Kue ${i + 1}</span>
            <div class="cake-drop-target ${isFilled ? 'filled' : ''}">
                ${isFilled 
                    ? `<div class="cake-drop-badge"><i class="fa-solid fa-check"></i> Rp 5.000</div>` 
                    : `<span style="font-size:0.75rem; color:#94a3b8;"><i class="fa-solid fa-plus"></i> Rp ?</span>`}
            </div>
        `;

        card.addEventListener('click', () => {
            if (isFilled) {
                // Tarik uang kembali dari slot ini
                cakeSlots[i] = false;
                allocatedCount--;
                playSFX('clear_back');
            } else {
                // Isi slot ini dengan Rp 5.000 jika masih ada slot kosong
                if (allocatedCount < 5) {
                    cakeSlots[i] = true;
                    allocatedCount++;
                    playSFX('money_cash');
                }
            }
            renderCakeSlots();
            renderMoneyTray();
            updateSimulationProgress();
        });

        container.appendChild(card);
    }
}

/**
 * Merender 5 lembar uang Rp 5.000 di baki kasir.
 */
function renderMoneyTray() {
    const tray = document.getElementById('sim-cash-tray');
    if (!tray) return;

    tray.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const isUsed = i < allocatedCount;
        const bill = document.createElement('div');
        bill.className = `sim-bill-item ${isUsed ? 'used' : ''}`;
        bill.title = isUsed ? 'Uang sudah dialokasikan ke kue' : 'Klik untuk mengalokasikan Rp 5.000 ke kue';

        bill.innerHTML = `<img src="assets/rupiah/rp5000.png" alt="Rp 5.000">`;

        if (!isUsed) {
            bill.addEventListener('click', () => {
                // Cari slot kue kosong pertama
                const emptyIdx = cakeSlots.findIndex(slot => !slot);
                if (emptyIdx !== -1) {
                    cakeSlots[emptyIdx] = true;
                    allocatedCount++;
                    playSFX('money_cash');
                    renderCakeSlots();
                    renderMoneyTray();
                    updateSimulationProgress();
                }
            });
        }

        tray.appendChild(bill);
    }
}

/**
 * Memperbarui progress bar, label status, dan mengaktifkan tombol berikutnya jika selesai.
 */
function updateSimulationProgress() {
    const progressFill = document.getElementById('sim-progress-fill');
    const statusLabel = document.getElementById('sim-status-label');
    const walletCount = document.getElementById('sim-wallet-count');
    const hintText = document.getElementById('sim-instructions-hint');
    const nextBtn = document.getElementById('btn-zero-goto-stage-3');

    const pct = (allocatedCount / 5) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;

    const totalAllocatedRupiah = allocatedCount * 5000;
    if (walletCount) {
        walletCount.innerHTML = `Teralokasi: <strong>${allocatedCount} / 5</strong> Kue (Rp ${totalAllocatedRupiah.toLocaleString('id-ID')} / Rp 25.000)`;
    }

    if (allocatedCount === 5) {
        if (statusLabel) {
            statusLabel.className = 'sim-status-label complete';
            statusLabel.innerHTML = '<i class="fa-solid fa-circle-check"></i> Pas! 5 kue x Rp 5.000 = Rp 25.000';
        }
        if (hintText) {
            hintText.innerHTML = '<span style="color:#059669; font-weight:500;"><i class="fa-solid fa-star"></i> Sempurna! Semua 5 kue tepat teralokasi masing-masing Rp 5.000.</span>';
        }
        if (nextBtn) {
            nextBtn.disabled = false;
        }

        playSFX('success_quiz_change');
        speakNarrator(NARRATIONS.success2);
    } else {
        if (statusLabel) {
            statusLabel.className = 'sim-status-label';
            statusLabel.textContent = allocatedCount === 0 ? 'Belum dialokasikan' : `Sisa ${5 - allocatedCount} kue belum terisi`;
        }
        if (hintText) {
            hintText.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Klik lembar uang Rp 5.000 di atas atau klik kotak kue untuk mencocokkan harga!';
        }
        if (nextBtn) {
            nextBtn.disabled = true;
        }
    }
}

/**
 * Reset simulasi ke kondisi awal (0/5 teralokasi).
 */
function resetSimulation() {
    cakeSlots = [false, false, false, false, false];
    allocatedCount = 0;
    playSFX('clear_back');
    renderCakeSlots();
    renderMoneyTray();
    updateSimulationProgress();
}

/**
 * Mengikat seluruh event listener untuk modul Level 0.
 */
function initLevelZeroEvents() {
    if (isLevelZeroInitialized) return;
    isLevelZeroInitialized = true;

    // Tombol Tutup X
    document.getElementById('btn-close-level-zero')?.addEventListener('click', closeLevelZeroModal);

    // Klik Backdrop untuk menutup
    document.getElementById('modal-level-zero')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-level-zero') {
            closeLevelZeroModal();
        }
    });

    // Navigasi Top Nav Bar (Sebelumnya & Setelahnya)
    document.getElementById('btn-zero-nav-prev')?.addEventListener('click', () => {
        if (currentStage > 1) {
            goToStage(currentStage - 1);
            playSFX('nav');
        }
    });

    document.getElementById('btn-zero-nav-next')?.addEventListener('click', () => {
        if (currentStage === 1) {
            goToStage(2);
            playSFX('nav');
        } else if (currentStage === 2) {
            goToStage(3);
            playSFX('badge_reward');
        } else if (currentStage === 3) {
            closeLevelZeroModal();
            playSFX('calc_checkout');
            if (typeof window._startLevel === 'function') {
                window._startLevel(1);
            }
        }
    });

    // Navigasi Tahap 1 -> Tahap 2
    document.getElementById('btn-zero-goto-stage-2')?.addEventListener('click', () => {
        goToStage(2);
        playSFX('nav');
    });

    // Navigasi Tahap 2 -> Tahap 1
    document.getElementById('btn-zero-back-to-1')?.addEventListener('click', () => {
        goToStage(1);
        playSFX('nav');
    });

    // Reset Simulasi di Tahap 2
    document.getElementById('btn-zero-reset-sim')?.addEventListener('click', resetSimulation);

    // Navigasi Tahap 2 -> Tahap 3
    document.getElementById('btn-zero-goto-stage-3')?.addEventListener('click', () => {
        if (allocatedCount === 5) {
            goToStage(3);
            playSFX('badge_reward');
        }
    });

    // Navigasi Tahap 3 -> Tahap 2 (Ulangi Simulasi)
    document.getElementById('btn-zero-back-to-2')?.addEventListener('click', () => {
        goToStage(2);
        resetSimulation();
        playSFX('nav');
    });

    // Tombol Mulai Tantangan Level 1 dari Tahap 3
    document.getElementById('btn-zero-start-level-1')?.addEventListener('click', () => {
        closeLevelZeroModal();
        playSFX('calc_checkout');
        if (typeof window._startLevel === 'function') {
            window._startLevel(1);
        }
    });

    // Tombol Narator di Header Modal
    const narrateBtn = document.getElementById('btn-level-zero-narrate');
    if (narrateBtn) {
        narrateBtn.addEventListener('click', () => {
            playSFX('nav');
            const txt = NARRATIONS[currentStage];
            if (txt) {
                speakNarrator(txt);
            }
        });
    }

    // Tombol Buka Level 0 dari Banner Layar Level
    document.getElementById('btn-open-level-0')?.addEventListener('click', () => {
        openLevelZeroModal();
    });
}



// ==========================================
// FILE: js/ui/screens.js
// ==========================================
// ==========================================
// ui/screens.js — Navigasi & Render Layar
// ==========================================




/**
 * Menampilkan modal pesan umum.
 * @param {string} title
 * @param {string} desc
 * @param {Function|null} onCloseCallback
 */
function showMsg(title, desc, onCloseCallback = null) {
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
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');

    if (id === 'modal-join-room') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            updateUniversalSettingsContext(activeScreen.id);
        }
    }
}

/**
 * Memperbarui tombol aksi kontekstual pada modal pengaturan berdasarkan layar aktif.
 * @param {string} screenId
 */
function updateUniversalSettingsContext(screenId) {
    const btnUniversalSettings = document.getElementById('btn-universal-settings');
    const modalJoinRoom = document.getElementById('modal-join-room');
    const isJoinRoomOpen = modalJoinRoom && !modalJoinRoom.classList.contains('hidden');

    if (btnUniversalSettings) {
        if (
            isJoinRoomOpen ||
            screenId === 'screen-welcome' ||
            screenId === 'screen-fasilitator' ||
            screenId === 'screen-levels' ||
            screenId === 'screen-bukukas' ||
            screenId === 'screen-prestasi'
        ) {
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
        if (screenId !== 'screen-login' && screenId !== 'screen-welcome' && screenId !== 'screen-fasilitator') {
            btnSwitchUser.classList.remove('hidden');
        } else {
            btnSwitchUser.classList.add('hidden');
        }
    }

    if (btnExitGame) {
        btnExitGame.classList.remove('hidden');
        if (screenId === 'screen-game') {
            btnExitGame.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Selesaikan Permainan';
            btnExitGame.title = 'Selesaikan Permainan dan Kembali ke Menu Level';
        } else {
            btnExitGame.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i> Keluar Game';
            btnExitGame.title = 'Keluar dari Permainan';
        }
    }
}

/**
 * Berpindah ke layar yang ditentukan.
 * @param {string} screenId
 */
function switchScreen(screenId) {
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
function renderUserList() {
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
                <div class="user-meta">Kelas ${u.kelas || '-'} • Lvl ${u.maxLevel || 1} • Rp ${u.money.toLocaleString('id-ID')}</div>
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
function showBadgeUnlockedPopup(badge) {
    if (!badge) return;
    const container = document.getElementById('badge-toast-container');
    if (!container) return;

    playSFX('badge_reward');

    const toast = document.createElement('div');
    toast.className = 'badge-toast animate-badge-pop';
    const iconHtml = badge.badgeImg
        ? `<img src="${badge.badgeImg}" class="badge-tier-img" alt="${badge.name}">`
        : `<i class="fa-solid ${badge.icon || 'fa-award'}"></i>`;
    toast.innerHTML = `
        <div class="badge-toast-glow"></div>
        <div class="badge-toast-icon-wrapper ${badge.badgeImg ? 'has-tier-img' : (badge.colorClass || 'icon-gold')}">
            ${iconHtml}
        </div>
        <div class="badge-toast-content">
            <div class="badge-toast-tag"><i class="fa-solid fa-star"></i> LENCANA TIER ${badge.tier || 1} DIBUKA!</div>
            <h4 class="badge-toast-name">${badge.name}</h4>
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
function renderLobby() {
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
function renderLevels() {
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
            tabHard.innerHTML = 'Tantangan Sulit <i class="fa-solid fa-lock"></i>';
            tabHard.title = 'Selesaikan 10 Level Tantangan Mudah untuk membuka!';
        } else {
            tabHard.className = state.currentLevelTab === 'hard' ? 'tab-active tab-hard-theme' : 'tab-inactive';
            tabHard.innerHTML = 'Tantangan Sulit <i class="fa-solid fa-fire text-amber-400"></i>';
            tabHard.removeAttribute('title');
        }
    }

    // Tentukan rentang level yang ditampilkan berdasarkan tab
    const isHardMode = state.currentLevelTab === 'hard';
    const startLevel = isHardMode ? 11 : 1;
    const endLevel   = isHardMode ? 20 : 10;

    // HILANGKAN banner pengantar Level 0 untuk semua device
    const bannerLevel0 = document.getElementById('btn-open-level-0');
    if (bannerLevel0) {
        bannerLevel0.style.display = 'none';
    }

    // TETAP PERTAHANKAN tombol bulat Level 0 di dalam grid tantangan (khusus tab Easy)
    if (!isHardMode) {
        const btnZero = document.createElement('button');
        btnZero.className = "btn-level-intro-grid";
        btnZero.innerHTML = `<span>0</span><div class="level-stars"><i class="fa-solid fa-graduation-cap"></i> Pengantar</div>`;
        btnZero.title = "Level 0: Materi Pengantar Konsep Aljabar";
        btnZero.addEventListener('click', () => {
            playSFX('nav');
            if (typeof window._openLevelZero === 'function') {
                window._openLevelZero();
            }
        });
        container.appendChild(btnZero);
    }

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



// ==========================================
// FILE: js/ui/victory.js
// ==========================================
// ==========================================
// ui/victory.js — Layar Kemenangan (Victory Screen)
// Animasi Bintang Bertahap & Tally Counter Skor
// ==========================================



let activeTimeouts = [];
let activeRafIds = [];
let currentVictoryState = null;
let isAnimatingVictory = false;
let lastTickSfxTime = 0;

/**
 * Membatalkan seluruh timer dan requestAnimationFrame aktif pada layar kemenangan
 * untuk mencegah kebocoran memori (memory leak) saat pemain menutup modal lebih awal.
 */
function clearVictoryTimers() {
    while (activeTimeouts.length > 0) {
        clearTimeout(activeTimeouts.pop());
    }
    while (activeRafIds.length > 0) {
        cancelAnimationFrame(activeRafIds.pop());
    }
    isAnimatingVictory = false;
}

/**
 * Helper penjadwalan timeout yang otomatis tercatat agar mudah dibersihkan.
 * @param {Function} fn
 * @param {number} delayMs
 */
function scheduleVictoryTimeout(fn, delayMs) {
    const id = setTimeout(() => {
        const idx = activeTimeouts.indexOf(id);
        if (idx !== -1) activeTimeouts.splice(idx, 1);
        fn();
    }, delayMs);
    activeTimeouts.push(id);
    return id;
}

/**
 * Format durasi detik ke tampilan ringkas (contoh: "45s" atau "1m 20s").
 * @param {number} sec
 * @returns {string}
 */
function formatVictoryDuration(sec) {
    const total = Math.max(0, Math.round(Number(sec) || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

/**
 * Menganimasikan kenaikan angka dari nilai awal ke nilai akhir secara mulus (easeOutCubic).
 * @param {HTMLElement|null} element Elemen target
 * @param {number} start Nilai awal
 * @param {number} end Nilai akhir
 * @param {number} duration Durasi animasi dalam ms
 * @param {(val: number) => string} formatter Fungsi pemformat teks
 * @param {boolean} [withTickSound=false] Apakah memutar suara tick selama berhitung
 */
function animateNumber(element, start, end, duration, formatter, withTickSound = false) {
    if (!element) return () => {};
    const fmt = typeof formatter === 'function' ? formatter : (v) => String(v);

    if (duration <= 0 || start === end) {
        element.textContent = fmt(end);
        return () => {};
    }

    const startTime = performance.now();
    let rafId = null;

    const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(Math.max(elapsed / duration, 0), 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(start + (end - start) * eased);

        element.textContent = fmt(currentVal);

        if (withTickSound && progress < 1) {
            const nowMs = Date.now();
            if (nowMs - lastTickSfxTime >= 95) {
                lastTickSfxTime = nowMs;
                playSFX('tally_tick');
            }
        }

        if (progress < 1) {
            rafId = requestAnimationFrame(step);
            activeRafIds.push(rafId);
        }
    };

    rafId = requestAnimationFrame(step);
    activeRafIds.push(rafId);

    return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
    };
}

/**
 * Langsung menampilkan kondisi akhir seluruh bintang dan angka pada modal kemenangan
 * (dipanggil saat pengguna menekan kartu untuk melewati animasi atau saat reduced-motion aktif).
 */
function finishVictoryAnimationImmediately() {
    if (!currentVictoryState) return;
    clearVictoryTimers();

    const { stars, accuracy, quizCorrect, quizTotal, duration, profit } = currentVictoryState;

    const starSlots = document.querySelectorAll('#vc-stars-container .victory-star-slot');
    starSlots.forEach((slot) => {
        const starIdx = Number(slot.dataset.star) || 0;
        if (starIdx <= stars) {
            slot.classList.add('earned');
        } else {
            slot.classList.remove('earned');
        }
    });

    const statBoxes = document.querySelectorAll('#vc-stats-grid .victory-stat-box');
    statBoxes.forEach((box) => box.classList.add('stat-visible'));

    const accEl = document.getElementById('vc-accuracy');
    const quizEl = document.getElementById('vc-quiz');
    const timeEl = document.getElementById('vc-time');
    const profitEl = document.getElementById('vc-profit');

    if (accEl) accEl.textContent = `${accuracy}%`;
    if (quizEl) quizEl.textContent = quizTotal > 0 ? `${quizCorrect} / ${quizTotal}` : 'Tanpa Kuis';
    if (timeEl) timeEl.textContent = formatVictoryDuration(duration);
    if (profitEl) profitEl.textContent = `Rp ${profit.toLocaleString('id-ID')}`;

    const btnNext = document.getElementById('btn-vc-next');
    if (btnNext && !btnNext.classList.contains('hidden')) {
        btnNext.classList.add('btn-start-game-glow');
    }
}

/**
 * Menampilkan modal penyelesaian level (Victory Screen) beserta animasi bintang dan tally counter.
 * @param {{
 *   level: number,
 *   stars: 1|2|3,
 *   accuracy: number,
 *   quizCorrect: number,
 *   quizTotal: number,
 *   duration: number,
 *   profit: number,
 *   hasNextLevel: boolean,
 *   unlockedHardJustNow?: boolean
 * }} result
 */
function showVictoryScreen(result) {
    clearVictoryTimers();
    currentVictoryState = { ...result };

    const modal = document.getElementById('modal-level-complete');
    if (!modal) return;

    const levelPill = document.getElementById('vc-level-pill');
    const titleEl = document.getElementById('vc-title');
    const subtitleEl = document.getElementById('vc-subtitle');
    const accEl = document.getElementById('vc-accuracy');
    const quizEl = document.getElementById('vc-quiz');
    const timeEl = document.getElementById('vc-time');
    const profitEl = document.getElementById('vc-profit');
    const btnNext = document.getElementById('btn-vc-next');

    const { level, stars, accuracy, quizCorrect, quizTotal, duration, profit, hasNextLevel } = result;

    if (levelPill) levelPill.textContent = `LEVEL ${level}`;

    if (titleEl) {
        if (stars === 3) titleEl.textContent = 'Level Selesai Sempurna!';
        else if (stars === 2) titleEl.textContent = 'Level Selesai!';
        else titleEl.textContent = 'Level Tuntas!';
    }

    if (subtitleEl) {
        if (stars === 3) {
            subtitleEl.textContent = 'Luar biasa! Perhitungan aljabar dan kuismu sangat teliti!';
        } else if (stars === 2) {
            subtitleEl.textContent = 'Kerja bagus! Sedikit lagi menuju bintang tiga sempurna!';
        } else {
            subtitleEl.textContent = 'Transaksi selesai! Ayo tingkatkan lagi ketelitian aljabarmu!';
        }
    }

    // Reset tampilan awal slot bintang dan kotak statistik
    const starSlots = document.querySelectorAll('#vc-stars-container .victory-star-slot');
    starSlots.forEach((slot) => slot.classList.remove('earned'));

    const statBoxes = document.querySelectorAll('#vc-stats-grid .victory-stat-box');
    statBoxes.forEach((box) => box.classList.remove('stat-visible'));

    if (accEl) accEl.textContent = '0%';
    if (quizEl) quizEl.textContent = quizTotal > 0 ? `0 / ${quizTotal}` : 'Tanpa Kuis';
    if (timeEl) timeEl.textContent = '0s';
    if (profitEl) profitEl.textContent = 'Rp 0';

    if (btnNext) {
        btnNext.classList.remove('btn-start-game-glow');
        if (hasNextLevel) {
            btnNext.classList.remove('hidden');
            const spanLabel = btnNext.querySelector('span');
            if (spanLabel) spanLabel.textContent = `Lanjut Level ${level + 1}`;
        } else {
            btnNext.classList.add('hidden');
        }
    }

    modal.classList.remove('hidden');

    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        finishVictoryAnimationImmediately();
        playSFX('victory');
        return;
    }

    isAnimatingVictory = true;

    // 1. Munculkan bintang 1..3 secara bertahap dengan efek suara pop
    for (let i = 1; i <= stars; i++) {
        scheduleVictoryTimeout(() => {
            const slot = document.querySelector(`#vc-stars-container .victory-star-slot[data-star="${i}"]`);
            if (slot) slot.classList.add('earned');
            playSFX('star_pop');
        }, 320 + (i - 1) * 340);
    }

    // 2. Munculkan kotak statistik satu per satu + jalankan tally counter angka
    const statStartBase = 520;
    statBoxes.forEach((box, idx) => {
        scheduleVictoryTimeout(() => {
            box.classList.add('stat-visible');
        }, statStartBase + idx * 110);
    });

    scheduleVictoryTimeout(() => {
        animateNumber(accEl, 0, accuracy, 850, (v) => `${v}%`, false);
        if (quizTotal > 0) {
            animateNumber(quizEl, 0, quizCorrect, 650, (v) => `${v} / ${quizTotal}`, false);
        }
        animateNumber(timeEl, 0, duration, 850, (v) => formatVictoryDuration(v), false);
        animateNumber(
            profitEl,
            0,
            profit,
            1050,
            (v) => `Rp ${v.toLocaleString('id-ID')}`,
            true
        );
    }, statStartBase + 120);

    // 3. Fanfar penyelesaian & highlight tombol Lanjut
    const totalAnimTime = Math.max(320 + stars * 340, statStartBase + 1150);
    scheduleVictoryTimeout(() => {
        isAnimatingVictory = false;
        playSFX('victory');
        if (btnNext && !btnNext.classList.contains('hidden')) {
            btnNext.classList.add('btn-start-game-glow');
        }
    }, totalAnimTime);
}

/**
 * Menutup modal layar kemenangan dan membersihkan seluruh timer animasi.
 */
function closeVictoryScreen() {
    clearVictoryTimers();
    const modal = document.getElementById('modal-level-complete');
    if (modal) modal.classList.add('hidden');
}

/**
 * Mengikat event listener untuk tombol-tombol pada modal kemenangan.
 * @param {{
 *   onRetry?: (level: number) => void,
 *   onMenu?: (stateObj: Object) => void,
 *   onNext?: (nextLevel: number, stateObj: Object) => void
 * }} handlers
 */
function initVictoryListeners(handlers = {}) {
    const card = document.getElementById('victory-card');
    const btnRetry = document.getElementById('btn-vc-retry');
    const btnMenu = document.getElementById('btn-vc-menu');
    const btnNext = document.getElementById('btn-vc-next');

    // Klik pada kartu saat animasi masih berjalan akan langsung melompat ke hasil akhir
    if (card) {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (isAnimatingVictory) {
                finishVictoryAnimationImmediately();
            }
        });
    }

    if (btnRetry) {
        btnRetry.addEventListener('click', () => {
            playSFX('nav');
            const lvl = currentVictoryState ? currentVictoryState.level : 1;
            closeVictoryScreen();
            if (typeof handlers.onRetry === 'function') {
                handlers.onRetry(lvl);
            }
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            playSFX('nav');
            const snap = currentVictoryState;
            closeVictoryScreen();
            if (typeof handlers.onMenu === 'function') {
                handlers.onMenu(snap);
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            playSFX('calc_checkout');
            const snap = currentVictoryState;
            const nextLvl = snap ? snap.level + 1 : 2;
            closeVictoryScreen();
            if (typeof handlers.onNext === 'function') {
                handlers.onNext(nextLvl, snap);
            }
        });
    }
}



// ==========================================
// FILE: js/ui/cashier.js
// ==========================================
// ==========================================
// ui/cashier.js — Mesin Kasir & Gameplay
// ==========================================











// ==========================================
// FOKUS INPUT
// ==========================================

function setFocus(inputElement) {
    if (!inputElement) return;
    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    state.activeInput  = inputElement;
    if (formulaInput) formulaInput.classList.remove("input-active");
    if (paidInput)    paidInput.classList.remove("input-active");
    inputElement.classList.add("input-active");
}

// ==========================================
// LOAD PELANGGAN
// ==========================================

function loadCustomer() {
    const customer = state.levelCustomers[state.currentCustomerIdx];
    state.currentLevelParams.order      = customer.order || {};
    state.currentLevelParams.errorCount = 0;
    state.uangDibayarDetail             = customer.uangDibayarDetail;
    state.selectedProducts              = [];

    const speechBubble = document.querySelector('.speech-bubble');
    if (speechBubble) speechBubble.innerHTML = formatMathText(customer.text);

    const npcImage = document.querySelector('.npc-image');
    if (npcImage && customer.image) npcImage.src = customer.image;

    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    const hargaDisplay = document.getElementById("harga-display");
    const labelHarga   = document.getElementById("label-harga");
    const trayItems    = document.getElementById("tray-items");

    if (formulaInput) {
        formulaInput.value = "";
        formulaInput.classList.remove("input-error");
    }
    if (paidInput)    paidInput.value    = "";
    if (labelHarga)   labelHarga.textContent = "Harga:";
    if (hargaDisplay) { hargaDisplay.textContent = ""; hargaDisplay.style.color = "#a5d6a7"; }
    if (trayItems)    trayItems.innerHTML = "";
    renderProdukDiNampan();

    updateVariableHelperSubtext();

    const walletContainer = document.getElementById("wallet-container-dynamic");
    if (walletContainer) {
        walletContainer.innerHTML = "";
        const daftarPecahan = Object.keys(state.uangDibayarDetail).map(Number).sort((a, b) => b - a);

        daftarPecahan.forEach(pecahan => {
            let jumlahLembar = state.uangDibayarDetail[pecahan];
            for (let i = 0; i < jumlahLembar; i++) {
                let imgSrc      = `assets/rupiah/rp${pecahan}.png`;
                let fallbackImg = `https://placehold.co/200x60/c8e6c9/2e7d32?text=Rp+${pecahan.toLocaleString('id-ID')}`;
                let randomRotate = (Math.random() * 6 - 3).toFixed(1);
                const div = document.createElement('div');
                div.className = "img-placeholder money-5k";
                div.style.cssText = `transform: rotate(${randomRotate}deg); margin-bottom: -45px; background: transparent; border: none; cursor: pointer; transition: opacity 0.2s;`;
                div.innerHTML = `<img src="${imgSrc}" class="money" onerror="this.src='${fallbackImg}'" alt="Uang Rp${pecahan}">`;
                div.addEventListener('click', () => tambahUangPelanggan(pecahan, div));
                walletContainer.appendChild(div);
            }
        });

        state.kembalianModeActive = false;
        document.getElementById("numpad-container").classList.remove("hidden");
        document.getElementById("laci-kasir").classList.add("hidden");
        document.querySelector(".tray-title-label").innerText = "Pesanan";

        state.tagihanTervalidasi  = 0;
        state.targetKembalian     = 0;
        state.arrayUangKembalian  = [];
        state.selectedProducts    = [];
        renderProdukDiNampan();

        if (formulaInput) setFocus(formulaInput);
    }
}

// ==========================================
// START LEVEL
// ==========================================

function startLevel(lvl) {
    if (!LEVEL_DATA[lvl]) return showMsg("Level Terkunci", "Level sedang dikembangkan.");

    closeVictoryScreen();
    requestWakeLock();
    requestFullScreen();
    state.currentLevelIdx      = lvl;
    state.activePlayingLevel   = lvl;
    try {
        sendStudentProgress(state.currentUser, lvl, 0, 0, 0);
    } catch (err) { console.warn(err); }

    state.levelCustomers       = LEVEL_DATA[lvl];
    state.currentCustomerIdx   = 0;
    state.currentQuizCorrect   = 0;
    state.levelAccumulation    = { revenue: 0, cost: 0, profit: 0, errors: 0 };
    state.currentLevelParams.startTime = Date.now();

    loadCustomer();
    switchScreen('screen-game');

    const misiLevel = LEVEL_OBJECTIVES[lvl];
    showMsg(`🚩 Tujuan Level ${lvl}`,
        `<strong style="color: #92400e; font-size: 1.15rem; display: block; margin-bottom: 0.6rem;">${misiLevel}</strong>Selesaikan pesanan pelanggan dengan teliti!`,
        () => {
            if (lvl === 1 && state.currentCustomerIdx === 0) {
                setTimeout(() => startTutorial(), 350);
            }
        }
    );
}

// ==========================================
// SUB-TEKS BANTUAN VARIABEL HARGA SATUAN
// ==========================================

function updateVariableHelperSubtext(highlightVar = null) {
    const helper = document.getElementById("variable-helper-subtext");
    if (!helper) return;

    if (highlightVar && ITEM_DB[highlightVar]) {
        const itemName = ITEM_DB[highlightVar].name.toLowerCase();
        helper.innerHTML = `(<span class="math-var">${highlightVar}</span> = harga satuan <b class="item-name-bold">${itemName}</b>)`;
        return;
    }

    const order = state.currentLevelParams?.order || {};
    const varsInOrder = Object.keys(order).filter(v => order[v] > 0);
    if (varsInOrder.length > 0) {
        const textParts = varsInOrder.map(v => `<span class="math-var">${v}</span> = harga satuan <b class="item-name-bold">${(ITEM_DB[v]?.name || '').toLowerCase()}</b>`);
        helper.innerHTML = `(${textParts.join(', ')})`;
    } else {
        helper.innerHTML = "";
    }
}

// ==========================================
// FORMULA & NAMPAN PRODUK INTERAKTIF
// ==========================================

/**
 * Menyusun ekspresi aljabar dari daftar produk yang dipilih di nampan.
 * Mengelompokkan suku sejenis berdasarkan urutan kemunculan pertama.
 * Misalnya: ['a', 'a', 'b'] -> "2a + b"
 * @returns {string}
 */
function generateFormulaFromSelectedProducts() {
    if (!state.selectedProducts || state.selectedProducts.length === 0) return "";

    const counts = {};
    const order = [];
    for (const v of state.selectedProducts) {
        if (!counts[v]) {
            counts[v] = 0;
            order.push(v);
        }
        counts[v]++;
    }

    const terms = order.map(v => {
        const count = counts[v];
        return count === 1 ? v : `${count}${v}`;
    });

    return terms.join(" + ");
}

/**
 * Menghapus satu produk dari nampan dan memperbarui rumus di kasir.
 * @param {number} index
 */
function hapusProdukDariNampan(index) {
    if (state.isTutorialActive) return;
    if (state.kembalianModeActive) return;

    playSFX('clear_back');
    state.selectedProducts.splice(index, 1);
    renderProdukDiNampan();

    const formulaInput = document.getElementById("formula-box");
    const hargaDisplay = document.getElementById("harga-display");

    const newFormula = generateFormulaFromSelectedProducts();
    if (formulaInput) {
        formulaInput.value = newFormula;
        formulaInput.classList.remove("input-error");
        formulaInput.style.color = "#1a1a1a";
    }

    // Reset status validasi harga dan display jika barang diubah/dihapus
    state.tagihanTervalidasi = 0;
    if (hargaDisplay) {
        hargaDisplay.textContent = "";
        hargaDisplay.style.color = "#a5d6a7";
    }

    if (state.selectedProducts.length > 0) {
        const lastVar = state.selectedProducts[state.selectedProducts.length - 1];
        updateVariableHelperSubtext(lastVar);
    } else {
        updateVariableHelperSubtext();
    }
}

/**
 * Merender daftar produk yang ada di nampan (#tray-items).
 * Setiap produk dapat diklik langsung untuk membatalkan/menghapus 1 barang dari nampan.
 */
function renderProdukDiNampan() {
    if (state.kembalianModeActive) return;

    const tray = document.getElementById("tray-items");
    if (!tray) return;

    tray.innerHTML = "";
    tray.style.flexDirection = "row";
    tray.style.flexWrap      = "wrap";
    tray.style.alignItems    = "flex-end";
    tray.style.paddingTop    = "14px";

    if (!Array.isArray(state.selectedProducts) || state.selectedProducts.length === 0) return;

    state.selectedProducts.forEach((key, index) => {
        const itemInfo = ITEM_DB[key] || { name: key, img: `assets/products/${key}.png` };
        const div = document.createElement('div');
        div.className = "tray-product tray-product-interactive";
        div.title = `Klik untuk membatalkan ${itemInfo.name}`;
        div.innerHTML = `
            <span class="tray-label">Rp ${key},-</span>
            <img src="${itemInfo.img}" class="tray-img" alt="${itemInfo.name}">
        `;
        div.addEventListener('click', () => {
            hapusProdukDariNampan(index);
        });
        tray.appendChild(div);
    });
}

// ==========================================
// KLIK BARANG DI RAK
// ==========================================

function addVariable(varName) {
    if (state.isTutorialActive) {
        const allowed = checkTutorialAction('addVar', varName);
        if (!allowed) return;
    }

    playSFX('product');

    const formulaInput = document.getElementById("formula-box");
    if (!formulaInput) return;

    // Auto-Routing: Kursor dan activeInput otomatis diarahkan ke #formula-box
    setFocus(formulaInput);
    formulaInput.classList.remove("input-error");

    // Jika tagihan sudah tervalidasi sebelumnya lalu pemain mengklik barang baru,
    // batalkan status validasi lama agar rumus baru dapat dihitung ulang
    if (state.tagihanTervalidasi > 0) {
        state.tagihanTervalidasi = 0;
        const hargaDisplay = document.getElementById("harga-display");
        if (hargaDisplay) { hargaDisplay.textContent = ""; hargaDisplay.style.color = "#a5d6a7"; }
    }

    if (!Array.isArray(state.selectedProducts)) {
        state.selectedProducts = [];
    }
    state.selectedProducts.push(varName);
    renderProdukDiNampan();

    formulaInput.value = generateFormulaFromSelectedProducts();
    formulaInput.style.color = "#1a1a1a";

    // Tampilkan sub-teks bantuan variabel harga satuan
    updateVariableHelperSubtext(varName);
}

// ==========================================
// UANG PELANGGAN (DOMPET)
// ==========================================

function tambahUangPelanggan(nominal, element) {
    if (state.isTutorialActive) {
        const allowed = checkTutorialAction('payMoney', nominal);
        if (!allowed) return;
    }

    playSFX('money_cash');

    const paidInput = document.getElementById("paid-box");
    if (!paidInput) return;

    // Auto-Routing: Kursor dan activeInput otomatis diarahkan ke #paid-box
    setFocus(paidInput);

    let currentVal = parseInt(paidInput.value.replace(/[^0-9]/g, ''), 10) || 0;

    if (element.style.opacity === "0.2") {
        element.style.opacity = "1";
        let newVal = currentVal - nominal;
        paidInput.value = newVal <= 0 ? "" : newVal.toLocaleString('id-ID');
    } else {
        element.style.opacity = "0.2";
        paidInput.value = (currentVal + nominal).toLocaleString('id-ID');
    }

    paidInput.style.color = "#1a1a1a";
}

// ==========================================
// NAMPAN PESANAN
// ==========================================

function munculkanKueDiNampan() {
    if (state.kembalianModeActive) return;
    if (!state.selectedProducts || state.selectedProducts.length === 0) {
        state.selectedProducts = [];
        for (let key in state.currentLevelParams.order) {
            let qty = state.currentLevelParams.order[key];
            if (qty > 0) {
                for (let i = 0; i < qty; i++) {
                    state.selectedProducts.push(key);
                }
            }
        }
    }
    renderProdukDiNampan();
}

// ==========================================
// CHECKOUT
// ==========================================

function processCheckout() {
    if (state.tagihanTervalidasi === 0) return showMsg("Peringatan", "Hitung total harga aljabar dahulu (=).");

    const paidInput   = document.getElementById("paid-box");
    let uangDibayar   = parseInt(paidInput.value.replace(/[^0-9]/g, ''));
    const totalUangFisik = Object.keys(state.uangDibayarDetail)
        .reduce((total, pecahan) => total + (Number(pecahan) * state.uangDibayarDetail[pecahan]), 0);
    const maksimalDompet = totalUangFisik > 0 ? totalUangFisik : 100000;

    if (isNaN(uangDibayar) || uangDibayar < state.tagihanTervalidasi) {
        state.currentLevelParams.errorCount++;
        paidInput.value = "Kurang!";
        paidInput.style.color = "red";
        return showMsg("Uang Kurang", "Nominal pembayaran kurang/kosong!");
    }

    if (uangDibayar > maksimalDompet) {
        state.currentLevelParams.errorCount++;
        paidInput.value = "Tdk Logis!";
        paidInput.style.color = "red";
        return showMsg("Tidak Logis", `Pelanggan maksimal hanya punya Rp ${maksimalDompet.toLocaleString('id-ID')}.`);
    }

    let kembalian = uangDibayar - state.tagihanTervalidasi;
    let profit    = state.tagihanTervalidasi - state.currentLevelParams.totalCost;

    // Render struk
    let rumusArr = [], prosesArr = [], rincianArr = [];
    for (let key in state.currentLevelParams.order) {
        let qty = state.currentLevelParams.order[key];
        if (qty > 0) {
            rumusArr.push(`${qty}${key}`);
            prosesArr.push(`${qty}(\\text{Rp } ${ITEM_DB[key].price.toLocaleString('id-ID')})`);
            rincianArr.push(`Rp ${(qty * ITEM_DB[key].price).toLocaleString('id-ID')}`);
        }
    }

    document.getElementById("struk-rumus").innerHTML                = renderMathExpression(rumusArr.join(" + "));
    document.getElementById("struk-proses").innerHTML               = renderMathExpression(prosesArr.join(" + "));
    document.getElementById("struk-rincian").innerHTML              = rincianArr.join(" + ");
    document.getElementById("struk-total").textContent              = "Rp " + state.tagihanTervalidasi.toLocaleString('id-ID');
    document.getElementById("struk-bayar-total").textContent        = "Rp " + uangDibayar.toLocaleString('id-ID');
    document.getElementById("struk-bayar-rincian").textContent      = tentukanPecahanUang();
    document.getElementById("struk-kembalian-hitung").innerHTML     = `Rp ${uangDibayar.toLocaleString('id-ID')} - Rp ${state.tagihanTervalidasi.toLocaleString('id-ID')} = Rp ${kembalian.toLocaleString('id-ID')}`;
    document.getElementById("struk-kembalian-final").textContent    = "Rp " + kembalian.toLocaleString('id-ID');

    state.levelAccumulation.revenue += state.tagihanTervalidasi;
    state.levelAccumulation.cost    += state.currentLevelParams.totalCost;
    state.levelAccumulation.profit  += profit;
    state.levelAccumulation.errors  += state.currentLevelParams.errorCount;

    const btnCloseModal = document.getElementById("btn-close-modal");
    if (kembalian > 0) {
        btnCloseModal.textContent = "Berikan Kembalian";
        btnCloseModal.onclick = () => {
            if (state.isTutorialActive) {
                const allowed = checkTutorialAction('closeReceipt');
                if (!allowed) return;
            }
            document.getElementById("receipt-modal").style.display = "none";
            mulaiModeKembalian(kembalian);
        };
    } else {
        // Transaksi Uang Pas
        checkBadgeUnlocks({
            type: 'transaction_receipt',
            kembalian: 0,
            level: state.currentLevelIdx
        });
        btnCloseModal.textContent = "Uang Pas (Lanjut)";
        btnCloseModal.onclick     = finishCustomerOrLevel;
    }

    const modalReceipt = document.getElementById("receipt-modal");
    modalReceipt.style.display = "flex";
    const receiptCard = modalReceipt.querySelector(".final-receipt-card");
    if (receiptCard) {
        receiptCard.scrollTop = 0;
    }
}

// ==========================================
// MODE KEMBALIAN
// ==========================================

function mulaiModeKembalian(jumlahKembalian) {
    state.kembalianModeActive = true;
    state.targetKembalian     = jumlahKembalian;
    state.arrayUangKembalian  = [];
    state.kembalianStartTime  = Date.now();

    const labelHarga   = document.getElementById("label-harga");
    const priceDisplay = document.getElementById("harga-display");
    if (labelHarga) labelHarga.textContent = "Kembalikan:";
    priceDisplay.textContent = "Rp " + state.targetKembalian.toLocaleString('id-ID');
    priceDisplay.style.color = "#ffb74d";

    document.getElementById("formula-box").value = "Rp 0";
    document.getElementById("paid-box").value    = "-";

    document.getElementById("numpad-container").classList.add("hidden");
    document.getElementById("laci-kasir").classList.remove("hidden");
    document.querySelector(".tray-title-label").innerText = "Kembalian";
    document.getElementById("tray-items").innerHTML = "";
}

function tambahUangKembalian(nominal) {
    playSFX('money_cash');
    state.arrayUangKembalian.push(nominal);
    renderUangDiNampan();
}

function tarikUangKembalian(index) {
    if (state.isTutorialActive) return;
    playSFX('clear_back');
    state.arrayUangKembalian.splice(index, 1);
    renderUangDiNampan();
}

function renderUangDiNampan() {
    const tray = document.getElementById("tray-items");
    tray.innerHTML = "";
    let totalDiberikan = 0;

    tray.style.flexDirection = "row";
    tray.style.flexWrap      = "wrap";
    tray.style.alignItems    = "center";
    tray.style.paddingTop    = "10px";

    state.arrayUangKembalian.forEach((nominal, index) => {
        totalDiberikan += nominal;
        let randomRotate = (Math.random() * 10 - 5).toFixed(1);
        const img = document.createElement('img');
        img.src   = `assets/rupiah/rp${nominal}.png`;
        img.className = "tray-money-item";
        img.style.transform = `rotate(${randomRotate}deg)`;
        img.alt = `Rp ${nominal}`;
        img.addEventListener('click', () => tarikUangKembalian(index));
        tray.appendChild(img);
    });

    document.getElementById("formula-box").value = "Rp " + totalDiberikan.toLocaleString('id-ID');
}

function validasiUangKembalian() {
    let totalDiberikan = state.arrayUangKembalian.reduce((a, b) => a + b, 0);

    if (totalDiberikan === state.targetKembalian) {
        playSFX('success_quiz_change');
        const duration = state.kembalianStartTime ? Math.floor((Date.now() - state.kembalianStartTime) / 1000) : 0;
        checkBadgeUnlocks({
            type: 'kembalian_success',
            kembalianAccurate: true,
            duration: duration,
            level: state.currentLevelIdx
        });

        showMsg("Tepat Sekali!", "Uang kembalian yang Anda berikan pas. Pelanggan senang!", () => {
            finishCustomerOrLevel();
        });
    } else {
        playSFX('error');
        state.currentLevelParams.errorCount++;
        state.levelAccumulation.errors++;
        showMsg("Oops! Kembalian Salah", `Seharusnya Anda memberikan Rp ${state.targetKembalian.toLocaleString('id-ID')}, tetapi Anda malah menyiapkan Rp ${totalDiberikan.toLocaleString('id-ID')}. Ayo hitung lagi!`);
    }
}

// ==========================================
// ANTREAN PELANGGAN & KUIS
// ==========================================

function finishCustomerOrLevel() {
    document.getElementById("receipt-modal").style.display = "none";
    if (state.isTutorialActive) endTutorial();

    if (state.currentCustomerIdx < state.levelCustomers.length - 1) {
        state.currentCustomerIdx++;
        state.isTutorialActive = false;
        loadCustomer();
    } else {
        if (QUIZ_DB[state.currentLevelIdx]) {
            state.currentQuizIndex = 0;
            showQuizQuestion();
        } else {
            completeLevelAndSave();
        }
    }
}

let pendingQuizSelection = null;

function showQuizQuestion() {
    const quizModal = document.getElementById("quiz-modal");
    const quizData  = QUIZ_DB[state.currentLevelIdx][state.currentQuizIndex];
    pendingQuizSelection = null;

    document.getElementById("quiz-level-title").innerText = `Kuis Level ${state.currentLevelIdx}`;
    document.getElementById("quiz-counter").innerText     = `Soal ${state.currentQuizIndex + 1} / ${QUIZ_DB[state.currentLevelIdx].length}`;
    document.getElementById("quiz-question").innerHTML    = formatMathText(quizData.q);

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";
    document.getElementById("quiz-feedback").classList.add("hidden");
    document.getElementById("btn-next-quiz").classList.add("hidden");

    const btnConfirm = document.getElementById("btn-confirm-quiz");
    if (btnConfirm) {
        btnConfirm.classList.remove("hidden");
        btnConfirm.disabled = true;
    }

    quizData.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-quiz-option";

        // Pisahkan label abjad (A., B., C., D.) dengan isi opsi agar rapi dan rapat di kiri
        const match = opt.match(/^([A-Za-z0-9]+[\.\)])\s*(.*)$/);
        if (match) {
            const letter = match[1];
            const textContent = match[2];
            btn.innerHTML = `<span class="quiz-option-letter">${letter}</span><span class="quiz-option-text">${formatMathText(textContent)}</span>`;
        } else {
            btn.innerHTML = `<span class="quiz-option-text">${formatMathText(opt)}</span>`;
        }

        btn.addEventListener('click', () => {
            const allButtons = optionsContainer.querySelectorAll(".btn-quiz-option");
            allButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            pendingQuizSelection = { index, btnElement: btn, correctIndex: quizData.ans };
            if (btnConfirm) btnConfirm.disabled = false;
        });
        optionsContainer.appendChild(btn);
    });

    quizModal.classList.remove("hidden");
}

function confirmQuizAnswer() {
    if (!pendingQuizSelection) return;

    const btnConfirm = document.getElementById("btn-confirm-quiz");
    if (btnConfirm) {
        btnConfirm.classList.add("hidden");
    }

    checkQuizAnswer(
        pendingQuizSelection.index,
        pendingQuizSelection.btnElement,
        pendingQuizSelection.correctIndex
    );
}

function checkQuizAnswer(selectedIndex, btnElement, correctIndex) {
    const allButtons = document.querySelectorAll(".btn-quiz-option");
    allButtons.forEach(btn => btn.disabled = true);

    const feedbackBox = document.getElementById("quiz-feedback");
    feedbackBox.classList.remove("hidden", "feedback-correct", "feedback-wrong");

    if (selectedIndex === correctIndex) {
        playSFX('success_quiz_change');
        state.currentQuizCorrect++;
        btnElement.classList.add("correct");
        feedbackBox.classList.add("feedback-correct");
        feedbackBox.innerText = "Jawaban Tepat! Luar biasa!";
    } else {
        playSFX('error');
        btnElement.classList.add("wrong");
        allButtons[correctIndex].classList.add("correct");
        feedbackBox.classList.add("feedback-wrong");
        feedbackBox.innerText = "Ups, kurang tepat. Konsep ini sempat dibahas oleh pelanggan tadi.";

        // Kirim pembaruan progres realtime ke guru saat kuis salah
        try {
            sendStudentProgress(
                state.currentUser,
                state.currentLevelIdx,
                state.currentLevelParams.errorCount,
                state.currentQuizCorrect,
                QUIZ_DB[state.currentLevelIdx]?.length || 0
            );
        } catch (syncErr) {
            console.warn('[Sync] Gagal kirim progres saat kuis salah:', syncErr);
        }
    }

    document.getElementById("btn-next-quiz").classList.remove("hidden");
}

function nextQuizQuestion() {
    state.currentQuizIndex++;
    if (state.currentQuizIndex < QUIZ_DB[state.currentLevelIdx].length) {
        showQuizQuestion();
    } else {
        document.getElementById("quiz-modal").classList.add("hidden");
        // Evaluasi lencana kuis sempurna
        checkBadgeUnlocks({
            type: 'quiz_complete',
            quizCorrect: state.currentQuizCorrect,
            quizTotal: QUIZ_DB[state.currentLevelIdx]?.length || 0,
            level: state.currentLevelIdx
        });
        completeLevelAndSave();
    }
}

function completeLevelAndSave() {
    let duration = Math.floor((Date.now() - state.currentLevelParams.startTime) / 1000);
    if (state.currentUser.maxLevel < state.currentLevelIdx) {
        state.currentUser.maxLevel = state.currentLevelIdx;
    }

    const levelOrders = LEVEL_DATA[state.currentLevelIdx] || [];
    const quizTotal = QUIZ_DB[state.currentLevelIdx]?.length || 0;
    const customersCount = levelOrders.length || 1;
    const stars = computeLevelStars({
        errors: state.levelAccumulation.errors,
        quizCorrect: state.currentQuizCorrect,
        quizTotal
    });
    const accuracy = computeLevelAccuracy({
        customers: customersCount,
        errors: state.levelAccumulation.errors
    });

    let existLog = state.currentUser.history.find(h => h.level === state.currentLevelIdx);
    if (!existLog) {
        state.currentUser.history.push({
            level:       state.currentLevelIdx,
            revenue:     state.levelAccumulation.revenue,
            cost:        state.levelAccumulation.cost,
            profit:      state.levelAccumulation.profit,
            duration,
            errors:      state.levelAccumulation.errors,
            quizCorrect: state.currentQuizCorrect,
            quizTotal,
            stars,
            timestamp:   new Date().toISOString()
        });

        state.currentUser.revenue += state.levelAccumulation.revenue;
        state.currentUser.cost    += state.levelAccumulation.cost;
        state.currentUser.money   += state.levelAccumulation.profit;
    } else {
        existLog.stars = Math.max(existLog.stars || 0, stars);
    }

    // Hitung jumlah variabel unik yang digunakan pada pesanan level ini
    const allVars = new Set();
    levelOrders.forEach(cust => {
        if (cust.order) Object.keys(cust.order).forEach(v => allVars.add(v));
    });

    // Evaluasi otomatis semua lencana berdasarkan pencapaian level
    checkBadgeUnlocks({
        type: 'level_complete',
        level: state.currentLevelIdx,
        errors: state.levelAccumulation.errors,
        distinctVariables: allVars.size,
        quizCorrect: state.currentQuizCorrect,
        quizTotal
    });

    // Kosongkan penanda level aktif saat level selesai
    state.activePlayingLevel = null;

    saveData();

    // Sinkronisasi profil akun pengguna ke Firebase (users/{studentId})
    try {
        syncUserProfile(state.currentUser);
    } catch (profErr) {
        console.warn('[Sync] Gagal sync profile setelah selesai level:', profErr);
    }

    // Sinkronisasi data progres murid ke guru secara realtime (Hybrid Offline + Realtime)
    try {
        sendStudentProgress(
            state.currentUser,
            state.currentLevelIdx,
            state.levelAccumulation.errors,
            state.currentQuizCorrect,
            quizTotal
        );
    } catch (syncErr) {
        console.warn('[Sync] Progres gagal dikirim:', syncErr);
    }

    // Jika baru menyelesaikan Level 10 atau sedang di level sulit, pertahankan tab sulit aktif
    const unlockedHardJustNow = state.currentLevelIdx === 10;
    if (state.currentLevelIdx >= 10) {
        state.currentLevelTab = 'hard';
    }

    showVictoryScreen({
        level: state.currentLevelIdx,
        stars,
        accuracy,
        quizCorrect: state.currentQuizCorrect,
        quizTotal,
        duration,
        profit: state.levelAccumulation.profit,
        hasNextLevel: Boolean(LEVEL_DATA[state.currentLevelIdx + 1]),
        unlockedHardJustNow
    });
}

// ==========================================
// INIT LISTENERS MESIN KASIR
// ==========================================

function initGameListeners() {
    const formulaInput  = document.getElementById("formula-box");
    const paidInput     = document.getElementById("paid-box");
    const inputButtons  = document.querySelectorAll(".numpad-grid .btn-num, .numpad-grid .btn-op");
    const backspaceBtn  = document.querySelector(".btn-backspace");
    const clearBtn      = document.querySelector(".btn-clear");
    const calcBtn       = document.querySelector(".btn-calc");
    const confirmBtn    = document.getElementById("btn-final-checkout");
    const btnCloseModal = document.getElementById("btn-close-modal");

    if (!formulaInput) return;

    formulaInput.addEventListener('click', () => {
        if (state.isTutorialActive) return;
        setFocus(formulaInput);
    });

    if (paidInput) {
        paidInput.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            setFocus(paidInput);
        });
    }

    inputButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            playSFX('numpad');
            if (!state.activeInput) state.activeInput = formulaInput;
            if (state.activeInput.id === "paid-box") {
                if (btn.classList.contains('btn-num')) {
                    let currentDigits = state.activeInput.value.replace(/[^0-9]/g, '');
                    let newDigits     = (currentDigits === '0' || currentDigits === '') ? btn.textContent : (currentDigits + btn.textContent);
                    let num           = parseInt(newDigits, 10);
                    state.activeInput.value = isNaN(num) ? "" : num.toLocaleString('id-ID');
                }
            } else {
                // Input sedang di #formula-box
                // Jika tagihan sudah tervalidasi sebelumnya lalu pemain mengetik rumus baru, batalkan validasi lama
                if (state.tagihanTervalidasi > 0) {
                    state.tagihanTervalidasi = 0;
                    const priceDisplay = document.getElementById("harga-display");
                    if (priceDisplay) { priceDisplay.textContent = ""; priceDisplay.style.color = "#a5d6a7"; }
                    const trayItems = document.getElementById("tray-items");
                    if (trayItems) trayItems.innerHTML = "";
                }
                state.activeInput.classList.remove('input-error');
                state.activeInput.value += btn.textContent;
            }
            state.activeInput.style.color = "#1a1a1a";
        });
    });

    if (backspaceBtn) {
        backspaceBtn.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            playSFX('clear_back');
            if (state.activeInput && state.activeInput.value.length > 0) {
                state.activeInput.classList.remove('input-error');
                if (state.activeInput.id === "formula-box") {
                    if (Array.isArray(state.selectedProducts) && state.selectedProducts.length > 0) {
                        state.selectedProducts.pop();
                        state.activeInput.value = generateFormulaFromSelectedProducts();
                        renderProdukDiNampan();
                    } else {
                        state.activeInput.value = state.activeInput.value.replace(/(\d*[a-q]|[+\-]|\d+)$/i, '');
                    }
                    const priceDisplay = document.getElementById("harga-display");
                    if (priceDisplay) { priceDisplay.textContent = ""; priceDisplay.style.color = "#a5d6a7"; }
                    state.tagihanTervalidasi = 0;
                    const lastVar = state.selectedProducts && state.selectedProducts.length > 0 ? state.selectedProducts[state.selectedProducts.length - 1] : null;
                    updateVariableHelperSubtext(lastVar);
                } else if (state.activeInput.id === "paid-box") {
                    let clean = state.activeInput.value.replace(/[^0-9]/g, '').slice(0, -1);
                    state.activeInput.value = clean.length > 0 ? parseInt(clean, 10).toLocaleString('id-ID') : "";
                } else {
                    state.activeInput.value = state.activeInput.value.slice(0, -1);
                }
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            playSFX('clear_back');
            const target = state.activeInput || formulaInput;
            if (target) {
                target.classList.remove('input-error');
                target.value = "";
                if (target.id === "formula-box") {
                    const priceDisplay = document.getElementById("harga-display");
                    if (priceDisplay) { priceDisplay.textContent = ""; priceDisplay.style.color = "#a5d6a7"; }
                    state.tagihanTervalidasi = 0;
                    state.selectedProducts = [];
                    renderProdukDiNampan();
                    updateVariableHelperSubtext();
                } else if (target.id === "paid-box") {
                    document.querySelectorAll("#wallet-container-dynamic .img-placeholder")
                        .forEach(item => { item.style.opacity = "1"; });
                }
            }
        });
    }

    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            if (state.isTutorialActive) {
                const paidInput = document.getElementById("paid-box");
                const paidVal = paidInput ? (parseInt(paidInput.value.replace(/[^0-9]/g, ''), 10) || 0) : 0;
                const isShortcut = state.tagihanTervalidasi > 0 && paidVal > 0;
                const reqAction = isShortcut ? (state.kembalianModeActive ? 'confirmChange' : 'checkout') : 'calc';
                const allowed = checkTutorialAction(reqAction);
                if (!allowed) return;
            }
            handleCalculate();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (state.isTutorialActive) {
                const action = state.kembalianModeActive ? 'confirmChange' : 'checkout';
                const allowed = checkTutorialAction(action);
                if (!allowed) return;
            }
            playSFX('calc_checkout');
            if (state.kembalianModeActive) {
                validasiUangKembalian();
            } else {
                processCheckout();
            }
        });
    }

    // Tombol laci kasir (uang kembalian)
    document.querySelectorAll('.btn-uang').forEach(btn => {
        btn.addEventListener('click', () => {
            const nominal = parseInt(btn.dataset.nominal, 10);
            if (!nominal) return;
            if (state.isTutorialActive) {
                const allowed = checkTutorialAction('giveChange', nominal);
                if (!allowed) return;
            }
            tambahUangKembalian(nominal);
        });
    });
}

/**
 * Menangani tombol "=" di numpad: validasi formula lalu tampilkan harga,
 * atau pintasan konfirmasi checkout jika rumus sudah valid dan uang sudah diinput.
 */
function handleCalculate() {
    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    const priceDisplay = document.getElementById("harga-display");

    const paidVal = paidInput ? (parseInt(paidInput.value.replace(/[^0-9]/g, ''), 10) || 0) : 0;

    // Logika Pintar: Jika rumus sudah valid (state.tagihanTervalidasi > 0) dan kolom uang sudah terisi,
    // jadikan tombol "=" sebagai jalan pintas untuk langsung menjalankan konfirmasi transaksi (checkout)
    if (state.tagihanTervalidasi > 0 && paidVal > 0) {
        if (state.isTutorialActive) {
            const action = state.kembalianModeActive ? 'confirmChange' : 'checkout';
            const allowed = checkTutorialAction(action);
            if (!allowed) return;
        }
        playSFX('calc_checkout');
        if (state.kembalianModeActive) {
            validasiUangKembalian();
        } else {
            processCheckout();
        }
        return;
    }

    if (!formulaInput) return;

    // Evaluasi rumus aljabar dari formula-box terlepas dari kolom mana yang sedang aktif
    const result = calculateFormula();

    if (result.isBenar) {
        playSFX('calc_checkout');
        state.tagihanTervalidasi = result.tagihan;
        state.currentLevelParams.totalCost = result.cost;

        // Otomatis sederhanakan ekspresi (misal 3a + 4a -> 7a, atau 5j + 2e - 2e -> 5j)
        if (result.simplifiedFormula) {
            formulaInput.value = result.simplifiedFormula;
        }

        formulaInput.classList.remove('input-error');
        if (priceDisplay) {
            priceDisplay.textContent = "Rp " + state.tagihanTervalidasi.toLocaleString('id-ID');
            priceDisplay.style.color = "#a5d6a7";
        }

        munculkanKueDiNampan();

        // Pindahkan fokus input secara otomatis ke #paid-box
        if (paidInput) {
            setFocus(paidInput);
        }
    } else {
        playSFX('error');
        state.currentLevelParams.errorCount++;
        if (priceDisplay) {
            priceDisplay.textContent = "Rumus Salah!";
            priceDisplay.style.color = "#ef9a9a";
        }
        state.tagihanTervalidasi = 0;
        renderProdukDiNampan();

        // Tampilkan indikator merah pada box rumus tanpa memblokir game
        formulaInput.classList.add('input-error');

        const panel = document.querySelector('.green-indicator-screen');
        if (panel) {
            panel.classList.add('error-flash');
            setTimeout(() => panel.classList.remove('error-flash'), 350);
        }

        // Arahkan kembali fokus ke formula-box agar siswa dapat mengoreksi rumus
        setFocus(formulaInput);

        // Kirim pembaruan progres realtime ke guru saat rumus kasir salah
        try {
            sendStudentProgress(
                state.currentUser,
                state.currentLevelIdx,
                state.currentLevelParams.errorCount,
                state.currentQuizCorrect,
                QUIZ_DB[state.currentLevelIdx]?.length || 0
            );
        } catch (syncErr) {
            console.warn('[Sync] Gagal kirim progres saat rumus salah:', syncErr);
        }
    }
}



// ==========================================
// FILE: js/ui/reports.js
// ==========================================







let fasilChartInstance = null;

// ==========================================
// BUKU KAS
// ==========================================

function openBukuKas() {
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
        histList.innerHTML = '<div style="text-align:center; color:#92400e; font-style:italic; padding:1.25rem; font-size:0.75rem;">Belum ada riwayat permainan. Selesaikan pesanan pembeli di toko untuk mencatat performa kasir.</div>';
    } else {
        state.currentUser.history.forEach(h => {
            let d = new Date(h.timestamp);
            let dateStr = d.toLocaleDateString('id-ID');
            let durStr = h.duration ? `${h.duration}s` : '0s';
            histList.innerHTML += `
                <div class="history-item">
                    <div class="history-row-top">
                        <span class="history-level-name">Level ${h.level}</span>
                        <span class="history-profit text-success">+Rp ${h.profit.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="history-row-bottom history-meta">
                        <span class="history-meta-item"><i class="fa-regular fa-clock"></i> ${durStr}</span>
                        <span class="history-meta-item"><i class="fa-solid fa-triangle-exclamation ${h.errors > 0 ? 'text-error' : 'text-success'}"></i> ${h.errors || 0} Salah</span>
                        <span class="history-meta-item"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
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
function handleDonate(nominal) {
    if (!state.currentUser) return;
    if (state.currentUser.money < nominal) {
        return showMsg("Laba Tidak Cukup", `Laba bersih toko saat ini (Rp ${state.currentUser.money.toLocaleString('id-ID')}) belum mencukupi untuk menyisihkan donasi sebesar Rp ${nominal.toLocaleString('id-ID')}. Ayo layani lebih banyak pelanggan!`);
    }

    state.currentUser.money -= nominal;
    state.currentUser.sumbangan = (state.currentUser.sumbangan || 0) + nominal;
    saveData();

    // Sinkronisasi pembaruan profil ke Firebase
    try {
        syncUserProfile(state.currentUser);
    } catch (profErr) {
        console.warn('[Sync] Gagal sync profile setelah donasi:', profErr);
    }

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
function showBadgeDetail(badge, isUnlocked) {
    const modal = document.getElementById('modal-badge-detail');
    if (!modal) return;

    const iconWrap = document.getElementById('badge-detail-icon-wrapper');
    const categoryEl = document.getElementById('badge-detail-category');
    const nameEl = document.getElementById('badge-detail-name');
    const statusEl = document.getElementById('badge-detail-status');
    const descEl = document.getElementById('badge-detail-desc');

    if (iconWrap) {
        if (badge.badgeImg) {
            iconWrap.className = `badge-detail-icon-wrapper has-tier-img ${isUnlocked ? '' : 'icon-disabled'}`;
            iconWrap.innerHTML = `<img src="${badge.badgeImg}" class="badge-tier-img" alt="${badge.name}" style="${isUnlocked ? '' : 'filter: grayscale(100%) opacity(0.55);'}">`;
        } else {
            iconWrap.className = isUnlocked
                ? `badge-detail-icon-wrapper ${badge.colorClass || 'icon-gold'}`
                : 'badge-detail-icon-wrapper icon-disabled';
            iconWrap.innerHTML = `<i id="badge-detail-icon" class="fa-solid ${isUnlocked ? (badge.icon || 'fa-award') : 'fa-lock'}"></i>`;
        }
    }

    if (categoryEl) categoryEl.textContent = `${badge.category || 'Prestasi'} • Tier ${badge.tier || 1}`;
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

function openPrestasi() {
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
        card.title = `Klik untuk melihat detail lencana: ${b.name} (Tier ${b.tier || 1})`;
        const badgeVisualHtml = b.badgeImg
            ? `<div class="badge-insignia-platform">
                <div class="badge-icon-wrapper has-tier-img">
                    <img src="${b.badgeImg}" class="badge-tier-img" alt="${b.name}">
                    ${!hasBadge ? '<span class="badge-lock-badge"><i class="fa-solid fa-lock"></i></span>' : ''}
                </div>
                <div class="badge-pedestal-shadow"></div>
               </div>`
            : `<div class="badge-insignia-platform">
                <div class="badge-icon-wrapper ${hasBadge ? b.colorClass : 'icon-disabled'}">
                    <i class="fa-solid badge-icon ${hasBadge ? b.icon : 'fa-lock'}"></i>
                    ${!hasBadge ? '<span class="badge-lock-badge"><i class="fa-solid fa-lock"></i></span>' : ''}
                </div>
                <div class="badge-pedestal-shadow"></div>
               </div>`;
        card.innerHTML = `
            ${badgeVisualHtml}
            <span class="badge-category-tag">${b.category} • Tier ${b.tier || 1}</span>
            <h4 class="badge-name">${b.name}</h4>
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

    // Inisialisasi event listener toggle kriteria leaderboard (idempotent)
    const btnSortAcc = document.getElementById('btn-sort-accuracy');
    if (btnSortAcc && !btnSortAcc._hasLeaderboardListener) {
        btnSortAcc._hasLeaderboardListener = true;
        btnSortAcc.addEventListener('click', () => {
            state.leaderboardSortBy = 'accuracy';
            renderLeaderboard();
        });
    }
    const btnSortQuiz = document.getElementById('btn-sort-quiz');
    if (btnSortQuiz && !btnSortQuiz._hasLeaderboardListener) {
        btnSortQuiz._hasLeaderboardListener = true;
        btnSortQuiz.addEventListener('click', () => {
            state.leaderboardSortBy = 'quiz';
            renderLeaderboard();
        });
    }

    renderLeaderboard();
}

/**
 * Format durasi detik ke format mudah dibaca (contoh: 45s, 1m 20s).
 * @param {number} sec Durasi dalam detik
 * @returns {string}
 */
function formatDuration(sec) {
    if (!sec || sec <= 0) return '–';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

/**
 * Merender tabel Papan Kehormatan (Leaderboard) dengan pengurutan kriteria
 * Akurasi atau Banyak Kuis Terjawab, disertai tie-breaker waktu pengerjaan tercepat.
 */
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sortBy = state.leaderboardSortBy || 'accuracy';
    const thMetric = document.getElementById('th-leaderboard-metric');
    if (thMetric) {
        thMetric.textContent = sortBy === 'quiz' ? 'Kuis' : 'Akurasi';
    }

    // Sinkronisasi status aktif tombol pill pengurutan
    const btnAcc = document.getElementById('btn-sort-accuracy');
    const btnQuiz = document.getElementById('btn-sort-quiz');
    if (btnAcc && btnQuiz) {
        if (sortBy === 'quiz') {
            btnAcc.classList.remove('active');
            btnQuiz.classList.add('active');
        } else {
            btnAcc.classList.add('active');
            btnQuiz.classList.remove('active');
        }
    }

    // Kalkulasi metrik akurasi, kuis, dan total durasi untuk setiap pengguna
    const enrichedUsers = state.users.map(u => {
        const history = Array.isArray(u.history) ? u.history : [];
        const totalLevels = history.length;
        const zeroErrors = history.filter(h => (h.errors || 0) === 0).length;
        const accuracy = totalLevels === 0 ? 0 : Math.round((zeroErrors / totalLevels) * 100);
        const totalQuizCorrect = history.reduce((sum, h) => sum + (h.quizCorrect || 0), 0);
        const totalQuizCount   = history.reduce((sum, h) => sum + (h.quizTotal   || 0), 0);
        const totalDuration    = history.reduce((sum, h) => sum + (h.duration    || 0), 0);

        return {
            ...u,
            totalLevels,
            accuracy,
            totalQuizCorrect,
            totalQuizCount,
            totalDuration
        };
    });

    // Pengurutan bertingkat dengan tie-breaker waktu tercepat
    enrichedUsers.sort((a, b) => {
        // Pemain yang telah aktif menyelesaikan level selalu diprioritaskan di atas slot kosong
        const aActive = a.totalLevels > 0;
        const bActive = b.totalLevels > 0;
        if (aActive !== bActive) {
            return aActive ? -1 : 1;
        }

        if (sortBy === 'quiz') {
            // Prioritas 1: Jumlah kuis dijawab benar terbanyak
            if (b.totalQuizCorrect !== a.totalQuizCorrect) {
                return b.totalQuizCorrect - a.totalQuizCorrect;
            }
            // Tie-breaker 1: Persentase akurasi rumus (%)
            if (b.accuracy !== a.accuracy) {
                return b.accuracy - a.accuracy;
            }
        } else {
            // Default: Prioritas 1: Persentase akurasi rumus (%)
            if (b.accuracy !== a.accuracy) {
                return b.accuracy - a.accuracy;
            }
            // Tie-breaker 1: Jumlah kuis dijawab benar terbanyak
            if (b.totalQuizCorrect !== a.totalQuizCorrect) {
                return b.totalQuizCorrect - a.totalQuizCorrect;
            }
        }

        // Tie-breaker 2 (utama): Waktu pengerjaan akumulasi tercepat (ascending duration)
        if (a.totalDuration !== b.totalDuration) {
            return a.totalDuration - b.totalDuration;
        }

        // Tie-breaker 3: Laba / Uang tersimpan
        return (b.money || 0) - (a.money || 0);
    });

    enrichedUsers.forEach((u, idx) => {
        let rankIcon = idx === 0
            ? '<i class="fa-solid fa-trophy rank-1"></i>'
            : (idx === 1
                ? '<i class="fa-solid fa-medal rank-2"></i>'
                : (idx === 2
                    ? '<i class="fa-solid fa-medal rank-3"></i>'
                    : `${idx + 1}`));

        let isMeClass = (state.currentUser && u.id === state.currentUser.id) ? 'table-row-me' : '';

        const mainMetricText = sortBy === 'quiz'
            ? `${u.totalQuizCorrect} kuis`
            : (u.totalLevels === 0 ? '–' : `${u.accuracy}%`);

        const subMetricText = sortBy === 'quiz'
            ? (u.totalLevels === 0 ? '(–)' : `(${u.accuracy}%)`)
            : `(${u.totalQuizCorrect} kuis)`;

        const timeStr = formatDuration(u.totalDuration);

        tbody.innerHTML += `
            <tr class="table-row ${isMeClass}">
                <td style="text-align: center;">${rankIcon}</td>
                <td>
                    <span class="rank-name" title="${u.name}">${u.name}</span>
                    <span class="rank-title">${getTitle(u.money, u.sumbangan || 0)}</span>
                </td>
                <td class="text-center">
                    <div class="lb-metric-cell">
                        <span class="lb-metric-main">${mainMetricText}</span>
                        <span class="lb-metric-sub">${subMetricText}</span>
                    </div>
                </td>
                <td class="text-right">
                    <span class="lb-time"><i class="fa-regular fa-clock" style="font-size:0.7rem; opacity:0.65;"></i> ${timeStr}</span>
                </td>
            </tr>
        `;
    });

    const minSlots = 5;
    for (let idx = enrichedUsers.length; idx < minSlots; idx++) {
        tbody.innerHTML += `
            <tr class="table-row table-row-empty" style="opacity: 0.55;">
                <td style="color:#94a3b8; text-align:center;">${idx + 1}</td>
                <td>
                    <span class="rank-name" style="color:#94a3b8; font-style:italic;">Slot Kasir Kosong</span>
                    <span class="rank-title" style="color:#cbd5e1;">Belum ada data pemain</span>
                </td>
                <td class="text-center" style="color:#cbd5e1;">–</td>
                <td class="text-right" style="color:#cbd5e1;">–</td>
            </tr>
        `;
    }
}

function copyToken() {
    navigator.clipboard.writeText(state.currentUser.token)
        .then(() => showMsg('Berhasil', 'Kode prestasi berhasil disalin!'));
}

// ==========================================
// FASILITATOR
// ==========================================

function showFasilitatorLogin() {
    document.getElementById('pin-input').value = '';
    document.getElementById('modal-pin').classList.remove('hidden');
}

function checkPIN() {
    if (document.getElementById('pin-input').value === '1234') {
        document.getElementById('modal-pin').classList.add('hidden');
        openFasilitator();
    } else {
        showMsg('Akses Ditolak', 'PIN salah.');
    }
}

function openFasilitator() {
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
function updateFasilTopBarUI() {
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
function handleCreateHostRoom() {
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
async function handleLoadSpecificRoom() {
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
function handleSortFasilTable(field) {
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
function sortFasilStudents(students) {
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
function updateFasilSortHeadersUI() {
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
let activeEditingStudentId = null;

function setActiveEditingStudentId(id) {
    activeEditingStudentId = id;
}

/**
 * Menyimpan editan fasilitator (HANYA nama_fasil dan kelas_fasil) ke Firebase
 * serta cache lokal tanpa menimpa data asli perangkat murid.
 * @param {string} studentId
 */
async function handleSaveStudentEdit(studentId) {
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
async function handleInlineStudentUpdate(studentId, field, newValue, inputEl) {
    if (field !== 'name' && field !== 'kelas' && field !== 'nama_fasil' && field !== 'kelas_fasil') return;
    const targetKey = (field === 'name' || field === 'nama_fasil') ? 'nama_fasil' : 'kelas_fasil';
    await updateStudentProfileInRoom(studentId, { [targetKey]: newValue });
}

/**
 * Menyalin kode ruang fasilitator ke clipboard.
 */
function handleCopyHostRoomCode() {
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
async function forceRefreshFasilData() {
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
function formatTimeAgo(timestamp) {
    if (!timestamp || isNaN(timestamp)) return 'Baru saja';
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - Number(timestamp)) / 1000));

    if (diffSec < 60) {
        return 'Baru saja';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
        return `${diffMin} mnt lalu`;
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
        return `${diffHours} jam lalu`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
        return 'Kemarin';
    }
    if (diffDays < 7) {
        return `${diffDays} hari lalu`;
    }
    const d = new Date(Number(timestamp));
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

/**
 * Mengambil dan menggabungkan data seluruh murid (lokal dan sesi daring) ke dalam satu array.
 * @returns {Array<Object>}
 */
function getAggregatedStudents() {
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
function renderFasilTableAndEWS() {
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
            const cleanClass = (s.kelas || '-').replace(/^kelas\s*/i, '').trim();
            const timeAgoStr = formatTimeAgo(s.lastUpdated);
            const errorCountNum = Number(s.errorCount) || 3;

            ewsList.innerHTML += `
                <div class="ews-card">
                    <div class="ews-card-header">
                        <div class="ews-student-info">
                            <span class="ews-card-name" title="${s.name}">${s.name}</span>
                            <span class="ews-class-badge">${cleanClass || '-'}</span>
                        </div>
                        <span class="ews-card-time"><i class="fa-regular fa-clock"></i> ${timeAgoStr}</span>
                    </div>
                    <div class="ews-issue-chips">
                        <span class="ews-chip chip-level">Lvl ${s.level}</span>
                        ${hasFormulaError ? `<span class="ews-chip chip-formula"><i class="fa-solid fa-triangle-exclamation"></i> ${errorCountNum}x Rumus</span>` : ''}
                        ${hasQuizError ? `<span class="ews-chip chip-quiz"><i class="fa-solid fa-xmark"></i> Kuis Gagal</span>` : ''}
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
function destroyFasilChart() {
    if (fasilChartInstance) {
        fasilChartInstance.destroy();
        fasilChartInstance = null;
    }
}

/**
 * Render atau perbarui Bar Chart distribusi kemampuan murid berdasarkan rentang level.
 * @param {Array} students Daftar seluruh siswa teragregasi
 */
function renderFasilClassChart(students) {
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
function openStudentDetailModal(student) {
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
                    ? '<span style="color:#15803d; font-weight:500;"><i class="fa-solid fa-circle-check"></i> 0</span>'
                    : `<span style="color:#dc2626; font-weight:500;"><i class="fa-solid fa-triangle-exclamation"></i> ${h.errors}x</span>`;

                const quizTotal = h.quizTotal || 0;
                let quizBadge = '-';
                if (quizTotal > 0) {
                    const quizCorrect = h.quizCorrect || 0;
                    const isPerfect = quizCorrect === quizTotal;
                    quizBadge = `<span style="color:${isPerfect ? '#15803d' : '#d97706'}; font-weight:500;">${quizCorrect}/${quizTotal}</span>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight:500; color:#d97706;">Level ${h.level}</td>
                        <td><i class="fa-regular fa-clock" style="color:#b45309;"></i> ${h.duration || 0}s</td>
                        <td class="text-center">${errBadge}</td>
                        <td class="text-center">${quizBadge}</td>
                        <td class="text-right" style="color:#78350f; font-size:0.75rem;">${timeStr}</td>
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
function closeStudentDetailModal() {
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
function handleCopyWhatsAppReport() {
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
function handlePrintDetailedPDF() {
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
                <td class="text-center">${escapeHtml(acc)}</td>
                <td class="text-center">${escapeHtml(quizDisplay)}</td>
                <td class="text-right">Rp ${(s.money || 0).toLocaleString('id-ID')}</td>
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
                        <td class="text-center">${escapeHtml(quizScoreStr)}</td>
                        <td class="text-right">Rp ${Number(revenueVal).toLocaleString('id-ID')}</td>
                        <td class="text-right">Rp ${Number(costVal).toLocaleString('id-ID')}</td>
                        <td class="text-right font-bold">Rp ${Number(profitVal).toLocaleString('id-ID')}</td>
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
            font-family: 'Roboto', Arial, sans-serif;
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
            font-weight: 500;
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
            font-weight: 500;
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
            font-weight: 500;
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
        .font-bold { font-weight: 500; }
        .font-mono { font-family: 'Roboto', Arial, sans-serif; }

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
            font-weight: 500;
        }
        .sign-space {
            height: 48px;
        }
        .sign-name {
            margin: 0;
            font-weight: 500;
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

const handlePrintReport = handlePrintDetailedPDF;

function exportCSV() {
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

function deleteUser(id) {
    if (confirm("Hapus data pemain ini?")) {
        state.users = state.users.filter(u => u.id !== id);
        saveData();
        openFasilitator();
    }
}

function resetAllData() {
    if (confirm("Hapus SEMUA data di perangkat ini? Tindakan ini tidak dapat dibatalkan.")) {
        stopHostRoom();
        state.users = [];
        localStorage.removeItem('algebraMart_users');
        openFasilitator();
    }
}



// ==========================================
// FILE: js/app.js
// ==========================================
// ==========================================
// app.js — Entry Point Utama
// ==========================================












// ==========================================
// VIRTUAL DESKTOP AUTO-SCALING (1280x720)
// ==========================================
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

function getAppScale() {
    const container = document.getElementById('app-container');
    if (container && container.dataset.scale) {
        return parseFloat(container.dataset.scale) || 1;
    }
    return window.__appScale || 1;
}

/**
 * Mendeteksi apakah pengguna mengakses aplikasi dari perangkat ponsel (HP).
 * Memeriksa kombinasi User-Agent, dimensi layar kecil khas ponsel, dan layar sentuh.
 * Menjamin bahwa desktop dan laptop standar (tinggi layar >= 600px) tidak terpengaruh.
 * @returns {boolean}
 */
function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    const winW = Math.max(window.innerWidth, document.documentElement.clientWidth || 0);
    const winH = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);

    // 1. Cek User-Agent (Ponsel Android / iPhone / Mobile)
    const isMobileUA = /Android.*Mobile|iPhone|iPod|Windows Phone|webOS/i.test(navigator.userAgent);

    // 2. Cek Karakteristik Layar Ponsel (Viewport khas ponsel landscape: height <= 520px)
    const isMobileViewport = (winH <= 520 && winW <= 1050) || (winW <= 520 && winH <= 1050);

    // 3. Cek Layar Sentuh & Dimensi Fisik Layar Ponsel
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallPhysicalScreen = typeof window.screen !== 'undefined' &&
        Math.min(window.screen.width, window.screen.height) <= 540;

    return isMobileUA || (isTouch && isSmallPhysicalScreen) || (isTouch && isMobileViewport) || isMobileViewport;
}

function fitScreen() {
    const container = document.getElementById('app-container');
    if (!container) return;

    let winW = window.innerWidth;
    let winH = window.innerHeight;
    if (window.visualViewport) {
        winW = Math.round(window.visualViewport.width);
        winH = Math.round(window.visualViewport.height);
    } else {
        winW = Math.max(window.innerWidth, document.documentElement.clientWidth || 0);
        winH = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
    }

    const aspect = winW / winH;
    const targetAspect = BASE_WIDTH / BASE_HEIGHT; // 1280 / 720 = 1.7777...

    let scale = 1;
    let virtualWidth = BASE_WIDTH;
    let virtualHeight = BASE_HEIGHT;

    if (aspect >= targetAspect) {
        // Layar Ultra-Wide Landscape (e.g. 18:9, 19.5:9, 20:9):
        // Kunci tinggi ke 720px, lebarkan canvas agar mengisi penuh 100vw tanpa pilar hitam di samping (+4px subpixel buffer)
        scale = winH / BASE_HEIGHT;
        virtualWidth = Math.max(BASE_WIDTH, Math.ceil(winW / scale) + 4);
        virtualHeight = BASE_HEIGHT;
    } else {
        // Layar lebih sempit dari 16:9 (tablet 4:3, dll)
        scale = winW / BASE_WIDTH;
        virtualWidth = BASE_WIDTH;
        virtualHeight = Math.max(BASE_HEIGHT, Math.ceil(winH / scale) + 4);
    }

    const sidePad = Math.max(14, Math.round((virtualWidth - 1240) / 2));
    container.style.width = `${virtualWidth}px`;
    container.style.height = `${virtualHeight}px`;
    container.style.setProperty('--side-pad', `${sidePad}px`);
    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
    container.dataset.scale = String(scale);
    container.dataset.virtualWidth = String(virtualWidth);
    container.dataset.virtualHeight = String(virtualHeight);
    window.__appScale = scale;
    window.__virtualWidth = virtualWidth;
    window.__virtualHeight = virtualHeight;

    // Kunci viewport agar tidak pernah ada pergeseran scroll yang merusak posisi kanvas
    window.scrollTo(0, 0);
    if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
    if (document.documentElement.scrollTop !== 0)  document.documentElement.scrollTop = 0;
    if (document.body.scrollLeft !== 0)            document.body.scrollLeft = 0;
    if (document.body.scrollTop !== 0)             document.body.scrollTop = 0;

    // Terapkan penanda kelas is-mobile-device agar skala font ponsel aktif (+31.25%)
    // tanpa mengubah tampilan desktop sama sekali
    const mobile = isMobileDevice();
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('is-mobile-device', mobile);
        document.body.classList.toggle('is-mobile-device', mobile);
    }

    // Deteksi Rotasi Gawai (Landscape Only)
    const rotateOverlay = document.getElementById('rotate-device-overlay');
    if (rotateOverlay) {
        if (winH > winW) {
            rotateOverlay.classList.remove('hidden');
        } else {
            rotateOverlay.classList.add('hidden');
        }
    }
}

// Ekspos ke window untuk integrasi antar-modul
window._endTutorial    = endTutorial;
window._startTutorial  = startTutorial;
window._startLevel     = startLevel;
window._openLevelZero  = openLevelZeroModal;
window._login          = login;
window._fitScreen      = fitScreen;
window._getAppScale    = getAppScale;

// Penskalaan otomatis segera saat skrip dimuat dan saat jendela diubah ukurannya
window.addEventListener('resize', fitScreen);
window.addEventListener('orientationchange', () => {
    setTimeout(fitScreen, 50);
    setTimeout(fitScreen, 200);
});
if (window.screen && window.screen.orientation && typeof window.screen.orientation.addEventListener === 'function') {
    window.screen.orientation.addEventListener('change', () => {
        setTimeout(fitScreen, 50);
        setTimeout(fitScreen, 200);
    });
}
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitScreen);
}
document.addEventListener('fullscreenchange', () => {
    setTimeout(fitScreen, 50);
    setTimeout(fitScreen, 250);
});
document.addEventListener('webkitfullscreenchange', () => {
    setTimeout(fitScreen, 50);
    setTimeout(fitScreen, 250);
});
window.addEventListener('scroll', () => {
    if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
    }
});

// Penanganan Optimasi Gawai Ponsel (Screen Wake Lock & Auto Fullscreen)
function handleMobileOptimizations(e) {
    if (!isMobileDevice()) return;

    // 1. Minta Wake Lock agar layar HP tidak mati otomatis
    requestWakeLock();

    // 2. Minta Fullscreen jika belum aktif (hindari saat fokus mengetik form nama/kelas/token)
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (e && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
            return;
        }
        requestFullScreen();
    }
}

window.addEventListener('touchend', handleMobileOptimizations, { passive: true });
window.addEventListener('click', handleMobileOptimizations, { passive: true });

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
        setTimeout(fitScreen, 50);
    }
});

fitScreen();

let confirmExitReason = 'cashier'; // 'cashier' | 'fullscreen'

// ==========================================
// GATEWAY & AUTH: LOGIN & LOGOUT
// ==========================================

function startFromGateway() {
    requestFullScreen();
    requestWakeLock();
    playBGM();
    switchScreen('screen-login');
}

function createUser() {
    const name   = document.getElementById('new-username').value.trim();
    const gender = document.getElementById('new-gender').value;
    const kelas  = document.getElementById('new-class').value.trim();

    if (!name || !kelas) return showMsg('Error', 'Nama dan Kelas harus diisi!');

    const newUser = {
        id: Date.now().toString(), name, gender, kelas,
        money: 0, revenue: 0, cost: 0, maxLevel: 0,
        badges: [], history: [], createdAt: new Date().toISOString()
    };

    state.users.push(newUser);
    saveData();
    document.getElementById('new-username').value = '';
    document.getElementById('new-class').value    = '';
    login(newUser.id);
}

function login(id) {
    state.currentUser = state.users.find(u => u.id === id);
    if (state.currentUser) {
        playBGM();
        requestFullScreen();
        requestWakeLock();
        switchScreen('screen-lobby');
        // Sinkronisasi profil akun pengguna ke Firebase Realtime Database
        try {
            syncUserProfile(state.currentUser);
        } catch (err) {
            console.warn('[Sync] Gagal sync profile saat login:', err);
        }
    }
}

function logout(targetScreen = 'screen-login') {
    state.currentUser = null;
    pauseBGM();
    renderUserList();
    endTutorial();

    const receiptModal = document.getElementById('receipt-modal');
    if (receiptModal) receiptModal.style.display = "none";

    const quizModal = document.getElementById('quiz-modal');
    if (quizModal) quizModal.classList.add('hidden');

    const msgModal = document.getElementById('modal-msg');
    if (msgModal) msgModal.classList.add('hidden');

    closeModal('modal-settings');
    closeModal('modal-confirm-exit');
    closeModal('modal-badge-detail');
    closeVictoryScreen();

    // Hanya keluar dari layar penuh jika kembali ke gerbang awal (welcome gateway)
    if (targetScreen === 'screen-welcome') {
        exitFullScreen();
    }
    switchScreen(targetScreen);
}

// ==========================================
// NAVIGASI DARI LOBI
// ==========================================

function bukaMenuLevel() {
    playBGM();
    switchScreen('screen-levels');
    showMsg("🎯 Capaian Pembelajaran",
        "<ul>" +
        "<li>Mengenali, memprediksi dan menggeneralisasi pola dalam bentuk susunan benda dan bilangan.</li>" +
        "<li>Menyatakan suatu situasi ke dalam bentuk aljabar.</li>" +
        "<li>Menggunakan sifat-sifat operasi (komutatif, asosiatif, dan distributif) untuk menghasilkan bentuk aljabar yang ekuivalen.</li>" +
        "</ul>"
    );
}

// ==========================================
// SINKRONISASI RUANG KELAS (MURID)
// ==========================================

function openJoinRoomModal() {
    const modal = document.getElementById('modal-join-room');
    const input = document.getElementById('input-room-code');
    const status = document.getElementById('join-room-status');
    const btnLeave = document.getElementById('btn-leave-room');
    if (!modal || !input || !status || !btnLeave) return;

    input.value = state.activeRoomCode || '';
    if (state.activeRoomCode) {
        status.className = 'room-status-text status-success';
        status.innerHTML = `Terhubung ke kelas: <strong>${state.activeRoomCode}</strong>`;
        btnLeave.classList.remove('hidden');
    } else {
        status.className = 'room-status-text';
        status.textContent = 'Belum terhubung ke kelas guru.';
        btnLeave.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    document.getElementById('btn-universal-settings')?.classList.add('hidden');
    input.focus();
}

async function submitJoinRoom() {
    const input = document.getElementById('input-room-code');
    const status = document.getElementById('join-room-status');
    if (!input || !status) return;

    status.className = 'room-status-text';
    status.textContent = 'Memeriksa kode kelas ke server...';

    const result = await joinRoom(input.value);
    if (result.success) {
        status.className = 'room-status-text status-success';
        status.textContent = result.message;
        closeModal('modal-join-room');
        renderLobby();
        showMsg('Terhubung!', `Berhasil bergabung ke kelas <strong>${result.code}</strong>. Progres belajarmu akan otomatis tersinkronisasi ke fasilitator.`);
    } else {
        status.className = 'room-status-text status-error';
        status.textContent = result.message;
    }
}

function handleLeaveRoom() {
    leaveRoom();
    const status = document.getElementById('join-room-status');
    const btnLeave = document.getElementById('btn-leave-room');
    const input = document.getElementById('input-room-code');

    if (input) input.value = '';
    if (btnLeave) btnLeave.classList.add('hidden');
    if (status) {
        status.className = 'room-status-text';
        status.textContent = 'Kamu telah keluar dari kelas.';
    }
    renderLobby();
    showMsg('Keluar Kelas', 'Kamu telah keluar dari sesi kelas guru.');
}

// ==========================================
// MODAL PENGATURAN TERPADU
// ==========================================

function openSettingsModal() {
    playSFX('nav');
    const modal = document.getElementById('modal-settings');
    if (!modal) return;

    // Helper update warna track slider chunky
    const updateSliderFill = (slider, type) => {
        if (!slider) return;
        const pct = slider.value;
        slider.style.background = `linear-gradient(to right, #f59e0b 0%, #fbbf24 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
    };

    // Sinkronisasi slider BGM
    const sliderBgm = document.getElementById('slider-bgm-volume');
    const labelBgm = document.getElementById('bgm-volume-label');
    const btnMuteBgm = document.getElementById('btn-mute-bgm');

    const currentBgmVol = Math.round(getBGMVolume() * 100);
    if (sliderBgm) {
        sliderBgm.value = currentBgmVol;
        updateSliderFill(sliderBgm, 'bgm');
    }
    if (labelBgm) labelBgm.textContent = `${currentBgmVol}%`;
    if (btnMuteBgm) {
        const bgmMuted = isBgmMutedStatus();
        btnMuteBgm.className = bgmMuted ? 'btn-settings-mute muted' : 'btn-settings-mute';
        btnMuteBgm.innerHTML = bgmMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-music"></i>';
        btnMuteBgm.title = bgmMuted ? 'Nyalakan BGM' : 'Bisukan BGM';
    }

    // Sinkronisasi slider SFX
    const sliderSfx = document.getElementById('slider-sfx-volume');
    const labelSfx = document.getElementById('sfx-volume-label');
    const btnMuteSfx = document.getElementById('btn-mute-sfx');

    const currentSfxVol = Math.round(getSFXVolume() * 100);
    if (sliderSfx) {
        sliderSfx.value = currentSfxVol;
        updateSliderFill(sliderSfx, 'sfx');
    }
    if (labelSfx) labelSfx.textContent = `${currentSfxVol}%`;
    if (btnMuteSfx) {
        const sfxMuted = isSfxMutedStatus();
        btnMuteSfx.className = sfxMuted ? 'btn-settings-mute muted' : 'btn-settings-mute';
        btnMuteSfx.innerHTML = sfxMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        btnMuteSfx.title = sfxMuted ? 'Nyalakan SFX' : 'Bisukan SFX';
    }

    // Update status tombol fullscreen
    updateFullscreenBtnUI();

    // Update aksi kontekstual sesuai layar aktif
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        updateUniversalSettingsContext(activeScreen.id);
    }

    modal.classList.remove('hidden');
}

function updateFullscreenBtnUI() {
    const isFs = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement;

    const btn = document.getElementById('btn-toggle-fullscreen');
    if (!btn) return;

    if (isFs) {
        btn.innerHTML = '<i class="fa-solid fa-compress"></i> <span id="fullscreen-btn-text">Keluar Layar Penuh</span>';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-expand"></i> <span id="fullscreen-btn-text">Layar Penuh (Fullscreen)</span>';
    }
}

// ==========================================
// MODAL KONFIRMASI KELUAR GAME
// ==========================================

function showExitConfirmation(reason = 'cashier') {
    confirmExitReason = reason;
    const modal = document.getElementById('modal-confirm-exit');
    const title = document.getElementById('confirm-exit-title');
    const desc = document.getElementById('confirm-exit-desc');
    const btnCancel = document.getElementById('btn-cancel-exit-game');
    const btnConfirm = document.getElementById('btn-confirm-exit-game');

    if (!modal) return;

    if (reason === 'fullscreen') {
        if (title) title.textContent = 'Keluar dari Permainan?';
        if (desc) desc.textContent = 'Anda keluar dari mode layar penuh. Apakah Anda ingin melanjutkan bermain atau keluar dari permainan?';
        if (btnCancel) btnCancel.textContent = 'Lanjutkan Bermain';
        if (btnConfirm) btnConfirm.textContent = 'Keluar Game';
    } else if (reason === 'app_exit') {
        if (title) title.textContent = 'Keluar Game?';
        if (desc) desc.textContent = 'Apakah Anda yakin ingin keluar dari permainan dan kembali ke halaman awal?';
        if (btnCancel) btnCancel.textContent = 'Batal';
        if (btnConfirm) btnConfirm.textContent = 'Ya, Keluar';
    } else {
        if (title) title.textContent = 'Selesaikan Permainan?';
        if (desc) desc.textContent = 'Apakah Anda ingin menyelesaikan permainan dan kembali ke menu tantangan level?';
        if (btnCancel) btnCancel.textContent = 'Batal';
        if (btnConfirm) btnConfirm.textContent = 'Ya, Keluar';
    }

    modal.classList.remove('hidden');
}

function handleConfirmExitCancel() {
    const modal = document.getElementById('modal-confirm-exit');
    if (modal) modal.classList.add('hidden');

    if (confirmExitReason === 'fullscreen') {
        requestFullScreen();
    }
}

function handleConfirmExitExecute() {
    const modal = document.getElementById('modal-confirm-exit');
    if (modal) modal.classList.add('hidden');

    endTutorial();
    closeLevelZeroModal();
    const receiptModal = document.getElementById('receipt-modal');
    if (receiptModal) receiptModal.style.display = "none";
    const quizModal = document.getElementById('quiz-modal');
    if (quizModal) quizModal.classList.add('hidden');
    closeVictoryScreen();
    const formulaInput = document.getElementById("formula-box");
    if (formulaInput) formulaInput.value = "";
    const paidInput = document.getElementById("paid-box");
    if (paidInput) paidInput.value = "";
    state.activePlayingLevel = null;
    state.selectedProducts = [];
    state.tagihanTervalidasi = 0;
    const trayItems = document.getElementById("tray-items");
    if (trayItems) trayItems.innerHTML = "";
    const hargaDisplay = document.getElementById("harga-display");
    if (hargaDisplay) { hargaDisplay.textContent = ""; }

    if (confirmExitReason === 'fullscreen' || confirmExitReason === 'app_exit') {
        logout('screen-welcome');
        pauseBGM();
    } else {
        try {
            if (state.currentUser) {
                sendStudentProgress(state.currentUser, state.currentLevelIdx);
            }
        } catch (err) { console.warn(err); }
        switchScreen('screen-levels');
    }
}

// ==========================================
// EVENT LISTENERS GLOBAL
// ==========================================

function bindEvents() {
    // --- Layar Gerbang Awal (Welcome) ---
    document.getElementById('btn-start-game-gateway')?.addEventListener('click', startFromGateway);

    // --- Tombol Pengaturan Universal Melayang ---
    document.getElementById('btn-universal-settings')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openSettingsModal();
    });

    // --- Modal Pengaturan: Tutup ---
    document.getElementById('btn-close-settings-x')?.addEventListener('click', () => closeModal('modal-settings'));
    document.getElementById('btn-close-settings')?.addEventListener('click', () => closeModal('modal-settings'));

    // --- Modal Pengaturan: Audio Controls ---
    const sliderBgm = document.getElementById('slider-bgm-volume');
    const labelBgm = document.getElementById('bgm-volume-label');
    if (sliderBgm) {
        sliderBgm.addEventListener('input', (e) => {
            const pct = parseInt(e.target.value, 10);
            setBGMVolume(pct / 100);
            if (labelBgm) labelBgm.textContent = `${pct}%`;
            sliderBgm.style.background = `linear-gradient(to right, #f59e0b 0%, #fbbf24 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
        });
    }

    const btnMuteBgm = document.getElementById('btn-mute-bgm');
    if (btnMuteBgm) {
        btnMuteBgm.addEventListener('click', () => {
            const isMuted = toggleBGMMute();
            btnMuteBgm.className = isMuted ? 'btn-settings-mute muted' : 'btn-settings-mute';
            btnMuteBgm.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-music"></i>';
            btnMuteBgm.title = isMuted ? 'Nyalakan BGM' : 'Bisukan BGM';
        });
    }

    const sliderSfx = document.getElementById('slider-sfx-volume');
    const labelSfx = document.getElementById('sfx-volume-label');
    if (sliderSfx) {
        sliderSfx.addEventListener('input', (e) => {
            const pct = parseInt(e.target.value, 10);
            setSFXVolume(pct / 100);
            if (labelSfx) labelSfx.textContent = `${pct}%`;
            sliderSfx.style.background = `linear-gradient(to right, #f59e0b 0%, #fbbf24 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
        });
    }

    const btnMuteSfx = document.getElementById('btn-mute-sfx');
    if (btnMuteSfx) {
        btnMuteSfx.addEventListener('click', () => {
            const isMuted = toggleSFXMute();
            btnMuteSfx.className = isMuted ? 'btn-settings-mute muted' : 'btn-settings-mute';
            btnMuteSfx.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
            btnMuteSfx.title = isMuted ? 'Nyalakan SFX' : 'Bisukan SFX';
        });
    }

    // --- Modal Pengaturan: Aksi Kontekstual Dinamis (Kiri & Kanan) ---
    document.getElementById('btn-settings-fasil')?.addEventListener('click', () => {
        closeModal('modal-settings');
        showFasilitatorLogin();
    });

    document.getElementById('btn-settings-switch-user')?.addEventListener('click', () => {
        closeModal('modal-settings');
        logout('screen-login');
    });

    document.getElementById('btn-settings-exit-game')?.addEventListener('click', () => {
        closeModal('modal-settings');
        const activeScreen = document.querySelector('.screen.active');
        const currentScreenId = activeScreen ? activeScreen.id : '';
        if (currentScreenId === 'screen-game') {
            showExitConfirmation('cashier');
        } else {
            showExitConfirmation('app_exit');
        }
    });

    // --- Login Screen ---
    document.getElementById('new-username')?.addEventListener('keydown', e => { if (e.key === 'Enter') createUser(); });
    document.querySelector('.btn-add-user')?.addEventListener('click', createUser);

    // --- Lobby Screen ---
    document.querySelector('.btn-logout')?.addEventListener('click', () => logout('screen-login'));
    document.querySelector('.btn-start-game')?.addEventListener('click', bukaMenuLevel);
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.querySelector('.fa-book'))   btn.addEventListener('click', () => openBukuKas());
        if (btn.querySelector('.fa-trophy')) btn.addEventListener('click', () => openPrestasi());
    });

    // --- Sinkronisasi Kelas Guru (Murid) ---
    document.getElementById('btn-open-join-room')?.addEventListener('click', openJoinRoomModal);
    document.getElementById('btn-cancel-join-room')?.addEventListener('click', () => closeModal('modal-join-room'));
    document.getElementById('btn-leave-room')?.addEventListener('click', handleLeaveRoom);
    document.getElementById('btn-submit-join-room')?.addEventListener('click', submitJoinRoom);

    const roomInput = document.getElementById('input-room-code');
    if (roomInput) {
        roomInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        roomInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitJoinRoom();
        });
    }

    // --- Levels Screen ---
    document.querySelector('#screen-levels .btn-back')?.addEventListener('click', () => switchScreen('screen-lobby'));

    document.getElementById('tab-level-easy')?.addEventListener('click', () => {
        playSFX('nav');
        state.currentLevelTab = 'easy';
        renderLevels();
    });

    document.getElementById('tab-level-hard')?.addEventListener('click', () => {
        playSFX('nav');
        const maxLevel = state.currentUser ? (state.currentUser.maxLevel || 0) : 0;
        if (maxLevel < 10) {
            showMsg(
                'Tantangan Terkunci 🔒',
                'Kamu harus menyelesaikan seluruh <strong>10 Level Tantangan Mudah</strong> terlebih dahulu untuk membuka Tantangan Sulit!'
            );
            return;
        }
        state.currentLevelTab = 'hard';
        renderLevels();
    });

    // --- Game Screen: Tombol Kembali/Selesaikan dengan Dialog Konfirmasi ---
    document.getElementById('btn-back-menu')?.addEventListener('click', () => {
        showExitConfirmation('cashier');
    });

    document.getElementById('btn-cancel-exit-game')?.addEventListener('click', handleConfirmExitCancel);
    document.getElementById('btn-confirm-exit-game')?.addEventListener('click', handleConfirmExitExecute);

    // --- Buku Kas Screen ---
    document.querySelector('#screen-bukukas .btn-back')?.addEventListener('click', () => switchScreen('screen-lobby'));
    document.querySelectorAll('.btn-charity').forEach(btn => {
        btn.addEventListener('click', () => {
            const nominal = parseInt(btn.dataset.nominal, 10) || 1000;
            handleDonate(nominal);
        });
    });

    // --- Prestasi Screen ---
    document.querySelector('#screen-prestasi .btn-back')?.addEventListener('click', () => switchScreen('screen-lobby'));
    document.querySelector('.btn-copy')?.addEventListener('click', copyToken);

    // --- Fasilitator Screen ---
    document.querySelector('.btn-exit-fasil')?.addEventListener('click', () => {
        destroyFasilChart();
        switchScreen('screen-login');
    });
    document.getElementById('btn-refresh-fasil')?.addEventListener('click', () => {
        playSFX('nav');
        forceRefreshFasilData();
    });
    document.getElementById('btn-print-report')?.addEventListener('click', handlePrintDetailedPDF);
    document.getElementById('btn-copy-wa')?.addEventListener('click', handleCopyWhatsAppReport);
    document.querySelector('.btn-export')?.addEventListener('click', exportCSV);
    document.querySelector('.btn-reset-data')?.addEventListener('click', resetAllData);
    document.getElementById('btn-create-room')?.addEventListener('click', handleCreateHostRoom);
    document.getElementById('btn-copy-room-code')?.addEventListener('click', handleCopyHostRoomCode);
    document.getElementById('btn-load-fasil-room')?.addEventListener('click', handleLoadSpecificRoom);
    const inputFasilRoomCode = document.getElementById('input-fasil-room-code');
    if (inputFasilRoomCode) {
        inputFasilRoomCode.addEventListener('input', e => {
            e.target.value = e.target.value.toUpperCase();
        });
        inputFasilRoomCode.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLoadSpecificRoom();
            }
        });
    }
    document.querySelectorAll('.fasil-table thead th.sortable-th').forEach(th => {
        th.addEventListener('click', () => {
            if (th.dataset.sort) {
                playSFX('click');
                handleSortFasilTable(th.dataset.sort);
            }
        });
    });

    // --- Modal PIN ---
    document.getElementById('btn-pin-cancel')?.addEventListener('click', () => closeModal('modal-pin'));
    document.querySelector('#modal-pin .btn-secondary')?.addEventListener('click', () => closeModal('modal-pin'));
    document.getElementById('btn-pin-submit')?.addEventListener('click', checkPIN);
    document.querySelector('#modal-pin .btn-primary')?.addEventListener('click', checkPIN);
    document.getElementById('pin-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') checkPIN(); });

    // --- Modal Detail Rapor Siswa ---
    document.getElementById('btn-close-student-detail')?.addEventListener('click', () => closeModal('modal-student-detail'));
    document.getElementById('btn-done-student-detail')?.addEventListener('click', () => closeModal('modal-student-detail'));

    // --- Modal Detail Lencana Prestasi ---
    document.getElementById('btn-close-badge-detail')?.addEventListener('click', () => closeModal('modal-badge-detail'));
    document.getElementById('modal-badge-detail')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-badge-detail') closeModal('modal-badge-detail');
    });

    // --- Modal Pesan ---
    document.querySelector('#modal-msg .btn-primary')?.addEventListener('click', () => closeModal('modal-msg'));

    // --- Kuis ---
    document.getElementById('btn-confirm-quiz')?.addEventListener('click', confirmQuizAnswer);
    document.getElementById('btn-next-quiz')?.addEventListener('click', nextQuizQuestion);

    // --- Modal Layar Kemenangan (Victory Screen) ---
    initVictoryListeners({
        onRetry: (lvl) => {
            startLevel(lvl);
        },
        onMenu: (snap) => {
            switchScreen('screen-levels');
            if (snap && snap.unlockedHardJustNow) {
                setTimeout(() => {
                    showMsg(
                        '🎉 TANTANGAN SULIT TERBUKA!',
                        'Luar biasa! Kamu berhasil menamatkan seluruh 10 Level Tantangan Mudah!<br><br>Mode <strong>Tantangan Sulit</strong> kini telah terbuka dengan studi kasus nyata!'
                    );
                }, 250);
            }
        },
        onNext: (nextLvl, snap) => {
            if (snap && snap.unlockedHardJustNow) {
                state.currentLevelTab = 'hard';
            }
            startLevel(nextLvl);
        }
    });

    // --- Item Rak Barang (data-var) ---
    document.querySelectorAll('.clickable-item[data-var]').forEach(item => {
        item.addEventListener('click', () => addVariable(item.dataset.var));
    });
}

// ==========================================
// FULLSCREEN CHANGE HANDLER
// ==========================================

function handleFullscreenChange() {
    const isFullscreenNow = document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.mozFullScreenElement ||
                            document.msFullscreenElement;

    updateFullscreenBtnUI();

    const activeScreen = document.querySelector('.screen.active');
    const currentScreenId = activeScreen ? activeScreen.id : '';

    // Jika pengguna keluar dari layar penuh secara paksa (Esc, hover X bar browser, dll)
    // dan sedang berada di dalam game (bukan layar gerbang welcome),
    // tampilkan modal konfirmasi untuk memilih Lanjut Game atau Keluar Game.
    if (!isFullscreenNow && currentScreenId && currentScreenId !== 'screen-welcome') {
        showExitConfirmation('fullscreen');
    }
}

// Tangkap penekanan F11 agar memicu pop up konfirmasi yang konsisten
window.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
        e.preventDefault();
        const activeScreen = document.querySelector('.screen.active');
        const currentScreenId = activeScreen ? activeScreen.id : '';
        if (currentScreenId && currentScreenId !== 'screen-welcome') {
            showExitConfirmation('fullscreen');
        }
    }
});

document.addEventListener('fullscreenchange',        handleFullscreenChange);
document.addEventListener('webkitfullscreenchange',  handleFullscreenChange);
document.addEventListener('mozfullscreenchange',     handleFullscreenChange);
document.addEventListener('MSFullscreenChange',      handleFullscreenChange);

// ==========================================
// INIT
// ==========================================

function initApp() {
    fitScreen();
    initAudio();
    renderUserList();
    initGameListeners();
    initTutorialEvents();
    initLevelZeroEvents();
    bindEvents();

    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        updateUniversalSettingsContext(activeScreen.id);
    }

    // Jika pengguna sudah memiliki sesi login aktif saat memuat game, sinkronkan ke Firebase
    if (state.currentUser) {
        try {
            syncUserProfile(state.currentUser);
        } catch (err) {
            console.warn('[Sync] Gagal sync profile saat inisialisasi:', err);
        }
    }

    // Listener saat perangkat kembali daring (online), otomatis sinkronkan profil akun
    window.addEventListener('online', () => {
        if (state.currentUser) {
            console.log('[Sync] Koneksi internet kembali aktif, menyinkronkan profil akun...');
            syncUserProfile(state.currentUser);
        }
    });

    // Autoplay unlocker: memutar BGM secara mulus setelah interaksi pertama pengguna jika sudah di dalam game
    const unlockAutoplay = () => {
        initAudio();
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen && currentScreen.id !== 'screen-welcome') {
            playBGM();
        }
        window.removeEventListener('click', unlockAutoplay);
        window.removeEventListener('keydown', unlockAutoplay);
        window.removeEventListener('touchstart', unlockAutoplay);
    };
    window.addEventListener('click', unlockAutoplay);
    window.addEventListener('keydown', unlockAutoplay);
    window.addEventListener('touchstart', unlockAutoplay);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

})();
