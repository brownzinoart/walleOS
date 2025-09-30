'use client'

import { ClassicyAppearanceManager } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyAppearanceManager'
import { ClassicyDateAndTimeManager } from '@/app/SystemFolder/ControlPanels/DateAndTimeManager/ClassicyDateAndTimeManager.app'
import { ClassicySoundManager } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManager'
import React from 'react'

export default function ClassicyControlPanels() {
    return (
        <>
            <ClassicyAppearanceManager />
            <ClassicySoundManager />
            <ClassicyDateAndTimeManager />
        </>
    )
}
