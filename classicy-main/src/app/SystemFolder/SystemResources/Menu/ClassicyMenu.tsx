import classicyMenuStyles from '@/app/SystemFolder/SystemResources/Menu/ClassicyMenu.module.scss'
import { useSoundDispatch } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManagerContext'
import classNames from 'classnames'
import React from 'react'
import { useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'

export interface ClassicyMenuItem {
    id: string
    title?: string
    image?: string
    disabled?: boolean
    icon?: string
    keyboardShortcut?: string
    link?: string
    event?: string
    eventData?: any
    onClickFunc?: any
    menuChildren?: ClassicyMenuItem[]
    className?: string
}

interface ClassicyMenuProps {
    name: string
    menuItems: ClassicyMenuItem[]
    navClass?: string
    subNavClass?: string
    children?: any
}

const ClassicyMenu: React.FC<ClassicyMenuProps> = ({ name, menuItems, navClass, subNavClass, children }) => {
    if (menuItems && menuItems.length > 0) {
        return (
            <div className={classicyMenuStyles.classicyMenuWrapper}>
                <ul className={classNames(navClass)} key={name + '_menu'}>
                    {menuItems.map((item: ClassicyMenuItem) => (
                        <ClassicyMenuItem key={item?.id} menuItem={item} subNavClass={subNavClass} />
                    ))}
                    {children}
                </ul>
            </div>
        )
    }
}

const ClassicyMenuItem: React.FC<{ menuItem: ClassicyMenuItem; subNavClass: string }> = ({ menuItem, subNavClass }) => {
    const player = useSoundDispatch()
    const desktopDispatch = useDesktopDispatch()
    if (menuItem) {
        let newMenuItem = <></>
        if (menuItem.id === 'spacer') {
            return <hr />
        } else {
            newMenuItem = (
                <>
                    <p>
                        {menuItem.image !== undefined &&
                            (newMenuItem = <img src={menuItem.image} alt={menuItem.title} />)}
                        {!!menuItem.icon && <img src={menuItem.icon} alt={menuItem.title} />}
                        {menuItem.title}
                    </p>
                    <p
                        className={classicyMenuStyles.classicyMenuItemKeyboardShortcut}
                        dangerouslySetInnerHTML={{ __html: menuItem.keyboardShortcut }}
                    ></p>
                </>
            )
        }

        const menuItemEventHandler = (menuItem: ClassicyMenuItem) => {
            desktopDispatch({
                type: menuItem.event,
                ...menuItem.eventData,
            })
        }

        return (
            <li
                id={menuItem.id}
                key={menuItem.id}
                onClick={() => {
                    if (menuItem.onClickFunc) {
                        menuItem.onClickFunc()
                    } else if (menuItem.event && menuItem.eventData) {
                        menuItemEventHandler(menuItem)
                    }
                }}
                onMouseOver={() => {
                    player({ type: 'ClassicySoundPlay', sound: 'ClassicyMenuItemHover' })
                }}
                onMouseOut={() => {
                    player({ type: 'ClassicySoundPlay', sound: 'ClassicyMenuItemClick' })
                }}
                className={classNames(
                    classicyMenuStyles.classicyMenuItem,
                    !!menuItem.icon ? '' : classicyMenuStyles.classicyMenuItemNoImage,
                    menuItem.className,
                    menuItem.disabled ? classicyMenuStyles.classicyMenuItemDisabled : '',
                    menuItem.menuChildren && menuItem.menuChildren.length > 0
                        ? classicyMenuStyles.classicyMenuItemChildMenuIndicator
                        : ''
                )}
            >
                {newMenuItem}
                {menuItem.menuChildren && menuItem.menuChildren.length > 0 && (
                    <ClassicyMenu
                        name={menuItem.id + '_subitem'}
                        menuItems={menuItem.menuChildren}
                        subNavClass={subNavClass}
                        navClass={subNavClass}
                    ></ClassicyMenu>
                )}
            </li>
        )
    }
}

export default ClassicyMenu
