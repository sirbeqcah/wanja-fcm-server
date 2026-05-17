require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

let serviceAccount;
if (process.env.SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Wanja FCM server is running'));

app.post('/notify', async (req, res) => {
  const { token, title, body, urgent } = req.body;
  if (!token || !title) return res.status(400).json({ error: 'Missing token or title' });
  const vibrate = urgent ? [1000,200,1000,200,1000,200,1000,200,1000] : [600,200,600,200,600];
  try {
    const result = await admin.messaging().send({
      token,
      notification: { title, body: body || '' },
      webpush: {
        notification: { title, body: body||'', icon:'/icon-192.png', tag:'wanja-queue', renotify:true, requireInteraction:urgent||false, vibrate },
        data: { urgent: String(urgent||false) },
        fcm_options: { link: '/' }
      },
      android: { priority: urgent?'high':'normal', notification: { sound:'default', channelId:'wanja_queue' } }
    });
    console.log(`Push sent: "${title}"`);
    res.json({ success: true, messageId: result });
  } catch (err) {
    console.error('FCM error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      fetch(process.env.RENDER_EXTERNAL_URL)
        .then(() => console.log('Keep-alive ping sent'))
        .catch(err => console.warn('Keep-alive failed:', err.message));
    }, 10 * 60 * 1000);
  }
});
