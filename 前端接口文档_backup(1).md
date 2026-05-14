# 前端接口文档 (Frontend API Documentation)

## 📋 基础信息

- **Base URL**: `http://localhost:8000`
- **Content-Type**: `application/json`
- **响应格式**: JSON

---

## 🎯 统一生成接口

### 接口地址
```
POST /api/v1/generate
POST /api/v1/generate?sync=true  (同步模式)
```

### 🆕 同步模式 vs 异步模式

| 特性 | 异步模式（默认） | 同步模式 |
|------|-----------------|----------|
| URL | `/api/v1/generate` | `/api/v1/generate?sync=true` |
| 响应时间 | 立即返回（<1秒） | 等待完成（30秒-5分钟） |
| 返回内容 | task_id | 最终结果 |
| 需要轮询 | ✅ 是 | ❌ 否 |
| 适用场景 | 生产环境 | 测试、简单应用 |
| 控制台日志 | 后台输出 | 实时输出 |

**推荐使用同步模式**：
- ✅ 无需实现轮询逻辑
- ✅ 代码更简单直接
- ✅ 适合测试和开发
- ✅ 后端控制台实时输出状态

### 请求格式

```json
{
  "output_type": "image/video/digital_human",
  "model": "model_name",
  "feature": "text_to_video/global_reference/first_last_frame/multi_reference/multi_shot/lip_sync/motion_control/template_effect/digital_human",
  "parameters": {
    "resolution": "1080P",
    "duration": 5,
    "ratio": "16:9"
  },
  "prompt": "prompt content",
  "input_files": [
    {
      "type": "image/video/audio",
      "url": "URL or base64",
      "purpose": "reference/first_frame/last_frame/audio/source_video/character_image",
      "object_id": "image_1"
    }
  ]
}
```

---

## 📝 已实现的功能

### 1. 文生视频 (Text to Video)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_3.0",
  "feature": "text_to_video",
  "parameters": {
    "resolution": "1080P",
    "duration": 5,
    "ratio": "16:9"
  },
  "prompt": "城市夜景，霓虹灯闪烁，车流穿梭"
}
```

**推荐模型**: `kling_3.0`, `gv_3.1`

---

### 2. 图生视频 (Image to Video / Global Reference)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "gv_3.1",
  "feature": "global_reference",
  "parameters": {
    "resolution": "1080P",
    "duration": 5,
    "ratio": "16:9"
  },
  "prompt": "让画面中的云朵缓缓飘动",
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg",
      "purpose": "reference"
    }
  ]
}
```

**支持的输入格式**：
- URL: `https://example.com/image.jpg`
- Base64: `data:image/jpeg;base64,/9j/4AAQ...`

**推荐模型**: `gv_3.1`, `kling_3.0`

---

### 3. 首末帧生成视频 (First-Last Frame)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_2.1",
  "feature": "first_last_frame",
  "parameters": {
    "resolution": "1080P",
    "duration": 5,
    "ratio": "16:9"
  },
  "prompt": "平滑过渡",
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/frame1.jpg",
      "purpose": "first_frame"
    },
    {
      "type": "image",
      "url": "https://example.com/frame2.jpg",
      "purpose": "last_frame"
    }
  ]
}
```

**推荐模型**: `kling_2.1`, `gv_3.1`

---

### 4. 多图参考 (Multi-Reference)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_3.0_omni",
  "feature": "multi_reference",
  "parameters": {
    "resolution": "1080P",
    "duration": 8,
    "ratio": "16:9"
  },
  "prompt": "让 <<<image_1>>> 牵着 <<<image_2>>> 转圈圈",
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/person1.jpg",
      "purpose": "reference",
      "object_id": "image_1"
    },
    {
      "type": "image",
      "url": "https://example.com/person2.jpg",
      "purpose": "reference",
      "object_id": "image_2"
    }
  ]
}
```

**使用说明**：
- 在 `input_files` 中设置 `object_id`
- 在 `prompt` 中使用 `<<<image_1>>>`, `<<<image_2>>>` 引用主体

**推荐模型**: `kling_3.0_omni`

---

