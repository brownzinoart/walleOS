import { useSoundDispatch } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManagerContext'
import ClassicyControlLabel from '@/app/SystemFolder/SystemResources/ControlLabel/ClassicyControlLabel'
import classicyRadioInputStyles from '@/app/SystemFolder/SystemResources/RadioInput/ClassicyRadioInput.module.scss'
import classNames from 'classnames'
import React, { useState } from 'react'

type ClassicyRadioInputProps = {
    name: string
    label?: string
    align?: 'rows' | 'columns'
    disabled?: boolean
    onClickFunc?: (id: string) => void
    inputs: ClassicyRadioInputValueProps[]
}

type ClassicyRadioInputValueProps = {
    id: string
    checked?: boolean
    mixed?: boolean
    isDefault?: boolean
    disabled?: boolean
    label?: string
}

const ClassicyRadioInput: React.FC<ClassicyRadioInputProps> = ({
    name,
    label,
    align = 'columns',
    disabled = false,
    onClickFunc,
    inputs,
}) => {
    const [check, setCheck] = useState<string>(inputs.findLast((input) => input.checked === true)?.id || '')
    const player = useSoundDispatch()

    const handleOnChange = (id: string) => {
        setCheck(id)
        if (onClickFunc) {
            onClickFunc(id)
        }
    }

    return (
        <>
            {label && <ClassicyControlLabel labelFor={name} disabled={disabled} label={label} direction={'left'} />}
            <div
                className={classNames(
                    classicyRadioInputStyles.classicyRadioInputGroup,
                    align === 'columns' ? classicyRadioInputStyles.classicyRadioInputGroupColumns : ''
                )}
            >
                {inputs &&
                    inputs.map((item) => (
                        <div key={name + item.id} className={classicyRadioInputStyles.classicyRadioInputMargin}>
                            <div
                                className={classNames(
                                    classicyRadioInputStyles.classicyRadioInputWrapper,
                                    check === item.id ? classicyRadioInputStyles.classicyRadioInputWrapperChecked : '',
                                    item.disabled ? classicyRadioInputStyles.classicyRadioInputWrapperDisabled : ''
                                )}
                            >
                                <input
                                    id={item.id}
                                    name={name}
                                    disabled={item.disabled}
                                    className={classNames(
                                        classicyRadioInputStyles.classicyRadioInput,
                                        item.isDefault ? classicyRadioInputStyles.classicyRadioInputDefault : '',
                                        item.mixed ? classicyRadioInputStyles.classicyRadioInputMixed : ''
                                    )}
                                    type={'radio'}
                                    value={item.id}
                                    checked={item.id === check}
                                    defaultChecked={item.checked}
                                    tabIndex={0}
                                    onChange={() => !item.disabled && handleOnChange(item.id)}
                                    onMouseDown={() => {
                                        player({ type: 'ClassicySoundPlay', sound: 'ClassicyInputRadioClickDown' })
                                    }}
                                    onMouseUp={() => {
                                        player({ type: 'ClassicySoundPlay', sound: 'ClassicyInputRadioClickUp' })
                                    }}
                                />
                            </div>
                            <ClassicyControlLabel
                                labelFor={item.id}
                                disabled={item.disabled}
                                label={item.label}
                                onClickFunc={() => !item.disabled && handleOnChange(item.id)}
                            />
                        </div>
                    ))}
            </div>
        </>
    )
}
export default ClassicyRadioInput
