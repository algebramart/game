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

const lastSfxTime = {};

/**
 * Memulai pemutaran musik latar belakang (BGM).
 */
export function playBGM() {
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

let wasBgmPlayingBeforeHidden = false;

/**
 * Menangani jeda audio otomatis saat pengguna keluar game, meminimalkan browser,
 * beralih aplikasi di HP, atau mematikan layar (tanpa menghapus history di RAM).
 */
export function handleAppVisibilityChange() {
    if (typeof document === 'undefined') return;

    if (document.hidden || document.visibilityState === 'hidden') {
        // Pengguna beralih aplikasi di HP / meminimalkan jendela game
        if (bgmAudio && !bgmAudio.paused) {
            wasBgmPlayingBeforeHidden = true;
            bgmAudio.pause();
        } else {
            wasBgmPlayingBeforeHidden = false;
        }

        // Hentikan seketika pembacaan suara narator Web Speech API
        stopNarrator();
    } else if (document.visibilityState === 'visible') {
        // Pengguna kembali membuka game dari RAM
        if (wasBgmPlayingBeforeHidden && !isBgmMuted && bgmAudio && bgmStarted) {
            bgmAudio.play().catch(err => {
                console.warn('[Audio] Resume BGM otomatis tertunda:', err);
            });
        }
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleAppVisibilityChange);
}
if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', handleAppVisibilityChange);
    window.addEventListener('freeze', handleAppVisibilityChange);
    window.addEventListener('beforeunload', () => {
        pauseBGM();
        stopNarrator();
    });
    window.addEventListener('blur', () => {
        if (document.hidden) {
            handleAppVisibilityChange();
        }
    });
}

/**
 * Memutar efek suara (SFX) berdasarkan identifier.
 * Mendukung polyphonic/concurrent playback melalui kloning instan.
 * @param {keyof typeof SFX_MAP} sfxKey
 */
export function playSFX(sfxKey) {
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

// ==========================================
// WEB SPEECH API — SUARA NARATOR INTERAKTIF
// ==========================================

let activeUtterance = null;
let cachedIndonesianVoice = null;
let isNarratorActive = false;
const narratorListeners = new Set();

export function addNarratorListener(callback) {
    if (typeof callback === 'function') {
        narratorListeners.add(callback);
    }
}

export function removeNarratorListener(callback) {
    narratorListeners.delete(callback);
}

function notifyNarratorListeners(isSpeaking) {
    narratorListeners.forEach(cb => {
        try { cb(isSpeaking); } catch (e) { console.warn(e); }
    });
}

export function isNarratorSpeaking() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return isNarratorActive && window.speechSynthesis.speaking;
}

/**
 * Memeriksa apakah sebuah objek SpeechSynthesisVoice adalah suara Bahasa Indonesia.
 * Mendeteksi tag bahasa BCP 47 (id-ID, id, in-ID, in) serta nama suara khas Indonesia
 * (seperti Google Bahasa Indonesia, Microsoft Gadis/Ardi Natural, Apple Damayanti, dll).
 * @param {SpeechSynthesisVoice} v
 * @returns {boolean}
 */
export function isIndonesianVoice(v) {
    if (!v) return false;
    const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
    const name = (v.name || '').toLowerCase();

    // 1. Tag bahasa resmi Indonesia (id, id-ID, id-*)
    if (lang === 'id' || lang === 'id-id' || lang.startsWith('id-')) return true;

    // 2. Tag bahasa Android legacy (Java Locale "in", "in-ID")
    if (lang === 'in' || lang === 'in-id' || lang.startsWith('in-')) return true;

    // 3. Nama suara yang secara eksplisit memuat kata indonesia/bahasa
    if (name.includes('indonesia') || name.includes('indonesian') || name.includes('bahasa')) return true;

    // 4. Nama karakter suara TTS Indonesia bawaan Windows/macOS/Edge
    if (name.includes('gadis') || name.includes('ardi') || name.includes('andika') || name.includes('damayanti')) return true;

    return false;
}

