const express = require('express');
const cors = require('cors');
const crypto = require('crypto');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static('public'));

// prosta baza w pamięci (na produkcji: DB + TTL + auth)
const reports = new Map();

app.post('/api/reports', (req, res) => {
  const id = crypto.randomUUID().slice(0, 10);
  reports.set(id, req.body);

  const url = `${req.protocol}://${req.get('host')}/r/${id}`;
  res.json({ id, url });
});

app.get('/api/reports/:id', (req, res) => {
  const data = reports.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// prosty podgląd JSON (na start)
app.get('/r/:id', (req, res) => {
  res.type('html').send(`
    <h3>Raport: ${req.params.id}</h3>
    <pre id="out">Ładowanie...</pre>
    <script>
      fetch('/api/reports/${req.params.id}')
        .then(r => r.json())
        .then(d => document.getElementById('out').textContent = JSON.stringify(d, null, 2))
        .catch(e => document.getElementById('out').textContent = e.message);
    </script>
  `);
});

app.listen(3000, () => console.log('Server: http://localhost:3000'));
