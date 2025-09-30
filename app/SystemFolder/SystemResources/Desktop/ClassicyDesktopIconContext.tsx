import { ClassicyTheme } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyAppearance'
import {
    ClassicyAction,
    classicyDesktopStateEventReducer,
    ClassicyStore,
} from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'
import { ClassicyStoreSystemDesktopManagerIcon } from '@/app/SystemFolder/SystemResources/Desktop/ClassicyDesktopManager'
import { ClassicyMenuItem } from '@/app/SystemFolder/SystemResources/Menu/ClassicyMenu'

const createGrid = (iconSize: number, iconPadding: number) => {
    return [
        Math.floor(window.innerWidth / (iconSize + iconPadding)),
        Math.floor(window.innerHeight / (iconSize * 2 + iconPadding)),
    ] as const
}

const getGridPosition = (iconSize: number, iconPadding: number, x: number, y: number) => {
    const defaultPadding = iconPadding * 4
    return [
        Math.floor(window.innerWidth - (iconSize * 2 + iconPadding) * x),
        Math.floor((iconSize * 2 + iconPadding) * y) + defaultPadding,
    ] as const
}

const getGridPositionByCount = (count: number, theme: ClassicyTheme) => {
    const [iconSize, iconPadding] = getIconSize(theme)
    const grid = createGrid(iconSize, iconPadding)

    if (count < grid[0]) {
        return getGridPosition(iconSize, iconPadding, 1, count)
    }

    if (count > grid[0] * grid[1]) {
        return getGridPosition(iconSize, iconPadding, 1, 1)
    }

    return getGridPosition(iconSize, iconPadding, 1, count)
}

export const getIconSize = (theme: ClassicyTheme) => {
    return [theme.desktop.iconSize, theme.desktop.iconSize / 4] as const
}

const sortDesktopIcons = (icons: ClassicyStoreSystemDesktopManagerIcon[], sortType: 'name' | 'kind' | 'label') => {
    switch (sortType) {
        case 'name':
            return [...icons].sort((a, b) => a.appName.localeCompare(b.appName))
        case 'kind':
            return [...icons].sort((a, b) => (a.kind ?? '').localeCompare(b.kind ?? ''))
        default:
            return icons
    }
}

const cleanupDesktopIcons = (theme: ClassicyTheme, icons: ClassicyStoreSystemDesktopManagerIcon[]) => {
    const newDesktopIcons: ClassicyStoreSystemDesktopManagerIcon[] = []
    let startX = 1
    let startY = 0
    const [iconSize, iconPadding] = getIconSize(theme)

    const grid = createGrid(iconSize, iconPadding)

    icons.forEach((icon) => {
        if (startY >= grid[1]) {
            startY = 0
            startX += 1
        }

        if (startX >= grid[0]) {
            startX = 1
        }

        newDesktopIcons.push({
            appId: icon.appId,
            appName: icon.appName,
            icon: icon.icon,
            kind: icon.kind,
            location: getGridPosition(iconSize, iconPadding, startX, startY),
            onClickFunc: icon.onClickFunc,
            label: icon.label,
            event: icon.event,
            eventData: icon.eventData,
            contextMenu: icon.contextMenu,
        })

        startY += 1
    })

    return newDesktopIcons
}

const isDesktopAppAction = (
    action: ClassicyAction
): action is ClassicyAction & { app: { id: string; name?: string; icon?: string } } => {
    return typeof action.app === 'object' && action.app !== null && 'id' in action.app
}

export const classicyDesktopIconEventHandler = (ds: ClassicyStore, action: ClassicyAction): ClassicyStore => {
    switch (action.type) {
        case 'ClassicyDesktopIconCleanup': {
            ds.System.Manager.Desktop.icons = cleanupDesktopIcons(
                ds.System.Manager.Appearance.activeTheme,
                ds.System.Manager.Desktop.icons
            )
            break
        }
        case 'ClassicyDesktopIconSort': {
            const sortType = action.sortBy === 'kind' || action.sortBy === 'label' ? action.sortBy : 'name'
            ds.System.Manager.Desktop.icons = cleanupDesktopIcons(
                ds.System.Manager.Appearance.activeTheme,
                sortDesktopIcons(ds.System.Manager.Desktop.icons, sortType)
            )
            break
        }
        case 'ClassicyDesktopIconFocus': {
            if (typeof action.iconId === 'string') {
                ds.System.Manager.Desktop.selectedIcons = [action.iconId]
            }
            break
        }
        case 'ClassicyDesktopIconOpen': {
            if (typeof action.iconId === 'string') {
                ds.System.Manager.Desktop.selectedIcons = [action.iconId]
            }
            if (isDesktopAppAction(action)) {
                ds = classicyDesktopStateEventReducer(ds, {
                    type: 'ClassicyAppOpen',
                    app: action.app,
                })
            }
            break
        }
        case 'ClassicyDesktopIconAdd': {
            if (!isDesktopAppAction(action)) {
                break
            }

            const existingIcon = ds.System.Manager.Desktop.icons.find((item) => item.appId === action.app.id)

            if (!existingIcon) {
                const location = (action.location as [number, number] | undefined) ??
                    getGridPositionByCount(
                        ds.System.Manager.Desktop.icons.length,
                        ds.System.Manager.Appearance.activeTheme
                    )

                ds.System.Manager.Desktop.icons.push({
                    icon: action.app.icon ?? '',
                    appId: action.app.id,
                    appName: action.app.name ?? action.app.id,
                    location,
                    label: action.label as string | undefined,
                    kind: (action.kind as string | undefined) ?? 'icon',
                    onClickFunc: action.onClickFunc as ClassicyStoreSystemDesktopManagerIcon['onClickFunc'],
                    event: action.event as string | undefined,
                    eventData: action.eventData as ClassicyStoreSystemDesktopManagerIcon['eventData'],
                    contextMenu: asContextMenu(action.contextMenu),
                })
            }
            break
        }
        case 'ClassicyDesktopIconRemove': {
            if (isDesktopAppAction(action)) {
                const iconIdx = ds.System.Manager.Desktop.icons.findIndex((icon) => icon.appId === action.app.id)
                if (iconIdx > -1) {
                    ds.System.Manager.Desktop.icons.splice(iconIdx, 1)
                }
            }
            break
        }
        case 'ClassicyDesktopIconMove': {
            if (isDesktopAppAction(action)) {
                const iconIdx = ds.System.Manager.Desktop.icons.findIndex((icon) => icon.appId === action.app.id)
                if (iconIdx > -1 && Array.isArray(action.location)) {
                    ds.System.Manager.Desktop.icons[iconIdx].location = action.location as [number, number]
                }
            }
            break
        }
    }
    return ds
}

const asContextMenu = (value: unknown): ClassicyMenuItem[] | undefined => {
    return Array.isArray(value) ? (value as ClassicyMenuItem[]) : undefined
}