export function resolveIndonesianVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (cachedIndonesianVoice) return cachedIndonesianVoice;
    try {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;

        const indonesianVoices = voices.filter(isIndonesianVoice);
        if (!indonesianVoices.length) return null;

        // Prioritaskan suara natural / Google / Microsoft Gadis/Ardi yang bersuara jernih dan ramah
        const preferredVoice = indonesianVoices.find(v => {
            const name = (v.name || '').toLowerCase();
            return name.includes('natural') || name.includes('google') || name.includes('gadis') || name.includes('ardi');
        });

        const best = preferredVoice || indonesianVoices[0];
        if (best) cachedIndonesianVoice = best;
        return best;
    } catch (e) {
        return null;
    }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const handleVoicesChanged = () => {
        cachedIndonesianVoice = null;
        resolveIndonesianVoice();
    };
    if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
}

/**
 * Membacakan teks narator otomatis menggunakan Web Speech API (bahasa Indonesia).
 * Digunakan untuk walkthrough tutorial dan modul pengantar Level 0.
 * DIJAMIN 100% TIDAK AKAN MENGGUNAKAN SUARA BAHASA INGGRIS.
 * @param {string} text
 */
export function speakNarrator(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSfxMuted) return;

    try {
        window.speechSynthesis.cancel();
        isNarratorActive = false;

        // Hapus tag HTML dan rapikan teks
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!cleanText) {
            notifyNarratorListeners(false);
            return;
        }

        const executeSpeak = (voice) => {
            // STRICT SAFETY GUARD: Jika tidak ada suara Bahasa Indonesia, jangan pernah membaca dengan suara Inggris!
            if (!voice || !isIndonesianVoice(voice)) {
                console.warn('[Audio] Tidak ditemukan suara resmi Bahasa Indonesia di peramban ini. Pembacaan suara dibatalkan agar tidak menggunakan aksen bahasa Inggris.');
                isNarratorActive = false;
                notifyNarratorListeners(false);
                return;
            }

            try {
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.voice = voice;
                utterance.lang = voice.lang || 'id-ID';
                utterance.rate = 0.95; // Kecepatan artikulasi ramah siswa
                utterance.pitch = 1.05;
                utterance.volume = Math.max(0.1, sfxVolume);

                utterance.onstart = () => {
                    isNarratorActive = true;
                    notifyNarratorListeners(true);
                };

                utterance.onend = () => {
                    isNarratorActive = false;
                    activeUtterance = null;
                    notifyNarratorListeners(false);
                };

                utterance.onerror = (e) => {
                    isNarratorActive = false;
                    activeUtterance = null;
                    notifyNarratorListeners(false);
                };

                activeUtterance = utterance;
                isNarratorActive = true;
                notifyNarratorListeners(true);
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn('[Audio] Gagal membacakan teks narator:', err);
                isNarratorActive = false;
                notifyNarratorListeners(false);
            }
        };

        const immediateVoice = resolveIndonesianVoice();
        if (immediateVoice) {
            executeSpeak(immediateVoice);
        } else {
            // Jika daftar suara browser belum terisi (sering terjadi saat halaman baru dimuat di Chromium),
            // tunggu pemuatan getVoices() hingga maksimal 300ms.
            let hasHandled = false;
            const onVoicesLoaded = () => {
                if (hasHandled) return;
                const v = resolveIndonesianVoice();
                if (v) {
                    hasHandled = true;
                    if (window.speechSynthesis.removeEventListener) {
                        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesLoaded);
                    }
                    executeSpeak(v);
                }
            };

            if (window.speechSynthesis.addEventListener) {
                window.speechSynthesis.addEventListener('voiceschanged', onVoicesLoaded);
            }

            setTimeout(() => {
                if (!hasHandled) {
                    hasHandled = true;
                    if (window.speechSynthesis.removeEventListener) {
                        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesLoaded);
                    }
                    executeSpeak(resolveIndonesianVoice());
                }
            }, 300);
        }
    } catch (err) {
        console.warn('[Audio] Gagal inisialisasi narator:', err);
        isNarratorActive = false;
        notifyNarratorListeners(false);
    }
}

/**
 * Menghentikan pembacaan narator suara seketika.
 */
export function stopNarrator() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}
    }
    isNarratorActive = false;
    activeUtterance = null;
    notifyNarratorListeners(false);
}
