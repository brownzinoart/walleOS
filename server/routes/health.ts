import { Router } from "express";
import type express from "express";
import { checkChatProvidersHealth } from "../services/chatGateway.js";
import { checkGeminiHealth } from "../services/gemini.js";
import config from "../config/env.js";
import type { HealthCheckResponse } from "../types/index.js";

const router = Router();

router.get(
  "/",
  async (
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const chatProvidersHealth = await checkChatProvidersHealth();
      const embeddingHealth = await checkGeminiHealth();

      const response: HealthCheckResponse = {
        status:
          chatProvidersHealth.overall === "healthy" &&
          embeddingHealth.status === "healthy"
            ? "healthy"
            : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          chat: {
            providers: chatProvidersHealth.providers,
            overall: chatProvidersHealth.overall,
          },
          embedding: {
            provider: "gemini",
            model: config.geminiEmbedModel,
            ...embeddingHealth,
          },
        },
      };

      if (res.locals.requestId) {
        response.requestId = res.locals.requestId;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
