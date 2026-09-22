// ==========================================
// core/engine.js — Logika Murni (tanpa DOM)
// ==========================================
import { state } from './state.js';
import { ITEM_DB, BADGES_DB } from '../data/items.js';

/**
 * Menyimpan data users ke localStorage.
 */
export function saveData() {
    localStorage.setItem('algebraMart_users', JSON.stringify(state.users));
}

/**
 * Mendapatkan gelar pemain berdasarkan laba dan sumbangan sosial.
 * @param {number} laba
 * @param {number} sumbangan
 * @returns {string}
 */
export function getTitle(laba, sumbangan = 0) {
    if (sumbangan >= 20000) return "Pedagang Dermawan";
    if (laba > 300000)      return "Sultan Aljabar";
    if (laba > 150000)      return "Juragan Pasar";
    if (laba > 50000)       return "Pedagang Ahli";
    if (laba > 15000)       return "Kasir Junior";
    return "Kasir Magang";
}

/**
 * Memicu notifikasi UI pop-up saat lencana baru terbuka.
 * @param {Object} badge
 */
export function triggerBadgeNotification(badge) {
    if (typeof window !== 'undefined' && typeof window._showBadgeNotification === 'function') {
        window._showBadgeNotification(badge);
    }
}

/**
 * Mengevaluasi pembukaan 20 lencana prestasi secara otomatis berdasarkan kriteria.
 * @param {Object} context Konteks peristiwa (transaksi, kembalian, kuis, level_complete, donasi)
 * @returns {Array} Daftar lencana yang baru saja terbuka
 */
