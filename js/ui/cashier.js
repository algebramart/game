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
    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    state.activeInput  = inputElement;
    formulaInput.classList.remove("input-active");
    paidInput.classList.remove("input-active");
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

    const speechBubble = document.querySelector('.speech-bubble');
    if (speechBubble) speechBubble.innerHTML = formatMathText(customer.text);

    const npcImage = document.querySelector('.npc-image');
    if (npcImage && customer.image) npcImage.src = customer.image;

    const formulaInput = document.getElementById("formula-box");
    const paidInput    = document.getElementById("paid-box");
    const hargaDisplay = document.getElementById("harga-display");
    const trayItems    = document.getElementById("tray-items");

    if (formulaInput) formulaInput.value = "";
    if (paidInput)    paidInput.value    = "";
    if (hargaDisplay) { hargaDisplay.textContent = ""; hargaDisplay.style.color = "#a5d6a7"; }
    if (trayItems)    trayItems.innerHTML = "";

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

        if (formulaInput) setFocus(formulaInput);
    }
}

// ==========================================
// START LEVEL
// ==========================================

export function startLevel(lvl) {
    if (!LEVEL_DATA[lvl]) return showMsg("Level Terkunci", "Level sedang dikembangkan.");

    state.currentLevelIdx      = lvl;
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
// KLIK BARANG DI RAK
// ==========================================

export function addVariable(varName) {
    if (state.isTutorialActive) {
        const allowed = checkTutorialAction('addVar', varName);
        if (!allowed) return;
    }

    playSFX('product');

    const formulaInput = document.getElementById("formula-box");
    if (!state.activeInput) state.activeInput = formulaInput;

    if (state.activeInput.id === "formula-box") {
        let currentValue = state.activeInput.value.replace(/\s+/g, '');

        if (currentValue === "") {
            state.activeInput.value = varName;
        } else if (new RegExp(`(\\d*)(${varName})$`).test(currentValue)) {
            let match      = currentValue.match(new RegExp(`(\\d*)(${varName})$`));
            let currentNum = match[1] === "" ? 1 : parseInt(match[1]);
            state.activeInput.value = currentValue.replace(new RegExp(`(\\d*)(${varName})$`), (currentNum + 1) + varName);
        } else if (/\d+$/.test(currentValue)) {
            state.activeInput.value = currentValue + varName;
        } else if (/[+\-]$/.test(currentValue)) {
            state.activeInput.value = currentValue + varName;
        } else {
            state.activeInput.value = currentValue + "+" + varName;
        }

        state.activeInput.style.color = "#1a1a1a";
    }
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

    let currentVal = parseInt(paidInput.value.replace(/\./g, ''), 10) || 0;

    if (element.style.opacity === "0.2") {
        element.style.opacity = "1";
        let newVal = currentVal - nominal;
        paidInput.value = newVal <= 0 ? "" : newVal.toLocaleString('id-ID');
    } else {
        element.style.opacity = "0.2";
        paidInput.value = (currentVal + nominal).toLocaleString('id-ID');
    }

    paidInput.style.color = "#1a1a1a";
    setFocus(paidInput);
}

// ==========================================
// NAMPAN PESANAN
// ==========================================

export function munculkanKueDiNampan() {
    const tray = document.getElementById("tray-items");
    tray.innerHTML = "";
    tray.style.flexDirection = "row";
    tray.style.flexWrap      = "wrap";
    tray.style.alignItems    = "flex-end";
    tray.style.paddingTop    = "0";

    let delayCounter = 0;
    for (let key in state.currentLevelParams.order) {
        let qty = state.currentLevelParams.order[key];
        if (qty > 0) {
            for (let i = 0; i < qty; i++) {
                let delay = delayCounter * 0.05;
                tray.innerHTML += `<div class="tray-product" style="animation-delay:${delay}s">
                    <span class="tray-label">${key}</span>
                    <img src="${ITEM_DB[key].img}" class="tray-img" alt="${ITEM_DB[key].name}">
                </div>`;
                delayCounter++;
            }
        }
    }
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

    document.getElementById("receipt-modal").style.display = "flex";
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
                    let currentVal = state.activeInput.value.replace(/\./g, '');
                    let newVal     = currentVal + btn.textContent;
                    state.activeInput.value = parseInt(newVal, 10).toLocaleString('id-ID');
                }
            } else {
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
                if (state.activeInput.id === "formula-box") {
                    state.activeInput.value = state.activeInput.value.replace(/(\d*[a-q]|[+\-]|\d+)$/i, '');
                    document.getElementById("harga-display").textContent = "";
                    state.tagihanTervalidasi = 0;
                    document.getElementById("tray-items").innerHTML = "";
                } else if (state.activeInput.id === "paid-box") {
                    let currentVal = state.activeInput.value.replace(/\./g, '').slice(0, -1);
                    state.activeInput.value = currentVal.length > 0 ? parseInt(currentVal, 10).toLocaleString('id-ID') : "";
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
            if (state.activeInput) {
                state.activeInput.value = "";
                if (state.activeInput.id === "formula-box") {
                    document.getElementById("harga-display").textContent = "";
                    state.tagihanTervalidasi = 0;
                    document.getElementById("tray-items").innerHTML = "";
                } else if (state.activeInput.id === "paid-box") {
                    document.querySelectorAll("#wallet-container-dynamic .img-placeholder")
                        .forEach(item => { item.style.opacity = "1"; });
                }
            }
        });
    }

    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            if (state.isTutorialActive) {
                const allowed = checkTutorialAction('calc');
                if (!allowed) return;
            }
            playSFX('calc_checkout');
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
 * Menangani tombol "=" di numpad: validasi formula lalu tampilkan harga.
 */
function handleCalculate() {
    const formulaInput = document.getElementById("formula-box");
    if (state.activeInput !== formulaInput) return;

    const result = calculateFormula();
    const priceDisplay = document.getElementById("harga-display");

    if (result.isBenar) {
        state.tagihanTervalidasi = result.tagihan;
        state.currentLevelParams.totalCost = result.cost;

        priceDisplay.textContent = "Rp " + state.tagihanTervalidasi.toLocaleString('id-ID');
        priceDisplay.style.color = "#a5d6a7";

        munculkanKueDiNampan();
        setFocus(document.getElementById("paid-box"));
    } else {
        playSFX('error');
        state.currentLevelParams.errorCount++;
        priceDisplay.textContent = "Rumus Salah!";
        priceDisplay.style.color = "#ef9a9a";
        state.tagihanTervalidasi = 0;
        document.getElementById("tray-items").innerHTML = "";

        const panel = document.querySelector('.green-indicator-screen');
        if (panel) {
            panel.classList.add('error-flash');
            setTimeout(() => panel.classList.remove('error-flash'), 300);
        }
    }
}

