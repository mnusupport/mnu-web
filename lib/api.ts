const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
if (!configuredApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL must be configured for a production web build.');
}
// The localhost fallback exists for `next dev` only. In a production build
// NODE_ENV is inlined, so this branch (and the string) is removed entirely.
const API_URL: string =
  process.env.NODE_ENV === 'production' ? (configuredApiUrl as string) : (configuredApiUrl ?? 'http://localhost:3001');


export interface ApiError {
  message: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mnu_token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as ApiError).message ?? 'Something went wrong.');
  }

  return data as T;
}

// Separate from request(): a file upload's body is FormData, not JSON —
// setting 'Content-Type': 'application/json' (request()'s default)
// would break the multipart boundary the browser needs to set itself.
// Everything else (auth header, error shape) matches request() exactly.
async function requestFormData<T>(path: string, formData: FormData, method: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mnu_token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as ApiError).message ?? 'Something went wrong.');
  }

  return data as T;
}

// Menu item `imageUrl` fields store a full Cloudinary HTTPS URL as of
// this task (see menu-item.schema.ts). Older values from before this
// migration (Day 16 and earlier, local-disk `/uploads/...` paths) are
// handled defensively: anything that isn't already absolute still gets
// the API origin prefixed, so a pre-existing value wouldn't render as
// broken — though nothing in this sandbox's unreachable database is
// assumed to actually contain one.
export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return `${API_URL}${imageUrl}`;
}

