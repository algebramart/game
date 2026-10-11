// ==========================================
// core/sync.js — Sinkronisasi Hybrid (Firebase Realtime Database + BroadcastChannel)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, off } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { state } from './state.js';

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };

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
export function generateRoomCode() {
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
 * @returns {string} roomCode Kode ruang yang aktif
 */
export function startHostRoom(onStudentsUpdate, forceNew = false) {
    let roomCode = state.hostedRoomCode;
    if (forceNew || !roomCode) {
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
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data && typeof data === 'object') {
                        Object.values(data).forEach(s => {
                            if (!s || !s.studentId) return;
                            const studentId = s.studentId;
                            if (!state.onlineStudents[studentId]) {
                                state.onlineStudents[studentId] = {};
                            }
                            const st = state.onlineStudents[studentId];
                            st.studentId = s.studentId;
                            st.name = s.name;
                            st.kelas = s.kelas;
                            st.gender = s.gender;
                            st.level = s.level;
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
                        if (typeof onStudentsUpdate === 'function') {
                            onStudentsUpdate(state.onlineStudents);
                        }
                    }
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
export function stopHostRoom() {
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
export async function refreshHostStudents() {
    if (!state.hostedRoomCode) return;
    try {
        const snapshot = await get(ref(db, 'rooms/' + state.hostedRoomCode + '/students'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                Object.values(data).forEach(s => {
                    if (!s || !s.studentId) return;
                    const studentId = s.studentId;
                    if (!state.onlineStudents[studentId]) {
                        state.onlineStudents[studentId] = {};
                    }
                    const st = state.onlineStudents[studentId];
                    st.studentId = s.studentId;
                    st.name = s.name;
                    st.kelas = s.kelas;
                    st.gender = s.gender;
                    st.level = s.level;
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
 * Bergabung ke sesi kelas oleh Murid.
 * Memvalidasi apakah kode ruang aktif/ada di Firebase sebelum bergabung.
 * @param {string} code
 * @returns {Promise<{success: boolean, message: string, code?: string}>}
 */
export async function joinRoom(code) {
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

export function leaveRoom() {
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
export async function sendStudentProgress(user, levelIdx, errors = 0, quizCorrect = 0, quizTotal = 0) {
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
