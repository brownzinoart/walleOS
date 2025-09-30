'use client'

import { intToHex } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyColors'
import { useDesktop, useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import ClassicyWindow from '@/app/SystemFolder/SystemResources/Window/ClassicyWindow'
import React, { useEffect } from 'react'

interface ClassicyAppProps {
    id: string
    name: string
    icon: string
    defaultWindow?: string
    noDesktopIcon?: boolean
    addSystemMenu?: boolean
    debug?: boolean
    openOnBoot?: boolean
    children?: any
}

const ClassicyApp: React.FC<ClassicyAppProps> = ({
    id,
    icon,
    name,
    openOnBoot,
    addSystemMenu,
    noDesktopIcon,
    defaultWindow,
    debug = false,
    children,
}) => {
    const desktopContext = useDesktop()
    const desktopEventDispatch = useDesktopDispatch()

    const themeData = desktopContext.System.Manager.Appearance.activeTheme
    const debuggerJSONTheme = {
        base00: intToHex(themeData.color.white),
        base01: intToHex(themeData.color.black),
        base02: intToHex(themeData.color.system[3]),
        base03: intToHex(themeData.color.system[3]),
        base04: intToHex(themeData.color.system[3]),
        base05: intToHex(themeData.color.system[4]),
        base06: intToHex(themeData.color.system[5]),
        base07: intToHex(themeData.color.system[6]),
        base08: intToHex(themeData.color.error),
        base09: intToHex(themeData.color.theme[2]),
        base0A: intToHex(themeData.color.theme[1]),
        base0B: intToHex(themeData.color.theme[2]),
        base0C: intToHex(themeData.color.theme[3]),
        base0D: intToHex(themeData.color.theme[4]),
        base0E: intToHex(themeData.color.theme[5]),
        base0F: intToHex(themeData.color.theme[6]),
    }

    const DebugJSONTree: React.FC<{ data: unknown }> = ({ data }) => {
        return (
            <pre
                style={{
                    backgroundColor: debuggerJSONTheme.base02,
                    color: debuggerJSONTheme.base05,
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '100%',
                    fontFamily: 'Menlo, Consolas, SFMono-Regular, monospace',
                    fontSize: '12px',
                    lineHeight: 1.4,
                }}
            >
                {JSON.stringify(data, null, 2)}
            </pre>
        )
    }

    const isAppOpen = () => {
        return desktopContext.System.Manager.App.apps[id]?.open
    }

    const isAppActive = () => {
        return desktopContext.System.Manager.App.apps[id]?.focused
    }

    const onFocus = () => {
        desktopEventDispatch({
            type: 'ClassicyAppActivate',
            app: { id: id },
        })
    }

    useEffect(() => {
        if (addSystemMenu) {
            desktopEventDispatch({
                type: 'ClassicyDesktopAppMenuAdd',
                app: {
                    id: id,
                    name: name,
                    icon: icon,
                },
            })
        } else {
            desktopEventDispatch({
                type: 'ClassicyDesktopAppMenuRemove',
                app: {
                    id: id,
                    name: name,
                    icon: icon,
                },
            })
        }
        if (isAppActive() && defaultWindow) {
            desktopEventDispatch({
                type: 'ClassicyWindowFocus',
                app: {
                    id: id,
                },
                window: {
                    id: defaultWindow,
                },
            })
        }

        if (!noDesktopIcon) {
            desktopEventDispatch({
                type: 'ClassicyDesktopIconAdd',
                app: {
                    id: id,
                    name: name,
                    icon: icon,
                },
                kind: 'app_shortcut',
            })
        }
    }, [addSystemMenu, noDesktopIcon])

    if (debug) {
        let debugWindow = (
            <ClassicyWindow
                initialSize={[400, 300]}
                initialPosition={[100, 200]}
                title={'DEBUG ' + name}
                id={id + '_debugger'}
                appId={id}
                appMenu={[{ id: 'Debug', title: 'Debug' }]}
            >
                <h1>Providers</h1>
                <hr />
                <h2>desktopContext</h2>
                <DebugJSONTree data={desktopContext} />
            </ClassicyWindow>
        )

        if (Array.isArray[children]) {
            children = [...children, debugWindow]
        } else {
            children = [children, debugWindow]
        }
    }

    return <div onMouseDown={onFocus}>{isAppOpen() && <>{children}</>}</div>
}

export default ClassicyApp