export interface RegisterPayload {
  restaurant_name: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Membership {
  restaurant_id: string;
  restaurant_name: string;
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'RESTAURANT_STAFF';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  platformRole: 'USER' | 'SUPER_ADMIN';
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<{ token: string; user: AuthUser; membership: Membership }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<{ token: string; user: AuthUser; platformRole: AuthUser['platformRole']; memberships: Membership[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: AuthUser; platformRole: AuthUser['platformRole']; memberships: Membership[] }>('/auth/me'),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
};

export interface PlatformRestaurantSummary {
  id: string;
  name: string;
  createdAt: string;
  admins: { name: string; email: string }[];
  memberCount: number;
}

export interface PlatformRestaurantList {
  items: PlatformRestaurantSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PlatformDashboard {
  totalRestaurants: number;
  recentRestaurants: { id: string; name: string; createdAt: string }[];
}

export interface CreateRestaurantPayload {
  restaurant_name: string;
  name: string;
  email: string;
  password: string;
}

export interface CreateRestaurantResult {
  restaurant: { id: string; name: string; createdAt: string };
  admin: { id: string; name: string; email: string };
  membership: { restaurant_id: string; role: 'RESTAURANT_ADMIN' };
}

export const platformAdminApi = {
  createRestaurant: (payload: CreateRestaurantPayload) =>
    request<CreateRestaurantResult>('/super-admin/restaurants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  dashboard: () => request<PlatformDashboard>('/super-admin/dashboard'),
  listRestaurants: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PlatformRestaurantList>(`/super-admin/restaurants${suffix}`);
  },
  getRestaurant: (restaurantId: string) =>
    request<{ id: string; name: string; createdAt: string }>(`/super-admin/restaurants/${restaurantId}`),
  listFeedback: (params: { page?: number; limit?: number; restaurantId?: string; rating?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.restaurantId) query.set('restaurantId', params.restaurantId);
    if (params.rating) query.set('rating', String(params.rating));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<PlatformFeedbackList>(`/super-admin/feedback${suffix}`);
  },
};

// ---- Menu (categories + items) ----

export interface MenuItemRecord {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
  // Day 22 — admin-controlled Featured flag.
  isFeatured: boolean;
  imageUrl: string | null;
}

export interface CategoryRecord {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemRecord[];
}

// Subset returned by the create/update category endpoints — they return
// the raw category row, not the nested { items } shape getMenu() builds.
export interface CategorySummary {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MenuItemInput {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  isAvailable?: boolean;
  sortOrder?: number;
}

// Shape returned by GET /public/restaurants/:id/menu — a stripped-down,
// customer-facing view (no ids beyond what's needed for React keys, no
// isAvailable/sortOrder/categoryId, unavailable items and empty
// categories already excluded server-side).
export interface PublicMenu {
  restaurantName: string;
  // Day 22 — restaurant branding. Every field nullable; the customer UI
  // falls back to an initial-letter avatar + the MnU default palette, so
  // an unbranded restaurant still renders completely. No admin UI writes
  // these yet (see restaurant.schema.ts).
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    backgroundType: 'gradient' | 'solid' | 'image' | 'mesh' | null;
    backgroundColor: string | null;
    gradientStart: string | null;
    gradientMiddle: string | null;
    gradientEnd: string | null;
    gradientAngle: number | null;
    backgroundImageUrl: string | null;
    overlayColor: string | null;
    overlayOpacity: number | null;
    surfaceColor: string | null;
    textColor: string | null;
    mutedTextColor: string | null;
    buttonColor: string | null;
    cardStyle: 'glass' | 'solid' | 'soft' | null;
    heroEyebrow: string | null;
    heroTagline: string | null;
  };
  categories: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      // Day 14: real, already-stored data (MenuItem has always had
      // timestamps) — newly exposed here for the customer Home page's
      // "New Arrivals" section. Not present in responses from before
      // this change.
      createdAt: string;
      // Day 22 — same record, same category; drives both the Home
      // Featured section and the in-category highlight.
      isFeatured: boolean;
      imageUrl: string | null;
    }[];
  }[];
}

export interface RestaurantBranding {
  restaurantName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  backgroundType: 'gradient' | 'solid' | 'image' | 'mesh' | null;
  backgroundColor: string | null;
  gradientStart: string | null;
  gradientMiddle: string | null;
  gradientEnd: string | null;
  gradientAngle: number | null;
  backgroundImageUrl: string | null;
  overlayColor: string | null;
  overlayOpacity: number | null;
  surfaceColor: string | null;
  textColor: string | null;
  mutedTextColor: string | null;
  buttonColor: string | null;
  cardStyle: 'glass' | 'solid' | 'soft' | null;
  heroEyebrow: string | null;
  heroTagline: string | null;
}

export interface RestaurantStaffRecord {
  id: string;
  name: string;
  email: string | null;
  role: Membership['role'];
  joinedAt: string;
}

export const restaurantApi = {
  listStaff: (restaurantId: string) => request<RestaurantStaffRecord[]>(`/restaurants/${restaurantId}/staff`),
  getBranding: (restaurantId: string) =>
    request<RestaurantBranding>(`/restaurants/${restaurantId}/branding`),

  updateBranding: (restaurantId: string, data: Partial<Omit<RestaurantBranding, 'restaurantName'>>) =>
    request<RestaurantBranding>(`/restaurants/${restaurantId}/branding`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

const MENU_IMAGE_MAX_BYTES = 3.5 * 1024 * 1024;
const MENU_IMAGE_MAX_DIMENSION = 2000;

async function prepareMenuImageForUpload(file: File): Promise<File> {
  if (file.size <= MENU_IMAGE_MAX_BYTES) return file;
  if (typeof window === 'undefined' || typeof document === 'undefined') return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MENU_IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); return file; }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.82, 0.68, 0.55, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) continue;
    const prepared = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
    if (prepared.size <= MENU_IMAGE_MAX_BYTES) return prepared;
  }

  throw new Error('Photo is too large to upload. Please choose a smaller image.');
}