export function checkBadgeUnlocks(context = {}) {
    if (!state.currentUser) return [];

    const user = state.currentUser;
    if (!Array.isArray(user.badges)) {
        user.badges = [];
    }

    // Kompatibilitas id lama
    if (user.badges.includes('saudagar') && !user.badges.includes('saudagar_cilik')) {
        user.badges.push('saudagar_cilik');
    }

    const money = Number(user.money) || 0;
    const sumbangan = Number(user.sumbangan || user.donasi) || 0;
    const history = Array.isArray(user.history) ? user.history : [];
    const unlockedNow = [];

    const award = (badgeId) => {
        if (!user.badges.includes(badgeId)) {
            user.badges.push(badgeId);
            const badgeObj = BADGES_DB.find(b => b.id === badgeId);
            if (badgeObj) {
                unlockedNow.push(badgeObj);
            }
        }
    };

    // --- Kategori 1: Akurasi & Matematika ---
    // 1. 'si_teliti': Menyelesaikan satu level tanpa pernah salah rumus
    if ((context.type === 'level_complete' && context.errors === 0) || history.some(h => (h.errors || 0) === 0)) {
        award('si_teliti');
    }

    // 2. 'master_variabel': Berhasil menuntaskan level yang memuat 3 variabel berbeda
    const is3Vars = (context.distinctVariables && context.distinctVariables >= 3) ||
                    (context.level === 4 || context.level === 7 || context.level === 10) ||
                    history.some(h => h.level === 4 || h.level === 7 || h.level === 10);
    if (is3Vars && (context.type === 'level_complete' || history.length > 0)) {
        award('master_variabel');
    }

    // 3. 'ahli_komutatif': Membuktikan sifat komutatif pesanan tanpa kesalahan pada Level 2 atau Level 8
    const komutatifSuccess = (context.type === 'level_complete' && (context.level === 2 || context.level === 8) && context.errors === 0) ||
                             history.some(h => (h.level === 2 || h.level === 8) && (h.errors || 0) === 0);
    if (komutatifSuccess) {
        award('ahli_komutatif');
    }

    // 4. 'pembedah_suku': Berhasil menyederhanakan ekspresi gabungan suku sejenis pada Level 3/6
    const sukuSuccess = (context.type === 'level_complete' && (context.level === 3 || context.level === 6)) ||
                        history.some(h => h.level === 3 || h.level === 6);
    if (sukuSuccess) {
        award('pembedah_suku');
    }

    // 5. 'penakluk_nol': Memahami makna koefisien nol dan melewati pesanan kosong pada Level 9
    const nolSuccess = (context.type === 'level_complete' && context.level === 9) ||
                       history.some(h => h.level === 9);
    if (nolSuccess) {
        award('penakluk_nol');
    }

    // 6. 'jenius_aljabar': Meraih akurasi rata-rata rumus aljabar 100% minimal setelah 5 level
    if (history.length >= 5 && history.every(h => (h.errors || 0) === 0)) {
        award('jenius_aljabar');
    }

    // 7. 'bintang_tiga': Mengumpulkan bintang 3 sempurna pada 5 level berbeda
    const star3Count = history.filter(h => (h.errors || 0) === 0).length;
    if (star3Count >= 5) {
        award('bintang_tiga');
    }

    // 8. 'kolektor_sempurna': Menyelesaikan Level 10 dengan 0 kesalahan
    const lvl10Perfect = (context.type === 'level_complete' && context.level === 10 && context.errors === 0) ||
                         history.some(h => h.level === 10 && (h.errors || 0) === 0);
    if (lvl10Perfect) {
        award('kolektor_sempurna');
    }

    // --- Kategori 2: Finansial & Kasir ---
    // 9. 'si_jujur': Memberikan kembalian uang fisik dari laci kasir dengan tepat tanpa salah ambil
    if (context.type === 'kembalian_success' && context.kembalianAccurate !== false) {
        award('si_jujur');
    }

    // 10. 'saudagar_cilik': Mengumpulkan total laba bersih di atas Rp 50.000
    if (money > 50000) {
        award('saudagar_cilik');
    }

    // 11. 'juragan_pasar': Mengumpulkan total laba bersih di atas Rp 150.000
    if (money > 150000) {
        award('juragan_pasar');
    }

    // 12. 'sultan_aljabar': Mengumpulkan total laba bersih di atas Rp 300.000
    if (money > 300000) {
        award('sultan_aljabar');
    }

    // 13. 'uang_pas': Berhasil melayani transaksi pesanan uang pas (tanpa kembalian)
    if (context.type === 'exact_money' || (context.type === 'transaction_receipt' && context.kembalian === 0)) {
        award('uang_pas');
    }

    // 14. 'laci_kilat': Menyiapkan uang kembalian pecahan dalam waktu kurang dari 15 detik
    if (context.type === 'kembalian_success' && typeof context.duration === 'number' && context.duration < 15) {
        award('laci_kilat');
    }

    // --- Kategori 3: Karakter & Dimensi Hati ---
    // 15. 'dermawan_muda': Menyisihkan laba toko untuk total sumbangan sosial minimal Rp 5.000
    if (sumbangan >= 5000) {
        award('dermawan_muda');
    }

    // 16. 'pahlawan_desa': Akumulasi sumbangan sosial mencapai lebih dari Rp 20.000
    if (sumbangan > 20000) {
        award('pahlawan_desa');
    }

    // 17. 'reputasi_emas': Meraih status reputasi toko "Pedagang Dermawan"
    if (sumbangan >= 20000 || getTitle(money, sumbangan) === "Pedagang Dermawan") {
        award('reputasi_emas');
    }

    // --- Kategori 4: Evaluasi & Persistensi ---
    // 18. 'skor_kuis_sempurna': Menjawab seluruh soal kuis evaluasi level dengan benar (100%)
    if ((context.type === 'quiz_complete' && context.quizCorrect > 0 && context.quizCorrect === context.quizTotal) ||
        history.some(h => (h.quizTotal || 0) > 0 && h.quizCorrect === h.quizTotal)) {
        award('skor_kuis_sempurna');
    }

    // 19. 'pantang_menyerah': Berhasil menyelesaikan level meski sempat melakukan kesalahan input >= 3 kali
    if ((context.type === 'level_complete' && (context.errors || 0) >= 3) ||
        history.some(h => (h.errors || 0) >= 3)) {
        award('pantang_menyerah');
    }

    // 20. 'penakluk_tantangan': Membuka dan menyelesaikan level pada mode Tantangan Sulit
    if ((context.type === 'level_complete' && context.level === 10) ||
        history.some(h => h.level === 10)) {
        award('penakluk_tantangan');
    }

    if (unlockedNow.length > 0) {
        saveData();
        unlockedNow.forEach(b => triggerBadgeNotification(b));
    }

    return unlockedNow;
}

