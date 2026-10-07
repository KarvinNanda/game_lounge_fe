// Sidebar navigation. `perm` is the permission needed to see a link and
// must equal the route's meta.permission in router/index.js
// (tests/navItems.spec.js checks this). `icon` is a globally registered
// Element Plus icon name.
export const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'TrendCharts' }],
  },
  {
    label: 'Store',
    group: { key: 'store', label: 'Store Management', icon: 'Shop' },
    items: [
      { to: '/facility-category', label: 'Facility Category', perm: 'settings.branches' },
      { to: '/facility', label: 'Facilities', perm: 'settings.branches' },
      { to: '/room-template', label: 'Rooms', perm: 'rooms.view' },
      { to: '/store', label: 'Stores', perm: 'settings.branches' },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/bookings', label: 'Bookings', icon: 'Calendar', perm: 'bookings.view' },
      { to: '/pricing', label: 'Pricing', icon: 'Money', perm: 'pricing.view' },
      { to: '/customers', label: 'Customers', icon: 'User', perm: 'customers.view' },
      { to: '/play-credits', label: 'Play Credits', icon: 'Coin', perm: 'play_credits.view' },
      { to: '/promotion', label: 'Promotion', icon: 'Ticket', perm: 'promotion.view' },
      // Hidden until the FnB page is checked against the real API (paths were
      // fixed 2026-10-07). The /fnb route is still registered, so /fnb works
      // if typed directly.
      // { to: '/fnb', label: 'FnB', icon: 'Food', perm: 'orders_fnb.view' },
    ],
  },
  {
    label: 'System',
    group: { key: 'settings', label: 'Settings', icon: 'Setting' },
    items: [
      { to: '/staff', label: 'Staff', perm: 'settings.staff_role' },
      { to: '/role', label: 'Roles', perm: 'settings.staff_role' },
      { to: '/settings/notification-templates', label: 'Template Notifikasi', perm: 'settings.staff_role' },
      { to: '/settings/global-holidays', label: 'Tanggal Merah Global', perm: 'settings.branches' },
      { to: '/settings/banners', label: 'Kelola Banner', perm: 'settings.branches' },
    ],
  },
]

// Keep only the links the user may see; drop sections that end up empty.
export const visibleSections = (sections, can) =>
  sections
    .map((section) => ({ ...section, items: section.items.filter((item) => can(item.perm)) }))
    .filter((section) => section.items.length > 0)

// Key of the collapsible group that owns `path`, so it can open itself.
export const groupKeyForPath = (path) =>
  NAV_SECTIONS.find((s) => s.group && s.items.some((i) => path.startsWith(i.to)))?.group.key
