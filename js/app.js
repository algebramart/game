// ==========================================
// app.js — Entry Point Utama
// ==========================================

import { state }             from './core/state.js';
import { saveData, requestFullScreen, exitFullScreen } from './core/engine.js';
import { switchScreen, renderUserList, showMsg, closeModal, renderLevels, updateUniversalSettingsContext } from './ui/screens.js';
import { initGameListeners, startLevel, addVariable, tambahUangKembalian, nextQuizQuestion, confirmQuizAnswer } from './ui/cashier.js';
import { openBukuKas, openPrestasi, copyToken, showFasilitatorLogin, checkPIN, openFasilitator, exportCSV, resetAllData, handleCreateHostRoom, handleCopyHostRoomCode, handleDonate, destroyFasilChart, handlePrintDetailedPDF, handlePrintReport, handleCopyWhatsAppReport, forceRefreshFasilData } from './ui/reports.js';
import { joinRoom, leaveRoom, sendStudentProgress } from './core/sync.js';
import { startTutorial, skipTutorial, endTutorial, updateTutorialPosition, initTutorialEvents } from './core/tutorial.js';
import { openLevelZeroModal, closeLevelZeroModal, initLevelZeroEvents } from './ui/levelZero.js';
import {
    initAudio,
    playBGM,
    pauseBGM,
    stopBGM,
    playSFX,
    setBGMVolume,
    setSFXVolume,
    toggleBGMMute,
    toggleSFXMute,
    getBGMVolume,
    getSFXVolume,
    isBgmMutedStatus,
    isSfxMutedStatus
} from './core/audio.js';

// ==========================================
// VIRTUAL DESKTOP AUTO-SCALING (1280x720)
// ==========================================
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

export function getAppScale() {
    const container = document.getElementById('app-container');
    if (container && container.dataset.scale) {
        return parseFloat(container.dataset.scale) || 1;
    }
    return window.__appScale || 1;
}

export function fitScreen() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const winW = Math.max(window.innerWidth, document.documentElement.clientWidth || 0);
    const winH = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
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

    container.style.width = `${virtualWidth}px`;
    container.style.height = `${virtualHeight}px`;
    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
    container.dataset.scale = String(scale);
    container.dataset.virtualWidth = String(virtualWidth);
    container.dataset.virtualHeight = String(virtualHeight);
    window.__appScale = scale;
    window.__virtualWidth = virtualWidth;
    window.__virtualHeight = virtualHeight;

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
    });
}
fitScreen();

let confirmExitReason = 'cashier'; // 'cashier' | 'fullscreen'

// ==========================================
// GATEWAY & AUTH: LOGIN & LOGOUT
// ==========================================

function startFromGateway() {
    requestFullScreen();
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
        switchScreen('screen-lobby');
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
    input.focus();
}

function submitJoinRoom() {
    const input = document.getElementById('input-room-code');
    const status = document.getElementById('join-room-status');
    if (!input || !status) return;

    const result = joinRoom(input.value);
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
                'Kamu harus menyelesaikan seluruh <strong>10 Level Tantangan Mudah (C1-C3)</strong> terlebih dahulu untuk membuka Tantangan Sulit (C4-C6)!'
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
