// ==========================================
// --- DATA & STATE MANAGEMENT ---
// ==========================================
let users = JSON.parse(localStorage.getItem('algebraMart_users')) || [];
let currentUser = null;
let chartInstance = null;

let kembalianModeActive = false;
let targetKembalian = 0;
let arrayUangKembalian = [];

// Variabel untuk menyimpan jawaban benar kuis per level
let currentQuizCorrect = 0;

// --- DATABASE 17 BARANG (a sampai q) ---
const ITEM_DB = {
    'a': { name: 'Apel', price: 2000, cost: 1000, img: 'assets/barangbelanja/apel.png' },
    'b': { name: 'Beras', price: 15000, cost: 12000, img: 'assets/barangbelanja/beras.png' },
    'c': { name: 'Buku', price: 5000, cost: 3000, img: 'assets/barangbelanja/buku.png' },
    'd': { name: 'Dodol Nanas', price: 3000, cost: 1500, img: 'assets/barangbelanja/dodolnanas.png' },
    'e': { name: 'Gandus', price: 1500, cost: 800, img: 'assets/barangbelanja/gandus.png' },
    'f': { name: 'Gula', price: 12000, cost: 10000, img: 'assets/barangbelanja/gula.png' },
    'g': { name: 'Jeruk', price: 2500, cost: 1500, img: 'assets/barangbelanja/jeruk.png' },
    'h': { name: 'Kopi AAA', price: 4000, cost: 2500, img: 'assets/barangbelanja/kopiaaa.png' },
    'i': { name: 'Minyak Goreng', price: 14000, cost: 12000, img: 'assets/barangbelanja/minyakgoreng.png' },
    'j': { name: 'Padamaran', price: 2000, cost: 1000, img: 'assets/barangbelanja/padamaran.png' },
    'k': { name: 'Pena', price: 3000, cost: 1500, img: 'assets/barangbelanja/pena.png' },
    'l': { name: 'Roti', price: 6000, cost: 4000, img: 'assets/barangbelanja/roti.png' },
    'm': { name: 'Sabun', price: 4000, cost: 2500, img: 'assets/barangbelanja/sabun.png' },
    'n': { name: 'Telur', price: 2000, cost: 1200, img: 'assets/barangbelanja/telur.png' },
    'o': { name: 'Tempoyak', price: 15000, cost: 10000, img: 'assets/barangbelanja/tempoyak.png' },
    'p': { name: 'Tepung', price: 8000, cost: 6000, img: 'assets/barangbelanja/tepung.png' },
    'q': { name: 'Terong', price: 3000, cost: 1500, img: 'assets/barangbelanja/terong.png' }
};

// State Gameplay
let activeInput = null;
let tagihanTervalidasi = 0;
let currentLevelParams = { order: {}, errorCount: 0, startTime: 0, totalCost: 0 };
let uangDibayarDetail = {};

let currentLevelIdx = 1;
let currentCustomerIdx = 0;
let levelCustomers = [];
let levelAccumulation = { revenue: 0, cost: 0, profit: 0, errors: 0 };
let currentQuizIndex = 0;