/**
 * Merender ekspresi matematika formal dengan KaTeX jika tersedia, atau fallback HTML.
 * Menjamin variabel aljabar (a sampai q) otomatis dirender miring (italic math-serif),
 * sedangkan angka, simbol operasi (+, -, =, ×), dan 'Rp' tetap tegak (roman).
 * @param {string} expr
 * @returns {string}
 */
export function renderMathExpression(expr) {
    if (!expr) return "";

    if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
        try {
            let tex = expr;

            // 1. Tangani pangkat ([a-zA-Z0-9()]+)^(\d+) -> $1^{$2}
            tex = tex.replace(/([a-zA-Z0-9()]+)\^(\d+)/g, '$1^{$2}');

            // 2. Ganti simbol perkalian unicode '×' atau '*' menjadi \times
            tex = tex.replace(/\s*[×*]\s*/g, ' \\times ');

            // 3. Ganti operator kali huruf 'x' yang berdiri sendiri (misal "3 x 2") menjadi \times
            // Gunakan lookbehind dan lookahead agar tidak merusak perintah TeX seperti \text atau \times
            tex = tex.replace(/(?<=\d|\))\s*x\s*(?=\d|\()/gi, ' \\times ');

            // 4. Pastikan format mata uang Rp dibungkus \text{Rp } secara aman tanpa duplikasi
            tex = tex.replace(/(\\text\{)?Rp\s*([\d\.]+)(\})?/g, (match, openTag, amount, closeTag) => {
                return `\\text{Rp }${amount}`;
            });

            return window.katex.renderToString(tex, {
                throwOnError: false,
                displayMode: false
            });
        } catch (e) {
            console.warn("KaTeX render error:", e);
        }
    }

    // Fallback jika KaTeX offline/belum dimuat
    return formatMathText(expr);
}

/**
 * Memformat teks campuran (seperti balon pesan atau kuis) agar variabel aljabar (a sampai q)
 * dirender miring (italic math-serif) menggunakan font matematika,
 * serta notasi pangkat (^ eksponen) diformat dengan elegan.
 * @param {string} text
 * @returns {string}
 */
export function formatMathText(text) {
    if (!text) return "";

    // Bersihkan tag \text{...} jika ada sisa perintah TeX yang masuk ke fallback teks
    let formatted = text.replace(/\\text\{([^}]+)\}/g, '$1');

    const hasKaTeX = typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function';

    // Helper: proses penggantian teks matematika hanya pada bagian yang bukan tag HTML
    const processNonHtmlParts = (str, fn) => {
        const parts = str.split(/(<[^>]+>)/g);
        for (let i = 0; i < parts.length; i += 2) {
            parts[i] = fn(parts[i]);
        }
        return parts.join('');
    };

    // 1. Format notasi eksponen / pangkat aljabar: misal c^5 atau 5a^2
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s+=\-(>,])(\d*)([a-q])\^(\d+)(?=[\s+=\-)<,]|$)/gi, (match, prefix, num, v, p) => {
            if (hasKaTeX) {
                try {
                    let texTerm = `${num || ''}${v}^{${p}}`;
                    return prefix + window.katex.renderToString(texTerm, { throwOnError: false, displayMode: false });
                } catch (e) {}
            }
            let numHtml = num ? `<span class="math-num">${num}</span>` : "";
            return `${prefix}${numHtml}${v}<sup>${p}</sup>`;
        });
    });

    // Format eksponen angka murni jika ada (misal 2^3)
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s+=\-(>,])(\d+)\^(\d+)(?=[\s+=\-)<,]|$)/g, (match, prefix, base, exp) => {
            if (hasKaTeX) {
                try {
                    return prefix + window.katex.renderToString(`${base}^{${exp}}`, { throwOnError: false, displayMode: false });
                } catch (e) {}
            }
            return `${prefix}<span class="math-num">${base}</span><sup>${exp}</sup>`;
        });
    });

    // 2. Ganti huruf variabel aljabar tunggal dalam kurung, misal (a) -> (<span class="math-var">a</span>)
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/\(([a-q])\)/gi, '(<span class="math-var">$1</span>)');
    });

    // 3. Ganti suku aljabar dengan koefisien atau ekspresi, misal 3a -> 3<span class="math-var">a</span>
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s+=\-(])(\d*)([a-q])(?=[\s+=\-)<,]|$)/gi, (match, prefix, num, v) => {
            let numHtml = num ? `<span class="math-num">${num}</span>` : "";
            return `${prefix}${numHtml}<span class="math-var">${v}</span>`;
        });
    });

    // 4. Ganti simbol perkalian unicode '×' agar terbungkus span rapi jika bukan di dalam tag HTML
    formatted = processNonHtmlParts(formatted, (s) => {
        return s.replace(/(^|[\s\d\)])×([\s\d\(]|$)/g, '$1<span class="math-op">×</span>$2');
    });

    return formatted;
}

