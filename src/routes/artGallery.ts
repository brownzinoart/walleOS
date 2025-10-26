import {
  renderArtGalleryPage,
  initArtGalleryPage,
  cleanupArtGalleryPage,
} from "@/components/ArtGalleryPage";
import type { RouteModule } from "./types";

const artGalleryRoute: RouteModule = {
  render: () => renderArtGalleryPage(),
  init: () => {
    initArtGalleryPage();
  },
  cleanup: () => {
    cleanupArtGalleryPage();
  },
};

export default artGalleryRoute;
