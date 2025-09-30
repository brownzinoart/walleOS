import classicyTabStyles from '@/app/SystemFolder/SystemResources/Tabs/ClassicyTabs.module.scss'
import React, { ReactNode, useState } from 'react'
import tabMaskImage from './tab.svg'
import { useSoundDispatch } from '@/app/SystemFolder/ControlPanels/SoundManager/ClassicySoundManagerContext'

interface TabProps {
    tabs: TabIndividual[]
}

interface TabIndividual {
    title: string
    children: ReactNode
}

const ClassicyTabs: React.FC<TabProps> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(0)
    const player = useSoundDispatch()

    const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        player({ type: 'ClassicySoundPlay', sound: 'ClassicyTabClick' })
        setActiveTab(Number.parseInt(event.currentTarget.id, 10))
    }

    return (
        <div className={classicyTabStyles.classicyTabContainer}>
            <div className={classicyTabStyles.classicyButtonsHolder}>
                {tabs.map((tab, index) => {
                    return (
                        <div
                            key={'button_' + index.toString()}
                            className={classicyTabStyles.classicyTabButtonWrapper}
                            style={{ maskImage: `url(${tabMaskImage.src})` }}
                        >
                            <button
                                id={index.toString()}
                                style={{ maskImage: `url(${tabMaskImage.src})` }}
                                className={
                                    classicyTabStyles.classicyTabButton +
                                    ' ' +
                                    (index == activeTab ? classicyTabStyles.classicyTabButtonActive : '')
                                }
                                onClick={handleTabClick}
                            >
                                {tab.title}
                            </button>
                        </div>
                    )
                })}
            </div>
            <div className={classicyTabStyles.classicyTabsHolder}>
                {tabs.map((tab, index) => {
                    return (
                        <div
                            id={index.toString()}
                            key={index.toString()}
                            className={
                                index == activeTab
                                    ? classicyTabStyles.classicyTabActiveContent
                                    : classicyTabStyles.classicyTabHiddenContent
                            }
                        >
                            {tab.children}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ClassicyTabs
