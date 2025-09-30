'use client'

import { getAllThemes, getThemeVars } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyAppearance'
import { useDesktop, useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import ClassicyControlPanels from '@/app/SystemFolder/ControlPanels/ClassicyControlPanels'
import Finder from '@/app/SystemFolder/Finder/Finder'
import { getClassicyAboutWindow } from '@/app/SystemFolder/SystemResources/AboutWindow/ClassicyAboutWindow'
import ClassicyContextualMenu from '@/app/SystemFolder/SystemResources/ContextualMenu/ClassicyContextualMenu'
import classicyDesktop from '@/app/SystemFolder/SystemResources/Desktop/ClassicyDesktop.module.scss'
import ClassicyDesktopIcon from '@/app/SystemFolder/SystemResources/Desktop/ClassicyDesktopIcon'
import ClassicyDesktopMenuBar from '@/app/SystemFolder/SystemResources/Desktop/MenuBar/ClassicyDesktopMenuBar'
import { ClassicyMenuItem } from '@/app/SystemFolder/SystemResources/Menu/ClassicyMenu'
import classNames from 'classnames'
import React, { CSSProperties, ReactNode, useState } from 'react'
import '@/app/SystemFolder/ControlPanels/AppearanceManager/styles/fonts.scss'

interface ClassicyDesktopProps {
    children?: ReactNode
}

const ClassicyDesktop: React.FC<ClassicyDesktopProps> = ({ children }) => {
    const [contextMenu, setContextMenu] = useState(false)
    const [contextMenuLocation, setContextMenuLocation] = useState([0, 0])
    const [showAbout, setShowAbout] = useState(false)

    const [selectBoxStart, setSelectBoxStart] = useState([0, 0])
    const [selectBoxSize, setSelectBoxSize] = useState([0, 0])
    const [selectBox, setSelectBox] = useState(false)

    const clickOffset = [10, 10]

    const desktopState = useDesktop()
    const desktopEventDispatch = useDesktopDispatch()

    if (desktopState.System.Manager.Appearance.availableThemes.length <= 0) {
        desktopEventDispatch({
            type: 'ClassicyDesktopLoadThemes',
            availableThemes: getAllThemes(),
        })
    }

    const startSelectBox = (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        if (target.id === 'classicyDesktop') {
            if (event.button > 1) {
                toggleDesktopContextMenu(event)
            } else {
                clearActives(event)
                setSelectBox(true)
                setSelectBoxStart([event.clientX, event.clientY])
                setSelectBoxSize([0, 0])
            }
        }
    }

    const resizeSelectBox = (event: React.MouseEvent<HTMLDivElement>) => {
        setSelectBoxSize([event.clientX - selectBoxStart[0], event.clientY - selectBoxStart[1]])
    }

    const clearSelectBox = () => {
        setSelectBoxSize([0, 0])
        setSelectBoxStart([0, 0])
        setSelectBox(false)
    }

    const clearActives = (event: React.MouseEvent<HTMLDivElement>) => {
        setContextMenu(false)
        desktopEventDispatch({
            type: 'ClassicyDesktopFocus',
            e: event,
            menuBar: defaultMenuItems,
        })
    }

    const toggleDesktopContextMenu = (e) => {
        e.preventDefault()
        const target = event.target as HTMLElement
        if (target.id === 'classicyDesktop') {
            setContextMenuLocation([e.clientX - clickOffset[0], e.clientY - clickOffset[1]])
            setContextMenu(!contextMenu)
        }
    }

    const defaultMenuItems: ClassicyMenuItem[] = [
        {
            id: 'finder_file',
            title: 'File',
        },
        {
            id: 'finder_edit',
            title: 'Edit',
        },
        {
            id: 'finder_view',
            title: 'View',
            menuChildren: [
                {
                    id: 'finder.app_CleanupDesktopIcons',
                    title: 'Clean up',
                    onClickFunc: () => {
                        desktopEventDispatch({
                            type: 'ClassicyDesktopIconCleanup',
                        })
                    },
                },
                {
                    id: 'finder.app_ArrangeDesktopIconsName',
                    title: 'Arrange By Name',
                    onClickFunc: () => {
                        desktopEventDispatch({
                            type: 'ClassicyDesktopIconSort',
                            sortBy: 'name',
                        })
                    },
                },
                {
                    id: 'finder.app_ArrangeDesktopIconsKind',
                    title: 'Arrange By Type',
                    onClickFunc: () => {
                        desktopEventDispatch({
                            type: 'ClassicyDesktopIconSort',
                            sortBy: 'kind',
                        })
                    },
                },
            ],
        },
        {
            id: 'finder_special',
            title: 'Special',
        },

        {
            id: 'finder_help',
            title: 'Help',
            menuChildren: [
                {
                    id: 'finder_help_about',
                    title: 'About',
                    onClickFunc: () => {
                        setShowAbout(true)
                    },
                },
            ],
        },
    ]

    const currentTheme = getThemeVars(desktopState.System.Manager.Appearance.activeTheme)

    return (
        <>
            <div
                id={'classicyDesktop'}
                style={currentTheme as CSSProperties}
                className={classNames(classicyDesktop.classicyDesktop)}
                onMouseMove={resizeSelectBox}
                onContextMenu={toggleDesktopContextMenu}
                onClick={clearSelectBox}
                onMouseDown={startSelectBox}
            >
                {selectBox && (
                    <div
                        className={classicyDesktop.classicyDesktopSelect}
                        style={{
                            left: selectBoxStart[0],
                            top: selectBoxStart[1],
                            width: selectBoxSize[0],
                            height: selectBoxSize[1],
                        }}
                    />
                )}
                <ClassicyDesktopMenuBar />
                {contextMenu && (
                    <ClassicyContextualMenu
                        name={'desktopContextMenu'}
                        menuItems={defaultMenuItems}
                        position={contextMenuLocation}
                    />
                )}
                <Finder />
                <ClassicyControlPanels />
                {showAbout &&
                    getClassicyAboutWindow({
                        appId: 'Finder.app',
                        appName: 'Finder',
                        appIcon: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/icons/system/macos.svg`,
                        hideFunc: () => setShowAbout(false),
                    })}
                {desktopState.System.Manager.Desktop.icons.map((i) => (
                    <ClassicyDesktopIcon
                        appId={i.appId}
                        appName={i.appName}
                        icon={i.icon}
                        label={i.label}
                        kind={i.kind}
                        key={i.appId}
                        event={i.event}
                        eventData={i.eventData}
                    />
                ))}
                {children}
            </div>
        </>
    )
}

export default ClassicyDesktop
