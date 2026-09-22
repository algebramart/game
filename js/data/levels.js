// ==========================================
// data/levels.js — Data Level & Objektif
// ==========================================

/** @type {Object.<number, Array<{order: Object, text: string, image: string, uangDibayarDetail: Object}>>} */
export const LEVEL_DATA = {
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

/**
 * Data 10 Level Tantangan Sulit (C4–C6) HOTS
 * @type {Object.<number, Array<{order: Object, text: string, image: string, uangDibayarDetail: Object}>>}
 */
export const LEVEL_DATA_HARD = {
    11: [ // C4 - Distributif Paket Hemat
        { order: { 'a': 6, 'l': 3 }, text: "Aku butuh <strong>3 paket parcel hajatan</strong>. Tiap paket berisi <strong>2 Apel (a)</strong> dan <strong>1 Roti (l)</strong>. Berapa total aljabarnya?", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'e': 6, 'd': 4 }, text: "Tolong siapkan <strong>2 bingkisan pengajian</strong>. Tiap bingkisan isinya <strong>3 Gandus (e)</strong> dan <strong>2 Dodol (d)</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 20000: 1, 5000: 1 } },
        { order: { 'f': 4, 'h': 8 }, text: "Ibu pesan <strong>4 paket arisan</strong>, masing-masing <strong>1 Gula (f)</strong> dan <strong>2 Kopi AAA (h)</strong> ya.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 1 } }
    ],
    12: [ // C4 - Revisi Keranjang Bertingkat
        { order: { 'b': 3, 'i': 5 }, text: "Aku bawa <strong>5 Beras (b)</strong> dan <strong>4 Minyak (i)</strong>. Eh, kembalikan <strong>2 Beras</strong> karena kantongnya robek, tapi tolong tambah <strong>1 Minyak</strong> lagi ya.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 100000: 1, 20000: 1 } },
        { order: { 'a': 5, 'g': 8 }, text: "Ambilkan <strong>8 Apel (a)</strong> dan <strong>6 Jeruk (g)</strong>. Tunggu, batalkan <strong>3 Apel</strong>, lalu tambahkan <strong>2 Jeruk</strong> lagi buat bekal.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'l': 5, 'm': 4 }, text: "Keranjangku ada <strong>7 Roti (l)</strong> dan <strong>5 Sabun (m)</strong>. Karena berat, kurangi <strong>2 Roti</strong> dan kurangi <strong>1 Sabun</strong> ya.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1 } }
    ],
    13: [ // C5 - Suku Campuran Banyak Variabel
        { order: { 'n': 6, 'p': 1, 'f': 3 }, text: "Pesanan dapur umum: <strong>4 Telur (n)</strong>, <strong>2 Tepung (p)</strong>, dan <strong>3 Gula (f)</strong>. Eh tambah <strong>2 Telur</strong> lagi, tapi <strong>1 Tepung</strong> dibatalkan ya.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1, 10000: 1 } },
        { order: { 'q': 6, 'b': 2, 'i': 2 }, text: "Beli bahan masak: <strong>5 Terong (q)</strong>, <strong>3 Beras (b)</strong>, <strong>2 Minyak (i)</strong>. Terongnya tambah <strong>1</strong>, Berasnya batal <strong>1</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 100000: 1 } },
        { order: { 'c': 4, 'k': 3, 'l': 3 }, text: "Perlengkapan sekolah: <strong>6 Buku (c)</strong>, <strong>4 Pena (k)</strong>, dan <strong>3 Roti (l)</strong>. Temanku batal titip, jadi kurangi <strong>2 Buku</strong> dan <strong>1 Pena</strong>.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1 } }
    ],
    14: [ // C5 - Jebakan Informasi Tidak Relevan
        { order: { 'g': 4, 'h': 2 }, text: "Aku punya uang Rp 100.000 dan mau beli <strong>4 Jeruk (g)</strong> serta <strong>2 Kopi (h)</strong>. Kemarin aku beli 3 Apel tapi hari ini tidak usah.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'l': 3, 'a': 2 }, text: "Adikku minta 5 Sabun, tapi uangnya kutitipkan ke paman. Aku sendiri cuma beli <strong>3 Roti (l)</strong> dan <strong>2 Apel (a)</strong> ya kasir.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'b': 2, 'f': 4 }, text: "Tadi di jalan aku lihat ada promo 10 Beras. Tapi motorku cuma muat <strong>2 Beras (b)</strong> dan <strong>4 Gula (f)</strong> saja.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 1 } }
    ],
    15: [ // C5 - Gabungan Pesanan 3 Orang
        { order: { 'd': 6, 'e': 3 }, text: "Titipan belanja: Budi pesan <strong>2 Dodol (d) & 1 Gandus (e)</strong>; Siti pesan <strong>3 Dodol & 2 Gandus</strong>; Rian hanya pesan <strong>1 Dodol</strong>.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 20000: 1, 5000: 1 } },
        { order: { 'h': 6, 'l': 6 }, text: "Pesanan 3 meja warung: Meja satu butuh <strong>2 Kopi (h) & 1 Roti (l)</strong>; Meja dua butuh <strong>3 Kopi & 2 Roti</strong>; Meja tiga butuh <strong>1 Kopi & 3 Roti</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1, 20000: 1 } },
        { order: { 'i': 5, 'p': 5 }, text: "Rombongan arisan: Bu Ani pesan <strong>2 Minyak (i)</strong>; Bu Tina pesan <strong>1 Minyak & 3 Tepung (p)</strong>; Bu Mega pesan <strong>2 Minyak & 2 Tepung</strong>.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 1, 20000: 1 } }
    ],
    16: [ // C6 - Koefisien Pecahan / Setengah Pesanan
        { order: { 'c': 6, 'k': 3 }, text: "Grosir toko: Aku mau <strong>12 Buku (c)</strong> dan <strong>6 Pena (k)</strong>. Waduh dompetku ketinggalan, kurangi setengahnya jadi <strong>ambil separuh saja</strong> dari semuanya ya!", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'a': 5, 'g': 4 }, text: "Awalnya pesan <strong>10 Apel (a)</strong> dan <strong>8 Jeruk (g)</strong>. Karena tas motorku sempit, tolong potong <strong>separuh (50%)</strong> untuk masing-masing buah ya.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 20000: 1 } },
        { order: { 'm': 3, 'i': 2 }, text: "Pesan <strong>6 Sabun (m)</strong> dan <strong>4 Minyak (i)</strong>, tapi uang teman belum cair, jadi layani <strong>setengah dari Sabun</strong> dan <strong>setengah dari Minyak</strong> dulu.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1 } }
    ],
    17: [ // C6 - Substitusi Anggaran Terbatas
        { order: { 'o': 2, 'q': 5 }, text: "Uangku pas Rp 45.000. Aku beli <strong>2 Tempoyak (o)</strong> seharga Rp 15.000 per botol. Sisa uangnya tolong habiskan pas untuk beli <strong>Terong (q)</strong> seharga Rp 3.000.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'b': 1, 'c': 4 }, text: "Uangku pas Rp 35.000. Aku pesan <strong>1 Beras (b)</strong> seharga Rp 15.000, dan sisanya pas habis untuk membeli <strong>4 Buku (c)</strong> seharga Rp 5.000.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'i': 2, 'n': 11 }, text: "Aku bawa modal Rp 50.000. Aku beli <strong>2 Minyak (i)</strong> seharga Rp 14.000. Sisa uangnya tolong habiskan pas untuk membeli <strong>11 Telur (n)</strong> seharga Rp 2.000.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1 } }
    ],
    18: [ // C6 - Aljabar Bertanda Kurung Ganda
        { order: { 'g': 7, 'a': 8 }, text: "Aku beli <strong>2 keranjang parcel</strong> yang tiap keranjang berisi <strong>(3 Jeruk [g] + 2 Apel [a])</strong>, lalu ditambah <strong>1 keranjang</strong> berisi <strong>(1 Jeruk [g] + 4 Apel [a])</strong>.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'n': 8, 'l': 7 }, text: "Paket sarapan: <strong>3 porsi</strong> masing-masing <strong>(2 Telur [n] + 1 Roti [l])</strong> ditambah <strong>2 porsi</strong> masing-masing <strong>(1 Telur [n] + 2 Roti [l])</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1, 10000: 1 } },
        { order: { 'c': 12, 'k': 11 }, text: "Paket kantor: <strong>2 paket</strong> isi <strong>(3 Buku [c] + 4 Pena [k])</strong> dan <strong>3 paket</strong> isi <strong>(2 Buku [c] + 1 Pena [k])</strong>.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 1 } }
    ],
    19: [ // C6 - Jebakan Koefisien Nol & Barang Serupa
        { order: { 'j': 5, 'm': 3 }, text: "Aku pesan <strong>5 Padamaran (j)</strong>. Tadi mau 4 Gandus tapi stoknya kosong (<strong>0e</strong>), jadi gantinya beli <strong>3 Sabun (m)</strong> saja ya.", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'q': 6, 'o': 2 }, text: "Tolong siapkan <strong>6 Terong (q)</strong>. Oh iya, dodol nanasnya batal (<strong>0d</strong>), tepungnya juga gak jadi (<strong>0p</strong>), tapi tambahkan <strong>2 Tempoyak (o)</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 50000: 1 } },
        { order: { 'e': 8, 'j': 6 }, text: "Mau borong kue tradisional: <strong>8 Gandus (e)</strong> dan <strong>6 Padamaran (j)</strong>. Roti dan kopinya batal semua (<strong>0l + 0h</strong>).", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 50000: 1 } }
    ],
    20: [ // C6 - Ujian Akhir Sindikat Kelontong
        { order: { 'o': 6, 'b': 7, 'n': 5, 'i': 3, 'j': 2 }, text: "Borongan hajatan akbar: Beli <strong>2 paket</strong> isi <strong>(3 Tempoyak [o] + 4 Beras [b])</strong>, lalu ada tambahan <strong>5 Telur [n]</strong>, <strong>3 Minyak [i]</strong>, dan <strong>2 Padamaran [j]</strong>. Tapi batalkan <strong>1 Beras</strong> karena karungnya bocor!", image: "assets/customers/pelanggan-1.png", uangDibayarDetail: { 100000: 3 } },
        { order: { 'f': 8, 'q': 9, 'i': 4, 'a': 8 }, text: "Pesanan koperasi: <strong>3 paket sembako</strong> masing-masing <strong>(2 Gula [f] + 3 Terong [q])</strong>, ditambah <strong>2 paket</strong> masing-masing <strong>(1 Gula [f] + 2 Minyak [i] + 4 Apel [a])</strong>.", image: "assets/customers/pelanggan-2.png", uangDibayarDetail: { 100000: 2 } },
        { order: { 'b': 8, 'f': 7, 'd': 8, 'e': 6, 'm': 5 }, text: "Gudang perbekalan desa: Bawa <strong>10 Beras (b)</strong>, <strong>10 Gula (f)</strong>, <strong>8 Dodol (d)</strong>, <strong>6 Gandus (e)</strong>, dan <strong>5 Sabun (m)</strong>. Kurangi <strong>2 Beras</strong> dan <strong>3 Gula</strong> untuk dipindah ke pos ronda.", image: "assets/customers/pelanggan-3.png", uangDibayarDetail: { 100000: 3 } }
    ]
};

// Gabungkan LEVEL_DATA_HARD ke dalam LEVEL_DATA utama
Object.assign(LEVEL_DATA, LEVEL_DATA_HARD);

/** @type {Object.<number, string>} */
export const LEVEL_OBJECTIVES = {
    1:  "Pengenalan Variabel",
    2:  "Sifat Komutatif",
    3:  "Penjumlahan & Pengurangan Sejenis",
    4:  "Pengenalan Koefisien",
    5:  "Substitusi Nilai Variabel 1",
    6:  "Penyederhanaan Ekspresi Gabungan",
    7:  "Substitusi Nilai Variabel 2",
    8:  "Evaluasi Persamaan Ekuivalen",
    9:  "Makna Koefisien Nol",
    10: "Tantangan Terakhir",
    11: "C4 - Distributif Paket Hemat",
    12: "C4 - Revisi Keranjang Bertingkat",
    13: "C5 - Suku Campuran Banyak Variabel",
    14: "C5 - Jebakan Informasi Tidak Relevan",
    15: "C5 - Gabungan Pesanan 3 Orang",
    16: "C6 - Koefisien Pecahan & Setengah Pesanan",
    17: "C6 - Substitusi Anggaran Terbatas",
    18: "C6 - Aljabar Bertanda Kurung Ganda",
    19: "C6 - Jebakan Koefisien Nol & Barang Serupa",
    20: "C6 - Ujian Akhir Sindikat Kelontong"
};