### 5. 智能分镜 (Multi-Shot)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_3.0",
  "feature": "multi_shot",
  "parameters": {
    "resolution": "1080P",
    "duration": 10,
    "ratio": "16:9",
    "multi_shot": true,
    "shot_type": "customize",
    "shots": [
      {
        "index": 1,
        "prompt": "公园长椅上，阳光透过树叶洒下",
        "duration": 5
      },
      {
        "index": 2,
        "prompt": "雨夜街道，汽车疾驰而过，车灯闪烁",
        "duration": 5
      }
    ]
  }
}
```

**注意事项**：
- 所有分镜时长之和必须等于总时长
- 最多支持 6 个分镜
- 使用智能分镜时，顶层 `prompt` 无效

**推荐模型**: `kling_3.0`

---

### 6. 图生视频 + 智能分镜 (Combined Feature)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_3.0",
  "feature": "global_reference+multi_shot",
  "parameters": {
    "resolution": "1080P",
    "duration": 10,
    "ratio": "16:9",
    "multi_shot": true,
    "shot_type": "customize",
    "shots": [
      {
        "index": 1,
        "prompt": "参考<<<image_1>>>，微笑着向我走来",
        "duration": 5
      },
      {
        "index": 2,
        "prompt": "参考<<<image_1>>>，转身离开",
        "duration": 5
      }
    ]
  },
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/character.jpg",
      "purpose": "reference",
      "object_id": "image_1"
    }
  ]
}
```

**推荐模型**: `kling_3.0`

---

### 7. 对口型 (Lip Sync)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_2.6",
  "feature": "lip_sync",
  "parameters": {
    "face_id": 0,
    "audio_start_time": 0,
    "audio_end_time": 5000,
    "audio_insert_time": 0,
    "audio_volume": 1.0,
    "original_audio_volume": 0.0
  },
  "input_files": [
    {
      "type": "video",
      "url": "https://example.com/person.mp4",
      "purpose": "source_video"
    },
    {
      "type": "audio",
      "url": "https://example.com/speech.mp3",
      "purpose": "audio"
    }
  ]
}
```

**参数说明**：
- `face_id`: 人脸ID，默认 0
- `audio_start_time`: 音频开始时间（毫秒）
- `audio_end_time`: 音频结束时间（毫秒）
- `audio_insert_time`: 音频插入时间（毫秒）
- `audio_volume`: 音频音量（0.0-2.0）
- `original_audio_volume`: 原始音频音量（0.0-2.0）

**推荐模型**: `kling_2.6`

---

### 8. 动作控制 (Motion Control)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "kling_3.0",
  "feature": "motion_control",
  "parameters": {
    "resolution": "2K",
    "duration": 5,
    "ratio": "16:9",
    "keep_original_sound": "no",
    "character_orientation": "image"
  },
  "prompt": "跳舞",
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/person.jpg",
      "purpose": "reference"
    },
    {
      "type": "video",
      "url": "https://example.com/dance.mp4",
      "purpose": "reference"
    }
  ]
}
```

**参数说明**：
- `keep_original_sound`: 是否保留视频原声（yes/no）
- `character_orientation`: 人物朝向（image/video）

**推荐模型**: `kling_3.0`

---

### 9. 特效模板 (Template Effect)

**请求示例**：
```json
{
  "output_type": "video",
  "model": "vidu_q2_turbo",
  "feature": "template_effect",
  "parameters": {
    "resolution": "2K",
    "duration": 5,
    "ratio": "16:9",
    "template": "morphlab"
  },
  "prompt": "爆炸特效",
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/object.jpg",
      "purpose": "reference"
    }
  ]
}
```

**可用模板**：
- `morphlab`: 爆炸效果

**推荐模型**: `vidu_q2_turbo`, `vidu_q2_pro`

---

### 10. 数字人生成 (Digital Human)

**请求示例**：
```json
{
  "output_type": "digital_human",
  "model": "kling_2.6",
  "feature": "digital_human",
  "parameters": {
    "voice_id": "voice_001",
    "action_description": "微笑着说话"
  },
  "prompt": "大家好，欢迎来到我的频道",
  "input_files": [
    {
      "type": "image",
      "url": "https://example.com/character.jpg",
      "purpose": "character_image"
    }
  ]
}
```

**说明**：
- 数字人 = 角色图片 + 语音合成 + 对口型
- 后端会自动将文本转换为语音，然后使用对口型功能生成数字人视频

**推荐模型**: `kling_2.6`

---

## 📊 参数说明

### output_type (输出类型)

| 值 | 说明 |
|----|------|
| image | 生成图片 |
| video | 生成视频 |
| digital_human | 生成数字人视频 |

### feature (特色功能)

