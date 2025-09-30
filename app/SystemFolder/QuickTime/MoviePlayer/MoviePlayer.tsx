import { ClassicyStoreSystemApp } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'

const MoviePlayerAppInfo: ClassicyStoreSystemApp = {
  id: 'QuickTimePlayer.app',
  name: 'QuickTime Player',
  icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/player.png`,
  windows: [],
  open: false,
}

export { MoviePlayerAppInfo }
