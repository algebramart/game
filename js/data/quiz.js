// ==========================================
// data/quiz.js — Database Soal Kuis per Level
// ==========================================

/** @type {Object.<number, Array<{q: string, options: string[], ans: number}>>} */
export const QUIZ_DB = {
    // ----------------------------------------------------
    // FASE 1: VARIABEL MURNI & SUKU SEJENIS (LEVEL 1 - 3)
    // ----------------------------------------------------
    1: [ // Fase 1: Konsep Variabel Tunggal & Koefisien
        { 
            q: "Pada transaksi 3a + 2b, apa makna dari huruf a?", 
            options: [
                "A. Harga satu satuan barang yang belum diketahui nilainya",
                "B. Nama fisik buah apel",
                "C. Jumlah buah apel yang dibeli",
                "D. Merek apel"
            ], 
            ans: 0 
        },
        { 
            q: "Jika harga satu kotak kue padamaran adalah j rupiah, maka bentuk aljabar untuk pembelian 4 kotak kue padamaran adalah...", 
            options: [
                "A. j + 4",
                "B. 4j",
                "C. j^4",
                "D. 4 - j"
            ], 
            ans: 1 
        }
    ],

    2: [ // Fase 1: Penjumlahan Suku Sejenis
        { 
            q: "Pelanggan memesan 3 kue seharga a rupiah (3a) lalu menambah 4 kue lagi (4a). Bentuk aljabar yang tepat adalah...", 
            options: [
                "A. 3a + 4a = 7a",
                "B. 3a + 4a = 7a^2",
                "C. 3a + 4a = 12a",
                "D. 3a + 4a = 7"
            ], 
            ans: 0 
        },
        { 
            q: "Hasil penjumlahan suku sejenis dari 2e + 3e untuk kue gandus seharga e rupiah adalah...", 
            options: [
                "A. 6e",
                "B. 5e",
                "C. 5e^2",
                "D. 5"
            ], 
            ans: 1 
        }
    ],

    3: [ // Fase 1: Pengurangan Suku Sejenis (Pembatalan Pesanan)
        { 
            q: "Bentuk sederhana dari 5x + 2y - 2y adalah...", 
            options: [
                "A. 5x (karena 2y - 2y = 0)",
                "B. 5x + 4y",
                "C. 7xy",
                "D. 5x - 4y"
            ], 
            ans: 0 
        },
        { 
            q: "Pelanggan memesan 5 kotak kue padamaran (5j) tetapi membatalkan 2 kotak (-2j). Bentuk aljabar penyederhanaannya adalah...", 
            options: [
                "A. 5j - 2j = 7j",
                "B. 5j - 2j = 3j",
                "C. 5j - 2j = 3",
                "D. 5j - 2j = 10j"
            ], 
            ans: 1 
        }
    ],

    // ----------------------------------------------------
    // FASE 2: DUA VARIABEL & SUKU TIDAK SEJENIS (LEVEL 4 - 7)
    // ----------------------------------------------------
    4: [ // Fase 2: Pengenalan Dua Variabel Berbeda
        { 
            q: "Harga 1 karung beras adalah b rupiah dan harga 1 botol minyak adalah i rupiah. Bentuk aljabar untuk 2 karung beras dan 3 botol minyak adalah...", 
            options: [
                "A. 2b + 3i",
                "B. 5bi",
                "C. 6bi",
                "D. 2b - 3i"
            ], 
            ans: 0 
        },
        { 
            q: "Mengapa suku 2b (beras) dan 3i (minyak) TIDAK DAPAT digabung menjadi 5bi?", 
            options: [
                "A. Karena harga minyak selalu lebih mahal dari beras",
                "B. Karena keduanya bukan suku sejenis (variabelnya menyatakan harga barang berbeda)",
                "C. Karena angka 2 dan 3 tidak boleh dijumlahkan",
                "D. Bisa digabung jika pembeli membayar dengan uang pas"
            ], 
            ans: 1 
        }
    ],

    5: [ // Fase 2: Penjumlahan Suku Sejenis pada Dua Variabel
        { 
            q: "Bentuk paling sederhana dari ekspresi transaksi 2b + 1i + 2i adalah...", 
            options: [
                "A. 2b + 3i",
                "B. 5bi",
                "C. 4b + 1i",
                "D. 3b + 2i"
            ], 
            ans: 0 
        },
        { 
            q: "Pelanggan memesan 3 apel (3a) dan 2 karung beras (2b), lalu menambah 2 apel lagi (2a). Bentuk sederhananya adalah...", 
            options: [
                "A. 7ab",
                "B. 5a + 2b",
                "C. 3a + 4b",
                "D. 5ab"
            ], 
            ans: 1 
        }
    ],

    6: [ // Fase 2: Pengurangan Suku Sejenis pada Dua Variabel
        { 
            q: "Bentuk sederhana dari ekspresi belanja (4b - 1b) + 3i adalah...", 
            options: [
                "A. 3b + 3i",
                "B. 6bi",
                "C. 5b + 3i",
                "D. 3b - 3i"
            ], 
            ans: 0 
        },
        { 
            q: "Hasil penyederhanaan dari pesanan 5a + 4g - 2g adalah...", 
            options: [
                "A. 7ag",
                "B. 3a + 2g",
                "C. 5a + 2g",
                "D. 9ag"
            ], 
            ans: 2 
        }
    ],

    7: [ // Fase 2: Penegasan Suku Tidak Sejenis
        { 
            q: "Di antara pilihan berikut, manakah pasangan suku yang TERGOLONG suku sejenis?", 
            options: [
                "A. 4a dan 2d",
                "B. 5b dan 3b",
                "C. 3i dan 3f",
                "D. 2c dan 5j"
            ], 
            ans: 1 
        },
        { 
            q: "Bentuk sederhana dari ekspresi belanja (4a + 2a) + (5g - 1g) adalah...", 
            options: [
                "A. 6a + 4g",
                "B. 10ag",
                "C. 2a + 4g",
                "D. 6a - 4g"
            ], 
            ans: 0 
        }
    ],

    // ----------------------------------------------------
    // SIFAT OPERASI ALJABAR (LEVEL 8 - 10)
    // ----------------------------------------------------
    8: [ // Sifat Komutatif Penjumlahan Aljabar
        { 
            q: "Apakah ekspresi 4a + 2d menghasilkan total tagihan yang SAMA dengan 2d + 4a?", 
            options: [
                "A. Ya, karena penjumlahan aljabar memenuhi sifat komutatif (pertukaran)",
                "B. Tidak, karena urutan penulisan barang berbeda",
                "C. Hanya sama jika harga a sama dengan d",
                "D. Tidak, karena kasir menghitung dari kiri ke kanan"
            ], 
            ans: 0 
        },
        { 
            q: "Sifat matematika yang menyatakan bahwa 3c + 2b = 2b + 3c disebut...", 
            options: [
                "A. Sifat Distributif",
                "B. Sifat Komutatif",
                "C. Sifat Asosiatif",
                "D. Sifat Identitas"
            ], 
            ans: 1 
        }
    ],

    9: [ // Makna Koefisien Nol (0)
        { 
            q: "Pelanggan memesan 4 apel seharga a rupiah dan 0 karung beras (4a + 0b). Bentuk aljabar paling sederhana yang dicatat kasir adalah...", 
            options: [
                "A. 4ab",
                "B. 4a + 0b",
                "C. 4a",
                "D. 0"
            ], 
            ans: 2 
        },
        { 
            q: "Apa arti matematis dari koefisien 0 pada suku 0e (di mana e adalah harga satuan kue gandus)?", 
            options: [
                "A. Kue gandus diberikan secara gratis",
                "B. Nilai total suku tersebut adalah 0 rupiah karena tidak ada barang yang dibeli (0 × e = 0)",
                "C. Harga kue gandus adalah Rp 0",
                "D. Kue gandus rusak dan diganti"
            ], 
            ans: 1 
        }
    ],

    10: [ // Sintesis & Evaluasi Akhir
        { 
            q: "Sederhanakan ekspresi belanja berikut: (3b + 2b) + 2i + 0a...", 
            options: [
                "A. 5b + 2i",
                "B. 7bi",
                "C. 5b + 2i + a",
                "D. 7bia"
            ], 
            ans: 0 
        },
        { 
            q: "Bentuk paling sederhana dari gabungan transaksi 6a + 2a + 2d - 1d adalah...", 
            options: [
                "A. 9ad",
                "B. 8a + d",
                "C. 8a + 3d",
                "D. 4a + d"
            ], 
            ans: 1 
        }
    ],

    // ----------------------------------------------------
    // TANTANGAN SULIT (HOTS C4 - C6) (LEVEL 11 - 20)
    // ----------------------------------------------------
    11: [ // C4 - Substitusi Riil Dua Variabel
        { 
            q: "Jika harga satuan beras b = Rp 15.000 dan harga satuan minyak i = Rp 14.000, berapakah tagihan untuk 3b + 2i?", 
            options: [
                "A. Rp 73.000",
                "B. Rp 70.000",
                "C. Rp 65.000",
                "D. Rp 87.000"
            ], 
            ans: 0 
        },
        { 
            q: "Jika harga satuan gandus e = Rp 1.500 dan harga satuan dodol d = Rp 3.000, berapakah nilai tagihan untuk 6e + 4d?", 
            options: [
                "A. Rp 25.000",
                "B. Rp 21.000",
                "C. Rp 18.000",
                "D. Rp 27.000"
            ], 
            ans: 1 
        }
    ],

    12: [ // C4 - Revisi Keranjang Bertingkat
        { 
            q: "Pelanggan membawa belanjaan awal (5b + 4i), lalu mengembalikan 2 karung beras (-2b) dan menambah 1 botol minyak (+i). Bentuk aljabar akhirnya adalah...", 
            options: [
                "A. 7b + 5i",
                "B. 3b + 3i",
                "C. 3b + 5i",
                "D. 3b + 4i"
            ], 
            ans: 2 
        },
        { 
            q: "Sederhanakan suku-suku sejenis pada ekspresi belanja bertingkat: 8a + 6g - 3a + 2g...", 
            options: [
                "A. 5a + 8g",
                "B. 11a + 8g",
                "C. 5a + 4g",
                "D. 13ag"
            ], 
            ans: 0 
        }
    ],

    13: [ // C5 - Suku Campuran Tiga Variabel
        { 
            q: "Bentuk sederhana dari ekspresi belanja tiga jenis barang: (4n + 2p + 3f) + 2n - 1p adalah...", 
            options: [
                "A. 6n + p + 3f",
                "B. 6n + 3p + 3f",
                "C. 2n + p + 3f",
                "D. 8npf"
            ], 
            ans: 0 
        },
        { 
            q: "Pada pesanan 5q + 3b + 2i + q - b, koefisien untuk variabel b dan q setelah disederhanakan berturut-turut adalah...", 
            options: [
                "A. 2 dan 5",
                "B. 2 dan 6",
                "C. 4 dan 6",
                "D. 3 dan 5"
            ], 
            ans: 1 
        }
    ],

    14: [ // C5 - Jebakan Informasi Tidak Relevan
        { 
            q: "Pelanggan berkata: 'Kemarin saya beli 3 apel, uang saya Rp 100.000, tapi hari ini saya HANYA membeli 4 jeruk (g) dan 2 kopi (h)'. Bentuk aljabar transaksi hari ini adalah...", 
            options: [
                "A. 3a + 4g + 2h",
                "B. 100g + 2h",
                "C. 4g + 2h",
                "D. 4g + 2h - 3a"
            ], 
            ans: 2 
        },
        { 
            q: "Mengapa informasi 'kemarin beli 3 apel' dan 'uang Rp 100.000' TIDAK dimasukkan ke dalam rumus kasir?", 
            options: [
                "A. Karena bukan bagian dari barang yang ditransaksikan saat ini (informasi distraktor)",
                "B. Karena harga apel terlalu murah",
                "C. Karena uang Rp 100.000 terlalu banyak",
                "D. Karena kasir lupa mencatat"
            ], 
            ans: 0 
        }
    ],

    15: [ // C5 - Gabungan Pesanan Rombongan
        { 
            q: "Budi memesan (2d + e), Siti memesan (3d + 2e), dan Rian memesan 1d. Berapakah jumlah total aljabar pesanan ketiga orang tersebut?", 
            options: [
                "A. 5d + 3e",
                "B. 6d + 3e",
                "C. 6d + 2e",
                "D. 9de"
            ], 
            ans: 1 
        },
        { 
            q: "Gabungan pesanan 3 meja kafe: (2h + l) + (3h + 2l) + (h + 3l). Setelah suku sejenis digabungkan, hasilnya adalah...", 
            options: [
                "A. 6h + 6l",
                "B. 5h + 5l",
                "C. 6h + 5l",
                "D. 12hl"
            ], 
            ans: 0 
        }
    ],

    16: [ // C6 - Sifat Distributif Paket Parcel
        { 
            q: "Pelanggan membeli 3 paket parcel hajatan, di mana tiap paket berisi 2 apel dan 1 karung beras (2a + b). Bentuk distributif 3(2a + b) adalah...", 
            options: [
                "A. 5a + 3b",
                "B. 6a + 3b",
                "C. 6a + b",
                "D. 2a + 3b"
            ], 
            ans: 1 
        },
        { 
            q: "Jika bentuk aljabar 4(f + 2h) dijabarkan menggunakan sifat distributif perkalian, hasilnya adalah...", 
            options: [
                "A. 4f + 8h",
                "B. 4f + 2h",
                "C. 5f + 6h",
                "D. 8fh"
            ], 
            ans: 0 
        }
    ],

    17: [ // C6 - Distributif Pecahan (Setengah Pesanan)
        { 
            q: "Pelanggan ingin mengambil setengah (1/2) dari pesanan awal (12c + 6k). Bentuk aljabar 1/2(12c + 6k) bernilai...", 
            options: [
                "A. 6c + 6k",
                "B. 12c + 3k",
                "C. 6c + 3k",
                "D. 24c + 12k"
            ], 
            ans: 2 
        },
        { 
            q: "Jika pesanan 10 apel (10a) dan 8 jeruk (8g) dipotong separuhnya (dikali 1/2), bentuk aljabar yang tersisa adalah...", 
            options: [
                "A. 5a + 4g",
                "B. 10a + 4g",
                "C. 5a + 8g",
                "D. 2a + 2g"
            ], 
            ans: 0 
        }
    ],

    18: [ // C6 - Distributif Parcel Bertingkat (Kurung Ganda)
        { 
            q: "Selesaikan bentuk aljabar kurung ganda: 2(3g + 2a) + 1(g + 4a)...", 
            options: [
                "A. 7g + 8a",
                "B. 5g + 6a",
                "C. 7g + 6a",
                "D. 15ga"
            ], 
            ans: 0 
        },
        { 
            q: "Hasil penjabaran dan penyederhanaan dari ekspresi 3(2n + l) + 2(n + 2l) adalah...", 
            options: [
                "A. 7n + 5l",
                "B. 8n + 7l",
                "C. 6n + 4l",
                "D. 9n + 8l"
            ], 
            ans: 1 
        }
    ],

    19: [ // C6 - Distributif dengan Koefisien Nol & Barang Batal
        { 
            q: "Pelanggan membeli 2 paket (2j + 3m), tetapi pada masing-masing paket kue gandusnya batal (0e). Bentuk aljabar 2(2j + 0e + 3m) disederhanakan menjadi...", 
            options: [
                "A. 4j + 0e + 6m",
                "B. 4j + 6m",
                "C. 10jm",
                "D. 4j + 2e + 6m"
            ], 
            ans: 1 
        },
        { 
            q: "Jika dalam evaluasi distributif tertulis 3(2q + 0d) - 2q, maka hasil akhirnya adalah...", 
            options: [
                "A. 6q + 0d",
                "B. 4q",
                "C. 4qd",
                "D. 0"
            ], 
            ans: 1 
        }
    ],

    20: [ // C6 - Ujian Akhir Sindikat Kelontong
        { 
            q: "Sederhanakan ekspresi transaksi akbar berikut: 2(3o + 4b) + 5n + 3i + 2j - b...", 
            options: [
                "A. 6o + 7b + 5n + 3i + 2j",
                "B. 6o + 8b + 5n + 3i + 2j",
                "C. 5o + 7b + 5n + 3i + 2j",
                "D. 6o + 3b + 5n + 3i + 2j"
            ], 
            ans: 0 
        },
        { 
            q: "Pesanan koperasi: 3(2f + 3q) + 2(f + 2i + 4a). Bentuk aljabar gabungan setelah disederhanakan adalah...", 
            options: [
                "A. 8f + 9q + 4i + 8a",
                "B. 7f + 9q + 4i + 8a",
                "C. 8f + 6q + 4i + 8a",
                "D. 6f + 9q + 2i + 4a"
            ], 
            ans: 0 
        }
    ]
};
