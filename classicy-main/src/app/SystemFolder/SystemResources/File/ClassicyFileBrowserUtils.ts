import { ClassicyTheme } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyAppearance'
import { getIconSize } from '@/app/SystemFolder/SystemResources/Desktop/ClassicyDesktopIconContext'

export const capitalizeFirst = (s: string) => {
    return s && String(s[0]).toUpperCase() + String(s).slice(1)
}

export const iconImageByType = (byType: string) => {
    const baseDir = process.env.NEXT_PUBLIC_BASE_PATH || ''
    switch (byType) {
        case 'directory': {
            return `${baseDir}/img/icons/system/folders/directory.png`
        }
        default: {
            return `${baseDir}/img/icons/system/files/file.png`
        }
    }
}

export const createGrid = (
    iconSize: number,
    iconPadding: number,
    containerMeasure: [number, number]
): [number, number] => {
    return [
        Math.floor(containerMeasure[0] / (iconSize * 2 + iconPadding)),
        Math.floor(containerMeasure[1] / (iconSize * 2 + iconPadding)),
    ]
}

export const getGridPosition = (i: number, grid: [number, number]): [number, number] => {
    return [i % grid[0], Math.floor(i / grid[0])]
}

export const cleanupIcon = (
    theme: ClassicyTheme,
    iconIndex: number,
    iconTotal: number,
    containerMeasure: [number, number]
): [number, number] => {
    const [iconSize, iconPadding] = getIconSize(theme)
    let grid = createGrid(iconSize, iconTotal, containerMeasure)
    const [startX, startY] = getGridPosition(iconIndex, grid)

    return [iconPadding + Math.floor(iconSize * 2 * startX), iconPadding + Math.floor(iconSize * 2 * startY)]
}