| 功能名称 | 说明 | 适用类型 |
|---------|------|---------|
| text_to_video | 纯文本生成视频 | video |
| global_reference | 使用图片作为参考生成视频 | video |
| first_last_frame | 使用首尾两帧图片生成过渡视频 | video |
| multi_reference | 使用多张图片/视频作为参考 | video |
| multi_shot | 生成多镜头视频 | video |
| lip_sync | 让视频中的人物对口型说话 | video |
| motion_control | 控制人物动作 | video |
| template_effect | 应用特效模板 | video |
| digital_human | 生成数字人说话视频 | digital_human |

### parameters (通用参数)

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| resolution | string | 否 | 1080P | 480P/720P/1080P/2K/4K |
| duration | integer | 否 | 5 | 视频时长（秒），范围 1-15 |
| ratio | string | 否 | 16:9 | 16:9/9:16/1:1/4:3等 |

### parameters (智能分镜)

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| multi_shot | boolean | 是 | 是否启用智能分镜 |
| shot_type | string | 是 | customize/intelligence |
| shots | array | 是 | 分镜详情列表 |
| shots[].index | integer | 是 | 分镜序号（1-6） |
| shots[].prompt | string | 是 | 分镜提示词 |
| shots[].duration | integer | 是 | 分镜时长（秒） |

### parameters (对口型)

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| face_id | integer | 否 | 0 | 人脸ID |
| audio_start_time | integer | 否 | 0 | 毫秒 |
| audio_end_time | integer | 否 | - | 毫秒 |
| audio_insert_time | integer | 否 | 0 | 毫秒 |
| audio_volume | float | 否 | 1.0 | 0.0-2.0 |
| original_audio_volume | float | 否 | 0.0 | 0.0-2.0 |

### parameters (动作控制)

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| keep_original_sound | string | 否 | no | yes/no |
| character_orientation | string | 否 | - | image/video |

### parameters (特效模板)

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| template | string | 是 | 特效模板名称，如 morphlab |

### parameters (数字人)

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| voice_id | string | 是 | 音色ID |
| action_description | string | 否 | 动作描述 |

### input_files (输入文件)

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | image/video/audio |
| url | string | 是 | URL或base64 |
| purpose | string | 是 | reference/first_frame/last_frame/audio/source_video/character_image |
| object_id | string | 否 | 用于在提示词中引用，如 image_1 |

---

## 📤 响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_20260511120000_123456",
    "status": "processing"
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "参数错误：所有分镜时长之和必须等于总时长",
  "data": null
}
```

---

## 🔍 查询任务状态

### 接口地址
```
GET /api/v1/tasks/{task_id}
```

### 响应示例

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "task_id": "task_20260511120000_123456",
    "type": "video",
    "status": "completed",
    "progress": 100,
    "result": {
      "video_url": "https://example.com/result.mp4",
      "thumbnail_url": "https://example.com/thumb.jpg"
    },
    "created_at": "2026-05-11T12:00:00Z",
    "completed_at": "2026-05-11T12:02:30Z"
  }
}
```

### 任务状态说明

| 状态 | 说明 |
|------|------|
| pending | 等待处理 |
| processing | 处理中 |
| completed | 已完成 |
| failed | 失败 |

---

## 📚 获取模型列表

### 接口地址
```
GET /api/v1/models
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "image_models": [
      {
        "id": "image_5.0_lite",
        "name": "GG 5.0-litte",
        "type": "图片"
      }
    ],
    "video_models": [
      {
        "id": "kling_3.0",
        "name": "Kling 3.0",
        "type": "视频"
      }
    ]
  }
}
```

---

## 🎨 常用参数值

### resolution (分辨率)

| 值 | 说明 |
|----|------|
| 480P | 标清 |
| 720P | 高清 |
| 1080P | 全高清（推荐） |
| 2K | 2K |
| 4K | 4K |

### ratio (比例)

| 值 | 说明 |
|----|------|
| 16:9 | 横屏（推荐） |
| 9:16 | 竖屏 |
| 1:1 | 方形 |
| 4:3 | 标准 |
| 21:9 | 超宽屏 |

### duration (时长)

- **范围**: 1-15 秒
- **默认**: 5 秒

---

## 💡 推荐模型

| 功能 | 推荐模型 |
|------|----------|
| 文生视频 | kling_3.0, gv_3.1 |
| 图生视频 | gv_3.1, kling_3.0 |
| 首末帧 | kling_2.1, gv_3.1 |
| 多图参考 | kling_3.0_omni |
| 智能分镜 | kling_3.0 |
| 对口型 | kling_2.6 |
| 动作控制 | kling_3.0 |
| 特效模板 | vidu_q2_turbo |
| 数字人 | kling_2.6 |

