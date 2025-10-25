import { Router } from "express";
import type express from "express";
import { validateChatRequest } from "../middleware/validation.js";
import { serverLogger } from "../middleware/logger.js";
import { streamChatResponse } from "../services/chatGateway.js";
import type { ChatRequest, ChatStreamEvent } from "../types/index.js";

const router = Router();

router.post(
  "/",
  validateChatRequest,
  async (
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const body = req.body as ChatRequest;
    const requestId = res.locals.requestId;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders?.();

    let clientClosed = false;

    const closeConnection = () => {
      clientClosed = true;
      res.end();
    };

    req.on("close", () => {
      clientClosed = true;
    });

    try {
      for await (const event of streamChatResponse(body, requestId)) {
        if (clientClosed) {
          serverLogger.info("Client disconnected before stream completion", {
            requestId,
          });
          break;
        }

        const payload: ChatStreamEvent =
          event.token !== undefined
            ? {
                token: event.token,
                done: event.done,
              }
            : {
                done: event.done,
              };

        res.write(`data: ${JSON.stringify(payload)}\n\n`);

        if (event.done) {
          break;
        }
      }
    } catch (error) {
      const errPayload: ChatStreamEvent = {
        done: true,
        error: error instanceof Error ? error.message : "Unexpected error",
      };
      res.write(`data: ${JSON.stringify(errPayload)}\n\n`);
      // Do not call next(error) after streaming has started
      return; // let finally close the connection
    } finally {
      if (!clientClosed) {
        closeConnection();
      }
    }
  },
);

export default router;
