import classicyCheckboxStyles from '@/app/SystemFolder/SystemResources/Checkbox/ClassicyCheckbox.module.scss'
import ClassicyControlLabel from '@/app/SystemFolder/SystemResources/ControlLabel/ClassicyControlLabel'
import classNames from 'classnames'
import React, { useState } from 'react'

type ClassicyCheckboxProps = {
    id: string
    checked?: boolean
    mixed?: boolean
    isDefault?: boolean
    disabled?: boolean
    onClickFunc?: (checked: boolean) => void
    label?: string
}
const ClassicyCheckbox: React.FC<ClassicyCheckboxProps> = ({
    id,
    checked,
    mixed,
    isDefault,
    disabled,
    onClickFunc,
    label,
}) => {
    const [check, setCheck] = useState<boolean>(checked)

    const handleOnClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if (onClickFunc) {
            onClickFunc(!check)
        }
        if (!disabled) {
            setCheck(!check)
        }
    }

    return (
        <div className={classicyCheckboxStyles.ClassicyCheckboxGroup}>
            <input
                type={'checkbox'}
                onClick={handleOnClick}
                tabIndex={0}
                id={id}
                checked={check}
                disabled={disabled}
                className={classNames(
                    classicyCheckboxStyles.ClassicyCheckbox,
                    isDefault ? classicyCheckboxStyles.ClassicyCheckboxDefault : '',
                    mixed ? classicyCheckboxStyles.ClassicyCheckboxMixed : ''
                )}
            />
            <ClassicyControlLabel label={label} labelFor={id} disabled={disabled} onClickFunc={handleOnClick} />
        </div>
    )
}
export default ClassicyCheckbox