---

## 💻 完整示例（JavaScript）

### 基础用法

```javascript
// 1. 创建视频生成任务
async function generateVideo() {
  const response = await fetch('http://localhost:8000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      output_type: "video",
      model: "kling_3.0",
      feature: "text_to_video",
      parameters: {
        resolution: "1080P",
        duration: 5,
        ratio: "16:9"
      },
      prompt: "城市夜景，霓虹灯闪烁"
    })
  });
  
  const data = await response.json();
  
  if (data.code === 200) {
    return data.data.task_id;
  } else {
    throw new Error(data.message);
  }
}

// 2. 查询任务状态
async function checkTaskStatus(taskId) {
  const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`);
  const data = await response.json();
  return data.data;
}

// 3. 轮询等待任务完成
async function waitForCompletion(taskId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await checkTaskStatus(taskId);
        console.log('任务状态:', status.status, '进度:', status.progress + '%');
        
        if (status.status === 'completed') {
          clearInterval(interval);
          resolve(status.result);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          reject(new Error('任务失败'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000); // 每5秒查询一次
  });
}

// 4. 完整流程
async function main() {
  try {
    // 创建任务
    const taskId = await generateVideo();
    console.log('任务已创建:', taskId);
    
    // 等待完成
    const result = await waitForCompletion(taskId);
    console.log('视频生成成功!');
    console.log('视频URL:', result.video_url);
  } catch (error) {
    console.error('错误:', error.message);
  }
}
```

### 图生视频示例

```javascript
async function generateImageToVideo(imageUrl) {
  const response = await fetch('http://localhost:8000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      output_type: "video",
      model: "gv_3.1",
      feature: "global_reference",
      parameters: {
        resolution: "1080P",
        duration: 5,
        ratio: "16:9"
      },
      prompt: "让画面动起来",
      input_files: [
        {
          type: "image",
          url: imageUrl,
          purpose: "reference"
        }
      ]
    })
  });
  
  const data = await response.json();
  return data.data.task_id;
}
```

### 数字人生成示例

```javascript
async function generateDigitalHuman() {
  const response = await fetch('http://localhost:8000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      output_type: "digital_human",
      model: "kling_2.6",
      feature: "digital_human",
      parameters: {
        voice_id: "voice_001",
        action_description: "微笑着说话"
      },
      prompt: "大家好，欢迎来到我的频道",
      input_files: [
        {
          type: "image",
          url: "https://example.com/character.jpg",
          purpose: "character_image"
        }
      ]
    })
  });
  
  const data = await response.json();
  return data.data.task_id;
}
```

---

## ⚠️ 注意事项

### 1. 输入文件格式

支持两种格式：
- **URL**: `https://example.com/image.jpg`
- **Base64**: `data:image/jpeg;base64,/9j/4AAQ...`

### 2. 智能分镜要求

- 所有分镜时长之和必须等于总时长
- 最多支持 6 个分镜
- 每个分镜提示词最多 512 字符
- 使用智能分镜时，顶层 `prompt` 无效

### 3. 主体引用

- 在 `input_files` 中设置 `object_id`
- 在 `prompt` 中使用 `<<<image_1>>>`, `<<<image_2>>>` 引用
- 引用编号从 1 开始

### 4. 任务轮询建议

- 建议每 5 秒查询一次任务状态
- 视频生成通常需要 30 秒 - 5 分钟
- 避免过于频繁的查询

### 5. 功能组合

某些功能可以组合使用：
- ✅ global_reference + multi_shot
- ✅ multi_reference + multi_shot
- ❌ first_last_frame + global_reference（互斥）
- ❌ 不同特色功能之间（lip_sync、motion_control、template_effect）互斥

---

## 🐛 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 404 | 任务不存在 |
| 422 | 参数验证失败 |
| 500 | 服务器错误 |

---

## 📞 技术支持

如有问题，请查看：
- [统一视频生成接口文档](docs/UNIFIED_VIDEO_API.md) - 完整文档
- [快速参考指南](docs/QUICK_REFERENCE.md) - 速查手册

---

**文档版本**: v2.0  
**最后更新**: 2026-05-12  
**接口格式**: 统一英文参数格式

### 生成结果类型

