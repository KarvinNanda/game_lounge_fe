# Gaming Lounge — Frontend Admin Dashboard

Admin dashboard for managing the branches of **Quantum Gaming Center** (PlayStation/gaming room rental).
Built with **Vue 3 + Vite + Element Plus**.

---

## Tech Stack

| Technology | Version | Notes |
|---|---|---|
| Vue 3 | ^3.5 | Composition API (`<script setup>`) |
| Vite | ^8.1 | Build tool & dev server |
| Vue Router | ^5.0 | Client-side routing |
| Pinia | ^3.0 | State management |
| Element Plus | ^2.13 | UI component library (+ `@element-plus/icons-vue`) |
| Axios | ^1.16 | HTTP client |
| ECharts | ^6.0 | Dashboard charts |
| xlsx (SheetJS 0.20.3) | CDN tarball | Excel export |
| jsPDF + jspdf-autotable | ^4.2 / ^5.0 | PDF export |
| Inter (`@fontsource-variable/inter`) | ^5.3 | Self-hosted font |
| Vitest | ^4.1 | Unit/component tests (jsdom) |
| Node.js | `^20.19.0 \|\| >=22.12.0` | Runtime requirement |

---

## Commands

```bash
npm run dev            # Dev server → http://localhost:5173
npm run build          # Production build into /dist
npm run preview        # Preview the production build
npm run format         # Prettier on src/
npm run test           # vitest run
npm run test:watch     # vitest in watch mode
npm run test:coverage  # coverage report
```

**Linting:** `npm run lint` runs `oxlint --fix` and `eslint --fix`, so it **rewrites files**. To only check, run:

```bash
npx eslint .
npx oxlint .
```

---

## Setup

```bash
git clone <repo-url>
cd game_lounge_fe
npm install
```

Copy the env template (`.env.local` is gitignored):

```bash
cp .env.example .env.local
```

`.env.example`:

```env
VITE_API_URL=http://localhost:8080/api/admin
```

A production build requires `VITE_API_URL` (the build fails when it is empty). On Coolify, set it as a Build Variable.

---

## Architecture

### Entry & Bootstrap

