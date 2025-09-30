'use client'

import { ClassicySoundManagerProvider } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManagerContext'
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react'
import {
    classicyDesktopStateEventReducer,
    ClassicyAction,
    ClassicyStore,
    DefaultDesktopState,
} from './ClassicyAppManager'

const ClassicyDesktopContext = createContext<ClassicyStore | null>(null)
const ClassicyDesktopDispatchContext = createContext<React.Dispatch<ClassicyAction> | null>(null)

interface ClassicyDesktopProviderProps {
    children: ReactNode
}

export const ClassicyDesktopProvider: React.FC<ClassicyDesktopProviderProps> = ({ children }) => {
    let desktopState: ClassicyStore

    if (typeof window !== 'undefined') {
        try {
            const storedState = localStorage.getItem('classicyDesktopState')
            desktopState = storedState ? (JSON.parse(storedState) as ClassicyStore) : DefaultDesktopState
        } catch (error) {
            console.error('Error parsing desktop state:', error)
            desktopState = DefaultDesktopState
        }
    } else {
        desktopState = DefaultDesktopState
    }

    const [desktop, dispatch] = useReducer(classicyDesktopStateEventReducer, desktopState)

    useEffect(() => {
        localStorage.setItem('classicyDesktopState', JSON.stringify(desktop))
    }, [desktop])

    return (
        <ClassicyDesktopContext.Provider value={desktop}>
            <ClassicyDesktopDispatchContext.Provider value={dispatch}>
                <ClassicySoundManagerProvider>{children}</ClassicySoundManagerProvider>
            </ClassicyDesktopDispatchContext.Provider>
        </ClassicyDesktopContext.Provider>
    )
}

const ensureContext = <T,>(value: T | null, name: string): T => {
    if (value === null) {
        throw new Error(`${name} must be used within a provider`)
    }
    return value
}

export function useDesktop(): ClassicyStore {
    return ensureContext(useContext(ClassicyDesktopContext), 'ClassicyDesktopContext')
}

export function useDesktopDispatch(): React.Dispatch<ClassicyAction> {
    return ensureContext(useContext(ClassicyDesktopDispatchContext), 'ClassicyDesktopDispatchContext')
}
