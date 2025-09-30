'use client'

import { useDesktop } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import {
    ClassicyFileSystemEntry,
    ClassicyFileSystemEntryFileType,
} from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystemModel'
import { ClassicyFileSystem } from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystem'
import ClassicyIcon from '@/app/SystemFolder/SystemResources/Icon/ClassicyIcon'
import React, { RefObject, useCallback, useEffect, useState } from 'react'
import { cleanupIcon, iconImageByType } from '@/app/SystemFolder/SystemResources/File/ClassicyFileBrowserUtils'

interface ClassicyFileBrowserViewIconsProps {
    fs: ClassicyFileSystem
    path: string
    appId: string
    dirOnClickFunc?: (path: string) => void
    fileOnClickFunc?: (path: string) => void
    holderRef: RefObject<HTMLDivElement>
}

interface BrowserIconItem {
    appId: string
    name: string
    icon: string
    label?: string
    invisible?: boolean
    holder: RefObject<HTMLDivElement>
    initialPosition: [number, number]
    onClickFunc: () => void
}

const ClassicyFileBrowserViewIcons: React.FC<ClassicyFileBrowserViewIconsProps> = ({
    fs,
    path,
    appId,
    dirOnClickFunc = () => undefined,
    fileOnClickFunc = () => undefined,
    holderRef,
}) => {
    const desktopContext = useDesktop()
    const [items, setItems] = useState<BrowserIconItem[]>([])

    const openFileOrFolder = useCallback(
        (properties: ClassicyFileSystemEntry, basePath: string, filename: string) => {
            switch (properties._type) {
                case ClassicyFileSystemEntryFileType.Directory:
                case 'directory':
                    return dirOnClickFunc(`${basePath}:${filename}`)
                case ClassicyFileSystemEntryFileType.File:
                case 'file':
                    return fileOnClickFunc(`${basePath}:${filename}`)
                default:
                    return undefined
            }
        },
        [dirOnClickFunc, fileOnClickFunc]
    )

    useEffect(() => {
        const container = holderRef.current
        if (!container) {
            return
        }

        const containerMeasure: [number, number] = [
            container.getBoundingClientRect().width,
            container.getBoundingClientRect().height,
        ]

        const directoryListing = fs.filterByType(path, ['file', 'directory'])
        const entryCount = Object.entries(directoryListing).length

        const icons = Object.entries(directoryListing).map(([filename, properties], index) => {
            const entry = properties as ClassicyFileSystemEntry
            const typeKey = entry._type ? String(entry._type) : ClassicyFileSystemEntryFileType.File
            const iconPath = (entry._icon as string | undefined) ?? iconImageByType(typeKey)
            const initialPosition = cleanupIcon(
                desktopContext.System.Manager.Appearance.activeTheme,
                index,
                entryCount,
                containerMeasure
            )

            return {
                appId,
                name: filename,
                icon: iconPath,
                invisible: entry._invisible === true,
                holder: holderRef,
                initialPosition,
                onClickFunc: () => openFileOrFolder(entry, path, filename),
                label: entry._label as string | undefined,
            }
        })

        setItems(icons)
    }, [
        appId,
        desktopContext.System.Manager.Appearance.activeTheme,
        fs,
        holderRef,
        openFileOrFolder,
        path,
    ])

    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%' }} ref={holderRef}>
            {items.map((item) => (
                <ClassicyIcon {...item} key={item.name} />
            ))}
        </div>
    )
}

export default ClassicyFileBrowserViewIcons
