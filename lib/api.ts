import { getHouseholdId } from './passcode'

/**
 * Generic API call wrapper that automatically includes household_id header
 * All API calls should go through this to ensure household isolation
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const householdId = getHouseholdId()

  if (!householdId) {
    throw new Error('Not authenticated - please log in first')
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-household-id': householdId,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API error (${response.status}):`, errorText)
    throw new Error(`API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}
