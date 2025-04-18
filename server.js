// server.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const APP_TOKEN = process.env.APP_TOKEN;
const APP_SECRET = process.env.APP_SECRET;

function generateSignature(ts, body) {
  const stringToSign = ts + body;
  return crypto.createHmac('sha256', APP_SECRET).update(stringToSign).digest('hex');
}

app.post('/sumsub-token', async (req, res) => {
  const userId = req.body.userId; // lo manda Flutter
  const levelName = 'id-only';
  const ttlInSecs = 600;

  const url = 'https://api.sumsub.com/resources/accessTokens/sdk';
  //const url = 'https://api.sandbox.sumsub.com/resources/accessTokens/sdk';
  const ts = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ ttlInSecs, userId, levelName });
  const signature = generateSignature(ts, body);

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': APP_TOKEN,
        'X-App-Access-Ts': ts,
        'X-App-Access-Sig': signature,
      }
    });
  
    console.log('Respuesta completa:', response.data);
  
    if (response.data && response.data.token) {
      res.json({ token: response.data.token }); // Todo bien
    } else {
      res.status(500).json({ error: 'No se encontró el token en la respuesta de Sumsub.' });
    }
  
  } catch (error) {
    console.error('Error al obtener el token de Sumsub:', error.message);
    if (error.response) {
      console.error('Respuesta de error de Sumsub:', error.response.data);
      res.status(500).json({ error: error.response.data });
    } else {
      res.status(500).json({ error: 'Error desconocido al contactar Sumsub.' });
    }
  }  
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
