// Per-device printing preferences (a counter PC and a kitchen tablet can differ). Browser storage can be
// unavailable or empty, so every access is guarded and falls back to safe defaults.
export type PrintFormat = 'A4' | 'THERMAL80';
const FORMAT_KEY = 'mrwiserr_bill_print_format';
const AUTO_KEY = 'mrwiserr_bill_autoprint_on_ready';

export function readPrintFormat(): PrintFormat {
  try { return localStorage.getItem(FORMAT_KEY) === 'THERMAL80' ? 'THERMAL80' : 'A4'; } catch { return 'A4'; }
}
export function writePrintFormat(format: PrintFormat) { try { localStorage.setItem(FORMAT_KEY, format); } catch { /* ignore */ } }
export function readAutoPrint(): boolean { try { return localStorage.getItem(AUTO_KEY) === '1'; } catch { return false; } }
export function writeAutoPrint(on: boolean) { try { localStorage.setItem(AUTO_KEY, on ? '1' : '0'); } catch { /* ignore */ } }