export const menuApi = {
  getMenu: (restaurantId: string) => request<CategoryRecord[]>(`/restaurants/${restaurantId}/menu`),

  createCategory: (restaurantId: string, data: { name: string; sortOrder?: number }) =>
    request<CategorySummary>(`/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (restaurantId: string, categoryId: string, data: { name?: string; sortOrder?: number }) =>
    request<CategorySummary>(`/restaurants/${restaurantId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCategory: (restaurantId: string, categoryId: string) =>
    request<{ success: true }>(`/restaurants/${restaurantId}/categories/${categoryId}`, {
      method: 'DELETE',
    }),

  createMenuItem: (restaurantId: string, data: MenuItemInput) =>
    request<MenuItemRecord>(`/restaurants/${restaurantId}/menu-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMenuItem: (restaurantId: string, itemId: string, data: Partial<MenuItemInput>) =>
    request<MenuItemRecord>(`/restaurants/${restaurantId}/menu-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  setAvailability: (restaurantId: string, itemId: string, isAvailable: boolean) =>
    request<MenuItemRecord>(`/restaurants/${restaurantId}/menu-items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }),

  // Day 22 — manager-only (see MenuService.setFeatured).
  setFeatured: (restaurantId: string, itemId: string, isFeatured: boolean) =>
    request<MenuItemRecord>(`/restaurants/${restaurantId}/menu-items/${itemId}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ isFeatured }),
    }),

  deleteMenuItem: (restaurantId: string, itemId: string) =>
    request<{ success: true }>(`/restaurants/${restaurantId}/menu-items/${itemId}`, {
      method: 'DELETE',
    }),

  // Single image per item (this task's whole scope) — a new upload
  // always replaces whatever was there before (see
  // MenuService.uploadItemImage, which deletes the old file first).
  uploadItemImage: async (restaurantId: string, itemId: string, file: File) => {
    const prepared = await prepareMenuImageForUpload(file);
    const formData = new FormData();
    formData.append('image', prepared, prepared.name);
    return requestFormData<MenuItemRecord>(
      `/restaurants/${restaurantId}/menu-items/${itemId}/image`,
      formData,
      'POST',
    );
  },

  removeItemImage: (restaurantId: string, itemId: string) =>
    request<MenuItemRecord>(`/restaurants/${restaurantId}/menu-items/${itemId}/image`, {
      method: 'DELETE',
    }),

  // Public/unauthenticated — what a diner sees after scanning a QR code
  // or opening a restaurant's menu link directly. Day 9.
  //
  // Day 28 — every customer screen (and CustomerTheme) loads this same
  // payload. Concurrent calls now share ONE request, and the last result
  // is remembered in memory so navigating Home -> Menu -> Item paints
  // instantly from cache while a fresh copy loads in the background.
  // Nothing is persisted; a full reload always refetches.
  getPublicMenu: (restaurantId: string): Promise<PublicMenu> => {
    const running = menuInflight.get(restaurantId);
    if (running) return running;
    const p = request<PublicMenu>(`/public/restaurants/${restaurantId}/menu`)
      .then((data) => {
        setMenuCache(restaurantId, data);
        return data;
      })
      .finally(() => menuInflight.delete(restaurantId));
    menuInflight.set(restaurantId, p);
    return p;
  },
  // Instant paint on navigation AND on a hard/first reload. Checked in this
  // order: (1) in-memory Map — survives client-side <Link> navigation
  // within the same tab; (2) sessionStorage — survives a full page reload
  // or a host that doesn't do client-side transitions, but not a new tab.
  // Both are soft caches only: every page still calls getPublicMenu() on
  // mount and repaints with the fresh copy the moment it arrives, so a
  // stale peek is never shown for longer than one network round trip.
  peekPublicMenu: (restaurantId: string): PublicMenu | null => {
    const mem = menuCache.get(restaurantId);
    if (mem) return mem;
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(`mnu_menu_${restaurantId}`);
      if (!raw) return null;
      const data = JSON.parse(raw) as PublicMenu;
      menuCache.set(restaurantId, data);
      return data;
    } catch {
      return null;
    }
  },
};

const menuCache = new Map<string, PublicMenu>();
const menuInflight = new Map<string, Promise<PublicMenu>>();

