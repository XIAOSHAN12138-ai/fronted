# 内容生成模块 - 前后端接口对接文档

## 一、基础信息

| 项目 | 说明 |
|------|------|
| 请求格式 | JSON |
| 响应格式 | JSON |
| 认证方式 | JWT Token（Header: `Authorization: Bearer <token>`）|
| 基础路径 | `/api/v1` |

---

## 二、接口列表

### 1. 图片生成

**接口地址：** `POST /api/v1/generate/image`

**请求参数：**

```json
{
  "prompt": "美丽的森林场景，阳光透过树叶",
  "model": "image_5.0_lite",
  "ratio": "1:1",
  "resolution": "2K",
  "count": 4,
  "reference_image": "base64..."
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 提示词描述 |
| model | string | 是 | 模型ID，见模型列表 |
| ratio | string | 是 | 比例：1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 3:2, 2:3 |
| resolution | string | 是 | 分辨率：2K, 4K |
| count | int | 否 | 生成数量，默认4 |
| reference_image | string | 否 | 参考图base64编码 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_123456",
    "status": "processing"
  }
}
```

---

### 2. 视频生成 - 文生视频

**接口地址：** `POST /api/v1/generate/video/text-to-video`

**功能说明：** 通过文字描述生成视频

**请求参数：**

```json
{
  "prompt": "城市夜景视频，霓虹灯闪烁，车流穿梭",
  "model": "seedance_2.0_fast",
  "ratio": "16:9",
  "resolution": "2K",
  "duration": 5
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 视频内容描述提示词 |
| model | string | 是 | 模型ID，见模型列表 |
| ratio | string | 是 | 画幅比例，见视频画幅比例表 |
| resolution | string | 是 | 分辨率，见视频分辨率表 |
| duration | int | 是 | 视频时长(秒)，见视频时长表 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_789012",
    "status": "processing",
    "estimated_time": 120
  }
}
```

---

### 3. 视频生成 - 图生视频

**接口地址：** `POST /api/v1/generate/video/image-to-video`

**功能说明：** 基于一张图片生成视频，图片作为视频的首帧

**请求参数：**

```json
{
  "prompt": "让画面中的云朵缓缓飘动，阳光逐渐洒满整个森林",
  "model": "seedance_2.0_fast",
  "ratio": "16:9",
  "resolution": "2K",
  "duration": 5,
  "image": "base64..."
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 动态效果描述，描述图片如何动起来 |
| model | string | 是 | 模型ID，见模型列表 |
| ratio | string | 是 | 画幅比例，见视频画幅比例表 |
| resolution | string | 是 | 分辨率，见视频分辨率表 |
| duration | int | 是 | 视频时长(秒)，见视频时长表 |
| image | string | 是 | 参考图片base64编码 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_789013",
    "status": "processing",
    "estimated_time": 120
  }
}
```

---

### 4. 视频生成 - 首末帧生成视频

**接口地址：** `POST /api/v1/generate/video/frame-to-video`

**功能说明：** 基于首帧和末帧两张图片生成过渡视频，系统自动生成中间过渡动画

**请求参数：**

```json
{
  "prompt": "平滑过渡，自然衔接",
  "model": "seedance_2.0",
  "ratio": "16:9",
  "resolution": "2K",
  "duration": 5,
  "start_frame": "base64...",
  "end_frame": "base64..."
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 否 | 过渡效果描述，如"平滑过渡"、"快速切换"等 |
| model | string | 是 | 模型ID，见模型列表 |
| ratio | string | 是 | 画幅比例，见视频画幅比例表 |
| resolution | string | 是 | 分辨率，见视频分辨率表 |
| duration | int | 是 | 视频时长(秒)，见视频时长表 |
| start_frame | string | 是 | 首帧图片base64编码 |
| end_frame | string | 是 | 末帧图片base64编码 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_789014",
    "status": "processing",
    "estimated_time": 180
  }
}
```

---

### 5. 数字人生成

**接口地址：** `POST /api/v1/generate/digital-human`

**请求参数：**

```json
{
  "character_image": "base64...",
  "voice_id": "voice_001",
  "speech_content": "你好，欢迎观看本期视频",
  "action_description": "镜头推进，微笑着说"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| character_image | string | 是 | 角色图片base64编码 |
| voice_id | string | 是 | 音色ID，见音色列表 |
| speech_content | string | 是 | 角色说话内容 |
| action_description | string | 否 | 动作描述和镜头语言 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_345678",
    "status": "processing"
  }
}
```

---

### 6. 配音生成

**接口地址：** `POST /api/v1/generate/voiceover`

**请求参数：**

```json
{
  "voice_id": "voice_001",
  "content": "这是需要配音的文字内容",
  "speed": 1.0,
  "pitch": 1.0
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| voice_id | string | 是 | 音色ID，见音色列表 |
| content | string | 是 | 配音文字内容 |
| speed | float | 否 | 语速，默认1.0，范围0.5-2.0 |
| pitch | float | 否 | 音调，默认1.0，范围0.5-2.0 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_567890",
    "status": "processing"
  }
}
```

