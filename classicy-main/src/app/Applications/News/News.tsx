import { useDesktop, useDesktopDispatch } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import ClassicyApp from '@/app/SystemFolder/SystemResources/App/ClassicyApp'
import { quitMenuItemHelper } from '@/app/SystemFolder/SystemResources/App/ClassicyAppUtils'
import ClassicyButton from '@/app/SystemFolder/SystemResources/Button/ClassicyButton'
import ClassicyPopUpMenu from '@/app/SystemFolder/SystemResources/PopUpMenu/ClassicyPopUpMenu'
import ClassicyWindow from '@/app/SystemFolder/SystemResources/Window/ClassicyWindow'
import React, { useState } from 'react'
import data from './entries.json' with { type: 'json' }
import styles from './News.module.scss'

type Entry = {
    id: number
    title: string
    start_date: string
    end_date: string
    content: string
    image: string
    image_caption: string
    source: string
}

const News: React.FC = () => {
    const appName = 'News'
    const appId = 'News.app'
    const appIcon = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/applications/news/app.png`
    const appMenu = [
        {
            id: 'file',
            title: 'File',
            menuChildren: [quitMenuItemHelper(appId, appName, appIcon)],
        },
    ]

    const desktopEventDispatch = useDesktopDispatch(),
        desktop = useDesktop()

    const [limit, setLimit] = useState<number>(10)
    const [offset, setOffset] = useState<number>(0)
    const [thumbStyle, setThumbStyle] = useState<'small' | 'large'>('small')
    const [openDocuments, setOpenDocuments] = useState<number[]>([])

    let entries = data as Entry[]
    entries.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())

    const filteredEntries = entries.filter((entry: Entry) => {
        const startDate = new Date(entry.start_date)
        startDate.setHours(startDate.getHours() + parseInt(desktop.System.Manager.DateAndTime.timeZoneOffset))
        return new Date(desktop.System.Manager.DateAndTime.dateTime) > new Date(entry.start_date)
    })

    const displayEntries = filteredEntries.slice(offset, offset + limit)

    const openDocumentDetails = (docId: number) => {
        setOpenDocuments(Array.from(new Set([...openDocuments, docId])))
        const windowIndex = desktop.System.Manager.App.apps[appId].windows?.findIndex(
            (w) => w.id === appId + '_newsitem_' + docId
        )
        const ws = desktop.System.Manager.App.apps[appId].windows[windowIndex] || undefined
        if (ws) {
            ws.closed = false
            desktopEventDispatch({
                type: 'ClassicyWindowOpen',
                app: {
                    id: appId,
                },
                window: ws,
            })
            desktopEventDispatch({
                type: 'ClassicyWindowFocus',
                app: {
                    id: appId,
                },
                window: ws,
            })
        }
    }

    const paginate = (direction: 'forward' | 'back' | 'now') => {
        if (direction === 'now') {
            setOffset(0)
        } else if (direction === 'back') {
            if (filteredEntries.length - (offset + limit) > 0) {
                setOffset(offset + limit)
            }
        } else if (offset - limit >= 0 && offset < entries.length) {
            setOffset(offset - limit)
        } else {
            setOffset(0)
        }
    }

    const getDoc = (docId: number) => {
        return entries.find((entry: Entry) => {
            return entry.id === docId
        })
    }

    const getWindowOpenOffset = () => {
        return (
            desktop.System.Manager.App.apps[appId]?.windows?.filter((w) => !w.closed).length *
            desktop.System.Manager.Appearance.activeTheme.measurements.window.paddingSize
        )
    }

    return (
        <ClassicyApp id={appId} name={appName} icon={appIcon} defaultWindow={'latest_news'} addSystemMenu={false}>
            <ClassicyWindow
                id={'latest_news'}
                title={'Latest News'}
                appId={appId}
                icon={appIcon}
                closable={true}
                resizable={true}
                zoomable={true}
                scrollable={true}
                collapsable={true}
                initialSize={[500, 300]}
                initialPosition={[300, 50]}
                minimumSize={[500, 300]}
                modal={false}
                appMenu={appMenu}
            >
                <div style={{}} className={styles.newsHeader}>
                    <div style={{ flexGrow: 1, marginLeft: 'var(--window-padding-size)' }}>
                        <ClassicyPopUpMenu
                            id={'per_page'}
                            small={false}
                            label={'Per Page'}
                            onChangeFunc={(e) => setLimit(parseInt(e.target.value))}
                            options={[
                                { value: '2', label: '2' },
                                { value: '10', label: '10' },
                                { value: '20', label: '20' },
                                { value: '50', label: '50' },
                                { value: '100', label: '100' },
                            ]}
                            selected={limit.toString()}
                        />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <ClassicyPopUpMenu
                            id={'thumb_size'}
                            small={false}
                            label={'Size'}
                            onChangeFunc={(e) => setThumbStyle(e.target.value)}
                            options={[
                                { value: 'small', label: 'Small' },
                                { value: 'large', label: 'Large' },
                            ]}
                            selected={'hello'}
                        />
                    </div>
                    <ClassicyButton onClickFunc={(e) => paginate('back')}>&lt;&lt;</ClassicyButton>
                    <ClassicyButton onClickFunc={(e) => paginate('now')}>Now</ClassicyButton>
                    <ClassicyButton onClickFunc={(e) => paginate('forward')}>&gt;&gt;</ClassicyButton>
                </div>
                <div style={{ padding: '.5em' }}>
                    <h1
                        style={{
                            padding: '0',
                            margin: 0,
                            backgroundImage: 'linear-gradient(.25turn, white, var(--color-system-05))',
                        }}
                    >
                        Latest News
                    </h1>
                    {displayEntries.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <p style={{ fontFamily: 'var(--ui-font)', fontSize: 'calc(var(--ui-font-size) * .8)' }}>
                                From {new Date(displayEntries.at(0)?.start_date).toLocaleString()} to{' '}
                                {new Date(displayEntries.at(-1)?.end_date).toLocaleString()}
                            </p>
                            <p style={{ fontFamily: 'var(--ui-font)', fontSize: 'calc(var(--ui-font-size) * .8)' }}>
                                Total Articles:{' '}
                                {
                                    entries.filter((e) => {
                                        return (
                                            new Date(e.start_date).getTime() <
                                            new Date(desktop.System.Manager.DateAndTime.dateTime).getTime()
                                        )
                                    }).length
                                }
                            </p>
                        </div>
                    )}
                    <hr />

                    <ul
                        style={{
                            fontFamily: 'var(--header-font)',
                            padding: '0 calc(var(--window-control-size) * 2)',
                        }}
                    >
                        {displayEntries.map((entry, index) => (
                            <li
                                key={entry.id}
                                style={{
                                    margin: '0',
                                    borderBottom: '1px solid black',
                                    padding: 'calc(var(--window-control-size) ) 0',
                                    listStyle: !entry.image || thumbStyle == 'small' ? 'outside' : 'none',
                                    fontSize:
                                        thumbStyle == 'small' ? 'var(--ui-font-size)' : 'calc(var(--ui-font-size)*2)',
                                }}
                            >
                                {entry.image && (
                                    <img
                                        src={
                                            'https://web.archive.org/web/20240807120239if_/http://cdn.historycommons.org/images/events/FAA_jet_2050081722-33361.jpg'
                                        }
                                        style={{
                                            width: thumbStyle == 'small' ? '10%' : '100%',
                                            aspectRatio: thumbStyle == 'small' ? 1 : 'auto',
                                            objectFit: 'cover',
                                            float: 'right',
                                            marginBottom: 'var(--window-control-size)',
                                            marginLeft: 'var(--window-control-size)',
                                            borderRadius: 'calc(var(--window-control-size)/2)',
                                        }}
                                    />
                                )}
                                <a
                                    href={'#'}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        openDocumentDetails(entry.id)
                                    }}
                                >
                                    <h1
                                        style={{
                                            fontSize:
                                                thumbStyle == 'small'
                                                    ? 'calc(var(--ui-font-size))'
                                                    : 'calc(var(--ui-header-size))',
                                        }}
                                    >
                                        {entry.title}
                                    </h1>
                                </a>
                                <span
                                    style={{
                                        fontFamily: 'var(--ui-font)',
                                        fontSize:
                                            thumbStyle == 'small'
                                                ? 'calc(var(--ui-font-size)*.7)'
                                                : 'calc(var(--ui-font-size)*1)',
                                    }}
                                >
                                    {' '}
                                    {new Date(entry.start_date).toLocaleString('en-US', {
                                        month: 'numeric',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        second: 'numeric',
                                    })}{' '}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </ClassicyWindow>
            {openDocuments.map((docId: number) => (
                <ClassicyWindow
                    onCloseFunc={() => {
                        setOpenDocuments(openDocuments.filter((d) => d !== docId))
                    }}
                    id={appId + '_newsitem_' + docId}
                    key={appId + '_newsitem_' + docId}
                    icon={appIcon}
                    title={getDoc(docId)?.title}
                    appId={appId}
                    closable={true}
                    resizable={true}
                    zoomable={true}
                    scrollable={true}
                    collapsable={true}
                    initialSize={[400, 400]}
                    initialPosition={[10 + getWindowOpenOffset(), 20 + getWindowOpenOffset()]}
                    modal={false}
                    appMenu={appMenu}
                >
                    <div style={{ padding: '.5em' }}>
                        <h1
                            style={{
                                margin: 'var(--window-padding-size) 0',
                                fontFamily: 'var(--header-font)',
                            }}
                        >
                            {getDoc(docId)?.title}
                        </h1>
                            <h6 style={{ margin: 'var(--window-padding-size) 0', fontFamily: 'var(--ui-font)' }}>
                            {new Date(getDoc(docId)?.start_date).toLocaleDateString()}{' '}
                            {new Date(getDoc(docId)?.start_date).toLocaleTimeString()} - {getDoc(docId)?.source}
                        </h6>

                        <hr style={{ borderTop: 'black 1px solid' }} />
                        {getDoc(docId)?.image && (
                            <figure>
                                <img src={getDoc(docId)?.image} style={{ width: '100%' }} />
                                    <figcaption className={styles.newsCaption}>
                                        {getDoc(docId)?.image_caption}
                                    </figcaption>
                            </figure>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 'var(--window-padding-size)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 'var(--ui-font-size)',
                                    color: 'var(--color-theme-05)',
                                }}
                            >
                                •••
                            </p>
                            <div
                                style={{ fontFamily: 'var(--body-font)' }}
                                dangerouslySetInnerHTML={{ __html: getDoc(docId)?.content }}
                            ></div>
                        </div>
                    </div>
                </ClassicyWindow>
            ))}
        </ClassicyApp>
    )
}

export default News
