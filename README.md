# Quantum Gaming — Frontend Admin Dashboard

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

### 5. Preview Build

```bash
npm run preview
```

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
├── public/                        # Static assets (served as-is)
├── src/
│   ├── api/                       # Semua modul pemanggilan API
│   │   ├── index.js               # Axios instance + interceptors (auth token, 401 redirect)
│   │   ├── uploadApi.js           # POST /upload — upload file ke backend
│   │   ├── auth/
│   │   │   └── authApi.js         # login, logout, getMe
│   │   ├── facility/
│   │   │   └── facilityApi.js     # CRUD facility categories + facilities
│   │   ├── role/
│   │   │   └── roleApi.js         # CRUD roles
│   │   ├── room_template/
│   │   │   └── roomTemplateApi.js # CRUD room templates
│   │   ├── staff/
│   │   │   └── staffApi.js        # CRUD staff
│   │   └── store/
│   │       └── storeApi.js        # CRUD stores
│   │
│   ├── assets/
│   │   ├── logo.png               # Logo aplikasi (favicon, sidebar, login)
│   │   └── theme.css              # Dark theme CSS variables + Element Plus overrides
│   │
│   ├── layouts/
│   │   └── AdminLayout.vue        # Layout utama: sidebar nav + header + router-view
│   │
│   ├── router/
│   │   └── index.js               # Definisi routes + navigation guard (auth check)
│   │
│   ├── stores/
│   │   └── authStore.js           # Pinia store: token, staff data, login/logout/fetchMe
│   │
│   ├── utils/
│   │   └── imageHelper.js         # getImageUrl() + uploadImage() helper
│   │
│   ├── views/
│   │   ├── auth/
│   │   │   └── LoginView.vue      # Halaman login
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue  # Halaman dashboard (placeholder)
│   │   │
│   │   ├── facility/
│   │   │   ├── FacilityCategoryView.vue  # CRUD kategori fasilitas (drawer)
│   │   │   ├── FacilityView.vue          # List fasilitas + filter + stats
│   │   │   └── FacilityFormView.vue      # Form tambah/edit fasilitas + upload icon
│   │   │
│   │   ├── profile/
│   │   │   └── ProfileView.vue    # Profil user yang login + ganti password
│   │   │
│   │   ├── role/
│   │   │   └── RoleView.vue       # CRUD roles + permission groups (drawer)
│   │   │
│   │   ├── room_template/
│   │   │   ├── RoomTemplateView.vue      # List room templates + stats
│   │   │   └── RoomTemplateFormView.vue  # Form tambah/edit room + facility selector + upload foto
│   │   │
│   │   ├── staff/
│   │   │   └── StaffView.vue      # List staff + filter + drawer tambah/edit
│   │   │
│   │   └── store/
│   │       ├── StoreView.vue       # List stores + jam operasional + tanggal merah
│   │       └── StoreCreateView.vue # Wizard 4 step: info → jam operasional → room setup → review
│   │
│   ├── App.vue                    # Root component, fetchMe() on mount jika token ada
│   └── main.js                    # Entry point: setup Vue, Pinia, Router, Element Plus
│
├── .env                           # Environment variables (VITE_API_URL)
├── index.html                     # HTML entry point + favicon
├── package.json
└── vite.config.js
```

---

## Routes

| Path | Komponen | Keterangan |
|---|---|---|
| `/login` | `LoginView` | Halaman login (public) |
| `/dashboard` | `DashboardView` | Dashboard utama |
| `/profile` | `ProfileView` | Profil user yang login |
| `/facility-category` | `FacilityCategoryView` | Kelola kategori fasilitas |
| `/facility` | `FacilityView` | List fasilitas |
| `/facility/create` | `FacilityFormView` | Tambah fasilitas |
| `/facility/:id/edit` | `FacilityFormView` | Edit fasilitas |
| `/room-template` | `RoomTemplateView` | List room templates |
| `/room-template/create` | `RoomTemplateFormView` | Tambah room template |
| `/room-template/:id/edit` | `RoomTemplateFormView` | Edit room template |
| `/store` | `StoreView` | List stores |
| `/store/create` | `StoreCreateView` | Buat store baru (wizard 4 step) |
| `/store/:id/edit` | `StoreCreateView` | Edit store (wizard 4 step) |
| `/staff` | `StaffView` | Kelola staff |
| `/role` | `RoleView` | Kelola roles & permissions |

> Semua route kecuali `/login` memerlukan autentikasi. Jika tidak ada token, otomatis redirect ke `/login`.

---

## Sistem Autentikasi

- Token disimpan di `localStorage` key `token`
- Setiap request otomatis menambahkan header `Authorization: Bearer <token>` via Axios interceptor
- Jika response `401`, token dihapus dan user di-redirect ke `/login`
- Saat app pertama mount, jika token ada tapi data staff kosong (misalnya setelah refresh halaman), otomatis memanggil `GET /auth/me`

---

## Sistem Upload Gambar

Upload dilakukan 2 tahap:

1. **Preview lokal** — `URL.createObjectURL(file)` untuk tampilan instan
2. **Upload saat submit** — file dikirim ke `POST /upload` sebagai `multipart/form-data`, backend mengembalikan path permanen

```js
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

// Upload file → return path: "/assets/img/stores/abc123.jpg"
const path = await uploadImage(file, 'stores')

// Konversi path relatif ke full URL untuk ditampilkan di <img>
const url = getImageUrl('/assets/img/stores/abc123.jpg')
// → "http://localhost:8080/assets/img/stores/abc123.jpg"
```

**Folder upload per fitur:**

| Fitur | Folder |
|---|---|
| Foto store | `stores` |
| Foto room template | `rooms` |
| Icon fasilitas | `facilities` |

---

## Sidebar Navigation

```
Store
  ├── Facility Category
  ├── Facilities
  ├── Rooms
  └── Stores

Settings
  ├── Staff
  └── Roles
```

---

## Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Base URL backend API |
