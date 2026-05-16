# Gaming Lounge — Frontend Admin Dashboard

Admin dashboard untuk manajemen cabang **Quantum Gaming** (PlayStation/Gaming rental).  
Dibangun dengan **Vue 3 + Vite + Element Plus**.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| Vue 3 | ^3.5 | Composition API (`<script setup>`) |
| Vite | ^8.0 | Build tool & dev server |
| Vue Router | ^5.0 | Client-side routing |
| Pinia | ^3.0 | State management |
| Element Plus | ^2.13 | UI component library |
| Axios | ^1.16 | HTTP client |
| ECharts | ^6.0 | Charting library (Sales Dashboard) |
| xlsx | ^0.18 | Export data ke file Excel |
| jsPDF + autotable | ^4.2 | Export data ke file PDF |
| Node.js | >=20.19 | Runtime requirement |

---

## Setup Project

### 1. Clone & Install

```bash
git clone <repo-url>
cd game_lounge_fe
npm install
```

### 2. Konfigurasi Environment

Buat file `.env` di root project:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

> Sesuaikan URL dengan alamat backend yang berjalan.

### 3. Jalankan Dev Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 4. Build Production

```bash
npm run build
```

Output ada di folder `dist/`.

---

## Scripts

| Command | Keterangan |
|---|---|
| `npm run dev` | Jalankan dev server (hot reload) |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview hasil build |
| `npm run lint` | Lint seluruh kode (oxlint + eslint) |
| `npm run format` | Format kode dengan Prettier |

---

## Struktur Folder

```
game_lounge_fe/
├── public/
├── src/
│   ├── api/                            # Semua modul pemanggilan API
│   │   ├── index.js                    # Axios instance + interceptors (auth token, 401 redirect)
│   │   ├── uploadApi.js                # POST /upload — upload file ke backend
│   │   ├── auth/
│   │   │   └── authApi.js              # login, logout, getMe
│   │   ├── booking/
│   │   │   └── bookingApi.js           # CRUD booking, dashboard kalender, sessions-ending-soon
│   │   ├── customer/
│   │   │   └── customerApi.js          # CRUD customers (member & regular)
│   │   ├── facility/
│   │   │   └── facilityApi.js          # CRUD facility categories + facilities
│   │   ├── play_credits/
│   │   │   └── playCreditsApi.js       # CRUD paket & penjualan play credits
│   │   ├── pricing/
│   │   │   └── pricingApi.js           # Kelola harga per cabang & flash sale
│   │   ├── promotion/
│   │   │   └── promotionApi.js         # CRUD voucher & promo
│   │   ├── role/
│   │   │   └── roleApi.js              # CRUD roles + permissions
│   │   ├── room_template/
│   │   │   └── roomTemplateApi.js      # CRUD room templates
│   │   ├── sales/
│   │   │   └── salesApi.js             # Summary, trend, & daftar transaksi penjualan
│   │   ├── staff/
│   │   │   └── staffApi.js             # CRUD staff
│   │   └── store/
│   │       └── storeApi.js             # CRUD stores
│   │
│   ├── assets/
│   │   ├── logo.png                    # Logo (favicon, sidebar, login page)
│   │   └── theme.css                   # Design system: CSS vars + Element Plus overrides
│   │
│   ├── layouts/
│   │   └── AdminLayout.vue             # Sidebar nav + header + router-view + bell notification
│   │
│   ├── router/
│   │   └── index.js                    # Definisi routes + navigation guard (auth check)
│   │
│   ├── stores/
│   │   └── authStore.js                # Pinia: token, staff data, login/logout/fetchMe
│   │
│   ├── utils/
│   │   └── imageHelper.js              # getImageUrl() + uploadImage()
│   │
│   ├── views/
│   │   ├── auth/
│   │   │   └── LoginView.vue
│   │   ├── booking/
│   │   │   └── BookingView.vue         # Kalender grid booking + form baru + detail panel
│   │   ├── customer/
│   │   │   └── CustomerView.vue        # List customer, tambah/edit, riwayat booking & credits
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue       # (placeholder)
│   │   ├── facility/
│   │   │   ├── FacilityCategoryView.vue
│   │   │   ├── FacilityView.vue
│   │   │   └── FacilityFormView.vue
│   │   ├── play_credits/
│   │   │   └── PlayCreditsView.vue     # Kelola paket & penjualan play credits
│   │   ├── pricing/
│   │   │   ├── PricingView.vue         # List pricing per cabang
│   │   │   └── PricingEditView.vue     # Edit slot harga + flash sale
│   │   ├── profile/
│   │   │   └── ProfileView.vue
│   │   ├── promotion/
│   │   │   └── PromotionView.vue       # CRUD voucher & promo (booking / play credits / keduanya)
│   │   ├── role/
│   │   │   └── RoleView.vue
│   │   ├── room_template/
│   │   │   ├── RoomTemplateView.vue
│   │   │   └── RoomTemplateFormView.vue
│   │   ├── sales/
│   │   │   └── SalesView.vue           # Sales Dashboard: stats, trend chart, revenue breakdown, export
│   │   ├── staff/
│   │   │   └── StaffView.vue
│   │   └── store/
│   │       ├── StoreView.vue
│   │       └── StoreCreateView.vue     # Wizard 4 step: info → jam operasional → room setup → review
│   │
│   ├── App.vue
│   └── main.js
│
├── index.html                          # HTML entry + FOUC-prevention script (dark/light bg)
├── .env                                # VITE_API_URL
├── package.json
└── vite.config.js
```

