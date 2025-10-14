import { Router } from 'express';
import type express from 'express';
import type { ParsedQs } from 'qs';
import { fetchContext7Documentation, searchContext7Libraries } from '../services/context7.js';
import { ValidationError } from '../middleware/validation.js';

const router = Router();

router.get('/search', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const queryParams = req.query as ParsedQs & { q?: string };
  const rawQuery = typeof queryParams.q === 'string' ? queryParams.q : undefined;
  const query = rawQuery?.trim() ?? '';

  if (query.length < 2) {
    next(
      new ValidationError('Invalid Context7 search parameters.', [
        {
          field: 'q',
          message: 'Query must be at least 2 characters long.',
        },
      ]),
    );
    return;
  }

  try {
    const results = await searchContext7Libraries(query, req.ip, res.locals.requestId);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

router.get('/docs', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const queryParams = req.query as ParsedQs & { id?: string; tokens?: string; topic?: string };
  const rawId = typeof queryParams.id === 'string' ? queryParams.id : undefined;
  const libraryId = rawId?.trim() ?? '';

  if (libraryId.length === 0) {
    next(
      new ValidationError('Invalid Context7 documentation parameters.', [
        {
          field: 'id',
          message: 'Library ID is required.',
        },
      ]),
    );
    return;
  }

  const rawTokens = queryParams.tokens;
  const rawTopic = queryParams.topic;

  let tokens: number | undefined;
  if (typeof rawTokens === 'string' && rawTokens.trim().length > 0) {
    const parsed = Number.parseInt(rawTokens, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      next(
        new ValidationError('Invalid Context7 documentation parameters.', [
          {
            field: 'tokens',
            message: 'Tokens must be a positive integer when provided.',
          },
        ]),
      );
      return;
    }
    tokens = parsed;
  }

  const topic = typeof rawTopic === 'string' && rawTopic.trim().length > 0 ? rawTopic.trim() : undefined;

  try {
    const options =
      tokens === undefined && topic === undefined
        ? undefined
        : {
            ...(tokens !== undefined ? { tokens } : {}),
            ...(topic ? { topic } : {}),
          };

    const result = await fetchContext7Documentation(
      libraryId,
      options,
      req.ip,
      res.locals.requestId,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