---

### 7. Agent模式生成

**接口地址：** `POST /api/v1/generate/agent`

**请求参数：**

```json
{
  "prompt": "生成一张风景图",
  "type": "image",
  "model": "image_5.0_lite",
  "ratio": "1:1",
  "resolution": "2K"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 提示词描述 |
| type | string | 是 | 生成类型：image / video |
| model | string | 是 | 模型ID |
| ratio | string | 是 | 比例 |
| resolution | string | 是 | 分辨率 |

**响应示例：**

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_901234",
    "status": "processing"
  }
}
```

---

### 8. 查询生成任务状态

**接口地址：** `GET /api/v1/generate/task/{task_id}`

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务ID |

**响应示例：**

```json
{
  "code": 200,
  "data": {
    "task_id": "task_123456",
    "type": "image",
    "status": "completed",
    "progress": 100,
    "result": {
      "images": [
        {
          "id": "img_001",
          "url": "https://cdn.example.com/img1.png",
          "thumbnail": "https://cdn.example.com/img1_thumb.png"
        },
        {
          "id": "img_002",
          "url": "https://cdn.example.com/img2.png",
          "thumbnail": "https://cdn.example.com/img2_thumb.png"
        }
      ]
    },
    "created_at": "2024-04-24 10:00:00",
    "completed_at": "2024-04-24 10:00:30"
  }
}
```

**视频任务响应示例：**

```json
{
  "code": 200,
  "data": {
    "task_id": "task_789012",
    "type": "video",
    "status": "completed",
    "progress": 100,
    "result": {
      "video": {
        "id": "video_001",
        "url": "https://cdn.example.com/video1.mp4",
        "thumbnail": "https://cdn.example.com/video1_thumb.png",
        "duration": 5
      }
    },
    "created_at": "2024-04-24 10:00:00",
    "completed_at": "2024-04-24 10:02:00"
  }
}
```

**status 状态值说明：**

| 状态 | 说明 |
|------|------|
| pending | 等待处理中 |
| processing | 正在生成中 |
| completed | 生成完成 |
| failed | 生成失败 |

---

### 9. 获取可用模型列表

**接口地址：** `GET /api/v1/models`

**响应示例：**

```json
{
  "code": 200,
  "data": {
    "image_models": [
      {
        "id": "image_5.0_lite",
        "name": "图片 5.0 Lite",
        "description": "指令响应更精准，生成效果更智能",
        "is_new": true,
        "is_vip": false
      },
      {
        "id": "image_4.6",
        "name": "图片 4.6",
        "description": "人像一致性保持更好，性价比更高",
        "is_new": true,
        "is_vip": false
      },
      {
        "id": "image_4.5",
        "name": "图片 4.5",
        "description": "强化一致性、风格与图文响应",
        "is_new": false,
        "is_vip": false
      },
      {
        "id": "image_4.1",
        "name": "图片 4.1",
        "description": "更专业的创意、美学和一致性保持",
        "is_new": false,
        "is_vip": false
      },
      {
        "id": "image_4.0",
        "name": "图片 4.0",
        "description": "支持多参考图、系列组图生成",
        "is_new": false,
        "is_vip": false
      }
    ],
    "video_models": [
      {
        "id": "seedance_2.0_fast_vip",
        "name": "Seedance 2.0 Fast VIP",
        "description": "极速推理，会员专属通道，音视文图均可参考",
        "is_new": true,
        "is_vip": true
      },
      {
        "id": "seedance_2.0_vip",
        "name": "Seedance 2.0 VIP",
        "description": "全模态能力，会员专属通道，音视文图均可参考",
        "is_new": true,
        "is_vip": true
      },
      {
        "id": "seedance_2.0_fast",
        "name": "Seedance 2.0 Fast",
        "description": "高性价比，音视文图均可参考",
        "is_new": true,
        "is_vip": false
      },
      {
        "id": "seedance_2.0",
        "name": "Seedance 2.0",
        "description": "全能王者，音视文图均可参考",
        "is_new": true,
        "is_vip": false,
        "free_trial": true
      }
    ],
    "voices": [
      {
        "id": "voice_001",
        "name": "温柔女声",
        "gender": "female",
        "preview_url": "https://cdn.example.com/voice_preview_001.mp3"
      },
      {
        "id": "voice_002",
        "name": "磁性男声",
        "gender": "male",
        "preview_url": "https://cdn.example.com/voice_preview_002.mp3"
      }
    ]
  }
}
```

---

### 10. 获取用户生成额度

**接口地址：** `GET /api/v1/user/quota`

**响应示例：**

```json
{
  "code": 200,
  "data": {
    "image_quota": 100,
    "video_quota": 10,
    "voice_quota": 50,
    "vip_level": 1,
    "vip_expire_at": "2024-12-31 23:59:59"
  }
}
```

---

