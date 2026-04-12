// api/sync.js — Vercel serverless proxy voor JSONBin.io
// De API-sleutel staat NOOIT in de frontend-code, maar in Vercel Environment Variables:
//   JSONBIN_API_KEY  = jouw JSONBin Master/Access Key
//   JSONBIN_BIN_ID   = jouw JSONBin Bin ID
//
// Instellen via: Vercel Dashboard → Project → Settings → Environment Variables

const BIN_URL = 'https://api.jsonbin.io/v3/b/' + process.env.JSONBIN_BIN_ID;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Token-validatie: KSV_TOKEN in Vercel Environment Variables moet overeenkomen
  // met het token dat de browser meestuurt als X-KSV-Token header.
  var expected = process.env.KSV_TOKEN;
  var received  = req.headers['x-ksv-token'] || '';
  if (expected && received !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var headers = {
    'X-Master-Key': process.env.JSONBIN_API_KEY
  };

  var fetchOptions = { method: req.method, headers: headers };

  if (req.method === 'PUT') {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    var response = await fetch(BIN_URL, fetchOptions);
    var text = await response.text();

    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).send(text);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fout: ' + err.message });
  }
};
