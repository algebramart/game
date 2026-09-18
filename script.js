// ==========================================
// 1. DATA DATABASE GAME (KATALOG & PELANGGAN)
// ==========================================
const katalogBarang = [
    { nama: 'Kue Padamaran', variabel: 'kp', harga_satuan: 2000, kategori: 'camilan' },
    { nama: 'Kopi AAA', variabel: 'ka', harga_satuan: 15000, kategori: 'campuran' },
    { nama: 'Tempoyak', variabel: 'ty', harga_satuan: 25000, kategori: 'pokok' },
    { nama: 'Kue Gandus', variabel: 'kg', harga_satuan: 2000, kategori: 'camilan' },
    { nama: 'Tepung', variabel: 'tp', harga_satuan: 10000, kategori: 'pokok' },
    { nama: 'Gula', variabel: 'gl', harga_satuan: 14000, kategori: 'pokok' },
    { nama: 'Minyak Goreng', variabel: 'mg', harga_satuan: 16000, kategori: 'pokok' },
    { nama: 'Beras', variabel: 'br', harga_satuan: 13000, kategori: 'pokok' },
    { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan' },
    { nama: 'Jeruk', variabel: 'jr', harga_satuan: 3000, kategori: 'camilan' },
    { nama: 'Terong', variabel: 'tr', harga_satuan: 2500, kategori: 'pokok' },
    { nama: 'Telur Ayam', variabel: 'tl', harga_satuan: 2000, kategori: 'pokok' },
    { nama: 'Roti', variabel: 'rt', harga_satuan: 8000, kategori: 'camilan' },
    { nama: 'Sabun', variabel: 'sb', harga_satuan: 4000, kategori: 'campuran' },
    { nama: 'Buku', variabel: 'bk', harga_satuan: 5000, kategori: 'alat_tulis' },
    { nama: 'Pena', variabel: 'pn', harga_satuan: 3000, kategori: 'alat_tulis' }
];

const daftarPelanggan = [
    { tipe: 'Ibu-ibu', deskripsi: 'Ibu Pink', background: '#fd79a8', color: 'white' },
    { tipe: 'Ibu-ibu', deskripsi: 'Ibu Ungu', background: '#a29bfe', color: 'white' },
    { tipe: 'Ibu-ibu', deskripsi: 'Ibu Oranye', background: '#e17055', color: 'white' },
    { tipe: 'Pria', deskripsi: 'Bapak Biru', background: '#0984e3', color: 'white' },
    { tipe: 'Anak SMP', deskripsi: 'Pelajar SMP', background: 'linear-gradient(to bottom, #ecf0f1 50%, #2c3e50 50%)', color: '#333' }
];

const drawerDenominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

// ==========================================
// 2. DATA LEVEL STATIS & KUIS (KERANGKA 10 LEVEL)
// ==========================================
const dataLevelStatis = {
    1: [
        // Pelanggan 1
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Pink', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 3, diskon: 0 },
                { nama: 'Terong', variabel: 'tr', harga_satuan: 2500, kategori: 'pokok', jumlah: 2, diskon: 0 }
            ]
        },
        // Pelanggan 2
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak Biru', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Minyak Goreng', variabel: 'mg', harga_satuan: 16000, kategori: 'pokok', jumlah: 5, diskon: 0 }
            ]
        },
        // Pelanggan 3
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Ungu', gambar: 'assets/customers/pelanggan-3.png' },
            cart: [
                { nama: 'Buku', variabel: 'bk', harga_satuan: 5000, kategori: 'alat_tulis', jumlah: 4, diskon: 0 },
                { nama: 'Pena', variabel: 'pn', harga_satuan: 3000, kategori: 'alat_tulis', jumlah: 1, diskon: 0 }
            ]
        }
    ],
    // Kerangka untuk level selanjutnya biarkan kosong dulu
    2: [
        // Pelanggan 1: Beli 1 Roti (Pola 2^0)
        {
            profil: { tipe: 'Anak SMP', deskripsi: 'Pelajar SMP', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Roti', variabel: 'rt', harga_satuan: 8000, kategori: 'camilan', jumlah: 1, diskon: 0 }
            ]
        },
        // Pelanggan 2: Beli 2 Roti (Pola 2^1)
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Oranye', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Roti', variabel: 'rt', harga_satuan: 8000, kategori: 'camilan', jumlah: 2, diskon: 0 }
            ]
        },
        // Pelanggan 3: Beli 4 Roti (Pola 2^2) dan 1 Minyak Goreng (Distraksi/Tambahan Translasi)
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak Biru', gambar: 'assets/customers/pelanggan-3.png' },
            cart: [
                { nama: 'Roti', variabel: 'rt', harga_satuan: 8000, kategori: 'camilan', jumlah: 4, diskon: 0 },
                { nama: 'Minyak Goreng', variabel: 'mg', harga_satuan: 16000, kategori: 'pokok', jumlah: 1, diskon: 0 }
            ]
        }
    ],
    // Kerangka level selanjutnya
    3: [
        // Pelanggan 1
        {
            profil: { tipe: 'Anak SMP', deskripsi: 'Pelajar', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Gula', variabel: 'gl', harga_satuan: 14000, kategori: 'pokok', jumlah: 4, diskon: 0 },
                { nama: 'Gula', variabel: 'gl', harga_satuan: 14000, kategori: 'pokok', jumlah: 3, diskon: 0 }
            ]
        },
        // Pelanggan 2
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Roti', variabel: 'rt', harga_satuan: 8000, kategori: 'camilan', jumlah: 5, diskon: 0 },
                { nama: 'Sabun', variabel: 'sb', harga_satuan: 4000, kategori: 'campuran', jumlah: 2, diskon: 0 },
                { nama: 'Roti', variabel: 'rt', harga_satuan: 8000, kategori: 'camilan', jumlah: 2, diskon: 0 }
            ]
        },
        // Pelanggan 3
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak', gambar: 'assets/customers/pelanggan-3.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 3, diskon: 0 },
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 2, diskon: 0 }
            ]
        }
    ],
    4: [
        // Pelanggan 1
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 1, diskon: 0, kantong: 1 },
                { nama: 'Jeruk', variabel: 'jr', harga_satuan: 3000, kategori: 'camilan', jumlah: 1, diskon: 0, kantong: 1 },
                { nama: 'Terong', variabel: 'tr', harga_satuan: 2500, kategori: 'pokok', jumlah: 1, diskon: 0, kantong: 0 }
            ]
        },
        // Pelanggan 2
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 1, diskon: 0, kantong: 0 },
                { nama: 'Jeruk', variabel: 'jr', harga_satuan: 3000, kategori: 'camilan', jumlah: 1, diskon: 0, kantong: 2 },
                { nama: 'Terong', variabel: 'tr', harga_satuan: 2500, kategori: 'pokok', jumlah: 1, diskon: 0, kantong: 2 }
            ]
        }
    ],
    5: [
        // Pelanggan 1
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                {
                    nama: 'Paket Sembako',
                    variabel: 'ps',
                    harga_satuan: 42000,
                    kategori: 'paket',
                    jumlah: 3,
                    diskon: 0,
                    isiPaket: [{ nama: 'Beras', jumlah: 2 }, { nama: 'Minyak Goreng', jumlah: 1 }]
                }
            ]
        },
        // Pelanggan 2
        {
            profil: { tipe: 'Anak SMP', deskripsi: 'Pelajar', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                {
                    nama: 'Paket Sarapan',
                    variabel: 'psr',
                    harga_satuan: 54000,
                    kategori: 'paket',
                    jumlah: 2,
                    diskon: 0,
                    isiPaket: [{ nama: 'Roti', jumlah: 3 }, { nama: 'Kopi AAA', jumlah: 2 }]
                }
            ]
        }
    ],
    6: [
        // Pelanggan 1
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Tepung', variabel: 'tp', harga_satuan: 10000, kategori: 'pokok', jumlah: 4, diskon: 1000 }
            ]
        },
        // Pelanggan 2
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Sabun', variabel: 'sb', harga_satuan: 4000, kategori: 'campuran', jumlah: 5, diskon: 500 }
            ]
        }
    ],
    7: [
        // Pelanggan 1: Membeli 9 Tempoyak (Masih dalam batas Domain <= 10)
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Pink', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Tempoyak', variabel: 'ty', harga_satuan: 25000, kategori: 'pokok', jumlah: 9, diskon: 0, isGrosir: true }
            ]
        },
        // Pelanggan 2: Membeli 10 Tempoyak (Tepat di batas maksimal Domain)
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak Biru', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Tempoyak', variabel: 'ty', harga_satuan: 25000, kategori: 'pokok', jumlah: 10, diskon: 0, isGrosir: true }
            ]
        },
        // Pelanggan 3: Membeli 8 Tempoyak (Masih dalam batas Domain <= 10)
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Ungu', gambar: 'assets/customers/pelanggan-3.png' },
            cart: [
                { nama: 'Tempoyak', variabel: 'ty', harga_satuan: 25000, kategori: 'pokok', jumlah: 8, diskon: 0, isGrosir: true }
            ]
        }
    ],
    8: [
        // Pelanggan 1
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Pink', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 5, diskon: 0 }
            ]
        },
        // Pelanggan 2
        {
            profil: { tipe: 'Anak SMP', deskripsi: 'Pelajar SMP', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Buku', variabel: 'bk', harga_satuan: 5000, kategori: 'alat_tulis', jumlah: 3, diskon: 0 },
                { nama: 'Pena', variabel: 'pn', harga_satuan: 3000, kategori: 'alat_tulis', jumlah: 2, diskon: 0 }
            ]
        },
        // Pelanggan 3
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak Biru', gambar: 'assets/customers/pelanggan-3.png' },
            cart: [
                { nama: 'Sabun', variabel: 'sb', harga_satuan: 4000, kategori: 'campuran', jumlah: 4, diskon: 0 }
            ]
        }
    ],
    9: [
        // Pelanggan 1: 3 Apel dan 2 Terong (Persamaan 1: 3a + 2t)
        {
            profil: { tipe: 'Ibu-ibu', deskripsi: 'Ibu Pink', gambar: 'assets/customers/pelanggan-1.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 3, diskon: 0 },
                { nama: 'Terong', variabel: 'tr', harga_satuan: 3000, kategori: 'sayur', jumlah: 2, diskon: 0 }
            ]
        },
        // Pelanggan 2: 4 Apel dan 1 Terong (Persamaan 2: 4a + 1t)
        {
            profil: { tipe: 'Anak SMP', deskripsi: 'Pelajar SMP', gambar: 'assets/customers/pelanggan-2.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 4, diskon: 0 },
                { nama: 'Terong', variabel: 'tr', harga_satuan: 3000, kategori: 'sayur', jumlah: 1, diskon: 0 }
            ]
        },
        // Pelanggan 3: 2 Apel dan 5 Terong (Persamaan 3: 2a + 5t)
        {
            profil: { tipe: 'Pria', deskripsi: 'Bapak Biru', gambar: 'assets/customers/pelanggan-3.png' },
            cart: [
                { nama: 'Apel', variabel: 'ap', harga_satuan: 5000, kategori: 'camilan', jumlah: 2, diskon: 0 },
                { nama: 'Terong', variabel: 'tr', harga_satuan: 3000, kategori: 'sayur', jumlah: 5, diskon: 0 }
            ]
        }
    ],
    10: [
        // Pelanggan 1: Persamaan 1 (2 Buku + 3 Pena = 17.000)
        {
            profil: {
                tipe: 'Ibu-ibu', deskripsi: 'Ibu Ungu', gambar: 'assets/customers/pelanggan-1.png',
                dialog: 'Saya bayar pas Rp 17.000 untuk 2 Buku dan 3 Pena!'
            },
            cart: [
                {
                    nama: 'Paket SPLDV 1', harga_satuan: 17000, jumlah: 1, diskon: 0, isBossBundle: true,
                    items: [
                        { nama: 'Buku', variabel: 'bk' }, { nama: 'Buku', variabel: 'bk' },
                        { nama: 'Pena', variabel: 'pn' }, { nama: 'Pena', variabel: 'pn' }, { nama: 'Pena', variabel: 'pn' }
                    ]
                }
            ]
        },
        // Pelanggan 2: Persamaan 2 (1 Buku + 4 Pena = 16.000)
        {
            profil: {
                tipe: 'Pria', deskripsi: 'Bapak Biru', gambar: 'assets/customers/pelanggan-2.png',
                dialog: 'Saya bayar pas Rp 16.000 untuk 1 Buku dan 4 Pena!'
            },
            cart: [
                {
                    nama: 'Paket SPLDV 2', harga_satuan: 16000, jumlah: 1, diskon: 0, isBossBundle: true,
                    items: [
                        { nama: 'Buku', variabel: 'bk' },
                        { nama: 'Pena', variabel: 'pn' }, { nama: 'Pena', variabel: 'pn' }, { nama: 'Pena', variabel: 'pn' }, { nama: 'Pena', variabel: 'pn' }
                    ]
                }
            ]
        },
        // Pelanggan 3: Eksekusi SPLDV (Pemain mencari harga 1 Buku)
        {
            profil: {
                tipe: 'Anak SMP', deskripsi: 'Pelajar SMP', gambar: 'assets/customers/pelanggan-3.png',
                dialog: 'Berapa harga 1 buku ini, kak?'
            },
            cart: [
                // Harga diset 4000 di memori sistem agar validasi kuis manual pemain (1 x (4000)) terbaca BENAR.
                { nama: 'Buku', variabel: 'bk', harga_satuan: 4000, jumlah: 1, diskon: 0, isBossFinal: true }
            ]
        }
    ]
};

