import { ClassicyStoreSystemManager } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'
import { Howl } from 'howler'
import React, { createContext, useContext, useReducer } from 'react'
import fetch from 'sync-fetch'
import soundData from '../../../../../public/sounds/platinum/platinum.json'
import soundLabels from './ClassicySoundManagerLabels.json'

export const ClassicySoundManagerContext = createContext(null)
export const ClassicySoundDispatchContext = createContext(null)

export interface ClassicyStoreSystemSoundManager extends ClassicyStoreSystemManager {
    volume: number
    labels: Record<string, { group: string; label: string; description: string }>
    disabled: string[]
}

export type ClassicyThemeSound = {
    file: string
    disabled: string[]
}

export type ClassicySoundInfo = {
    id: string
    group: string
    label: string
    description: string
}

type ClassicySoundState = {
    soundPlayer: Howl | null
    disabled: string[]
    labels: ClassicySoundInfo[]
    volume?: number
}

enum ClassicySoundActionTypes {
    ClassicySoundStop,
    ClassicySoundPlay,
    ClassicySoundPlayInterrupt,
    ClassicySoundPlayError,
    ClassicySoundLoad,
    ClassicySoundSet,
    ClassicySoundDisable,
    ClassicySoundDisableOne,
    ClassicySoundEnableOne,
    ClassicyVolumeSet,
}

interface ClassicySoundAction {
    type: ClassicySoundActionTypes
    sound?: string
    file?: string
    disabled?: string | string[]
    enabled?: string | string[]
    soundPlayer?: any
}

export const createSoundPlayer = ({ soundData, options }: SoundPlayer): Howl => {
    if ('src' in soundData && 'sprite' in soundData) {
        return new Howl({
            src: soundData.src.map((i) => process.env.NEXT_PUBLIC_BASE_PATH + i),
            sprite: soundData.sprite,
            ...options,
        })
    }
}

export const initialPlayer = {
    soundPlayer: createSoundPlayer({ soundData: soundData }),
    disabled: [],
    labels: soundLabels,
    volume: 100,
}

export const getSoundTheme = (soundThemeURL: string) => {
    return fetch(soundThemeURL).json()
}

interface SoundPlayer {
    soundData: {
        src: string[]
        sprite: Record<string, any>
    }
    options?: Record<string, any>
}

export const loadSoundTheme = (soundThemeURL: string): Howl => {
    const data = getSoundTheme(soundThemeURL)
    return createSoundPlayer({ soundData: data })
}

export function useSound() {
    return useContext(ClassicySoundManagerContext)
}

export function useSoundDispatch() {
    return useContext(ClassicySoundDispatchContext)
}

const playerCanPlayInterrupt = ({ disabled, soundPlayer }: ClassicySoundState, sound: string) => {
    return !disabled.includes('*') && !disabled.includes(sound) && soundPlayer
}

const playerCanPlay = (ss: ClassicySoundState, sound: string) => {
    return playerCanPlayInterrupt(ss, sound) && !ss.soundPlayer.playing()
}

export const ClassicySoundStateEventReducer = (ss: ClassicySoundState, action: ClassicySoundAction) => {
    if ('debug' in action) {
        console.group('Sound Event')
        console.log('Action: ', action)
        console.log('Start State: ', ss)
    }

    const validatedAction = ClassicySoundActionTypes[action.type as unknown as keyof typeof ClassicySoundActionTypes]
    switch (validatedAction) {
        case ClassicySoundActionTypes.ClassicySoundStop: {
            ss.soundPlayer.stop()
            break
        }
        case ClassicySoundActionTypes.ClassicySoundPlay: {
            if (playerCanPlay(ss, action.sound)) {
                ss.soundPlayer.play(action.sound)
            }
            break
        }
        case ClassicySoundActionTypes.ClassicySoundPlayInterrupt: {
            if (playerCanPlayInterrupt(ss, action.sound)) {
                ss.soundPlayer.stop()
                ss.soundPlayer.play(action.sound)
            }
            break
        }
        case ClassicySoundActionTypes.ClassicySoundPlayError: {
            if (playerCanPlayInterrupt(ss, action.sound)) {
                ss.soundPlayer.stop()
                ss.soundPlayer.play(action.sound || 'ClassicyAlertWildEep')
            }
            break
        }
        case ClassicySoundActionTypes.ClassicySoundLoad: {
            ss.soundPlayer = loadSoundTheme(process.env.NEXT_PUBLIC_BASE_PATH + action.file)
            ss.disabled = Array.isArray(action.disabled) ? action.disabled : [action.disabled]
            break
        }
        case ClassicySoundActionTypes.ClassicySoundSet: {
            ss.soundPlayer = action.soundPlayer
            break
        }
        case ClassicySoundActionTypes.ClassicyVolumeSet: {
            ss.soundPlayer = action.soundPlayer
            break
        }
        case ClassicySoundActionTypes.ClassicySoundDisable: {
            ss.disabled = Array.isArray(action.disabled) ? action.disabled : [action.disabled]
            break
        }
        case ClassicySoundActionTypes.ClassicySoundDisableOne: {
            let disabled = Array.isArray(action.disabled) ? action.disabled : [action.disabled]
            ss.disabled.push(...disabled)
            ss.disabled = Array.from(new Set(ss.disabled))
            break
        }
        case ClassicySoundActionTypes.ClassicySoundEnableOne: {
            let enabled = Array.isArray(action.enabled) ? action.enabled : [action.enabled]
            ss.disabled = ss.disabled.filter((item) => !enabled.includes(item))
            break
        }
    }
    if ('debug' in action) {
        console.log('End State: ', ss)
        console.groupEnd()
    }

    return ss
}

export const ClassicySoundManagerProvider: React.FC<{ children: any }> = ({ children }) => {
    const [sound, soundDispatch] = useReducer(ClassicySoundStateEventReducer, initialPlayer)

    return (
        <ClassicySoundManagerContext.Provider value={sound}>
            <ClassicySoundDispatchContext.Provider value={soundDispatch}>
                {children}
            </ClassicySoundDispatchContext.Provider>
        </ClassicySoundManagerContext.Provider>
    )
}