function setMenuCache(restaurantId: string, data: PublicMenu) {
  menuCache.set(restaurantId, data);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`mnu_menu_${restaurantId}`, JSON.stringify(data));
  } catch {
    /* storage full/unavailable — memory cache still works for this tab */
  }
}

// ---- Tables ----

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'INACTIVE';

export interface TableRecord {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
}

export interface TableInput {
  tableNumber: string;
  capacity: number;
  status?: TableStatus;
}

export const tablesApi = {
  list: (restaurantId: string) => request<TableRecord[]>(`/restaurants/${restaurantId}/tables`),

  get: (restaurantId: string, tableId: string) =>
    request<TableRecord>(`/restaurants/${restaurantId}/tables/${tableId}`),

  create: (restaurantId: string, data: TableInput) =>
    request<TableRecord>(`/restaurants/${restaurantId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (restaurantId: string, tableId: string, data: Partial<TableInput>) =>
    request<TableRecord>(`/restaurants/${restaurantId}/tables/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (restaurantId: string, tableId: string) =>
    request<{ success: true }>(`/restaurants/${restaurantId}/tables/${tableId}`, {
      method: 'DELETE',
    }),
};

// ---- Table sessions (public, customer-facing — no auth) ----

export type TableSessionStatus = 'ACTIVE' | 'ENDED';

export interface TableSessionRecord {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  status: TableSessionStatus;
  startedAt: string;
  endedAt: string | null;
}

export interface TableSessionResponse {
  session: TableSessionRecord;
  table: {
    id: string;
    tableNumber: string;
    capacity: number;
  };
  restaurant: {
    id: string;
    name: string;
  };
}

export const tableSessionApi = {
  // Idempotent — safe to call on every page load, including refreshes.
  start: (restaurantId: string, tableId: string) =>
    request<TableSessionResponse>(`/public/restaurants/${restaurantId}/tables/${tableId}/session`, {
      method: 'POST',
    }),

  getActive: (restaurantId: string, tableId: string) =>
    request<TableSessionResponse>(`/public/restaurants/${restaurantId}/tables/${tableId}/session`),

};

// ---- Orders ----

// Full lifecycle now backed by MongoDB (this task) — never hard-coded on
// the frontend. See order.schema.ts's OrderStatus enum, which this
// mirrors exactly.
export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'PREPARING', 'READY'];

// Mirrors OrdersService's STATUS_TRANSITIONS exactly — used only to
// decide which "next status" buttons to show; the backend re-validates
// every transition regardless, so this is a UX nicety, not the actual
// rule enforcement.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'PREPARING', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export interface OrderLineRecord {
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
  // Who at the table added this line — null on solo orders.
  addedByName?: string | null;
}

// Request body for placing an order — deliberately just itemId +
// quantity. There is no price field at all: the backend prices every
// line from MongoDB itself, so there's nothing here for it to
// (accidentally or otherwise) trust from the client.
export interface OrderItemInput {
  itemId: string;
  quantity: number;
}

// Response from the public create-order endpoint.
export interface OrderConfirmation {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  items: OrderLineRecord[];
  orderType: 'DINE_IN' | 'TAKEAWAY';
  table: { tableNumber: string } | null;
  restaurant: { name: string };
  createdAt: string;
}