const dataKuisStatis = {
    1: [
        // Soal 1
        {
            question: "Pelanggan meletakkan 3 buah Apel dan 2 buah Terong di atas meja kasir. Jika Apel dilambangkan dengan a dan Terong dilambangkan dengan t, bentuk aljabar dari belanjaan tersebut adalah...",
            options: ["3a x 2t", "5at", "3a + 2t", "3t + 2a"],
            correctIndex: 2 // Opsi C
        },
        // Soal 2
        {
            question: "Seorang pelanggan membeli 5 botol Minyak Goreng. Bentuk aljabar yang paling tepat untuk menyatakan situasi belanjaan pelanggan tersebut (jika minyak goreng = m) adalah...",
            options: ["5 + m", "5m", "m^5", "5 / m"],
            correctIndex: 1 // Opsi B
        }
    ],
    2: [
        // Soal 3
        {
            question: "Pelanggan pertama mengeluarkan 2 Roti (2r) lalu 3 Kopi (3k). Pelanggan kedua mengeluarkan 3 Kopi (3k) lalu 2 Roti (2r). Apakah total harga untuk pelanggan pertama dan pelanggan kedua itu sama?",
            options: ["Ya, sama (karena sifat komutatif)", "Ya, sama (karena sifat asosiatif)", "Tidak sama, karena urutan barangnya berbeda", "Tidak bisa dihitung"],
            correctIndex: 0 // Opsi A
        },
        // Soal 4
        {
            question: "Bentuk aljabar 4b + 2p (4 Buku dan 2 Pena) menghasilkan nilai total yang ekuivalen (sama) dengan bentuk...",
            options: ["6bp", "4p + 2b", "2p + 4b", "2(b + p)"],
            correctIndex: 2 // Opsi C
        }
    ],
    3: [
        // Soal 5
        {
            question: "Kasir menghitung 4 bungkus Gula (4g), kemudian menyisihkannya. Tak lama, pelanggan menyodorkan lagi 3 bungkus Gula (3g). Bentuk aljabar paling sederhana dari total Gula yang dihitung kasir adalah...",
            options: ["4g + 3g", "7g", "12g", "7g²"],
            correctIndex: 1 // Opsi B
        },
        // Soal 6
        {
            question: "Di meja terdapat 5 Telur (5t) dan 2 Sabun (2s). Karena uangnya tidak cukup, pelanggan mengembalikan 2 Telur (2t) ke rak. Bentuk ekuivalen dari sisa belanjaan pelanggan adalah...",
            options: ["3t + 2s", "7t + 2s", "5t", "3t - 2s"],
            correctIndex: 0 // Opsi A
        }
    ],
    4: [
        // Soal 7
        {
            question: "Toko menjual \"Paket Sembako\" yang setiap paketnya berisi 2 Beras dan 1 Minyak Goreng (2b + 1m). Jika seorang pelanggan membeli 3 paket sekaligus, operasi aljabar yang digunakan kasir untuk menghitung total barang adalah...",
            options: ["3 + (2b + 1m)", "3 x (2b x 1m)", "3(2b + 1m)", "3b + 2m"],
            correctIndex: 2 // Opsi C
        },
        // Soal 8
        {
            question: "Bentuk dari 3(2b + 1m) pada soal sebelumnya sama dengan ...",
            options: ["5b + 4m", "6b + 3m", "6b + 1m", "2b + 3m"],
            correctIndex: 1 // Opsi B
        }
    ],
    5: [
        // Soal 9
        {
            question: "Pelanggan memborong 4 bungkus Tepung (4t). Kasir memberitahu bahwa setiap 1 bungkus tepung mendapat potongan harga Rp1.000, sehingga di mesin kasir tertulis 4(t - 1000). Bentuk aljabar yang ekuivalen dengan tulisan tersebut adalah...",
            options: ["4t - 1000", "4t - 4000", "t - 4000", "4t + 4000"],
            correctIndex: 1 // Opsi B
        },
        // Soal 10
        {
            question: "Bentuk aljabar 5(2a - 3b) akan menghasilkan bentuk yang sama dengan ...",
            options: ["10a - 15b", "10a - 3b", "7a - 8b", "10a + 15b"],
            correctIndex: 0 // Opsi A
        }
    ],
    6: [
        // Soal 11
        {
            question: "Di layar mesin kasir tercatat total barang 6r + 9s (6 Roti dan 9 Sabun). Kasir menyadari bahwa barang tersebut bisa dihitung sebagai 3 paket belanja. Bentuk aljabar pemfaktoran yang tepat (ekuivalen) untuk 6r + 9s adalah...",
            options: ["2(3r + 4s)", "3(2r + 3s)", "6(r + 3s)", "3(3r + 6s)"],
            correctIndex: 1 // Opsi B
        },
        // Soal 12
        {
            question: "Manakah dari bentuk aljabar berikut yang TIDAK sama dengan 8a + 4b?",
            options: ["4(2a + b)", "2(4a + 2b)", "4a + 4a + 4b", "4(2a + 4b)"],
            correctIndex: 3 // Opsi D
        }
    ],
    7: [
        // Soal 13
        {
            question: "Pelanggan pertama membawa 1 paket berisi (2b + 3p) dan pelanggan kedua membawa 2 paket yang sama, ditulis 2(2b + 3p). Jika belanjaan mereka digabungkan, bentuk aljabar paling sederhana dari total seluruh barang adalah...",
            options: ["6b + 9p", "4b + 6p", "5b + 6p", "6b + 5p"],
            correctIndex: 0 // Opsi A
        },
        // Soal 14
        {
            question: "Untuk mempermudah perhitungan, sebuah ekspresi 5m + 3k + 2m - k di layar kasir dihitung dengan mengelompokkan suku sejenisnya. Bentuk yang sama dengan ekspresi tersebut adalah...",
            options: ["7m + 4k", "7m + 2k", "3m + 4k", "10mk"],
            correctIndex: 1 // Opsi B
        }
    ],
    8: [
        // Soal 15
        {
            question: "Dalam sistem kasir, sebuah 'Paket Kopi' dilambangkan dengan huruf X. Diketahui bahwa isi paket X = 3k + 2g (3 Kopi dan 2 Gula). Jika pelanggan membeli 4X, berapakah total Kopi dan Gula yang dibeli dalam bentuk aljabar sederhana?",
            options: ["12k + 8g", "7k + 6g", "12k + 2g", "4k + 8g"],
            correctIndex: 0 // Opsi A
        },
        // Soal 16
        {
            question: "Sebuah mesin menghitung transaksi dengan rumus 3(a + 2) + 4a. Bentuk yang sederhana dari rumus mesin kasir tersebut adalah...",
            options: ["7a + 2", "7a + 6", "12a + 6", "3a + 6"],
            correctIndex: 1 // Opsi B
        }
    ],
    9: [
        // Soal 17
        {
            question: "Kasir A menghitung belanjaan dengan cara 2(3a + 4b). Kasir B menghitung barang yang sama dengan cara 6a + 8b. Kasir C menghitung dengan cara 2(4b + 3a). Manakah pernyataan yang benar?",
            options: ["Hanya cara Kasir A dan B yang sama nilainya.", "Hanya cara Kasir B dan C yang sama nilainya.", "Ketiga cara tersebut saling sama nilainya (ekuivalen).", "Tidak ada yang sama nilainya."],
            correctIndex: 2 // Opsi C
        },
        // Soal 18
        {
            question: "Di layar kasir tertulis ekspresi panjang: 4(x + 2y) - 2(x - y). Setelah kasir menyederhanakan ekspresi tersebut, bentuk aljabar akhir yang akan dicetak di struk belanja adalah...",
            options: ["2x + 10y", "2x + 6y", "2x + y", "6x + 6y"],
            correctIndex: 0 // Opsi A
        }
    ],
    10: [
        // Soal 19
        {
            question: "Pelanggan membeli 3 paket yang masing-masing berisi 2 Apel dan 1 Jeruk, ditulis 3(2a + j). Kemudian pelanggan itu menambah lagi 1 Apel dan 2 Jeruk, ditulis (a + 2j). Bentuk aljabar paling sederhana dari total seluruh belanjaannya adalah...",
            options: ["7a + 5j", "6a + 5j", "7a + 3j", "3a + 3j"],
            correctIndex: 0 // Opsi A
        },
        // Soal 20
        {
            question: "Di layar kasir, total belanjaan seorang pelanggan adalah 5t + 15g (5 Telur dan 15 Gula). Kasir menyadari bahwa barang tersebut dapat dipisahkan secara rapi ke dalam 5 kantong belanja (paket) yang isinya persis sama. Bentuk aljabar yang menyatakan pengelompokan tersebut adalah...",
            options: ["5(t + 10g)", "5(t + 3g)", "3(5t + 5g)", "5(5t + 15g)"],
            correctIndex: 1 // Opsi B
        }
    ]
};

