import ClassicyControlLabel from '@/app/SystemFolder/SystemResources/ControlLabel/ClassicyControlLabel'
import ClassicyPopUpMenu from '@/app/SystemFolder/SystemResources/PopUpMenu/ClassicyPopUpMenu'
import classicyTimePickerStyles from '@/app/SystemFolder/SystemResources/TimePicker/ClassicyTimePicker.module.scss'
import classNames from 'classnames'
import React, { ChangeEvent, ForwardedRef, KeyboardEvent, useState } from 'react'

interface ClassicyTimePickerProps {
    id: string
    inputType?: 'text'
    onChangeFunc?: (value: Date) => void
    labelTitle?: string
    placeholder?: string
    prefillValue?: Date
    disabled?: boolean
    isDefault?: boolean
}

const normalizeTwoDigits = (value: number): string => value.toString().padStart(2, '0')

const ClassicyTimePicker: React.FC<ClassicyTimePickerProps> = React.forwardRef<
    HTMLInputElement,
    ClassicyTimePickerProps
>(function ClassicyTimePicker(
    { id, inputType = 'text', labelTitle, placeholder, prefillValue, disabled = false, isDefault, onChangeFunc },
    ref: ForwardedRef<HTMLInputElement>
) {
    const initialDate = prefillValue ?? new Date()

    const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
    const [hour, setHour] = useState<number>(initialDate.getHours())
    const [minutes, setMinutes] = useState<number>(initialDate.getMinutes())
    const [seconds, setSeconds] = useState<number>(initialDate.getSeconds())
    const [period, setPeriod] = useState<'am' | 'pm'>(initialDate.getHours() < 12 ? 'am' : 'pm')

    const emitChange = (date: Date) => {
        onChangeFunc?.(date)
    }

    const updateDate = (updater: (next: Date) => void) => {
        const nextDate = new Date(selectedDate)
        updater(nextDate)
        setSelectedDate(nextDate)
        emitChange(nextDate)
    }

    const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const nextPeriod = event.target.value === 'pm' ? 'pm' : 'am'
        setPeriod(nextPeriod)

        updateDate((nextDate) => {
            const currentHour = nextDate.getHours()
            const adjustedHour = nextPeriod === 'pm' ? (currentHour % 12) + 12 : currentHour % 12
            nextDate.setHours(adjustedHour)
            setHour(adjustedHour)
        })
    }

    const handleTimePartChange = (
        event: ChangeEvent<HTMLInputElement>,
        part: 'hour' | 'minutes' | 'seconds'
    ) => {
        const inputValue = Number.parseInt(event.currentTarget.value, 10)

        if (Number.isNaN(inputValue)) {
            return
        }

        updateDate((nextDate) => {
            switch (part) {
                case 'hour': {
                    if (inputValue < 1 || inputValue > 12) {
                        return
                    }
                    const adjustedHour = period === 'pm' ? (inputValue % 12) + 12 : inputValue % 12
                    nextDate.setHours(adjustedHour)
                    setHour(adjustedHour)
                    setPeriod(adjustedHour < 12 ? 'am' : 'pm')
                    break
                }
                case 'minutes': {
                    if (inputValue < 0 || inputValue > 59) {
                        return
                    }
                    nextDate.setMinutes(inputValue)
                    setMinutes(inputValue)
                    break
                }
                case 'seconds': {
                    if (inputValue < 0 || inputValue > 59) {
                        return
                    }
                    nextDate.setSeconds(inputValue)
                    setSeconds(inputValue)
                    break
                }
            }
        })
    }

    const incrementTimePartChange = (
        event: KeyboardEvent<HTMLInputElement>,
        part: 'hour' | 'minutes' | 'seconds'
    ) => {
        let modifier = 0

        if (event.key === 'ArrowDown') {
            modifier = -1
        } else if (event.key === 'ArrowUp') {
            modifier = 1
        }

        if (modifier === 0) {
            return
        }

        updateDate((nextDate) => {
            switch (part) {
                case 'hour': {
                    let currentHour = (hour % 12 || 12) + modifier
                    if (currentHour > 12) {
                        currentHour = 1
                    } else if (currentHour <= 0) {
                        currentHour = 12
                    }
                    const adjustedHour = period === 'pm' ? (currentHour % 12) + 12 : currentHour % 12
                    nextDate.setHours(adjustedHour)
                    setHour(adjustedHour)
                    setPeriod(adjustedHour < 12 ? 'am' : 'pm')
                    break
                }
                case 'minutes': {
                    let currentMinutes = minutes + modifier
                    if (currentMinutes >= 60) {
                        currentMinutes = 0
                    } else if (currentMinutes < 0) {
                        currentMinutes = 59
                    }
                    nextDate.setMinutes(currentMinutes)
                    setMinutes(currentMinutes)
                    break
                }
                case 'seconds': {
                    let currentSeconds = seconds + modifier
                    if (currentSeconds >= 60) {
                        currentSeconds = 0
                    } else if (currentSeconds < 0) {
                        currentSeconds = 59
                    }
                    nextDate.setSeconds(currentSeconds)
                    setSeconds(currentSeconds)
                    break
                }
            }
        })
    }

    const displayHour = (() => {
        const twelveHour = hour % 12
        return twelveHour === 0 ? '12' : twelveHour.toString().padStart(2, '0')
    })()

    return (
        <div className={classicyTimePickerStyles.classicyTimePickerHolder}>
            {labelTitle && (
                <ClassicyControlLabel
                    label={labelTitle}
                    labelFor={id}
                    direction={'left'}
                    disabled={disabled}
                ></ClassicyControlLabel>
            )}
            <div
                className={classNames(
                    classicyTimePickerStyles.classicyTimePicker,
                    isDefault ? classicyTimePickerStyles.classicyTimePickerDefault : ''
                )}
            >
                <input
                    id={`${id}_hour`}
                    tabIndex={0}
                    name={`${id}_hour`}
                    type={inputType}
                    ref={ref}
                    disabled={disabled}
                    placeholder={placeholder}
                    onClick={(event) => event.currentTarget.select()}
                    onChange={(event) => handleTimePartChange(event, 'hour')}
                    onBlur={(event) => handleTimePartChange(event, 'hour')}
                    onKeyDown={(event) => incrementTimePartChange(event, 'hour')}
                    value={displayHour}
                    maxLength={2}
                    style={{ width: '50%' }}
                ></input>
                :
                <input
                    id={`${id}_minutes`}
                    tabIndex={0}
                    name={`${id}_minutes`}
                    type={inputType}
                    ref={ref}
                    disabled={disabled}
                    value={normalizeTwoDigits(minutes)}
                    onClick={(event) => event.currentTarget.select()}
                    onChange={(event) => handleTimePartChange(event, 'minutes')}
                    onBlur={(event) => handleTimePartChange(event, 'minutes')}
                    onKeyDown={(event) => incrementTimePartChange(event, 'minutes')}
                    maxLength={2}
                    style={{ width: '50%' }}
                ></input>
                :
                <input
                    id={`${id}_seconds`}
                    tabIndex={0}
                    name={`${id}_seconds`}
                    type={inputType}
                    ref={ref}
                    disabled={disabled}
                    value={normalizeTwoDigits(seconds)}
                    onClick={(event) => event.currentTarget.select()}
                    onChange={(event) => handleTimePartChange(event, 'seconds')}
                    onBlur={(event) => handleTimePartChange(event, 'seconds')}
                    onKeyDown={(event) => incrementTimePartChange(event, 'seconds')}
                    maxLength={2}
                    style={{ width: '50%' }}
                ></input>
            </div>
            <ClassicyPopUpMenu
                selected={period}
                id={`${id}_period`}
                options={[
                    { label: 'am', value: 'am' },
                    { label: 'pm', value: 'pm' },
                ]}
                style={{ minWidth: 'calc(var(--ui-font-size) * 4)' }}
                onChangeFunc={handlePeriodChange}
            ></ClassicyPopUpMenu>
        </div>
    )
})

export default ClassicyTimePicker
