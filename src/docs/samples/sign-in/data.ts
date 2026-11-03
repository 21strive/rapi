/**
 * Sample 30 · Sign in & two-factor. One person signing in to their 21 Strive account (the
 * account that opens Simpul and Sesi) on Wed 18 Nov 2026, with the org's two-factor rule on.
 */

export type Locale = 'en' | 'id'

export const account = {
  name: 'Arif Rahman',
  email: 'arif.rahman@kopralabs.io',
  password: 'tanjung-priok-0418',
  org: 'Kopra Labs',
  /** Word joiners after the hyphens keep the number on one line. */
  phone: '+62\u00a0812-\u2060••••-\u20604471',
  generated: '18 Nov 2026 · 14:06 WIB',
}

/** The code typed before the screen opens: wrong, so step 02 starts in its error state. */
export const wrongCode = '482917'

/** Seconds left on the resend timer when the screen opens, and after a resend. */
export const resendStart = 42
export const resendAgain = 60

/** Unambiguous alphabet: no 0/O, 1/I/L. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export const initialCodes = [
  '7KQ4-M2XD',
  'P9WN-3HTA',
  'RC6V-8YJE',
  'H4ZT-KW7N',
  'X3MF-Q9RP',
  'B8JD-6UCK',
  'N2YH-T5VW',
  'E7RA-4PZM',
  'W5CX-J3QF',
  'T6KP-9NDH',
]

export function freshCodes(): string[] {
  const pick = () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  const part = () => Array.from({ length: 4 }, pick).join('')
  return Array.from({ length: 10 }, () => `${part()}-${part()}`)
}

export const normalizeCode = (value: string) => value.toUpperCase().replace(/[^0-9A-Z]/g, '')

/** "7kq4m2xd" → "7KQ4-M2XD", as the code is typed. */
export function formatCode(value: string): string {
  const raw = normalizeCode(value).slice(0, 8)
  return raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw
}

/** "01  7KQ4-M2XD   06  B8JD-6UCK": two columns of five, used codes dotted out. */
export function codeSheet(codes: string[], used: string[]): string {
  const cell = (i: number) => {
    const code = used.includes(codes[i]) ? '····-····' : codes[i]
    return `${String(i + 1).padStart(2, '0')}  ${code}`
  }
  return Array.from({ length: 5 }, (_, row) => `${cell(row)}   ${cell(row + 5)}`).join('\n')
}

/** The .txt the Download button writes. */
export function codeFile(codes: string[], used: string[]): string {
  const lines = codes.map((code, i) => `${String(i + 1).padStart(2, '0')}  ${code}${used.includes(code) ? '  (used)' : ''}`)
  return [
    '21 Strive account · recovery codes',
    `Account: ${account.email}`,
    `Generated: ${account.generated}`,
    'Each code signs you in once.',
    '',
    ...lines,
    '',
  ].join('\n')
}