function generatePayment(cart) {
    let totalBelanja = cart.reduce((sum, item) => sum + ((item.harga_satuan * item.jumlah) - (item.diskon || 0)), 0);

    // =========================================================
    // Modifikasi Konstanta Ongkir/Layanan (Level 4, 5, 8)
    // =========================================================
    if (currentLevel === 4 || currentLevel === 5) {
        totalBelanja += 2000;
    } else if (currentLevel === 8) {
        totalBelanja += 5000;
    }

    // =========================================================
    // Pembayaran untuk nominal di bawah atau sama dengan Rp 100.000
    // =========================================================
    if (totalBelanja <= 10000) return { totalUang: 10000, lembaran: [10000] };
    if (totalBelanja <= 20000) return { totalUang: 20000, lembaran: [20000] };
    if (totalBelanja <= 30000) return { totalUang: 30000, lembaran: [20000, 10000] };
    if (totalBelanja <= 50000) return { totalUang: 50000, lembaran: [50000] };
    if (totalBelanja <= 70000) return { totalUang: 70000, lembaran: [50000, 20000] };
    if (totalBelanja <= 100000) return { totalUang: 100000, lembaran: [100000] };

    // =========================================================
    // PERBAIKAN: Pembayaran Dinamis untuk belanja di atas Rp 100.000 (Level 7)
    // =========================================================
    // Math.ceil membulatkan ke atas (Contoh: 225.000 / 100.000 = 2.25, dibulatkan jadi 3)
    let pecahanRatusanRibu = Math.ceil(totalBelanja / 100000);

    let totalUang = pecahanRatusanRibu * 100000; // Contoh: 3 x 100.000 = 300.000
    let lembaran = [];

    // Memberikan uang pecahan 100.000 sebanyak hasil perhitungan
    for (let i = 0; i < pecahanRatusanRibu; i++) {
        lembaran.push(100000);
    }

    return { totalUang: totalUang, lembaran: lembaran };
}

// ==========================================
// 3. STATE VARIABEL SISTEM
// ==========================================
let tutorialDone = false; // Merekam apakah pemain sudah melihat tutorial
// Mengambil data bintang dari memori browser, atau buat baru jika kosong
let defaultStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
let levelStars = JSON.parse(localStorage.getItem('algebraMartStars')) || defaultStars;
let currentLevel = 1;
let maxCustomers = 3;
let currentCustomerIndex = 0;
let currentProfil = null;
let shoppingCart = [];
let customerPayment = {};
let purchasedHistory = [];
let quizData = [];

let currentItemIndex = 0;
let gamePhase = "scanning";
let currentInput = "";
let algebraParts = [];
let substitutionParts = [];
let grandTotalHarga = 0;
let expectedChange = 0;
let givenChange = [];

let currentQuizIndex = 0;
let quizScore = 0;

// ==========================================
// 4. AMBIL ELEMEN DOM HTML
// ==========================================

const inGameBackBtn = document.getElementById('in-game-back-btn');
const customerPlaceholder = document.querySelector('.customer-placeholder');
const mainMenuUI = document.getElementById('main-menu-ui');
const levelMenuUI = document.getElementById('level-menu-ui');
const gameWrapper = document.getElementById('game-wrapper');

const floatingZone = document.getElementById('floating-zone');
const collectedItemsZone = document.getElementById('collected-items-zone');

const startProjectBtn = document.getElementById('start-project-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const level1Btn = document.getElementById('level-1-btn');
const level2Btn = document.getElementById('level-2-btn');
const level3Btn = document.getElementById('level-3-btn');

const tutorialOverlay = document.getElementById('tutorial-overlay');
const closeTutorialBtn = document.getElementById('close-tutorial-btn');

const mainGameUI = document.getElementById('main-game-ui');
const deskElement = document.querySelector('.desk');

const screenTable = document.getElementById('screen-table');
const screenTotalVal = document.getElementById('screen-total-val');
const screenFormula = document.getElementById('screen-formula');
const screenPayment = document.getElementById('screen-payment');

const inputLine = document.getElementById('screen-input');

// BUG FIX: Hanya pasang listener pada tombol di dalam kotak Kalkulator
const buttons = document.querySelectorAll('#calculator-ui .btn');
const calculatorUI = document.getElementById('calculator-ui');
const drawerUI = document.getElementById('drawer-ui');
const drawerGrid = document.getElementById('drawer-grid');
const finishBtn = document.getElementById('finish-btn');
const receiptModal = document.getElementById('receipt-modal');
const receiptContent = document.getElementById('receipt-content');
const nextCustomerBtn = document.getElementById('next-customer-btn');

const quizUI = document.getElementById('quiz-ui');
const gameOverUI = document.getElementById('game-over-ui');
const quizQuestion = document.getElementById('quiz-question');
const quizOptionsContainer = document.getElementById('quiz-options-container');
const quizFeedback = document.getElementById('quiz-feedback');
const nextQuizBtn = document.getElementById('next-quiz-btn');
const finalScoreText = document.getElementById('final-score');
const restartGameBtn = document.getElementById('restart-game-btn');

// ==========================================
// FUNGSI MODERN ALERT (PENGGANTI ALERT JADUL)
// ==========================================
function showModernAlert(pesan, targetId) {
    // 1. Hapus alert lama jika masih ada di layar
    const existingAlert = document.getElementById('modern-alert-box');
    if (existingAlert) existingAlert.remove();

    // 2. Buat elemen HTML alert baru
    const alertBox = document.createElement('div');
    alertBox.id = 'modern-alert-box';
    alertBox.className = 'modern-alert';
    alertBox.innerText = pesan;

    document.body.appendChild(alertBox);

    // 3. Cari elemen target untuk menentukan posisi akurat
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        // Ambil koordinat elemen target dari layar
        const rect = targetElement.getBoundingClientRect();

        // Posisikan tepat di atas elemen target (di tengah)
        alertBox.style.left = (rect.left + (rect.width / 2)) + 'px';
        alertBox.style.top = (rect.top - alertBox.offsetHeight - 15) + 'px';
    } else {
        // Posisi cadangan jika ID target tidak ditemukan (tengah layar)
        alertBox.style.left = '50%';
        alertBox.style.top = '50%';
    }

    // 4. Jalankan animasi muncul (jeda 10ms agar transisi CSS terbaca)
    setTimeout(() => alertBox.classList.add('show'), 10);

    // 5. Hilangkan otomatis setelah 3 detik
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => alertBox.remove(), 300); // Hapus dari HTML setelah animasi selesai
    }, 3000);
}

