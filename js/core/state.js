// ==========================================
// core/state.js — Pusat State Aplikasi
// ==========================================

/**
 * Satu objek terpusat untuk semua state gameplay.
 * Diimpor oleh modul lain yang perlu membaca/menulis state.
 */
export const state = {
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

    // --- Level & Pelanggan ---
    currentLevelTab: 'easy', // 'easy' (1-10) atau 'hard' (11-20)
    currentLevelIdx: 1,
    currentCustomerIdx: 0,
    /** @type {Array} */ levelCustomers: [],
    levelAccumulation: { revenue: 0, cost: 0, profit: 0, errors: 0 },

    // --- Tutorial ---
    isTutorialActive: false,
    currentTutorialStep: 0,

    // --- Sinkronisasi Kelas (Hybrid Offline + Realtime) ---
    /** @type {string|null} */ activeRoomCode: localStorage.getItem('algebraMart_roomCode') || null,
    /** @type {string|null} */ hostedRoomCode: localStorage.getItem('algebraMart_hostedRoom') || null,
    /** @type {Object} */ onlineStudents: {},
};

