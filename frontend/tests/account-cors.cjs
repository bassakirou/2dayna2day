// Verify the real local backend preflight, which mocked API tests cannot cover.
const https = require('https');
const assert = require('node:assert/strict');
const origin = 'http://localhost:3045';
const request = https.request('https://2dayna2day.test/wp-json/2day/v1/account/payment-methods', {
  method: 'OPTIONS',
  rejectUnauthorized: false, // Local .test development certificate.
  headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type' },
}, response => {
  try {
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['access-control-allow-origin'], origin);
    const methods = response.headers['access-control-allow-methods'].split(',').map(method => method.trim());
    for (const method of ['PUT', 'PATCH', 'DELETE']) assert(methods.includes(method), `${method} is blocked by CORS`);
    const headers = response.headers['access-control-allow-headers'].toLowerCase();
    assert(headers.includes('authorization') && headers.includes('content-type'));
    console.log('Real account CORS preflight passed: PUT, PATCH, DELETE and auth headers allowed.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  response.resume();
});
request.setTimeout(10000, () => request.destroy(new Error('CORS preflight timed out')));
request.on('error', error => { console.error(error.message); process.exitCode = 1; });
request.end();
