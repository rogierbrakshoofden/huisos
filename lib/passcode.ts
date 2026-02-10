import crypto from 'crypto'
import { supabase } from './supabase'

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
 * Get the stored household ID from the current session
 * Returns null if not logged in
 */
export function getHouseholdId(): string | null {
  if (typeof window === 'undefined') return null
  
  // Try to get from current session
  const session = supabase.auth.getSession()
  // Note: getSession() returns a Promise, but we're checking synchronously
  // The session should be available in memory after initial auth
  
  // Fallback to localStorage for immediate access
  return localStorage.getItem('huisos_household_id')
}

/**
 * Get household ID from JWT claims (async)
 * This is the authoritative source after login
 */
export async function getHouseholdIdFromSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.user_metadata?.household_id || null
}

/**
 * Log in with a 6-digit passcode
 * Creates an anonymous Supabase session with household_id in JWT claims
 * Returns the hashed household ID
 */
export async function loginWithPasscode(code: string): Promise<string> {
  if (!validatePasscode(code)) {
    throw new Error('Passcode must be exactly 6 digits')
  }

  const householdId = hashPasscode(code)

  // Sign in anonymously with household_id in user metadata
  // This puts household_id into the JWT claims that RLS policies can read
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        household_id: householdId
      }
    }
  })

  if (error) {
    throw new Error(`Login failed: ${error.message}`)
  }

  if (!data.user) {
    throw new Error('Login failed: No user returned')
  }

  // Store in localStorage for quick synchronous access
  localStorage.setItem('huisos_household_id', householdId)
  // Store original passcode for potential re-authentication
  localStorage.setItem('huisos_passcode', code)
  localStorage.setItem('huisos_login_timestamp', Date.now().toString())

  console.log('✅ Logged in with household_id:', householdId.substring(0, 8))
  console.log('✅ User ID:', data.user.id)

  return householdId
}

/**
 * Log out by signing out of Supabase and clearing localStorage
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut()
  localStorage.removeItem('huisos_household_id')
  localStorage.removeItem('huisos_passcode')
  localStorage.removeItem('huisos_login_timestamp')
}

/**
 * Check if currently logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Initialize auth state on app load
 * Checks if there's an existing session, if not tries to restore from stored passcode
 */
export async function initializeAuth(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // Ensure localStorage is in sync
    const householdId = session.user.user_metadata?.household_id
    if (householdId) {
      localStorage.setItem('huisos_household_id', householdId)
      return true
    }
  }
  
  // Try to restore session from stored passcode
  const storedPasscode = localStorage.getItem('huisos_passcode')
  if (storedPasscode && validatePasscode(storedPasscode)) {
    try {
      await loginWithPasscode(storedPasscode)
      return true
    } catch (err) {
      console.error('Failed to restore session:', err)
      // Clear invalid stored data
      localStorage.removeItem('huisos_passcode')
      localStorage.removeItem('huisos_household_id')
    }
  }
  
  return false
}