// ==========================================
// --- DATABASE LEVEL (10 Level - 3 Pelanggan/Level) ---
// ==========================================
const LEVEL_DATA = {
    1: [ // Pengenalan Variabel
        { order: { 'a': 3, 'b': 2 }, text: "Halo, aku mau beli <br><strong>3 Apel (a)</strong> dan <strong>2 Beras (b)</strong>.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'c': 5 }, text: "Aku mau memborong <br><strong>5 Buku (c)</strong> saja.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'f': 1, 'g': 4 }, text: "Tolong siapkan <br><strong>1 Gula (f)</strong> dan <strong>4 Jeruk (g)</strong> ya.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 20000: 1, 5000: 1 } }
    ],
    2: [ // Sifat Komutatif
        { order: { 'a': 2, 'b': 3 }, text: "Bungkuskan <br><strong>2 Apel (a)</strong> dan <strong>3 Beras (b)</strong> ya.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'b': 3, 'a': 2 }, text: "Kalo aku mau beli <br><strong>3 Beras (b)</strong> dan <strong>2 Apel (a)</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'a': 4, 'd': 2 }, text: "Beli <strong>4 Apel (a)</strong> dan <strong>2 Dodol (d)</strong>... eh sebut 2 Dodol dulu baru 4 Apel, harganya sama kan?", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 20000: 1 } }
    ],
    3: [ // Penjumlahan & Pengurangan Sejenis
        { order: { 'a': 7 }, text: "Aku bawa <strong>3 Apel</strong>, eh tunggu, aku nambah lagi <strong>4 Apel</strong> deh. Jadinya berapa a?", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'c': 5 }, text: "Tolong <strong>5 Buku</strong> dan <strong>2 Dodol</strong>... Oh maaf, Dodolnya gak jadi, kurangi 2 ya.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'g': 5 }, text: "Beli <strong>2 Jeruk</strong>, tambah <strong>1 Jeruk</strong> lagi, dan tambah <strong>2 Jeruk</strong> lagi buat adikku.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 20000: 1 } }
    ],
    4: [ // Pengenalan Koefisien
        { order: { 'a': 2, 'b': 2, 'c': 2 }, text: "Aku mau beli <strong>masing-masing 2</strong> untuk Apel, Beras, dan Buku.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'a': 2, 'b': 4, 'c': 1 }, text: "Tolong siapkan <br><strong>2 Apel, 4 Beras, dan 1 Buku</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 100000: 1 } },
        { order: { 'f': 5, 'g': 5 }, text: "Aku butuh borongan <br><strong>5 Gula</strong> dan <strong>5 Jeruk</strong>.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 1 } }
    ],
    5: [ // Substitusi Nilai Variabel 1
        { order: { 'a': 10 }, text: "Pesanan besar nih, aku mau beli <strong>10 Apel</strong>.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'd': 5 }, text: "Aku mau beli <br><strong>5 Dodol Nanas</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'c': 10 }, text: "Tolong <strong>10 Buku</strong> ya, uangnya pas nih.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1 } }
    ],
    6: [ // Penyederhanaan Ekspresi Gabungan
        { order: { 'a': 5 }, text: "Awalnya ibu suruh beli <strong>7 Apel</strong>, tapi uangku kurang, batalin <strong>2 Apel</strong> ya.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 10000: 1 } },
        { order: { 'a': 5, 'b': 3 }, text: "Keranjangku isinya <strong>4 Apel</strong> & <strong>3 Beras</strong>. Terus aku nambah <strong>1 Apel</strong> lagi di luarnya.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 100000: 1 } },
        { order: { 'f': 8, 'g': 2 }, text: "Beli <strong>5 Gula</strong> dan <strong>2 Jeruk</strong>, eh sekalian deh tambah <strong>3 Gula</strong> lagi.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 1, 20000: 1 } }
    ],
    7: [ // Substitusi Nilai Variabel 2
        { order: { 'a': 3 }, text: "Uangku 10 Ribu, cukup gak ya beli <strong>3 Apel (a)</strong>?", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 10000: 1 } },
        { order: { 'a': 3, 'b': 3, 'c': 3 }, text: "Aku mau beli <strong>masing-masing 3</strong> untuk Apel, Beras, dan Buku.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 100000: 1 } },
        { order: { 'f': 4, 'g': 4 }, text: "Tolong <strong>masing-masing 4</strong> untuk Gula dan Jeruk.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1, 10000: 1 } }
    ],
    8: [ // Evaluasi Persamaan Ekuivalen
        { order: { 'b': 2, 'c': 4 }, text: "Beli <strong>2 Beras (b)</strong> dan <strong>4 Buku (c)</strong> ya.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'c': 4, 'b': 2 }, text: "Kalau aku maunya dibalik, <strong>4 Buku (c)</strong> dan <strong>2 Beras (b)</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'a': 6 }, text: "Beli <strong>5 Apel</strong>, eh ketinggalan <strong>1 Apel</strong> lagi, gabungin aja jadinya.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 20000: 1 } }
    ],
    9: [ // Makna Koefisien Nol (0)
        { order: { 'a': 3, 'c': 2 }, text: "Aku beli <strong>3 Apel, 2 Buku</strong>. Berasnya kosong? Yaudah <strong>0 Beras</strong> (Lewati b).", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'd': 5 }, text: "Tadinya mau pesan <strong>5 Dodol</strong> & <strong>2 Apel</strong>, tapi Apelnya gak jadi deh (0 Apel).", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'c': 4 }, text: "Beli <strong>4 Buku</strong> ya. Berasnya 0, Apelnya 0.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 20000: 1 } }
    ],
    10: [ // Tantangan Ujian Akhir
        { order: { 'a': 8, 'b': 8, 'd': 4 }, text: "Pesan paketan hajatan: <br><strong>8 Apel, 8 Beras, dan 4 Dodol</strong>.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 100000: 2 } },
        { order: { 'a': 8, 'b': 3 }, text: "Belanjaanku digabung adikku. Aku <strong>5 Apel, 2 Beras</strong>. Adikku <strong>3 Apel, 1 Beras</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 100000: 1 } },
        { order: { 'a': 10, 'b': 5, 'c': 5, 'd': 2, 'f': 1 }, text: "Borongan besar kelontong!<br><strong>10 Apel, 5 Beras, 5 Buku, 2 Dodol, 1 Gula</strong>.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 2 } }
    ]
};

// ==========================================
// --- DATA KUIS ---
// ==========================================
const QUIZ_DB = {
    1: [
        { q: "Pelanggan membeli 3 Apel (a) dan 2 Beras (b). Bentuk aljabarnya adalah...", options: ["A. 3a + 2b", "B. 5ab", "C. 2a + 3b", "D. 3a - 2b"], ans: 0 },
        { q: "Pelanggan memborong 5 Buku (c). Bentuk aljabarnya adalah...", options: ["A. 5 + c", "B. 5c", "C. c^5", "D. 5 - c"], ans: 1 }
    ],
    2: [
        { q: "Apakah bentuk 2a + 3b menghasilkan total harga yang SAMA dengan 3b + 2a?", options: ["A. Ya (Sifat Komutatif)", "B. Tidak (Beda urutan)", "C. Tergantung harganya", "D. Tidak tahu"], ans: 0 },
        { q: "Bentuk aljabar 4a + 2d ekuivalen (nilainya persis sama) dengan bentuk...", options: ["A. 6ad", "B. 2d + 4a", "C. 4d + 2a", "D. 4(a+d)"], ans: 1 }
    ],
    3: [
        { q: "Pelanggan membawa 3 Apel (3a) lalu menambah 4 Apel lagi (4a). Jika disederhanakan, 3a + 4a adalah...", options: ["A. 34a", "B. 7a", "C. 12a", "D. a^7"], ans: 1 },
        { q: "Bentuk sederhana dari suku sejenis 5g + 2d - 2d adalah...", options: ["A. 3g + 2d", "B. 7g + 2d", "C. 5g", "D. 2d"], ans: 2 }
    ],
    4: [
        { q: "Pelanggan membeli masing-masing 2 untuk Apel, Beras, dan Buku. Aljabar yang tepat adalah...", options: ["A. 2a + 2b + 2c", "B. 6abc", "C. 2abc", "D. a + b + c"], ans: 0 },
        { q: "Berapakah koefisien (angka pengali) dari variabel b pada persamaan 2a + 4b + c?", options: ["A. 2", "B. 4", "C. 1", "D. 0"], ans: 1 }
    ],
    5: [
        { q: "Pelanggan membeli 10 Apel. Penulisannya dalam aljabar adalah...", options: ["A. 10 + a", "B. 10a", "C. a10", "D. 10 / a"], ans: 1 },
        { q: "Jika harga 1 Dodol (d) adalah Rp 3.000, maka nilai harga total dari 5d adalah...", options: ["A. Rp 3.000", "B. Rp 8.000", "C. Rp 15.000", "D. Rp 5.000"], ans: 2 }
    ],
    6: [
        { q: "Hasil pengurangan dari 7a - 2a adalah...", options: ["A. 9a", "B. 5a", "C. 14a", "D. 5"], ans: 1 },
        { q: "Bentuk paling sederhana dari gabungan (4a + 3b) + a adalah...", options: ["A. 5a + 3b", "B. 4a + 4b", "C. 7ab", "D. 8ab"], ans: 0 }
    ],
    7: [
        { q: "Jika a (Apel) bernilai Rp 2.000, berapakah nilai uang dari bentuk 3a?", options: ["A. Rp 6.000", "B. Rp 5.000", "C. Rp 2.003", "D. Rp 3.000"], ans: 0 },
        { q: "Bentuk aljabar untuk masing-masing 3 barang (3 Apel, 3 Beras, 3 Buku) adalah...", options: ["A. 3a + b + c", "B. a + b + 3c", "C. 3a + 3b + 3c", "D. 9abc"], ans: 2 }
    ],
    8: [
        { q: "Bentuk aljabar 2b + 4c ekuivalen (nilainya sama) dengan...", options: ["A. 4c + 2b", "B. 6bc", "C. 4b + 2c", "D. 8bc"], ans: 0 },
        { q: "Hasil penjumlahan suku sejenis dari ekspresi aljabar 5a + a adalah...", options: ["A. 5a", "B. 6a", "C. 5a^2", "D. a"], ans: 1 }
    ],
    9: [
        { q: "Pelanggan membeli 3a dan 2c, tetapi tidak jadi beli b (0b). Bentuk aljabar sederhananya...", options: ["A. 3a + 0b + 2c", "B. 3a + 2c", "C. 5ac", "D. 3a - 2c"], ans: 1 },
        { q: "Apa makna dari koefisien angka 0 pada bentuk 0b di dunia nyata?", options: ["A. Barang sangat mahal", "B. Barang gratis", "C. Barang tidak dibeli / dihitung", "D. Barang mendapat diskon"], ans: 2 }
    ],
    10: [
        { q: "Pada struk tertulis 8a + 8b + 4d. Jika harga a = 2.000, berapakah bayaran untuk kelompok Apel (8a) saja?", options: ["A. Rp 10.000", "B. Rp 16.000", "C. Rp 8.000", "D. Rp 24.000"], ans: 1 },
        { q: "Bentuk paling sederhana dari gabungan belanja 5a + 2b + 3a + b adalah...", options: ["A. 8a + 3b", "B. 10ab", "C. 8a + 2b", "D. 5a + 4b"], ans: 0 }
    ]
};

const BADGES_DB = [
    { id: 'si_teliti', name: 'Si Teliti', icon: 'fa-search', colorClass: 'icon-blue', desc: 'Menyelesaikan level tanpa salah ketik.' },
    { id: 'si_jujur', name: 'Si Jujur', icon: 'fa-heart', colorClass: 'icon-red', desc: 'Memberikan kembalian dengan tepat.' },
    { id: 'saudagar', name: 'Saudagar Cilik', icon: 'fa-sack-dollar', colorClass: 'icon-yellow', desc: 'Mengumpulkan laba di atas Rp 50.000.' }
];

// ==========================================
// --- UTILS & LOGIN (Tidak Berubah Signifikan) ---
// ==========================================

// Fungsi untuk masuk ke mode Full Screen (F11 Otomatis)
function requestFullScreen() {
    // Kita targetkan elemen <body> atau document agar seluruh layar tertutup
    const elem = document.documentElement; 
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn("Fullscreen diblokir: ", err));
    } else if (elem.webkitRequestFullscreen) { /* Untuk browser Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* Untuk browser IE/Edge lama */
        elem.msRequestFullscreen();
    }
}

// Fungsi untuk keluar dari mode Full Screen
function exitFullScreen() {
    // Cek dulu apakah web sedang dalam mode full screen
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge lama */
            document.msExitFullscreen();
        }
    }
}

function showMsg(title, desc, onCloseCallback = null) {
    document.getElementById('msg-title').innerHTML = title;
    document.getElementById('msg-desc').innerHTML = desc; // Diubah ke innerHTML agar mendukung <ul>, <li>, <br>
    
    const modalMsg = document.getElementById('modal-msg');
    const btnOk = modalMsg.querySelector('.btn-primary');
    
    // Atur tombol OK agar menutup pop-up dan menjalankan perintah lanjutan (jika ada)
    btnOk.onclick = () => {
        modalMsg.classList.add('hidden');
        if (onCloseCallback) onCloseCallback();
    };
    
    modalMsg.classList.remove('hidden');
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function switchScreen(screenId) {
    if (typeof endTutorial === 'function') endTutorial();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'screen-lobby') renderLobby();
    if (screenId === 'screen-levels') renderLevels();
}

function saveData() { localStorage.setItem('algebraMart_users', JSON.stringify(users)); }

function getTitle(laba) {
    if (laba > 100000) return "Juragan Pasar";
    if (laba > 50000) return "Pedagang Ahli";
    if (laba > 15000) return "Kasir Junior";
    return "Kasir Magang";
}

function renderUserList() {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    if (users.length === 0) {
        list.innerHTML = '<p style="font-size:0.75rem; color:var(--color-slate-500); text-align:center; font-style:italic;">Belum ada data pemain. Silakan buat baru.</p>';
        return;
    }
    users.forEach(u => {
        const btn = document.createElement('button');
        btn.className = 'user-btn';
        btn.innerHTML = `
            <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${u.name}</div>
                <div class="user-meta">${u.kelas} | Rp ${u.money.toLocaleString('id-ID')}</div>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;
        btn.onclick = () => login(u.id);
        list.appendChild(btn);
    });
}

function createUser() {
    const name = document.getElementById('new-username').value.trim();
    const gender = document.getElementById('new-gender').value;
    const kelas = document.getElementById('new-class').value.trim();
    if (!name || !kelas) return showMsg('Error', 'Nama dan Kelas harus diisi!');

    const newUser = {
        id: Date.now().toString(), name, gender, kelas,
        money: 0, revenue: 0, cost: 0, maxLevel: 0,
        badges: [], history: [], createdAt: new Date().toISOString()
    };
    users.push(newUser); saveData();
    document.getElementById('new-username').value = '';
    document.getElementById('new-class').value = '';
    login(newUser.id);
}

function login(id) {
    currentUser = users.find(u => u.id === id);
    if (currentUser) {
        requestFullScreen(); // Memaksa browser Full Screen saat profil diklik
        switchScreen('screen-lobby');
    }
}

function logout() { 
    currentUser = null; 
    renderUserList(); 
    
    // ==========================================
    // --- TAMBAHAN: SAPU BERSIH OVERLAY & MODAL ---
    // ==========================================
    
    // 1. Matikan status tutorial dan sembunyikan overlay-nya
    isTutorialActive = false;
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) {
        tutorialOverlay.classList.add('hidden');
        tutorialOverlay.style.pointerEvents = "none";
    }
    
    // 2. Sembunyikan semua pop-up (modal) lain yang mungkin sedang terbuka saat ESC ditekan
    const receiptModal = document.getElementById('receipt-modal');
    if (receiptModal) receiptModal.style.display = "none";
    
    const quizModal = document.getElementById('quiz-modal');
    if (quizModal) quizModal.classList.add('hidden');
    
    const msgModal = document.getElementById('modal-msg');
    if (msgModal) msgModal.classList.add('hidden');

    // ==========================================
    
    exitFullScreen(); // Mengembalikan layar browser ke normal
    switchScreen('screen-login'); // Pindah ke halaman login
}
function renderLobby() {
    document.getElementById('lobby-name').innerText = currentUser.name;
    document.getElementById('lobby-gender').innerText = currentUser.gender;
    document.getElementById('lobby-class').innerText = currentUser.kelas;
    const title = getTitle(currentUser.money);
    document.getElementById('lobby-title').innerText = title;
    document.getElementById('lobby-id-name').innerText = currentUser.name;
    document.getElementById('lobby-id-title').innerText = title;
    currentUser.token = `${currentUser.name.substring(0, 3).toUpperCase()}${currentUser.money}-${currentUser.maxLevel}LV`;

    // ========================================================
    // --- GANTI AVATAR & FULL BODY SESUAI GENDER SISWA ---
    // ========================================================
    const avatarMini = document.getElementById('lobby-avatar-mini');
    const characterFull = document.getElementById('lobby-character');

    if (currentUser.gender === "Perempuan") {
        avatarMini.src = "assets/character/avatar-female.svg";
        characterFull.src = "assets/character/character-female.svg";
    } else {
        avatarMini.src = "assets/character/avatar-male.svg";
        characterFull.src = "assets/character/character-male.svg";
    }
}

function renderLevels() {
    const container = document.getElementById('level-grid-container');
    container.innerHTML = '';
    for (let i = 1; i <= 10; i++) { // Render 10 Level Utama
        const isUnlocked = i <= (currentUser.maxLevel + 1);
        const btn = document.createElement('button');
        if (isUnlocked) {
            const hist = currentUser.history.find(h => h.level === i);
            let starsHTML = '';
            if (hist) {
                const stars = hist.errors === 0 ? 3 : (hist.errors <= 2 ? 2 : 1);
                for (let s = 0; s < 3; s++) starsHTML += `<i class="fa-solid fa-star ${s < stars ? 'star-active' : 'star-inactive'}"></i>`;
            } else {
                starsHTML = `<i class="fa-regular fa-star star-inactive"></i><i class="fa-regular fa-star star-inactive"></i><i class="fa-regular fa-star star-inactive"></i>`;
            }
            btn.className = "btn-level-unlocked";
            btn.innerHTML = `<span>${i}</span><div class="level-stars">${starsHTML}</div>`;
            btn.onclick = () => startLevel(i);
        } else {
            btn.className = "btn-level-locked";
            btn.innerHTML = `<span>${i}</span><i class="fa-solid fa-lock"></i>`;
        }
        container.appendChild(btn);
    }
}

function bukaMenuLevel() {
    switchScreen('screen-levels');
    showMsg("🎯 Capaian Pembelajaran", 
        "<ul style='text-align: left; padding-left: 20px; font-size: 0.85rem; line-height: 1.5; color: #334155; margin-top: 10px;'>" +
        "<li>Mengenali, memprediksi dan menggeneralisasi pola dalam bentuk susunan benda dan bilangan.</li>" +
        "<li>Menyatakan suatu situasi ke dalam bentuk aljabar.</li>" +
        "<li>Menggunakan sifat-sifat operasi (komutatif, asosiatif, dan distributif) untuk menghasilkan bentuk aljabar yang ekuivalen.</li>" +
        "</ul>"
    );
}

const LEVEL_OBJECTIVES = {
    1: "Pengenalan Variabel",
    2: "Sifat Komutatif",
    3: "Penjumlahan & Pengurangan Sejenis",
    4: "Pengenalan Koefisien",
    5: "Substitusi Nilai Variabel 1",
    6: "Penyederhanaan Ekspresi Gabungan",
    7: "Substitusi Nilai Variabel 2",
    8: "Evaluasi Persamaan Ekuivalen",
    9: "Makna Koefisien Nol",
    10: "Tantangan Terakhir"
};

// ==========================================
// --- GAMEPLAY CORE (LOGIKA DINAMIS a-q) ---
// ==========================================
function initGameListeners() {
    const formulaInput = document.getElementById("formula-box");
    const paidInput = document.getElementById("paid-box");
    const inputButtons = document.querySelectorAll(".numpad-grid .btn-num, .numpad-grid .btn-op");
    const backspaceBtn = document.querySelector(".btn-backspace");
    const clearBtn = document.querySelector(".btn-clear");
    const calcBtn = document.querySelector(".btn-calc");
    const confirmBtn = document.getElementById("btn-final-checkout");
    const btnCloseModal = document.getElementById("btn-close-modal");

    if (!formulaInput) return;

    formulaInput.onclick = () => {
        if (isTutorialActive) {
            if (tutorialSteps[currentTutorialStep].target !== '#formula-box') return;
            nextTutorialStep();
        }
        setFocus(formulaInput);
    };

    if (paidInput) {
        paidInput.onclick = () => {
            if (isTutorialActive) {
                if (tutorialSteps[currentTutorialStep].target !== '#paid-box') return;
                paidInput.value = "50.000"; // Bantuan auto isi
                paidInput.style.color = "#1a1a1a";
                nextTutorialStep();
            }
            setFocus(paidInput);
        };
    }

    inputButtons.forEach(btn => {
        btn.onclick = () => {
            if (isTutorialActive) {
                if (!btn.matches(tutorialSteps[currentTutorialStep].target)) return;
                nextTutorialStep();
            }
            if (!activeInput) activeInput = formulaInput;
            if (activeInput.id === "paid-box") {
                if (btn.classList.contains('btn-num')) {
                    let currentVal = activeInput.value.replace(/\./g, '');
                    let newVal = currentVal + btn.textContent;
                    activeInput.value = parseInt(newVal, 10).toLocaleString('id-ID');
                }
            } else {
                activeInput.value += btn.textContent;
            }
            activeInput.style.color = "#1a1a1a";
        };
    });

    

    if (backspaceBtn) {
        backspaceBtn.onclick = () => {
            if (isTutorialActive) return;
            
            if (activeInput && activeInput.value.length > 0) {
                if (activeInput.id === "formula-box") {
                    // Menghapus satu suku aljabar, angka, atau tanda operasi di akhir string
                    activeInput.value = activeInput.value.replace(/(\d*[a-q]|[+-]|\d+)$/i, '');
                    
                    // Reset tampilan harga karena rumus telah berubah
                    document.getElementById("harga-display").textContent = "";
                    tagihanTervalidasi = 0;
                    document.getElementById("tray-items").innerHTML = "";
                    
                } else if (activeInput.id === "paid-box") {
                    // Untuk kotak uang, hapus digit terakhir dan format ulang titik ribuannya
                    let currentVal = activeInput.value.replace(/\./g, '');
                    currentVal = currentVal.slice(0, -1);
                    
                    if (currentVal.length > 0) {
                        activeInput.value = parseInt(currentVal, 10).toLocaleString('id-ID');
                    } else {
                        activeInput.value = "";
                    }
                } else {
                    activeInput.value = activeInput.value.slice(0, -1);
                }
            }
        };
    }

    if (clearBtn) {
        clearBtn.onclick = () => {
            if (isTutorialActive) return;
            if (activeInput) {
                activeInput.value = "";
                if (activeInput.id === "formula-box") {
                    document.getElementById("harga-display").textContent = "";
                    tagihanTervalidasi = 0;
                    document.getElementById("tray-items").innerHTML = "";
                } else if (activeInput.id === "paid-box") {
                    // Reset opacity uang pelanggan jika kasir membersihkan kotak "Dibayar"
                    const dompetItems = document.querySelectorAll("#wallet-container-dynamic .img-placeholder");
                    dompetItems.forEach(item => {
                        item.style.opacity = "1";
                    });
                }
            }
        };
    }

    if (calcBtn) {
        calcBtn.onclick = () => {
            if (isTutorialActive) {
                if (tutorialSteps[currentTutorialStep].target !== '.btn-calc') return;
                nextTutorialStep();
            }
            calculateFormula();
        };
    }

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (isTutorialActive) {
                if (tutorialSteps[currentTutorialStep].target !== '#btn-final-checkout') return;
                nextTutorialStep();
            }
            // Jika dalam mode kembalian, tombol centang berfungsi untuk mensubmit uang
            if (kembalianModeActive) {
                validasiUangKembalian();
            } else {
                processCheckout(); // Jika tidak, proses struk biasa
            }
        };
    }

    if (btnCloseModal) btnCloseModal.onclick = finishCustomerOrLevel;
}

function addVariable(varName) {
    if (isTutorialActive) {
        const target = tutorialSteps[currentTutorialStep].target;
        if (!target.includes(varName)) return;
        nextTutorialStep();
    }

    const formulaInput = document.getElementById("formula-box");
    if (!activeInput) activeInput = formulaInput;

    if (activeInput.id === "formula-box") {
        // Hilangkan spasi sementara untuk mempermudah pengecekan logika
        let currentValue = activeInput.value.replace(/\s+/g, '');

        if (currentValue === "") {
            // KONDISI 1: Kotak masih kosong, langsung masukkan variabel (misal: "a")
            activeInput.value = varName;
        } 
        else if (new RegExp(`(\\d*)(${varName})$`).test(currentValue)) {
            // KONDISI 2: Klik variabel yang SAMA berturut-turut.
            // Jika sebelumnya "a", diklik lagi jadi "2a", diklik lagi jadi "3a".
            let match = currentValue.match(new RegExp(`(\\d*)(${varName})$`));
            let currentNum = match[1] === "" ? 1 : parseInt(match[1]);
            let newNum = currentNum + 1;
            activeInput.value = currentValue.replace(new RegExp(`(\\d*)(${varName})$`), newNum + varName);
        } 
        else if (/\d+$/.test(currentValue)) {
            // KONDISI 3: Pemain sudah mengetik angka dari Numpad (misal: "3").
            // Saat klik barang "a", otomatis gabung menjadi "3a".
            activeInput.value = currentValue + varName;
        } 
        else if (/[+\-]$/.test(currentValue)) {
            // KONDISI 4: Diakhiri tanda operasi (misal: "3a+").
            // Saat klik "b", langsung gabung menjadi "3a+b".
            activeInput.value = currentValue + varName;
        } 
        else {
            // KONDISI 5: Variabel berbeda diklik tanpa tanda tambah sebelumnya.
            // Misal kotak berisi "3a", lalu pemain klik "b". Otomatis ditambahkan '+' menjadi "3a+b".
            activeInput.value = currentValue + "+" + varName;
        }

        activeInput.style.color = "#1a1a1a";
    }
}

function tambahUangPelanggan(nominal, element) {
    // Abaikan jika sedang dalam mode tutorial
    if (isTutorialActive) return;

    const paidInput = document.getElementById("paid-box");
    if (!paidInput) return;

    // Ambil nilai yang sudah ada di kotak (jika ada), hapus titik, lalu konversi ke angka
    let currentVal = paidInput.value.replace(/\./g, '');
    currentVal = parseInt(currentVal, 10) || 0;

    // CEK KONDISI UANG SAAT INI
    if (element.style.opacity === "0.2") {
        // KONDISI 1: Uang sudah di dalam mesin (transparan), lalu diklik lagi untuk DITARIK KEMBALI
        element.style.opacity = "1"; // Kembalikan ke warna aslinya
        
        let newVal = currentVal - nominal;
        
        // Jika ditarik semua dan sisa 0, kosongkan kotak
        if (newVal <= 0) {
            paidInput.value = "";
        } else {
            paidInput.value = newVal.toLocaleString('id-ID');
        }
    } else {
        // KONDISI 2: Uang belum di dalam mesin (jelas), lalu diklik untuk DIMASUKKAN
        element.style.opacity = "0.2"; // Buat jadi transparan
        
        let newVal = currentVal + nominal;
        paidInput.value = newVal.toLocaleString('id-ID');
    }

    paidInput.style.color = "#1a1a1a";
    
    // Pindahkan fokus kasir aktif ke kotak "Dibayar"
    setFocus(paidInput);
}

function setFocus(inputElement) {
    const formulaInput = document.getElementById("formula-box");
    const paidInput = document.getElementById("paid-box");
    activeInput = inputElement;
    formulaInput.classList.remove("input-active");
    paidInput.classList.remove("input-active");
    inputElement.classList.add("input-active");
}

function loadCustomer() {
    const customer = levelCustomers[currentCustomerIdx];
    currentLevelParams.order = customer.order || {};
    currentLevelParams.errorCount = 0;
    uangDibayarDetail = customer.uangDibayarDetail;

    const speechBubble = document.querySelector('.speech-bubble');
    if (speechBubble) {
        speechBubble.innerHTML = customer.text;
    }

    const npcImage = document.querySelector('.npc-image');
    if (npcImage && customer.image) npcImage.src = customer.image;

    const formulaInput = document.getElementById("formula-box");
    const paidInput = document.getElementById("paid-box");
    const hargaDisplay = document.getElementById("harga-display");
    const trayItems = document.getElementById("tray-items");

    if (formulaInput) formulaInput.value = "";
    if (paidInput) paidInput.value = "";
    if (hargaDisplay) { hargaDisplay.textContent = ""; hargaDisplay.style.color = "#a5d6a7"; }
    if (trayItems) trayItems.innerHTML = "";

    // Render Dompet (Memakai Folder assets/rupiah)
    const walletContainer = document.getElementById("wallet-container-dynamic");
    if (walletContainer) {
        walletContainer.innerHTML = "";
        const daftarPecahan = Object.keys(uangDibayarDetail).map(Number).sort((a, b) => b - a);

        daftarPecahan.forEach(pecahan => {
            let jumlahLembar = uangDibayarDetail[pecahan];
            for (let i = 0; i < jumlahLembar; i++) {
                let imgSrc = `assets/rupiah/rp${pecahan}.png`;
                let fallbackImg = `https://placehold.co/200x60/c8e6c9/2e7d32?text=Rp+${pecahan.toLocaleString('id-ID')}`;
                let randomRotate = (Math.random() * 6 - 3).toFixed(1);
                walletContainer.innerHTML += `
                    <div class="img-placeholder money-5k" 
                         style="transform: rotate(${randomRotate}deg); margin-bottom: -45px; background: transparent; border: none; cursor: pointer; transition: opacity 0.2s;" 
                         onclick="tambahUangPelanggan(${pecahan}, this)">
                        <img src="${imgSrc}" class="money" onerror="this.src='${fallbackImg}'" alt="Uang Rp${pecahan}">
                    </div>
                `;
            }
        });

        kembalianModeActive = false;
        document.getElementById("numpad-container").classList.remove("hidden");
        document.getElementById("laci-kasir").classList.add("hidden");
        document.querySelector(".tray-title-label").innerText = "Pesanan";

        tagihanTervalidasi = 0;
        targetKembalian = 0;
        arrayUangKembalian = [];

        if (formulaInput) setFocus(formulaInput);
    }

    
}

