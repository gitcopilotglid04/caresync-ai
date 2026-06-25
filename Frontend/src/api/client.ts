import type {
  CoordinateResponse,
  CheckinRequest,
  CheckinResponse,
  QueueResponse,
} from './types'
import { mockQueue, mockRun, mockCheckins } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

/* ─── Simulation helpers ─── */

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

function getSimParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get(key)
}

async function simulateDelay(): Promise<void> {
  const delay = getSimParam('sim_delay')
  const ms = delay ? parseInt(delay, 10) : 800
  await new Promise(r => setTimeout(r, ms))
}

function maybeThrowSimulatedError(endpoint: string): void {
  const simError = getSimParam('sim_error')
  if (!simError) return

  const status = parseInt(simError, 10)
  if (status === 422) {
    throw new ApiError(422, 'Validation failed: discharge summary is missing required fields (diagnosis, medications).')
  }
  if (status === 503) {
    throw new ApiError(503, 'Model service unavailable — the inference backend is not responding. Try again in a moment.')
  }
  throw new ApiError(500, `Internal server error while calling ${endpoint}. The team has been notified.`)
}

/* ─── Fetch wrapper ─── */

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    if (res.status === 422) throw new ApiError(422, 'Validation failed: check your input and try again.')
    if (res.status === 503) throw new ApiError(503, 'Model service unavailable — the inference backend is not responding. Try again in a moment.')
    throw new ApiError(res.status, `Server error (${res.status}). Please try again.`)
  }
  return res.json() as Promise<T>
}

/* ─── Queue ─── */

export async function getQueue(): Promise<QueueResponse> {
  if (USE_MOCKS) {
    await simulateDelay()
    maybeThrowSimulatedError('getQueue')
    const simEmpty = getSimParam('sim_empty')
    if (simEmpty === '1' || simEmpty === 'true') {
      return { patients: [], stats: { active_patients: 0, needs_review: 0, immediate: 0, new_signals_today: 0 } }
    }
    return mockQueue
  }
  return fetchJson<QueueResponse>('/queue')
}

/* ─── Run detail ─── */

export async function getRun(runId: string): Promise<CoordinateResponse> {
  if (USE_MOCKS) {
    await simulateDelay()
    maybeThrowSimulatedError('getRun')
    return mockRun
  }
  return fetchJson<CoordinateResponse>(`/runs/${runId}`)
}

/* ─── Coordinate (intake) ─── */

export async function coordinate(payload: {
  discharge_summary: string
  patient_context?: Record<string, unknown>
}): Promise<CoordinateResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 3000))
    maybeThrowSimulatedError('coordinate')
    return mockRun
  }
  return fetchJson<CoordinateResponse>('/coordinate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ─── Check-in ─── */

export async function checkin(payload: CheckinRequest): Promise<CheckinResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 600))
    maybeThrowSimulatedError('checkin')
    const scenario = payload.patient_message
    return mockCheckins[scenario] ?? mockCheckins['good']
  }
  return fetchJson<CheckinResponse>('/checkin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
