import { ClassicyStoreSystemApp } from '@/app/SystemFolder/ControlPanels/AppManager/ClassicyAppManager'

const PictureViewerAppInfo: ClassicyStoreSystemApp = {
  id: 'QuickTimePictureViewer.app',
  name: 'QuickTime Picture Viewer',
  icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/quicktime/picture-viewer.png`,
  windows: [],
  open: false,
}

export { PictureViewerAppInfo }