const en = {
  account: '21 Strive account',
  language: 'Language',
  help: 'Help',
  pageTitle: 'Sign in to your 21 Strive account',
  tagline: 'One account for every 21\u00a0Strive product.',
  step: 'Step',
  flow: 'Sign in on a new device',
  flowMeta: 'Kopra Labs · 2FA required',
  footer: {
    rights: '© 2026 21 Strive',
    privacy: 'Privacy',
    terms: 'Terms',
    status: 'All systems nominal',
  },
  signIn: {
    title: 'Sign in',
    sub: 'Use your work email. The same account opens Simpul and Sesi.',
    email: 'Work email',
    password: 'Password',
    forgot: 'Forgot password?',
    showPassword: 'Show password',
    remember: 'Remember this device for 30 days',
    submit: 'Continue',
    or: 'or',
    sso: 'Continue with single sign-on',
    passkey: 'Sign in with a passkey',
    note: 'No account? Ask your workspace admin for an invite.',
    errEmailEmpty: 'Enter your work email.',
    errEmailInvalid: 'Enter an email like name@company.com.',
    errPassword: 'Enter your password.',
    statusReady: 'Ready',
    statusDone: 'Signed in',
  },
  code: {
    title: 'Enter the code',
    sub: (phone: string) => `We sent a 6-\u2060digit code to ${phone}.`,
    label: 'Verification code',
    digit: (n: number) => `Digit ${n} of 6`,
    mismatch: (left: number) => `That code doesn't match. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`,
    locked: 'Too many attempts. Request a new code.',
    verifiedLine: 'Phone verified. This device is signed in.',
    resendIn: 'Resend in',
    resend: 'Resend code',
    verify: 'Verify',
    next: 'Continue',
    otherWays: 'Other ways',
    useRecovery: 'Use a recovery code',
    useSms: 'Use the SMS code',
    voice: 'Get the code by voice call',
    recoveryLabel: 'Recovery code',
    recoveryInvalid: "That recovery code isn't valid or was already used.",
    note: 'Codes expire 10 minutes after they are sent.',
    statusSent: 'Code sent',
    statusVerifying: 'Verifying',
    statusRetry: 'Retry',
    statusLocked: 'Locked',
    statusVerified: 'Verified',
  },
  recovery: {
    title: 'Save your recovery codes',
    sub: (org: string) => `${org} requires 2FA for every member. If you lose your phone, each code signs you in once.`,
    download: 'Download .txt',
    print: 'Print',
    regenerate: 'Generate new codes',
    ack: 'I saved these codes somewhere safe',
    finish: 'Finish setup',
    finished: 'Setup complete',
    doneLine: (email: string) => `Two-factor sign-in is on for ${email}.`,
    generated: (when: string) => `Generated ${when}`,
    unused: (n: number) => `${n} of 10 unused`,
    statusPending: 'Pending',
    statusSaved: 'Saved',
  },
  toast: {
    signedIn: { title: 'Password accepted', body: (phone: string) => `We sent a code to ${phone}.` },
    forgot: { title: 'Reset link sent', body: (email: string) => `Check ${email}. The link works for 60 minutes.` },
    sso: { title: 'Opening Kopra Labs single sign-on', body: 'You come back here once your identity provider signs you in.' },
    passkey: { title: 'Waiting for your passkey', body: 'Confirm on this device or on your phone.' },
    resent: { title: 'New code sent', body: (phone: string) => `${phone} · expires in 10 minutes` },
    voice: { title: 'Calling you now', body: (phone: string) => `${phone} · an automated voice reads the code twice.` },
    verified: { title: 'Phone verified', body: 'Two-factor check passed for this sign-in.' },
    recoveryUsed: { title: 'Recovery code accepted', body: (left: number) => `${left} codes left. Generate new ones when you run low.` },
    downloaded: { title: 'recovery-codes.txt downloaded', body: 'Keep it somewhere other than this device.' },
    printed: { title: 'Printable copy ready', body: 'Only the codes are printed, not your account details.' },
    regenerated: { title: 'New codes generated', body: 'The previous 10 codes no longer work.' },
    finished: { title: 'Two-factor authentication is on', body: (name: string) => `Signed in to Simpul as ${name}.` },
    help: { title: 'Support is online', body: 'Chat with the 21 Strive team, 08:00–20:00 WIB.' },
  },
}

export type Copy = typeof en

