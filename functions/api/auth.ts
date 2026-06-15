interface AuthRequestBody {
  email?: string;
  name?: string;
  avatar?: string;
}

interface StoredUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: number;
  updatedAt: number;
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

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export const onRequest: PagesFunction<{ COUPLE_KV: KVNamespace }> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!env.COUPLE_KV) {
    return json({ error: 'Cloudflare Pages 尚未綁定 COUPLE_KV，請在 Pages 專案設定中新增 KV namespace binding。' }, { status: 503 });
  }

  try {
    const { email, name, avatar } = await request.json() as AuthRequestBody;
    const normalizedEmail = email ? normalizeEmail(email) : '';

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return json({ error: '請輸入有效的 Email' }, { status: 400 });
    }

    const now = Date.now();
    const emailKey = `user_email:${normalizedEmail}`;
    let userId = await env.COUPLE_KV.get(emailKey);

    if (!userId) {
      userId = crypto.randomUUID();
      await env.COUPLE_KV.put(emailKey, userId);
    }

    const userKey = `user:${userId}`;
    const existingRaw = await env.COUPLE_KV.get(userKey);
    const existingUser = existingRaw ? JSON.parse(existingRaw) as StoredUser : null;
    const displayName = name?.trim() || existingUser?.name || normalizedEmail.split('@')[0] || '我';
    const userAvatar =
      avatar ||
      existingUser?.avatar ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(normalizedEmail)}`;

    const user: StoredUser = {
      id: userId,
      email: normalizedEmail,
      name: displayName,
      avatar: userAvatar,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };

    await env.COUPLE_KV.put(userKey, JSON.stringify(user));

    const mappingRaw = await env.COUPLE_KV.get(`user_couple:${userId}`);
    const mapping = mappingRaw ? JSON.parse(mappingRaw) as CoupleMapping : null;

    return json({
      user,
      paired: !!mapping,
      coupleId: mapping?.coupleId || '',
      partnerId: mapping?.partnerId || '',
    });
  } catch (error: unknown) {
    return json({ error: getErrorMessage(error) }, { status: 500 });
  }
};