| 值 | 说明 |
|----|------|
| 图片 | 生成图片 |
| 视频 | 生成视频 |
| 数字人 | 生成数字人视频 |

### 特色功能

| 功能名称 | 说明 | 适用类型 |
|---------|------|---------|
| 文生视频 | 纯文本生成视频 | 视频 |
| 全局参考 | 使用图片作为参考生成视频 | 视频 |
| 首末帧 | 使用首尾两帧图片生成过渡视频 | 视频 |
| 多图参考 | 使用多张图片/视频作为参考 | 视频 |
| 智能分镜 | 生成多镜头视频 | 视频 |
| 对口型 | 让视频中的人物对口型说话 | 视频 |
| 动作控制 | 控制人物动作 | 视频 |
| 特效模板 | 应用特效模板 | 视频 |
| 数字人 | 生成数字人说话视频 | 数字人 |

### 参数设置（通用）

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 分辨率 | string | 否 | 1080P | 480P/720P/1080P/2K/4K |
| 时长 | integer | 否 | 5 | 视频时长（秒），范围 1-15 |
| 比例 | string | 否 | 16:9 | 16:9/9:16/1:1/4:3等 |

### 参数设置（特定功能）

#### 智能分镜
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 分镜方式 | string | 是 | customize/intelligence |
| 分镜列表 | array | 是 | 分镜详情列表 |
| 分镜列表[].序号 | integer | 是 | 分镜序号（1-6） |
| 分镜列表[].提示词 | string | 是 | 分镜提示词 |
| 分镜列表[].时长 | integer | 是 | 分镜时长（秒） |

#### 对口型
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 人脸ID | integer | 否 | 0 | 人脸ID |
| 音频开始时间 | integer | 否 | 0 | 毫秒 |
| 音频结束时间 | integer | 否 | - | 毫秒 |
| 音频插入时间 | integer | 否 | 0 | 毫秒 |
| 音频音量 | float | 否 | 1.0 | 0.0-2.0 |
| 原始音频音量 | float | 否 | 0.0 | 0.0-2.0 |

#### 动作控制
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 保留原声 | string | 否 | no | yes/no |
| 人物朝向 | string | 否 | - | image/video |

#### 特效模板
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 模板名称 | string | 是 | 特效模板名称，如 morphlab |

#### 数字人
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 音色ID | string | 是 | 音色ID |
| 动作描述 | string | 否 | 动作描述 |

### 输入文件

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| 类型 | string | 是 | 图片/视频/音频 |
| 地址 | string | 是 | URL或base64 |
| 用途 | string | 是 | 参考/首帧/尾帧/音频/原始视频/角色图片 |
| 主体ID | string | 否 | 用于在提示词中引用，如 image_1 |

---

## 📤 响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "生成任务已创建",
  "data": {
    "task_id": "task_20260511120000_123456",
    "status": "processing"
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "参数错误：所有分镜时长之和必须等于总时长",
  "data": null
}
```

---

## � 查询任务状态

### 接口地址
```
GET /api/v1/tasks/{task_id}
```

### 响应示例

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "task_id": "task_20260511120000_123456",
    "type": "video",
    "status": "completed",
    "progress": 100,
    "result": {
      "video_url": "https://example.com/result.mp4",
      "thumbnail_url": "https://example.com/thumb.jpg"
    },
    "created_at": "2026-05-11T12:00:00Z",
    "completed_at": "2026-05-11T12:02:30Z"
  }
}
```

### 任务状态说明

| 状态 | 说明 |
|------|------|
| pending | 等待处理 |
| processing | 处理中 |
| completed | 已完成 |
| failed | 失败 |

---

## 📚 获取模型列表

### 接口地址
```
GET /api/v1/models
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "image_models": [
      {
        "id": "image_5.0_lite",
        "name": "GG 5.0-litte",
        "type": "图片"
      }
    ],
    "video_models": [
      {
        "id": "kling_3.0",
        "name": "Kling 3.0",
        "type": "视频"
      }
    ]
  }
}
```

---

## 🎨 常用参数值

### 分辨率

| 值 | 说明 |
|----|------|
| 480P | 标清 |
| 720P | 高清 |
| 1080P | 全高清（推荐） |
| 2K | 2K |
| 4K | 4K |

### 比例

| 值 | 说明 |
|----|------|
| 16:9 | 横屏（推荐） |
| 9:16 | 竖屏 |
| 1:1 | 方形 |
| 4:3 | 标准 |
| 21:9 | 超宽屏 |

