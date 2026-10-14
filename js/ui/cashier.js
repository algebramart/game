// ==========================================
// ui/cashier.js — Mesin Kasir & Gameplay
// ==========================================
import { state } from '../core/state.js';
import { ITEM_DB } from '../data/items.js';
import { LEVEL_DATA, LEVEL_OBJECTIVES } from '../data/levels.js';
import { QUIZ_DB } from '../data/quiz.js';
import { calculateFormula, tentukanPecahanUang, saveData, renderMathExpression, formatMathText, checkBadgeUnlocks } from '../core/engine.js';
import { switchScreen, showMsg } from './screens.js';
import { checkTutorialAction, startTutorial, endTutorial } from '../core/tutorial.js';
import { sendStudentProgress } from '../core/sync.js';
import { playSFX } from '../core/audio.js';

// ==========================================
// FOKUS INPUT
// ==========================================

export function setFocus(inputElement) {
    if (!inputElement) return;
    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    state.activeInput  = inputElement;
    if (formulaInput) formulaInput.classList.remove("input-active");
    if (paidInput)    paidInput.classList.remove("input-active");
    inputElement.classList.add("input-active");
}

// ==========================================
// LOAD PELANGGAN
// ==========================================

export function loadCustomer() {
    const customer = state.levelCustomers[state.currentCustomerIdx];
    state.currentLevelParams.order      = customer.order || {};
    state.currentLevelParams.errorCount = 0;
    state.uangDibayarDetail             = customer.uangDibayarDetail;
    state.selectedProducts              = [];

    const speechBubble = document.querySelector('.speech-bubble');
    if (speechBubble) speechBubble.innerHTML = formatMathText(customer.text);

    const npcImage = document.querySelector('.npc-image');
    if (npcImage && customer.image) npcImage.src = customer.image;

    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    const hargaDisplay = document.getElementById("harga-display");
    const trayItems    = document.getElementById("tray-items");

    if (formulaInput) {
        formulaInput.value = "";
        formulaInput.classList.remove("input-error");
    }
    if (paidInput)    paidInput.value    = "";
    if (hargaDisplay) { hargaDisplay.textContent = ""; hargaDisplay.style.color = "#a5d6a7"; }
    if (trayItems)    trayItems.innerHTML = "";
    renderProdukDiNampan();

    updateVariableHelperSubtext();

    const walletContainer = document.getElementById("wallet-container-dynamic");
    if (walletContainer) {
        walletContainer.innerHTML = "";
        const daftarPecahan = Object.keys(state.uangDibayarDetail).map(Number).sort((a, b) => b - a);

        daftarPecahan.forEach(pecahan => {
            let jumlahLembar = state.uangDibayarDetail[pecahan];
            for (let i = 0; i < jumlahLembar; i++) {
                let imgSrc      = `assets/rupiah/rp${pecahan}.png`;
                let fallbackImg = `https://placehold.co/200x60/c8e6c9/2e7d32?text=Rp+${pecahan.toLocaleString('id-ID')}`;
                let randomRotate = (Math.random() * 6 - 3).toFixed(1);
                const div = document.createElement('div');
                div.className = "img-placeholder money-5k";
                div.style.cssText = `transform: rotate(${randomRotate}deg); margin-bottom: -45px; background: transparent; border: none; cursor: pointer; transition: opacity 0.2s;`;
                div.innerHTML = `<img src="${imgSrc}" class="money" onerror="this.src='${fallbackImg}'" alt="Uang Rp${pecahan}">`;
                div.addEventListener('click', () => tambahUangPelanggan(pecahan, div));
                walletContainer.appendChild(div);
            }
        });

        state.kembalianModeActive = false;
        document.getElementById("numpad-container").classList.remove("hidden");
        document.getElementById("laci-kasir").classList.add("hidden");
        document.querySelector(".tray-title-label").innerText = "Pesanan";

        state.tagihanTervalidasi  = 0;
        state.targetKembalian     = 0;
        state.arrayUangKembalian  = [];
        state.selectedProducts    = [];
        renderProdukDiNampan();

        if (formulaInput) setFocus(formulaInput);
    }
}

// ==========================================
// START LEVEL
// ==========================================