// ==========================================
// 5. FUNGSI SETUP PELANGGAN & VISUAL KASIR
// ==========================================
function setupPelangganBaru() {
    const dataPelangganAktif = dataLevelStatis[currentLevel][currentCustomerIndex];

    currentProfil = dataPelangganAktif.profil;
    shoppingCart = dataPelangganAktif.cart;
    customerPayment = generatePayment(shoppingCart);
    purchasedHistory.push(...shoppingCart);

    // Render Gambar Pelanggan
    customerPlaceholder.innerHTML = `<img src="${currentProfil.gambar}" alt="${currentProfil.deskripsi}" class="customer-image">`;

    // =========================================================
    // MODIFIKASI: Render Balon Dialog Jika Ada
    // =========================================================
    if (currentProfil.dialog) {
        const bubble = document.createElement('div');
        bubble.className = 'customer-bubble';
        bubble.innerText = currentProfil.dialog;
        customerPlaceholder.appendChild(bubble);
    }
    // =========================================================

    customerPlaceholder.style.background = 'transparent';
    customerPlaceholder.style.color = 'transparent';
    customerPlaceholder.style.boxShadow = 'none';
}

function getEmoji(nama) {
    const emojis = {
        'Kue Padamaran': '🧁', 'Kopi AAA': '☕', 'Tempoyak': '🥫', 'Kue Gandus': '🥮', 'Tepung': '🥡',
        'Gula': '🧂', 'Minyak Goreng': '🛢️', 'Beras': '🍚', 'Apel': '🍎', 'Jeruk': '🍊',
        'Terong': '🍆', 'Telur Ayam': '🥚', 'Roti': '🍞', 'Sabun': '🧼', 'Buku': '📘', 'Pena': '🖊️'
    };
    return emojis[nama] || '📦';
}

// Fungsi baru untuk mengambil path gambar barang
function getGambarBarang(nama) {
    const gambar = {
        'Kue Padamaran': 'assets/barangbelanja/padamaran.png',
        'Kopi AAA': 'assets/barangbelanja/kopiaaa.png',
        'Tempoyak': 'assets/barangbelanja/tempoyak.png',
        'Kue Gandus': 'assets/barangbelanja/gandus.png',
        'Tepung': 'assets/barangbelanja/tepung.png',
        'Gula': 'assets/barangbelanja/gula.png',
        'Minyak Goreng': 'assets/barangbelanja/minyakgoreng.png',
        'Beras': 'assets/barangbelanja/beras.png',
        'Apel': 'assets/barangbelanja/apel.png',
        'Jeruk': 'assets/barangbelanja/jeruk.png',
        'Terong': 'assets/barangbelanja/terong.png',
        'Telur Ayam': 'assets/barangbelanja/telur.png',
        'Roti': 'assets/barangbelanja/roti.png',
        'Sabun': 'assets/barangbelanja/sabun.png',
        'Buku': 'assets/barangbelanja/buku.png',
        'Pena': 'assets/barangbelanja/pena.png'
    };
    return gambar[nama] || 'assets/barangbelanja/kardus.png'; // Fallback jika tidak ada
}

// Fungsi baru untuk mengambil path gambar uang Rupiah
function getGambarUang(nominal) {
    return `assets/rupiah/rp${nominal}.png`;
}

function renderItems() {
    floatingZone.innerHTML = "";

    if (currentItemIndex >= shoppingCart.length) {
        floatingZone.innerHTML = "<div class='floating-group' style='color: #2c3e50; font-weight: bold; text-align: center; font-size: 18px; background: rgba(255,255,255,0.8); padding: 15px; border-radius: 10px; border: 3px solid #f1c40f;'>Scan Selesai!<br>Tekan [ = ] untuk Substitusi Rumus.</div>";
        return;
    }

    const barang = shoppingCart[currentItemIndex];
    const floatingGroup = document.createElement('div');
    floatingGroup.className = 'floating-group fade-enter';
    floatingGroup.id = 'current-floating-item';
    const label = document.createElement('div');
    label.className = 'floating-label';

    // =========================================================
    // MODIFIKASI: Sembunyikan Harga di Level 10 (Boss Stage)
    // =========================================================
    if (currentLevel === 10) {
        label.style.backgroundColor = '#c0392b';
        label.style.borderColor = '#e74c3c';
        label.style.color = '#fff';
        if (barang.isBossBundle) {
            // PERBAIKAN: Sembunyikan label ini agar tidak bertumpuk
            // dan tidak mendorong balon dialog pelanggan ke luar layar
            label.style.display = 'none';
        } else if (barang.isBossFinal) {
            label.innerText = `⚔️ Tantangan Akhir: Berapakah Harga 1 ${barang.nama}?`;
        }
    } else if (barang.isPaket) {
        label.style.backgroundColor = '#8e44ad';
        label.style.borderColor = '#732d91';
        label.style.color = '#f1c40f';
        label.innerText = `📦 Barang Paket: 1 ${barang.nama} = Rp ${barang.harga_satuan.toLocaleString('id-ID')}`;
    } else if (barang.isGrosir) {
        label.style.backgroundColor = '#d35400';
        label.style.borderColor = '#e67e22';
        label.style.color = '#fff';
        label.innerHTML = `⚠️ Batas Pembelian Grosir Maks. 10 Item<br>1 ${barang.nama} = Rp ${barang.harga_satuan.toLocaleString('id-ID')}`;
    } else {
        label.innerText = `1 ${barang.nama} = Rp ${barang.harga_satuan.toLocaleString('id-ID')}`;
    }
    floatingGroup.appendChild(label);

    if (barang.diskon && barang.diskon > 0) {
        const diskonLabel = document.createElement('div');
        diskonLabel.className = 'floating-label';
        diskonLabel.style.backgroundColor = '#e74c3c';
        diskonLabel.style.color = 'white';
        diskonLabel.innerText = `Diskon: -Rp ${barang.diskon.toLocaleString('id-ID')}`;
        floatingGroup.appendChild(diskonLabel);
    }

    const itemsRow = document.createElement('div');
    itemsRow.className = 'floating-items-row';

    // =========================================================
    // MODIFIKASI: Render item campuran untuk "Paket Persamaan" Level 10
    // =========================================================
    if (barang.isiPaket) {
        for (let i = 0; i < barang.jumlah; i++) {
            const packageBox = document.createElement('div');
            packageBox.className = 'package-box item-placeholder'; // item-placeholder so it gets selected and moved to bottom

            barang.isiPaket.forEach(subItem => {
                for (let j = 0; j < subItem.jumlah; j++) {
                    const singleItemBox = document.createElement('div');
                    singleItemBox.innerHTML = `
                        <img src="${getGambarBarang(subItem.nama)}" alt="${subItem.nama}" class="item-image" style="width: 40px; height: 40px; object-fit: contain;">
                    `;
                    packageBox.appendChild(singleItemBox);
                }
            });
            itemsRow.appendChild(packageBox);
        }
    } else if (barang.isBossBundle) {
        barang.items.forEach(subItem => {
            const singleItemBox = document.createElement('div');
            singleItemBox.className = 'item-placeholder';
            singleItemBox.innerHTML = `
                <img src="${getGambarBarang(subItem.nama)}" alt="${subItem.nama}" class="item-image">
                <span style="font-size: 16px; margin-top: 5px; font-weight: 900; color: #2c3e50; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;">${subItem.variabel}</span>
            `;
            itemsRow.appendChild(singleItemBox);
        });
    } else {
        // Render barang reguler
        for (let i = 0; i < barang.jumlah; i++) {
            const singleItemBox = document.createElement('div');
            singleItemBox.className = 'item-placeholder';
            singleItemBox.style.position = 'relative';

            let discountHtml = "";
            if (barang.diskon && barang.diskon > 0 && currentLevel === 6) {
                discountHtml = `<div class="discount-tag">Diskon Rp ${barang.diskon.toLocaleString('id-ID')}</div>`;
            }

            singleItemBox.innerHTML = `
                ${discountHtml}
                <img src="${getGambarBarang(barang.nama)}" alt="${barang.nama}" class="item-image">
                <span style="font-size: 16px; margin-top: 5px; font-weight: 900; color: #2c3e50; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;">${barang.variabel}</span>
            `;
            itemsRow.appendChild(singleItemBox);
        }
    }

    floatingGroup.appendChild(itemsRow);
    floatingZone.appendChild(floatingGroup);
}

function renderPayment() {
    const existingPayment = document.getElementById('floating-payment-group');
    if (existingPayment) existingPayment.remove();

    const floatingGroup = document.createElement('div');
    floatingGroup.id = 'floating-payment-group';

    // PERBAIKAN: Tambahkan class 'floating-group' agar bentuk dan posisinya rapi
    floatingGroup.className = 'floating-group fade-enter';

    const label = document.createElement('div');
    label.className = 'floating-label';
    label.innerText = `Pembayaran: Rp ${customerPayment.totalUang.toLocaleString('id-ID')}`;
    floatingGroup.appendChild(label);

    const itemsRow = document.createElement('div');
    itemsRow.className = 'floating-items-row';

    customerPayment.lembaran.forEach(nominal => {
        const moneyBill = document.createElement('img');
        moneyBill.className = nominal <= 500 ? 'floating-coin-img' : 'floating-money-img';
        moneyBill.src = getGambarUang(nominal);
        moneyBill.alt = `Rp ${nominal}`;
        itemsRow.appendChild(moneyBill);
    });

    floatingGroup.appendChild(itemsRow);
    floatingZone.appendChild(floatingGroup);
}

