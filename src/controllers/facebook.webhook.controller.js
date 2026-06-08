export const verifyFacebookWebhook = (req, res) => {
    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'afsana_fb_token';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Facebook Webhook] Verified');
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
    return res.status(400).send('Bad Request');
};

export const handleFacebookEvent = async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        body.entry.forEach(entry => {
            const webhookEvent = entry.messaging?.[0];
            if (webhookEvent) {
                console.log('[Facebook Webhook] Event received:', webhookEvent);
            }
            // TODO: Process lead ads or messenger text and pass to OpenAI
        });
        return res.status(200).send('EVENT_RECEIVED');
    }
    return res.sendStatus(404);
};