export function startLevel(lvl) {
    if (!LEVEL_DATA[lvl]) return showMsg("Level Terkunci", "Level sedang dikembangkan.");

    state.currentLevelIdx      = lvl;
    state.activePlayingLevel   = lvl;
    try {
        sendStudentProgress(state.currentUser, lvl, 0, 0, 0);
    } catch (err) { console.warn(err); }

    state.levelCustomers       = LEVEL_DATA[lvl];
    state.currentCustomerIdx   = 0;
    state.currentQuizCorrect   = 0;
    state.levelAccumulation    = { revenue: 0, cost: 0, profit: 0, errors: 0 };
    state.currentLevelParams.startTime = Date.now();

    loadCustomer();
    switchScreen('screen-game');

    const misiLevel = LEVEL_OBJECTIVES[lvl];
    showMsg(`🚩 Tujuan Level ${lvl}`,
        `<strong style="color: #92400e; font-size: 1.15rem; display: block; margin-bottom: 0.6rem;">${misiLevel}</strong>Selesaikan pesanan pelanggan dengan teliti!`,
        () => {
            if (lvl === 1 && state.currentCustomerIdx === 0) {
                setTimeout(() => startTutorial(), 350);
            }
        }
    );
}

// ==========================================
// SUB-TEKS BANTUAN VARIABEL HARGA SATUAN
// ==========================================

export function updateVariableHelperSubtext(highlightVar = null) {
    const helper = document.getElementById("variable-helper-subtext");
    if (!helper) return;

    if (highlightVar && ITEM_DB[highlightVar]) {
        const itemName = ITEM_DB[highlightVar].name.toLowerCase();
        helper.innerHTML = `(<span class="math-var">${highlightVar}</span> = harga satuan <b class="item-name-bold">${itemName}</b>)`;
        return;
    }

    const order = state.currentLevelParams?.order || {};
    const varsInOrder = Object.keys(order).filter(v => order[v] > 0);
    if (varsInOrder.length > 0) {
        const textParts = varsInOrder.map(v => `<span class="math-var">${v}</span> = harga satuan <b class="item-name-bold">${(ITEM_DB[v]?.name || '').toLowerCase()}</b>`);
        helper.innerHTML = `(${textParts.join(', ')})`;
    } else {
        helper.innerHTML = "";
    }
}

// ==========================================
// FORMULA & NAMPAN PRODUK INTERAKTIF
// ==========================================

/**
 * Menyusun ekspresi aljabar dari daftar produk yang dipilih di nampan.
 * Mengelompokkan suku sejenis berdasarkan urutan kemunculan pertama.
 * Misalnya: ['a', 'a', 'b'] -> "2a + b"
 * @returns {string}
 */
export function generateFormulaFromSelectedProducts() {
    if (!state.selectedProducts || state.selectedProducts.length === 0) return "";

    const counts = {};
    const order = [];
    for (const v of state.selectedProducts) {
        if (!counts[v]) {
            counts[v] = 0;
            order.push(v);
        }
        counts[v]++;
    }

    const terms = order.map(v => {
        const count = counts[v];
        return count === 1 ? v : `${count}${v}`;
    });

    return terms.join(" + ");
}

/**
 * Menghapus satu produk dari nampan dan memperbarui rumus di kasir.
 * @param {number} index
 */
export function hapusProdukDariNampan(index) {
    if (state.isTutorialActive) return;
    if (state.kembalianModeActive) return;

    playSFX('clear_back');
    state.selectedProducts.splice(index, 1);
    renderProdukDiNampan();

    const formulaInput = document.getElementById("formula-box");
    const hargaDisplay = document.getElementById("harga-display");

    const newFormula = generateFormulaFromSelectedProducts();
    if (formulaInput) {
        formulaInput.value = newFormula;
        formulaInput.classList.remove("input-error");
        formulaInput.style.color = "#1a1a1a";
    }

    // Reset status validasi harga dan display jika barang diubah/dihapus
    state.tagihanTervalidasi = 0;
    if (hargaDisplay) {
        hargaDisplay.textContent = "";
        hargaDisplay.style.color = "#a5d6a7";
    }

    if (state.selectedProducts.length > 0) {
        const lastVar = state.selectedProducts[state.selectedProducts.length - 1];
        updateVariableHelperSubtext(lastVar);
    } else {
        updateVariableHelperSubtext();
    }
}

/**
 * Merender daftar produk yang ada di nampan (#tray-items).
 * Setiap produk dapat diklik langsung untuk membatalkan/menghapus 1 barang dari nampan.
 */
export function renderProdukDiNampan() {
    if (state.kembalianModeActive) return;

    const tray = document.getElementById("tray-items");
    if (!tray) return;

    tray.innerHTML = "";
    tray.style.flexDirection = "row";
    tray.style.flexWrap      = "wrap";
    tray.style.alignItems    = "flex-end";
    tray.style.paddingTop    = "14px";

    if (!Array.isArray(state.selectedProducts) || state.selectedProducts.length === 0) return;

    state.selectedProducts.forEach((key, index) => {
        const itemInfo = ITEM_DB[key] || { name: key, img: `assets/products/${key}.png` };
        const div = document.createElement('div');
        div.className = "tray-product tray-product-interactive";
        div.title = `Klik untuk membatalkan ${itemInfo.name}`;
        div.innerHTML = `
            <span class="tray-label">Rp ${key},-</span>
            <img src="${itemInfo.img}" class="tray-img" alt="${itemInfo.name}">
        `;
        div.addEventListener('click', () => {
            hapusProdukDariNampan(index);
        });
        tray.appendChild(div);
    });
}

