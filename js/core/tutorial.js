// ==========================================
// core/tutorial.js — Interactive Guided Walkthrough
// ==========================================

import { state } from './state.js';
import { speakNarrator, stopNarrator } from './audio.js';
import { formatMathText } from './engine.js';

/**
 * Konfigurasi 9 Langkah Tutorial Interaktif (Level 1 Pelanggan 1)
 * Pesanan: 4 Kue Padamaran (4j) | Uang: Rp 20.000 | Kembalian: Rp 12.000
 */
export const TUTORIAL_STEPS = [
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

    // Pastikan target tampak (misal di dalam laci kasir atau struk yang bisa di-scroll)
    if (typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    // Sembunyikan sementara tooltip & tangan selama jeda transisi
    tooltip.classList.add('hidden');
    handContainer.classList.add('hidden');

    // Berikan jeda waktu (250ms) sebelum menghitung getBoundingClientRect() dan meletakkan tooltip
    // karena modal (seperti struk transaksi) atau kontainer scroll memerlukan waktu untuk menyelesaikan animasi/transisi
    renderStepTimeoutId = setTimeout(() => {
        renderStepTimeoutId = null;
        if (!state.isTutorialActive || currentStepIndex !== index) return;
        isTransitioning = false;

        // Pastikan kembali posisi scroll sudah stabil setelah layout settle
        if (typeof targetEl.scrollIntoView === 'function') {
            targetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }

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
 * Membuka akses interaksi untuk elemen target.
 */
function unlockElement(targetEl) {
    targetEl.classList.add('tutorial-unlocked');
    targetEl.style.setProperty('pointer-events', 'auto', 'important');
}

/**
 * Mengembalikan styling z-index dan menghapus class .tutorial-unlocked.
 */
function clearUnlocked() {
    document.querySelectorAll('.tutorial-unlocked').forEach(el => {
        el.classList.remove('tutorial-unlocked');
        el.style.removeProperty('position');
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
export function updateTutorialPosition() {
    if (state.isTutorialActive && TUTORIAL_STEPS[currentStepIndex]) {
        renderStep(currentStepIndex);
    }
}

/**
 * Melewati tutorial secara langsung dan mengembalikan kontrol ke pemain (hanya fallback internal).
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
export function initTutorialEvents() {
    window.addEventListener('resize', updateTutorialPosition);
    document.addEventListener('fullscreenchange', updateTutorialPosition);
    document.addEventListener('webkitfullscreenchange', updateTutorialPosition);
    document.addEventListener('mozfullscreenchange', updateTutorialPosition);
    document.addEventListener('MSFullscreenChange', updateTutorialPosition);
}