/**
 * Menghitung dan memvalidasi rumus aljabar dari input pemain.
 * @returns {{ isBenar: boolean, tagihan: number, cost: number }}
 */
export function calculateFormula() {
    const formulaInput = document.getElementById("formula-box");
    if (state.activeInput !== formulaInput) return { isBenar: false, tagihan: 0, cost: 0 };

    let rumusBersih  = formulaInput.value.replace(/\s+/g, '').toLowerCase();
    let userTerms    = rumusBersih.split('+');

    let isRumusBenar      = true;
    let expectedTermCount = 0;
    let calculatedTagihan = 0;
    let calculatedCost    = 0;

    for (let key in ITEM_DB) {
        let qty = state.currentLevelParams.order[key] || 0;
        if (qty > 0) {
            expectedTermCount++;
            let term1 = `${qty}${key}`;
            let term2 = (qty === 1) ? `${key}` : term1;

            if (!userTerms.includes(term1) && !userTerms.includes(term2)) {
                isRumusBenar = false;
            } else {
                calculatedTagihan += qty * ITEM_DB[key].price;
                calculatedCost    += qty * ITEM_DB[key].cost;
            }
        }
    }

    let strictUserTerms = userTerms.filter(t => !t.startsWith('0'));

    if (isRumusBenar && strictUserTerms.length === expectedTermCount) {
        return { isBenar: true, tagihan: calculatedTagihan, cost: calculatedCost };
    }
    return { isBenar: false, tagihan: 0, cost: 0 };
}

/**
 * Menghasilkan teks rincian pecahan uang yang dibayarkan pelanggan.
 * @param {Object} [uangDetail]
 * @returns {string}
 */
export function tentukanPecahanUang(uangDetail = state.uangDibayarDetail) {
    let hasilTeks = [];
    if (!uangDetail) return "(Tidak ada rincian)";
    const daftarPecahan = Object.keys(uangDetail).map(Number).sort((a, b) => b - a);
    for (let pecahan of daftarPecahan) {
        let jumlahLembar = uangDetail[pecahan];
        if (jumlahLembar > 0) hasilTeks.push(`${jumlahLembar} Lbr Rp${pecahan.toLocaleString('id-ID')}`);
    }
    if (hasilTeks.length === 0) return "(Tidak ada rincian)";
    return "(" + hasilTeks.join(" + ") + ")";
}

/**
 * Meminta browser masuk ke mode fullscreen.
 */
export function requestFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn("Fullscreen diblokir: ", err));
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

/**
 * Keluar dari mode fullscreen.
 */
export function exitFullScreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen)            document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen)     document.msExitFullscreen();
    }
}

