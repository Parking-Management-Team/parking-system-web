/**
 * useLandingPricing - Lightweight pricing hook for the public landing page.
 *
 * Fetches ACTIVE pricing policies from the backend and extracts the first
 * window for each vehicle type (Motorcycle / Car) to display on the landing page.
 * No authentication required — uses raw fetch with the same base URL.
 */

import { useState, useEffect } from 'react'
import { APP_CONFIG } from '@/constants/config'

interface PricingWindow {
  windowName: string
  startTime: string
  endTime: string
  baseDurationMinutes: number
  basePrice: number
  incrementBlockMinutes: number
  incrementPrice: number
  windowCap: number | null
  gracePeriodMinutes: number
}

interface PricingPolicy {
  vehicleTypeId: number
  vehicleTypeName?: string
  pricingPolicyStatus: string
  pricingWindows: PricingWindow[]
}

export interface VehicleRate {
  basePrice: number
  baseDurationHours: number
  extraPerHour: number
  cap: number | null
  gracePeriodMinutes: number
  windowName: string
}

export interface LandingPricingData {
  motorcycle: { day: VehicleRate | null; night: VehicleRate | null }
  car:        { day: VehicleRate | null; night: VehicleRate | null }
  gracePeriodMinutes: number
}

function toVehicleRate(win: PricingWindow): VehicleRate {
  return {
    basePrice: win.basePrice,
    baseDurationHours: win.baseDurationMinutes / 60,
    extraPerHour: win.incrementPrice / (win.incrementBlockMinutes / 60),
    cap: win.windowCap,
    gracePeriodMinutes: win.gracePeriodMinutes,
    windowName: win.windowName,
  }
}

/** Returns true if the time window is a "night" window (starts at or after 18:00) */
function isNightWindow(startTime: string): boolean {
  const hour = parseInt(startTime.slice(0, 2), 10)
  return hour >= 18 || hour < 6
}

export function useLandingPricing() {
  const [data, setData] = useState<LandingPricingData>({
    motorcycle: { day: null, night: null },
    car:        { day: null, night: null },
    gracePeriodMinutes: 15,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch(`${APP_CONFIG.apiBaseUrl}/pricing-policies`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        const policies: PricingPolicy[] = Array.isArray(json?.data) ? json.data : []
        const active = policies.filter(
          p => p.pricingPolicyStatus === 'Active' || p.pricingPolicyStatus === 'ACTIVE'
        )

        const result: LandingPricingData = {
          motorcycle: { day: null, night: null },
          car:        { day: null, night: null },
          gracePeriodMinutes: 15,
        }

        for (const policy of active) {
          // vehicleTypeId 1 = Motorcycle, 2 = Car (per backend convention)
          const vehicleKey: 'motorcycle' | 'car' | null =
            policy.vehicleTypeId === 1 ? 'motorcycle' :
            policy.vehicleTypeId === 2 ? 'car' : null

          if (!vehicleKey) continue

          for (const win of policy.pricingWindows) {
            const slot = isNightWindow(win.startTime) ? 'night' : 'day'
            if (!result[vehicleKey][slot]) {
              result[vehicleKey][slot] = toVehicleRate(win)
              // Use largest gracePeriod found
              if (win.gracePeriodMinutes > result.gracePeriodMinutes) {
                result.gracePeriodMinutes = win.gracePeriodMinutes
              }
            }
          }
        }

        setData(result)
      } catch (err) {
        console.error('[useLandingPricing] Failed to fetch pricing:', err)
        setError('Unable to load pricing. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  return { data, loading, error }
}