### 时长

- **范围**: 1-15 秒
- **默认**: 5 秒

---

## 💡 推荐模型

| 功能 | 推荐模型 |
|------|----------|
| 文生视频 | kling_3.0, gv_3.1 |
| 图生视频 | gv_3.1, kling_3.0 |
| 首末帧 | kling_2.1, gv_3.1 |
| 多图参考 | kling_3.0_omni |
| 智能分镜 | kling_3.0 |
| 对口型 | kling_2.6 |
| 动作控制 | kling_3.0 |
| 特效模板 | vidu_q2_turbo |
| 数字人 | kling_2.6 |

---

## 💻 完整示例（JavaScript）

### 基础用法

```javascript
// 1. 创建视频生成任务
async function generateVideo() {
  const response = await fetch('http://localhost:8000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "生成结果类型": "视频",
      "模型": "kling_3.0",
      "特色功能": "文生视频",
      "参数设置": {
        "分辨率": "1080P",
        "时长": 5,
        "比例": "16:9"
      },
      "提示词": "城市夜景，霓虹灯闪烁"
    })
  });
  
  const data = await response.json();
  
  if (data.code === 200) {
    return data.data.task_id;
  } else {
    throw new Error(data.message);
  }
}

// 2. 查询任务状态
async function checkTaskStatus(taskId) {
  const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`);
  const data = await response.json();
  return data.data;
}

// 3. 轮询等待任务完成
async function waitForCompletion(taskId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await checkTaskStatus(taskId);
        console.log('任务状态:', status.status, '进度:', status.progress + '%');
        
        if (status.status === 'completed') {
          clearInterval(interval);
          resolve(status.result);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          reject(new Error('任务失败'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000); // 每5秒查询一次
  });
}

// 4. 完整流程
async function main() {
  try {
    // 创建任务
    const taskId = await generateVideo();
    console.log('任务已创建:', taskId);
    
    // 等待完成
    const result = await waitForCompletion(taskId);
    console.log('视频生成成功!');
    console.log('视频URL:', result.video_url);
  } catch (error) {
    console.error('错误:', error.message);
  }
}
```

### 图生视频示例

```javascript
async function generateImageToVideo(imageUrl) {
  const response = await fetch('http://localhost:8000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "生成结果类型": "视频",
      "模型": "gv_3.1",
      "特色功能": "全局参考",
      "参数设置": {
        "分辨率": "1080P",
        "时长": 5,
        "比例": "16:9"
      },
      "提示词": "让画面动起来",
      "输入文件": [
        {
          "类型": "图片",
          "地址": imageUrl,
          "用途": "参考"
        }
      ]
    })
  });
  
  const data = await response.json();
  return data.data.task_id;
}
```

### 数字人生成示例

```javascript
async function generateDigitalHuman() {
  const response = await fetch('http://localhost:8000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "生成结果类型": "数字人",
      "模型": "kling_2.6",
      "特色功能": "数字人",
      "参数设置": {
        "音色ID": "voice_001",
        "动作描述": "微笑着说话"
      },
      "提示词": "大家好，欢迎来到我的频道",
      "输入文件": [
        {
          "类型": "图片",
          "地址": "https://example.com/character.jpg",
          "用途": "角色图片"
        }
      ]
    })
  });
  
  const data = await response.json();
  return data.data.task_id;
}
```

---

## ⚠️ 注意事项

### 1. 输入文件格式

支持两种格式：
- **URL**: `https://example.com/image.jpg`
- **Base64**: `data:image/jpeg;base64,/9j/4AAQ...`

### 2. 智能分镜要求

- 所有分镜时长之和必须等于总时长
- 最多支持 6 个分镜
- 每个分镜提示词最多 512 字符
- 使用智能分镜时，顶层提示词无效

### 3. 主体引用

- 在输入文件中设置 `主体ID`
- 在提示词中使用 `<<<image_1>>>`, `<<<image_2>>>` 引用
- 引用编号从 1 开始

### 4. 任务轮询建议

- 建议每 5 秒查询一次任务状态
- 视频生成通常需要 30 秒 - 5 分钟
- 避免过于频繁的查询

### 5. 功能组合

某些功能可以组合使用：
- ✅ 全局参考 + 智能分镜
- ✅ 多图参考 + 智能分镜
- ❌ 首末帧 + 全局参考（互斥）
- ❌ 不同特色功能之间（对口型、动作控制、特效模板）互斥

