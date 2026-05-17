require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

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

app.listen(3000, () => console.log('🚀 Server running on port 3000'));
