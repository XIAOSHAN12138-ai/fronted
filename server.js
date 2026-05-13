// ============================================================
// 模拟 API 服务器 - 用于前端开发测试
// 启动方式: node server.js
// 访问地址: http://localhost:8003
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8003;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 内存存储任务
const tasks = new Map();

// 发送 JSON 响应
function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload), 'utf-8');
}

// 解析请求体
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// 创建模拟任务
function createTask(type, data) {
  const task_id = `task_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const task = {
    task_id,
    type,
    status: 'processing',
    progress: 0,
    result: {},
    created_at: new Date().toISOString(),
    completed_at: null
  };
  tasks.set(task_id, task);

  // 模拟异步处理：2秒后完成
  setTimeout(() => {
    task.status = 'completed';
    task.progress = 100;
    task.completed_at = new Date().toISOString();

    if (type === 'image') {
      task.result = {
        images: [
          { id: `${task_id}_1`, url: 'https://picsum.photos/seed/' + task_id + '/400/400' },
          { id: `${task_id}_2`, url: 'https://picsum.photos/seed/' + task_id + '/401/400' },
          { id: `${task_id}_3`, url: 'https://picsum.photos/seed/' + task_id + '/402/400' }
        ]
      };
    } else if (type === 'video') {
      task.result = {
        video: {
          id: `${task_id}_video`,
          url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          duration: data.duration || 4
        }
      };
    } else if (type === 'voiceover') {
      task.result = {
        audio: {
          id: `${task_id}_audio`,
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        }
      };
    } else {
      task.result = {
        message: '已完成，当前为模拟 API 返回。'
      };
    }
  }, 2000);

  return task;
}

// 模型数据
const modelsData = {
  code: 200,
  data: {
    image_models: [
      { id: 'image_5.0_lite', name: '图片 5.0 Lite', description: '指令响应更精准，生成效果更智能', is_new: true, is_vip: false },
      { id: 'image_4.6', name: '图片 4.6', description: '人像一致性保持更好，性价比更高', is_new: true, is_vip: false },
      { id: 'image_4.5', name: '图片 4.5', description: '强化一致性、风格与图文响应', is_new: false, is_vip: false },
      { id: 'image_4.1', name: '图片 4.1', description: '更专业的创意、美学和一致性保持', is_new: false, is_vip: false },
      { id: 'image_4.0', name: '图片 4.0', description: '支持多参考图、系列组图生成', is_new: false, is_vip: false }
    ],
    video_models: [
      { id: 'seedance_2.0_fast_vip', name: 'Seedance 2.0 Fast VIP', description: '极速推理，会员专属通道，音视文图均可参考', is_new: true, is_vip: true },
      { id: 'seedance_2.0_vip', name: 'Seedance 2.0 VIP', description: '全模态能力，会员专属通道，音视文图均可参考', is_new: true, is_vip: true },
      { id: 'seedance_2.0_fast', name: 'Seedance 2.0 Fast', description: '高性价比，音视文图均可参考', is_new: true, is_vip: false },
      { id: 'seedance_2.0', name: 'Seedance 2.0', description: '全能王者，音视文图均可参考', is_new: true, is_vip: false, free_trial: true }
    ],
    voices: [
      { id: 'voice_001', name: '温柔女声', gender: 'female', preview_url: 'https://cdn.example.com/voice_preview_001.mp3' },
      { id: 'voice_002', name: '磁性男声', gender: 'male', preview_url: 'https://cdn.example.com/voice_preview_002.mp3' }
    ]
  }
};

// 创建服务器
const server = http.createServer(async (req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

  // 处理 API 请求
  if (req.url.startsWith('/api/v1')) {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    try {
      // GET /api/v1/models - 获取模型列表（支持查询参数：type, ratio, resolution）
      if (req.method === 'GET' && req.url.startsWith('/api/v1/models')) {
        const urlObj = new URL(req.url, `http://localhost:${PORT}`);
        const queryType = urlObj.searchParams.get('type') || '';
        const queryRatio = urlObj.searchParams.get('ratio') || '';
        const queryRes = urlObj.searchParams.get('resolution') || '';
        console.log(`✅ 返回模型列表 (type=${queryType}, ratio=${queryRatio}, resolution=${queryRes})`);
        sendJson(res, 200, modelsData);
        return;
      }

      // POST /api/v1/generate/image - 图片生成
      if (req.method === 'POST' && req.url === '/api/v1/generate/image') {
        const body = await parseRequestBody(req);
        console.log('🖼️ 图片生成请求:', body);
        const task = createTask('image', body);
        sendJson(res, 200, {
          code: 200,
          message: '生成任务已创建',
          data: { task_id: task.task_id, status: task.status }
        });
        return;
      }

      // POST /api/v1/generate/video/text-to-video - 文生视频
      if (req.method === 'POST' && req.url === '/api/v1/generate/video/text-to-video') {
        const body = await parseRequestBody(req);
        console.log('🎬 文生视频请求:', body);
        const task = createTask('video', body);
        sendJson(res, 200, {
          code: 200,
          message: '生成任务已创建',
          data: { task_id: task.task_id, status: task.status }
        });
        return;
      }

      // POST /api/v1/generate/agent - Agent模式
      if (req.method === 'POST' && req.url === '/api/v1/generate/agent') {
        const body = await parseRequestBody(req);
        console.log('🤖 Agent请求:', body);
        const task = createTask(body.type === 'video' ? 'video' : 'image', body);
        sendJson(res, 200, {
          code: 200,
          message: '生成任务已创建',
          data: { task_id: task.task_id, status: task.status }
        });
        return;
      }

      // POST /api/v1/generate/voiceover - 配音生成
      if (req.method === 'POST' && req.url === '/api/v1/generate/voiceover') {
        const body = await parseRequestBody(req);
        console.log('🎤 配音请求:', body);
        const task = createTask('voiceover', body);
        sendJson(res, 200, {
          code: 200,
          message: '生成任务已创建',
          data: { task_id: task.task_id, status: task.status }
        });
        return;
      }

      // POST /api/v1/generate/digital-human - 数字人生成
      if (req.method === 'POST' && req.url === '/api/v1/generate/digital-human') {
        const body = await parseRequestBody(req);
        console.log('👤 数字人请求:', body);
        const task = createTask('digital-human', body);
        sendJson(res, 200, {
          code: 200,
          message: '生成任务已创建',
          data: { task_id: task.task_id, status: task.status }
        });
        return;
      }

      // GET /api/v1/generate/task/{task_id} - 查询任务状态
      const taskMatch = req.url.match(/^\/api\/v1\/generate\/task\/(.+)$/);
      if (req.method === 'GET' && taskMatch) {
        const taskId = taskMatch[1];
        const task = tasks.get(taskId);
        if (!task) {
          sendJson(res, 404, { code: 404, message: '任务不存在', data: null });
          return;
        }
        console.log(`📊 查询任务 ${taskId}: ${task.status}`);
        sendJson(res, 200, { code: 200, message: '查询成功', data: task });
        return;
      }

      // 未匹配的 API 路由
      sendJson(res, 404, { code: 404, message: 'API 接口未找到' });
    } catch (err) {
      console.error('❌ 服务器错误:', err);
      sendJson(res, 500, { code: 500, message: '服务器内部错误: ' + err.message });
    }
    return;
  }

  // 处理静态文件请求
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      // 禁止缓存 JS 和 CSS 文件，方便开发调试
      const cacheHeaders = {};
      if (extname === '.js' || extname === '.css') {
        cacheHeaders['Cache-Control'] = 'no-store, no-cache, must-revalidate';
        cacheHeaders['Pragma'] = 'no-cache';
        cacheHeaders['Expires'] = '0';
      }
      res.writeHead(200, { 'Content-Type': contentType, ...cacheHeaders });
      res.end(content, 'utf-8');
    }
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 模拟 API 服务器已启动!');
  console.log('========================================');
  console.log(`📍 地址: http://localhost:${PORT}/`);
  console.log('');
  console.log('📄 可用页面:');
  console.log(`   - 首页:     http://localhost:${PORT}/index.html`);
  console.log(`   - 登录页:   http://localhost:${PORT}/pc_login.html`);
  console.log(`   - 生成页:   http://localhost:${PORT}/pc_generate.html`);
  console.log(`   - 资产页:   http://localhost:${PORT}/pc_assets.html`);
  console.log(`   - 社区页:   http://localhost:${PORT}/pc_community.html`);
  console.log('');
  console.log('🔌 可用 API:');
  console.log('   - GET  /api/v1/models              获取模型列表');
  console.log('   - POST /api/v1/generate/image      图片生成');
  console.log('   - POST /api/v1/generate/video/text-to-video  文生视频');
  console.log('   - POST /api/v1/generate/digital-human  数字人生成');
  console.log('   - POST /api/v1/generate/voiceover  配音生成');
  console.log('   - POST /api/v1/generate/agent      Agent模式');
  console.log('   - GET  /api/v1/generate/task/{id}  查询任务状态');
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('========================================');
});
