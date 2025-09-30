'use client'

import classicyMenuStyles from '@/app/SystemFolder/SystemResources/Menu/ClassicyMenu.module.scss'
import { useSoundDispatch } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManagerContext'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import { useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import { UnknownRecord } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'

export interface ClassicyMenuItem {
    id: string
    title?: string
    image?: string
    disabled?: boolean
    icon?: string
    keyboardShortcut?: string
    link?: string
    event?: string
    eventData?: UnknownRecord
    onClickFunc?: () => void
    menuChildren?: ClassicyMenuItem[]
    className?: string
}

interface ClassicyMenuProps {
    name: string
    menuItems: ClassicyMenuItem[]
    navClass?: string
    subNavClass?: string
    children?: ReactNode
}

const ClassicyMenu: React.FC<ClassicyMenuProps> = ({ name, menuItems, navClass, subNavClass, children }) => {
    if (!menuItems?.length) {
        return null
    }

    return (
        <div className={classicyMenuStyles.classicyMenuWrapper}>
            <ul className={classNames(navClass)} key={`${name}_menu`}>
                {menuItems.map((item) => (
                    <ClassicyMenuItemComponent key={item.id} menuItem={item} subNavClass={subNavClass} />
                ))}
                {children}
            </ul>
        </div>
    )
}

const ClassicyMenuItemComponent: React.FC<{ menuItem: ClassicyMenuItem; subNavClass?: string }> = ({
    menuItem,
    subNavClass,
}) => {
    const player = useSoundDispatch()
    const desktopDispatch = useDesktopDispatch()

    if (menuItem.id === 'spacer') {
        return (
            <li aria-hidden="true">
                <hr />
            </li>
        )
    }

    const handleEvent = () => {
        if (!menuItem.event) {
            return
        }

        desktopDispatch({
            type: menuItem.event,
            ...(menuItem.eventData ?? {}),
        })
    }

    const handleClick = () => {
        if (menuItem.disabled) {
            return
        }

        if (menuItem.onClickFunc) {
            menuItem.onClickFunc()
            return
        }

        handleEvent()
    }

    return (
        <li
            id={menuItem.id}
            onClick={handleClick}
            onMouseOver={() => {
                if (!menuItem.disabled) {
                    player({ type: 'ClassicySoundPlay', sound: 'ClassicyMenuItemHover' })
                }
            }}
            onMouseOut={() => {
                if (!menuItem.disabled) {
                    player({ type: 'ClassicySoundPlay', sound: 'ClassicyMenuItemClick' })
                }
            }}
            className={classNames(
                classicyMenuStyles.classicyMenuItem,
                menuItem.icon ? '' : classicyMenuStyles.classicyMenuItemNoImage,
                menuItem.className,
                menuItem.disabled ? classicyMenuStyles.classicyMenuItemDisabled : '',
                menuItem.menuChildren?.length
                    ? classicyMenuStyles.classicyMenuItemChildMenuIndicator
                    : ''
            )}
        >
            <div>
                <p>
                    {menuItem.image && <img src={menuItem.image} alt={menuItem.title} />}
                    {menuItem.icon && <img src={menuItem.icon} alt={menuItem.title} />}
                    {menuItem.title}
                </p>
                {menuItem.keyboardShortcut && (
                    <p
                        className={classicyMenuStyles.classicyMenuItemKeyboardShortcut}
                        dangerouslySetInnerHTML={{ __html: menuItem.keyboardShortcut }}
                    ></p>
                )}
            </div>
            {menuItem.menuChildren && menuItem.menuChildren.length > 0 && (
                <ClassicyMenu
                    name={`${menuItem.id}_subitem`}
                    menuItems={menuItem.menuChildren}
                    subNavClass={subNavClass}
                    navClass={subNavClass}
                />
            )}
        </li>
    )
}

export default ClassicyMenu
