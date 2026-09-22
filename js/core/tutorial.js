// ==========================================
// core/tutorial.js — Interactive Guided Walkthrough
// ==========================================

import { state } from './state.js';

/**
 * Konfigurasi 10 Langkah Tutorial Interaktif (Level 1 Pelanggan 1)
 * Pesanan: 3 Apel & 2 Beras | Uang: Rp 50.000 | Kembalian: Rp 14.000
 */
export const TUTORIAL_STEPS = [
    {
        step: 1,
        target: '.speech-bubble',
        actionType: 'speech',
        reqCount: 1,
        handPos: 'left',
        title: 'Pesanan Pelanggan',
        text: 'Halo Kasir! Perhatikan baik-baik pesanan pelanggan. Klik balon pesan untuk mulai mencatat pesanan.'
    },
    {
        step: 2,
        target: '.product-item[data-var="a"]',
        actionType: 'addVar',
        expectedValue: 'a',
        reqCount: 3,
        handPos: 'left',
        title: 'Pilih Apel (a)',
        text: 'Pelanggan ingin membeli 3 Apel (a). Klik Apel di rak sebanyak 3 kali!'
    },
    {
        step: 3,
        target: '.product-item[data-var="b"]',
        actionType: 'addVar',
        expectedValue: 'b',
        reqCount: 2,
        handPos: 'left',
        title: 'Pilih Beras (b)',
        text: 'Pelanggan juga membeli 2 Beras (b). Klik Beras di rak sebanyak 2 kali!'
    },
    {
        step: 4,
        target: '.btn-calc',
        actionType: 'calc',
        reqCount: 1,
        handPos: 'left',
        title: 'Kalkulasi Rumus Aljabar',
        text: 'Rumus aljabar pesanan sudah tersusun (3a + 2b). Tekan tombol "=" untuk mengalkulasi harga belanjaan!'
    },
    {
        step: 5,
        target: '.money-5k',
        actionType: 'payMoney',
        expectedValue: 50000,
        reqCount: 1,
        handPos: 'left',
        title: 'Ambil Uang Pelanggan',
        text: 'Pelanggan membayar dengan uang Rp 50.000. Klik uang di dompet pelanggan untuk dimasukkan ke mesin kasir.'
    },
    {
        step: 6,
        target: '#btn-final-checkout',
        actionType: 'checkout',
        reqCount: 1,
        handPos: 'right',
        title: 'Konfirmasi Transaksi',
        text: 'Harga belanja dan nominal bayar sudah sesuai. Tekan tombol "Konfirmasi" untuk mencetak struk transaksi!'
    },
    {
        step: 7,
        target: '#btn-close-modal',
        actionType: 'closeReceipt',
        reqCount: 1,
        handPos: 'left',
        title: 'Periksa Struk Transaksi',
        text: 'Belanja Rp 36.000, dibayar Rp 50.000. Kembalian: Rp 14.000. Klik tombol "Berikan Kembalian" di bawah struk!'
    },
    {
        step: 8,
        target: '.btn-uang[data-nominal="10000"]',
        actionType: 'giveChange',
        expectedValue: 10000,
        reqCount: 1,
        handPos: 'left',
        title: 'Ambil Uang Rp 10.000',
        text: 'Laci kasir terbuka! Siapkan kembalian Rp 14.000. Pertama, ambil 1 lembar Rp 10.000 dari laci kasir.'
    },
    {
        step: 9,
        target: '.btn-uang[data-nominal="2000"]',
        actionType: 'giveChange',
        expectedValue: 2000,
        reqCount: 2,
        handPos: 'left',
        title: 'Ambil Uang Rp 2.000',
        text: 'Sisa kembalian adalah Rp 4.000. Klik uang Rp 2.000 sebanyak 2 kali (2 x Rp 2.000)!'
    },
    {
        step: 10,
        target: '#btn-final-checkout',
        actionType: 'confirmChange',
        reqCount: 1,
        handPos: 'right',
        title: 'Serahkan Kembalian',
        text: 'Uang kembalian sudah tepat Rp 14.000! Tekan tombol "Konfirmasi" untuk menyerahkan ke pelanggan.'
    }
];

let currentStepIndex = 0;
let currentActionCount = 0;
let unlockedParents = [];

/**
 * Memeriksa apakah tutorial sedang berjalan.
 */
export function isTutorialRunning() {
    return state.isTutorialActive;
}

/**
 * Memulai rangkaian tutorial dari langkah pertama.
 */