---

## 🐛 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 404 | 任务不存在 |
| 422 | 参数验证失败 |
| 500 | 服务器错误 |

---

## 📞 技术支持

如有问题，请查看：
- [统一视频生成接口文档](docs/UNIFIED_VIDEO_API.md) - 完整文档
- [快速参考指南](docs/QUICK_REFERENCE.md) - 速查手册

---

**文档版本**: v2.0  
**最后更新**: 2026-05-12  
**接口格式**: 统一中文参数格式


---

## 🔄 同步模式详细说明

### 什么是同步模式？

同步模式是一种简化的调用方式，后端会等待任务完成后直接返回最终结果，无需前端轮询。

### 如何使用同步模式？

只需在 URL 后添加 `?sync=true` 参数：

```javascript
// 异步模式（默认）
POST /api/v1/generate

// 同步模式
POST /api/v1/generate?sync=true
```

### 同步模式示例

#### JavaScript/Fetch

```javascript
// 同步模式 - 一次请求，直接获得结果
async function generateWithSync() {
  const response = await fetch('http://localhost:8003/api/v1/generate?sync=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      output_type: 'image',
      model: 'image_5.0_lite',
      feature: 'text_to_image',
      parameters: {
        resolution: '2K',
        ratio: '1:1',
        count: 3
      },
      prompt: '一只可爱的小猫',
      input_files: []
    })
  });
  
  const data = await response.json();
  
  if (data.data.status === 'completed') {
    console.log('✅ 生成完成！');
    console.log('结果:', data.data.result);
    
    // 直接使用结果
    const images = data.data.result.images;
    images.forEach(img => {
      console.log('图片URL:', img.url);
    });
  } else {
    console.error('❌ 生成失败');
  }
}
```

#### Python/Requests

```python
import requests

response = requests.post(
    'http://localhost:8003/api/v1/generate',
    params={'sync': True},  # 启用同步模式
    json={
        'output_type': 'image',
        'model': 'image_5.0_lite',
        'feature': 'text_to_image',
        'parameters': {
            'resolution': '2K',
            'ratio': '1:1',
            'count': 3
        },
        'prompt': '一只可爱的小猫',
        'input_files': []
    }
)

data = response.json()

if data['data']['status'] == 'completed':
    print('✅ 生成成功！')
    for img in data['data']['result']['images']:
        print(f"图片URL: {img['url']}")
```

### 同步模式响应格式

#### 成功响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "task_id": "task_20240115120000_xxx",
    "type": "image",
    "status": "completed",
    "progress": 100,
    "result": {
      "images": [
        {
          "id": "img_001",
          "url": "https://xxx.com/image1.jpg",
          "thumbnail": "https://xxx.com/thumb1.jpg"
        },
        {
          "id": "img_002",
          "url": "https://xxx.com/image2.jpg",
          "thumbnail": "https://xxx.com/thumb2.jpg"
        }
      ]
    },
    "created_at": "2024-01-15T12:00:00Z",
    "completed_at": "2024-01-15T12:00:45Z"
  }
}
```

#### 失败响应

```json
{
  "code": 500,
  "message": "生成失败: 具体错误信息",
  "data": null
}
```

#### 超时响应

```json
{
  "code": 500,
  "message": "任务超时（超过 300 秒）",
  "data": null
}
```

### 后端控制台日志

使用同步模式时，后端控制台会实时输出处理状态：

```
============================================================
[生成请求] 任务ID: task_20240115120000_12345
[生成请求] 类型: image
[生成请求] 模型: image_5.0_lite
[生成请求] 功能: text_to_image
[生成请求] 模式: 同步
============================================================

[同步模式] 开始处理任务...
[INFO] 任务已创建: task_xxx, 开始轮询...
[INFO] 轮询第 1 次, 状态: PROCESSING
[INFO] 轮询第 2 次, 状态: PROCESSING
[INFO] 轮询第 3 次, 状态: SUCCESS
[同步模式] ✅ 任务完成
```

### 前端需要做的更改

#### 1. 修改 API 调用 URL

```javascript
// 修改前（异步模式）
const url = 'http://your-ip:8003/api/v1/generate';

// 修改后（同步模式）
const url = 'http://your-ip:8003/api/v1/generate?sync=true';
```

#### 2. 简化响应处理

```javascript
// 修改前（异步模式 - 需要轮询）
const response = await fetch(url, { method: 'POST', ... });
const data = await response.json();
const taskId = data.data.task_id;

