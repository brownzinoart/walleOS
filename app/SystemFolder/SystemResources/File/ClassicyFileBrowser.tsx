'use client'

import { ClassicyFileSystem } from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystem'
import React, { useRef } from 'react'
import ClassicyFileBrowserViewIcons from '@/app/SystemFolder/SystemResources/File/ClassicyFileBrowserViewIcons'
import ClassicyFileBrowserViewTable from '@/app/SystemFolder/SystemResources/File/ClassicyFileBrowserViewTable'

type ClassicyFileBrowserProps = {
    fs: ClassicyFileSystem
    path: string
    appId: string
    display?: 'icons' | 'list'
    dirOnClickFunc?: (path: string) => void
    fileOnClickFunc?: (path: string) => void
}

const ClassicyFileBrowser: React.FC<ClassicyFileBrowserProps> = ({
    fs,
    display = 'icons',
    path,
    appId,
    dirOnClickFunc = () => undefined,
    fileOnClickFunc = () => undefined,
}) => {
    const holderRef = useRef<HTMLDivElement | null>(null)

    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%' }} ref={holderRef}>
            {(() => {
                switch (display) {
                    case 'list':
                        return (
                            <ClassicyFileBrowserViewTable
                                fileOnClickFunc={fileOnClickFunc}
                                dirOnClickFunc={dirOnClickFunc}
                                fs={fs}
                                path={path}
                                appId={appId}
                                iconSize={18}
                            />
                        )
                    default:
                        return (
                            <ClassicyFileBrowserViewIcons
                                fileOnClickFunc={fileOnClickFunc}
                                dirOnClickFunc={dirOnClickFunc}
                                fs={fs}
                                path={path}
                                appId={appId}
                                holderRef={holderRef}
                            />
                        )
                }
            })()}
        </div>
    )
}

export default ClassicyFileBrowser