function initCashDrawer() {
    drawerGrid.innerHTML = "";

    drawerDenominations.forEach(nominal => {
        const slot = document.createElement('div');
        slot.className = 'drawer-slot';

        // Menggunakan tag <img> untuk isi laci kasir
        const moneyStack = document.createElement('img');
        moneyStack.className = nominal <= 500 ? 'real-money-coin-img' : 'real-money-stack-img';
        moneyStack.src = getGambarUang(nominal);
        moneyStack.alt = `Rp ${nominal}`;

        moneyStack.addEventListener('click', () => {
            givenChange.push(nominal);
            renderFloatingChange();
        });

        slot.appendChild(moneyStack);
        drawerGrid.appendChild(slot);
    });
}

function renderFloatingChange() {
    let changeGroup = document.getElementById('floating-change-group');

    if (!changeGroup) {
        changeGroup = document.createElement('div');
        changeGroup.id = 'floating-change-group';
        changeGroup.className = 'floating-group fade-enter';
        floatingZone.appendChild(changeGroup);
    } else {
        changeGroup.innerHTML = "";
    }

    const totalGiven = givenChange.reduce((sum, val) => sum + val, 0);

    if (givenChange.length === 0) {
        changeGroup.remove();
        return;
    }

    const label = document.createElement('div');
    label.className = 'floating-label';
    label.style.backgroundColor = '#2980b9';
    label.style.borderColor = '#1f618d';
    label.innerText = `Kembalian: Rp ${totalGiven.toLocaleString('id-ID')}`;
    changeGroup.appendChild(label);

    const itemsRow = document.createElement('div');
    itemsRow.className = 'floating-items-row';

    givenChange.forEach((nominal, index) => {
        // Menggunakan tag <img> untuk kembalian yang melayang
        const moneyItem = document.createElement('img');
        moneyItem.className = nominal <= 500 ? 'floating-coin-img' : 'floating-money-img';
        moneyItem.src = getGambarUang(nominal);
        moneyItem.alt = `Rp ${nominal}`;
        moneyItem.style.cursor = 'pointer';
        moneyItem.title = "Klik untuk menarik uang kembali ke laci";

        moneyItem.addEventListener('click', () => {
            givenChange.splice(index, 1);
            renderFloatingChange();
        });

        itemsRow.appendChild(moneyItem);
    });

    changeGroup.appendChild(itemsRow);
}

// ==========================================
// 6. LOGIKA VALIDASI ALUR KASIR
// ==========================================
function cekHitungan() {
    const barangAktif = shoppingCart[currentItemIndex];
    const diskon = barangAktif.diskon || 0;

    // =========================================================
    // MODIFIKASI LEVEL 10: Validasi bypass untuk Boss Bundle
    // =========================================================
    if (barangAktif.isBossBundle) {
        // Pemain hanya mengetik angka total secara polos (misal: 17000)
        if (currentInput.trim() !== barangAktif.harga_satuan.toString()) {
            showModernAlert("Fokus ke Dialog! Ketik langsung nilai Total Persamaan tanpa menggunakan rumus.", "screen-input");
            currentInput = ""; inputLine.innerText = "0"; return;
        }

        const subtotal = barangAktif.harga_satuan;
        grandTotalHarga += subtotal;
        algebraParts.push(subtotal.toString());

        screenTable.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 2px;">
                <span style="flex: 1.2;">Persamaan SPLDV</span>
                <span style="flex: 2.3; text-align: center;">(Input Manual)</span>
                <span style="flex: 1; text-align: right;">Rp ${subtotal.toLocaleString('id-ID')}</span>
            </div>
        `;
    }
    // =========================================================
    // VALIDASI STANDAR (Level 1-9 & Pelanggan 3 di Level 10)
    // =========================================================
    else {
        if (!currentInput.includes("x") || !currentInput.includes("(") || !currentInput.endsWith(")")) {
            showModernAlert("Format salah! Ketik [Jumlah] x ([Harga Satuan])", "screen-input");
            currentInput = ""; inputLine.innerText = "0"; return;
        }

        const parts = currentInput.split('x');
        const inputJumlah = parseInt(parts[0].trim());
        let dalamKurung = parts[1].replace('(', '').replace(')', '').trim();
        let inputHargaSatuan = 0;
        let inputDiskon = 0;

        if (dalamKurung.includes('-')) {
            const hargaParts = dalamKurung.split('-');
            inputHargaSatuan = parseInt(hargaParts[0].replace(/\./g, '').trim()) || 0;
            inputDiskon = parseInt(hargaParts[1].replace(/\./g, '').trim()) || 0;
        } else {
            inputHargaSatuan = parseInt(dalamKurung.replace(/\./g, '').trim()) || 0;
        }

        if (inputJumlah !== barangAktif.jumlah || inputHargaSatuan !== barangAktif.harga_satuan || inputDiskon !== diskon) {
            let pesan = diskon > 0 ? "Format/hitungan salah! Ketik [Jumlah] x ([Harga Satuan] - [Diskon])" : "Format/hitungan salah! Ketik [Jumlah] x ([Harga Satuan])";
            showModernAlert(pesan, "screen-input");
            currentInput = ""; inputLine.innerText = "0"; return;
        }

        const subtotal = inputJumlah * (inputHargaSatuan - inputDiskon);
        grandTotalHarga += subtotal;

        // --- LEVEL 5 & 6 DISTRIBUTIVE LOGIC ---
        if (currentLevel === 5 && barangAktif.isiPaket) {
            let distParts = barangAktif.isiPaket.map(b => `${inputJumlah * b.jumlah} ${b.nama}`);
            algebraParts.push(distParts.join(" + "));
        } else if (currentLevel === 6 && diskon > 0) {
            let totalDiskon = inputJumlah * diskon;
            algebraParts.push(`${inputJumlah} ${barangAktif.nama} - ${totalDiskon}`);
        } else {
            algebraParts.push(inputJumlah + " " + barangAktif.nama);
        }

        let formatHargaText = diskon > 0
            ? `${inputJumlah} x (Rp ${inputHargaSatuan.toLocaleString('id-ID')} - Rp ${inputDiskon.toLocaleString('id-ID')})`
            : `${inputJumlah} x (Rp ${inputHargaSatuan.toLocaleString('id-ID')})`;

        let uniqueId = `item-row-${currentItemIndex}`;
        let textAwal = `${inputJumlah} ${barangAktif.nama}`;

        if (currentLevel === 5 && barangAktif.isiPaket) {
            let innerText = barangAktif.isiPaket.map(b => `${b.jumlah} ${b.nama}`).join(" + ");
            textAwal = `${inputJumlah}(${innerText})`;
        } else if (currentLevel === 6 && diskon > 0) {
            textAwal = `${inputJumlah}(1 ${barangAktif.nama} - ${diskon})`;
        }

        screenTable.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 2px;">
                <span class="item-name-cell" id="${uniqueId}" style="flex: 1.2; transition: all 0.5s ease;">${textAwal}</span>
                <span style="flex: 2.3; text-align: center;">${formatHargaText}</span>
                <span style="flex: 1; text-align: right;">Rp ${subtotal.toLocaleString('id-ID')}</span>
            </div>
        `;
    }

    // PEMINDAHAN BARANG KE MEJA BAWAH & LANJUT KE ITEM BERIKUTNYA
    let currentAlgebraText = algebraParts.join(" + ");

    // Khusus Level 4, tampilkan tanda kurung asosiatif di cekHitungan juga
    if (currentLevel === 4) {
        let group1 = [];
        let group2 = [];
        let noGroup = [];

        shoppingCart.forEach((item, idx) => {
            if (idx <= currentItemIndex) {
                let text = item.jumlah + " " + item.nama;
                if (item.kantong === 1) group1.push(text);
                else if (item.kantong === 2) group2.push(text);
                else noGroup.push(text);
            }
        });

        let partsFormatted = [];
        if (group1.length > 0) partsFormatted.push("(" + group1.join(" + ") + ")");
        if (group2.length > 0) partsFormatted.push("(" + group2.join(" + ") + ")");
        if (noGroup.length > 0) partsFormatted.push(noGroup.join(" + "));

        currentAlgebraText = partsFormatted.join(" + ");
    }

    screenFormula.innerText = "Rumus = " + currentAlgebraText;

    const activeFloatingGroup = document.getElementById('current-floating-item');
    if (activeFloatingGroup) {
        const physicalItems = activeFloatingGroup.querySelectorAll('.item-placeholder');

        physicalItems.forEach(itemBox => {
            if (currentLevel === 4 && shoppingCart[currentItemIndex].kantong) {
                let kantongId = "kantong-" + shoppingCart[currentItemIndex].kantong;
                let kantongEl = document.getElementById(kantongId);
                if (!kantongEl) {
                    kantongEl = document.createElement('div');
                    kantongEl.id = kantongId;
                    kantongEl.className = 'plastic-bag';
                    collectedItemsZone.appendChild(kantongEl);
                }
                kantongEl.appendChild(itemBox);
            } else {
                collectedItemsZone.appendChild(itemBox);
            }
        });
        activeFloatingGroup.remove();
    }

    currentInput = "";
    inputLine.innerText = "0";
    currentItemIndex++;
    renderItems();
}

