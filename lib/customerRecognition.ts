'use client';

// Browser side of optional customer recognition.
//
// Only an opaque random token is stored (never a name, phone or customer id),
// keyed per restaurant so one browser can hold a different identity for each
// restaurant and Restaurant A's token is never offered to Restaurant B.
// Every storage call is guarded: private mode / blocked storage simply means
// "no remembered identity", never an error.

const keyFor = (restaurantId: string) => `mnu_customer_identity:${restaurantId}`;

export function getRecognitionToken(restaurantId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(keyFor(restaurantId)) || null;
  } catch {
    return null;
  }
}

export function saveRecognitionToken(restaurantId: string, token: string): void {
  try {
    localStorage.setItem(keyFor(restaurantId), token);
  } catch {
    /* storage unavailable: the customer is simply asked again next time */
  }
}

// Clears ONLY this restaurant's identity. Cart, table context, admin login and
// other restaurants' identities live under different keys and are untouched.
export function clearRecognitionToken(restaurantId: string): void {
  try {
    localStorage.removeItem(keyFor(restaurantId));
  } catch {
    /* nothing to clear */
  }
}

// Same rule the server applies to Order.customerName (Part 1.6); the server
// remains the authority, this only gives instant feedback.
export function getCustomerNameError(rawName: string): string | null {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name) return 'Please enter your name.';
  if (name.length < 2 || name.length > 80) return 'Name must be between 2 and 80 characters.';
  if (!/^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u.test(name)) return 'Use letters, spaces, apostrophes, dots or hyphens only.';
  return null;
}

export function getPhoneError(rawPhone: string): string | null {
  const compact = rawPhone.trim().replace(/[\s().-]/g, '');
  return /^\+?[0-9]{7,15}$/.test(compact) ? null : 'Please enter a valid phone number.';
}
