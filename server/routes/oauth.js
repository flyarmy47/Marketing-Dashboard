import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../db.js';

const router = Router();

// Google Ads OAuth start
router.get('/google-ads/start', authenticate, (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL}/api/oauth/google-ads/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
    state: req.tenantId,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Google Ads OAuth callback
router.get('/google-ads/callback', async (req, res) => {
  const { code, state: tenantId } = req.query;
  const appUrl = process.env.APP_URL;

  if (!code || !tenantId) {
    return res.redirect(`${appUrl}/oauth/callback?status=error&error=Missing+code+or+state`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/oauth/google-ads/callback`,
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || 'Token exchange failed');

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.connection.upsert({
      where: { tenantId_platform: { tenantId, platform: 'google_ads' } },
      create: {
        tenantId,
        platform: 'google_ads',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
      },
    });

    res.redirect(`${appUrl}/oauth/callback?status=success`);
  } catch (err) {
    res.redirect(`${appUrl}/oauth/callback?status=error&error=${encodeURIComponent(err.message)}`);
  }
});

// Meta Ads OAuth start
router.get('/meta-ads/start', authenticate, (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.META_ADS_APP_ID,
    redirect_uri: `${process.env.APP_URL}/api/oauth/meta-ads/callback`,
    scope: 'ads_read,ads_management',
    response_type: 'code',
    state: req.tenantId,
  });
  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
});

// Meta Ads OAuth callback
router.get('/meta-ads/callback', async (req, res) => {
  const { code, state: tenantId } = req.query;
  const appUrl = process.env.APP_URL;

  if (!code || !tenantId) {
    return res.redirect(`${appUrl}/oauth/callback?status=error&error=Missing+code+or+state`);
  }

  try {
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', process.env.META_ADS_APP_ID);
    tokenUrl.searchParams.set('client_secret', process.env.META_ADS_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', `${appUrl}/api/oauth/meta-ads/callback`);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl);
    const shortLivedTokens = await tokenResponse.json();
    if (shortLivedTokens.error) throw new Error(shortLivedTokens.error.message);

    // Exchange for long-lived token
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', process.env.META_ADS_APP_ID);
    longLivedUrl.searchParams.set('client_secret', process.env.META_ADS_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedTokens.access_token);

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedTokens = await longLivedResponse.json();

    const accessToken = longLivedTokens.access_token || shortLivedTokens.access_token;
    const expiresIn = longLivedTokens.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.connection.upsert({
      where: { tenantId_platform: { tenantId, platform: 'meta_ads' } },
      create: {
        tenantId,
        platform: 'meta_ads',
        accessToken,
        tokenExpiresAt: expiresAt,
      },
      update: {
        accessToken,
        tokenExpiresAt: expiresAt,
      },
    });

    res.redirect(`${appUrl}/oauth/callback?status=success`);
  } catch (err) {
    res.redirect(`${appUrl}/oauth/callback?status=error&error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