// ==========================================
// KLIK BARANG DI RAK
// ==========================================

export function addVariable(varName) {
    if (state.isTutorialActive) {
        const allowed = checkTutorialAction('addVar', varName);
        if (!allowed) return;
    }

    playSFX('product');

    const formulaInput = document.getElementById("formula-box");
    if (!formulaInput) return;

    // Auto-Routing: Kursor dan activeInput otomatis diarahkan ke #formula-box
    setFocus(formulaInput);
    formulaInput.classList.remove("input-error");

    // Jika tagihan sudah tervalidasi sebelumnya lalu pemain mengklik barang baru,
    // batalkan status validasi lama agar rumus baru dapat dihitung ulang
    if (state.tagihanTervalidasi > 0) {
        state.tagihanTervalidasi = 0;
        const hargaDisplay = document.getElementById("harga-display");
        if (hargaDisplay) { hargaDisplay.textContent = ""; hargaDisplay.style.color = "#a5d6a7"; }
    }

    if (!Array.isArray(state.selectedProducts)) {
        state.selectedProducts = [];
    }
    state.selectedProducts.push(varName);
    renderProdukDiNampan();

    formulaInput.value = generateFormulaFromSelectedProducts();
    formulaInput.style.color = "#1a1a1a";

    // Tampilkan sub-teks bantuan variabel harga satuan
    updateVariableHelperSubtext(varName);
}

// ==========================================
// UANG PELANGGAN (DOMPET)
// ==========================================

export function tambahUangPelanggan(nominal, element) {
    if (state.isTutorialActive) {
        const allowed = checkTutorialAction('payMoney', nominal);
        if (!allowed) return;
    }

    playSFX('money_cash');

    const paidInput = document.getElementById("paid-box");
    if (!paidInput) return;

    // Auto-Routing: Kursor dan activeInput otomatis diarahkan ke #paid-box
    setFocus(paidInput);

    let currentVal = parseInt(paidInput.value.replace(/[^0-9]/g, ''), 10) || 0;

    if (element.style.opacity === "0.2") {
        element.style.opacity = "1";
        let newVal = currentVal - nominal;
        paidInput.value = newVal <= 0 ? "" : newVal.toLocaleString('id-ID');
    } else {
        element.style.opacity = "0.2";
        paidInput.value = (currentVal + nominal).toLocaleString('id-ID');
    }

    paidInput.style.color = "#1a1a1a";
}

// ==========================================
// NAMPAN PESANAN
// ==========================================

export function munculkanKueDiNampan() {
    if (state.kembalianModeActive) return;
    if (!state.selectedProducts || state.selectedProducts.length === 0) {
        state.selectedProducts = [];
        for (let key in state.currentLevelParams.order) {
            let qty = state.currentLevelParams.order[key];
            if (qty > 0) {
                for (let i = 0; i < qty; i++) {
                    state.selectedProducts.push(key);
                }
            }
        }
    }
    renderProdukDiNampan();
}

// ==========================================
// CHECKOUT
// ==========================================