function prosesTotalAkhir() {
    if (currentItemIndex < shoppingCart.length) {
        showModernAlert("Scan semua barang!", "screen-input");
        return;
    }

    // =========================================================
    // MODIFIKASI: Deteksi Level 4 (Tambahan Biaya Konstanta)
    // =========================================================
    if (currentLevel === 4 || currentLevel === 5) {
        const biayaKonstanta = 2000;
        grandTotalHarga += biayaKonstanta;

        screenTable.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-top: 5px; border-top: 1px dashed rgba(0,0,0,0.2); padding-top: 5px; color: #d35400; font-weight: bold;">
                <span style="flex: 1.2;">Kantong/Ongkir</span>
                <span style="flex: 2.3; text-align: center;">(+ Konstanta)</span>
                <span style="flex: 1; text-align: right;">Rp 2.000</span>
            </div>
        `;
        algebraParts.push("2000");
    } else if (currentLevel === 8) {
        const biayaLayanan = 5000;
        grandTotalHarga += biayaLayanan;

        screenTable.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-top: 5px; border-top: 1px dashed rgba(0,0,0,0.2); padding-top: 5px; color: #8e44ad; font-weight: bold;">
                <span style="flex: 1.2;">Layanan Toko</span>
                <span style="flex: 2.3; text-align: center;">(+ Konstanta c)</span>
                <span style="flex: 1; text-align: right;">Rp 5.000</span>
            </div>
        `;
        algebraParts.push("5000");
    }
    // =========================================================

    // Perbarui nilai pada UI layar kasir baru
    screenTotalVal.innerText = "Rp " + grandTotalHarga.toLocaleString('id-ID');

    if (currentLevel === 3) {
        screenFormula.innerText = "Rumus = " + algebraParts.join(" + ");

        let itemMap = {};
        shoppingCart.forEach(item => {
            if (itemMap[item.nama]) itemMap[item.nama] += item.jumlah;
            else itemMap[item.nama] = item.jumlah;
        });

        let partsSimplified = [];
        for (let nama in itemMap) {
            partsSimplified.push(itemMap[nama] + " " + nama);
        }
        let finalFormula = partsSimplified.join(" + ");

        setTimeout(() => {
            screenFormula.classList.add('algebra-glow');
            setTimeout(() => {
                screenFormula.innerText = "Rumus = " + finalFormula + " = Rp " + grandTotalHarga.toLocaleString('id-ID');
                screenFormula.classList.remove('algebra-glow');
                screenFormula.classList.add('algebra-text');
            }, 500);
        }, 1500);

    } else if (currentLevel === 4) {
        let group1 = [];
        let group2 = [];
        let noGroup = [];

        shoppingCart.forEach((item) => {
            let text = item.jumlah + " " + item.nama;
            if (item.kantong === 1) group1.push(text);
            else if (item.kantong === 2) group2.push(text);
            else noGroup.push(text);
        });

        let partsFormatted = [];
        if (group1.length > 0) partsFormatted.push("(" + group1.join(" + ") + ")");
        if (group2.length > 0) partsFormatted.push("(" + group2.join(" + ") + ")");
        if (noGroup.length > 0) partsFormatted.push(noGroup.join(" + "));

        if (algebraParts[algebraParts.length - 1] === "2000") {
            partsFormatted.push("2000");
        }

        let finalFormula = partsFormatted.join(" + ");
        screenFormula.innerText = "Rumus = " + finalFormula + " = Rp " + grandTotalHarga.toLocaleString('id-ID');
    } else {
        screenFormula.innerText = "Rumus = " + algebraParts.join(" + ") + " = Rp " + grandTotalHarga.toLocaleString('id-ID');
    }

    // Ubah status input untuk menunggu pembayaran
    inputLine.innerText = "Tunggu Pembayaran";
    inputLine.style.color = '#e74c3c';
    gamePhase = "payment";

    renderPayment();
}

function prosesPembayaran() {
    if (gamePhase !== "payment") return;

    if (parseInt(currentInput) === customerPayment.totalUang) {
        gamePhase = "give_change";
        expectedChange = customerPayment.totalUang - grandTotalHarga;

        // Tampilkan nominal pembayaran pelanggan di layar LCD kasir
        screenPayment.innerText = "Pembayaran = Rp " + customerPayment.totalUang.toLocaleString('id-ID') + ", -";

        // Ubah layar input menjadi target kembalian
        inputLine.innerText = "Rp " + expectedChange.toLocaleString('id-ID');
        inputLine.style.color = '#2980b9';

        calculatorUI.style.display = 'none';
        drawerUI.style.display = 'flex'; // Laci uang muncul dari bawah

        initCashDrawer();
        renderFloatingChange(); // <--- Ganti baris ini
    } else {
        alert("Jumlah uang salah!");
        currentInput = "";
        inputLine.innerText = "0";
    }
}

function tampilkanStruk() {
    let rincianBarang = "";
    shoppingCart.forEach(item => {
        rincianBarang += `<div class="receipt-row"><span>${item.jumlah}x ${item.nama}</span><span>${(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}</span></div>`;
    });

    // Modifikasi: Tampilkan Ongkir di Struk
    if (currentLevel === 4 || currentLevel === 5) {
        rincianBarang += `<div class="receipt-row" style="color: #d35400; font-style: italic; margin-top: 5px;"><span>Biaya Kantong/Ongkir</span><span>2.000</span></div>`;
    } else if (currentLevel === 8) {
        rincianBarang += `<div class="receipt-row" style="color: #8e44ad; font-style: italic; margin-top: 5px;"><span>Biaya Layanan Toko</span><span>5.000</span></div>`;
    }
    receiptContent.innerHTML = `
        <div class="receipt-title">Daftar Barang:</div>
        ${rincianBarang}
        <div class="receipt-title">Riwayat Aljabar:</div>
        <div style="font-size: 12px;">Total = ${algebraParts.join(" + ")}</div>
        <br>
        <div class="receipt-row"><strong>TOTAL BELANJA</strong><strong>Rp ${grandTotalHarga.toLocaleString('id-ID')}</strong></div>
        <div class="receipt-row"><span>TUNAI</span><span>Rp ${customerPayment.totalUang.toLocaleString('id-ID')}</span></div>
        <div class="receipt-row"><span>KEMBALIAN</span><span>Rp ${expectedChange.toLocaleString('id-ID')}</span></div>
    `;
    receiptModal.style.display = 'flex';
}

// ==========================================
// 7. KONTROL EVENT LISTENER KASIR
// ==========================================
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const txt = button.innerText;

        if (txt === 'C') {
            currentInput = "";
            inputLine.innerText = "0";
        }
        else if (txt === '⌫') {
            if (currentInput === "" || currentInput === "0") {
                currentInput = "";
                inputLine.innerText = "0";
                return;
            }

            // Jika menghapus tepat saat posisi kurung kosong "jumlah x ()"
            if (currentInput.endsWith(" x ()")) {
                currentInput = currentInput.replace(" x ()", "");
            }
            // Jika menghapus angka yang berada di dalam kurung "jumlah x (harga)"
            else if (currentInput.includes(" x (") && currentInput.endsWith(")")) {
                let leftPart = currentInput.slice(0, currentInput.indexOf(" x (") + 4);
                let core = currentInput.slice(currentInput.indexOf(" x (") + 4, -1); // Ambil teks di dalam ()

                if (core.endsWith(" - ")) {
                    core = core.slice(0, -3); // Hapus operator minus diskon beserta spasinya
                } else {
                    core = core.slice(0, -1); // Hapus satu angka terakhir

                    // Format ulang sisa angka agar tanda titik ribuan tetap benar setelah dihapus
                    if (core.includes(" - ")) {
                        let parts = core.split(" - ");
                        let p1 = parts[0].replace(/\./g, '');
                        let p2 = parts[1].replace(/\./g, '');
                        let f1 = p1 ? parseInt(p1).toLocaleString('id-ID') : "";
                        let f2 = p2 ? parseInt(p2).toLocaleString('id-ID') : "";
                        core = f1 + " - " + f2;
                    } else {
                        let p = core.replace(/\./g, '');
                        core = p ? parseInt(p).toLocaleString('id-ID') : "";
                    }
                }
                currentInput = leftPart + core + ")";
            }
            // Jika menghapus angka jumlah/kuantitas biasa di depan sebelum tanda x
            else {
                currentInput = currentInput.slice(0, -1);
            }

            inputLine.innerText = currentInput === "" ? "0" : currentInput;
        }
        else if (txt === 'x') {
            // Jika belum ada perkalian, otomatis buat sepasang kurung lengkap " x ()"
            if (!currentInput.includes('x') && currentInput !== "" && currentInput !== "-") {
                currentInput += " x ()";
            }
            inputLine.innerText = currentInput;
        }
        else if (txt === '-') {
            if (currentInput.includes('x')) {
                // Jika berada di dalam kurung, sisipkan operator minus untuk diskon " - "
                let core = currentInput.slice(currentInput.indexOf(" x (") + 4, -1);
                if (core !== "" && !core.includes(" - ")) {
                    currentInput = currentInput.slice(0, -1) + " - )";
                }
            } else {
                // Logika minus standar jika ditekan di awal kuantitas
                if (currentInput === "") currentInput = "-";
                else if (!currentInput.includes("-")) currentInput += "-";
            }
            inputLine.innerText = currentInput === "" ? "0" : currentInput;
        }
        else if (txt === '+') {
            if (currentInput !== "" && currentInput !== "-" && gamePhase === "scanning") cekHitungan();
        }
        else if (txt === '=') {
            if (gamePhase === "scanning") prosesTotalAkhir();
        }
        else if (txt === 'Bayar') {
            if (currentInput !== "" && currentInput !== "-") prosesPembayaran();
        }
        else {
            // KONDISI MENGETIK ANGKA (0 - 9)
            if (currentInput.includes(' x (')) {
                // Otomatis mengetik dan menyisip di dalam kurung langsung
                let leftPart = currentInput.slice(0, currentInput.indexOf(" x (") + 4);
                let core = currentInput.slice(currentInput.indexOf(" x (") + 4, -1);

                if (core.includes(" - ")) {
                    let parts = core.split(" - ");
                    let hargaStr = parts[0];
                    let diskonStr = parts[1] + txt;

                    // Bersihkan titik lama lalu format ulang dengan titik ribuan baru
                    diskonStr = diskonStr.replace(/\./g, '');
                    let diskonFormatted = parseInt(diskonStr).toLocaleString('id-ID');
                    currentInput = leftPart + hargaStr + " - " + diskonFormatted + ")";
                } else {
                    let hargaStr = core + txt;

                    // Bersihkan titik lama lalu format ulang dengan titik ribuan baru
                    hargaStr = hargaStr.replace(/\./g, '');
                    let hargaFormatted = parseInt(hargaStr).toLocaleString('id-ID');
                    currentInput = leftPart + hargaFormatted + ")";
                }
            } else {
                // Mengetik angka jumlah di luar kurung seperti biasa
                if (currentInput === "0") currentInput = txt;
                else currentInput += txt;
            }
            inputLine.innerText = currentInput;
        }
    });
});

