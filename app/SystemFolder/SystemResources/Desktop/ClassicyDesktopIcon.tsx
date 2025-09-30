'use client'

import { useDesktop, useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import { UnknownRecord } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'
import classicyDesktopIconStyles from '@/app/SystemFolder/SystemResources/Desktop/ClassicyDesktopIcon.module.scss'
import classNames from 'classnames'
import React, { useRef, useState } from 'react'

interface ClassicyDesktopIconProps {
    appId: string
    appName: string
    icon: string
    label?: string
    kind: string
    onClickFunc?: () => void
    event?: string
    eventData?: UnknownRecord
}

const ClassicyDesktopIcon: React.FC<ClassicyDesktopIconProps> = ({
    appId,
    appName,
    icon,
    label,
    kind = 'app_shortcut',
    onClickFunc,
    event,
    eventData,
}) => {
    const [clickPosition, setClickPosition] = useState<[number, number]>([0, 0])
    const [dragging, setDragging] = useState<boolean>(false)

    const desktopContext = useDesktop()
    const desktopEventDispatch = useDesktopDispatch()

    const iconRef = useRef<HTMLDivElement | null>(null)

    const id = appId + '.shortcut'

    const clickFocus = () => {
        desktopEventDispatch({
            type: 'ClassicyDesktopIconFocus',
            iconId: id,
        })
    }

    const changeIcon = (event: React.MouseEvent<HTMLDivElement>) => {
        if (dragging) {
            clickFocus()

            desktopEventDispatch({
                type: 'ClassicyDesktopIconMove',
                app: {
                    id: appId,
                },
                location: [event.clientX - clickPosition[0], event.clientY - clickPosition[1]],
            })
        }
    }

    const isActive = (iconId: string) => {
        const idx = desktopContext.System.Manager.Desktop.selectedIcons.findIndex((o) => o === iconId)
        return idx > -1
    }

    const launchIcon = () => {
        onClickFunc?.()
        if (event && eventData) {
            desktopEventDispatch({
                type: event,
                ...(eventData ?? {}),
            })
        }
        desktopEventDispatch({
            type: 'ClassicyDesktopIconOpen',
            iconId: id,
            app: {
                id: appId,
                name: appName,
                icon: icon,
            },
        })
    }

    const getIconLocation = () => {
        const iconEntry = desktopContext.System.Manager.Desktop.icons.find((i) => i.appId === appId)
        const leftValue = iconEntry?.location?.[0] ?? 0
        const topValue = iconEntry?.location?.[1] ?? 0
        return [topValue, leftValue] as [number, number]
    }

    const thisLocation = getIconLocation()

    const isLaunched = () => {
        // Check if a Finder window is open
        if (appId.startsWith('Finder.app')) {
            const path = (eventData as { path?: string })?.path
            if (!path) {
                return false
            }
            const finderWindowIndex = desktopContext.System.Manager.App.apps['Finder.app'].windows.findIndex(
                (w) => w.id === path && w.closed === false
            )
            return finderWindowIndex >= 0
        }
        return desktopContext.System.Manager.App.apps[appId]?.open
    }

    const stopChangeIcon = () => {
        setDragging(false)
        setClickPosition([0, 0])
    }

    const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        const element = iconRef.current
        if (!element) {
            return
        }
        const rect = element.getBoundingClientRect()
        setClickPosition([event.clientX - rect.left, event.clientY - rect.top])
        setDragging(true)
    }

    const getClass = (iconId: string) => {
        if (isActive(iconId) && isLaunched()) {
            return classicyDesktopIconStyles.classicyDesktopIconActiveAndOpen
        } else if (isActive(iconId)) {
            return classicyDesktopIconStyles.classicyDesktopIconActive
        } else if (isLaunched()) {
            return classicyDesktopIconStyles.classicyDesktopIconOpen
        } else {
            return ''
        }
    }

    return (
        <div
            ref={iconRef}
            id={`${id}`}
            onMouseDown={startDrag}
            onMouseMove={changeIcon}
            onMouseUp={stopChangeIcon}
            onDoubleClick={launchIcon}
            draggable={false}
            onClick={clickFocus}
            onContextMenu={() => {
                clickFocus()
                alert('clicked')
            }} // TODO: Add Context Menu on Desktop Icons
            className={classNames(
                classicyDesktopIconStyles.classicyDesktopIcon,
                dragging ? classicyDesktopIconStyles.classicyDesktopIconDragging : '',
                getClass(id)
            )}
            style={{ top: thisLocation[0], left: thisLocation[1] }}
        >
            <div
                className={classicyDesktopIconStyles.classicyDesktopIconMaskOuter}
                style={{ maskImage: `url(${icon})` }}
            >
                <div className={classicyDesktopIconStyles.classicyDesktopIconMask} style={{ mask: `url(${icon})` }}>
                    <img src={icon} alt={appName} />
                </div>
            </div>
            <p>{label ? label : appName}</p>
        </div>
    )
}

export default ClassicyDesktopIcon
