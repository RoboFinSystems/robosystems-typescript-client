/**
 * A controllable operation stream for tests: wraps a fetch mock, answering
 * `/stream` URLs with a live response and passing every other URL through, so
 * a test's REST mocks are not consumed by the stream.
 */
import { vi } from 'vitest'

const encoder = new TextEncoder()

export class FakeStream {
  closed = false
  private controller!: ReadableStreamDefaultController<Uint8Array>
  readonly response: Response

  constructor(
    readonly url: string,
    readonly init: RequestInit
  ) {
    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller
      },
      cancel: () => {
        this.closed = true
      },
    })
    init.signal?.addEventListener('abort', () => {
      this.closed = true
      try {
        this.controller.error(new DOMException('Aborted', 'AbortError'))
      } catch {
        // Already finished.
      }
    })
    this.response = new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  get headers(): Headers {
    return new Headers(this.init.headers)
  }

  /** Sends raw bytes, for tests of how the format is parsed. */
  raw(text: string): void {
    this.controller.enqueue(encoder.encode(text))
  }

  /** Sends a named event, or an unnamed one when `type` is 'message'. */
  send(type: string, data: unknown): void {
    const name = type === 'message' ? '' : `event: ${type}\n`
    this.raw(`${name}data: ${JSON.stringify(data)}\n\n`)
  }

  /** The server closes the stream cleanly. */
  end(): void {
    this.closed = true
    this.controller.close()
  }

  /** The connection is lost mid-stream. */
  drop(): void {
    this.closed = true
    this.controller.error(new TypeError('network error'))
  }
}

type StreamAnswer = Response | Error | (() => Response | Promise<Response>)

export interface StreamFetch {
  fetch: ReturnType<typeof vi.fn>
  streams: FakeStream[]
  last(): FakeStream
  /** Answers the next connect with this instead of opening a stream. */
  answerNext(answer: StreamAnswer): void
  /** Resolves once this many streams exist, with their reading started. */
  opened(count?: number): Promise<FakeStream>
}

export const tick = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

/** Installs the stream handling on `globalThis.fetch` and returns its handle. */
export function installStreamFetch(rest: (...args: any[]) => any = vi.fn()): StreamFetch {
  const streams: FakeStream[] = []
  const answers: StreamAnswer[] = []

  const fetch = vi.fn((input: any, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : (input.url ?? String(input))
    if (!new URL(url).pathname.endsWith('/stream')) return rest(input, init)
    const answer = answers.shift()
    if (answer instanceof Error) return Promise.reject(answer)
    if (answer instanceof Response) return Promise.resolve(answer)
    if (answer) return Promise.resolve(answer())
    const stream = new FakeStream(url, init)
    streams.push(stream)
    return Promise.resolve(stream.response)
  })
  globalThis.fetch = fetch as any
  global.fetch = fetch as any

  return {
    fetch,
    streams,
    last: () => streams[streams.length - 1],
    answerNext: (answer) => {
      answers.push(answer)
    },
    opened: async (count = 1) => {
      await vi.waitFor(() => {
        if (streams.length < count) throw new Error(`waiting for stream ${count}`)
      })
      await tick()
      return streams[count - 1]
    },
  }
}
