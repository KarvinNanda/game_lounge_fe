import { describe, it, expect, afterEach } from 'vitest'
import { newRequestId, requestIdOf } from '@/utils/requestId'
import api, { publicApi } from '@/api/index'

// The backend accepts an X-Request-ID of 1-64 characters [A-Za-z0-9_-] and echoes it
// in the response, so FE and BE logs can be matched.
const VALID = /^[A-Za-z0-9_-]{1,64}$/

describe('newRequestId', () => {
  it('is valid for the backend and unique per call', () => {
    const ids = Array.from({ length: 200 }, () => newRequestId())
    expect(ids.every((id) => VALID.test(id))).toBe(true)
    expect(new Set(ids).size).toBe(200)
  })
  it('still works without crypto.randomUUID (older or non-secure contexts)', () => {
    const id = newRequestId({ getRandomValues: (a) => a.fill(171) })
    expect(id).toMatch(VALID)
    expect(newRequestId({})).toMatch(VALID)
  })
})

describe('requestIdOf', () => {
  it('prefers the ID the server returned, then the one that was sent', () => {
    expect(requestIdOf({ response: { headers: { 'x-request-id': 'srv-1' } }, config: { headers: { 'X-Request-ID': 'sent-1' } } })).toBe('srv-1')
    expect(requestIdOf({ config: { headers: { 'X-Request-ID': 'sent-1' } } })).toBe('sent-1')
    expect(requestIdOf(undefined)).toBe('')
  })
})

describe('every API request carries an X-Request-ID', () => {
  const adapters = {}
  afterEach(() => { api.defaults.adapter = adapters.api; publicApi.defaults.adapter = adapters.publicApi })

  it.each([['api', api], ['publicApi', publicApi]])('%s', async (name, client) => {
    adapters[name] = client.defaults.adapter
    const seen = []
    client.defaults.adapter = (config) => {
      seen.push(config.headers['X-Request-ID'])
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
    }
    await client.get('/a')
    await client.get('/b')
    expect(seen.every((id) => VALID.test(id))).toBe(true)
    expect(seen[0]).not.toBe(seen[1])
  })
})