finishBtn.addEventListener('click', () => {
    const totalDiberikan = givenChange.reduce((total, nominal) => total + nominal, 0);

    if (totalDiberikan === expectedChange) {
        gamePhase = "done";
        tampilkanStruk();
    } else {
        showModernAlert(`Kembalian salah!\nKamu memberikan Rp ${totalDiberikan.toLocaleString('id-ID')}, seharusnya Rp ${expectedChange.toLocaleString('id-ID')}.`, "finish-btn");
    }
});

// --- LEVEL 2 COMMUTATIVE MODAL ---
function tampilkanModalKomutatif() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'commutative-modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '300';
    modal.innerHTML = `
        <div class="commutative-container">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Membuktikan Sifat Komutatif</h2>
            <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 20px; gap: 10px;">
                <div class="receipt-paper" style="transform: scale(0.9); padding: 15px; margin: 0; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: auto;">
                    <div class="receipt-subtitle">Pelanggan 1</div>
                    <hr>
                    <div style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; text-align: center; padding: 10px 0;">
                        2 Roti + 3 Kopi AAA = Rp 61.000
                    </div>
                </div>
                <div id="commutative-equals" style="font-size: 40px; font-weight: bold; color: #e74c3c; opacity: 0; transition: opacity 1.5s, transform 1.5s; transform: scale(0.5);">
                    ===
                </div>
                <div class="receipt-paper" style="transform: scale(0.9); padding: 15px; margin: 0; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: auto;">
                    <div class="receipt-subtitle">Pelanggan 2</div>
                    <hr>
                    <div style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; text-align: center; padding: 10px 0;">
                        3 Kopi AAA + 2 Roti = Rp 61.000
                    </div>
                </div>
            </div>
            <p style="color: #34495e; font-size: 16px; margin-bottom: 20px; font-weight: bold;">Sifat Komutatif: Menukar urutan barang tidak mengubah total harga.</p>
            <button id="btn-komutatif-lanjut" class="btn primary-btn" style="width: 100%; font-size: 18px; margin-top: 10px;">Konfirmasi Kesamaan</button>
        </div>
    `;

    document.getElementById('main-game-ui').appendChild(modal);

    setTimeout(() => {
        const eq = document.getElementById('commutative-equals');
        if (eq) {
            eq.style.opacity = '1';
            eq.style.transform = 'scale(1)';
        }
    }, 1500);

    document.getElementById('btn-komutatif-lanjut').addEventListener('click', () => {
        modal.remove(); // Tutup modal

        receiptModal.style.display = 'none';
        document.getElementById('main-game-ui').style.display = 'none';
        quizUI.style.display = 'flex';
        mulaiKuis();
    });
}

// --- LEVEL 4 ASSOCIATIVE MODAL ---
function tampilkanModalAsosiatif() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'associative-modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '300';
    modal.innerHTML = `
        <div class="commutative-container">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Membuktikan Sifat Asosiatif</h2>
            <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 20px; gap: 10px;">
                <div class="receipt-paper" style="transform: scale(0.9); padding: 15px; margin: 0; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: auto;">
                    <div class="receipt-subtitle">Pelanggan 1</div>
                    <hr>
                    <div style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; text-align: center; padding: 10px 0;">
                        (1 Apel + 1 Jeruk) + 1 Terong = Rp 10.500
                    </div>
                </div>
                <div id="associative-equals" style="font-size: 40px; font-weight: bold; color: #e74c3c; opacity: 0; transition: opacity 1.5s, transform 1.5s; transform: scale(0.5);">
                    ===
                </div>
                <div class="receipt-paper" style="transform: scale(0.9); padding: 15px; margin: 0; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: auto;">
                    <div class="receipt-subtitle">Pelanggan 2</div>
                    <hr>
                    <div style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; text-align: center; padding: 10px 0;">
                        1 Apel + (1 Jeruk + 1 Terong) = Rp 10.500
                    </div>
                </div>
            </div>
            <p style="color: #34495e; font-size: 16px; margin-bottom: 20px; font-weight: bold;">Sifat Asosiatif: Mengubah kelompok kantong (tanda kurung) tidak mengubah total harga.</p>
            <button id="btn-asosiatif-lanjut" class="btn primary-btn" style="width: 100%; font-size: 18px; margin-top: 10px;">Konfirmasi Kesamaan</button>
        </div>
    `;

    document.getElementById('main-game-ui').appendChild(modal);

    setTimeout(() => {
        const eq = document.getElementById('associative-equals');
        if (eq) {
            eq.style.opacity = '1';
            eq.style.transform = 'scale(1)';
        }
    }, 1000);

    document.getElementById('btn-asosiatif-lanjut').addEventListener('click', () => {
        modal.remove(); // Tutup modal

        receiptModal.style.display = 'none';
        document.getElementById('main-game-ui').style.display = 'none';
        quizUI.style.display = 'flex';
        mulaiKuis();
    });
}

nextCustomerBtn.addEventListener('click', () => {
    currentCustomerIndex++;
    if (currentCustomerIndex >= maxCustomers) {
        if (currentLevel === 2) {
            tampilkanModalKomutatif();
            return;
        }
        if (currentLevel === 4) {
            tampilkanModalAsosiatif();
            return;
        }

        receiptModal.style.display = 'none';
        mainGameUI.style.display = 'none';
        quizUI.style.display = 'flex';
        mulaiKuis();
        return;
    }

    // Kosongkan area melayang dan meja bawah
    floatingZone.innerHTML = "";
    collectedItemsZone.innerHTML = "";

    setupPelangganBaru();
    currentItemIndex = 0;
    gamePhase = "scanning";
    currentInput = "";
    algebraParts = [];
    substitutionParts = [];
    grandTotalHarga = 0;
    expectedChange = 0;
    givenChange = [];

    receiptModal.style.display = 'none';
    drawerUI.style.display = 'none';
    calculatorUI.style.display = 'grid';

    // Reset elemen UI layar kasir baru
    screenTable.innerHTML = "";
    screenTotalVal.innerText = "";
    screenFormula.innerText = "";
    screenPayment.innerText = "";
    inputLine.innerText = "0";
    inputLine.style.color = '#e74c3c'; // Kembalikan ke warna default merah

    renderItems();
});

// ==========================================
// 8. LOGIKA KUIS EVALUASI (DINAMIS)
// ==========================================
function generateKuis(level) {
    // Mengambil tepat 2 soal dari data statis berdasarkan level saat ini
    quizData = dataKuisStatis[level] || [];
}

function mulaiKuis() {
    generateKuis(currentLevel);
    currentQuizIndex = 0; quizScore = 0;
    renderSoalKuis();
}

function renderSoalKuis() {
    nextQuizBtn.style.display = 'none'; quizFeedback.innerText = ""; quizOptionsContainer.innerHTML = "";
    const soal = quizData[currentQuizIndex];
    quizQuestion.innerText = soal.question;

    soal.options.forEach((opsi, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn'; btn.innerText = opsi;
        btn.addEventListener('click', () => cekJawabanKuis(index, btn));
        quizOptionsContainer.appendChild(btn);
    });
}

function cekJawabanKuis(selectedIndex, btnElement) {
    const soal = quizData[currentQuizIndex];
    const allQuizBtns = document.querySelectorAll('.quiz-btn');
    allQuizBtns.forEach(btn => btn.disabled = true);

    if (selectedIndex === soal.correctIndex) {
        btnElement.classList.add('correct');
        quizFeedback.innerText = "Jawaban Benar! 🎉"; quizFeedback.style.color = "#2ecc71";
        quizScore++;
    } else {
        btnElement.classList.add('wrong');
        quizFeedback.innerText = "Jawaban Salah."; quizFeedback.style.color = "#e74c3c";
        allQuizBtns[soal.correctIndex].classList.add('correct');
    }
    nextQuizBtn.style.display = 'block';
}

