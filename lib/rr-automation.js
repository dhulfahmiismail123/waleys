import { Impit } from 'impit';

const impit = new Impit({ browser: 'chrome' });

const url = 'https://example.com';

const run = async () => {
  const res = await impit.fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
      'Authorization': 'Bearer your_token_here'
    }
  });

  console.log('Status:', res.status);
  console.log('Body:', await res.text());
};

run();