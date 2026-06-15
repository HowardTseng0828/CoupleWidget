interface PairRequestBody {
  action?: string;
  userId?: string;
  code?: string;
}

interface PairCodeRecord {
  userId: string;
}

interface CoupleMapping {
  coupleId: string;
  partnerId: string;
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export const onRequest: PagesFunction<{ COUPLE_KV: KVNamespace }> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Check connectivity check
  if (request.method === 'GET' && url.searchParams.has('check')) {
    return json({
      status: 'ok',
      mode: 'cloudflare',
      kvReady: !!env.COUPLE_KV,
    });
  }

  if (!env.COUPLE_KV) {
    return json({ error: 'Cloudflare Pages 尚未綁定 COUPLE_KV，請在 Pages 專案設定中新增 KV namespace binding。' }, { status: 503 });
  }

  if (request.method === 'GET' && url.searchParams.has('status')) {
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return json({ error: 'Missing userId' }, { status: 400 });
    }

    const mappingRaw = await env.COUPLE_KV.get(`user_couple:${userId}`);
    const mapping = mappingRaw ? JSON.parse(mappingRaw) as CoupleMapping : null;
    return json({
      paired: !!mapping,
      coupleId: mapping?.coupleId || '',
      partnerId: mapping?.partnerId || '',
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { action, userId, code } = await request.json() as PairRequestBody;

    if (action === 'create') {
      if (!userId) {
        return json({ error: 'Missing userId' }, { status: 400 });
      }

      // Create a 6-digit pair code
      const pairCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save code -> userId in KV for 30 minutes
      await env.COUPLE_KV.put(`code:${pairCode}`, JSON.stringify({ userId }), { expirationTtl: 1800 });
      
      return json({ pairCode });
    }

    if (action === 'join') {
      if (!userId || !code) {
        return json({ error: 'Missing userId or code' }, { status: 400 });
      }

      // Find partner ID from code
      const codeRaw = await env.COUPLE_KV.get(`code:${code}`);
      const codeRecord = codeRaw
        ? JSON.parse(codeRaw) as PairCodeRecord
        : null;
      const partnerId = codeRecord?.userId;
      
      if (!partnerId) {
        return json({ error: '配對碼已過期或不存在' }, { status: 400 });
      }

      if (partnerId === userId) {
        return json({ error: '您不能與自己進行配對' }, { status: 400 });
      }

      // Pair successfully, create a unique coupleId
      const coupleId = `couple_${partnerId}_${userId}`;
      
      // Save pairing mappings
      await env.COUPLE_KV.put(`user_couple:${userId}`, JSON.stringify({ coupleId, partnerId }));
      await env.COUPLE_KV.put(`user_couple:${partnerId}`, JSON.stringify({ coupleId, partnerId: userId }));
      
      // Clean up the code
      await env.COUPLE_KV.delete(`code:${code}`);

      return json({ coupleId });
    }

    return json({ error: 'Invalid Action' }, { status: 400 });
  } catch (error: unknown) {
    return json({ error: getErrorMessage(error) }, { status: 500 });
  }
};
