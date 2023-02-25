const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <form action="/" method="post">
      <textarea name="proxies" rows="10" cols="30" placeholder="Enter proxies in the format 'ip:port:login:password' separated by a new line"></textarea>
      <button type="submit">Check</button>
    </form>
  `);
});

app.post('/', (req, res) => {
  const proxies = req.body.proxies.split('\n');

  const results = proxies.map(proxy => {
    const [ip, port, login, password] = proxy.split(':');
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve({ proxy, status: 'Invalid' });
      }, 10000);

      request({
        url: 'http://www.google.com',
        proxy: proxyUrl
      }, (error, response) => {
        clearTimeout(timeoutId);
        if (error) {
          resolve({ proxy, status: 'Invalid' });
        } else {
          resolve({ proxy, status: 'Valid' });
        }
      });
    });
  });

  Promise.all(results)
    .then(result => {
      const validProxies = result.filter(r => r.status === 'Valid');
      const invalidProxies = result.filter(r => r.status === 'Invalid');
      if (!validProxies.length) {
        res.send('No valid proxies found.');
        return;
      }
      const fileName = `results-${Math.random().toString(36).substring(2, 15)}.txt`;
      const proxyStatuses = validProxies.map(r => r.proxy + '\n').join('');
      fs.writeFileSync(fileName, proxyStatuses);
      const proxyStatusesHtml = validProxies.concat(invalidProxies).map(r => `
        <tr>
          <td>${r.proxy}</td>
          <td>${r.status}</td>
        </tr>
      `).join('');
      res.send(`
  <div class="center">
    <div>
      Результат Проверки:
      <div>Валидные Прокси: ${validProxies.length}</div>
      <div>Невалидные Прокси: ${invalidProxies.length}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Proxy</th>
          <th>Status</th>
        </tr
</thead>
      <tbody>
        ${proxyStatusesHtml}
      </tbody>
    </table>
  </div>
`);
});
});
app.listen(3000, () => {
console.log('Server started on port 3000');
});
