/* eslint-disable @next/next/no-img-element */
import classicyIconStyles from '@/app/SystemFolder/SystemResources/Icon/ClassicyIcon.module.scss'
import classNames from 'classnames'
import React, { RefObject, useRef, useState } from 'react'

interface ClassicyIconProps {
    appId: string
    name: string
    icon: string
    label?: string
    initialPosition?: [number, number]
    holder?: RefObject<HTMLDivElement>
    onClickFunc?: () => void
    invisible?: boolean
}

const ClassicyIcon: React.FC<ClassicyIconProps> = ({
    appId,
    name,
    icon,
    label,
    initialPosition = [0, 0],
    holder,
    onClickFunc,
    invisible = false,
}) => {
    const [position, setPosition] = useState<[number, number]>(initialPosition)
    const [dragging, setDragging] = useState(false)
    const [active, setActive] = useState(false)

    const iconRef = useRef<HTMLDivElement | null>(null)

    const id = `${appId}.shortcut`

    const toggleFocus = () => {
        setActive((prev) => !prev)
    }

    const clearFocus = () => {
        setActive(false)
    }

    const handleDoubleClick = () => {
        if (onClickFunc) {
            clearFocus()
            onClickFunc()
        }
    }

    const stopChangeIcon = () => {
        setDragging(false)
    }

    const startDrag = () => {
        setDragging(true)
    }

    const changeIcon = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging) {
            return
        }

        const holderElement = holder?.current
        const iconElement = iconRef.current
        if (!holderElement || !iconElement) {
            return
        }

        const holderRect = holderElement.getBoundingClientRect()
        const iconRect = iconElement.getBoundingClientRect()
        setActive(true)
        setPosition([
            event.clientX - holderRect.left - iconRect.width / 2,
            event.clientY - holderRect.top - iconRect.height / 2,
        ])
    }

    return (
        <div
            ref={iconRef}
            id={`${id}-${Math.random().toString(36).substring(2, 7)}`}
            draggable={false}
            className={classNames(
                classicyIconStyles.classicyIcon,
                dragging ? classicyIconStyles.classicyIconDragging : '',
                active ? classicyIconStyles.classicyIconActive : ''
            )}
            style={{ position: 'absolute', left: `${position[0]}px`, top: `${position[1]}px` }}
            onClick={toggleFocus}
            onMouseDown={startDrag}
            onMouseMove={changeIcon}
            onMouseUp={stopChangeIcon}
            onDoubleClick={handleDoubleClick}
        >
            <div
                className={classNames(
                    classicyIconStyles.classicyIconMaskOuter,
                    invisible ? classicyIconStyles.classicyIconInvisible : ''
                )}
                style={{ maskImage: `url(${icon})` }}
            >
                <div className={classicyIconStyles.classicyIconMask} style={{ mask: `url(${icon})` }}>
                    <img src={icon} alt={name} />
                </div>
            </div>
            <p className={classNames(invisible ? classicyIconStyles.classicyIconInvisible : '')}>{label ?? name}</p>
        </div>
    )
}

export default ClassicyIcon