nextQuizBtn.addEventListener('click', () => {
    currentQuizIndex++;
    if (currentQuizIndex < quizData.length) {
        renderSoalKuis();
    } else {
        quizUI.style.display = 'none';
        gameOverUI.style.display = 'flex';
        finalScoreText.innerText = `${quizScore} / ${quizData.length}`;

        // Kalkulasi Bintang
        let earnedStars = 0;
        if (quizScore === quizData.length) earnedStars = 3;
        else if (quizScore > 0) earnedStars = 2;
        else earnedStars = 1;

        if (earnedStars > levelStars[currentLevel]) {
            levelStars[currentLevel] = earnedStars;
            localStorage.setItem('algebraMartStars', JSON.stringify(levelStars));
            updateStarsUI();
        }

        let unlockMsg = document.getElementById('unlock-message');
        if (!unlockMsg) {
            unlockMsg = document.createElement('div');
            unlockMsg.id = 'unlock-message';
            unlockMsg.style.fontSize = '22px';
            unlockMsg.style.marginTop = '15px';
            unlockMsg.style.fontWeight = 'bold';
            finalScoreText.parentNode.appendChild(unlockMsg);
        }

        // Logika Unlocking Level Dinamis (1 sampai 10)
        if (quizScore === quizData.length) {
            unlockMsg.style.color = '#f1c40f';
            if (currentLevel < 10) {
                const nextLevelBtn = document.getElementById(`level-${currentLevel + 1}-btn`);
                if (nextLevelBtn) {
                    nextLevelBtn.classList.remove('locked');
                    nextLevelBtn.disabled = false;
                }
                unlockMsg.innerText = `🌟 Sempurna! Level ${currentLevel + 1} Terbuka.`;
            } else {
                unlockMsg.innerText = "🏆 Luar Biasa! Kamu Menamatkan Game Ini.";
            }
        } else {
            unlockMsg.style.color = '#fff';
            unlockMsg.innerText = "Skor belum sempurna. Coba lagi untuk membuka level berikutnya!";
        }
    }
});

// Fungsi mengubah skor angka menjadi tampilan Bintang (★ / ☆)
function updateStarsUI() {
    for (let level = 1; level <= 10; level++) {
        let starsCount = levelStars[level] || 0;
        let starString = "";
        for (let i = 0; i < 3; i++) {
            starString += (i < starsCount) ? "★" : "☆";
        }
        const starElement = document.getElementById(`stars-level-${level}`);
        if (starElement) starElement.innerText = starString;
    }
}

// Tutup tutorial saat tombol ditekan
closeTutorialBtn.addEventListener('click', () => {
    tutorialOverlay.style.display = 'none';
    tutorialDone = true;
});

// Panggil fungsi bintang saat game pertama kali dimuat
updateStarsUI();

// ==========================================
// 9. MENU NAVIGASI & MEMULAI GAME
// ==========================================
// ==========================================
// 9. MENU NAVIGASI & MEMULAI GAME
// ==========================================

// Status deteksi mode
let isFacilitatorMode = false;

// Fungsi untuk memperbarui status gembok level (Fasilitator & Normal)
function updateLevelLocks() {
    const menuTitle = document.querySelector('.menu-title');

    if (isFacilitatorMode) {
        // JIKA FASILITATOR: Ubah judul dan BUKA SEMUA GEMBOK
        if (menuTitle) menuTitle.innerHTML = "Pilih Tingkat Kesulitan <br><span style='color:#f1c40f; font-size:18px;'>[ Mode Fasilitator ]</span>";

        for (let i = 1; i <= 10; i++) {
            const btn = document.getElementById(`level-${i}-btn`);
            if (btn) {
                btn.classList.remove('locked');
                btn.disabled = false;
            }
        }
    } else {
        // JIKA PEMAIN NORMAL: Buka berdasarkan sistem Bintang (Progression)
        if (menuTitle) menuTitle.innerHTML = "Pilih Tingkat Kesulitan";

        // Level 1 selalu bisa dimainkan
        const btnLevel1 = document.getElementById('level-1-btn');
        if (btnLevel1) {
            btnLevel1.classList.remove('locked');
            btnLevel1.disabled = false;
        }

        // Level 2 sampai 10 hanya terbuka jika level sebelumnya punya minimal 3 bintang
        for (let i = 2; i <= 10; i++) {
            const btn = document.getElementById(`level-${i}-btn`);
            if (btn) {
                if (levelStars[i - 1] >= 3) {
                    btn.classList.remove('locked');
                    btn.disabled = false;
                } else {
                    btn.classList.add('locked');
                    btn.disabled = true;
                }
            }
        }
    }
}

// Tombol Mulai Proyek (Mode Siswa/Normal)
startProjectBtn.addEventListener('click', () => {
    isFacilitatorMode = false; // Matikan hak akses fasilitator
    updateLevelLocks();        // Terapkan sistem gembok normal
    mainMenuUI.style.display = 'none';
    levelMenuUI.style.display = 'flex';
});

// Tombol Masuk Fasilitator (Mode Guru/Pemantau)
const fasilitatorBtn = document.getElementById('fasilitator-btn');
if (fasilitatorBtn) {
    fasilitatorBtn.addEventListener('click', () => {
        // Meminta kata sandi (menggunakan browser prompt bawaan)
        const sandi = prompt("Masukkan Sandi Fasilitator:");

        if (sandi === "1234") {
            isFacilitatorMode = true; // Berikan hak akses
            updateLevelLocks();       // Buka paksa semua gembok level

            // Tampilkan notifikasi melayang
            showModernAlert("Mode Fasilitator Aktif! Semua level dapat diakses.", "main-menu-ui");

            // Pindah ke halaman level
            mainMenuUI.style.display = 'none';
            levelMenuUI.style.display = 'flex';
        } else if (sandi !== null && sandi !== "") {
            // Jika sandi salah dan tidak menekan 'Cancel'
            alert("Akses Ditolak: Sandi salah!");
        }
    });
}

// Fungsi kembali ke menu utama
backToMainBtn.addEventListener('click', () => {
    levelMenuUI.style.display = 'none';
    mainMenuUI.style.display = 'flex';
});

backToMainBtn.addEventListener('click', () => {
    levelMenuUI.style.display = 'none'; mainMenuUI.style.display = 'flex';
});

function mulaiGame(level) {
    currentLevel = level;
    currentCustomerIndex = 0;
    purchasedHistory = [];

    // Tentukan jumlah maksimal pelanggan berdasarkan jumlah data statis di level tersebut
    maxCustomers = dataLevelStatis[level].length;

    levelMenuUI.style.display = 'none';
    gameWrapper.style.display = 'flex';

    // Pastikan layar kasir tampil (Jika kamu menggunakan perbaikan tombol kembali sebelumnya)
    mainGameUI.style.display = 'flex';

    setupPelangganBaru();
    renderItems();

    if (level === 1 && !tutorialDone) {
        tutorialOverlay.style.display = 'flex';
    }

    if (level === 8) {
        // Tampilkan di tengah layar (karena ID target 'main-game-ui' mencakup area luas)
        showModernAlert("Aturan Level: Setiap transaksi dikenakan Biaya Layanan Toko Rp 5.000", "main-game-ui");
    }
}

// Daftarkan event listener untuk ke-10 level
for (let i = 1; i <= 10; i++) {
    const btn = document.getElementById(`level-${i}-btn`);
    if (btn) {
        btn.addEventListener('click', () => mulaiGame(i));
    }
}

// BUG FIX: Hapus variabel 'allCustomers' yang bikin game macet saat Restart
// ==========================================
// FUNGSI RESET TOTAL KE MENU UTAMA
// ==========================================
function resetKeMenuUtama() {
    gameWrapper.style.display = 'none';
    mainGameUI.style.display = 'none';
    quizUI.style.display = 'none';
    gameOverUI.style.display = 'none';
    receiptModal.style.display = 'none';
    drawerUI.style.display = 'none';
    mainMenuUI.style.display = 'flex';

    shoppingCart = [];
    customerPayment = {};
    purchasedHistory = [];
    quizData = [];
    currentItemIndex = 0;
    gamePhase = "scanning";
    currentInput = "";
    algebraParts = [];
    substitutionParts = [];
    grandTotalHarga = 0;
    expectedChange = 0;
    givenChange = [];
    currentQuizIndex = 0;
    quizScore = 0;

    // Bersihkan seluruh sub-area meja
    floatingZone.innerHTML = "";
    collectedItemsZone.innerHTML = "";
    calculatorUI.style.display = 'grid';
    // Reset elemen UI layar kasir baru
    screenTable.innerHTML = "";
    screenTotalVal.innerText = "";
    screenFormula.innerText = "";
    screenPayment.innerText = "";
    inputLine.innerText = "0";
    inputLine.style.color = '#e74c3c';
}

// ==========================================
// FUNGSI KEMBALI KE MENU LEVEL
// ==========================================
function kembaliKeMenuLevel() {
    // Sembunyikan semua UI Game
    gameWrapper.style.display = 'none';
    mainGameUI.style.display = 'none';
    quizUI.style.display = 'none';
    gameOverUI.style.display = 'none';
    receiptModal.style.display = 'none';
    drawerUI.style.display = 'none';

    // TAMPILKAN MENU LEVEL (Bukan Menu Utama)
    levelMenuUI.style.display = 'flex';

    // Reset state variabel
    shoppingCart = [];
    customerPayment = {};
    purchasedHistory = [];
    quizData = [];
    currentItemIndex = 0;
    gamePhase = "scanning";
    currentInput = "";
    algebraParts = [];
    substitutionParts = [];
    grandTotalHarga = 0;
    expectedChange = 0;
    givenChange = [];
    currentQuizIndex = 0;
    quizScore = 0;

    // Bersihkan area animasi atas dan meja kumpul
    floatingZone.innerHTML = "";
    collectedItemsZone.innerHTML = "";
    calculatorUI.style.display = 'grid';

    // Reset elemen UI layar kasir
    screenTable.innerHTML = "";
    screenTotalVal.innerText = "";
    screenFormula.innerText = "";
    screenPayment.innerText = "";
    inputLine.innerText = "0";
    inputLine.style.color = '#e74c3c';
}

// Pasang event listener ke kedua tombol
restartGameBtn.addEventListener('click', resetKeMenuUtama);
inGameBackBtn.addEventListener('click', kembaliKeMenuLevel);