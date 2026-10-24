// ==========================================
// ui/victory.js — Layar Kemenangan (Victory Screen)
// Animasi Bintang Bertahap & Tally Counter Skor
// ==========================================

import { playSFX } from '../core/audio.js';

let activeTimeouts = [];
let activeRafIds = [];
let currentVictoryState = null;
let isAnimatingVictory = false;
let lastTickSfxTime = 0;

/**
 * Membatalkan seluruh timer dan requestAnimationFrame aktif pada layar kemenangan
 * untuk mencegah kebocoran memori (memory leak) saat pemain menutup modal lebih awal.
 */
export function clearVictoryTimers() {
    while (activeTimeouts.length > 0) {
        clearTimeout(activeTimeouts.pop());
    }
    while (activeRafIds.length > 0) {
        cancelAnimationFrame(activeRafIds.pop());
    }
    isAnimatingVictory = false;
}

/**
 * Helper penjadwalan timeout yang otomatis tercatat agar mudah dibersihkan.
 * @param {Function} fn
 * @param {number} delayMs
 */
function scheduleVictoryTimeout(fn, delayMs) {
    const id = setTimeout(() => {
        const idx = activeTimeouts.indexOf(id);
        if (idx !== -1) activeTimeouts.splice(idx, 1);
        fn();
    }, delayMs);
    activeTimeouts.push(id);
    return id;
}

/**
 * Format durasi detik ke tampilan ringkas (contoh: "45s" atau "1m 20s").
 * @param {number} sec
 * @returns {string}
 */