export function processCheckout() {
    if (state.tagihanTervalidasi === 0) return showMsg("Peringatan", "Hitung total harga aljabar dahulu (=).");

    const paidInput   = document.getElementById("paid-box");
    let uangDibayar   = parseInt(paidInput.value.replace(/[^0-9]/g, ''));
    const totalUangFisik = Object.keys(state.uangDibayarDetail)
        .reduce((total, pecahan) => total + (Number(pecahan) * state.uangDibayarDetail[pecahan]), 0);
    const maksimalDompet = totalUangFisik > 0 ? totalUangFisik : 100000;

    if (isNaN(uangDibayar) || uangDibayar < state.tagihanTervalidasi) {
        state.currentLevelParams.errorCount++;
        paidInput.value = "Kurang!";
        paidInput.style.color = "red";
        return showMsg("Uang Kurang", "Nominal pembayaran kurang/kosong!");
    }

    if (uangDibayar > maksimalDompet) {
        state.currentLevelParams.errorCount++;
        paidInput.value = "Tdk Logis!";
        paidInput.style.color = "red";
        return showMsg("Tidak Logis", `Pelanggan maksimal hanya punya Rp ${maksimalDompet.toLocaleString('id-ID')}.`);
    }

    let kembalian = uangDibayar - state.tagihanTervalidasi;
    let profit    = state.tagihanTervalidasi - state.currentLevelParams.totalCost;

    // Render struk
    let rumusArr = [], prosesArr = [], rincianArr = [];
    for (let key in state.currentLevelParams.order) {
        let qty = state.currentLevelParams.order[key];
        if (qty > 0) {
            rumusArr.push(`${qty}${key}`);
            prosesArr.push(`${qty}(\\text{Rp } ${ITEM_DB[key].price.toLocaleString('id-ID')})`);
            rincianArr.push(`Rp ${(qty * ITEM_DB[key].price).toLocaleString('id-ID')}`);
        }
    }

    document.getElementById("struk-rumus").innerHTML                = renderMathExpression(rumusArr.join(" + "));
    document.getElementById("struk-proses").innerHTML               = renderMathExpression(prosesArr.join(" + "));
    document.getElementById("struk-rincian").innerHTML              = rincianArr.join(" + ");
    document.getElementById("struk-total").textContent              = "Rp " + state.tagihanTervalidasi.toLocaleString('id-ID');
    document.getElementById("struk-bayar-total").textContent        = "Rp " + uangDibayar.toLocaleString('id-ID');
    document.getElementById("struk-bayar-rincian").textContent      = tentukanPecahanUang();
    document.getElementById("struk-kembalian-hitung").innerHTML     = `Rp ${uangDibayar.toLocaleString('id-ID')} - Rp ${state.tagihanTervalidasi.toLocaleString('id-ID')} = Rp ${kembalian.toLocaleString('id-ID')}`;
    document.getElementById("struk-kembalian-final").textContent    = "Rp " + kembalian.toLocaleString('id-ID');

    state.levelAccumulation.revenue += state.tagihanTervalidasi;
    state.levelAccumulation.cost    += state.currentLevelParams.totalCost;
    state.levelAccumulation.profit  += profit;
    state.levelAccumulation.errors  += state.currentLevelParams.errorCount;

    const btnCloseModal = document.getElementById("btn-close-modal");
    if (kembalian > 0) {
        btnCloseModal.textContent = "Berikan Kembalian";
        btnCloseModal.onclick = () => {
            if (state.isTutorialActive) {
                const allowed = checkTutorialAction('closeReceipt');
                if (!allowed) return;
            }
            document.getElementById("receipt-modal").style.display = "none";
            mulaiModeKembalian(kembalian);
        };
    } else {
        // Transaksi Uang Pas
        checkBadgeUnlocks({
            type: 'transaction_receipt',
            kembalian: 0,
            level: state.currentLevelIdx
        });
        btnCloseModal.textContent = "Uang Pas (Lanjut)";
        btnCloseModal.onclick     = finishCustomerOrLevel;
    }

    const modalReceipt = document.getElementById("receipt-modal");
    modalReceipt.style.display = "flex";
    const receiptCard = modalReceipt.querySelector(".final-receipt-card");
    if (receiptCard) {
        receiptCard.scrollTop = 0;
    }
}

// ==========================================
// MODE KEMBALIAN
// ==========================================

export function mulaiModeKembalian(jumlahKembalian) {
    state.kembalianModeActive = true;
    state.targetKembalian     = jumlahKembalian;
    state.arrayUangKembalian  = [];
    state.kembalianStartTime  = Date.now();

    const priceDisplay = document.getElementById("harga-display");
    priceDisplay.textContent = "Kembalikan: Rp " + state.targetKembalian.toLocaleString('id-ID');
    priceDisplay.style.color = "#ffb74d";

    document.getElementById("formula-box").value = "Rp 0";
    document.getElementById("paid-box").value    = "-";

    document.getElementById("numpad-container").classList.add("hidden");
    document.getElementById("laci-kasir").classList.remove("hidden");
    document.querySelector(".tray-title-label").innerText = "Kembalian";
    document.getElementById("tray-items").innerHTML = "";
}

export function tambahUangKembalian(nominal) {
    playSFX('money_cash');
    state.arrayUangKembalian.push(nominal);
    renderUangDiNampan();
}

export function tarikUangKembalian(index) {
    if (state.isTutorialActive) return;
    playSFX('clear_back');
    state.arrayUangKembalian.splice(index, 1);
    renderUangDiNampan();
}

