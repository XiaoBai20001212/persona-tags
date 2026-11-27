[简体中文](../README.md) | [English](README.en.md) | [繁體中文](README.zh-TW.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [ไทย](README.th.md) | [Tiếng Việt](README.vi.md) | **Bahasa Indonesia**

# Persona Tags

Ekstensi manajemen Persona tingkat lanjut untuk SillyTavern.

Saat daftar persona Anda makin banyak, melacak siapa dan peran masing-masing persona menjadi cepat merepotkan. Ekstensi ini memungkinkan Anda memberi tag pada persona, menyaring berdasarkan tag, mengelola secara massal, serta mengatur ulang urutan dengan bebas agar semuanya tetap rapi dan mudah ditemukan.

| Tampilan Utama & Pemilih Tag | Filter Tag & Mode Massal |
| :---: | :---: |
| ![Tampilan Utama & Pemilih Tag](images/en-overview.png) | ![Filter Tag & Mode Massal](images/en-batch.png) |

## Fitur

### Sistem Tag
- Tambahkan tag ke persona (pisahkan dengan koma untuk menambahkan beberapa tag sekaligus)
- Pemilih cepat **Existing Tags** yang dapat diperluas di kolom kanan (otomatis menyembunyikan tag yang sudah ada pada persona saat ini, dengan gulir halus saat jumlah tag banyak)
- Saring persona berdasarkan tag dengan mode **Include** (hanya tampilkan yang cocok) dan **Exclude** (sembunyikan yang cocok)
- Tekan lama tag di panel filter untuk menyeret dan mengatur ulang urutannya
- Tag yang digunakan oleh persona yang terhubung ke karakter saat ini akan berpendar halus
- Menampilkan tag langsung pada setiap kartu persona
- Tambahkan tag awal langsung di dalam dialog pembuatan persona baru

### Manajemen Massal
- Klik **Batch** untuk masuk ke mode massal dengan kotak centang di setiap kartu
- Pilih Semua / Bersihkan pilihan
- Tambah tag massal, hapus tag massal, dan hapus persona secara massal

### Pengurutan & Posisi
- Tekan lama kartu persona untuk menyeret dan mengatur ulang urutan (nyaman digunakan di ponsel)
- Masukkan nomor posisi persis di kolom kanan untuk langsung melompat ke posisi tersebut
- Menampilkan indeks posisi saat ini di setiap kartu
- Urutan terpisah secara independen untuk daftar **All** persona maupun daftar persona terhubung pada masing-masing karakter/grup

### Tampilan & Navigasi
- Tampilan **Connected**: hanya menampilkan persona yang terhubung ke karakter/grup saat ini
- Tampilan **All**: menampilkan seluruh persona
- Tombol lompat cepat **↑ / ↓** di bagian atas: melompat sesuai jumlah persona yang diatur (default `10`, tersimpan antar sesi); tekan lama `0.5s` untuk langsung ke paling atas atau paling bawah
- Tombol muat ulang manual untuk menyegarkan daftar
- Mendukung tampilan daftar maupun tampilan kisi

### Lokalisasi & Lainnya
- Dukungan penuh untuk seluruh **17 bahasa antarmuka resmi SillyTavern**, otomatis mengikuti pengaturan bahasa SillyTavern Anda (bahasa yang belum didukung atau bahasa baru di masa mendatang akan otomatis kembali ke bahasa Inggris)
- Kotak centang opsional **Copy tags** dan **Copy connections** saat menggandakan persona
- Jendela pop-up pemilihan banyak persona yang ditingkatkan, menampilkan avatar, nama, dan tag ketika beberapa persona terhubung ke karakter yang sama
- Pencadangan & pemulihan persona otomatis menyertakan tag, urutan kustom, serta pengaturan lompat cepat

## Instalasi

### Metode 1: Instal di dalam SillyTavern (Disarankan)

1. Buka SillyTavern lalu klik **Extensions** (ikon kubus di bilah atas)
2. Klik **Install extension**
3. Tempel URL repositori di bawah ini, instal, lalu muat ulang halaman:

```
https://github.com/XiaoBai20001212/persona-tags
```

> Pembaruan di masa mendatang dapat diinstal langsung dari **Manage extensions**.

### Metode 2: Instalasi Manual

Unduh dan ekstrak repositori, lalu letakkan seluruh folder `persona-tags` ke dalam:

```
SillyTavern/public/scripts/extensions/third-party/persona-tags/
```

Muat ulang halaman dan ekstensi siap digunakan.

## Penyimpanan Data

Data tag dan pengurutan disimpan di dalam `extension_settings` milik SillyTavern tanpa mengubah data persona asli Anda. Menghapus folder ekstensi akan mengembalikan antarmuka bawaan secara bersih tanpa memengaruhi SillyTavern.

## Penulis

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