`src/main.js`:
- registers every `@element-plus/icons-vue` icon globally, so `<el-icon><Calendar /></el-icon>` works without a per-file import;
- loads the Inter font, `tokens.css`, `theme.css` and `utilities.css` (in that order, after Element Plus' CSS);
- installs Pinia, the router and Element Plus;
- in production builds only, installs `installErrorHandlers` (`src/utils/globalErrors.js`): uncaught Vue errors and unhandled promise rejections become a toast instead of console output.

### Single Layout

Every authenticated page shares `src/layouts/AdminLayout.vue`:
- Sidebar built from `src/layouts/navItems.js` (collapsible; an overlay drawer below 1024px, closed on every navigation there)
- Header with the notification bell and the user dropdown
- `<router-view>` for the page

The bell polls "sessions ending soon" every 60 seconds, and only while the tab is visible (`useVisiblePolling`).

### Routing & Permission Guard

`src/router/index.js` has a `beforeEach` that:
1. asks the server who is logged in (`GET /auth/me`) once per page load;
2. redirects to `/login` when nobody is logged in;
3. skips `/login` when already logged in;
4. checks `meta.permission` against `authStore.permissions` and redirects to `/dashboard` without it.

Permission keys follow `domain.action` (e.g. `customers.view`, `settings.branches`, `orders_fnb.view`).
Every sidebar link's `perm` must equal its route's `meta.permission` (a test checks this).

### Auth & Permissions

Authentication is an **httpOnly cookie** (`staff_token`, path `/api/admin`). The browser sends it with every request (`withCredentials`); JavaScript never reads or stores a token. On app load, any token left in `localStorage` by the old auth is removed.

`src/stores/authStore.js` (Pinia) holds `staff` from `GET /auth/me`:
- `isLoggedIn` → a staff object is present
- `isSystem` → `true` for the super admin (bypasses every permission check)
- `permissions` → flat `string[]` normalised from `staff.role.permissions`

Use the `usePermission()` composable in views:

```js
import { usePermission } from '@/composables/usePermission'
const { can } = usePermission()
// template: v-if="can('customers.edit')"
```

`can()` is always `true` for the system user. UI checks only hide controls; the backend enforces access.

### Branch Access

Which branches a staff member may use comes from `store_access` in `GET /auth/me` (`src/utils/storeAccess.js`, `useAllowedStores`). It **fails closed**: without `store_access`, the staff gets no branch and the page shows a warning.
- All-stores staff: every branch (pages that allow it also offer "Semua Cabang")
- Multi-branch staff: only their branches
- Single-branch staff: the branch is locked (shown as a badge, no dropdown)

### API Layer

`src/api/index.js` — Axios instance:
- `baseURL`: `VITE_API_URL` (fallback `http://localhost:8080/api/admin`, dev only), `withCredentials: true`, 10 s timeout, 10 MB payload limit
- `401` → redirect to `/login` (except on the login and admin-recovery pages)
- `403` → one "no access" toast; the session stays valid
- A separate `publicApi` instance (no credentials) serves `/api/public/*`

Each domain has its own file in `src/api/<domain>/`. File upload goes through `src/api/uploadApi.js` (`POST /upload`, `multipart/form-data`). List endpoints accept at most `per_page=100`; use `fetchAllPages` (`src/utils/fetchAllPages.js`) to load everything.

Show failed calls to the user with `notifyError(err, fallback)` (`src/utils/notify.js`). Do not log errors to the console (ESLint `no-console` is an error): an Axios error carries request and response bodies with customer data.

### Dates and Time (WIB)

All branches run on WIB (UTC+7). Booking times are wall-clock WIB.
- `todayWIB()` — today's date in WIB, independent of the laptop's timezone
- `businessDayWIB()` — the business day still running: a day runs from opening past midnight to closing (latest close 02:00), so the date turns over at **06:00 WIB** (`BUSINESS_DAY_CUTOFF_HOURS` in `src/utils/bookingTime.js`). The booking dashboard and the price calculator open on this day.
- `shiftDate(ymd, days)` — calendar arithmetic on `YYYY-MM-DD` strings
- Never build "today" from `new Date().toISOString()` (that is UTC; a test blocks it).

### Responsive Design

`src/composables/useBreakpoint.js` — reactive breakpoints:
- `isMobile` — `< 640px`
- `isTablet` — `640–1023px`
- `isDesktop` — `≥ 1024px`

Patterns used across the codebase:

```js
// Drawer
:size="isMobile ? '100%' : '480px'"

// Dialog
:width="isMobile ? '95%' : '560px'"

// Hide a table column → v-if (not CSS), so Element Plus recalculates the layout
v-if="!isMobile && !isTablet"
```

On mobile, a card list (`.m-card-list`, `.m-card`, `.m-card-body`, `.m-card-end`) replaces the table.

### Styling

Light theme only. Three global stylesheets:

| File | Contents |
|---|---|
| `src/assets/tokens.css` | Design tokens: colour scales, semantic colours (`--action`, `--success`, `--warning`, `--danger`, `--violet`, `--text-*`, `--surface*`, `--border`), spacing `--space-1…6` (4–24px), radius, font sizes `--font-size-xs…xl` (12–20px), motion, and the Element Plus variable mapping. Colours meet WCAG AA. |
| `src/assets/theme.css` | Global Element Plus overrides and shared rules |
| `src/assets/utilities.css` | A **closed** set of utility classes (`u-w-full`, `u-flex`, `u-gap-1…3`, `u-text-xs/sm`, `u-text-secondary/muted/action/success/danger`, `u-fw-semibold/bold`, `u-mt-1…4`, `u-mb-1…4`). They use `!important` because they replace inline styles. Adding one means updating `tests/utilities.spec.js`. |

Rules (enforced by `tests/styleGuards.spec.js`):
- No static `style="…"` in templates. Use a utility, or a scoped class named after its role. Dynamic `:style` is fine for runtime values.
- No raw hex colours in `.vue` files; use tokens. Canvas charts (ECharts) read tokens at runtime with `cssVar('--token')`.
- No emoji as icons; use Element Plus icons with `aria-hidden="true"`.
- `!important` only with a comment explaining why.
- `el-date-picker`, `el-time-picker` and `el-dropdown-item` render no scoped root, so a scoped class on them never matches. Style them with `:deep(.cls)` from a scoped ancestor.
- Legacy aliases (`--color-primary`, `--bg-main`, `--border-color`, …) still exist in `tokens.css` for older CSS; new code uses the semantic tokens.

Every view uses `<style scoped>`.

### Shared UI Components (`src/components/ui/`)

Presentational only (no data fetching, no stores):

| Component | API |
|---|---|
| `PageHeader` | props `title`, `description` (up to 2 lines), `breadcrumb`; slot `#actions` |
| `StatStrip` | prop `items: [{ label, value, tone?, hint? }]` |
| `FilterBar` | default slot = fields, `#actions` = buttons; fields stretch on phones |
| `TablePagination` | `v-model:page`, `v-model:page-size`, `total`, `sizes` (default `true`); page sizes 10/20/50/100; emits `change` only on user action |
| `EmptyState` | props `title`, `description`; slots `#icon`, `#action` |

List views call an `applyFilters()` (page back to 1, then fetch) from their filters; the pager calls the fetch function directly.

### Form Convention: Drawer, Not Dialog

Create/edit forms open as a **right-side drawer** (`el-drawer direction="rtl"`); `RoleView.vue` is the reference. `el-dialog` is only for small confirmations and deletes.

### View Structure

Views in `src/views/` are grouped by domain. A typical list view:
1. `PageHeader` (title + main action guarded by `can(perm)`)
2. `StatStrip` (when the page has stats)
3. `FilterBar`
4. `el-table` on desktop/tablet + mobile card list (`v-if="isMobile"`)
5. `TablePagination`
6. `el-drawer` for create/edit, `el-dialog` only for confirmations

`StoreCreateView.vue` is a multi-step form (`el-steps` + one `v-show` panel per step).
`CustomerView.vue` has a split layout (list panel + detail panel); on mobile the detail panel becomes a full-screen drawer.

### Image Handling

```js
import { uploadImage, getImageUrl } from '@/utils/imageHelper'

const path = await uploadImage(file, 'stores')  // upload → relative path
const url  = getImageUrl('/assets/img/x.jpg')   // → full backend URL
```

`getImageUrl` strips `/api` or `/api/admin` from `VITE_API_URL` to get the backend host, and sanitises the URL. Blob/data/http URLs are returned as they are.

| Feature | Folder |
|---|---|
| Store photo | `stores` |
| Room template photo | `rooms` |
| Facility icon | `facilities` |

---

## Folder Structure

```
src/
├── api/
│   ├── index.js                    # Axios instances + interceptors
│   ├── uploadApi.js                # POST /upload
│   ├── auth/authApi.js             # login, getMe, logout + admin recovery
│   ├── banner/bannerApi.js
│   ├── booking/{bookingApi,eventBookingApi}.js
│   ├── customer/customerApi.js
│   ├── facility/facilityApi.js
│   ├── notification_template/notificationTemplateApi.js
│   ├── play_credits/playCreditsApi.js
│   ├── pricing/pricingApi.js
│   ├── role/roleApi.js
│   ├── room_template/roomTemplateApi.js
│   ├── sales/salesApi.js           # used by the Dashboard
│   ├── staff/staffApi.js
│   ├── store/storeApi.js           # stores, rooms, operating hours, global holidays
│   └── voucher/voucherApi.js
├── assets/{tokens,theme,utilities}.css
├── components/
│   ├── AuditTrail.vue
│   ├── booking/                    # BookingGrid, BookingFilterBar, BookingDetailPanel,
│   │                               # EventDetailPanel, EventBookingPanel, NewBookingPanel,
│   │                               # BookingConfirmDialog, BookingSuccessDialog, panel.css
│   └── ui/                         # PageHeader, StatStrip, FilterBar, TablePagination, EmptyState
├── composables/
│   ├── useAllowedStores.js         # branches the staff may use
│   ├── useBookingDashboard.js      # booking calendar data for a branch + date
│   ├── useBookingPrice.js          # debounced price + voucher preview
│   ├── useBreakpoint.js            # isMobile / isTablet / isDesktop
│   ├── usePermission.js            # can(perm)
│   └── useVisiblePolling.js        # poll only while the tab is visible
├── layouts/{AdminLayout.vue,navItems.js}
├── router/index.js                 # routes + navigation guard
├── stores/authStore.js             # staff, login/logout/fetchMe
├── utils/
│   ├── authErrors.js  bookingGrid.js  bookingTime.js  cssVar.js  fetchAllPages.js
│   ├── format.js  globalErrors.js  imageHelper.js  notify.js  security.js
│   └── storeAccess.js  voucher.js
└── views/
    ├── auth/{LoginView,AdminRecoveryRequestView,AdminRecoveryResetView}.vue
    ├── booking/BookingView.vue
    ├── customer/CustomerView.vue
    ├── dashboard/DashboardView.vue
    ├── facility/{FacilityCategoryView,FacilityView,FacilityFormView}.vue
    ├── fnb/FnBView.vue
    ├── play_credits/PlayCreditsView.vue
    ├── pricing/{PricingView,PricingEditView}.vue
    ├── profile/ProfileView.vue
    ├── promotion/PromotionView.vue
    ├── role/RoleView.vue
    ├── room_template/{RoomTemplateView,RoomTemplateFormView}.vue
    ├── settings/{NotificationTemplatesView,GlobalHolidayView,BannerManagementView}.vue
    ├── staff/StaffView.vue
    └── store/{StoreView,StoreCreateView}.vue
```

`HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, `HomeView.vue`, `AboutView.vue` and `stores/counter.js` are unused Vite scaffold files.

---

## Routes

| Path | Component | Permission |
|---|---|---|
| `/login` | `LoginView` | public |
| `/admin-recovery` | `AdminRecoveryRequestView` | public |
| `/admin-recovery/:token` | `AdminRecoveryResetView` | public |
| `/dashboard` | `DashboardView` | — |
| `/profile` | `ProfileView` | — |
| `/bookings` | `BookingView` | `bookings.view` |
| `/pricing` | `PricingView` | `pricing.view` |
| `/pricing/:storeId/edit` | `PricingEditView` | `pricing.edit` |
| `/customers` | `CustomerView` | `customers.view` |
| `/play-credits` | `PlayCreditsView` | `play_credits.view` |
| `/promotion` | `PromotionView` | `promotion.view` |
| `/fnb` | `FnBView` | `orders_fnb.view` |
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
| `/settings/global-holidays` | `GlobalHolidayView` | `settings.branches` |
| `/settings/banners` | `BannerManagementView` | `settings.branches` |

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
        ├── Template Notifikasi
        ├── Tanggal Merah Global
        └── Kelola Banner
```

Links are filtered by permission, and empty sections are hidden. A group opens itself when the active route belongs to it.
**FnB** is hidden from the sidebar until the page is checked against the real API; `/fnb` still works when typed directly.

---

## Booking Module

An interactive calendar grid for room schedules. Two booking types: **regular** (per slot, per room) and **event** (a full day, the whole venue or per room type).

`BookingView.vue` is a thin page: data comes from `useBookingDashboard`, the grid and panels are components in `src/components/booking/`, and the new-booking price and voucher preview come from `useBookingPrice`.

### Regular Booking

| Function | Endpoint |
|---|---|
| Calendar dashboard | `GET /bookings/dashboard` |
| Booking detail | `GET /bookings/:id` |
| Create booking | `POST /bookings` |
| Cancel booking | `PATCH /bookings/:id/cancel` |
| Mark completed | `PATCH /bookings/:id/complete` |
| Sessions ending soon | `GET /bookings/sessions-ending-soon` |
| Available play credits | `GET /bookings/available-credits` |
| Calculate price | `POST /pricing/calculate` |
| Available vouchers | `GET /vouchers/customer-available` |

### Event Booking

| Function | Endpoint |
|---|---|
| List event bookings | `GET /event-bookings` |
| Event booking detail | `GET /event-bookings/:id` |
| Create event booking | `POST /event-bookings` |
| Cancel event booking | `PATCH /event-bookings/:id/cancel` |
| Event dashboard | `GET /event-bookings/dashboard` |
| Event price preview | `GET /event-bookings/preview-price` |
| Get event price per store | `GET /stores/:storeId/event-price` |
| Set event price per store | `PUT /stores/:storeId/event-price` |

Event bookings are drawn as an **overlay block** on the calendar grid: one block across the room rows, absolutely positioned from `timeToOffset()`.

Main features: horizontal calendar grid (10:00–02:00, across midnight), new-booking mode by clicking a slot, detail panel on the right, voucher with a discount preview (client-side; the backend decides the real total), and the bell notification. The "New Booking" dropdown offers Regular and Event. Customer search in the event form works like the regular one: name, WhatsApp and email fill in when the customer exists. The Cancel button is hidden once the booking has started (WIB, `hasStarted()`).

---

## Dashboard (Sales Reports)

| Function | Endpoint |
|---|---|
| Stats + revenue breakdown | `GET /sales/summary` |
| Trend chart data | `GET /sales/trend` |
| Transactions | `GET /sales/transactions` |

Period filter: Today / Yesterday / This Week / This Month / Custom range. Export to `.xlsx` and landscape PDF. Multi-series trend chart with ECharts; series colours come from tokens and were checked for colour-blind separation and 3:1 contrast.

---

## Admin Recovery

Two pages **outside AdminLayout** (no login needed) to reset the super admin's password:

| Route | Component | Function |
|---|---|---|
| `/admin-recovery` | `AdminRecoveryRequestView` | Enter email → send reset link |
| `/admin-recovery/:token` | `AdminRecoveryResetView` | Validate token → change-password form |

Security pattern: the request page **always shows the success state**, whatever the backend answers, so it never reveals whether an email is registered. The token is validated with `GET /admin-recovery/:token/validate` before the form shows.

```
authApi.js
  requestPasswordReset(email)          → POST /admin-recovery/request
  validateResetToken(token)            → GET  /admin-recovery/:token/validate
  resetPassword(token, { new_password, confirm_password })
                                       → POST /admin-recovery/:token/reset
```

---

## Tests

```bash
npx vitest run
```

Stack: **Vitest 4** + **jsdom** + `@vue/test-utils`. API modules are mocked with `vi.mock`; Pinia stores use `setActivePinia(createPinia())`.

The suite covers the API interceptors, auth and branch access, WIB date helpers, the booking view (characterization tests), booking components and composables, the shared UI components, page-reset behaviour of the list views, permission guards in the UI, and static guards for styles, console output and UTC dates.

> **Note:** `tests/` is currently listed in `.gitignore`, so the tests run only locally and CI (`npx vitest run --passWithNoTests`) runs none of them. CI does run `npm audit`, the linters and the build.
