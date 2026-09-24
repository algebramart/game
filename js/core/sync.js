// ==========================================
// core/sync.js — Sinkronisasi Hybrid (Luring + Daring Firebase)
// ==========================================
import { state } from './state.js';

let syncChannel = null;
let fbDbRef = null;
let isFirebaseReady = false;
let storageEventHandler = null;

// =========================================================================
// KONFIGURASI FIREBASE REALTIME DATABASE (TUGAS 1)
// Ganti nilai di bawah ini dengan konfigurasi dari Firebase Console proyek Anda:
// Firebase Console -> Project Settings -> General -> Your apps -> Web app (</>)
// =========================================================================
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAlgebraMartFallbackKey2026",
    authDomain: "algebra-mart.firebaseapp.com",
    databaseURL: "https://algebra-mart-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "algebra-mart",
    storageBucket: "algebra-mart.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
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
 * Inisialisasi aman Firebase Realtime Database jika SDK tersedia di window.
 * 100% Zero-Crash: Jika offline atau konfigurasi gagal, fallback ke mode luring tanpa melempar error.
 */
export function initFirebase() {
    if (typeof window === 'undefined' || !window.firebase) {
        console.log('[Sync] Firebase SDK tidak ditemukan, berjalan dalam mode murni luring.');
        return false;
    }

    if (isFirebaseReady) return true;

    try {
        if (!window.firebase.apps || window.firebase.apps.length === 0) {
            window.firebase.initializeApp(FIREBASE_CONFIG);
        }
        isFirebaseReady = true;
        console.log('[Sync] Firebase Realtime Database berhasil disiapkan.');
        return true;
    } catch (err) {
        console.warn('[Sync] Gagal inisialisasi Firebase (tetap aman luring):', err.message);
        isFirebaseReady = false;
        return false;
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
 * Mendengarkan data murid secara realtime baik melalui Firebase RTDB maupun BroadcastChannel luring.
 * 
 * @param {Function} onStudentsUpdate Callback saat ada pembaruan data murid: (studentsMap) => void
 * @param {boolean} [forceNew=false] Jika true, paksa membuat kode ruang baru meskipun sudah ada sesi aktif
 * @returns {string} Kode ruang yang di-host
 */
export function startHostRoom(onStudentsUpdate, forceNew = false) {
    initFirebase();

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
    if (fbDbRef) {
        try {
            fbDbRef.off();
        } catch (e) { /* ignore */ }
        fbDbRef = null;
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

    // 2. Kanal Daring (Firebase RTDB)
    try {
        if (isFirebaseReady && window.firebase && window.firebase.database) {
            fbDbRef = window.firebase.database().ref(`rooms/${roomCode}/students`);
            fbDbRef.on('value', (snapshot) => {
                const data = snapshot.val() || {};
                // Gabungkan data online dengan data lokal
                Object.assign(state.onlineStudents, data);
                if (typeof onStudentsUpdate === 'function') {
                    onStudentsUpdate(state.onlineStudents);
                }
            }, (error) => {
                console.warn('[Sync] Firebase RTDB listener error (fallback luring tetap aktif):', error.message);
            });
        }
    } catch (fbErr) {
        console.warn('[Sync] Gagal menghubungkan listener Firebase:', fbErr.message);
    }

    return roomCode;
}

/**
 * Menghentikan sesi hosting fasilitator dan membersihkan penyimpanan serta listener.
 */
export function stopHostRoom() {
    if (fbDbRef) {
        try {
            fbDbRef.off();
        } catch (e) { /* ignore */ }
        fbDbRef = null;
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

    // Hitung akurasi kumulatif
    const totalTrx = user.totalTransactions || 1;
    const totalErr = user.totalErrors || 0;
    const accuracy = Math.max(0, Math.min(100, Math.round(((totalTrx - totalErr) / totalTrx) * 100)));

    const studentId = String(user.id || user.name || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');

    const payload = {
        studentId: studentId,
        name: user.name || 'Siswa',
        kelas: user.kelas || user.class || '-',
        gender: user.gender || 'Laki-laki',
        level: levelIdx || 1,
        maxLevel: Math.max(user.maxLevel || 1, levelIdx || 1),
        laba: user.money !== undefined ? user.money : (user.laba || 0),
        accuracy: accuracy,
        errorCount: Number(errors) || 0,
        quizScore: `${quizCorrect}/${quizTotal}`,
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

    // 3. Kirim via Firebase Realtime Database jika daring
    try {
        initFirebase();
        if (isFirebaseReady && window.firebase && window.firebase.database) {
            const db = window.firebase.database();
            db.ref(`rooms/${roomCode}/students/${studentId}`).set(payload)
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

