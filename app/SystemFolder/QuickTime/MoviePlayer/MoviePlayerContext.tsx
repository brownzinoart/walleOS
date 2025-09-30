import { classicyAppEventHandler, ClassicyStore } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'
import { MoviePlayerAppInfo } from '@/app/SystemFolder/QuickTime/MoviePlayer/MoviePlayer'

export type ClassicyQuickTimeDocument = {
    url: string
    name?: string
    options?: any
    icon?: string
    type?: 'video' | 'audio' | 'image'
}

type classicyQuickTimeEvent = {
    type: string
    document?: ClassicyQuickTimeDocument
    documents?: ClassicyQuickTimeDocument[]
}

export const classicyQuickTimeMoviePlayerEventHandler = (ds: ClassicyStore, action: classicyQuickTimeEvent) => {
    const { id: appId } = MoviePlayerAppInfo
    if (!ds.System.Manager.App.apps[appId]) {
        ds = classicyAppEventHandler(ds, {
            type: 'ClassicyAppLoad',
            app: MoviePlayerAppInfo,
        })
    }

    if (!ds.System.Manager.App.apps[appId]?.hasOwnProperty('data')) {
        ds.System.Manager.App.apps[appId].data = {}
    }

    if (!ds.System.Manager.App.apps[appId]?.data?.hasOwnProperty('openFiles')) {
        ds.System.Manager.App.apps[appId].data['openFiles'] = []
    }

    const openDocUrls = ds.System.Manager.App.apps[appId].data['openFiles'].map((app) => app.url)

    switch (action.type) {
        case 'ClassicyAppMoviePlayerOpenDocument': {
            if (Array.isArray(openDocUrls) && !openDocUrls.includes(action.document.url)) {
                ds.System.Manager.App.apps[appId].data['openFiles'] = Array.from(
                    new Set([...ds.System.Manager.App.apps[appId].data['openFiles'], action.document])
                )
                ds = classicyAppEventHandler(ds, {
                    type: 'ClassicyAppOpen',
                    app: MoviePlayerAppInfo,
                })
            }
            break
        }
        case 'ClassicyAppMoviePlayerOpenDocuments': {
            const docs = action.documents?.filter((doc) => !openDocUrls.includes(doc.url))
            if (!docs) {
                break
            }
            ds.System.Manager.App.apps[appId].data['openFiles'] = Array.from(
                new Set([...ds.System.Manager.App.apps[appId].data['openFiles'], ...docs])
            )
            ds = classicyAppEventHandler(ds, {
                type: 'ClassicyAppOpen',
                app: MoviePlayerAppInfo,
            })
            break
        }
        case 'ClassicyAppMoviePlayerCloseDocument': {
            ds.System.Manager.App.apps[appId].data['openFiles'] = ds.System.Manager.App.apps[appId].data[
                'openFiles'
            ].filter((p: ClassicyQuickTimeDocument) => p.url != action.document.url)
            break
        }
    }
    return ds
}