export function renderUangDiNampan() {
    const tray = document.getElementById("tray-items");
    tray.innerHTML = "";
    let totalDiberikan = 0;

    tray.style.flexDirection = "row";
    tray.style.flexWrap      = "wrap";
    tray.style.alignItems    = "center";
    tray.style.paddingTop    = "10px";

    state.arrayUangKembalian.forEach((nominal, index) => {
        totalDiberikan += nominal;
        let randomRotate = (Math.random() * 10 - 5).toFixed(1);
        const img = document.createElement('img');
        img.src   = `assets/rupiah/rp${nominal}.png`;
        img.className = "tray-money-item";
        img.style.transform = `rotate(${randomRotate}deg)`;
        img.alt = `Rp ${nominal}`;
        img.addEventListener('click', () => tarikUangKembalian(index));
        tray.appendChild(img);
    });

    document.getElementById("formula-box").value = "Rp " + totalDiberikan.toLocaleString('id-ID');
}

export function validasiUangKembalian() {
    let totalDiberikan = state.arrayUangKembalian.reduce((a, b) => a + b, 0);

    if (totalDiberikan === state.targetKembalian) {
        playSFX('success_quiz_change');
        const duration = state.kembalianStartTime ? Math.floor((Date.now() - state.kembalianStartTime) / 1000) : 0;
        checkBadgeUnlocks({
            type: 'kembalian_success',
            kembalianAccurate: true,
            duration: duration,
            level: state.currentLevelIdx
        });

        showMsg("Tepat Sekali!", "Uang kembalian yang Anda berikan pas. Pelanggan senang!", () => {
            finishCustomerOrLevel();
        });
    } else {
        playSFX('error');
        state.currentLevelParams.errorCount++;
        showMsg("Oops! Kembalian Salah", `Seharusnya Anda memberikan Rp ${state.targetKembalian.toLocaleString('id-ID')}, tetapi Anda malah menyiapkan Rp ${totalDiberikan.toLocaleString('id-ID')}. Ayo hitung lagi!`);
    }
}

// ==========================================
// ANTREAN PELANGGAN & KUIS
// ==========================================

export function finishCustomerOrLevel() {
    document.getElementById("receipt-modal").style.display = "none";
    if (state.isTutorialActive) endTutorial();

    if (state.currentCustomerIdx < state.levelCustomers.length - 1) {
        state.currentCustomerIdx++;
        state.isTutorialActive = false;
        loadCustomer();
    } else {
        if (QUIZ_DB[state.currentLevelIdx]) {
            state.currentQuizIndex = 0;
            showQuizQuestion();
        } else {
            completeLevelAndSave();
        }
    }
}

let pendingQuizSelection = null;

export function showQuizQuestion() {
    const quizModal = document.getElementById("quiz-modal");
    const quizData  = QUIZ_DB[state.currentLevelIdx][state.currentQuizIndex];
    pendingQuizSelection = null;

    document.getElementById("quiz-level-title").innerText = `Kuis Level ${state.currentLevelIdx}`;
    document.getElementById("quiz-counter").innerText     = `Soal ${state.currentQuizIndex + 1} / ${QUIZ_DB[state.currentLevelIdx].length}`;
    document.getElementById("quiz-question").innerHTML    = formatMathText(quizData.q);

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";
    document.getElementById("quiz-feedback").classList.add("hidden");
    document.getElementById("btn-next-quiz").classList.add("hidden");

    const btnConfirm = document.getElementById("btn-confirm-quiz");
    if (btnConfirm) {
        btnConfirm.classList.remove("hidden");
        btnConfirm.disabled = true;
    }

    quizData.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-quiz-option";

        // Pisahkan label abjad (A., B., C., D.) dengan isi opsi agar rapi dan rapat di kiri
        const match = opt.match(/^([A-Za-z0-9]+[\.\)])\s*(.*)$/);
        if (match) {
            const letter = match[1];
            const textContent = match[2];
            btn.innerHTML = `<span class="quiz-option-letter">${letter}</span><span class="quiz-option-text">${formatMathText(textContent)}</span>`;
        } else {
            btn.innerHTML = `<span class="quiz-option-text">${formatMathText(opt)}</span>`;
        }

        btn.addEventListener('click', () => {
            const allButtons = optionsContainer.querySelectorAll(".btn-quiz-option");
            allButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            pendingQuizSelection = { index, btnElement: btn, correctIndex: quizData.ans };
            if (btnConfirm) btnConfirm.disabled = false;
        });
        optionsContainer.appendChild(btn);
    });

    quizModal.classList.remove("hidden");
}

export function confirmQuizAnswer() {
    if (!pendingQuizSelection) return;

    const btnConfirm = document.getElementById("btn-confirm-quiz");
    if (btnConfirm) {
        btnConfirm.classList.add("hidden");
    }

    checkQuizAnswer(
        pendingQuizSelection.index,
        pendingQuizSelection.btnElement,
        pendingQuizSelection.correctIndex
    );
}

