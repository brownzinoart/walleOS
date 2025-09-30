import { useDesktop, useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import { ClassicyFileSystem } from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystem'
import ClassicyIcon from '@/app/SystemFolder/SystemResources/Icon/ClassicyIcon'
import React, { RefObject, useEffect, useState } from 'react'
import { cleanupIcon, iconImageByType } from '@/app/SystemFolder/SystemResources/File/ClassicyFileBrowserUtils'

type ClassicyFileBrowserViewIconsProps = {
    fs: ClassicyFileSystem
    path: string
    appId: string
    dirOnClickFunc?: (path: string) => void
    fileOnClickFunc?: (path: string) => void
    holderRef: RefObject<HTMLDivElement>
}

const ClassicyFileBrowserViewIcons: React.FC<ClassicyFileBrowserViewIconsProps> = ({
    fs,
    path,
    appId,
    dirOnClickFunc = () => {},
    fileOnClickFunc = () => {},
    holderRef,
}) => {
    const desktopContext = useDesktop(),
        desktopEventDispatch = useDesktopDispatch()

    const [items, setItems] = useState([])

    const openFileOrFolder = (properties, path: string, filename: string) => {
        switch (properties['_type']) {
            case 'directory': {
                return dirOnClickFunc(path + ':' + filename)
            }
            case 'file': {
                return fileOnClickFunc(path + ':' + filename)
            }
            default: {
                return () => {}
            }
        }
    }

    useEffect(() => {
        const containerMeasure: [number, number] = [
            holderRef.current.getBoundingClientRect().width,
            holderRef.current.getBoundingClientRect().height,
        ]
        const directoryListing = fs.filterByType(path, ['file', 'directory'])

        let icons = []
        Object.entries(directoryListing).forEach(([filename, properties], index) => {
            icons.push({
                appId: appId,
                name: filename,
                invisible: properties['_invisible'],
                icon: properties['_icon'] || iconImageByType(properties['_type']),
                onClickFunc: () => openFileOrFolder(properties, path, filename),
                holder: holderRef,
                initialPosition: cleanupIcon(
                    desktopContext.System.Manager.Appearance.activeTheme,
                    index,
                    Object.entries(directoryListing).length,
                    containerMeasure
                ),
            })
        })
        setItems((_) => [...icons])
    }, [path, fs, desktopContext.System.Manager.Appearance.activeTheme, holderRef])

    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%' }} ref={holderRef}>
            {items.map((item) => {
                return <ClassicyIcon {...item} key={item.name} />
            })}
        </div>
    )
}

export default ClassicyFileBrowserViewIcons