function startLevel(lvl) {
    if (!LEVEL_DATA[lvl]) return showMsg("Level Terkunci", "Level sedang dikembangkan.");
    
    currentLevelIdx = lvl;
    levelCustomers = LEVEL_DATA[lvl];
    currentCustomerIdx = 0;
    currentQuizCorrect = 0;
    levelAccumulation = { revenue: 0, cost: 0, profit: 0, errors: 0 };
    currentLevelParams.startTime = Date.now();
    
    loadCustomer();
    switchScreen('screen-game');

    // Tampilkan pop-up target/misi spesifik per level
    const misiLevel = LEVEL_OBJECTIVES[lvl];
    showMsg(`🚩 Tujuan Level ${lvl}`, 
        `<strong style="color: #2563eb; font-size: 1.1rem;">${misiLevel}</strong><br><br>Selesaikan pesanan pelanggan dengan teliti!`, 
        () => {
            // Callback: Pemicu Tutorial Fase 1 berjalan SETELAH pemain menekan "OK" pada pop-up Tujuan (khusus Level 1)
            if (lvl === 1) {
                setTimeout(() => triggerTutorialPhase(1), 300);
            }
        }
    );
}

// LOGIKA KALKULATOR ALJABAR SUPER (Deteksi a sampai q)
function calculateFormula() {
    const formulaInput = document.getElementById("formula-box");
    if (activeInput !== formulaInput) return;

    let rumusBersih = formulaInput.value.replace(/\s+/g, '').toLowerCase();
    let userTerms = rumusBersih.split('+');

    let isRumusBenar = true;
    let expectedTermCount = 0;
    let calculatedTagihan = 0;
    let calculatedCost = 0;

    // Loop semua 17 barang dari ITEM_DB
    for (let key in ITEM_DB) {
        let qty = currentLevelParams.order[key] || 0;

        if (qty > 0) {
            expectedTermCount++;
            let term1 = `${qty}${key}`;
            let term2 = (qty === 1) ? `${key}` : term1; // Jika 1, bisa 'a' saja

            // Cek apakah pemain memasukkan potongan ini
            if (!userTerms.includes(term1) && !userTerms.includes(term2)) {
                isRumusBenar = false;
            } else {
                calculatedTagihan += qty * ITEM_DB[key].price;
                calculatedCost += qty * ITEM_DB[key].cost;
            }
        }
    }

    // Bersihkan dari variabel berawalan 0 jika ada (misal pemain ngetik 0b, anggap diabaikan)
    let strictUserTerms = userTerms.filter(t => !t.startsWith('0'));

    if (isRumusBenar && strictUserTerms.length === expectedTermCount) {
        tagihanTervalidasi = calculatedTagihan;
        currentLevelParams.totalCost = calculatedCost;

        const priceDisplay = document.getElementById("harga-display");
        priceDisplay.textContent = "Rp " + tagihanTervalidasi.toLocaleString('id-ID');
        priceDisplay.style.color = "#a5d6a7";

        munculkanKueDiNampan();
        setFocus(document.getElementById("paid-box"));
    } else {
        currentLevelParams.errorCount++;
        const priceDisplay = document.getElementById("harga-display");
        priceDisplay.textContent = "Rumus Salah!";
        priceDisplay.style.color = "#ef9a9a";
        tagihanTervalidasi = 0;
        document.getElementById("tray-items").innerHTML = "";

        const panel = document.querySelector('.green-indicator-screen');
        if (panel) {
            panel.classList.add('error-flash');
            setTimeout(() => panel.classList.remove('error-flash'), 300);
        }
    }
}

