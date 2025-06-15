require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Configurações
const PORT = process.env.PORT || 3001;
const TUYA_CONFIG = {
  clientId: process.env.TUYA_CLIENT_ID,
  secret: process.env.TUYA_CLIENT_SECRET,
  baseUrl: process.env.TUYA_BASE_URL || 'https://openapi.tuyaeu.com'
};

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.post('/api/auth', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    
    const response = await axios.get(`${TUYA_CONFIG.baseUrl}/v1.0/token?grant_type=1`, {
      headers: {
        'client_id': clientId,
        'secret': clientSecret
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: error.response?.data?.msg || error.message 
    });
  }
});

app.get('/api/device/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { access_token } = req.headers;
    
    const response = await axios.get(
      `${TUYA_CONFIG.baseUrl}/v1.0/devices/${id}/status`,
      {
        headers: {
          'client_id': TUYA_CONFIG.clientId,
          'access_token': access_token
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: error.response?.data?.msg || error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});