import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  renderArtGalleryPage,
  initArtGalleryPage,
  cleanupArtGalleryPage,
} from "@/components/ArtGalleryPage";

describe("ArtGalleryPage", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanupArtGalleryPage();
  });

  describe("renderArtGalleryPage", () => {
    it("should render art gallery page with correct structure", () => {
      const markup = renderArtGalleryPage();

      expect(markup).toContain("art-gallery-container");
      expect(markup).toContain("art-gallery-content");
      expect(markup).toContain("back-button");
    });

    it("should include navigation elements", () => {
      const markup = renderArtGalleryPage();

      expect(markup).toContain("Back");
      expect(markup).toContain('onclick="history.back()"');
    });

    it("should contain horizontal scroll gallery", () => {
      const markup = renderArtGalleryPage();

      expect(markup).toContain("scroll-animations-example");
      expect(markup).toContain("data-scroll-container");
      expect(markup).toContain("scrollsection");
      expect(markup).toContain("data-scroll-section");
    });

    it("should contain gallery items with scroll attributes", () => {
      const markup = renderArtGalleryPage();

      expect(markup).toContain("data-scroll");
      expect(markup).toContain("data-scroll-speed");
      expect(markup).toContain('class="image"');
      expect(markup).toContain("/playground/optimized/");
    });

    it("should include different item sizes", () => {
      const markup = renderArtGalleryPage();

      expect(markup).toContain("-big");
      expect(markup).toContain("-normal");
      expect(markup).toContain("-small");
      expect(markup).toContain("-horizontal");
    });

    it("should include optimized playground images", () => {
      const markup = renderArtGalleryPage();

      expect(markup).toContain("/playground/optimized/modern_love.jpg");
      expect(markup).toContain("/playground/optimized/phone_who.jpg");
      expect(markup).toContain("/playground/optimized/you_stole_my_heart.jpg");
    });
  });

  describe("initArtGalleryPage and cleanupArtGalleryPage", () => {
    it("should initialize and cleanup without errors", () => {
      // Set up DOM
      document.body.innerHTML = renderArtGalleryPage();

      // Should not throw
      expect(() => initArtGalleryPage()).not.toThrow();
      expect(() => cleanupArtGalleryPage()).not.toThrow();
    });

    it("should handle missing container gracefully", () => {
      // Empty DOM
      expect(() => initArtGalleryPage()).not.toThrow();
      expect(() => cleanupArtGalleryPage()).not.toThrow();
    });

    it("should handle LocomotiveScroll loading", () => {
      // Set up DOM
      document.body.innerHTML = renderArtGalleryPage();

      // Should not throw even if LocomotiveScroll is not initially available
      expect(() => initArtGalleryPage()).not.toThrow();

      // Clean up
      cleanupArtGalleryPage();
    });
  });
});
