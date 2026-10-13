module.exports = function validate(env) {
  const origin = new URL(env.NEXT_PUBLIC_WP_ORIGIN || '');
  const api = new URL(env.NEXT_PUBLIC_WP_API_URL || '');
  if (origin.username || origin.password || api.username || api.password ||
      origin.search || origin.hash || api.search || api.hash ||
      origin.pathname !== '/' || api.origin !== origin.origin ||
      api.pathname.replace(/\/+$/, '') !== '/wp-json/wp/v2') {
    throw new Error('Configuration WordPress incohérente : origine seule et API /wp-json/wp/v2 sur le même domaine, sans identifiants.');
  }
  if (env.STATIC_EXPORT_TARGET !== 'local') {
    if (origin.protocol !== 'https:' || origin.hostname !== 'backoffice.2dayna2day.com') {
      throw new Error('Production : NEXT_PUBLIC_WP_ORIGIN doit être https://backoffice.2dayna2day.com.');
    }
    if (env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('Validation TLS obligatoire en production.');
  }
};
