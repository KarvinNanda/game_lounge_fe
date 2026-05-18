# Gaming Lounge — Frontend Admin Dashboard

> This file also serves as guidance for Claude Code (claude.ai/code) when working in this repository.

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
| ECharts | ^6.0 | Charting (Sales & Dashboard) |
| xlsx | ^0.18 | Export ke Excel |
| jsPDF + autotable | ^4.2 | Export ke PDF |
| Node.js | >=20.19 | Runtime requirement |

---

## Commands

```bash
npm run dev        # Dev server → http://localhost:5173
npm run build      # Build production ke /dist
npm run preview    # Preview hasil build
npm run lint       # oxlint + eslint dengan auto-fix (dijalankan berurutan)
npm run format     # Prettier format seluruh src/
```

---

## Setup

```bash
git clone <repo-url>
cd game_lounge_fe
npm install
```

Buat file `.env` di root:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

## Arsitektur

### Entry & Bootstrap

`src/main.js` mendaftarkan semua `@element-plus/icons-vue` secara global (sehingga `<el-icon><Calendar /></el-icon>` langsung bisa dipakai tanpa import per-file), memuat `theme.css`, dan menginstall Pinia + Router + ElementPlus.

### Single Layout

Semua halaman authenticated berbagi satu layout: `src/layouts/AdminLayout.vue`. Layout ini memiliki:
- Sidebar (collapsible; menjadi overlay drawer di mobile/tablet <1024px)
- Header (bell notifikasi, user dropdown)
- `<router-view>` untuk konten halaman
- `router.afterEach()` yang otomatis menutup sidebar di layar <1024px setiap kali navigasi berpindah

### Routing & Permission Guard

`src/router/index.js` memiliki `beforeEach` yang:
1. Redirect user yang belum login ke `/login`
2. Skip login jika sudah authenticated
3. Cek `meta.permission` terhadap `authStore.permissions` — redirect ke `/dashboard` jika tidak punya akses

Permission key mengikuti pola `domain.action` (contoh: `customers.view`, `settings.branches`).

### Auth & Permissions

`src/stores/authStore.js` (Pinia) menyimpan `token` + `staff`.

- `authStore.isSystem` → `true` untuk super-admin (bypass semua permission check)
- `authStore.permissions` → flat `string[]` yang dinormalisasi dari `staff.role.permissions`
- `_syncRolePermissions()` melakukan `GET /roles/:id` tambahan jika login/me tidak menyertakan permissions

Gunakan composable `usePermission()` di setiap view:

```js
import { usePermission } from '@/composables/usePermission'
const { can } = usePermission()
// di template: v-if="can('customers.edit')"
```

`can()` selalu `true` untuk system user.

### API Layer

`src/api/index.js` — Axios instance:
- `baseURL`: env var `VITE_API_URL`, fallback ke `http://localhost:8080/api/v1`
- Token JWT diinjeksi dari `localStorage` di setiap request
- Response `401` → hapus token + redirect ke `/login`

Setiap domain punya file sendiri di `src/api/<domain>/`. Upload file melalui `src/api/uploadApi.js` (`POST /upload`, `multipart/form-data`).

### Responsive Design

`src/composables/useBreakpoint.js` — reactive breakpoints:
- `isMobile` — `< 640px`
- `isTablet` — `640–1023px`
- `isDesktop` — `≥ 1024px`

Pattern yang dipakai secara konsisten di seluruh codebase:

```js
// Drawer
:size="isMobile ? '100%' : '480px'"

// Dialog
:width="isMobile ? '95%' : '560px'"

// Grid kolom
:style="{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }"

// Sembunyikan kolom tabel → pakai v-if (bukan CSS), supaya Element Plus bisa recalculate layout
v-if="!isMobile && !isTablet"
```

Mobile card list menggantikan tabel dengan class `.m-card-list`, `.m-card`, `.m-card-body`, `.m-card-end`.

### Styling

`src/assets/theme.css` adalah design system global — **selalu pakai CSS variables**, jangan hardcode warna:

| Variable | Nilai |
|---|---|
| `--color-primary` | `#0282DE` (blue) |
| `--color-primary-light` | `#19B9EE` (cyan) |
| `--bg-main` / `--bg-card` | Background utama / card |
| `--text-primary` / `--text-secondary` / `--text-muted` | Hierarki teks |
| `--border-color` | Border |
| `--color-success/warning/danger/info` | Status |

App **selalu dalam light mode** — `AdminLayout.vue` `onMounted` menambahkan `document.body.classList.add('light-mode')`. CSS dark mode di `:root` tidak aktif di production.

Semua style view menggunakan `<style scoped>`. Override global Element Plus ada di `theme.css`.

### Konvensi Form: Drawer, Bukan Dialog

Semua form create/edit dibuka sebagai **right-side drawer** (`el-drawer direction="rtl"`). `RoleView.vue` adalah referensi implementasi. `el-dialog` hanya untuk konfirmasi/delete kecil.

### Pola Struktur View

View di `src/views/` diorganisir per domain. Pola umum list view:
1. Page header (judul + tombol aksi utama yang dijaga `can(perm)`)
2. Filter bar / search
3. `el-table` di desktop/tablet + mobile card list (`v-if="isMobile"`)
4. `el-drawer` dari kanan untuk form create/edit
5. `el-dialog` hanya untuk konfirmasi/hapus

Form multi-step (`StoreCreateView.vue`) menggunakan `el-steps` + `v-show="currentStep === N"` per panel step.

