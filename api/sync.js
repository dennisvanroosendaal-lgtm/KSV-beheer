// api/sync.js — Vercel serverless proxy voor JSONBin.io
// De API-sleutel staat NOOIT in de frontend-code, maar in Vercel Environment Variables:
//   JSONBIN_API_KEY  = jouw JSONBin Master/Access Key
//   JSONBIN_BIN_ID   = jouw JSONBin Bin ID
//
// Instellen via: Vercel Dashboard → Project → Settings → Environment Variables

const BIN_URL = 'https://api.jsonbin.io/v3/b/' + process.env.JSONBIN_BIN_ID;
const MAX_PAYLOAD_BYTES = 500 * 1024; // 500 KB

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Fail closed: als KSV_TOKEN niet geconfigureerd is, weiger altijd toegang
  var expected = process.env.KSV_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'Server niet geconfigureerd' });
  }

  // Token-validatie: X-KSV-Token header moet overeenkomen met KSV_TOKEN
  var received = req.headers['x-ksv-token'] || '';
  if (received !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var headers = {
    'X-Master-Key': process.env.JSONBIN_API_KEY
  };

  var fetchOptions = { method: req.method, headers: headers };

  if (req.method === 'PUT') {
    var bodyStr = JSON.stringify(req.body);
    // Grootte-controle: voorkom te grote payloads
    if (bodyStr.length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({ error: 'Payload te groot' });
    }
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = bodyStr;
  }

  try {
    var response = await fetch(BIN_URL, fetchOptions);
    var text = await response.text();

    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).send(text);
  } catch (err) {
    console.error('[KSV sync] upstream error:', err.message);
    return res.status(502).json({ error: 'Upstream niet bereikbaar' });
  }
};
