// ==========================================
// core/sync.js — Sinkronisasi Hybrid (Luring + Daring Firebase Modular SDK)
// ==========================================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, set, onValue, off } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
import { state } from './state.js';

let syncChannel = null;
let fbStudentsRef = null;
let fbUnsubscribe = null;
let dbInstance = null;
let storageEventHandler = null;

// =========================================================================
// KONFIGURASI FIREBASE REALTIME DATABASE (MODULAR SDK v12)
// =========================================================================
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBBzf_KBnM93JCD5PXwXVzHwItz5I_cANM",
    authDomain: "algebra-mart.firebaseapp.com",
    databaseURL: "https://algebra-mart-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "algebra-mart",
    storageBucket: "algebra-mart.firebasestorage.app",
    messagingSenderId: "769568456143",
    appId: "1:769568456143:web:3908db2af0b6fc566b66ba"
};

// Inisialisasi BroadcastChannel untuk komunikasi antar-tab/perangkat luring instan
try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        syncChannel = new BroadcastChannel('algebra_mart_room_sync');
    }
} catch (e) {
    console.warn('[Sync] BroadcastChannel tidak tersedia:', e);
}

/**
 * Inisialisasi aman Firebase Realtime Database menggunakan Modular SDK (v12).
 * Inisialisasi hanya berjalan sekali via getApps().length === 0 ? initializeApp(...) : getApps()[0].
 * 100% Zero-Crash: Jika offline atau inisialisasi gagal, fallback ke mode luring tanpa melempar error.
 * @returns {object|null} Instance Firebase Realtime Database
 */
export function initFirebase() {
    if (dbInstance) return dbInstance;

    try {
        const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
        dbInstance = getDatabase(app);
        console.log('[Sync] Firebase Realtime Database Modular berhasil disiapkan.');
        return dbInstance;
    } catch (err) {
        console.warn('[Sync] Gagal inisialisasi Firebase Modular (tetap aman luring):', err.message);
        return null;
    }
}

/**
 * Menghasilkan Kode Ruang acak 6 karakter unik dengan format ALJ + 3 karakter (misal: ALJ7A1).
 * @returns {string}
 */