`CustomerView.vue` memiliki layout split-pane (list-panel + detail-panel) yang unik — di mobile, detail panel disembunyikan dan digantikan full-screen drawer.

### Image Handling

```js
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

const path = await uploadImage(file, 'stores')  // upload → dapat path relatif
const url  = getImageUrl('/assets/img/x.jpg')   // → URL penuh ke backend
```

`getImageUrl` otomatis menghapus `/api/v1` dari base URL. Blob/data/http URL dikembalikan as-is.

| Fitur | Folder |
|---|---|
| Foto store | `stores` |
| Foto room template | `rooms` |
| Icon fasilitas | `facilities` |

---

## Struktur Folder

```
src/
├── api/
│   ├── index.js                    # Axios instance + interceptors
│   ├── uploadApi.js                # POST /upload
│   ├── auth/authApi.js
│   ├── booking/bookingApi.js
│   ├── customer/customerApi.js
│   ├── facility/facilityApi.js
│   ├── notification_template/notificationTemplateApi.js
│   ├── play_credits/playCreditsApi.js
│   ├── pricing/pricingApi.js
│   ├── promotion/voucherApi.js
│   ├── role/roleApi.js
│   ├── room_template/roomTemplateApi.js
│   ├── sales/salesApi.js
│   ├── staff/staffApi.js
│   └── store/storeApi.js
├── assets/
│   ├── theme.css                   # Design system: CSS vars + Element Plus overrides
│   └── logo.png
├── composables/
│   ├── useBreakpoint.js            # isMobile / isTablet / isDesktop
│   └── usePermission.js            # can(perm) helper
├── layouts/
│   └── AdminLayout.vue             # Sidebar + header + router-view
├── router/
│   └── index.js                    # Routes + navigation guard
├── stores/
│   └── authStore.js                # Token, staff, login/logout/fetchMe
├── utils/
│   └── imageHelper.js              # getImageUrl() + uploadImage()
└── views/
    ├── auth/LoginView.vue
    ├── booking/BookingView.vue
    ├── customer/CustomerView.vue
    ├── dashboard/DashboardView.vue
    ├── facility/{FacilityCategoryView,FacilityView,FacilityFormView}.vue
    ├── play_credits/PlayCreditsView.vue
    ├── pricing/{PricingView,PricingEditView}.vue
    ├── profile/ProfileView.vue
    ├── promotion/PromotionView.vue
    ├── role/RoleView.vue
    ├── room_template/{RoomTemplateView,RoomTemplateFormView}.vue
    ├── sales/SalesView.vue
    ├── settings/NotificationTemplatesView.vue
    ├── staff/StaffView.vue
    └── store/{StoreView,StoreCreateView}.vue
```

---

## Routes

| Path | Komponen | Permission |
|---|---|---|
| `/login` | `LoginView` | public |
| `/dashboard` | `DashboardView` | — |
| `/sales` | `SalesView` | — |
| `/bookings` | `BookingView` | `bookings.view` |
| `/pricing` | `PricingView` | `pricing.view` |
| `/pricing/:storeId/edit` | `PricingEditView` | `pricing.edit` |
| `/customers` | `CustomerView` | `customers.view` |
| `/play-credits` | `PlayCreditsView` | `play_credits.view` |
| `/promotion` | `PromotionView` | `promotion.view` |
| `/facility-category` | `FacilityCategoryView` | `settings.branches` |
| `/facility` | `FacilityView` | `settings.branches` |
| `/facility/create` · `/facility/:id/edit` | `FacilityFormView` | `settings.branches` |
| `/room-template` | `RoomTemplateView` | `rooms.view` |
| `/room-template/create` · `/room-template/:id/edit` | `RoomTemplateFormView` | `rooms.view` |
| `/store` | `StoreView` | `settings.branches` |
| `/store/create` · `/store/:id/edit` | `StoreCreateView` | `settings.branches` |
| `/staff` | `StaffView` | `settings.staff_role` |
| `/role` | `RoleView` | `settings.staff_role` |
| `/settings/notification-templates` | `NotificationTemplatesView` | `settings.staff_role` |

---

## Sidebar Navigation

```
Dashboard

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
        ├── Roles
        └── Template Notifikasi
```

Sidebar group otomatis ter-expand jika route yang aktif termasuk di dalamnya (deteksi di `AdminLayout.vue` `onMounted`).

---

## Autentikasi

- Token disimpan di `localStorage` key `token`
- Setiap request otomatis menambahkan `Authorization: Bearer <token>` via Axios interceptor
- Response `401` → token dihapus, redirect ke `/login`
- Saat refresh halaman, jika token ada tapi data staff kosong, otomatis memanggil `GET /auth/me`

---

## Modul Booking

Kalender grid interaktif untuk manajemen jadwal ruangan.

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

Fitur utama: kalender grid horizontal (10:00–02:00 lintas tengah malam), new booking mode via klik slot, detail panel kanan, voucher dengan preview diskon, bell notification polling 60 detik.

---

## Modul Sales & Dashboard

| Fungsi | Endpoint |
|---|---|
| Stats + revenue breakdown | `GET /sales/summary` |
| Data trend chart | `GET /sales/trend` |
| Daftar transaksi | `GET /sales/transactions` |

Filter period: Today / Yesterday / This Week / This Month / Custom range. Export ke `.xlsx` dan PDF landscape. Trend chart multi-series via ECharts.
