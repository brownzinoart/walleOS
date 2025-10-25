import type express from "express";
import { serverLogger } from "./logger.js";
import { ValidationError } from "./validation.js";
import { GlmServiceError } from "../services/glm.js";
import { GeminiServiceError } from "../services/gemini.js";
import { ChatGatewayError } from "../services/chatGateway.js";
import { Context7ServiceError } from "../services/context7.js";

const errorHandler = (
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = res.locals.requestId;
  const baseContext = {
    requestId,
    path: req.originalUrl,
    method: req.method,
  };

  if (err instanceof ValidationError) {
    serverLogger.warn("Validation error", {
      ...baseContext,
      details: err.details,
    });

    res.status(400).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  if (err instanceof GlmServiceError) {
    serverLogger.error("GLM service error", err, baseContext);
    res.status(503).json({
      error: {
        message: err.message,
        code: "GLM_SERVICE_ERROR",
        requestId,
      },
    });
    return;
  }

  if (err instanceof GeminiServiceError) {
    serverLogger.error("Gemini service error", err, baseContext);
    res.status(503).json({
      error: {
        message: err.message,
        code: "GEMINI_SERVICE_ERROR",
        details: err.details,
        requestId,
      },
    });
    return;
  }

  if (err instanceof ChatGatewayError) {
    serverLogger.error("Chat gateway error", err, baseContext);
    res.status(503).json({
      error: {
        message: err.message,
        code: "CHAT_GATEWAY_ERROR",
        details: { providerErrors: err.providerErrors },
        requestId,
      },
    });
    return;
  }

  if (err instanceof Context7ServiceError) {
    const status = err.status ?? 502;
    const context = {
      ...baseContext,
      details: err.details,
    };

    if (status >= 500) {
      serverLogger.error("Context7 service error", err, context);
    } else {
      serverLogger.warn("Context7 service warning", context);
    }

    res.status(status).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  const errorObject = err as {
    status?: number;
    statusCode?: number;
    message?: string;
    code?: string;
  };

  if (errorObject?.status === 429 || errorObject?.statusCode === 429) {
    serverLogger.warn("Rate limit triggered", baseContext);
    res.status(429).json({
      error: {
        message: "Too many requests, please try again in a few minutes.",
        code: "RATE_LIMIT_EXCEEDED",
        requestId,
      },
    });
    return;
  }

  const message = errorObject?.message ?? "Internal server error";

  serverLogger.error(
    "Unhandled error",
    err instanceof Error ? err : new Error(message),
    baseContext,
  );

  res.status(500).json({
    error: {
      message: "An unexpected error occurred.",
      code: "INTERNAL_SERVER_ERROR",
      requestId,
    },
  });
};

export default errorHandler;
