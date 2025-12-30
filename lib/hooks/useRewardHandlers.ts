import { useCallback } from 'react'
import { useApp } from '@/lib/context-v2'
import confetti from 'canvas-confetti'

export function useRewardHandlers(
  currentUserId: string,
  toast: (message: string, type: 'success' | 'error') => void
) {
  const { state, dispatch } = useApp()

  const handleRedeemReward = useCallback(
    async (rewardId: string) => {
      try {
        const response = await fetch('/api/rewards/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rewardId,
            memberId: currentUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to redeem reward')
        }

        const claim = await response.json()
        dispatch({
          type: 'ADD_REWARD_CLAIM',
          payload: claim.claim,
        })

        toast('🎁 Reward redeemed! Parents will review soon.', 'success')

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.3 },
        })

        return true // Success indicator for modal close
      } catch (err) {
        const message = (err as Error).message
        toast(message, 'error')
        throw err
      }
    },
    [currentUserId, dispatch, toast]
  )

  const handleApproveRewardClaim = useCallback(
    async (claimId: string) => {
      try {
        const response = await fetch('/api/rewards/update-claim', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claimId,
            status: 'approved',
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to approve reward')
        }

        const claim = state.rewardClaims.find((c) => c.id === claimId)
        if (claim) {
          dispatch({
            type: 'UPDATE_REWARD_CLAIM',
            payload: { ...claim, status: 'approved' },
          })
        }
        toast('Reward approved ✓', 'success')
      } catch (err) {
        const message = (err as Error).message
        toast(message, 'error')
        throw err
      }
    },
    [dispatch, state.rewardClaims, toast]
  )

  const handleClaimReward = useCallback(
    async (claimId: string) => {
      try {
        const response = await fetch('/api/rewards/update-claim', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claimId,
            status: 'claimed',
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to claim reward')
        }

        const claim = state.rewardClaims.find((c) => c.id === claimId)
        if (claim) {
          dispatch({
            type: 'UPDATE_REWARD_CLAIM',
            payload: {
              ...claim,
              status: 'claimed',
              claimed_at: new Date().toISOString(),
            },
          })
        }
        toast('Reward claimed! Enjoy! 🎉', 'success')
      } catch (err) {
        const message = (err as Error).message
        toast(message, 'error')
        throw err
      }
    },
    [dispatch, state.rewardClaims, toast]
  )

  return {
    handleRedeemReward,
    handleApproveRewardClaim,
    handleClaimReward,
  }
}
