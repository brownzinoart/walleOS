/* eslint-disable @next/next/no-img-element */
import { useDesktop } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import ClassicyControlLabel from '@/app/SystemFolder/SystemResources/ControlLabel/ClassicyControlLabel'
import classicyDatePickerStyles from '@/app/SystemFolder/SystemResources/DatePicker/ClassicyDatePicker.module.scss'
import {
    validateDayOfMonth,
    validateMonth,
} from '@/app/SystemFolder/SystemResources/DatePicker/ClassicyDatePickerUtils'
import classNames from 'classnames'
import React, { ChangeEvent, ForwardedRef, KeyboardEvent, MouseEvent, useState } from 'react'

interface ClassicyDatePickerProps {
    id: string
    inputType?: 'text'
    onChangeFunc?: (value: Date) => void
    labelTitle?: string
    placeholder?: string
    prefillValue?: Date
    disabled?: boolean
    isDefault?: boolean
}

const ClassicyDatePicker: React.FC<ClassicyDatePickerProps> = React.forwardRef<
    HTMLInputElement,
    ClassicyDatePickerProps
>(function ClassicyDatePicker(
    { id, inputType = 'text', labelTitle, placeholder, prefillValue, disabled = false, isDefault, onChangeFunc },
    ref: ForwardedRef<HTMLInputElement>
) {
    const desktop = useDesktop()

    const initialDate = prefillValue ?? new Date(desktop.System.Manager.DateAndTime.dateTime)
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
    const [month, setMonth] = useState<string>((initialDate.getMonth() + 1).toString())
    const [day, setDay] = useState<string>(initialDate.getDate().toString())
    const [year, setYear] = useState<string>(initialDate.getFullYear().toString())

    const selectText = (event: MouseEvent<HTMLInputElement>) => {
        event.currentTarget.focus()
        event.currentTarget.select()
    }

    const handleDateChange = (date: Date) => {
        onChangeFunc?.(date)
    }

    const handleDatePartChange = (e: ChangeEvent<HTMLInputElement>, part: 'month' | 'day' | 'year') => {
        let inputValue = parseInt(e.currentTarget.value)

        if (Number.isNaN(inputValue)) {
            return
        }

        const updatedDate = new Date(selectedDate)

        switch (part) {
            case 'month':
                inputValue--
                if (inputValue < 0 || inputValue > 11) {
                    setMonth('1')
                    return
                }
                updatedDate.setMonth(inputValue)
                setMonth(e.currentTarget.value)
                break
            case 'day':
                inputValue = validateDayOfMonth(inputValue, parseInt(month))
                updatedDate.setDate(inputValue)
                setDay(e.currentTarget.value)
                break
            case 'year':
                if (inputValue < 0) {
                    return
                }
                updatedDate.setFullYear(inputValue)
                setYear(e.currentTarget.value)
                break
        }

        setSelectedDate(updatedDate)
        handleDateChange(updatedDate)
    }

    const incrementDatePartChange = (e: KeyboardEvent<HTMLInputElement>, part: 'month' | 'day' | 'year') => {
        const updatedDate = new Date(selectedDate)
        let modifier = 0

        switch (e.key) {
            case 'ArrowDown':
                modifier = -1
                break
            case 'ArrowUp':
                modifier = 1
                break
        }

        switch (part) {
            case 'month':
                const currentMonth = validateMonth(parseInt(month) + modifier)
                updatedDate.setMonth(currentMonth - 1)
                setMonth(currentMonth.toString())
                break
            case 'day':
                const currentDay = validateDayOfMonth(parseInt(day) + modifier, parseInt(month))
                updatedDate.setDate(currentDay)
                setDay(currentDay.toString())
                break
            case 'year':
                const currentYear = parseInt(year) + modifier
                updatedDate.setFullYear(currentYear)
                setYear(currentYear.toString())
                break
        }

        setSelectedDate(updatedDate)
        handleDateChange(updatedDate)
    }

    return (
        <>
            <div className={classicyDatePickerStyles.classicyDatePickerHolder}>
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
                        classicyDatePickerStyles.classicyDatePicker,
                        isDefault ? classicyDatePickerStyles.classicyDatePickerDefault : ''
                    )}
                >
                    <input
                        id={id + '_month'}
                        tabIndex={0}
                        onChange={(e) => handleDatePartChange(e, 'month')}
                        onBlur={(e) => handleDatePartChange(e, 'month')}
                        onKeyDown={(e) => incrementDatePartChange(e, 'month')}
                        onClick={selectText}
                        name={id + '_month'}
                        placeholder={placeholder}
                        type={inputType}
                        ref={ref}
                        disabled={disabled}
                        value={month}
                        maxLength={2}
                        style={{ width: '25%' }}
                    ></input>
                    /
                    <input
                        id={id + '_day'}
                        tabIndex={0}
                        onChange={(e) => handleDatePartChange(e, 'day')}
                        onBlur={(e) => handleDatePartChange(e, 'day')}
                        onKeyDown={(e) => incrementDatePartChange(e, 'day')}
                        onClick={selectText}
                        name={id + '_day'}
                        placeholder={placeholder}
                        type={inputType}
                        ref={ref}
                        disabled={disabled}
                        value={day}
                        maxLength={2}
                        style={{ width: '25%' }}
                    ></input>
                    /
                    <input
                        id={id + '_year'}
                        tabIndex={0}
                        onClick={selectText}
                        onChange={(e) => handleDatePartChange(e, 'year')}
                        onBlur={(e) => handleDatePartChange(e, 'year')}
                        onKeyDown={(e) => incrementDatePartChange(e, 'year')}
                        name={id + '_year'}
                        placeholder={placeholder}
                        type={inputType}
                        ref={ref}
                        disabled={disabled}
                        value={year}
                        maxLength={4}
                        style={{ width: '50%' }}
                    ></input>
                </div>
            </div>
        </>
    )
})

export default ClassicyDatePicker
