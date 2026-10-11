// ==========================================
// core/sync.js — Sinkronisasi Hybrid (Lokal Node.js + BroadcastChannel)
// ==========================================
import { state } from './state.js';

let syncChannel = null;
let pollingInterval = null;
let storageEventHandler = null;

// Penentuan URL API Server secara dinamis (mendukung cross-device via IP lokal maupun localhost)
export const API_URL = (() => {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        const host = window.location.hostname;
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//${host}:3000`;
    }
    return 'http://localhost:3000';
})();

// Inisialisasi BroadcastChannel untuk komunikasi antar-tab/perangkat luring instan
try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        syncChannel = new BroadcastChannel('algebra_mart_room_sync');
    }
} catch (e) {
    console.warn('[Sync] BroadcastChannel tidak tersedia:', e);
}

/**
 * Menghasilkan Kode Ruang acak lokal (Fallback jika server mati)
 * @returns {string}
 */
export function generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ALJ-${randomPart}`;
}

/**
 * Memulai sesi hosting oleh Fasilitator/Guru.
 */
export async function startHostRoom(onStudentsUpdate, forceNew = false) {
    // Bersihkan interval sebelumnya
    if (pollingInterval) clearInterval(pollingInterval);

    let roomCode = state.hostedRoomCode;
    
    // Minta kode ruang dari server jika perlu
    if (forceNew || !roomCode) {
        try {
            const res = await fetch(`${API_URL}/api/room`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                roomCode = data.roomCode;
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            console.warn('[Sync] Gagal mendapat kode ruang dari server, menggunakan fallback lokal.');
            roomCode = generateRoomCode();
        }
        state.hostedRoomCode = roomCode;
    }
    
    try {
        localStorage.setItem('algebraMart_hostedRoom', roomCode);
    } catch (e) { /* ignore */ }

    state.onlineStudents = {};
    console.log(`[Sync] Fasilitator membuka sesi kelas: ${roomCode}`);

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

    // 2. Kanal Server Lokal (Polling Node.js API setiap 3 detik)
    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/api/students/${roomCode}`);
            if (res.ok) {
                const data = await res.json();
                if (data.students && data.students.length > 0) {
                    data.students.forEach(s => {
                        const studentId = s.id;
                        if (!state.onlineStudents[studentId]) {
                            state.onlineStudents[studentId] = {};
                        }
                        const st = state.onlineStudents[studentId];
                        st.studentId = s.id;
                        st.name = s.name;
                        st.kelas = s.kelas;
                        st.gender = s.gender;
                        st.level = s.level;
                        st.laba = s.money;
                        st.errorCount = s.error_count;
                        st.quizCorrect = s.quiz_correct;
                        st.quizTotal = s.quiz_total;
                        st.quizScore = `${s.quiz_correct}/${s.quiz_total}`; 
                    });
                    if (typeof onStudentsUpdate === 'function') {
                        onStudentsUpdate(state.onlineStudents);
                    }
                }
            }
        } catch (err) {
            // Server error / offline, abaikan diam-diam krn fallback lokal aktif
        }
    }, 3000);

    return roomCode;
}

export function stopHostRoom() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
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

export function joinRoom(code) {
    if (!code) {
        return { success: false, message: 'Kode ruang tidak boleh kosong.' };
    }
    const cleanedCode = code.trim().toUpperCase();
    // Mendukung kode 4 karakter (Node Server) atau 6 karakter (Fallback lama)
    if (cleanedCode.length < 4 || cleanedCode.length > 6) {
        return { success: false, message: 'Kode ruang tidak valid (harus 4-6 karakter).' };
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

    // 2. Kirim via localStorage event
    try {
        localStorage.setItem('algebramart_sync_msg', JSON.stringify({
            roomCode: roomCode,
            data: payload,
            t: Date.now()
        }));
    } catch (e) { /* ignore */ }

    // 3. Kirim via Node.js Server Lokal API
    try {
        await fetch(`${API_URL}/api/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        console.log('[Sync] Progres murid tersinkron ke Server Lokal.');
    } catch (err) {
        console.warn('[Sync] Gagal sinkronisasi ke Server Lokal (tetap tersimpan luring/broadcast):', err.message);
    }

    return true;
}