export function generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Tanpa karakter ambigu (0, O, 1, I)
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ALJ${randomPart}`;
}

/**
 * Memulai sesi hosting oleh Fasilitator/Guru.
 * Mendengarkan data murid secara realtime baik melalui Firebase RTDB Modular maupun BroadcastChannel luring.
 * 
 * @param {Function} onStudentsUpdate Callback saat ada pembaruan data murid: (studentsMap) => void
 * @param {boolean} [forceNew=false] Jika true, paksa membuat kode ruang baru meskipun sudah ada sesi aktif
 * @returns {string} Kode ruang yang di-host
 */
export function startHostRoom(onStudentsUpdate, forceNew = false) {
    const db = initFirebase();

    // Hasilkan kode baru hanya jika diminta membuat baru atau belum ada sesi tersimpan
    if (forceNew || !state.hostedRoomCode) {
        state.hostedRoomCode = generateRoomCode();
    }
    const roomCode = state.hostedRoomCode;

    // Simpan kode ruang fasilitator ke localStorage agar persisten saat refresh (Tugas 2)
    try {
        localStorage.setItem('algebraMart_hostedRoom', roomCode);
    } catch (e) {
        console.warn('[Sync] Gagal menyimpan algebraMart_hostedRoom ke localStorage:', e);
    }

    state.onlineStudents = {};

    console.log(`[Sync] Fasilitator membuka sesi kelas: ${roomCode}`);

    // Lepas listener Firebase sebelumnya jika sudah ada agar tidak ganda saat re-attach
    if (fbUnsubscribe) {
        try {
            fbUnsubscribe();
        } catch (e) { /* ignore */ }
        fbUnsubscribe = null;
    }
    if (fbStudentsRef) {
        try {
            off(fbStudentsRef);
        } catch (e) { /* ignore */ }
        fbStudentsRef = null;
    }

    // 1. Kanal Lokal / Luring (BroadcastChannel & Storage Event)
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

    // 2. Kanal Daring (Firebase RTDB Modular)
    if (db) {
        try {
            const studentsRef = ref(db, `rooms/${roomCode}/students`);
            fbStudentsRef = studentsRef;
            fbUnsubscribe = onValue(studentsRef, (snapshot) => {
                const data = snapshot.val() || {};
                // Gabungkan data online dengan data lokal
                Object.assign(state.onlineStudents, data);
                if (typeof onStudentsUpdate === 'function') {
                    onStudentsUpdate(state.onlineStudents);
                }
            }, (error) => {
                console.warn('[Sync] Firebase RTDB listener error (fallback luring tetap aktif):', error.message);
            });
        } catch (fbErr) {
            console.warn('[Sync] Gagal menghubungkan listener Firebase:', fbErr.message);
        }
    }

    return roomCode;
}

/**
 * Menghentikan sesi hosting fasilitator dan membersihkan penyimpanan serta listener.
 */
export function stopHostRoom() {
    if (fbUnsubscribe) {
        try {
            fbUnsubscribe();
        } catch (e) { /* ignore */ }
        fbUnsubscribe = null;
    }
    if (fbStudentsRef) {
        try {
            off(fbStudentsRef);
        } catch (e) { /* ignore */ }
        fbStudentsRef = null;
    }
    if (typeof window !== 'undefined' && storageEventHandler) {
        window.removeEventListener('storage', storageEventHandler);
        storageEventHandler = null;
    }
    state.hostedRoomCode = null;
    state.onlineStudents = {};
    try {
        localStorage.removeItem('algebraMart_hostedRoom');
    } catch (e) {
        console.warn('[Sync] Gagal menghapus algebraMart_hostedRoom dari localStorage:', e);
    }
    console.log('[Sync] Sesi host fasilitator telah dihentikan.');
}

/**
 * Siswa bergabung ke kelas fasilitator menggunakan Kode Ruang.
 * @param {string} code 
 * @returns {{success: boolean, message: string, code?: string}}
 */
export function joinRoom(code) {
    if (!code) {
        return { success: false, message: 'Kode ruang tidak boleh kosong.' };
    }

    const cleanedCode = code.trim().toUpperCase();
    if (cleanedCode.length !== 6) {
        return { success: false, message: 'Kode ruang harus terdiri dari 6 karakter (contoh: ALJ7A1).' };
    }

    state.activeRoomCode = cleanedCode;
    try {
        localStorage.setItem('algebraMart_roomCode', cleanedCode);
    } catch (e) { /* ignore */ }

    console.log(`[Sync] Murid berhasil bergabung ke ruang: ${cleanedCode}`);
    return { success: true, message: `Berhasil terhubung ke kelas ${cleanedCode}!`, code: cleanedCode };
}

/**
 * Siswa keluar dari kelas fasilitator.
 */
export function leaveRoom() {
    state.activeRoomCode = null;
    try {
        localStorage.removeItem('algebraMart_roomCode');
    } catch (e) { /* ignore */ }
    console.log('[Sync] Murid keluar dari kelas.');
}

/**
 * Mengirim payload progres belajar murid ke guru secara realtime.
 * Aman luring: Mengirim melalui BroadcastChannel & Storage Event lokal,
 * serta Firebase RTDB jika ada koneksi daring.
 * 
 * @param {Object} user Objek murid dari state.currentUser
 * @param {number} levelIdx Nomor level yang baru diselesaikan
 * @param {number} errors Jumlah kesalahan rumus pada level ini
 * @param {number} quizCorrect Jumlah jawaban kuis benar
 * @param {number} quizTotal Total soal kuis
 * @returns {boolean} Status pengiriman
 */
export function sendStudentProgress(user, levelIdx, errors = 0, quizCorrect = 0, quizTotal = 0) {
    if (!user) return false;
    const roomCode = state.activeRoomCode;
    if (!roomCode) {
        // Murid tidak sedang terhubung ke kelas guru, lewati sinkronisasi
        return false;
    }

    // Hitung akurasi kumulatif berdasarkan user.history
    const history = Array.isArray(user.history) ? user.history : [];
    const totalLevels = history.length;
    const zeroErrors = history.filter(h => (h.errors || 0) === 0).length;
    const accuracy = totalLevels === 0 ? 100 : Math.round((zeroErrors / totalLevels) * 100);

    const studentId = String(user.id || user.name || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');

    const payload = {
        studentId: studentId,
        name: user.name || 'Siswa',
        kelas: user.kelas || user.class || '-',
        gender: user.gender || 'Laki-laki',
        level: levelIdx || 1,
        activeLevel: state.activePlayingLevel || null,
        maxLevel: Math.max(user.maxLevel || 1, levelIdx || 1),
        laba: user.money !== undefined ? user.money : (user.laba || 0),
        accuracy: accuracy,
        errorCount: Number(errors) || 0,
        quizScore: `${quizCorrect}/${quizTotal}`,
        quizWrong: (Number(quizTotal) - Number(quizCorrect)) || 0,
        history: user.history || [],
        lastUpdated: Date.now()
    };

    console.log(`[Sync] Mengirim progres murid ke ruang [${roomCode}]:`, payload);

    // 1. Kirim via BroadcastChannel lokal
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

    // 2. Kirim via localStorage event (fallback antar-tab luring)
    try {
        localStorage.setItem('algebramart_sync_msg', JSON.stringify({
            roomCode: roomCode,
            data: payload,
            t: Date.now()
        }));
    } catch (e) { /* ignore */ }

    // 3. Kirim via Firebase Realtime Database Modular jika daring
    try {
        const db = initFirebase();
        if (db) {
            const studentRef = ref(db, `rooms/${roomCode}/students/${studentId}`);
            set(studentRef, payload)
                .then(() => {
                    console.log('[Sync] Progres murid tersinkron ke Firebase RTDB.');
                })
                .catch((fbErr) => {
                    console.warn('[Sync] Gagal kirim ke Firebase RTDB (tetap tersimpan luring):', fbErr.message);
                });
        }
    } catch (err) {
        console.warn('[Sync] Kesalahan sinkronisasi online:', err.message);
    }

    return true;
}