## 三、通用响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误描述信息",
  "data": null
}
```

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或Token已过期 |
| 403 | 权限不足或额度不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 四、对接注意事项

### 1. 异步处理机制

- 所有生成接口均为异步处理
- 调用生成接口后返回 `task_id`
- 前端需要轮询 `GET /api/v1/generate/task/{task_id}` 查询任务状态
- 建议轮询间隔：2-3秒

### 2. 文件上传

- 图片/视频建议先压缩再转 base64 编码
- 大文件建议使用单独的文件上传接口获取 URL
- 单个请求体大小建议不超过 10MB

### 3. 超时处理

- HTTP 请求超时建议设置为 30 秒
- 任务查询超时建议设置为 60 秒
- 超时后提示用户稍后在资产列表查看结果

### 4. 跨域配置

后端需要配置 CORS，允许前端域名访问：

```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 5. Token 管理

- 登录成功后保存 Token 到 localStorage
- 每次请求在 Header 中携带 Token
- Token 过期后（401）跳转登录页

---

## 五、前端调用示例

### JavaScript Fetch 示例

```javascript
// 图片生成
async function generateImage(prompt, model, ratio, resolution) {
  const response = await fetch('/api/v1/generate/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      prompt: prompt,
      model: model,
      ratio: ratio,
      resolution: resolution,
      count: 4
    })
  });
  
  return await response.json();
}

// 查询任务状态
async function checkTaskStatus(taskId) {
  const response = await fetch(`/api/v1/generate/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return await response.json();
}

// 轮询直到完成
async function pollTaskResult(taskId, onProgress, onComplete, onError) {
  const poll = async () => {
    const result = await checkTaskStatus(taskId);
    
    if (result.data.status === 'completed') {
      onComplete(result.data);
    } else if (result.data.status === 'failed') {
      onError(result.message);
    } else {
      onProgress(result.data.progress);
      setTimeout(poll, 2000);
    }
  };
  
  await poll();
}

// 使用示例
const task = await generateImage('美丽的森林', 'image_5.0_lite', '1:1', '2K');

pollTaskResult(
  task.data.task_id,
  (progress) => console.log(`进度: ${progress}%`),
  (data) => console.log('生成完成:', data.result.images),
  (error) => console.error('生成失败:', error)
);
```

---

## 六、附录

### 视频生成参数说明

#### 视频时长支持表

| 时长(秒) | 说明 | VIP要求 |
|----------|------|---------|
| 1 | 极短视频，快速预览 | 否 |
| 2 | 短视频 | 否 |
| 3 | 短视频 | 否 |
| 4 | 标准短视频 | 否 |
| 5 | 标准时长，默认值 | 否 |
| 6 | 中等时长 | 否 |
| 7 | 中等时长 | 部分模型需要VIP |
| 8 | 中等时长 | 部分模型需要VIP |
| 9 | 较长时长 | 部分模型需要VIP |
| 10 | 较长时长 | 部分模型需要VIP |
| 11 | 长视频 | 需要VIP |
| 12 | 长视频 | 需要VIP |
| 13 | 长视频 | 需要VIP |
| 14 | 长视频 | 需要VIP |
| 15 | 最长时长 | 需要VIP |

#### 视频分辨率支持表

| 分辨率 | 像素尺寸 | 说明 | VIP要求 |
|--------|----------|------|---------|
| 1080p | 1920×1080 | 全高清，默认值 | 否 |
| 2K | 2560×1440 | 高清 | 部分模型需要VIP |
| 4K | 3840×2160 | 超高清 | 需要VIP |

#### 视频画幅比例支持表

| 比例 | 分辨率示例 | 适用场景 |
|------|------------|----------|
| 16:9 | 1920×1080 | 横屏视频、YouTube、B站 |
| 9:16 | 1080×1920 | 竖屏视频、抖音、快手、小红书 |
| 1:1 | 1080×1080 | 方形视频、Instagram |
| 4:3 | 1440×1080 | 传统视频比例 |
| 3:4 | 1080×1440 | 竖版视频 |
| 21:9 | 2560×1080 | 超宽屏、电影比例 |

---

### 图片生成参数说明

#### 图片比例支持表

| 比例 | 适用场景 |
|------|----------|
| 1:1 | 社交媒体头像、方形图片 |
| 16:9 | 视频封面、横屏展示 |
| 9:16 | 竖屏展示、手机壁纸 |
| 4:3 | 传统照片比例 |
| 3:4 | 竖版照片 |
| 21:9 | 超宽屏、电影比例 |
| 3:2 | 摄影常用比例 |
| 2:3 | 竖版摄影 |

#### 图片分辨率支持表

| 分辨率 | 说明 |
|--------|------|
| 2K | 高清，2048px |
| 4K | 超清，4096px（可能需要VIP） |

---

**文档版本：** v1.2  
**更新日期：** 2024-04-24  
**更新内容：** 视频时长更新为1-15秒，分辨率更新为1080p/2K/4K
