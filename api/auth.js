// api/auth.js — Vercel serverless auth endpoint
// Valideert het wachtwoord server-side en retourneert de sync-token.
// Het wachtwoord staat NOOIT meer in de frontend-code.
//
// Vercel Environment Variables vereist:
//   KSV_PASSWORD  = het inlogwachtwoord (alleen server-side — NOOIT in frontend-code)
//   KSV_TOKEN     = de sync API-token (wordt teruggegeven bij succesvolle auth)
//
// Instellen via: Vercel Dashboard → Project → Settings → Environment Variables

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var expected = process.env.KSV_PASSWORD;
  var submitted = (req.body && req.body.password) || '';

  if (!expected) {
    // Omgevingsvariabele niet geconfigureerd — weiger toegang
    return res.status(500).json({ error: 'Server niet geconfigureerd' });
  }

  if (submitted !== expected) {
    // Uniforme vertraging om timing-aanvallen te beperken
    await new Promise(function(r){ setTimeout(r, 300); });
    return res.status(401).json({ error: 'Onjuist wachtwoord' });
  }

  // Retourneer de KSV_TOKEN — dit is wat api/sync.js valideert
  return res.status(200).json({ token: process.env.KSV_TOKEN });
};