export function checkQuizAnswer(selectedIndex, btnElement, correctIndex) {
    const allButtons = document.querySelectorAll(".btn-quiz-option");
    allButtons.forEach(btn => btn.disabled = true);

    const feedbackBox = document.getElementById("quiz-feedback");
    feedbackBox.classList.remove("hidden", "feedback-correct", "feedback-wrong");

    if (selectedIndex === correctIndex) {
        playSFX('success_quiz_change');
        state.currentQuizCorrect++;
        btnElement.classList.add("correct");
        feedbackBox.classList.add("feedback-correct");
        feedbackBox.innerText = "Jawaban Tepat! Luar biasa!";
    } else {
        playSFX('error');
        btnElement.classList.add("wrong");
        allButtons[correctIndex].classList.add("correct");
        feedbackBox.classList.add("feedback-wrong");
        feedbackBox.innerText = "Ups, kurang tepat. Konsep ini sempat dibahas oleh pelanggan tadi.";

        // Kirim pembaruan progres realtime ke guru saat kuis salah
        try {
            sendStudentProgress(
                state.currentUser,
                state.currentLevelIdx,
                state.currentLevelParams.errorCount,
                state.currentQuizCorrect,
                QUIZ_DB[state.currentLevelIdx]?.length || 0
            );
        } catch (syncErr) {
            console.warn('[Sync] Gagal kirim progres saat kuis salah:', syncErr);
        }
    }

    document.getElementById("btn-next-quiz").classList.remove("hidden");
}

export function nextQuizQuestion() {
    state.currentQuizIndex++;
    if (state.currentQuizIndex < QUIZ_DB[state.currentLevelIdx].length) {
        showQuizQuestion();
    } else {
        document.getElementById("quiz-modal").classList.add("hidden");
        // Evaluasi lencana kuis sempurna
        checkBadgeUnlocks({
            type: 'quiz_complete',
            quizCorrect: state.currentQuizCorrect,
            quizTotal: QUIZ_DB[state.currentLevelIdx]?.length || 0,
            level: state.currentLevelIdx
        });
        completeLevelAndSave();
    }
}

export function completeLevelAndSave() {
    let duration = Math.floor((Date.now() - state.currentLevelParams.startTime) / 1000);
    if (state.currentUser.maxLevel < state.currentLevelIdx) {
        state.currentUser.maxLevel = state.currentLevelIdx;
    }

    let existLog = state.currentUser.history.find(h => h.level === state.currentLevelIdx);
    if (!existLog) {
        state.currentUser.history.push({
            level:       state.currentLevelIdx,
            revenue:     state.levelAccumulation.revenue,
            cost:        state.levelAccumulation.cost,
            profit:      state.levelAccumulation.profit,
            duration,
            errors:      state.levelAccumulation.errors,
            quizCorrect: state.currentQuizCorrect,
            quizTotal:   QUIZ_DB[state.currentLevelIdx]?.length || 0,
            timestamp:   new Date().toISOString()
        });

        state.currentUser.revenue += state.levelAccumulation.revenue;
        state.currentUser.cost    += state.levelAccumulation.cost;
        state.currentUser.money   += state.levelAccumulation.profit;
    }

    // Hitung jumlah variabel unik yang digunakan pada pesanan level ini
    const levelOrders = LEVEL_DATA[state.currentLevelIdx] || [];
    const allVars = new Set();
    levelOrders.forEach(cust => {
        if (cust.order) Object.keys(cust.order).forEach(v => allVars.add(v));
    });

    // Evaluasi otomatis semua lencana berdasarkan pencapaian level
    checkBadgeUnlocks({
        type: 'level_complete',
        level: state.currentLevelIdx,
        errors: state.levelAccumulation.errors,
        distinctVariables: allVars.size,
        quizCorrect: state.currentQuizCorrect,
        quizTotal: QUIZ_DB[state.currentLevelIdx]?.length || 0
    });

    // Kosongkan penanda level aktif saat level selesai
    state.activePlayingLevel = null;

    saveData();

    // Sinkronisasi data progres murid ke guru secara realtime (Hybrid Offline + Realtime)
    try {
        sendStudentProgress(
            state.currentUser,
            state.currentLevelIdx,
            state.levelAccumulation.errors,
            state.currentQuizCorrect,
            QUIZ_DB[state.currentLevelIdx]?.length || 0
        );
    } catch (syncErr) {
        console.warn('[Sync] Progres gagal dikirim:', syncErr);
    }

    // Jika baru menyelesaikan Level 10 atau sedang di level sulit, pertahankan tab sulit aktif
    if (state.currentLevelIdx >= 10) {
        state.currentLevelTab = 'hard';
        if (state.currentLevelIdx === 10) {
            setTimeout(() => {
                showMsg(
                    '🎉 TANTANGAN SULIT TERBUKA!',
                    'Luar biasa! Kamu berhasil menamatkan seluruh 10 Level Tantangan Mudah!<br><br>Mode <strong>Tantangan Sulit (C4-C6)</strong> kini telah terbuka dengan studi kasus HOTS nyata!'
                );
            }, 300);
        }
    }

    switchScreen('screen-levels');
}

