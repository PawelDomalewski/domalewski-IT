const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.static('public'));

// prosta baza w pamięci (na produkcji: DB + TTL + auth)
const reports = new Map();

app.post('/api/reports', (req, res) => {
  const id = crypto.randomUUID().slice(0, 10);

  const safe = {
    createdAt: new Date().toISOString(),
    dateFilter: req.body?.dateFilter ?? { from: null, to: null },
    aggregatedData: req.body?.aggregatedData ?? null,
    chartsData: req.body?.chartsData ?? null
  };

  reports.set(id, safe);

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
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});


app.listen(3000, () => console.log('Server: http://localhost:3000'));
