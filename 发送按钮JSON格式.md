# 发送按钮 JSON 格式说明

## 一、接口调用流程

```
用户点击发送按钮
    ↓
前端收集参数（提示词、模型、比例、分辨率等）
    ↓
构建 JSON 请求体
    ↓
POST 发送到后端
    ↓
后端返回 task_id
    ↓
前端轮询查询任务状态
    ↓
返回生成结果
```

---

## 二、各场景的 JSON 格式

### 1. 图片生成（默认场景）

**接口**: `POST /api/v1/generate/image`

**JSON 请求体**:
```json
{
  "prompt": "用户输入的提示词",
  "model": "选择的模型ID，如 image_5.0_lite",
  "ratio": "选择的比例，如 1:1, 16:9, 9:16",
  "resolution": "选择的分辨率，如 2K, 4K",
  "count": 3
}
```

**示例**:
```json
{
  "prompt": "一只可爱的猫咪，毛茸茸的，坐在草地上",
  "model": "image_5.0_lite",
  "ratio": "1:1",
  "resolution": "2K",
  "count": 3
}
```

---

### 2. 视频生成（文生视频）

**接口**: `POST /api/v1/generate/video/text-to-video`

**JSON 请求体**:
```json
{
  "prompt": "用户输入的提示词",
  "model": "选择的视频模型ID，如 seedance_2.0_fast",
  "ratio": "选择的比例，如 16:9, 9:16",
  "resolution": "选择的分辨率，如 1080p, 2K, 4K",
  "duration": 5
}
```

**示例**:
```json
{
  "prompt": "城市夜景，霓虹灯闪烁，车流穿梭",
  "model": "seedance_2.0_fast",
  "ratio": "16:9",
  "resolution": "2K",
  "duration": 5
}
```

---

### 3. 数字人生成

**接口**: `POST /api/v1/generate/digital-human`

**JSON 请求体**:
```json
{
  "character_image": "角色图片的base64编码或URL",
  "voice_id": "选择的音色ID，如 voice_001",
  "speech_content": "角色要说的话",
  "action_description": "动作描述和镜头语言"
}
```

**示例**:
```json
{
  "character_image": "data:image/png;base64,iVBORw0KGgo...",
  "voice_id": "voice_001",
  "speech_content": "大家好，欢迎观看本期视频",
  "action_description": "镜头推进，微笑着说话"
}
```

---

### 4. 配音生成

**接口**: `POST /api/v1/generate/voiceover`

**JSON 请求体**:
```json
{
  "voice_id": "选择的音色ID，如 voice_001",
  "content": "需要配音的文字内容",
  "speed": 1.0,
  "pitch": 1.0
}
```

**示例**:
```json
{
  "voice_id": "voice_001",
  "content": "这是一段需要配音的文字",
  "speed": 1.0,
  "pitch": 1.0
}
```

---

### 5. Agent 模式

**接口**: `POST /api/v1/generate/agent`

**JSON 请求体**:
```json
{
  "prompt": "用户输入的提示词",
  "type": "image 或 video",
  "model": "选择的模型ID",
  "ratio": "选择的比例",
  "resolution": "选择的分辨率"
}
```

**示例**:
```json
{
  "prompt": "生成一张美丽的风景图",
  "type": "image",
  "model": "image_5.0_lite",
  "ratio": "16:9",
  "resolution": "2K"
}
```

---

## 三、后端响应格式

### 创建任务成功响应

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_1234567890",
    "status": "processing"
  }
}
```

### 任务状态查询响应

**进行中**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "task_id": "task_1234567890",
    "type": "image",
    "status": "processing",
    "progress": 45,
    "result": {},
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": null
  }
}
```

**已完成（图片）**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "task_id": "task_1234567890",
    "type": "image",
    "status": "completed",
    "progress": 100,
    "result": {
      "images": [
        {
          "id": "img_001",
          "url": "https://cdn.example.com/generated/img1.png",
          "thumbnail": "https://cdn.example.com/generated/img1_thumb.png"
        },
        {
          "id": "img_002",
          "url": "https://cdn.example.com/generated/img2.png",
          "thumbnail": "https://cdn.example.com/generated/img2_thumb.png"
        }
      ]
    },
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:00:30Z"
  }
}
```

**已完成（视频）**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "task_id": "task_1234567890",
    "type": "video",
    "status": "completed",
    "progress": 100,
    "result": {
      "video": {
        "id": "video_001",
        "url": "https://cdn.example.com/generated/video1.mp4",
        "thumbnail": "https://cdn.example.com/generated/video1_thumb.png",
        "duration": 5
      }
    },
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:02:00Z"
  }
}
```

---

## 四、参数获取方式

| 参数 | 获取方式 | 说明 |
|------|----------|------|
| `prompt` | 输入框内容 | 用户在聊天框输入的文字 |
| `model` | 模型下拉框 | `data-model-id` 属性值 |
| `ratio` | 比例选择 | `data-ratio` 属性值 |
| `resolution` | 分辨率选择 | `data-res` 属性值 |
| `count` | 数量选择 | `data-count` 属性值，默认3 |
| `duration` | 时长选择 | `data-duration` 属性值，默认4 |
| `voice_id` | 音色选择 | 当前硬编码为 voice_001 |

---

## 五、前端代码中的构建函数

所有 JSON 都在 `buildGenerateRequest()` 函数中构建（`js/script.js` 第 666-731 行）：

```javascript
function buildGenerateRequest(prompt, sceneType) {
    const modelId = getSelectedModelId();      // 获取选择的模型ID
    const ratio = getSelectedRatio();          // 获取选择的比例
    const resolution = getSelectedResolution(); // 获取选择的分辨率
    
    // 根据场景类型返回不同的请求体
    if (sceneType === 'video') {
        return {
            endpoint: '/generate/video/text-to-video',
            body: { prompt, model: modelId, ratio, resolution, duration: getSelectedDuration() }
        };
    }
    // ... 其他场景
}
```

---

## 六、给后端的建议

1. **参数校验**: 检查 `model` 是否支持选择的 `ratio` 和 `resolution`
2. **异步处理**: 收到请求后立即返回 `task_id`，后台异步生成
3. **状态管理**: 维护任务状态（pending → processing → completed/failed）
4. **结果存储**: 生成完成后保存图片/视频 URL，供前端查询
5. **错误处理**: 生成失败时返回明确的错误信息
