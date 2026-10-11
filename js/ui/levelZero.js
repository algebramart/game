// ==========================================
// ui/levelZero.js — Modul Materi Pengantar Level 0
// Konsep Aljabar Kasir: Koefisien, Variabel, Konstanta
// & Simulasi Interaktif Pencocokan Nilai (5x = 25.000)
// ==========================================

import { playSFX, speakNarrator, stopNarrator } from '../core/audio.js';

let currentStage = 1;
let cakeSlots = [false, false, false, false, false];
let allocatedCount = 0;
let isInitialized = false;

const NARRATIONS = {
    1: 'Level 0: Pengenalan Konsep Aljabar Kasir. Mari pahami tiga komponen aljabar: Koefisien adalah banyaknya barang yang dibeli pelanggan, Variabel adalah nilai harga satuan barang yang belum diketahui kasir, dan Konstanta adalah biaya tambahan yang nilainya tetap pasti seperti kantong belanja.',
    2: 'Tahap 2: Simulasi Pencocokan Nilai. Pelanggan membeli 5 kotak kue seharga total 25 ribu rupiah. Persamaannya adalah 5x = 25.000. Bagikan pecahan uang 5 ribu rupiah ke setiap kotak kue untuk menemukan harga satuannya!',
    success2: 'Luar biasa! Seluruh 5 kotak kue tepat dipasangkan dengan uang 5 ribu rupiah. Total belanja pas 25 ribu rupiah. Klik Periksa Pembuktian untuk melihat kesimpulan aljabar!',
    3: 'Tahap 3: Pembuktian Matematis. Persamaan 5x = 25.000, kedua ruas dibagi 5 sehingga diperoleh nilai x = 5.000. Variabel x terbukti adalah harga satuan 1 kue yaitu 5 ribu rupiah. Sekarang kamu siap melayani transaksi di Level 1!'
};

/**
 * Membuka modal materi pengantar Level 0.
 */
export function openLevelZeroModal() {
    const modal = document.getElementById('modal-level-zero');
    if (!modal) return;

    modal.classList.remove('hidden');
    goToStage(1);
    playSFX('nav');
}

/**
 * Menutup modal materi pengantar Level 0.
 */
export function closeLevelZeroModal() {
    const modal = document.getElementById('modal-level-zero');
    if (modal) modal.classList.add('hidden');
    stopNarrator();
}

/**
 * Berpindah ke tahap materi tertentu (1, 2, atau 3).
 * @param {number} stageNum
 */
export function goToStage(stageNum) {
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
            hintText.innerHTML = '<span style="color:#059669; font-weight:800;"><i class="fa-solid fa-star"></i> Sempurna! Semua 5 kue tepat teralokasi masing-masing Rp 5.000.</span>';
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
export function initLevelZeroEvents() {
    if (isInitialized) return;
    isInitialized = true;

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

