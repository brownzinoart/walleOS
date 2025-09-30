'use client'

import { getTheme } from '@/app/SystemFolder/ControlPanels/AppearanceManager/ClassicyAppearance'
import { useDesktop, useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import { useSoundDispatch } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManagerContext'
import { getClassicyAboutWindow } from '@/app/SystemFolder/SystemResources/AboutWindow/ClassicyAboutWindow'
import ClassicyApp from '@/app/SystemFolder/SystemResources/App/ClassicyApp'
import { quitAppHelper, quitMenuItemHelper } from '@/app/SystemFolder/SystemResources/App/ClassicyAppUtils'
import ClassicyButton from '@/app/SystemFolder/SystemResources/Button/ClassicyButton'
import ClassicyControlLabel from '@/app/SystemFolder/SystemResources/ControlLabel/ClassicyControlLabel'
import ClassicyInput from '@/app/SystemFolder/SystemResources/Input/ClassicyInput'
import ClassicyPopUpMenu from '@/app/SystemFolder/SystemResources/PopUpMenu/ClassicyPopUpMenu'
import ClassicyTabs from '@/app/SystemFolder/SystemResources/Tabs/ClassicyTabs'
import ClassicyWindow from '@/app/SystemFolder/SystemResources/Window/ClassicyWindow'
import React, { useState } from 'react'

function isValidUrlWithRegex(url: string): boolean {
    const urlPattern = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i
    return urlPattern.test(url)
}

export const ClassicyAppearanceManager: React.FC = () => {
    const appName: string = 'Appearance Manager'
    const appId: string = 'AppearanceManager.app'
    const appIcon: string = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/control-panels/appearance-manager/app.png`
    const packageIcon: string = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/control-panels/appearance-manager/platinum.png`

    const desktopContext = useDesktop(),
        desktopEventDispatch = useDesktopDispatch(),
        player = useSoundDispatch()

    const [showAbout, setShowAbout] = useState(false)
    const [bg, setBg] = useState<string>(
        desktopContext.System.Manager.Appearance.activeTheme.desktop.backgroundImage ||
            `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/wallpapers/default.png`
    )

    const themesList = desktopContext.System.Manager.Appearance.availableThemes.map((a: any) =>
        (({ id, name }) => ({ value: id, label: name }))(a)
    )

    const fonts = [
        { label: 'Charcoal', value: 'Charcoal' },
        { label: 'ChicagoFLF', value: 'ChicagoFLF' },
        { label: 'Geneva', value: 'Geneva' },
        { label: 'AppleGaramond', value: 'AppleGaramond' },
    ]

    const backgroundPrefix: string = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/wallpapers`
    const backgrounds = [
        { label: 'Azul Dark', value: 'azul_dark.png' },
        { label: 'Azul Extra Light', value: 'azul_extra_light.png' },
        { label: 'Azul Light', value: 'azul_light.png' },
        { label: 'Bondi', value: 'bondi.png' },
        { label: 'Bondi Dark', value: 'bondi_dark.png' },
        { label: 'Bondi Extra Dark', value: 'bondi_extra_dark.png' },
        { label: 'Bondi Light', value: 'bondi_light.png' },
        { label: 'Bondi Medium', value: 'bondi_medium.png' },
        { label: 'Bossanova Bondi', value: 'bossanova_bondi.png' },
        { label: 'Bossanova Poppy', value: 'bossanova_poppy.png' },
        { label: 'Bossanova Poppy 2', value: 'bossanova_poppy_2.png' },
        { label: 'Bubbles bondi', value: 'bubbles_bondi.png' },
        { label: 'Bubbles poppy', value: 'bubbles_poppy.png' },
        { label: 'Candy Bar', value: 'candy_bar.png' },
        { label: 'Candy Bar Azul', value: 'candy_bar_azul.png' },
        { label: 'Candy Bar Pistachio', value: 'candy_bar_pistachio.png' },
        { label: 'Candy Bar Sunny', value: 'candy_bar_sunny.png' },
        { label: 'Default', value: 'default.png' },
        { label: 'Diagonals Bondi', value: 'diagonals_bondi.png' },
        { label: 'Diagonals Bondi dark', value: 'diagonals_bondi_dark.png' },
        { label: 'Diagonals Poppy', value: 'diagonals_poppy.png' },
        { label: 'Flat Peanuts', value: 'flat_peanuts.png' },
        { label: 'Flat Peanuts Poppy', value: 'flat_peanuts_poppy.png' },
        { label: 'French Blue Dark', value: 'french_blue_dark.png' },
        { label: 'French Blue Light', value: 'french_blue_light.png' },
        { label: 'macos', value: 'macos.png' },
        { label: 'Peanuts Azul', value: 'peanuts_azul.png' },
        { label: 'Peanuts Pistachio', value: 'peanuts_pistachio.png' },
        { label: 'Pistachio Dark', value: 'pistachio_dark.png' },
        { label: 'Pistachio Light', value: 'pistachio_light.png' },
        { label: 'Pistachio Medium', value: 'pistachio_medium.png' },
        { label: 'Poppy', value: 'poppy.png' },
        { label: 'Poppy Dark', value: 'poppy_dark.png' },
        { label: 'Poppy Light', value: 'poppy_light.png' },
        { label: 'Poppy Medium', value: 'poppy_medium.png' },
        { label: 'Rio Azul', value: 'rio_azul.png' },
        { label: 'Rio Pistachio', value: 'rio_pistachio.png' },
        { label: 'Ripple Azul', value: 'ripple_azul.png' },
        { label: 'Ripple Bondi', value: 'ripple_bondi.png' },
        { label: 'Ripple Poppy', value: 'ripple_poppy.png' },
        { label: 'Sunny', value: 'sunny.png' },
        { label: 'Sunny Dark', value: 'sunny_dark.png' },
        { label: 'Sunny Light', value: 'sunny_light.png' },
        { label: 'Waves Azul', value: 'waves_azul.png' },
        { label: 'Waves Bondi', value: 'waves_bondi.png' },
        { label: 'Waves Sunny', value: 'waves_sunny.png' },
    ]

    const switchTheme = (e) => {
        desktopEventDispatch({
            type: 'ClassicyDesktopChangeTheme',
            activeTheme: e.target.value,
        })
        loadSoundTheme(e.target.value)
    }

    const changeBackground = (e) => {
        setBg(backgroundPrefix + '/' + e.target.value)
        desktopEventDispatch({
            type: 'ClassicyDesktopChangeBackground',
            backgroundImage: '/img/wallpapers/' + e.target.value,
        })
    }

    const setBackgroundURL = (e) => {
        if (isValidUrlWithRegex(e.target.value)) {
            setBg(e.target.value)
            desktopEventDispatch({
                type: 'ClassicyDesktopChangeBackground',
                backgroundImage: e.target.value,
            })
        }
    }

    const alignBackground = (e) => {
        desktopEventDispatch({
            type: 'ClassicyDesktopChangeBackgroundPosition',
            backgroundPosition: e.target.value,
        })
    }

    const repeatBackground = (e) => {
        desktopEventDispatch({
            type: 'ClassicyDesktopChangeBackgroundRepeat',
            backgroundRepeat: e.target.value,
        })
    }

    const backgroundSize = (e) => {
        desktopEventDispatch({
            type: 'ClassicyDesktopChangeBackgroundSize',
            backgroundSize: e.target.value,
        })
    }

    const changeFont = (e) => {
        desktopEventDispatch({
            type: 'ClassicyDesktopChangeFont',
            font: e.target.value,
            fontType: e.target.id,
        })
    }
    const loadSoundTheme = (themeName: string) => {
        const soundTheme = getTheme(themeName).sound
        player({
            type: 'ClassicySoundLoad',
            file: soundTheme.file,
            disabled: soundTheme.disabled,
        })
    }

    const quitApp = () => {
        desktopEventDispatch(quitAppHelper(appId, appName, appIcon))
    }

    const appMenu = [
        {
            id: appId + '_file',
            title: 'File',
            menuChildren: [quitMenuItemHelper(appId, appName, appIcon)],
        },
        {
            id: appId + '_help',
            title: 'Help',
            menuChildren: [
                {
                    id: appId + '_about',
                    title: 'About',
                    onClickFunc: () => {
                        setShowAbout(true)
                    },
                },
            ],
        },
    ]

    const cleanupIcons = () => {
        desktopEventDispatch({
            type: 'ClassicyDesktopIconCleanup',
        })
    }

    const tabs = [
        {
            title: 'Themes',
            children: (
                <>
                    <ClassicyControlLabel label={'The current Theme Package is Platinum'} icon={packageIcon} />
                    <br />
                    <ClassicyPopUpMenu
                        id={'select_theme'}
                        label={'Selected Theme'}
                        options={themesList}
                        onChangeFunc={switchTheme}
                        selected={desktopContext.System.Manager.Appearance.activeTheme.id || 'default'}
                    />
                    <br />
                </>
            ),
        },
        {
            title: 'Desktop',
            children: (
                <>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                        <img
                            draggable={false}
                            src={bg}
                            style={{ height: '100%', minWidth: '50%', userSelect: 'none' }}
                            alt={'Background'}
                        />
                        <div style={{ width: '100%' }}>
                            <ClassicyControlLabel label={'Patterns'} direction={'left'} />
                            <ClassicyPopUpMenu
                                id={'bg'}
                                options={backgrounds}
                                onChangeFunc={changeBackground}
                                selected={bg.split('/').pop()}
                            ></ClassicyPopUpMenu>
                            <br />
                            <ClassicyControlLabel label={'Picture'} direction={'left'} />
                            <ClassicyInput id={'custom_background_image_url'} onChangeFunc={setBackgroundURL} />
                            <br />
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1em' }}>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                                    <ClassicyControlLabel label={'Align'} direction={'left'} />
                                    <ClassicyPopUpMenu
                                        onChangeFunc={alignBackground}
                                        id={'position_custom_background_image'}
                                        small={false}
                                        options={[
                                            { value: 'center', label: 'Center' },
                                            { value: 'top left', label: 'Top Left' },
                                            { value: 'top right', label: 'Top Right' },
                                            { value: 'top center', label: 'Top Center' },
                                            { value: 'bottom left', label: 'Bottom Left' },
                                            { value: 'bottom right', label: 'Bottom Right' },
                                            { value: 'bottom center', label: 'Bottom Center' },
                                            // { value: 'tile', label: 'Tile on Screen' },
                                        ]}
                                        selected={'center'}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                                    <ClassicyControlLabel label={'Repeat'} direction={'left'} />
                                    <ClassicyPopUpMenu
                                        onChangeFunc={repeatBackground}
                                        id={'repeat_background_image'}
                                        small={false}
                                        options={[
                                            { value: 'repeat', label: 'Repeat' },
                                            { value: 'repeat-x', label: 'Repeat Horizontally' },
                                            { value: 'repeat-y', label: 'Repeat Vertically' },
                                            { value: 'no-repeat', label: 'No Repeat' },
                                        ]}
                                        selected={'repeat'}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                                    <ClassicyControlLabel label={'Size'} direction={'left'} />
                                    <ClassicyPopUpMenu
                                        onChangeFunc={backgroundSize}
                                        id={'repeat_background_image'}
                                        small={false}
                                        options={[
                                            { value: 'normal', label: 'Normal' },
                                            { value: 'cover', label: 'Stretch' },
                                            { value: 'contain', label: 'Fill' },
                                        ]}
                                        selected={'repeat'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ),
        },
        {
            title: 'Fonts',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                        <div style={{ width: '50%' }}>
                            <ClassicyControlLabel label={'Large System Font'} direction={'left'} />
                        </div>
                        <ClassicyPopUpMenu
                            id={'ui'}
                            options={fonts}
                            selected={desktopContext.System.Manager.Appearance.activeTheme.typography.ui}
                            onChangeFunc={changeFont}
                        ></ClassicyPopUpMenu>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                        <div style={{ width: '50%' }}>
                            <ClassicyControlLabel label={'Small System Font'} direction={'left'} />
                        </div>
                        <ClassicyPopUpMenu
                            id={'body'}
                            options={fonts}
                            selected={desktopContext.System.Manager.Appearance.activeTheme.typography.body}
                            onChangeFunc={changeFont}
                        ></ClassicyPopUpMenu>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '1em' }}>
                        <div style={{ width: '50%' }}>
                            <ClassicyControlLabel label={'Header Font'} direction={'left'} />
                        </div>
                        <ClassicyPopUpMenu
                            id={'header'}
                            options={fonts}
                            selected={desktopContext.System.Manager.Appearance.activeTheme.typography.header}
                            onChangeFunc={changeFont}
                        ></ClassicyPopUpMenu>
                    </div>
                </div>
            ),
        },
    ]

    return (
        <ClassicyApp
            id={appId}
            name={appName}
            icon={appIcon}
            defaultWindow={'AppearanceManager_1'}
            openOnBoot={false}
            noDesktopIcon={true}
            addSystemMenu={true}
        >
            <ClassicyWindow
                id={'AppearanceManager_1'}
                title={appName}
                appId={appId}
                icon={appIcon}
                closable={true}
                resizable={false}
                zoomable={false}
                scrollable={false}
                collapsable={false}
                initialSize={[500, 0]}
                initialPosition={[300, 50]}
                modal={false}
                appMenu={appMenu}
            >
                <div
                    style={{
                        backgroundColor: 'var(--color-system-03)',
                        height: '100%',
                        width: '100%',
                        padding: 'var(--window-padding-size)',
                        boxSizing: 'border-box',
                    }}
                >
                    <ClassicyTabs tabs={tabs} />
                    <ClassicyButton onClickFunc={cleanupIcons}>Cleanup Icons</ClassicyButton>
                    <ClassicyButton onClickFunc={quitApp}>Quit</ClassicyButton>
                </div>
            </ClassicyWindow>
            {showAbout && getClassicyAboutWindow({ appId, appName, appIcon, hideFunc: () => setShowAbout(false) })}
        </ClassicyApp>
    )
}
