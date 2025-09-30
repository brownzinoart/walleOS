'use client'

import {
    ClassicyStoreSystemManager,
    UnknownRecord,
} from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'
import { Howl, HowlOptions } from 'howler'
import React, { createContext, ReactNode, useContext, useReducer } from 'react'
import fetch from 'sync-fetch'
import soundData from './platinum.json'
import soundLabels from './ClassicySoundManagerLabels.json'

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
    soundPlayer: Howl
    disabled: string[]
    labels: ClassicySoundInfo[]
    volume: number
}

type ClassicySoundActionType =
    | 'ClassicySoundStop'
    | 'ClassicySoundPlay'
    | 'ClassicySoundPlayInterrupt'
    | 'ClassicySoundPlayError'
    | 'ClassicySoundLoad'
    | 'ClassicySoundSet'
    | 'ClassicySoundDisable'
    | 'ClassicySoundDisableOne'
    | 'ClassicySoundEnableOne'
    | 'ClassicyVolumeSet'

interface ClassicySoundAction extends UnknownRecord {
    type: ClassicySoundActionType
    sound?: string
    file?: string
    disabled?: string | string[]
    enabled?: string | string[]
    soundPlayer?: Howl
    debug?: boolean
}

interface SoundThemeData {
    src: string[]
    sprite: Record<string, [number, number]>
}

interface SoundPlayerConfig {
    soundData: SoundThemeData
    options?: HowlOptions
}

const ensureContext = <T,>(value: T | null, name: string): T => {
    if (value === null) {
        throw new Error(`${name} must be used within a provider`)
    }
    return value
}

const createSoundPlayer = ({ soundData, options }: SoundPlayerConfig): Howl => {
    if (!soundData.src || !soundData.sprite) {
        throw new Error('Invalid sound data configuration')
    }

    return new Howl({
        src: soundData.src.map((item) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${item}`),
        sprite: soundData.sprite,
        ...options,
    })
}

const valueToArray = (value: string | string[] | undefined): string[] => {
    if (!value) {
        return []
    }
    return Array.isArray(value) ? value : [value]
}

const getSoundTheme = (soundThemeURL: string): SoundThemeData => {
    return fetch(soundThemeURL).json() as SoundThemeData
}

const loadSoundTheme = (soundThemeURL: string): Howl => {
    const data = getSoundTheme(soundThemeURL)
    return createSoundPlayer({ soundData: data })
}

const initialPlayer: ClassicySoundState = {
    soundPlayer: createSoundPlayer({ soundData }),
    disabled: [],
    labels: soundLabels,
    volume: 100,
}

export const ClassicySoundManagerContext = createContext<ClassicySoundState | null>(null)
export const ClassicySoundDispatchContext = createContext<React.Dispatch<ClassicySoundAction> | null>(null)

const playerCanPlayInterrupt = (
    { disabled, soundPlayer }: ClassicySoundState,
    sound: string | undefined
): boolean => {
    if (!sound) {
        return false
    }
    if (disabled.includes('*') || disabled.includes(sound)) {
        return false
    }
    return Boolean(soundPlayer)
}

const playerCanPlay = (state: ClassicySoundState, sound: string | undefined): boolean => {
    return playerCanPlayInterrupt(state, sound) && !state.soundPlayer.playing()
}

const ClassicySoundStateEventReducer = (state: ClassicySoundState, action: ClassicySoundAction): ClassicySoundState => {
    if (action.debug) {
        console.group('Sound Event')
        console.log('Action: ', action)
        console.log('Start State: ', state)
    }

    const nextState: ClassicySoundState = { ...state }

    switch (action.type) {
        case 'ClassicySoundStop': {
            nextState.soundPlayer.stop()
            break
        }
        case 'ClassicySoundPlay': {
            if (action.sound && playerCanPlay(nextState, action.sound)) {
                nextState.soundPlayer.play(action.sound)
            }
            break
        }
        case 'ClassicySoundPlayInterrupt': {
            if (action.sound && playerCanPlayInterrupt(nextState, action.sound)) {
                nextState.soundPlayer.stop()
                nextState.soundPlayer.play(action.sound)
            }
            break
        }
        case 'ClassicySoundPlayError': {
            if (playerCanPlayInterrupt(nextState, action.sound)) {
                nextState.soundPlayer.stop()
                nextState.soundPlayer.play(action.sound ?? 'ClassicyAlertWildEep')
            }
            break
        }
        case 'ClassicySoundLoad': {
            if (action.file) {
                nextState.soundPlayer = loadSoundTheme(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${action.file}`)
            }
            nextState.disabled = valueToArray(action.disabled)
            break
        }
        case 'ClassicySoundSet': {
            if (action.soundPlayer) {
                nextState.soundPlayer = action.soundPlayer
            }
            break
        }
        case 'ClassicyVolumeSet': {
            if (action.soundPlayer) {
                nextState.soundPlayer = action.soundPlayer
            }
            break
        }
        case 'ClassicySoundDisable': {
            nextState.disabled = valueToArray(action.disabled)
            break
        }
        case 'ClassicySoundDisableOne': {
            const disabled = valueToArray(action.disabled)
            nextState.disabled = Array.from(new Set([...nextState.disabled, ...disabled]))
            break
        }
        case 'ClassicySoundEnableOne': {
            const enabled = valueToArray(action.enabled)
            nextState.disabled = nextState.disabled.filter((item) => !enabled.includes(item))
            break
        }
    }

    if (action.debug) {
        console.log('End State: ', nextState)
        console.groupEnd()
    }

    return nextState
}

export const ClassicySoundManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sound, soundDispatch] = useReducer(ClassicySoundStateEventReducer, initialPlayer)

    return (
        <ClassicySoundManagerContext.Provider value={sound}>
            <ClassicySoundDispatchContext.Provider value={soundDispatch}>
                {children}
            </ClassicySoundDispatchContext.Provider>
        </ClassicySoundManagerContext.Provider>
    )
}

export function useSound(): ClassicySoundState {
    return ensureContext(useContext(ClassicySoundManagerContext), 'ClassicySoundManagerContext')
}

export function useSoundDispatch(): React.Dispatch<ClassicySoundAction> {
    return ensureContext(useContext(ClassicySoundDispatchContext), 'ClassicySoundDispatchContext')
}
