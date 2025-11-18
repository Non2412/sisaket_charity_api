const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  // updated to match default dev port
  port: 10000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log('BODY:', body); process.exit(0); });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(2);
});

req.end();