// ==========================================
// INIT LISTENERS MESIN KASIR
// ==========================================

export function initGameListeners() {
    const formulaInput  = document.getElementById("formula-box");
    const paidInput     = document.getElementById("paid-box");
    const inputButtons  = document.querySelectorAll(".numpad-grid .btn-num, .numpad-grid .btn-op");
    const backspaceBtn  = document.querySelector(".btn-backspace");
    const clearBtn      = document.querySelector(".btn-clear");
    const calcBtn       = document.querySelector(".btn-calc");
    const confirmBtn    = document.getElementById("btn-final-checkout");
    const btnCloseModal = document.getElementById("btn-close-modal");

    if (!formulaInput) return;

    formulaInput.addEventListener('click', () => {
        if (state.isTutorialActive) return;
        setFocus(formulaInput);
    });

    if (paidInput) {
        paidInput.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            setFocus(paidInput);
        });
    }

    inputButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            playSFX('numpad');
            if (!state.activeInput) state.activeInput = formulaInput;
            if (state.activeInput.id === "paid-box") {
                if (btn.classList.contains('btn-num')) {
                    let currentDigits = state.activeInput.value.replace(/[^0-9]/g, '');
                    let newDigits     = (currentDigits === '0' || currentDigits === '') ? btn.textContent : (currentDigits + btn.textContent);
                    let num           = parseInt(newDigits, 10);
                    state.activeInput.value = isNaN(num) ? "" : num.toLocaleString('id-ID');
                }
            } else {
                // Input sedang di #formula-box
                // Jika tagihan sudah tervalidasi sebelumnya lalu pemain mengetik rumus baru, batalkan validasi lama
                if (state.tagihanTervalidasi > 0) {
                    state.tagihanTervalidasi = 0;
                    const priceDisplay = document.getElementById("harga-display");
                    if (priceDisplay) { priceDisplay.textContent = ""; priceDisplay.style.color = "#a5d6a7"; }
                    const trayItems = document.getElementById("tray-items");
                    if (trayItems) trayItems.innerHTML = "";
                }
                state.activeInput.classList.remove('input-error');
                state.activeInput.value += btn.textContent;
            }
            state.activeInput.style.color = "#1a1a1a";
        });
    });

    if (backspaceBtn) {
        backspaceBtn.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            playSFX('clear_back');
            if (state.activeInput && state.activeInput.value.length > 0) {
                state.activeInput.classList.remove('input-error');
                if (state.activeInput.id === "formula-box") {
                    if (Array.isArray(state.selectedProducts) && state.selectedProducts.length > 0) {
                        state.selectedProducts.pop();
                        state.activeInput.value = generateFormulaFromSelectedProducts();
                        renderProdukDiNampan();
                    } else {
                        state.activeInput.value = state.activeInput.value.replace(/(\d*[a-q]|[+\-]|\d+)$/i, '');
                    }
                    const priceDisplay = document.getElementById("harga-display");
                    if (priceDisplay) { priceDisplay.textContent = ""; priceDisplay.style.color = "#a5d6a7"; }
                    state.tagihanTervalidasi = 0;
                    const lastVar = state.selectedProducts && state.selectedProducts.length > 0 ? state.selectedProducts[state.selectedProducts.length - 1] : null;
                    updateVariableHelperSubtext(lastVar);
                } else if (state.activeInput.id === "paid-box") {
                    let clean = state.activeInput.value.replace(/[^0-9]/g, '').slice(0, -1);
                    state.activeInput.value = clean.length > 0 ? parseInt(clean, 10).toLocaleString('id-ID') : "";
                } else {
                    state.activeInput.value = state.activeInput.value.slice(0, -1);
                }
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (state.isTutorialActive) return;
            playSFX('clear_back');
            const target = state.activeInput || formulaInput;
            if (target) {
                target.classList.remove('input-error');
                target.value = "";
                if (target.id === "formula-box") {
                    const priceDisplay = document.getElementById("harga-display");
                    if (priceDisplay) { priceDisplay.textContent = ""; priceDisplay.style.color = "#a5d6a7"; }
                    state.tagihanTervalidasi = 0;
                    state.selectedProducts = [];
                    renderProdukDiNampan();
                    updateVariableHelperSubtext();
                } else if (target.id === "paid-box") {
                    document.querySelectorAll("#wallet-container-dynamic .img-placeholder")
                        .forEach(item => { item.style.opacity = "1"; });
                }
            }
        });
    }

    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            if (state.isTutorialActive) {
                const paidInput = document.getElementById("paid-box");
                const paidVal = paidInput ? (parseInt(paidInput.value.replace(/[^0-9]/g, ''), 10) || 0) : 0;
                const isShortcut = state.tagihanTervalidasi > 0 && paidVal > 0;
                const reqAction = isShortcut ? (state.kembalianModeActive ? 'confirmChange' : 'checkout') : 'calc';
                const allowed = checkTutorialAction(reqAction);
                if (!allowed) return;
            }
            handleCalculate();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (state.isTutorialActive) {
                const action = state.kembalianModeActive ? 'confirmChange' : 'checkout';
                const allowed = checkTutorialAction(action);
                if (!allowed) return;
            }
            playSFX('calc_checkout');
            if (state.kembalianModeActive) {
                validasiUangKembalian();
            } else {
                processCheckout();
            }
        });
    }

    // Tombol laci kasir (uang kembalian)
    document.querySelectorAll('.btn-uang').forEach(btn => {
        btn.addEventListener('click', () => {
            const nominal = parseInt(btn.dataset.nominal, 10);
            if (!nominal) return;
            if (state.isTutorialActive) {
                const allowed = checkTutorialAction('giveChange', nominal);
                if (!allowed) return;
            }
            tambahUangKembalian(nominal);
        });
    });
}