---

## Routes

| Path | Komponen | Keterangan |
|---|---|---|
| `/login` | `LoginView` | Halaman login (public) |
| `/sales` | `SalesView` | **Sales Dashboard** — landing page utama |
| `/dashboard` | `DashboardView` | Dashboard alternatif (placeholder) |
| `/profile` | `ProfileView` | Profil user yang login |
| `/bookings` | `BookingView` | Kalender booking ruangan |
| `/pricing` | `PricingView` | List harga per cabang |
| `/pricing/:storeId/edit` | `PricingEditView` | Edit slot harga & flash sale |
| `/customers` | `CustomerView` | Kelola data customer |
| `/play-credits` | `PlayCreditsView` | Paket & penjualan play credits |
| `/promotion` | `PromotionView` | Voucher & promo |
| `/facility-category` | `FacilityCategoryView` | Kategori fasilitas |
| `/facility` | `FacilityView` | List fasilitas |
| `/facility/create` | `FacilityFormView` | Tambah fasilitas |
| `/facility/:id/edit` | `FacilityFormView` | Edit fasilitas |
| `/room-template` | `RoomTemplateView` | List room templates |
| `/room-template/create` | `RoomTemplateFormView` | Tambah room template |
| `/room-template/:id/edit` | `RoomTemplateFormView` | Edit room template |
| `/store` | `StoreView` | List stores |
| `/store/create` | `StoreCreateView` | Buat store baru (wizard 4 step) |
| `/store/:id/edit` | `StoreCreateView` | Edit store |
| `/staff` | `StaffView` | Kelola staff |
| `/role` | `RoleView` | Kelola roles & permissions |

> Semua route kecuali `/login` memerlukan autentikasi. Jika tidak ada token → redirect ke `/login`.

---

## Sidebar Navigation

```
Dashboard              ← /sales (Sales Dashboard, selalu paling atas)

STORE
  └── Store Management
        ├── Facility Category
        ├── Facilities
        ├── Rooms
        └── Stores

BUSINESS
  ├── Bookings
  ├── Pricing
  ├── Customers
  ├── Play Credits
  └── Promotion

SYSTEM
  └── Settings
        ├── Staff
        └── Roles
```

---

## Sistem Autentikasi

- Token disimpan di `localStorage` key `token`
- Setiap request otomatis menambahkan header `Authorization: Bearer <token>` via Axios interceptor
- Jika response `401`, token dihapus dan user di-redirect ke `/login`
- Saat app pertama mount, jika token ada tapi data staff kosong (setelah refresh halaman), otomatis memanggil `GET /auth/me`

