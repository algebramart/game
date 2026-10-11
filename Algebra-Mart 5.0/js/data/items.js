// ==========================================
// data/items.js — Database Barang & Lencana
// ==========================================

/** @type {Object.<string, {name: string, price: number, cost: number, img: string}>} */
export const ITEM_DB = {
    'a': { name: 'Apel',         price: 2000,  cost: 1000,  img: 'assets/barangbelanja/apel.png' },
    'b': { name: 'Beras',        price: 15000, cost: 12000, img: 'assets/barangbelanja/beras.png' },
    'c': { name: 'Buku',         price: 5000,  cost: 3000,  img: 'assets/barangbelanja/buku.png' },
    'd': { name: 'Dodol Nanas',  price: 3000,  cost: 1500,  img: 'assets/barangbelanja/dodolnanas.png' },
    'e': { name: 'Gandus',       price: 1500,  cost: 800,   img: 'assets/barangbelanja/gandus.png' },
    'f': { name: 'Gula',         price: 12000, cost: 10000, img: 'assets/barangbelanja/gula.png' },
    'g': { name: 'Jeruk',        price: 2500,  cost: 1500,  img: 'assets/barangbelanja/jeruk.png' },
    'h': { name: 'Kopi AAA',     price: 4000,  cost: 2500,  img: 'assets/barangbelanja/kopiaaa.png' },
    'i': { name: 'Minyak Goreng',price: 14000, cost: 12000, img: 'assets/barangbelanja/minyakgoreng.png' },
    'j': { name: 'Padamaran',    price: 2000,  cost: 1000,  img: 'assets/barangbelanja/padamaran.png' },
    'k': { name: 'Pena',         price: 3000,  cost: 1500,  img: 'assets/barangbelanja/pena.png' },
    'l': { name: 'Roti',         price: 6000,  cost: 4000,  img: 'assets/barangbelanja/roti.png' },
    'm': { name: 'Sabun',        price: 4000,  cost: 2500,  img: 'assets/barangbelanja/sabun.png' },
    'n': { name: 'Telur',        price: 2000,  cost: 1200,  img: 'assets/barangbelanja/telur.png' },
    'o': { name: 'Tempoyak',     price: 15000, cost: 10000, img: 'assets/barangbelanja/tempoyak.png' },
    'p': { name: 'Tepung',       price: 8000,  cost: 6000,  img: 'assets/barangbelanja/tepung.png' },
    'q': { name: 'Terong',       price: 3000,  cost: 1500,  img: 'assets/barangbelanja/terong.png' }
};

/** 
 * @type {Array<{id: string, name: string, icon: string, colorClass: string, category: string, desc: string}>} 
 */
