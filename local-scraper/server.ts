import express from 'express';
import cors from 'cors';
import scraperRouter from './scraper.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/scraper', scraperRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Local scraper running on http://localhost:${PORT}`);
});