function munculkanKueDiNampan() {
    const tray = document.getElementById("tray-items");
    tray.innerHTML = ""; 
    
    // Pastikan nampan kembali ke layout normal (menyamping dari kiri ke kanan)
    tray.style.flexDirection = "row";
    tray.style.flexWrap = "wrap";
    tray.style.alignItems = "flex-end";
    tray.style.paddingTop = "0";

    // Loop dinamis berdasarkan order
    let delayCounter = 0;
    for (let key in currentLevelParams.order) {
        let qty = currentLevelParams.order[key];
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

function tentukanPecahanUang(uangDetail = uangDibayarDetail) {
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

function processCheckout() {
    if (tagihanTervalidasi === 0) return showMsg("Peringatan", "Hitung total harga aljabar dahulu (=).");

    const paidInput = document.getElementById("paid-box");
    let uangDibayar = parseInt(paidInput.value.replace(/[^0-9]/g, ''));

    const totalUangFisik = Object.keys(uangDibayarDetail).reduce((total, pecahan) => total + (pecahan * uangDibayarDetail[pecahan]), 0);
    const maksimalDompet = totalUangFisik > 0 ? totalUangFisik : 100000;

    if (isNaN(uangDibayar) || uangDibayar < tagihanTervalidasi) {
        currentLevelParams.errorCount++;
        paidInput.value = "Kurang!";
        paidInput.style.color = "red";
        return showMsg("Uang Kurang", "Nominal pembayaran kurang/kosong!");
    }

    if (uangDibayar > maksimalDompet) {
        currentLevelParams.errorCount++;
        paidInput.value = "Tdk Logis!";
        paidInput.style.color = "red";
        return showMsg("Tidak Logis", `Pelanggan maksimal hanya punya Rp ${maksimalDompet.toLocaleString('id-ID')}.`);
    }

    let kembalian = uangDibayar - tagihanTervalidasi;
    let profit = tagihanTervalidasi - currentLevelParams.totalCost;

    // --- RENDER STRUK DINAMIS ---
    let rumusArr = [], prosesArr = [], rincianArr = [];
    for (let key in currentLevelParams.order) {
        let qty = currentLevelParams.order[key];
        if (qty > 0) {
            rumusArr.push(`${qty}${key}`);
            prosesArr.push(`${qty}(Rp ${ITEM_DB[key].price.toLocaleString('id-ID')})`);
            rincianArr.push(`Rp ${(qty * ITEM_DB[key].price).toLocaleString('id-ID')}`);
        }
    }

    document.getElementById("struk-rumus").textContent = rumusArr.join(" + ");
    document.getElementById("struk-proses").textContent = prosesArr.join(" + ");
    document.getElementById("struk-rincian").textContent = rincianArr.join(" + ");
    document.getElementById("struk-total").textContent = "Rp " + tagihanTervalidasi.toLocaleString('id-ID');
    document.getElementById("struk-bayar-total").textContent = "Rp " + uangDibayar.toLocaleString('id-ID');
    document.getElementById("struk-bayar-rincian").textContent = tentukanPecahanUang();
    document.getElementById("struk-kembalian-hitung").textContent = `Rp ${uangDibayar.toLocaleString('id-ID')} - Rp ${tagihanTervalidasi.toLocaleString('id-ID')} = Rp ${kembalian.toLocaleString('id-ID')}`;
    document.getElementById("struk-kembalian-final").textContent = "Rp " + kembalian.toLocaleString('id-ID');

    levelAccumulation.revenue += tagihanTervalidasi;
    levelAccumulation.cost += currentLevelParams.totalCost;
    levelAccumulation.profit += profit;
    levelAccumulation.errors += currentLevelParams.errorCount;

    const btnCloseModal = document.getElementById("btn-close-modal");
    
    if (kembalian > 0) {
        btnCloseModal.textContent = "Berikan Kembalian";
        btnCloseModal.onclick = () => {
            document.getElementById("receipt-modal").style.display = "none";
            mulaiModeKembalian(kembalian);
        };
    } else {
        btnCloseModal.textContent = "Uang Pas (Lanjut)";
        btnCloseModal.onclick = finishCustomerOrLevel;
    }

    document.getElementById("receipt-modal").style.display = "flex";

    if (currentLevelIdx === 1) {
        setTimeout(() => triggerTutorialPhase(5, '.final-receipt-card'), 500);
    }
    
} // Penutup fungsi processCheckout

function mulaiModeKembalian(jumlahKembalian) {
    kembalianModeActive = true;
    targetKembalian = jumlahKembalian;
    arrayUangKembalian = [];

    // Ubah Tampilan Layar Hijau
    const priceDisplay = document.getElementById("harga-display");
    priceDisplay.textContent = "Kembalikan: Rp " + targetKembalian.toLocaleString('id-ID');
    priceDisplay.style.color = "#ffb74d"; // Warna oranye
    
    // Kosongkan kotak rumus untuk menampung hitungan uang yang akan diserahkan
    document.getElementById("formula-box").value = "Rp 0";
    document.getElementById("paid-box").value = "-"; // Nonaktifkan paid-box

    // Ubah UI Kalkulator jadi Laci Kasir
    document.getElementById("numpad-container").classList.add("hidden");
    document.getElementById("laci-kasir").classList.remove("hidden");

    // Ubah UI Nampan
    document.querySelector(".tray-title-label").innerText = "Kembalian";
    document.getElementById("tray-items").innerHTML = ""; // Bersihkan nampan dari kue

    // BARIS YANG BIKIN ERROR SEBELUMNYA DIHAPUS DARI SINI

    // Pemicu Fase 4 (Kini akan berhasil jalan)
    if (currentLevelIdx === 1) {
        setTimeout(() => triggerTutorialPhase(4), 500);
    }
}

function tambahUangKembalian(nominal) {
    arrayUangKembalian.push(nominal);
    renderUangDiNampan();
}

function tarikUangKembalian(index) {
    // Menarik kembali uang dari nampan ke laci (menghapus dari array)
    arrayUangKembalian.splice(index, 1);
    renderUangDiNampan();
}

function renderUangDiNampan() {
    const tray = document.getElementById("tray-items");
    tray.innerHTML = "";
    
    let totalDiberikan = 0;
    
    // Pastikan nampan mengatur uang secara menyamping (dari kiri ke kanan)
    tray.style.flexDirection = "row";
    tray.style.flexWrap = "wrap";
    tray.style.alignItems = "center";
    tray.style.paddingTop = "10px";
    
    arrayUangKembalian.forEach((nominal, index) => {
        totalDiberikan += nominal;
        
        // Tambahkan rotasi acak kecil agar tumpukan uang menyamping terlihat natural
        let randomRotate = (Math.random() * 10 - 5).toFixed(1);
        
        // Tampilkan gambar uang di nampan menggunakan aset rupiah dari folder
        tray.innerHTML += `<img src="assets/rupiah/rp${nominal}.png" class="tray-money-item" style="transform: rotate(${randomRotate}deg);" alt="Rp ${nominal}" onclick="tarikUangKembalian(${index})">`;
    });
    
    // Tampilkan jumlah uang sementara yang disiapkan di nampan ke kotak rumus
    document.getElementById("formula-box").value = "Rp " + totalDiberikan.toLocaleString('id-ID');
}

function validasiUangKembalian() {
    let totalDiberikan = arrayUangKembalian.reduce((a, b) => a + b, 0);
    
    if (totalDiberikan === targetKembalian) {
        showMsg("Tepat Sekali!", "Uang kembalian yang Anda berikan pas. Pelanggan senang!");
        finishCustomerOrLevel();
    } else {
        currentLevelParams.errorCount++; // Dihitung sebagai kesalahan
        showMsg("Oops! Kembalian Salah", `Seharusnya Anda memberikan Rp ${targetKembalian.toLocaleString('id-ID')}, tetapi Anda malah menyiapkan Rp ${totalDiberikan.toLocaleString('id-ID')}. Ayo hitung lagi!`);
    }
}


// ==========================================
// --- MANAJEMEN ANTREAN & KUIS ---
// ==========================================
function finishCustomerOrLevel() {
    document.getElementById("receipt-modal").style.display = "none";

    if (currentCustomerIdx < levelCustomers.length - 1) {
        currentCustomerIdx++;
        isTutorialActive = false;
        loadCustomer();
    } else {
        // Tampilkan Kuis Jika Level Selesai
        if (QUIZ_DB[currentLevelIdx]) {
            currentQuizIndex = 0;
            showQuizQuestion();
        } else {
            completeLevelAndSave();
        }
    }
}

function showQuizQuestion() {
    const quizModal = document.getElementById("quiz-modal");
    const quizData = QUIZ_DB[currentLevelIdx][currentQuizIndex];

    document.getElementById("quiz-level-title").innerText = `Kuis Level ${currentLevelIdx}`;
    document.getElementById("quiz-counter").innerText = `Soal ${currentQuizIndex + 1} / ${QUIZ_DB[currentLevelIdx].length}`;
    document.getElementById("quiz-question").innerHTML = quizData.q;

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";
    document.getElementById("quiz-feedback").classList.add("hidden");
    document.getElementById("btn-next-quiz").classList.add("hidden");

    quizData.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-quiz-option";
        btn.innerText = opt;
        btn.onclick = () => checkQuizAnswer(index, btn, quizData.ans);
        optionsContainer.appendChild(btn);
    });

    quizModal.classList.remove("hidden");

    if (currentLevelIdx === 1 && currentQuizIndex === 0) {
        setTimeout(() => triggerTutorialPhase(5, '.quiz-card'), 500);
    }
}

function checkQuizAnswer(selectedIndex, btnElement, correctIndex) {
    const allButtons = document.querySelectorAll(".btn-quiz-option");
    allButtons.forEach(btn => btn.disabled = true);
    
    const feedbackBox = document.getElementById("quiz-feedback");
    feedbackBox.classList.remove("hidden", "feedback-correct", "feedback-wrong");
    
    if (selectedIndex === correctIndex) {
        currentQuizCorrect++; // TAMBAHAN: Simpan jika benar
        btnElement.classList.add("correct");
        feedbackBox.classList.add("feedback-correct");
        feedbackBox.innerText = "Jawaban Tepat! Luar biasa!";
    } else {
        btnElement.classList.add("wrong");
        allButtons[correctIndex].classList.add("correct");
        feedbackBox.classList.add("feedback-wrong");
        feedbackBox.innerText = "Ups, kurang tepat. Konsep ini sempat dibahas oleh pelanggan tadi.";
    }

    document.getElementById("btn-next-quiz").classList.remove("hidden");
}

function nextQuizQuestion() {
    currentQuizIndex++;
    if (currentQuizIndex < QUIZ_DB[currentLevelIdx].length) {
        showQuizQuestion();
    } else {
        document.getElementById("quiz-modal").classList.add("hidden");
        completeLevelAndSave();
    }
}

function completeLevelAndSave() {
    let duration = Math.floor((Date.now() - currentLevelParams.startTime) / 1000);
    if (currentUser.maxLevel < currentLevelIdx) currentUser.maxLevel = currentLevelIdx;
    
    let existLog = currentUser.history.find(h => h.level === currentLevelIdx);
    if (!existLog) {
        currentUser.history.push({
            level: currentLevelIdx, 
            revenue: levelAccumulation.revenue, 
            cost: levelAccumulation.cost, 
            profit: levelAccumulation.profit,
            duration: duration, 
            errors: levelAccumulation.errors,
            quizCorrect: currentQuizCorrect, // TAMBAHAN: Simpan Jawaban Benar
            quizTotal: QUIZ_DB[currentLevelIdx].length, // TAMBAHAN: Simpan Total Soal
            timestamp: new Date().toISOString()
        });

        currentUser.revenue += levelAccumulation.revenue;
        currentUser.cost += levelAccumulation.cost;
        currentUser.money += levelAccumulation.profit;

        if (levelAccumulation.errors === 0 && !currentUser.badges.includes('si_teliti')) {
            currentUser.badges.push('si_teliti');
        }
    }
    saveData();
    switchScreen('screen-levels');
}

// ==========================================
// --- MENU BUKU KAS & PRESTASI (Bawahnya sama seperti sebelumnya) ---
// ==========================================
function openBukuKas() {
    switchScreen('screen-bukukas');
    document.getElementById('bk-kotor').innerText = "Rp " + currentUser.revenue.toLocaleString('id-ID');
    document.getElementById('bk-modal').innerText = "Rp " + currentUser.cost.toLocaleString('id-ID');
    document.getElementById('bk-bersih').innerText = "Rp " + currentUser.money.toLocaleString('id-ID');

    let totalLevels = currentUser.history.length;
    let zeroErrors = currentUser.history.filter(h => h.errors === 0).length;
    let accuracy = totalLevels === 0 ? 0 : Math.round((zeroErrors / totalLevels) * 100);

    document.getElementById('bk-akurasi').innerText = accuracy + "%";
    document.getElementById('bk-akurasi-bar').style.width = accuracy + "%";

    const histList = document.getElementById('bk-history-list');
    histList.innerHTML = '';
    if (totalLevels === 0) {
        histList.innerHTML = '<div style="text-align:center; color:var(--color-slate-400); font-style:italic; padding:1rem;">Belum ada riwayat permainan.</div>';
    } else {
        currentUser.history.forEach(h => {
            let d = new Date(h.timestamp);
            histList.innerHTML += `
                <div class="history-item">
                    <div class="history-header">
                        <span>Level ${h.level}</span>
                        <span>${d.toLocaleDateString('id-ID')}</span>
                    </div>
                    <div class="history-stats">
                        <span><i class="fa-regular fa-clock"></i> ${h.duration}s</span>
                        <span><i class="fa-solid fa-triangle-exclamation ${h.errors > 0 ? 'text-error' : 'text-success'}"></i> ${h.errors} Salah</span>
                        <span class="text-success">+Rp ${h.profit.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            `;
        });
    }

    const ctx = document.getElementById('financeChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    let labels = currentUser.history.map(h => `Lvl ${h.level}`);
    let dataProfit = currentUser.history.map(h => h.profit);
    if (labels.length === 0) { labels = ['-']; dataProfit = [0]; }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Laba (Rp)', data: dataProfit, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 3, pointBackgroundColor: '#1e3a8a', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });
}

function openPrestasi() {
    switchScreen('screen-prestasi');
    const badgeContainer = document.getElementById('badges-container');
    badgeContainer.innerHTML = '';
    BADGES_DB.forEach(b => {
        const hasBadge = currentUser.badges.includes(b.id);
        badgeContainer.innerHTML += `
            <div class="badge-card ${hasBadge ? 'badge-unlocked' : 'badge-locked'}">
                <div class="badge-icon-wrapper"><i class="fa-solid badge-icon ${b.icon} ${hasBadge ? b.colorClass : 'icon-disabled'}"></i></div>
                <h4>${b.name}</h4>
            </div>
        `;
    });

    document.getElementById('token-display').innerText = currentUser.token;
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    let sortedUsers = [...users].sort((a, b) => b.money - a.money);
    sortedUsers.forEach((u, idx) => {
        let rankIcon = idx === 0 ? '<i class="fa-solid fa-trophy rank-1"></i>' : (idx === 1 ? '<i class="fa-solid fa-medal rank-2"></i>' : (idx === 2 ? '<i class="fa-solid fa-medal rank-3"></i>' : `${idx + 1}`));
        let isMeClass = u.id === currentUser.id ? 'table-row-me' : '';
        tbody.innerHTML += `
            <tr class="table-row ${isMeClass}">
                <td>${rankIcon}</td>
                <td><span class="rank-name">${u.name}</span><span class="rank-title">${getTitle(u.money)}</span></td>
                <td class="text-right font-mono">Rp ${u.money.toLocaleString('id-ID')}</td>
            </tr>
        `;
    });
}
function copyToken() { navigator.clipboard.writeText(currentUser.token).then(() => showMsg('Berhasil', 'Disalin!')); }

// ==========================================
// --- FASILITATOR ---
// ==========================================
function showFasilitatorLogin() {
    document.getElementById('pin-input').value = '';
    document.getElementById('modal-pin').classList.remove('hidden');
}
function checkPIN() {
    if (document.getElementById('pin-input').value === '1234') { closeModal('modal-pin'); openFasilitator(); }
    else { showMsg('Akses Ditolak', 'PIN salah.'); }
}
function openFasilitator() {
    switchScreen('screen-fasilitator');
    const tbody = document.getElementById('fasil-table-body');
    const ewsList = document.getElementById('fasil-ews-list');
    tbody.innerHTML = ''; ewsList.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Belum ada data.</td></tr>';
    } else {
        users.forEach(u => {
            let totalLvl = u.history.length;
            let acc = totalLvl === 0 ? '-' : Math.round((u.history.filter(h => h.errors === 0).length / totalLvl) * 100) + '%';
            
            // --- KALKULASI DATA KUIS ---
            let totalQuizCorrect = u.history.reduce((sum, h) => sum + (h.quizCorrect || 0), 0);
            let totalQuizCount = u.history.reduce((sum, h) => sum + (h.quizTotal || 0), 0);
            let quizStr = totalQuizCount > 0 ? `${totalQuizCorrect}/${totalQuizCount}` : '-';

            tbody.innerHTML += `
                <tr class="fasil-tr">
                    <td class="fasil-td">${u.name}</td><td class="fasil-td">${u.kelas}</td>
                    <td class="fasil-td text-center">Lvl ${u.maxLevel}</td>
                    <td class="fasil-td text-right">${u.money.toLocaleString('id-ID')}</td>
                    <td class="fasil-td text-center">${acc}</td>
                    <td class="fasil-td text-center font-bold" style="color:#1976d2;">${quizStr}</td> <td class="fasil-td text-center"><button onclick="deleteUser('${u.id}')" class="btn-delete-user"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
        });
    }
}
function exportCSV() { /* Sama seperti sebelumnya */ }
function deleteUser(id) { if (confirm("Hapus?")) { users = users.filter(u => u.id !== id); saveData(); openFasilitator(); } }
function resetAllData() { if (confirm("Hapus Semua?")) { users = []; localStorage.removeItem('algebraMart_users'); openFasilitator(); } }
// ==========================================
// --- SISTEM TUTORIAL PBL KHUSUS LEVEL 1 ---
// ==========================================
let currentTutorialStep = 0; 
let isTutorialActive = false; 

const PBL_STEPS = {
    1: { target: '.speech-bubble', title: 'Identifikasi Masalah', msg: 'Halo Kasir! Perhatikan baik-baik pesanan pelanggan. Apa saja barang yang mereka beli dan berapa jumlahnya?', nextPhase: 2 },
    2: { target: '.wooden-shelf', title: 'Identifikasi Informasi', msg: 'Kumpulkan informasinya! Cek rak untuk mengetahui variabel setiap barang dan perhatikan uang yang dibawa pelanggan. Pastikan kamu paham data yang tersedia sebelum mulai menghitung.', nextPhase: 3 },
    3: { target: '.cash-register', title: 'Selidiki dan susun rumusnya', msg: 'Mari selidiki rumusnya! Susun model aljabar dari pesanan tadi menggunakan tombol angka dan klik barang di rak. Tekan "=" untuk memeriksa apakah rumusmu sudah tepat.', nextPhase: null },
    4: { target: '#laci-kasir', title: 'Berikan kembalian', msg: 'Sajikan solusimu! Selesaikan transaksi dengan mengalkulasi kembalian pelanggan dan berikan pecahan uang fisik yang akurat dari laci kasir.', nextPhase: null },
    5: { target: '.final-receipt-card', title: 'Evaluasi', msg: 'Evaluasi hasil kerjamu! Periksa rincian rumus pada struk ini, lalu buktikan pemahamanmu dengan menjawab kuis evaluasi. Cek juga Rapor Performa untuk melihat kinerjamu!', nextPhase: null }
};

function triggerTutorialPhase(phaseId, dynamicTarget = null) {
    if (currentLevelIdx !== 1) return; // Selalu muncul di Level 1, tidak peduli sudah pernah tamat atau belum

    const step = PBL_STEPS[phaseId];
    if (!step) return;

    const overlay = document.getElementById('tutorial-overlay');
    const highlight = document.getElementById('tutorial-highlight');
    const tooltip = document.getElementById('tutorial-tooltip');
    
    let targetSelector = dynamicTarget || step.target;
    const targetEl = document.querySelector(targetSelector);

    // Jika elemen target belum dirender (seperti laci kasir/kuis), tunggu sejenak lalu coba lagi
    if (!targetEl || targetEl.offsetParent === null) {
        setTimeout(() => triggerTutorialPhase(phaseId, dynamicTarget), 200);
        return;
    }

    // Tampilkan overlay dan KUNCI layar agar pemain tidak bisa mengklik elemen di belakangnya
    overlay.classList.remove('hidden');
    overlay.style.pointerEvents = "auto";

    // Desain teks Pop-up dengan judul fase
    document.getElementById('tutorial-text').innerHTML = `<strong style="color: #2563eb; font-size: 1rem;">${step.title}</strong><br><br>${step.msg}`;

    // Sorotan elemen (Highlight)
    const rect = targetEl.getBoundingClientRect();
    highlight.style.top = `${rect.top - 4}px`; 
    highlight.style.left = `${rect.left - 4}px`;
    highlight.style.width = `${rect.width + 8}px`; 
    highlight.style.height = `${rect.height + 8}px`;

    // Posisi Pop-up (Tooltip)
    let tooltipTop = rect.bottom + 15;
    let tooltipLeft = rect.left + (rect.width / 2) - 150;
    if (tooltipTop > window.innerHeight - 120) tooltipTop = rect.top - 120;
    if (tooltipLeft < 10) tooltipLeft = 10;

    tooltip.style.top = `${tooltipTop}px`; 
    tooltip.style.left = `${tooltipLeft}px`;

    const btn = document.getElementById('tutorial-btn');
    
    // Ubah teks tombol: jika masih ada kelanjutannya bertuliskan "Lanjut", jika selesai bertuliskan "Paham!"
    btn.innerText = step.nextPhase ? "Lanjut" : "Paham!";
    btn.style.display = 'block';
    
    // Hilang HANYA jika ditekan tombolnya
    btn.onclick = () => {
        overlay.classList.add('hidden');
        overlay.style.pointerEvents = "none"; // Buka kembali kunci layar untuk bermain
        
        // Jika ada fase berikutnya yang berurutan (Fase 1 -> 2 -> 3), panggil langsung
        if (step.nextPhase) {
            setTimeout(() => triggerTutorialPhase(step.nextPhase), 300);
        }
    };
}

function closeTutorialPhase(phaseId) {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    
    // Transisi berurutan otomatis untuk Fase 1 -> Fase 2 -> Fase 3 di awal permainan
    if (phaseId === 1) {
        setTimeout(() => triggerTutorialPhase(2), 300);
    } else if (phaseId === 2) {
        setTimeout(() => triggerTutorialPhase(3), 300);
    }
}
window.onload = () => { renderUserList(); initGameListeners(); }

// ==========================================
// --- SINKRONISASI FULL SCREEN (TOMBOL ESC / SILANG) ---
// ==========================================
function handleFullscreenChange() {
    // Mengecek apakah browser sudah TIDAK dalam mode fullscreen lagi
    const isFullscreenNow = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;

    if (!isFullscreenNow) {
        // Jika layar kembali normal DAN kebetulan masih ada user yang login (berada di lobi/game)
        if (currentUser !== null) {
            // Paksa keluar ke menu login
            logout(); 
        }
    }
}

// Pasang pendeteksi untuk semua jenis browser
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari/Chrome lama
document.addEventListener('mozfullscreenchange', handleFullscreenChange);    // Firefox
document.addEventListener('MSFullscreenChange', handleFullscreenChange);     // IE/Edge