export const BADGES_DB = [
    // --- Kategori Akurasi & Matematika ---
    { id: 'si_teliti',          name: 'Si Teliti',          icon: 'fa-crosshairs',           colorClass: 'icon-blue',    category: 'Akurasi & Matematika', desc: 'Menyelesaikan satu level tanpa pernah salah mengetik rumus aljabar.' },
    { id: 'master_variabel',    name: 'Master Variabel',    icon: 'fa-cubes',                colorClass: 'icon-indigo',  category: 'Akurasi & Matematika', desc: 'Berhasil menuntaskan level yang memuat 3 variabel berbeda.' },
    { id: 'ahli_komutatif',     name: 'Ahli Komutatif',     icon: 'fa-right-left',           colorClass: 'icon-cyan',    category: 'Akurasi & Matematika', desc: 'Membuktikan sifat komutatif pesanan tanpa kesalahan pada Level 2 atau Level 8.' },
    { id: 'pembedah_suku',      name: 'Pembedah Suku',      icon: 'fa-scissors',             colorClass: 'icon-purple',  category: 'Akurasi & Matematika', desc: 'Berhasil menyederhanakan ekspresi gabungan suku sejenis pada Level 3/6.' },
    { id: 'penakluk_nol',       name: 'Penakluk Nol',       icon: 'fa-circle-notch',         colorClass: 'icon-teal',    category: 'Akurasi & Matematika', desc: 'Memahami makna koefisien nol dan melewati pesanan kosong pada Level 9.' },
    { id: 'jenius_aljabar',     name: 'Jenius Aljabar',     icon: 'fa-brain',                colorClass: 'icon-amber',   category: 'Akurasi & Matematika', desc: 'Meraih akurasi rata-rata rumus aljabar 100% minimal setelah 5 level.' },
    { id: 'bintang_tiga',       name: 'Bintang Tiga',       icon: 'fa-star',                 colorClass: 'icon-yellow',  category: 'Akurasi & Matematika', desc: 'Mengumpulkan bintang 3 sempurna pada 5 level berbeda.' },
    { id: 'kolektor_sempurna',  name: 'Kolektor Sempurna',  icon: 'fa-crown',                colorClass: 'icon-gold',    category: 'Akurasi & Matematika', desc: 'Menyelesaikan Level 10 dengan 0 kesalahan.' },

    // --- Kategori Finansial & Kasir ---
    { id: 'si_jujur',           name: 'Si Jujur',           icon: 'fa-hand-holding-heart',   colorClass: 'icon-emerald', category: 'Finansial & Kasir',   desc: 'Memberikan kembalian uang fisik dari laci kasir dengan tepat tanpa salah ambil.' },
    { id: 'saudagar_cilik',     name: 'Saudagar Cilik',     icon: 'fa-coins',                colorClass: 'icon-green',   category: 'Finansial & Kasir',   desc: 'Mengumpulkan total laba bersih di atas Rp 50.000.' },
    { id: 'juragan_pasar',      name: 'Juragan Pasar',      icon: 'fa-shop',                 colorClass: 'icon-blue',    category: 'Finansial & Kasir',   desc: 'Mengumpulkan total laba bersih di atas Rp 150.000.' },
    { id: 'sultan_aljabar',     name: 'Sultan Aljabar',     icon: 'fa-gem',                  colorClass: 'icon-purple',  category: 'Finansial & Kasir',   desc: 'Mengumpulkan total laba bersih di atas Rp 300.000.' },
    { id: 'uang_pas',           name: 'Uang Pas',           icon: 'fa-money-bill-1-wave',    colorClass: 'icon-lime',    category: 'Finansial & Kasir',   desc: 'Berhasil melayani transaksi pesanan uang pas (tanpa kembalian).' },
    { id: 'laci_kilat',         name: 'Laci Kilat',         icon: 'fa-bolt-lightning',       colorClass: 'icon-orange',  category: 'Finansial & Kasir',   desc: 'Menyiapkan uang kembalian pecahan dalam waktu kurang dari 15 detik.' },

    // --- Kategori Karakter & Dimensi Hati ---
    { id: 'dermawan_muda',      name: 'Dermawan Muda',      icon: 'fa-seedling',             colorClass: 'icon-emerald', category: 'Karakter & Dimensi Hati', desc: 'Menyisihkan laba toko untuk total sumbangan sosial minimal Rp 5.000.' },
    { id: 'pahlawan_desa',      name: 'Pahlawan Desa',      icon: 'fa-handshake-angle',      colorClass: 'icon-pink',    category: 'Karakter & Dimensi Hati', desc: 'Akumulasi sumbangan sosial mencapai lebih dari Rp 20.000.' },
    { id: 'reputasi_emas',      name: 'Reputasi Emas',      icon: 'fa-award',                colorClass: 'icon-gold',    category: 'Karakter & Dimensi Hati', desc: 'Meraih status reputasi toko "Pedagang Dermawan".' },

    // --- Kategori Evaluasi & Persistensi ---
    { id: 'skor_kuis_sempurna', name: 'Kuis Sempurna',      icon: 'fa-circle-check',         colorClass: 'icon-teal',    category: 'Evaluasi & Persistensi', desc: 'Menjawab seluruh soal kuis evaluasi level dengan benar (100%).' },
    { id: 'pantang_menyerah',   name: 'Pantang Menyerah',   icon: 'fa-shield-halved',        colorClass: 'icon-red',     category: 'Evaluasi & Persistensi', desc: 'Berhasil menyelesaikan level meski sempat melakukan kesalahan input >= 3 kali.' },
    { id: 'penakluk_tantangan', name: 'Penakluk Tantangan', icon: 'fa-trophy',               colorClass: 'icon-amber',   category: 'Evaluasi & Persistensi', desc: 'Membuka dan menyelesaikan level pada mode Tantangan Sulit.' }
];

