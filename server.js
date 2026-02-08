const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Armazenamento em memória (substitua por banco de dados em produção)
let roteirosStorage = [];
let webhookLogs = [];

// ============== ENDPOINTS ==============

// 1. Endpoint de saúde da API
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    totalRoteiros: roteirosStorage.length,
    totalWebhooks: webhookLogs.length
  });
});

// 2. Receber dados do webhook (POST)
app.post('/webhook/roteiros', (req, res) => {
  try {
    const data = req.body;
    
    // Log da requisição
    const webhookLog = {
      id: webhookLogs.length + 1,
      timestamp: new Date().toISOString(),
      data: data,
      headers: req.headers
    };
    webhookLogs.push(webhookLog);
    
    // Processar dados recebidos
    if (Array.isArray(data)) {
      // Se receber um array diretamente
      data.forEach(roteiro => {
        roteirosStorage.push({
          ...roteiro,
          receivedAt: new Date().toISOString(),
          webhookId: webhookLog.id
        });
      });
    } else if (data.roteiros && Array.isArray(data.roteiros)) {
      // Se receber um objeto com propriedade roteiros
      data.roteiros.forEach(roteiro => {
        roteirosStorage.push({
          ...roteiro,
          receivedAt: new Date().toISOString(),
          webhookId: webhookLog.id,
          status: data.status
        });
      });
    } else {
      // Se receber um único objeto
      roteirosStorage.push({
        ...data,
        receivedAt: new Date().toISOString(),
        webhookId: webhookLog.id
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Dados recebidos com sucesso',
      webhookId: webhookLog.id,
      roteirosRecebidos: Array.isArray(data) ? data.length : (data.roteiros?.length || 1)
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar dados',
      error: error.message
    });
  }
});

// 3. Listar todos os roteiros
app.get('/api/roteiros', (req, res) => {
  const { limit, offset, index } = req.query;
  
  let result = [...roteirosStorage];
  
  // Filtrar por index se especificado
  if (index) {
    result = result.filter(r => r.index == index);
  }
  
  // Paginação
  const total = result.length;
  const skip = parseInt(offset) || 0;
  const take = parseInt(limit) || total;
  
  result = result.slice(skip, skip + take);
  
  res.json({
    success: true,
    total: total,
    count: result.length,
    offset: skip,
    limit: take,
    data: result
  });
});

// 4. Buscar roteiro específico por index
app.get('/api/roteiros/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const roteiro = roteirosStorage.find(r => r.index === index);
  
  if (roteiro) {
    res.json({
      success: true,
      data: roteiro
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Roteiro com index ${index} não encontrado`
    });
  }
});

// 5. Buscar roteiros por público-alvo
app.get('/api/roteiros/publico/:termo', (req, res) => {
  const termo = req.params.termo.toLowerCase();
  
  const roteiros = roteirosStorage.filter(r => 
    r.publico_target && r.publico_target.toLowerCase().includes(termo)
  );
  
  res.json({
    success: true,
    total: roteiros.length,
    data: roteiros
  });
});

// 6. Listar logs de webhooks recebidos
app.get('/api/webhooks/logs', (req, res) => {
  const { limit } = req.query;
  const take = parseInt(limit) || webhookLogs.length;
  
  res.json({
    success: true,
    total: webhookLogs.length,
    data: webhookLogs.slice(-take)
  });
});

// 7. Buscar log de webhook específico
app.get('/api/webhooks/logs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const log = webhookLogs.find(l => l.id === id);
  
  if (log) {
    res.json({
      success: true,
      data: log
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Log de webhook ${id} não encontrado`
    });
  }
});

// 8. Estatísticas
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalRoteiros: roteirosStorage.length,
      totalWebhooks: webhookLogs.length,
      roteirosUnicos: [...new Set(roteirosStorage.map(r => r.index))].length,
      ultimoWebhook: webhookLogs.length > 0 ? webhookLogs[webhookLogs.length - 1].timestamp : null
    }
  });
});

// 9. Limpar dados (útil para testes)
app.delete('/api/clear', (req, res) => {
  const roteirosCount = roteirosStorage.length;
  const webhooksCount = webhookLogs.length;
  
  roteirosStorage = [];
  webhookLogs = [];
  
  res.json({
    success: true,
    message: 'Dados limpos com sucesso',
    removidos: {
      roteiros: roteirosCount,
      webhooks: webhooksCount
    }
  });
});

// Rota raiz com documentação
app.get('/', (req, res) => {
  res.json({
    name: 'API de Roteiros',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      webhook: 'POST /webhook/roteiros',
      listarRoteiros: 'GET /api/roteiros?limit=10&offset=0&index=1',
      buscarRoteiro: 'GET /api/roteiros/:index',
      buscarPorPublico: 'GET /api/roteiros/publico/:termo',
      webhookLogs: 'GET /api/webhooks/logs?limit=10',
      webhookLog: 'GET /api/webhooks/logs/:id',
      estatisticas: 'GET /api/stats',
      limparDados: 'DELETE /api/clear'
    }
  });
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🪝 Webhook endpoint: http://localhost:${PORT}/webhook/roteiros`);
});
