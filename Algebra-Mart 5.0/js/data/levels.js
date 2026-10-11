// ==========================================
// data/levels.js — Data Kurikulum & Level Scaffolding Algebra-Mart
// ==========================================

/**
 * Konfigurasi 10 Level Tantangan Mudah (C1–C3)
 * @type {Object.<number, Array<{order: Object, text: string, image: string, uangDibayarDetail: Object}>>}
 */
export const LEVEL_DATA = {
    // ----------------------------------------------------
    // FASE 1: VARIABEL MURNI (1 JENIS BARANG PER TRANSAKSI)
    // ----------------------------------------------------
    1: [ // Fase 1: Konsep Variabel Tunggal & Koefisien
        { 
            order: { 'j': 4 }, 
            text: "Harga satu kotak kue padamaran adalah j rupiah. Tolong bungkuskan 4 kotak kue padamaran ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'd': 5 }, 
            text: "Harga satu kotak dodol nanas adalah d rupiah. Saya ingin membeli 5 kotak dodol nanas untuk camilan keluarga.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'c': 6 }, 
            text: "Harga satu buah buku tulis adalah c rupiah. Tolong siapkan 6 buah buku tulis untuk catatan belajar saya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    2: [ // Fase 1: Penjumlahan Suku Sejenis
        { 
            order: { 'd': 7 }, 
            text: "Harga satu kotak dodol nanas adalah d rupiah. Tolong siapkan 3 dodol nanas seharga d rupiah. Eh, tambahkan 4 dodol nanas lagi untuk oleh-oleh.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'e': 5 }, 
            text: "Harga satu piring kue gandus adalah e rupiah. Saya pesan 2 kue gandus seharga e rupiah, lalu tolong tambahkan 3 kue gandus lagi ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 10000: 1 } 
        },
        { 
            order: { 'c': 6 }, 
            text: "Harga satu buah buku tulis adalah c rupiah. Saya beli 4 buku tulis seharga c rupiah, lalu adik saya minta ditambah 2 buku tulis lagi.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    3: [ // Fase 1: Pengurangan Suku Sejenis (Pembatalan Pesanan)
        { 
            order: { 'j': 3 }, 
            text: "Harga satu kotak kue padamaran adalah j rupiah. Awalnya saya mau beli 5 kue padamaran seharga j rupiah. Tapi maaf, batalkan 2 kue ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 10000: 1 } 
        },
        { 
            order: { 'd': 4 }, 
            text: "Harga satu kotak dodol nanas adalah d rupiah. Tolong siapkan 6 dodol nanas. Aduh kantong belanja saya sempit, tolong batalkan 2 dodol nanas ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'c': 4 }, 
            text: "Harga satu buah buku tulis adalah c rupiah. Tadi saya minta ambilkan 7 buku tulis, tetapi karena uang saya pas-pasan, batalkan 3 buku tulis ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1 } 
        }
    ],

    // ----------------------------------------------------
    // FASE 2: DUA VARIABEL (GABUNGAN 2 JENIS BARANG BERBEDA)
    // ----------------------------------------------------
    4: [ // Fase 2: Pengenalan Dua Variabel Berbeda
        { 
            order: { 'b': 2, 'i': 3 }, 
            text: "Harga satu karung beras adalah b rupiah, dan harga satu botol minyak goreng adalah i rupiah. Tolong bungkuskan 2 karung beras dan 3 botol minyak goreng.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 4, 'g': 3 }, 
            text: "Harga satu buah apel adalah a rupiah, dan harga satu buah jeruk adalah g rupiah. Saya mau beli 4 buah apel dan 3 buah jeruk.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'e': 4, 'd': 2 }, 
            text: "Harga satu kue gandus adalah e rupiah, dan harga satu kotak dodol nanas adalah d rupiah. Siapkan 4 kue gandus dan 2 dodol nanas ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1 } 
        }
    ],

    5: [ // Fase 2: Penjumlahan Suku Sejenis pada Dua Variabel
        { 
            order: { 'b': 2, 'i': 3 }, 
            text: "Harga satu karung beras adalah b rupiah, dan harga satu botol minyak adalah i rupiah. Ambilkan 2 karung beras dan 1 botol minyak. Eh, tambahkan 2 botol minyak lagi ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 5, 'b': 2 }, 
            text: "Harga satu buah apel adalah a rupiah, dan harga satu karung beras adalah b rupiah. Saya pesan 3 apel dan 2 karung beras, lalu tolong tambahkan 2 apel lagi.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'c': 6, 'k': 3 }, 
            text: "Harga satu buku tulis adalah c rupiah, dan harga satu pena adalah k rupiah. Saya ambil 4 buku dan 2 pena, lalu adik saya menambah 2 buku dan 1 pena lagi.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    6: [ // Fase 2: Pengurangan Suku Sejenis pada Dua Variabel
        { 
            order: { 'b': 3, 'i': 3 }, 
            text: "Harga satu karung beras adalah b rupiah, dan harga satu botol minyak adalah i rupiah. Tadi saya minta 4 karung beras dan 3 botol minyak. Tapi tolong batalkan 1 karung beras ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 5, 'g': 2 }, 
            text: "Harga satu buah apel adalah a rupiah, dan harga satu buah jeruk adalah g rupiah. Keranjang saya berisi 5 apel dan 4 jeruk. Tolong kurangi 2 buah jeruk karena terlalu berat.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'f': 2, 'i': 3 }, 
            text: "Harga satu bungkus gula adalah f rupiah, dan harga satu botol minyak adalah i rupiah. Tolong siapkan 4 gula dan 4 minyak. Tapi tolong batalkan 2 gula dan batalkan 1 minyak ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1, 20000: 1 } 
        }
    ],

    7: [ // Fase 2: Penegasan Suku Tidak Sejenis (Tidak Dapat Digabung)
        { 
            order: { 'b': 3, 'i': 2 }, 
            text: "Harga satu karung beras adalah b rupiah dan harga satu botol minyak adalah i rupiah. Saya beli 3 karung beras dan 2 botol minyak. Ingat kasir, beras dan minyak barang berbeda sehingga tidak bisa disatukan jadi 5bi.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'a': 6, 'g': 4 }, 
            text: "Harga satu buah apel adalah a rupiah dan harga satu buah jeruk adalah g rupiah. Ambil 4 apel dan 5 jeruk. Lalu tambah 2 apel lagi, tapi kurangi 1 jeruk ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'e': 3, 'j': 8 }, 
            text: "Harga satu kue gandus adalah e rupiah dan harga satu kue padamaran adalah j rupiah. Saya pesan 4 gandus dan 6 padamaran. Kurangi 1 gandus dan tambah 2 padamaran.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        }
    ],

    // ----------------------------------------------------
    // FASE 3: SIFAT-SIFAT OPERASI ALJABAR
    // ----------------------------------------------------
    8: [ // Sifat Komutatif Penjumlahan Aljabar
        { 
            order: { 'a': 4, 'd': 2 }, 
            text: "Harga satu apel adalah a rupiah dan harga satu dodol adalah d rupiah. Tolong bungkuskan 4 apel dan 2 dodol. Sesuai sifat komutatif aljabar, 4a + 2d bernilai sama persis dengan 2d + 4a.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'b': 2, 'c': 3 }, 
            text: "Harga satu karung beras adalah b rupiah dan harga satu buku adalah c rupiah. Saya sebut buku dulu: 3 buku dan 2 karung beras (3c + 2b). Disusun terbalik 2b + 3c pun harganya tetap sama.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'f': 4, 'i': 1 }, 
            text: "Harga satu botol minyak adalah i rupiah dan harga satu bungkus gula adalah f rupiah. Siapkan 1 botol minyak dan 4 bungkus gula. Urutan 1i + 4f sama dengan 4f + 1i.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    9: [ // Makna Koefisien Nol (0)
        { 
            order: { 'a': 4 }, 
            text: "Harga satu buah apel adalah a rupiah dan harga satu karung beras adalah b rupiah. Saya beli 4 apel dan 0 karung beras (4a + 0b). Karena 0b bernilai nol, kasir cukup mencatat 4a.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 10000: 1 } 
        },
        { 
            order: { 'd': 5 }, 
            text: "Harga satu kotak dodol adalah d rupiah dan harga satu kue gandus adalah e rupiah. Tadi mau beli gandus tapi batal (0e). Jadi saya hanya membeli 5 dodol nanas (5d + 0e = 5d).", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'c': 4 }, 
            text: "Harga satu buku adalah c rupiah, harga apel adalah a rupiah, dan beras b rupiah. Saya hanya beli 4 buku, berasnya 0 dan apelnya 0 (4c + 0a + 0b = 4c).", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 20000: 1 } 
        }
    ],

    10: [ // Sintesis & Evaluasi Akhir
        { 
            order: { 'b': 5, 'i': 2 }, 
            text: "Harga satu karung beras adalah b rupiah, minyak adalah i rupiah, dan apel adalah a rupiah. Pesanan meja satu: 3 beras dan 2 minyak. Meja dua: 2 beras dan 0 apel (3b + 2i + 2b + 0a).", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1, 20000: 1 } 
        },
        { 
            order: { 'a': 8, 'd': 1 }, 
            text: "Harga satu apel adalah a rupiah dan harga satu dodol adalah d rupiah. Saya bawa 6 apel dan 2 dodol, lalu tambah 2 apel lagi, tapi batalkan 1 dodol (6a + 2a + 2d - 1d).", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'j': 5, 'e': 4, 'd': 3 }, 
            text: "Harga satu kue padamaran adalah j rupiah, gandus e rupiah, dan dodol d rupiah. Siapkan paket kue tradisional: 5 padamaran, 4 gandus, dan 3 dodol seharga masing-masing rupiah.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ]
};

/**
 * Data 10 Level Tantangan Sulit (C4–C6) HOTS
 * @type {Object.<number, Array<{order: Object, text: string, image: string, uangDibayarDetail: Object}>>}
 */
export const LEVEL_DATA_HARD = {
    // ----------------------------------------------------
    // FASE 4: SUBSTITUSI RIIL NILAI VARIABEL (HOTS C4–C5)
    // ----------------------------------------------------
    11: [ // C4 - Substitusi Riil Dua Variabel
        { 
            order: { 'b': 3, 'i': 2 }, 
            text: "Harga satu karung beras adalah b rupiah dengan nilai b = 15.000, dan harga satu botol minyak adalah i rupiah dengan i = 14.000. Tolong bungkuskan 3 karung beras dan 2 botol minyak.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'e': 6, 'd': 4 }, 
            text: "Harga satu kue gandus adalah e rupiah dengan e = 1.500, dan harga satu dodol adalah d rupiah dengan d = 3.000. Saya pesan 6 kue gandus dan 4 kotak dodol nanas.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        },
        { 
            order: { 'f': 4, 'h': 5 }, 
            text: "Harga satu bungkus gula adalah f rupiah dengan f = 12.000, dan harga satu bungkus kopi adalah h rupiah dengan h = 4.000. Ambilkan 4 bungkus gula dan 5 bungkus kopi ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    12: [ // C4 - Revisi Keranjang Bertingkat (Substitusi Riil)
        { 
            order: { 'b': 3, 'i': 5 }, 
            text: "Harga satu karung beras adalah b rupiah (b = 15.000), dan harga satu botol minyak adalah i rupiah (i = 14.000). Awalnya bawa 5 beras dan 4 minyak. Tolong kembalikan 2 beras dan tambah 1 minyak ya.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 1, 20000: 1 } 
        },
        { 
            order: { 'a': 5, 'g': 8 }, 
            text: "Harga satu apel adalah a rupiah (a = 2.000) dan satu jeruk adalah g rupiah (g = 2.500). Tadi ambil 8 apel dan 6 jeruk. Tolong batalkan 3 apel dan tambahkan 2 jeruk lagi.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'l': 5, 'm': 4 }, 
            text: "Harga satu roti adalah l rupiah (l = 6.000) dan satu sabun adalah m rupiah (m = 4.000). Keranjang berisi 7 roti dan 5 sabun. Karena tas berat, kurangi 2 roti dan kurangi 1 sabun ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    13: [ // C5 - Suku Campuran Tiga Variabel dengan Substitusi
        { 
            order: { 'n': 6, 'p': 1, 'f': 3 }, 
            text: "Harga satu butir telur adalah n rupiah (n = 2.000), satu tepung adalah p rupiah (p = 8.000), dan satu gula adalah f rupiah (f = 12.000). Pesanan: 4 telur, 2 tepung, 3 gula. Lalu tambah 2 telur dan batalkan 1 tepung.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1, 10000: 1 } 
        },
        { 
            order: { 'q': 6, 'b': 2, 'i': 2 }, 
            text: "Harga satu terong adalah q rupiah (q = 3.000), beras b rupiah (b = 15.000), dan minyak i rupiah (i = 14.000). Beli 5 terong, 3 beras, 2 minyak. Terongnya tambah 1, berasnya batal 1 ya.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 100000: 1 } 
        },
        { 
            order: { 'c': 4, 'k': 3, 'l': 3 }, 
            text: "Harga satu buku c rupiah (c = 5.000), pena k rupiah (k = 3.000), dan roti l rupiah (l = 6.000). Ambil 6 buku, 4 pena, 3 roti. Teman batal titip, jadi kurangi 2 buku dan kurangi 1 pena ya.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    14: [ // C5 - Jebakan Informasi Tidak Relevan (Substitusi Riil)
        { 
            order: { 'g': 4, 'h': 2 }, 
            text: "Harga satu jeruk adalah g rupiah (g = 2.500) dan kopi h rupiah (h = 4.000). Saya mau beli 4 jeruk dan 2 kopi. Kemarin saya beli 3 apel seharga a rupiah, tapi hari ini tidak beli apel sama sekali.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'l': 3, 'a': 2 }, 
            text: "Harga satu roti adalah l rupiah (l = 6.000) dan satu apel adalah a rupiah (a = 2.000). Adik saya minta 5 sabun, tapi dibeli di toko lain. Di sini saya hanya beli 3 roti dan 2 apel saja ya kasir.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'b': 2, 'f': 4 }, 
            text: "Harga satu karung beras b rupiah (b = 15.000) dan gula f rupiah (f = 12.000). Di spanduk ada promo 10 minyak, tapi motor saya hanya muat belanja 2 karung beras dan 4 bungkus gula saja.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    15: [ // C5 - Gabungan Pesanan Rombongan / 3 Orang
        { 
            order: { 'd': 6, 'e': 3 }, 
            text: "Harga satu dodol d rupiah (d = 3.000) dan gandus e rupiah (e = 1.500). Titipan belanja: Budi pesan 2 dodol dan 1 gandus; Siti pesan 3 dodol dan 2 gandus; Rian pesan 1 dodol saja.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        },
        { 
            order: { 'h': 6, 'l': 6 }, 
            text: "Harga satu kopi h rupiah (h = 4.000) dan roti l rupiah (l = 6.000). Pesanan 3 meja: Meja satu 2 kopi dan 1 roti; Meja dua 3 kopi dan 2 roti; Meja tiga 1 kopi dan 3 roti.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1, 20000: 1 } 
        },
        { 
            order: { 'i': 5, 'p': 5 }, 
            text: "Harga satu botol minyak i rupiah (i = 14.000) dan tepung p rupiah (p = 8.000). Bu Ani titip 2 minyak; Bu Tina titip 1 minyak dan 3 tepung; Bu Mega titip 2 minyak dan 2 tepung.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1, 20000: 1 } 
        }
    ],

    // ----------------------------------------------------
    // FASE 5: SIFAT DISTRIBUTIF PARCEL & HAJATAN (HOTS C6)
    // ----------------------------------------------------
    16: [ // C6 - Sifat Distributif Paket Parcel Hajatan
        { 
            order: { 'a': 6, 'b': 3 }, 
            text: "Harga satu buah apel adalah a rupiah dan harga satu karung beras adalah b rupiah. Saya membutuhkan 3 paket parcel hajatan. Setiap paket berisi 2 apel dan 1 karung beras: 3(2a + 1b) = 6a + 3b.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1, 10000: 1 } 
        },
        { 
            order: { 'e': 6, 'd': 4 }, 
            text: "Harga satu kue gandus adalah e rupiah dan harga satu dodol adalah d rupiah. Tolong siapkan 2 bingkisan hajatan. Setiap bingkisan berisi 3 kue gandus dan 2 dodol: 2(3e + 2d) = 6e + 4d.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1, 5000: 1 } 
        },
        { 
            order: { 'f': 4, 'h': 8 }, 
            text: "Harga satu bungkus gula adalah f rupiah dan harga satu kopi adalah h rupiah. Ibu memesan 4 paket arisan. Tiap paket berisi 1 gula dan 2 kopi: 4(1f + 2h) = 4f + 8h.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    17: [ // C6 - Distributif Pecahan (Setengah Pesanan)
        { 
            order: { 'c': 6, 'k': 3 }, 
            text: "Harga satu buku adalah c rupiah dan satu pena k rupiah. Awalnya pesan 12 buku dan 6 pena (12c + 6k). Karena uang kurang, tolong ambil separuhnya saja: 1/2(12c + 6k) = 6c + 3k.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'a': 5, 'g': 4 }, 
            text: "Harga satu apel adalah a rupiah dan satu jeruk g rupiah. Pesanan awal 10 apel dan 8 jeruk (10a + 8g). Tolong bagi dua (50%) untuk masing-masing buah: 1/2(10a + 8g) = 5a + 4g.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 20000: 1 } 
        },
        { 
            order: { 'm': 3, 'i': 2 }, 
            text: "Harga satu sabun m rupiah dan satu botol minyak i rupiah. Kami pesan 6 sabun dan 4 minyak (6m + 4i). Tapi layani separuh pesanan saja dulu: 1/2(6m + 4i) = 3m + 2i.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    18: [ // C6 - Distributif Parcel Bertingkat (Kurung Ganda)
        { 
            order: { 'g': 7, 'a': 8 }, 
            text: "Harga satu jeruk adalah g rupiah dan satu apel adalah a rupiah. Beli 2 parcel berisi (3g + 2a) ditambah 1 parcel berisi (1g + 4a). Totalnya: 2(3g + 2a) + 1(1g + 4a) = 7g + 8a.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'n': 8, 'l': 7 }, 
            text: "Harga satu butir telur n rupiah dan satu roti l rupiah. Paket sarapan: 3 porsi (2n + 1l) ditambah 2 porsi (1n + 2l). Totalnya: 3(2n + 1l) + 2(1n + 2l) = 8n + 7l.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1, 10000: 1 } 
        },
        { 
            order: { 'c': 12, 'k': 11 }, 
            text: "Harga satu buku c rupiah dan satu pena k rupiah. Paket kantor: 2 paket (3c + 4k) ditambah 3 paket (2c + 1k). Totalnya: 2(3c + 4k) + 3(2c + 1k) = 12c + 11k.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 1 } 
        }
    ],

    19: [ // C6 - Distributif dengan Koefisien Nol & Barang Batal
        { 
            order: { 'j': 5, 'm': 3 }, 
            text: "Harga satu kue padamaran j rupiah, gandus e rupiah, dan sabun m rupiah. Saya pesan 5 padamaran dan 0 gandus, ditambah 3 sabun (5j + 0e + 3m). Cukup hitung 5j + 3m saja.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'q': 6, 'o': 2 }, 
            text: "Harga satu terong q rupiah, tempoyak o rupiah, dan dodol d rupiah. Tolong siapkan 6 terong, 2 tempoyak, dan 0 dodol (6q + 2o + 0d). Dodol nanasnya dibatalkan jadi 0d.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 50000: 1 } 
        },
        { 
            order: { 'e': 8, 'j': 6 }, 
            text: "Harga satu gandus e rupiah, padamaran j rupiah, dan roti l rupiah. Mau borong 8 gandus dan 6 padamaran. Rotinya batal semua jadi 0 roti (8e + 6j + 0l = 8e + 6j).", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 50000: 1 } 
        }
    ],

    20: [ // C6 - Ujian Akhir Sindikat Kelontong HOTS (Distributif Akbar)
        { 
            order: { 'o': 6, 'b': 7, 'n': 5, 'i': 3, 'j': 2 }, 
            text: "Harga tempoyak o rupiah, beras b rupiah, telur n rupiah, minyak i rupiah, dan padamaran j rupiah. Borongan hajatan: 2 paket (3o + 4b), ditambah 5n + 3i + 2j, lalu batalkan 1b: 2(3o + 4b) + 5n + 3i + 2j - 1b.", 
            image: "assets/customers/pelanggan-1.png", 
            uangDibayarDetail: { 100000: 3 } 
        },
        { 
            order: { 'f': 8, 'q': 9, 'i': 4, 'a': 8 }, 
            text: "Harga gula f rupiah, terong q rupiah, minyak i rupiah, dan apel a rupiah. Koperasi pesan 3 paket (2f + 3q) ditambah 2 paket (1f + 2i + 4a). Totalnya: 3(2f + 3q) + 2(1f + 2i + 4a) = 8f + 9q + 4i + 8a.", 
            image: "assets/customers/pelanggan-2.png", 
            uangDibayarDetail: { 100000: 2 } 
        },
        { 
            order: { 'b': 8, 'f': 7, 'd': 8, 'e': 6, 'm': 5 }, 
            text: "Harga beras b rupiah, gula f rupiah, dodol d rupiah, gandus e rupiah, dan sabun m rupiah. Awalnya bawa 10b + 10f + 8d + 6e + 5m. Karena dipindah ke pos lain, kurangi 2 beras dan 3 gula: (10b - 2b) + (10f - 3f) + 8d + 6e + 5m.", 
            image: "assets/customers/pelanggan-3.png", 
            uangDibayarDetail: { 100000: 3 } 
        }
    ]
};

// Gabungkan LEVEL_DATA_HARD ke dalam LEVEL_DATA utama
Object.assign(LEVEL_DATA, LEVEL_DATA_HARD);

/** @type {Object.<number, string>} */
export const LEVEL_OBJECTIVES = {
    1:  "Fase 1: Konsep Variabel Tunggal & Koefisien",
    2:  "Fase 1: Penjumlahan Suku Sejenis",
    3:  "Fase 1: Pengurangan Suku Sejenis (Pembatalan)",
    4:  "Fase 2: Pengenalan Dua Variabel Berbeda",
    5:  "Fase 2: Penjumlahan Suku Sejenis pada Dua Variabel",
    6:  "Fase 2: Pengurangan Suku Sejenis pada Dua Variabel",
    7:  "Fase 2: Penegasan Suku Tidak Sejenis",
    8:  "Sifat Operasi: Sifat Komutatif Penjumlahan Aljabar",
    9:  "Sifat Operasi: Makna Koefisien Nol (0)",
    10: "Sifat Operasi: Sintesis & Evaluasi Akhir",
    11: "HOTS C4: Substitusi Riil Dua Variabel",
    12: "HOTS C4: Revisi Keranjang Bertingkat",
    13: "HOTS C5: Suku Campuran Tiga Variabel",
    14: "HOTS C5: Jebakan Informasi Tidak Relevan",
    15: "HOTS C5: Gabungan Pesanan Rombongan",
    16: "HOTS C6: Sifat Distributif Paket Parcel",
    17: "HOTS C6: Distributif Pecahan (Setengah Pesanan)",
    18: "HOTS C6: Distributif Parcel Bertingkat",
    19: "HOTS C6: Distributif dengan Koefisien Nol",
    20: "HOTS C6: Ujian Akhir Sindikat Kelontong"
};
