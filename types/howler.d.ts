declare module 'howler' {
    export interface HowlOptions {
        src: string[]
        sprite?: Record<string, [number, number] | [number, number, number]>
        volume?: number
        loop?: boolean
        autoplay?: boolean
        html5?: boolean
        preload?: boolean | 'auto'
        xhrWithCredentials?: boolean
        format?: string[]
        onplay?: (soundId: number) => void
        onstop?: (soundId: number) => void
        onpause?: (soundId: number) => void
        onend?: (soundId: number) => void
        onload?: () => void
        onloaderror?: (soundId: number, error: unknown) => void
        onplayerror?: (soundId: number, error: unknown) => void
        [key: string]: unknown
    }

    export class Howl {
        constructor(options: HowlOptions)
        play(idOrSprite?: string | number): number
        stop(id?: number): this
        pause(id?: number): this
        playing(id?: number): boolean
        volume(volume?: number, id?: number): number
        seek(seek?: number, id?: number): number
        loop(loop?: boolean, id?: number): boolean
        mute(muted?: boolean, id?: number): this
        unload(): void
    }

    export const Howler: {
        mute(muted?: boolean): void
        volume(volume?: number): number
    }
}