export function startTutorial() {
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
export function checkTutorialAction(actionType, value = null) {
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
        isTransitioning = false;
        if (state.isTutorialActive) {
            renderStep(currentStepIndex);
        }
    }, 180);
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
    tooltipText.innerHTML = `<strong>${stepObj.title}</strong><br>${stepObj.text}${progressStr}`;
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

    // Pastikan target tampak (misal di dalam laci kasir yang bisa di-scroll)
    if (typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    // Bersihkan target sebelumnya
    clearUnlocked();
    // Buka akses khusus untuk target ini
    unlockElement(targetEl);

    // Hitung koordinat relatif terhadap #app-container (aman 16:9 & fullscreen)
    const appContainer  = document.getElementById('app-container');
    const containerRect = appContainer.getBoundingClientRect();
    const targetRect    = targetEl.getBoundingClientRect();

    const relTop  = targetRect.top - containerRect.top;
    const relLeft = targetRect.left - containerRect.left;
    const width   = targetRect.width;
    const height  = targetRect.height;
    const centerX = relLeft + width / 2;
    const centerY = relTop + height / 2;

    // 1. Posisikan Spotlight Cutout
    highlight.style.top    = `${relTop - 6}px`;
    highlight.style.left   = `${relLeft - 6}px`;
    highlight.style.width  = `${width + 12}px`;
    highlight.style.height = `${height + 12}px`;

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

    // 4. Posisikan Tooltip Pintar
    const tooltipWidth  = tooltip.offsetWidth || 280;
    const tooltipHeight = tooltip.offsetHeight || 100;

    let tipTop;
    if (relTop > 130) {
        tipTop = relTop - tooltipHeight - 16;
    } else {
        tipTop = relTop + height + 20;
    }

    let tipLeft = centerX - tooltipWidth / 2;
    const maxLeft = containerRect.width - tooltipWidth - 15;
    const maxTop  = containerRect.height - tooltipHeight - 15;

    tipLeft = Math.max(15, Math.min(tipLeft, maxLeft));
    tipTop  = Math.max(15, Math.min(tipTop, maxTop));

    tooltip.style.top  = `${tipTop}px`;
    tooltip.style.left = `${tipLeft}px`;

    overlay.classList.remove('hidden');
    tooltip.classList.remove('hidden');
    handContainer.classList.remove('hidden');
}

/**
 * Menembus stacking context CSS agar elemen target berada di atas overlay.
 */
function unlockElement(targetEl) {
    targetEl.classList.add('tutorial-unlocked');

    let parent = targetEl.parentElement;
    while (parent && parent !== document.body && parent.id !== 'app-container') {
        const style = window.getComputedStyle(parent);
        if (style.zIndex !== 'auto' && parseInt(style.zIndex, 10) < 10000) {
            parent.dataset.tutOrigZ = parent.style.zIndex || '';
            parent.style.zIndex = '10004';
            unlockedParents.push(parent);
        }
        parent = parent.parentElement;
    }
}

/**
 * Mengembalikan styling z-index dan menghapus class .tutorial-unlocked.
 */
function clearUnlocked() {
    document.querySelectorAll('.tutorial-unlocked').forEach(el => {
        el.classList.remove('tutorial-unlocked');
    });

    unlockedParents.forEach(p => {
        if (p.dataset.tutOrigZ !== undefined) {
            p.style.zIndex = p.dataset.tutOrigZ;
            delete p.dataset.tutOrigZ;
        } else {
            p.style.zIndex = '';
        }
    });
    unlockedParents = [];
}

/**
 * Memperbarui posisi overlay jika ukuran layar berubah / fullscreen.
 */
export function updateTutorialPosition() {
    if (state.isTutorialActive && TUTORIAL_STEPS[currentStepIndex]) {
        renderStep(currentStepIndex);
    }
}

/**
 * Melewati tutorial secara langsung dan mengembalikan kontrol ke pemain.
 */
export function skipTutorial() {
    endTutorial();
}

/**
 * Mengakhiri tutorial dan menyembunyikan overlay.
 */
export function endTutorial() {
    state.isTutorialActive = false;
    isTransitioning = false;
    currentStepIndex = 0;
    currentActionCount = 0;

    clearUnlocked();

    const overlay       = document.getElementById('tutorial-overlay');
    const tooltip       = document.getElementById('tutorial-tooltip');
    const handContainer = document.getElementById('tutorial-hand-container');

    if (overlay) overlay.classList.add('hidden');
    if (tooltip) tooltip.classList.add('hidden');
    if (handContainer) handContainer.classList.add('hidden');
}

/**
 * Menginisialisasi event tombol lewati tutorial.
 */
export function initTutorialEvents() {
    const skipBtn = document.getElementById('tutorial-btn-skip');
    if (skipBtn) {
        skipBtn.addEventListener('click', skipTutorial);
    }

    window.addEventListener('resize', updateTutorialPosition);
    document.addEventListener('fullscreenchange', updateTutorialPosition);
    document.addEventListener('webkitfullscreenchange', updateTutorialPosition);
    document.addEventListener('mozfullscreenchange', updateTutorialPosition);
    document.addEventListener('MSFullscreenChange', updateTutorialPosition);
}
