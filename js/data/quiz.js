// ==========================================
// data/quiz.js — Database Soal Kuis per Level
// ==========================================

/** @type {Object.<number, Array<{q: string, options: string[], ans: number}>>} */
export const QUIZ_DB = {
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
    ],
    11: [ // C4 - Distributif Paket Hemat
        { q: "Pelanggan membeli 3 paket bingkisan hajatan, di mana tiap paket berisi (2a + l). Bentuk distributif 3(2a + l) adalah...", options: ["A. 5a + 3l", "B. 6a + 3l", "C. 6a + l", "D. 2a + 3l"], ans: 1 },
        { q: "Jika bentuk aljabar 4(f + 2h) dijabarkan dengan sifat distributif perkalian, hasilnya adalah...", options: ["A. 4f + 8h", "B. 4f + 2h", "C. 5f + 6h", "D. 8fh"], ans: 0 }
    ],
    12: [ // C4 - Revisi Keranjang Bertingkat
        { q: "Pelanggan membawa (5b + 4i), lalu mengembalikan 2b (-2b) dan menambah 1i (+i). Bentuk aljabar akhirnya adalah...", options: ["A. 7b + 5i", "B. 3b + 3i", "C. 3b + 5i", "D. 3b + 4i"], ans: 2 },
        { q: "Sederhanakan suku sejenis pada ekspresi belanja berikut: 8a + 6g - 3a + 2g...", options: ["A. 5a + 8g", "B. 11a + 8g", "C. 5a + 4g", "D. 13ag"], ans: 0 }
    ],
    13: [ // C5 - Suku Campuran Banyak Variabel
        { q: "Bentuk sederhana dari ekspresi belanja campuran: (4n + 2p + 3f) + 2n - 1p adalah...", options: ["A. 6n + p + 3f", "B. 6n + 3p + 3f", "C. 2n + p + 3f", "D. 8npf"], ans: 0 },
        { q: "Pada pesanan 5q + 3b + 2i + q - b, koefisien untuk variabel b dan q berturut-turut adalah...", options: ["A. 2 dan 5", "B. 2 dan 6", "C. 4 dan 6", "D. 3 dan 5"], ans: 1 }
    ],
    14: [ // C5 - Jebakan Informasi Tidak Relevan
        { q: "Pelanggan berkata: 'Kemarin beli 3 Apel, uangku Rp 100.000, tapi hari ini HANYA beli 4 Jeruk (g) dan 2 Kopi (h)'. Aljabar transaksi hari ini adalah...", options: ["A. 3a + 4g + 2h", "B. 100g + 2h", "C. 4g + 2h", "D. 4g + 2h - 3a"], ans: 2 },
        { q: "Mengapa informasi 'kemarin beli 3 Apel' dan 'uang Rp 100.000' diabaikan saat menyusun rumus pesanan di kasir?", options: ["A. Karena bukan barang yang dibeli saat ini (distraktor)", "B. Karena apel harganya terlalu murah", "C. Karena uangnya terlalu banyak", "D. Karena kasir lupa mencatat"], ans: 0 }
    ],
    15: [ // C5 - Gabungan Pesanan 3 Orang
        { q: "Budi memesan (2d + e), Siti (3d + 2e), dan Rian (1d). Berapakah jumlah total aljabar pesanan ketiga orang tersebut?", options: ["A. 5d + 3e", "B. 6d + 3e", "C. 6d + 2e", "D. 9de"], ans: 1 },
        { q: "Gabungan pesanan 3 meja: (2h + l) + (3h + 2l) + (h + 3l). Setelah suku sejenis digabungkan, hasilnya adalah...", options: ["A. 6h + 6l", "B. 5h + 5l", "C. 6h + 5l", "D. 12hl"], ans: 0 }
    ],
    16: [ // C6 - Koefisien Pecahan & Setengah Pesanan
        { q: "Pelanggan ingin mengambil setengah (1/2) dari pesanan awal (12c + 6k). Bentuk aljabar 1/2(12c + 6k) bernilai...", options: ["A. 6c + 6k", "B. 12c + 3k", "C. 6c + 3k", "D. 24c + 12k"], ans: 2 },
        { q: "Jika 10 Apel (a) dan 8 Jeruk (g) dikurangi 50% (separuhnya), bentuk aljabar yang tersisa adalah...", options: ["A. 5a + 4g", "B. 10a + 4g", "C. 5a + 8g", "D. 2a + 2g"], ans: 0 }
    ],
    17: [ // C6 - Substitusi Anggaran Terbatas
        { q: "Pelanggan punya Rp 45.000, beli 2 Tempoyak (2 × Rp 15.000 = Rp 30.000). Sisa Rp 15.000 dihabiskan untuk Terong (q) Rp 3.000. Berapa q terbeli?", options: ["A. 3 Terong", "B. 4 Terong", "C. 5 Terong", "D. 6 Terong"], ans: 2 },
        { q: "Modal belanja Rp 35.000, dibelikan 1 Beras (b = 15.000) dan sisanya pas habis untuk Buku (c = 5.000). Persamaan aljabar yang tepat adalah...", options: ["A. b + 4c = 35.000", "B. b + 2c = 35.000", "C. 2b + c = 35.000", "D. 4b + c = 35.000"], ans: 0 }
    ],
    18: [ // C6 - Aljabar Bertanda Kurung Ganda
        { q: "Selesaikan bentuk aljabar kurung ganda: 2(3g + 2a) + 1(g + 4a)...", options: ["A. 7g + 8a", "B. 5g + 6a", "C. 7g + 6a", "D. 15ga"], ans: 0 },
        { q: "Hasil penyederhanaan dari ekspresi 3(2n + l) + 2(n + 2l) adalah...", options: ["A. 7n + 5l", "B. 8n + 7l", "C. 6n + 4l", "D. 9n + 8l"], ans: 1 }
    ],
    19: [ // C6 - Jebakan Koefisien Nol & Barang Serupa
        { q: "Pelanggan berkata: 'Beli 5 Padamaran (5j) dan 3 Sabun (3m), gandusnya kosong (0e)'. Penulisan rumus aljabar yang paling efisien adalah...", options: ["A. 5j + 0e + 3m", "B. 5j + 3m", "C. 8jm", "D. 5j - 3m"], ans: 1 },
        { q: "Jika suatu ekspresi tertulis 6q + 0d + 0p + 2o, maka nilai suku 0d dan 0p setara dengan...", options: ["A. 1", "B. Tidak terdefinisi", "C. 0 (dapat diabaikan dari penjumlahan)", "D. Variabel d dan p"], ans: 2 }
    ],
    20: [ // C6 - Ujian Akhir Sindikat Kelontong
        { q: "Ekspresi 2(3o + 4b) + 5n + 3i + 2j - b disederhanakan menjadi...", options: ["A. 6o + 7b + 5n + 3i + 2j", "B. 6o + 8b + 5n + 3i + 2j", "C. 5o + 7b + 5n + 3i + 2j", "D. 6o + 3b + 5n + 3i + 2j"], ans: 0 },
        { q: "Pesanan koperasi: 3(2f + 3q) + 2(f + 2i + 4a). Bentuk gabungan yang benar setelah disederhanakan adalah...", options: ["A. 8f + 9q + 4i + 8a", "B. 7f + 9q + 4i + 8a", "C. 8f + 6q + 4i + 8a", "D. 6f + 9q + 2i + 4a"], ans: 0 }
    ]
};