export function formatVictoryDuration(sec) {
    const total = Math.max(0, Math.round(Number(sec) || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

/**
 * Menganimasikan kenaikan angka dari nilai awal ke nilai akhir secara mulus (easeOutCubic).
 * @param {HTMLElement|null} element Elemen target
 * @param {number} start Nilai awal
 * @param {number} end Nilai akhir
 * @param {number} duration Durasi animasi dalam ms
 * @param {(val: number) => string} formatter Fungsi pemformat teks
 * @param {boolean} [withTickSound=false] Apakah memutar suara tick selama berhitung
 */
export function animateNumber(element, start, end, duration, formatter, withTickSound = false) {
    if (!element) return () => {};
    const fmt = typeof formatter === 'function' ? formatter : (v) => String(v);

    if (duration <= 0 || start === end) {
        element.textContent = fmt(end);
        return () => {};
    }

    const startTime = performance.now();
    let rafId = null;

    const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(Math.max(elapsed / duration, 0), 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(start + (end - start) * eased);

        element.textContent = fmt(currentVal);

        if (withTickSound && progress < 1) {
            const nowMs = Date.now();
            if (nowMs - lastTickSfxTime >= 95) {
                lastTickSfxTime = nowMs;
                playSFX('tally_tick');
            }
        }

        if (progress < 1) {
            rafId = requestAnimationFrame(step);
            activeRafIds.push(rafId);
        }
    };

    rafId = requestAnimationFrame(step);
    activeRafIds.push(rafId);

    return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
    };
}

/**
 * Langsung menampilkan kondisi akhir seluruh bintang dan angka pada modal kemenangan
 * (dipanggil saat pengguna menekan kartu untuk melewati animasi atau saat reduced-motion aktif).
 */
export function finishVictoryAnimationImmediately() {
    if (!currentVictoryState) return;
    clearVictoryTimers();

    const { stars, accuracy, quizCorrect, quizTotal, duration, profit } = currentVictoryState;

    const starSlots = document.querySelectorAll('#vc-stars-container .victory-star-slot');
    starSlots.forEach((slot) => {
        const starIdx = Number(slot.dataset.star) || 0;
        if (starIdx <= stars) {
            slot.classList.add('earned');
        } else {
            slot.classList.remove('earned');
        }
    });

    const statBoxes = document.querySelectorAll('#vc-stats-grid .victory-stat-box');
    statBoxes.forEach((box) => box.classList.add('stat-visible'));

    const accEl = document.getElementById('vc-accuracy');
    const quizEl = document.getElementById('vc-quiz');
    const timeEl = document.getElementById('vc-time');
    const profitEl = document.getElementById('vc-profit');

    if (accEl) accEl.textContent = `${accuracy}%`;
    if (quizEl) quizEl.textContent = quizTotal > 0 ? `${quizCorrect} / ${quizTotal}` : 'Tanpa Kuis';
    if (timeEl) timeEl.textContent = formatVictoryDuration(duration);
    if (profitEl) profitEl.textContent = `Rp ${profit.toLocaleString('id-ID')}`;

    const btnNext = document.getElementById('btn-vc-next');
    if (btnNext && !btnNext.classList.contains('hidden')) {
        btnNext.classList.add('btn-start-game-glow');
    }
}

/**
 * Menampilkan modal penyelesaian level (Victory Screen) beserta animasi bintang dan tally counter.
 * @param {{
 *   level: number,
 *   stars: 1|2|3,
 *   accuracy: number,
 *   quizCorrect: number,
 *   quizTotal: number,
 *   duration: number,
 *   profit: number,
 *   hasNextLevel: boolean,
 *   unlockedHardJustNow?: boolean
 * }} result
 */
export function showVictoryScreen(result) {
    clearVictoryTimers();
    currentVictoryState = { ...result };

    const modal = document.getElementById('modal-level-complete');
    if (!modal) return;

    const levelPill = document.getElementById('vc-level-pill');
    const titleEl = document.getElementById('vc-title');
    const subtitleEl = document.getElementById('vc-subtitle');
    const accEl = document.getElementById('vc-accuracy');
    const quizEl = document.getElementById('vc-quiz');
    const timeEl = document.getElementById('vc-time');
    const profitEl = document.getElementById('vc-profit');
    const btnNext = document.getElementById('btn-vc-next');

    const { level, stars, accuracy, quizCorrect, quizTotal, duration, profit, hasNextLevel } = result;

    if (levelPill) levelPill.textContent = `LEVEL ${level}`;

    if (titleEl) {
        if (stars === 3) titleEl.textContent = 'Level Selesai Sempurna!';
        else if (stars === 2) titleEl.textContent = 'Level Selesai!';
        else titleEl.textContent = 'Level Tuntas!';
    }

    if (subtitleEl) {
        if (stars === 3) {
            subtitleEl.textContent = 'Luar biasa! Perhitungan aljabar dan kuismu sangat teliti!';
        } else if (stars === 2) {
            subtitleEl.textContent = 'Kerja bagus! Sedikit lagi menuju bintang tiga sempurna!';
        } else {
            subtitleEl.textContent = 'Transaksi selesai! Ayo tingkatkan lagi ketelitian aljabarmu!';
        }
    }

    // Reset tampilan awal slot bintang dan kotak statistik
    const starSlots = document.querySelectorAll('#vc-stars-container .victory-star-slot');
    starSlots.forEach((slot) => slot.classList.remove('earned'));

    const statBoxes = document.querySelectorAll('#vc-stats-grid .victory-stat-box');
    statBoxes.forEach((box) => box.classList.remove('stat-visible'));

    if (accEl) accEl.textContent = '0%';
    if (quizEl) quizEl.textContent = quizTotal > 0 ? `0 / ${quizTotal}` : 'Tanpa Kuis';
    if (timeEl) timeEl.textContent = '0s';
    if (profitEl) profitEl.textContent = 'Rp 0';

    if (btnNext) {
        btnNext.classList.remove('btn-start-game-glow');
        if (hasNextLevel) {
            btnNext.classList.remove('hidden');
            const spanLabel = btnNext.querySelector('span');
            if (spanLabel) spanLabel.textContent = `Lanjut Level ${level + 1}`;
        } else {
            btnNext.classList.add('hidden');
        }
    }

    modal.classList.remove('hidden');

    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        finishVictoryAnimationImmediately();
        playSFX('victory');
        return;
    }

    isAnimatingVictory = true;

    // 1. Munculkan bintang 1..3 secara bertahap dengan efek suara pop
    for (let i = 1; i <= stars; i++) {
        scheduleVictoryTimeout(() => {
            const slot = document.querySelector(`#vc-stars-container .victory-star-slot[data-star="${i}"]`);
            if (slot) slot.classList.add('earned');
            playSFX('star_pop');
        }, 320 + (i - 1) * 340);
    }

    // 2. Munculkan kotak statistik satu per satu + jalankan tally counter angka
    const statStartBase = 520;
    statBoxes.forEach((box, idx) => {
        scheduleVictoryTimeout(() => {
            box.classList.add('stat-visible');
        }, statStartBase + idx * 110);
    });

    scheduleVictoryTimeout(() => {
        animateNumber(accEl, 0, accuracy, 850, (v) => `${v}%`, false);
        if (quizTotal > 0) {
            animateNumber(quizEl, 0, quizCorrect, 650, (v) => `${v} / ${quizTotal}`, false);
        }
        animateNumber(timeEl, 0, duration, 850, (v) => formatVictoryDuration(v), false);
        animateNumber(
            profitEl,
            0,
            profit,
            1050,
            (v) => `Rp ${v.toLocaleString('id-ID')}`,
            true
        );
    }, statStartBase + 120);

    // 3. Fanfar penyelesaian & highlight tombol Lanjut
    const totalAnimTime = Math.max(320 + stars * 340, statStartBase + 1150);
    scheduleVictoryTimeout(() => {
        isAnimatingVictory = false;
        playSFX('victory');
        if (btnNext && !btnNext.classList.contains('hidden')) {
            btnNext.classList.add('btn-start-game-glow');
        }
    }, totalAnimTime);
}

/**
 * Menutup modal layar kemenangan dan membersihkan seluruh timer animasi.
 */
export function closeVictoryScreen() {
    clearVictoryTimers();
    const modal = document.getElementById('modal-level-complete');
    if (modal) modal.classList.add('hidden');
}

/**
 * Mengikat event listener untuk tombol-tombol pada modal kemenangan.
 * @param {{
 *   onRetry?: (level: number) => void,
 *   onMenu?: (stateObj: Object) => void,
 *   onNext?: (nextLevel: number, stateObj: Object) => void
 * }} handlers
 */
export function initVictoryListeners(handlers = {}) {
    const card = document.getElementById('victory-card');
    const btnRetry = document.getElementById('btn-vc-retry');
    const btnMenu = document.getElementById('btn-vc-menu');
    const btnNext = document.getElementById('btn-vc-next');

    // Klik pada kartu saat animasi masih berjalan akan langsung melompat ke hasil akhir
    if (card) {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (isAnimatingVictory) {
                finishVictoryAnimationImmediately();
            }
        });
    }

    if (btnRetry) {
        btnRetry.addEventListener('click', () => {
            playSFX('nav');
            const lvl = currentVictoryState ? currentVictoryState.level : 1;
            closeVictoryScreen();
            if (typeof handlers.onRetry === 'function') {
                handlers.onRetry(lvl);
            }
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            playSFX('nav');
            const snap = currentVictoryState;
            closeVictoryScreen();
            if (typeof handlers.onMenu === 'function') {
                handlers.onMenu(snap);
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            playSFX('calc_checkout');
            const snap = currentVictoryState;
            const nextLvl = snap ? snap.level + 1 : 2;
            closeVictoryScreen();
            if (typeof handlers.onNext === 'function') {
                handlers.onNext(nextLvl, snap);
            }
        });
    }
}