/**
 * Menangani tombol "=" di numpad: validasi formula lalu tampilkan harga,
 * atau pintasan konfirmasi checkout jika rumus sudah valid dan uang sudah diinput.
 */
export function handleCalculate() {
    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    const priceDisplay = document.getElementById("harga-display");

    const paidVal = paidInput ? (parseInt(paidInput.value.replace(/[^0-9]/g, ''), 10) || 0) : 0;

    // Logika Pintar: Jika rumus sudah valid (state.tagihanTervalidasi > 0) dan kolom uang sudah terisi,
    // jadikan tombol "=" sebagai jalan pintas untuk langsung menjalankan konfirmasi transaksi (checkout)
    if (state.tagihanTervalidasi > 0 && paidVal > 0) {
        if (state.isTutorialActive) {
            const action = state.kembalianModeActive ? 'confirmChange' : 'checkout';
            const allowed = checkTutorialAction(action);
            if (!allowed) return;
        }
        playSFX('calc_checkout');
        if (state.kembalianModeActive) {
            validasiUangKembalian();
        } else {
            processCheckout();
        }
        return;
    }

    if (!formulaInput) return;

    // Evaluasi rumus aljabar dari formula-box terlepas dari kolom mana yang sedang aktif
    const result = calculateFormula();

    if (result.isBenar) {
        playSFX('calc_checkout');
        state.tagihanTervalidasi = result.tagihan;
        state.currentLevelParams.totalCost = result.cost;

        // Otomatis sederhanakan ekspresi (misal 3a + 4a -> 7a, atau 5j + 2e - 2e -> 5j)
        if (result.simplifiedFormula) {
            formulaInput.value = result.simplifiedFormula;
        }

        formulaInput.classList.remove('input-error');
        if (priceDisplay) {
            priceDisplay.textContent = "Rp " + state.tagihanTervalidasi.toLocaleString('id-ID');
            priceDisplay.style.color = "#a5d6a7";
        }

        munculkanKueDiNampan();

        // Pindahkan fokus input secara otomatis ke #paid-box
        if (paidInput) {
            setFocus(paidInput);
        }
    } else {
        playSFX('error');
        state.currentLevelParams.errorCount++;
        if (priceDisplay) {
            priceDisplay.textContent = "Rumus Salah!";
            priceDisplay.style.color = "#ef9a9a";
        }
        state.tagihanTervalidasi = 0;
        renderProdukDiNampan();

        // Tampilkan indikator merah pada box rumus tanpa memblokir game
        formulaInput.classList.add('input-error');

        const panel = document.querySelector('.green-indicator-screen');
        if (panel) {
            panel.classList.add('error-flash');
            setTimeout(() => panel.classList.remove('error-flash'), 350);
        }

        // Arahkan kembali fokus ke formula-box agar siswa dapat mengoreksi rumus
        setFocus(formulaInput);

        // Kirim pembaruan progres realtime ke guru saat rumus kasir salah
        try {
            sendStudentProgress(
                state.currentUser,
                state.currentLevelIdx,
                state.currentLevelParams.errorCount,
                state.currentQuizCorrect,
                QUIZ_DB[state.currentLevelIdx]?.length || 0
            );
        } catch (syncErr) {
            console.warn('[Sync] Gagal kirim progres saat rumus salah:', syncErr);
        }
    }
}