---

## Tema (Dark / Light Mode)

Aplikasi mendukung dua tema yang bisa diswitch dari header (tombol bulan/matahari):

| Mode | Background | Sidebar |
|---|---|---|
| Dark (default) | `#010214` navy gelap | Full dark navy |
| Light | `#f0f6ff` sky blue | Lighter navy (tetap brand) |

**Implementasi:**
- `body.light-mode` class ditambahkan saat light mode aktif
- Seluruh warna menggunakan CSS custom properties (`var(--bg-main)`, `var(--text-primary)`, dll.) yang didefinisikan di `src/assets/theme.css`
- Preferensi disimpan di `localStorage` key `theme`
- `index.html` mengandung inline script untuk mencegah white flash saat load di dark mode

**Brand palette:**
```
Primary:  #0282DE  (blue)
Light:    #19B9EE  (cyan)
Dark:     #0262b0  (dark blue)
Success:  #10B981
Warning:  #F59E0B
Danger:   #EF4444
```

---

## Modul Booking

Fitur kalender grid interaktif untuk manajemen jadwal ruangan.

**Endpoint yang digunakan:**
| Fungsi | Endpoint |
|---|---|
| Kalender dashboard | `GET /bookings/dashboard` |
| Detail booking | `GET /bookings/:id` |
| Buat booking baru | `POST /bookings` |
| Batalkan booking | `PATCH /bookings/:id/cancel` |
| Tandai selesai | `PATCH /bookings/:id/complete` |
| Sesi hampir habis | `GET /bookings/sessions-ending-soon` |
| Play credits tersedia | `GET /bookings/available-credits` |
| Hitung harga | `POST /pricing/calculate` |
| Voucher tersedia | `GET /vouchers/customer-available` |

**Fitur:**
- Kalender grid horizontal (timeline 10:00–02:00 lintas tengah malam)
- New Booking Mode: klik slot kosong → form booking muncul di panel kanan
- Detail panel: lihat info, cancel, complete booking
- Voucher dropdown dengan preview diskon (kalkulasi client-side)
- Bell notification: polling setiap 60 detik ke `sessions-ending-soon`

---

## Modul Sales Dashboard

Halaman `/sales` adalah landing page utama setelah login.

**Endpoint yang digunakan:**
| Fungsi | Endpoint |
|---|---|
| Stats + revenue breakdown | `GET /sales/summary` |
| Data trend chart | `GET /sales/trend` |
| Daftar transaksi | `GET /sales/transactions` |

**Fitur:**
- Filter period: Today / Yesterday / This Week / This Month / Custom date range
- 5 stat cards: Total Revenue, Booking Revenue, Credits Revenue, Total Transaksi, Rata-rata
- Sales Trend: line chart multi-series (ECharts) dengan granularitas daily/weekly/monthly
- Revenue by Type: donut chart booking vs play credits
- Revenue by Branch & Revenue by Room Type: tabel dengan mini progress bar
- Export ke Excel (`.xlsx`) dan PDF (landscape, dengan summary header)
- Modal detail transaksi dengan pagination & filter

---

## Sistem Upload Gambar

Upload dilakukan 2 tahap:

1. **Preview lokal** — `URL.createObjectURL(file)` untuk tampilan instan
2. **Upload saat submit** — file dikirim ke `POST /upload` sebagai `multipart/form-data`

```js
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

const path = await uploadImage(file, 'stores')
const url = getImageUrl('/assets/img/stores/abc123.jpg')
// → "http://localhost:8080/assets/img/stores/abc123.jpg"
```

| Fitur | Folder |
|---|---|
| Foto store | `stores` |
| Foto room template | `rooms` |
| Icon fasilitas | `facilities` |

---

## Environment Variables

| Variable | Keterangan |
|---|---|
| `VITE_API_URL` | Base URL backend API (contoh: `http://localhost:8080/api/v1`) |
