import { useDesktop } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import ClassicyControlLabel from '@/app/SystemFolder/SystemResources/ControlLabel/ClassicyControlLabel'
import classicyDatePickerStyles from '@/app/SystemFolder/SystemResources/DatePicker/ClassicyDatePicker.module.scss'
import {
    validateDayOfMonth,
    validateMonth,
} from '@/app/SystemFolder/SystemResources/DatePicker/ClassicyDatePickerUtils'
import classNames from 'classnames'
import React, { ChangeEvent, KeyboardEvent, useState } from 'react'

interface ClassicyDatePickerProps {
    id: string
    inputType?: 'text'
    onChangeFunc?: any
    labelTitle?: string
    placeholder?: string
    prefillValue?: Date
    disabled?: boolean
    isDefault?: boolean
    ref?: any
}

const ClassicyDatePicker: React.FC<ClassicyDatePickerProps> = React.forwardRef<
    HTMLInputElement,
    ClassicyDatePickerProps
>(function ClassicyDatePicker(
    { id, inputType = 'text', labelTitle, placeholder, prefillValue, disabled = false, isDefault, onChangeFunc },
    ref
) {
    const desktop = useDesktop()

    const [selectedDate, setSelectedDate] = useState<Date>(new Date(desktop.System.Manager.DateAndTime.dateTime))
    const [month, setMonth] = useState<string>(
        (new Date(desktop.System.Manager.DateAndTime.dateTime).getMonth() + 1).toString()
    )
    const [day, setDay] = useState<string>(new Date(desktop.System.Manager.DateAndTime.dateTime).getDate().toString())
    const [year, setYear] = useState<string>(
        new Date(desktop.System.Manager.DateAndTime.dateTime).getFullYear().toString()
    )

    const selectText = (e) => {
        e.target.focus()
        e.target.select()
    }

    const handleDateChange = (date: Date) => {
        if (onChangeFunc) {
            onChangeFunc(date)
        }
    }

    const handleDatePartChange = (e: ChangeEvent<HTMLInputElement>, part: 'month' | 'day' | 'year') => {
        let inputValue = parseInt(e.currentTarget.value)

        if (isNaN(inputValue)) {
            return
        }

        let updatedDate = new Date(selectedDate)

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
        let updatedDate = new Date(selectedDate)
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
                let currentMonth = validateMonth(parseInt(month) + modifier)
                updatedDate.setHours(currentMonth)
                setMonth(currentMonth.toString())
                break
            case 'day':
                let currentDay = validateDayOfMonth(parseInt(day) + modifier, parseInt(month))
                updatedDate.setDate(currentDay)
                setDay(currentDay.toString())
                break
            case 'year':
                let currentYear = parseInt(year) + modifier
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
