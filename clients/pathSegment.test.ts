/**
 * A value interpolated into a request path is one segment or nothing: a graph
 * id taken from a URL must not be able to point the request, and the
 * credential attached to it, at another endpoint.
 */
import { describe, expect, it } from 'vitest'
import { createGraphQLClient, pathSegment } from './graphql/client'

describe('pathSegment', () => {
  it('accepts graph ids as the API issues them', () => {
    expect(pathSegment('kg0123456789abcdef', 'graphId')).toBe('kg0123456789abcdef')
    expect(pathSegment('kg0123456789abcdef_dev', 'graphId')).toBe('kg0123456789abcdef_dev')
    expect(pathSegment('sec', 'graphId')).toBe('sec')
  })

  it.each([
    '../v1/graphs/kgDUMMYVICTIM/operations/materialize?',
    'roboledger/kgDUMMYVICTIM/operations/accept-suggestions?',
    'kg0123456789abcdef/graphql',
    'kg0123456789abcdef?x=1',
    'kg0123456789abcdef#frag',
    '..',
    '.',
    '',
    'kg 0123',
    'a'.repeat(129),
  ])('refuses %j', (value) => {
    expect(() => pathSegment(value, 'graphId')).toThrow('graphId must be a single path segment')
  })
})

describe('createGraphQLClient', () => {
  it('refuses a graph id that would re-target the request', () => {
    expect(() =>
      createGraphQLClient(
        { baseUrl: 'https://api.example.test' },
        '../v1/graphs/kgDUMMYVICTIM/operations/materialize?'
      )
    ).toThrow('graphId must be a single path segment')
  })
})
