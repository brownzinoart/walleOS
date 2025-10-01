/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { useDesktop } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import quickTimeStyles from '@/app/SystemFolder/SystemResources/QuickTime/QuickTimeMovieEmbed.module.scss'
import { parse } from '@plussub/srt-vtt-parser'
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import ReactPlayer from 'react-player'
import screenfull from 'screenfull'
import { getVolumeIcon, timeFriendly } from './QuickTimeUtils'

type QuickTimeVideoEmbed = {
    appId: string
    name: string
    url: string
    type: 'audio' | 'video'
    options?: Record<string, unknown>
    subtitlesUrl?: string
    autoPlay?: boolean
    hideControls?: boolean
    controlsDocked?: boolean
    muted?: boolean
}

export const QuickTimeVideoEmbed: React.FC<QuickTimeVideoEmbed> = ({
    appId,
    name,
    url,
    options,
    type,
    subtitlesUrl,
    autoPlay,
    hideControls,
    controlsDocked,
    muted,
}) => {
    const desktop = useDesktop()
    const desktopApps = desktop.System.Manager.App.apps

    const [playing, setPlaying] = useState(autoPlay)
    const [volume, setVolume] = useState(0.5)
    const [loop, setLoop] = useState(false)
    const [, setIsFullscreen] = useState(false)
    const [showVolume, setShowVolume] = useState<boolean>(false)
    const [subtitlesData, setSubtitlesData] = useState(null)
    const [showSubtitles, setShowSubtitles] = useState(false)

    const playerRef = useRef(null)

    useEffect(() => {
        if (!screenfull.isEnabled) {
            return
        }

        const handleChange = () => {
            setIsFullscreen(screenfull.isFullscreen)
        }

        screenfull.on('change', handleChange)
        return () => {
            screenfull.off('change', handleChange)
        }
    }, [])

    const toggleCC = useCallback(() => {
        setShowSubtitles((prev) => !prev)
    }, [])

    const handlePlayPause = useCallback(() => {
        setPlaying((prev) => !prev)
    }, [])

    const seekTo = useCallback((seconds: number) => {
        playerRef.current?.seekTo(seconds)
    }, [])

    const seekToPct = useCallback((pct: number) => {
        const duration = playerRef.current?.getDuration() ?? 0
        seekTo(pct * duration)
    }, [seekTo])

    const seekForward = useCallback(() => {
        const current = playerRef.current?.getCurrentTime() ?? 0
        seekTo(current + 10)
    }, [seekTo])

    const seekBackward = useCallback(() => {
        const current = playerRef.current?.getCurrentTime() ?? 0
        seekTo(Math.max(current - 10, 0))
    }, [seekTo])

    const toggleFullscreen = useCallback(() => {
        if (!screenfull.isEnabled) {
            return
        }
        const internalPlayer = playerRef.current?.getInternalPlayer?.()
        if (!internalPlayer) {
            return
        }
        screenfull.toggle(internalPlayer, { navigationUI: 'hide' })
    }, [])

    const escapeFullscreen = useCallback(() => {
        if (!screenfull.isEnabled) {
            return
        }
        screenfull.exit()
    }, [])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const { windows = [] } = desktopApps[appId] ?? { windows: [] }
            const playerWindow = windows.find((window) => window.id === `${appId}_VideoPlayer_${url}`)
            if (!playerWindow?.focused) {
                return
            }
            switch (event.key) {
                case ' ':
                    handlePlayPause()
                    event.preventDefault()
                    break
                case 'Escape':
                    escapeFullscreen()
                    break
                case 'ArrowRight':
                    seekForward()
                    break
                case 'ArrowLeft':
                    seekBackward()
                    break
                case 'f':
                case 'F':
                    if (type != 'audio') {
                        toggleFullscreen()
                    }
                    break
                case 'l':
                case 'L':
                    setLoop((prev) => !prev)
                    break
                default:
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [appId, desktopApps, escapeFullscreen, handlePlayPause, loop, seekBackward, seekForward, toggleFullscreen, type, url])

    const volumeButtonRef = useRef(null)

    useEffect(() => {
        if (!subtitlesUrl) {
            return
        }

        fetch(subtitlesUrl)
            .then((res) => res.text())
            .then((text) => parse(text))
            .then(setSubtitlesData)
            .catch(() => setSubtitlesData(null))
    }, [subtitlesUrl])

    return (
        <div
            className={quickTimeStyles.quickTimePlayerWrapper}
            style={{ height: controlsDocked ? 'calc(100% - var(--window-control-size) * 1)' : '100%' }}
        >
            <div
                className={quickTimeStyles.quickTimePlayerVideoHolder}
                style={{
                    height: controlsDocked
                        ? 'calc(100% - var(--window-control-size) * 1)'
                        : 'calc(100% - var(--window-border-size) * 4)',
                }}
            >
                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    playing={playing}
                    loop={loop}
                    controls={false}
                    playsinline={true}
                    width="100%"
                    height="100%"
                    volume={muted ? 0 : volume}
                    config={options}
                />
                <Suspense>
                    {showSubtitles &&
                        subtitlesData?.entries?.length > 0 &&
                        subtitlesData.entries.find((i) => {
                            const time = playerRef.current?.getCurrentTime() * 1000
                            return i.from < time && i.to > time
                        }) && (
                            <div
                                className={
                                    quickTimeStyles.quickTimePlayerCaptionsHolder +
                                    ' ' +
                                    quickTimeStyles.quickTimePlayerCaptionsHolderBottom +
                                    ' ' +
                                    quickTimeStyles.quickTimePlayerCaptionsHolderCenter
                                }
                            >
                                <div className={quickTimeStyles.quickTimePlayerCaptions}>
                                    {
                                        subtitlesData.entries.find((i) => {
                                            const time = playerRef.current?.getCurrentTime() * 1000
                                            return i.from < time && i.to > time
                                        })?.text
                                    }
                                </div>
                            </div>
                        )}
                </Suspense>
            </div>
            {!hideControls && (
                <div
                    className={quickTimeStyles.quickTimePlayerVideoControlsHolder}
                    style={{ position: controlsDocked ? 'absolute' : 'relative' }}
                >
                    <button onClick={handlePlayPause} className={quickTimeStyles.quickTimePlayerVideoControlsButton}>
                        <img
                            className={quickTimeStyles.quickTimePlayerVideoControlsIcon}
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/${playing ? 'pause' : 'play'}-button.svg`}
                        />
                    </button>
                    <div className={quickTimeStyles.quickTimePlayerVideoControlsProgressBarHolder}>
                        <input
                            id={appId + '_' + name + '_progressBar'}
                            className={quickTimeStyles.quickTimePlayerVideoControlsProgressBar}
                            key={appId + '_' + name + '_progressBar'}
                            type="range"
                            min="0" // Zero percent
                            max="1" // 100 percent
                            step="0.001" // 1 percent
                            value={playerRef.current?.getCurrentTime() / playerRef.current?.getDuration()}
                            readOnly={false}
                            onChange={(e) => {
                                seekToPct(parseFloat(e.target.value))
                            }}
                        />
                    </div>
                    <p className={quickTimeStyles.quickTimePlayerVideoControlsTime}>
                        {timeFriendly(playerRef.current?.getCurrentTime())}
                    </p>
                    <button onClick={seekBackward} className={quickTimeStyles.quickTimePlayerVideoControlsButton}>
                        <img
                            className={quickTimeStyles.quickTimePlayerVideoControlsIcon}
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/backward-button.svg`}
                        />
                    </button>
                    <button onClick={seekForward} className={quickTimeStyles.quickTimePlayerVideoControlsButton}>
                        <img
                            className={quickTimeStyles.quickTimePlayerVideoControlsIcon}
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/forward-button.svg`}
                        />
                    </button>
                    {subtitlesUrl && (
                        <button onClick={toggleCC} className={quickTimeStyles.quickTimePlayerVideoControlsButton}>
                            <img
                                className={quickTimeStyles.quickTimePlayerVideoControlsIcon}
                                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/CC.png`}
                            />
                        </button>
                    )}

                    {showVolume && (
                        <div
                            style={{
                                zIndex: 999999,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <input
                                className={quickTimeStyles.quickTimePlayerVideoControlsVolumeBar}
                                id={url + '_volume'}
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                style={{
                                    left: volumeButtonRef.current.left,
                                }}
                                value={1 - volume}
                                onClick={() => {
                                    setShowVolume(false)
                                }}
                                onChange={(e) => {
                                    setVolume(1 - parseFloat(e.target.value))
                                }}
                            />
                        </div>
                    )}
                    <button
                        className={quickTimeStyles.quickTimePlayerVideoControlsButton}
                        onClick={() => setShowVolume(!showVolume)}
                        ref={volumeButtonRef}
                    >
                        <img
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/control-panels/sound-manager/${getVolumeIcon(volume)}`}
                            className={quickTimeStyles.quickTimePlayerVideoControlsIcon}
                        />
                    </button>
                    {type != 'audio' && (
                        <button
                            onClick={toggleFullscreen}
                            className={quickTimeStyles.quickTimePlayerVideoControlsButton}
                        >
                            <img
                                className={quickTimeStyles.quickTimePlayerVideoControlsIcon}
                                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/fullscreen-button.svg`}
                            />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