// Shape used by both the admin list and detail views.
export interface CustomerOrderRecord {
  id: string;
  orderNumber: string;
  restaurant: { id: string; name: string };
  tableNumber: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  items: OrderLineRecord[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  customer: null;
  groupCode: string | null;
}

export interface CustomerOrderHistoryResponse {
  restaurant: { id: string; name: string };
  customer: { id: string; name: string | null; maskedPhone: string | null } | null;
  orders: CustomerOrderRecord[];
}

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  tableNumber: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  items: OrderLineRecord[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  // Part 7/8 foundation: the customer this order is associated with, if
  // any (orders placed before customer auth existed have none). No
  // dedicated history UI consumes this yet — see docs/PROGRESS.md — this
  // is just the real field the order now carries.
  customer: { id: string; customerCode: string; mobileNumber: string | null; email: string | null; name: string | null } | null;
  // Name typed by the customer at QR/takeaway checkout (null on legacy/group orders).
  customerName?: string | null;
  customerPhoneMasked?: string | null;
  // Present only when this order came from a group lobby. A group
  // produces exactly ONE order, so this badges the row rather than
  // implying there are sibling orders to find.
  groupCode: string | null;
  groupMembers: { participantId: string; name: string; phoneMasked: string | null }[];
}

// Day 14 — Customer Home page's "Popular" section. Real order history
// (Day 12), never a fabricated field — see OrdersService.getPopularItems().
export interface PopularItemRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  // Day 22: `orderCount` was REMOVED from this public payload — it
  // published real per-dish sales volume to an unauthenticated
  // endpoint. Ranking still happens server-side; the number itself is
  // internal. See OrdersService.getPopularItems().
  imageUrl: string | null;
}

export interface OrderNotificationSummary {
  pendingCount: number;
  newOrders: {
    id: string;
    orderNumber: string;
    total: number;
    itemCount: number;
    status: OrderStatus;
    createdAt: string;
  }[];
  serverTime: string;
}

// Optional customer recognition (never required to place an order). Every call
// resolves to a status object and NEVER throws: a network error, timeout, 429 or
// 5xx all become `{ status: 'unavailable' }`, so callers can always fall back to
// the name-only checkout.
export interface RecognizedCustomerView {
  name: string | null;
  maskedPhone: string;
}

export type CustomerRecognitionResult =
  | { status: 'recognized'; customer: RecognizedCustomerView; token?: string }
  | { status: 'unrecognized' }
  | { status: 'not_found' }
  | { status: 'invalid'; message: string }
  | { status: 'cleared' }
  | { status: 'unavailable' };

const RECOGNITION_TIMEOUT_MS = 6000;

async function recognitionRequest(restaurantId: string, action: string, body: Record<string, unknown>): Promise<CustomerRecognitionResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECOGNITION_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/public/restaurants/${restaurantId}/customer-recognition/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return { status: 'unavailable' };
    const data = (await res.json().catch(() => null)) as CustomerRecognitionResult | null;
    return data && typeof data.status === 'string' ? data : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

export const customerRecognitionApi = {
  resolve: (restaurantId: string, token: string) => recognitionRequest(restaurantId, 'resolve', { token }),
  returning: (restaurantId: string, phone: string) => recognitionRequest(restaurantId, 'returning', { phone }),
  register: (restaurantId: string, name: string, phone: string) => recognitionRequest(restaurantId, 'register', { name, phone }),
  forget: (restaurantId: string, token: string) => recognitionRequest(restaurantId, 'forget', { token }),
};

