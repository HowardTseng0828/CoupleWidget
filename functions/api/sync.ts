interface SyncRequestBody {
  userId?: string;
  coupleId?: string;
  userState?: unknown;
  anniversaryDate?: string;
  bgIndex?: number;
}

interface CoupleMapping {
  partnerId: string;
}

interface CoupleSettings {
  anniversaryDate?: string;
  bgIndex?: number;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export const onRequest: PagesFunction<{ COUPLE_KV: KVNamespace }> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { userId, coupleId, userState, anniversaryDate, bgIndex } =
      await request.json() as SyncRequestBody;

    if (!userId || !coupleId) {
      return new Response(JSON.stringify({ error: 'Missing userId or coupleId' }), { status: 400 });
    }

    // 1. Save user state to KV (expires in 7 days of inactivity to keep storage clean)
    await env.COUPLE_KV.put(`state:${coupleId}:${userId}`, JSON.stringify(userState), { expirationTtl: 604800 });

    // 2. Fetch partner mapping to find partnerId
    const mappingRaw = await env.COUPLE_KV.get(`user_couple:${userId}`);
    if (!mappingRaw) {
      return new Response(JSON.stringify({ error: 'Pairing record not found' }), { status: 404 });
    }
    const { partnerId } = JSON.parse(mappingRaw) as CoupleMapping;

    // 3. Read partner state from KV
    const partnerStateRaw = await env.COUPLE_KV.get(`state:${coupleId}:${partnerId}`);
    const partnerState = partnerStateRaw ? JSON.parse(partnerStateRaw) : null;

    // 4. Handle shared couple configurations (anniversary date, bgIndex)
    // Read existing couple settings first
    const coupleSettingsRaw = await env.COUPLE_KV.get(`settings:${coupleId}`);
    const coupleSettings: CoupleSettings = coupleSettingsRaw
      ? JSON.parse(coupleSettingsRaw) as CoupleSettings
      : { anniversaryDate, bgIndex };

    // If request contains changes, update the shared settings
    let changed = false;
    if (anniversaryDate && anniversaryDate !== coupleSettings.anniversaryDate) {
      coupleSettings.anniversaryDate = anniversaryDate;
      changed = true;
    }
    if (bgIndex !== undefined && bgIndex !== coupleSettings.bgIndex) {
      coupleSettings.bgIndex = bgIndex;
      changed = true;
    }

    if (changed || !coupleSettingsRaw) {
      await env.COUPLE_KV.put(`settings:${coupleId}`, JSON.stringify(coupleSettings));
    }

    return new Response(
      JSON.stringify({
        anniversaryDate: coupleSettings.anniversaryDate,
        bgIndex: coupleSettings.bgIndex,
        partnerState: partnerState,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
