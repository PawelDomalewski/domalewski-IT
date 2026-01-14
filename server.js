import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // dopasuj limit

// prosta baza w pamięci (na produkcji: DB + TTL + auth)
const reports = new Map();

app.post('/api/reports', (req, res) => {
  const id = nanoid(10);
  reports.set(id, req.body);

  // link do strony, która umie wyrenderować raport
  // Na start możesz zrobić osobny endpoint GET i otwierać JSON w przeglądarce
  const url = `${req.protocol}://${req.get('host')}/r/${id}`;
  res.json({ id, url });
});

app.get('/api/reports/:id', (req, res) => {
  const data = reports.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// bardzo prosta strona „podglądu”
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
