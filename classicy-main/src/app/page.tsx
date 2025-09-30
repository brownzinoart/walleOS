'use client'

import Browser from '@/app/Applications/Browser/Browser'
import Demo from '@/app/Applications/Demo/Demo'
import EPG from '@/app/Applications/EPG/EPG'
import News from '@/app/Applications/News/News'
import SimpleText from '@/app/Applications/SimpleText/SimpleText'
import TV from '@/app/Applications/TV/TV'
import { ClassicyDesktopProvider } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManagerContext'
import MoviePlayer from '@/app/SystemFolder/QuickTime/MoviePlayer/MoviePlayer'
import PictureViewer from '@/app/SystemFolder/QuickTime/PictureViewer/PictureViewer'
import ClassicyDesktop from '@/app/SystemFolder/SystemResources/Desktop/ClassicyDesktop'
import React from 'react'

export default function Home() {
    return (
        <ClassicyDesktopProvider>
            <ClassicyDesktop>
                <Browser />
                <Demo />
                <News />
                <EPG />
                <TV />
                <MoviePlayer />
                <PictureViewer />
                <SimpleText />
            </ClassicyDesktop>
        </ClassicyDesktopProvider>
    )
}
