import crypto from 'crypto'

/**
 * Validates that a passcode is exactly 6 digits
 */
export function validatePasscode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * Converts a 6-digit passcode to a SHA256 hash
 * This hash becomes the household_id in the database
 */
export function hashPasscode(code: string): string {
  if (!validatePasscode(code)) {
    throw new Error('Passcode must be exactly 6 digits')
  }

  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex')
}

/**
 * Get the stored household ID from localStorage (client-side only)
 * Returns null if not logged in
 */
export function getHouseholdId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('huisos_household_id')
}

/**
 * Log in with a 6-digit passcode
 * Stores the hashed household ID in localStorage
 * Returns the hashed household ID
 */
export function loginWithPasscode(code: string): string {
  if (!validatePasscode(code)) {
    throw new Error('Passcode must be exactly 6 digits')
  }

  const householdId = hashPasscode(code)
  localStorage.setItem('huisos_household_id', householdId)
  localStorage.setItem('huisos_login_timestamp', Date.now().toString())

  return householdId
}

/**
 * Log out by clearing household ID from localStorage
 */
export function logout(): void {
  localStorage.removeItem('huisos_household_id')
  localStorage.removeItem('huisos_login_timestamp')
}

/**
 * Check if currently logged in
 */
export function isLoggedIn(): boolean {
  return !!getHouseholdId()
}