// 轮询查询状态
const pollStatus = async () => {
  const statusRes = await fetch(`http://your-ip:8003/api/v1/tasks/${taskId}/status`);
  const statusData = await statusRes.json();
  
  if (statusData.data.status === 'completed') {
    // 使用结果
    console.log(statusData.data.result);
  } else {
    setTimeout(pollStatus, 2000);
  }
};
pollStatus();

// 修改后（同步模式 - 直接获得结果）
const response = await fetch(url, { method: 'POST', ... });
const data = await response.json();

if (data.data.status === 'completed') {
  // 直接使用结果
  console.log(data.data.result);
}
```

#### 3. 添加加载提示

由于同步模式需要等待，建议添加加载提示：

```javascript
// 显示加载提示
showLoading('正在生成，请稍候...');

try {
  const response = await fetch(url + '?sync=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  const data = await response.json();
  
  if (data.data.status === 'completed') {
    // 显示结果
    showResult(data.data.result);
  } else {
    showError('生成失败');
  }
} catch (error) {
  showError('请求失败: ' + error.message);
} finally {
  hideLoading();
}
```

### 何时使用同步模式

#### ✅ 推荐使用同步模式

- 测试和开发阶段
- 简单的单页应用
- 命令行工具
- 脚本自动化
- 不想处理轮询逻辑
- 需要查看后端实时日志

#### ❌ 不推荐使用同步模式

- 高并发生产环境
- 需要处理大量请求
- 移动应用（可能超时）
- 需要显示实时进度条
- 需要任务队列管理

### 超时设置

同步模式默认配置：
- **最大等待时间**：300 秒（5 分钟）
- **轮询间隔**：5 秒

如果任务超过 5 分钟未完成，会返回超时错误。

### 完整对比示例

#### 异步模式（需要轮询）

```javascript
// 1. 创建任务
const createResponse = await fetch('http://localhost:8003/api/v1/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
});
const createData = await createResponse.json();
const taskId = createData.data.task_id;

// 2. 轮询查询状态
const pollStatus = async () => {
  const statusResponse = await fetch(
    `http://localhost:8003/api/v1/tasks/${taskId}/status`
  );
  const statusData = await statusResponse.json();
  
  if (statusData.data.status === 'completed') {
    console.log('完成！', statusData.data.result);
  } else if (statusData.data.status === 'failed') {
    console.error('失败！');
  } else {
    setTimeout(pollStatus, 2000); // 2秒后再查询
  }
};
pollStatus();
```

#### 同步模式（一次请求）

```javascript
// 一次请求，直接获得结果
const response = await fetch('http://localhost:8003/api/v1/generate?sync=true', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
});
const data = await response.json();

if (data.data.status === 'completed') {
  console.log('完成！', data.data.result);
} else {
  console.error('失败！');
}
```

### 注意事项

1. **响应时间**：同步模式会等待任务完成，响应时间通常为 30秒 - 5分钟
2. **超时处理**：如果超时，可以通过返回的 task_id 查询状态
3. **并发限制**：同步模式会占用连接，不适合高并发场景
4. **错误处理**：建议添加 try-catch 和超时处理

### 最佳实践

```javascript
async function generateWithSyncMode(requestData) {
  const url = 'http://localhost:8003/api/v1/generate?sync=true';
  
  try {
    // 显示加载提示
    console.log('🚀 开始生成...');
    
    // 发送请求（可能需要等待几分钟）
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 检查响应
    if (data.code !== 200) {
      throw new Error(data.message || '请求失败');
    }
    
    // 检查任务状态
    if (data.data.status === 'completed') {
      console.log('✅ 生成成功！');
      return data.data.result;
    } else if (data.data.status === 'failed') {
      throw new Error('生成失败');
    } else {
      // 如果返回的不是完成状态，可以尝试轮询
      console.log('⚠️ 任务未完成，task_id:', data.data.task_id);
      return null;
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  }
}

// 使用示例
const result = await generateWithSyncMode({
  output_type: 'image',
  model: 'image_5.0_lite',
  feature: 'text_to_image',
  parameters: { resolution: '2K', ratio: '1:1', count: 3 },
  prompt: '一只可爱的小猫',
  input_files: []
});

if (result && result.images) {
  result.images.forEach(img => {
    console.log('图片URL:', img.url);
  });
}
```

---

**同步模式更新时间**: 2024-01-15  
**文档版本**: v2.1
