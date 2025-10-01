declare module 'sync-fetch' {
    interface SyncFetchOptions {
        method?: string
        headers?: Record<string, string>
        body?: string
    }

    interface SyncFetchResponse {
        json<T = unknown>(): T
        text(): string
        buffer(): Buffer
        status: number
        ok: boolean
        headers: Record<string, string>
    }

    export default function syncFetch(url: string, options?: SyncFetchOptions): SyncFetchResponse
}
