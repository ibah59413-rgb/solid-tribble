const express = require('express');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../config/db');
const { requireAuth } = require('../middleware/require-auth');

const router = express.Router();
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many chat requests. Try again shortly.' }
});
router.use(requireAuth);

async function generateReply(messages) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('AI provider is not configured. Set OPENAI_API_KEY.');
    error.status = 503;
    throw error;
  }

  const response = await fetch(process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are Banna AI, a helpful, clear, and friendly assistant.' },
        ...messages.map(({ role, content }) => ({ role, content }))
      ],
      temperature: 0.7
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('AI provider returned an error:', response.status, details.slice(0, 500));
    const error = new Error('AI provider could not complete the request.');
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    const error = new Error('AI provider returned an empty response.');
    error.status = 502;
    throw error;
  }
  return { content: content.trim(), model: data.model || process.env.OPENAI_MODEL || 'gpt-4o-mini' };
}

router.get('/', async (req, res, next) => {
  try {
    const result = await getDb().query(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 100',
      [req.user.sub]
    );
    return res.json({ conversations: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/:conversationId/messages', async (req, res, next) => {
  try {
    const conversation = await getDb().query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [req.params.conversationId, req.user.sub]
    );
    if (!conversation.rows[0]) return res.status(404).json({ message: 'Conversation not found.' });

    const result = await getDb().query(
      'SELECT id, role, content, model, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 500',
      [req.params.conversationId]
    );
    return res.json({ messages: result.rows });
  } catch (error) {
    if (error.code === '22P02') return res.status(400).json({ message: 'Invalid conversation ID.' });
    return next(error);
  }
});

router.post('/', chatLimiter, async (req, res, next) => {
  const client = await getDb().connect();
  let transactionOpen = false;

  try {
    const prompt = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const requestedId = req.body.conversationId || null;
    if (!prompt || prompt.length > 12000) {
      client.release();
      return res.status(400).json({ message: 'Message is required and must be no more than 12,000 characters.' });
    }

    await client.query('BEGIN');
    transactionOpen = true;
    let conversationId = requestedId;
    if (conversationId) {
      const existing = await client.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [conversationId, req.user.sub]
      );
      if (!existing.rows[0]) {
        await client.query('ROLLBACK');
        transactionOpen = false;
        client.release();
        return res.status(404).json({ message: 'Conversation not found.' });
      }
    } else {
      const title = prompt.replace(/\s+/g, ' ').slice(0, 80);
      const created = await client.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [req.user.sub, title]
      );
      conversationId = created.rows[0].id;
    }

    const historyResult = await client.query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 20',
      [conversationId]
    );
    const history = historyResult.rows.reverse();
    const userMessage = await client.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING id, role, content, created_at',
      [conversationId, 'user', prompt]
    );
    await client.query('COMMIT');
    transactionOpen = false;
    client.release();

    const ai = await generateReply([...history, { role: 'user', content: prompt }]);
    const savedAssistantMessage = await getDb().query(
      'INSERT INTO messages (conversation_id, role, content, model) VALUES ($1, $2, $3, $4) RETURNING id, role, content, model, created_at',
      [conversationId, 'assistant', ai.content, ai.model]
    );
    await getDb().query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);

    return res.status(201).json({
      conversationId,
      userMessage: userMessage.rows[0],
      assistantMessage: savedAssistantMessage.rows[0]
    });
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
    if (error.code === '22P02') return res.status(400).json({ message: 'Invalid conversation ID.' });
    if (error.status) return res.status(error.status).json({ message: error.message });
    return next(error);
  }
});

module.exports = router;