export const ordersApi = {
  // Public QR ordering. Only the customer's name is sent - no phone number.
  create: (restaurantId: string, tableId: string | undefined, orderType: 'DINE_IN' | 'TAKEAWAY', items: OrderItemInput[], idempotencyKey: string | undefined, customerName: string, customerPhoneMasked?: string | null, customerRecognitionToken?: string | null) =>
    request<OrderConfirmation>(`/public/restaurants/${restaurantId}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        ...(tableId ? { tableId } : {}),
        orderType,
        items,
        customerName,
        ...(customerPhoneMasked ? { customerPhoneMasked } : {}),
        ...(customerRecognitionToken ? { customerRecognitionToken } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
      }),
    }),

  // Customer history is available only with the opaque, restaurant-scoped
  // recognition token. The browser never sends a customerId or phone as the
  // authorization identity.
  customerHistory: (restaurantId: string, recognitionToken: string) =>
    request<CustomerOrderHistoryResponse>(`/public/restaurants/${restaurantId}/orders`, {
      headers: { 'x-customer-recognition-token': recognitionToken },
    }),

  customerOrder: (restaurantId: string, orderId: string) =>
    request<CustomerOrderRecord>(`/public/restaurants/${restaurantId}/orders/${orderId}`),

  getPopular: (restaurantId: string, limit?: number) =>
    request<PopularItemRecord[]>(
      `/public/restaurants/${restaurantId}/orders/popular${limit ? `?limit=${limit}` : ''}`,
    ),

  // Authenticated — restaurant admin/staff only, restaurant-scoped.
  list: (restaurantId: string) => request<AdminOrderRecord[]>(`/restaurants/${restaurantId}/orders`),

  notificationSummary: (restaurantId: string, since?: string) => {
    const suffix = since ? `?since=${encodeURIComponent(since)}` : '';
    return request<OrderNotificationSummary>(`/restaurants/${restaurantId}/orders/notifications/summary${suffix}`);
  },

  get: (restaurantId: string, orderId: string) =>
    request<AdminOrderRecord>(`/restaurants/${restaurantId}/orders/${orderId}`),

  // Part 2 — persists to MongoDB; the returned record reflects the new
  // status immediately, and it survives refresh/logout-login because
  // list()/get() always read it back from the database, never a
  // client-side default.
  updateStatus: (restaurantId: string, orderId: string, status: OrderStatus) =>
    request<AdminOrderRecord>(`/restaurants/${restaurantId}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ---- Optional customer feedback ----
export type FeedbackFindingEase = 'EASY' | 'MOSTLY' | 'SEARCHED' | 'COULD_NOT_FIND';
export type FeedbackDecisionHelp = 'YES' | 'A_LITTLE' | 'NOT_REALLY' | 'KNEW';

export interface SubmitFeedbackPayload {
  orderId: string;
  rating: number;
  findingEase?: FeedbackFindingEase;
  decisionHelp?: FeedbackDecisionHelp;
  friction?: string;
  improvement?: string;
}

export interface PlatformFeedbackRecord {
  id: string;
  restaurantId: string;
  restaurantName: string;
  orderId: string;
  orderNumber: string;
  rating: number;
  findingEase: FeedbackFindingEase | null;
  decisionHelp: FeedbackDecisionHelp | null;
  friction: string | null;
  improvement: string | null;
  createdAt: string;
}

export interface PlatformFeedbackList {
  items: PlatformFeedbackRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    total: number;
    averageRating: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
}

export const feedbackApi = {
  submit: (restaurantId: string, payload: SubmitFeedbackPayload) =>
    request<{ id: string; submittedAt: string }>(`/public/restaurants/${restaurantId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// This task — restaurant admin dashboard analytics, all computed from
// real Order documents server-side. The selected period controls only the
// metrics that were date-scoped; existing all-time/current-state metrics keep
// their prior meaning.
export interface DashboardTopItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface DashboardTrendPoint {
  date: string; // YYYY-MM-DD in the dashboard application timezone
  sales: number;
  orders: number;
}

export type DashboardPeriod = 'week' | 'month';

export interface DashboardAnalytics {
  period: DashboardPeriod;
  periodSales: number;
  periodOrders: number;
  averageOrderValue: number;
  activeOrders: number;
  completedOrders: number;
  topItems: DashboardTopItem[];
  recentOrders: AdminOrderRecord[];
  trend: DashboardTrendPoint[];
  trendRangeStart: string | null;
  trendRangeEnd: string | null;
  hasPeriodData: boolean;
}

export const analyticsApi = {
  getDashboard: (restaurantId: string, period: DashboardPeriod = 'week') =>
    request<DashboardAnalytics>(`/restaurants/${restaurantId}/analytics/dashboard?period=${period}`),
};

// ---- Admin: restaurant-scoped customer list + history (this task) ----
//
// Restaurant staff's read-only view of legacy/customer records that may
// exist on historical orders. Public QR ordering does not create or require them.
export interface RestaurantCustomerRecord {
  id: string;
  customerCode: string | null;
  name: string | null;
  mobileNumber: string | null;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface CustomerProfile {
  id: string;
  restaurantId: string;
  customerCode: string;
  mobileNumber: string | null;
  email: string | null;
  name: string | null;
}

export interface CustomerHistoryResponse {
  customer: CustomerProfile | null;
  orders: AdminOrderRecord[];
}

export const customersApi = {
  // Restaurant-scoped: only customers with at least one order at this
  // restaurant, computed server-side (never "fetch everyone, filter
  // here") — see OrdersService.listCustomersForRestaurant.
  list: (restaurantId: string) => request<RestaurantCustomerRecord[]>(`/restaurants/${restaurantId}/customers`),

  // Reuses the same order-summary shape the Orders screens already use
  // (`AdminOrderRecord`), plus the customer's own profile fields for the
  // page header — see OrdersService.listCustomerOrdersForRestaurant.
  getHistory: (restaurantId: string, customerId: string) =>
    request<CustomerHistoryResponse>(`/restaurants/${restaurantId}/customers/${customerId}/orders`),
};

// ---- Group ordering (anonymous) ----
export interface GroupMemberItemRecord {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface GroupMemberRecord {
  participantId: string;
  displayName: string;
  phoneMasked: string | null;
  joinedAt: string;
  isYou: boolean;
  items: GroupMemberItemRecord[];
  memberTotal: number;
}

export interface GroupPlacedOrder {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  items: { name: string; price: number; quantity: number; lineTotal: number; addedByName: string | null }[];
  table: { tableNumber: string };
  groupCode: string;
  memberCount: number;
  createdAt: string;
}

export interface GroupOrderRecord {
  groupCode: string;
  status: 'OPEN' | 'ORDERED' | 'CLOSED';
  placedOrderNumber: string | null;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  createdByParticipantId: string;
  isCreator: boolean;
  members: GroupMemberRecord[];
  groupTotal: number;
  createdAt: string;
}

export const groupOrdersApi = {
  create: (restaurantId: string, tableId: string, participantId: string, displayName?: string, phoneMasked?: string | null) =>
    request<GroupOrderRecord>(`/public/restaurants/${restaurantId}/group-orders`, {
      method: 'POST', body: JSON.stringify({ tableId, participantId, ...(displayName ? { displayName } : {}), ...(phoneMasked ? { phoneMasked } : {}) }),
    }),
  join: (restaurantId: string, groupCode: string, participantId: string, displayName?: string, phoneMasked?: string | null) =>
    request<GroupOrderRecord>(`/public/restaurants/${restaurantId}/group-orders/join`, {
      method: 'POST', body: JSON.stringify({ groupCode, participantId, ...(displayName ? { displayName } : {}), ...(phoneMasked ? { phoneMasked } : {}) }),
    }),
  get: (restaurantId: string, groupCode: string, participantId?: string) =>
    request<GroupOrderRecord>(`/public/restaurants/${restaurantId}/group-orders/${encodeURIComponent(groupCode)}${participantId ? `?participantId=${encodeURIComponent(participantId)}` : ''}`),
  placeOrder: (restaurantId: string, groupCode: string, participantId: string) =>
    request<GroupPlacedOrder>(`/public/restaurants/${restaurantId}/group-orders/${encodeURIComponent(groupCode)}/place-order`, {
      method: 'POST', body: JSON.stringify({ participantId }),
    }),
  syncMyItems: (restaurantId: string, groupCode: string, participantId: string, items: OrderItemInput[]) =>
    request<GroupOrderRecord>(`/public/restaurants/${restaurantId}/group-orders/${encodeURIComponent(groupCode)}/my-items`, {
      method: 'PUT', body: JSON.stringify({ participantId, items }),
    }),
};
