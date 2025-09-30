import React from 'react'
import {
    ClassicyAction,
    ClassicyAppManagerHandler,
    ClassicyStore,
    ClassicyStoreSystemManager,
    UnknownRecord,
} from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'
import { ClassicyTheme } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyAppearance'
import { ClassicyMenuItem } from '@/app/SystemFolder/SystemResources/Menu/ClassicyMenu'

export interface ClassicyStoreSystemDesktopManagerIcon {
    appId: string
    appName: string
    icon: string
    label?: string
    kind: string
    location?: [number, number]
    onClickFunc: (event: React.MouseEvent) => void
    event?: string
    eventData?: UnknownRecord
    contextMenu?: ClassicyMenuItem[]
}

export interface ClassicyStoreSystemDesktopManager extends ClassicyStoreSystemManager {
    selectedIcons?: string[]
    systemMenu: ClassicyMenuItem[]
    appMenu: ClassicyMenuItem[]
    contextMenu: ClassicyMenuItem[]
    showContextMenu: boolean
    icons: ClassicyStoreSystemDesktopManagerIcon[]
    selectBox: {
        size: [number, number]
        start: [number, number]
        active: boolean
    }
}

type BasicAppReference = {
    id: string
    name?: string
    icon?: string
}

const isAppReference = (value: unknown): value is BasicAppReference => {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof (value as { id: unknown }).id === 'string'
    )
}

type DesktopFocusEvent = React.MouseEvent & {
    target: EventTarget & { id: string }
}

const getDesktopEvent = (value: unknown): DesktopFocusEvent | null => {
    if (
        typeof value === 'object' &&
        value !== null &&
        'target' in value &&
        'clientX' in value &&
        'clientY' in value
    ) {
        return value as DesktopFocusEvent
    }
    return null
}

const asMenuItems = (value: unknown): ClassicyMenuItem[] | null => {
    return Array.isArray(value) ? (value as ClassicyMenuItem[]) : null
}

const asThemes = (value: unknown): ClassicyTheme[] | null => {
    return Array.isArray(value) ? (value as ClassicyTheme[]) : null
}

export const classicyDesktopEventHandler = (ds: ClassicyStore, action: ClassicyAction): ClassicyStore => {
    switch (action.type) {
        case 'ClassicyDesktopAppMenuAdd': {
            const app = isAppReference(action.app) ? action.app : null
            if (!app) {
                break
            }

            const menuItem: ClassicyMenuItem = {
                id: `system_menu_${app.id}`,
                title: app.name ?? app.id,
                image: app.icon,
                event: 'ClassicyAppOpen',
                eventData: {
                    app: {
                        id: app.id,
                        name: app.name ?? app.id,
                        icon: app.icon,
                    },
                },
            }

            const exists = ds.System.Manager.Desktop.systemMenu.findIndex((item) => item.id === menuItem.id)
            if (exists >= 0) {
                ds.System.Manager.Desktop.systemMenu[exists] = menuItem
            } else {
                ds.System.Manager.Desktop.systemMenu.push(menuItem)
            }

            break
        }
        case 'ClassicyDesktopAppMenuRemove': {
            const app = isAppReference(action.app) ? action.app : null
            if (!app) {
                break
            }

            const exists = ds.System.Manager.Desktop.systemMenu.findIndex(
                (item) => item && item.id === `system_menu_${app.id}`
            )
            if (exists >= 0) {
                ds.System.Manager.Desktop.systemMenu.splice(exists, 1)
            }
            break
        }
        case 'ClassicyDesktopFocus': {
            const event = getDesktopEvent(action.e)
            if (event?.target.id === 'classicyDesktop') {
                const mgr = new ClassicyAppManagerHandler()
                ds = mgr.deFocusApps(ds)

                ds.System.Manager.App.apps['Finder.app'].focused = true
                ds.System.Manager.Desktop.selectedIcons = []
                ds.System.Manager.Desktop.showContextMenu = false
                ds.System.Manager.Desktop.selectBox.active = true
                ds.System.Manager.Desktop.selectBox.start = [event.clientX, event.clientY]
            }

            const menuItems = asMenuItems(action.menuBar)
            if (menuItems) {
                ds.System.Manager.Desktop.appMenu = menuItems
            }

            break
        }
        case 'ClassicyDesktopDoubleClick': {
            break
        }
        case 'ClassicyDesktopDrag': {
            const event = getDesktopEvent(action.e)
            if (event) {
                ds.System.Manager.Desktop.selectBox.start = [
                    event.clientX - ds.System.Manager.Desktop.selectBox.start[0],
                    event.clientY - ds.System.Manager.Desktop.selectBox.start[1],
                ]

                ds.System.Manager.Desktop.selectBox.size = [0, 0]
            }
            break
        }
        case 'ClassicyDesktopStop': {
            ds.System.Manager.Desktop.selectBox.active = false
            ds.System.Manager.Desktop.selectBox.size = [0, 0]
            ds.System.Manager.Desktop.selectBox.start = [0, 0]
            break
        }
        case 'ClassicyDesktopContextMenu': {
            ds.System.Manager.Desktop.showContextMenu = Boolean(action.showContextMenu)
            const contextMenu = asMenuItems(action.contextMenu)
            if (contextMenu) {
                ds.System.Manager.Desktop.contextMenu = contextMenu
            }
            break
        }
        case 'ClassicyDesktopChangeTheme': {
            const activeTheme = typeof action.activeTheme === 'string' ? action.activeTheme : null
            if (activeTheme) {
                const theme = ds.System.Manager.Appearance.availableThemes.find((item) => item.id === activeTheme)
                if (theme) {
                    ds.System.Manager.Appearance.activeTheme = theme
                }
            }
            break
        }
        case 'ClassicyDesktopChangeBackground': {
            if (typeof action.backgroundImage === 'string' && action.backgroundImage.length > 0) {
                ds.System.Manager.Appearance.activeTheme.desktop.backgroundImage = action.backgroundImage
                ds.System.Manager.Appearance.activeTheme.desktop.backgroundSize = 'auto'
            }
            break
        }
        case 'ClassicyDesktopChangeBackgroundPosition': {
            if (typeof action.backgroundPosition === 'string') {
                ds.System.Manager.Appearance.activeTheme.desktop.backgroundPosition = action.backgroundPosition
            }
            break
        }
        case 'ClassicyDesktopChangeBackgroundRepeat': {
            if (typeof action.backgroundRepeat === 'string') {
                ds.System.Manager.Appearance.activeTheme.desktop.backgroundRepeat = action.backgroundRepeat
            }
            break
        }
        case 'ClassicyDesktopChangeBackgroundSize': {
            if (typeof action.backgroundSize === 'string') {
                ds.System.Manager.Appearance.activeTheme.desktop.backgroundSize = action.backgroundSize
            }
            break
        }
        case 'ClassicyDesktopChangeFont': {
            if (typeof action.font === 'string' && typeof action.fontType === 'string') {
                switch (action.fontType) {
                    case 'body':
                        ds.System.Manager.Appearance.activeTheme.typography.body = action.font
                        break
                    case 'ui':
                        ds.System.Manager.Appearance.activeTheme.typography.ui = action.font
                        break
                    case 'header':
                        ds.System.Manager.Appearance.activeTheme.typography.header = action.font
                        break
                }
            }
            break
        }
        case 'ClassicyDesktopLoadThemes': {
            const themes = asThemes(action.availableThemes)
            if (themes) {
                ds.System.Manager.Appearance.availableThemes = themes
            }
            break
        }
    }
    return ds
}