const id: Copy = {
  account: 'Akun 21 Strive',
  language: 'Bahasa',
  help: 'Bantuan',
  pageTitle: 'Masuk ke akun 21 Strive Anda',
  tagline: 'Satu akun untuk semua produk 21\u00a0Strive.',
  step: 'Langkah',
  flow: 'Masuk di perangkat baru',
  flowMeta: 'Kopra Labs · wajib 2FA',
  footer: {
    rights: '© 2026 21 Strive',
    privacy: 'Privasi',
    terms: 'Ketentuan',
    status: 'Semua sistem normal',
  },
  signIn: {
    title: 'Masuk',
    sub: 'Gunakan email kerja Anda. Akun yang sama membuka Simpul dan Sesi.',
    email: 'Email kerja',
    password: 'Kata sandi',
    forgot: 'Lupa kata sandi?',
    showPassword: 'Tampilkan kata sandi',
    remember: 'Ingat perangkat ini selama 30 hari',
    submit: 'Lanjutkan',
    or: 'atau',
    sso: 'Masuk dengan single sign-on',
    passkey: 'Masuk dengan passkey',
    note: 'Belum punya akun? Minta undangan dari admin workspace.',
    errEmailEmpty: 'Masukkan email kerja Anda.',
    errEmailInvalid: 'Masukkan email seperti nama@perusahaan.com.',
    errPassword: 'Masukkan kata sandi Anda.',
    statusReady: 'Siap',
    statusDone: 'Masuk',
  },
  code: {
    title: 'Masukkan kode',
    sub: (phone: string) => `Kami mengirim kode 6 digit ke ${phone}.`,
    label: 'Kode verifikasi',
    digit: (n: number) => `Digit ${n} dari 6`,
    mismatch: (left: number) => `Kode tidak cocok. Sisa ${left} percobaan.`,
    locked: 'Terlalu banyak percobaan. Minta kode baru.',
    verifiedLine: 'Nomor terverifikasi. Perangkat ini sudah masuk.',
    resendIn: 'Kirim ulang dalam',
    resend: 'Kirim ulang kode',
    verify: 'Verifikasi',
    next: 'Lanjutkan',
    otherWays: 'Cara lain',
    useRecovery: 'Gunakan kode pemulihan',
    useSms: 'Gunakan kode SMS',
    voice: 'Terima kode lewat telepon',
    recoveryLabel: 'Kode pemulihan',
    recoveryInvalid: 'Kode pemulihan tidak valid atau sudah dipakai.',
    note: 'Kode berlaku 10 menit setelah dikirim.',
    statusSent: 'Terkirim',
    statusVerifying: 'Memeriksa',
    statusRetry: 'Ulangi',
    statusLocked: 'Terkunci',
    statusVerified: 'Terverifikasi',
  },
  recovery: {
    title: 'Simpan kode pemulihan',
    sub: (org: string) => `${org} mewajibkan 2FA untuk semua anggota. Jika ponsel Anda hilang, setiap kode bisa dipakai sekali untuk masuk.`,
    download: 'Unduh .txt',
    print: 'Cetak',
    regenerate: 'Buat kode baru',
    ack: 'Kode ini sudah saya simpan dengan aman',
    finish: 'Selesaikan',
    finished: 'Pengaturan selesai',
    doneLine: (email: string) => `Verifikasi dua langkah aktif untuk ${email}.`,
    generated: (when: string) => `Dibuat ${when}`,
    unused: (n: number) => `${n} dari 10 belum dipakai`,
    statusPending: 'Menunggu',
    statusSaved: 'Tersimpan',
  },
  toast: {
    signedIn: { title: 'Kata sandi diterima', body: (phone: string) => `Kode dikirim ke ${phone}.` },
    forgot: { title: 'Tautan reset terkirim', body: (email: string) => `Periksa ${email}. Tautan berlaku 60 menit.` },
    sso: { title: 'Membuka single sign-on Kopra Labs', body: 'Anda kembali ke sini setelah penyedia identitas memverifikasi Anda.' },
    passkey: { title: 'Menunggu passkey Anda', body: 'Konfirmasi di perangkat ini atau di ponsel Anda.' },
    resent: { title: 'Kode baru terkirim', body: (phone: string) => `${phone} · berlaku 10 menit` },
    voice: { title: 'Kami menelepon Anda', body: (phone: string) => `${phone} · suara otomatis membacakan kode dua kali.` },
    verified: { title: 'Nomor terverifikasi', body: 'Verifikasi dua langkah berhasil untuk proses masuk ini.' },
    recoveryUsed: { title: 'Kode pemulihan diterima', body: (left: number) => `Sisa ${left} kode. Buat kode baru jika hampir habis.` },
    downloaded: { title: 'recovery-codes.txt diunduh', body: 'Simpan di tempat lain selain perangkat ini.' },
    printed: { title: 'Salinan cetak siap', body: 'Hanya kode yang dicetak, tanpa detail akun Anda.' },
    regenerated: { title: 'Kode baru dibuat', body: '10 kode sebelumnya tidak berlaku lagi.' },
    finished: { title: 'Verifikasi dua langkah aktif', body: (name: string) => `Masuk ke Simpul sebagai ${name}.` },
    help: { title: 'Tim bantuan sedang online', body: 'Chat dengan tim 21 Strive, 08.00–20.00 WIB.' },
  },
}

export const copy: Record<Locale, Copy> = { en, id }

export const languages = [
  { label: 'EN', value: 'en' },
  { label: 'ID', value: 'id' },
]
