// ============================================================
// ✅ 【API对接说明】本文件已实现与后端 API 的对接
// 
// 已实现的接口：
//    1. GET  /api/v1/models              → 获取模型列表（initModels）
//    2. POST /api/v1/generate/*          → 各类生成接口（postJson）
//    3. GET  /api/v1/generate/task/{id}  → 任务状态查询（pollTaskStatus）
// 
// 配置方式：
//    - 修改 API_CONFIG.BASE_URL 为真实后端地址
//    - 当前默认: '/api/v1' (相对路径，同源部署)
//    - 生产环境: 'https://your-backend.com/api/v1'
// 
// 待实现接口：
//    - POST /api/v1/auth/login           → 登录（当前为假实现）
//    - GET  /api/v1/user/quota           → 用户额度查询
// ============================================================

// ======================== API 配置 ========================
const API_CONFIG = {
    // 修改此处为真实后端地址
    // 如果使用 Vite 开发服务器（端口5173/3000等），需要指定完整后端地址
    BASE_URL: 'http://localhost:8003/api/v1',
    
    // 同源部署时使用相对路径
    // BASE_URL: '/api/v1',
    
    // 生产环境
    // BASE_URL: 'https://your-real-backend.com/api/v1',
};

// ======================== 全局状态 ========================
let globalModels = {
    image_models: [],
    video_models: [],
    voices: []
};

// ======================== 全局辅助函数 ========================
function showToast(msg, type = 'info') {
    // 简单提示，可替换为更美观的 toast 组件
    alert(msg);
}

// ======================== API 服务函数 ========================

/**
 * 测试 API 连通性
 * @returns {Promise<boolean>} 是否连通
 */
async function testApiConnection() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) {
            console.error('API 测试失败:', response.status, response.statusText);
            return false;
        }
        
        const data = await response.json();
        console.log('✅ API 连通性测试成功:', data);
        return data.code === 200;
    } catch (error) {
        console.error('❌ API 连通性测试失败:', error);
        return false;
    }
}

/**
 * 获取可用模型列表
 * @returns {Promise<Object>} { image_models, video_models, voices }
 */
async function fetchModels() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`获取模型列表失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.message || '获取模型列表失败');
        }
        
        // 保存到全局状态
        globalModels = data.data || { image_models: [], video_models: [], voices: [] };
        console.log('✅ 模型列表获取成功:', globalModels);
        
        return globalModels;
    } catch (error) {
        console.error('❌ 获取模型列表失败:', error);
        showToast('获取模型列表失败，请检查后端服务', 'error');
        // 返回空数据，使用硬编码默认值
        return { image_models: [], video_models: [], voices: [] };
    }
}

/**
 * 获取当前选择的参数（比例、分辨率等）
 * @returns {Object} 当前参数
 */
function getCurrentParams() {
    // 判断当前场景类型
    const scene = Array.from(document.querySelectorAll('.scene-controls')).find(s => {
        return window.getComputedStyle(s).display !== 'none';
    });
    let sceneType = 'image';
    if (scene) {
        if (scene.classList.contains('video-scene')) sceneType = 'video';
        else if (scene.classList.contains('digital-human-scene')) sceneType = 'digital-human';
        else if (scene.classList.contains('voiceover-scene')) sceneType = 'voiceover';
        else if (scene.classList.contains('agent-scene')) sceneType = 'agent';
    }
    
    let ratio = '1:1';
    let resolution = '2K';
    
    if (sceneType === 'image') {
        const activeRatio = document.querySelector('#imageRatioResDropdown .ratio-item.active');
        const activeRes = document.querySelector('#imageRatioResDropdown .resolution-btn.active');
        ratio = activeRatio ? activeRatio.getAttribute('data-ratio') : '1:1';
        resolution = activeRes ? activeRes.getAttribute('data-res') : '2K';
    } else if (sceneType === 'video') {
        const activeRatio = document.querySelector('#videoRatioResDropdown .ratio-item.active');
        const activeRes = document.querySelector('#videoRatioResDropdown .resolution-btn.active');
        ratio = activeRatio ? activeRatio.getAttribute('data-ratio') : '16:9';
        resolution = activeRes ? activeRes.getAttribute('data-res') : '2K';
    }
    
    return { sceneType, ratio, resolution };
}

/**
 * 根据参数获取可用的模型列表（带参数）
 * @param {Object} params 参数 { sceneType, ratio, resolution }
 * @returns {Promise<Object>} 模型列表
 */
async function fetchModelsWithParams(params) {
    try {
        // 构建查询参数
        const queryParams = new URLSearchParams({
            type: params.sceneType,
            ratio: params.ratio,
            resolution: params.resolution
        }).toString();
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/models?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`获取模型列表失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.message || '获取模型列表失败');
        }
        
        globalModels = data.data || { image_models: [], video_models: [], voices: [] };
        console.log('✅ 模型列表获取成功（带参数）:', globalModels, '参数:', params);
        
        return globalModels;
    } catch (error) {
        console.error('❌ 获取模型列表失败:', error);
        return { image_models: [], video_models: [], voices: [] };
    }
}

/**
 * 渲染图片模型列表到 DOM
 * @param {Array} models 图片模型数组
 */
function renderImageModels(models) {
    // 查找图片模型下拉菜单容器
    const imageModelDropdown = document.querySelector('#imageModelDropdown .dropdown-menu');
    if (!imageModelDropdown) {
        console.warn('未找到图片模型下拉菜单容器');
        return;
    }
    
    // 清空现有内容（保留 header）
    const header = imageModelDropdown.querySelector('.model-panel-header');
    imageModelDropdown.innerHTML = '';
    if (header) {
        header.textContent = '请选择模型';
        imageModelDropdown.appendChild(header);
    }
    
    // 添加默认选项
    const defaultOption = document.createElement('div');
    defaultOption.className = 'model-option active';
    defaultOption.setAttribute('data-model-id', '');
    defaultOption.innerHTML = `
        <div class="model-icon"><i class="fas fa-cube"></i></div>
        <div class="model-info">
            <div class="model-name">-- 请选择模型 --</div>
            <div class="model-desc">根据比例和分辨率自动推荐</div>
        </div>
        <div class="model-check"><i class="fas fa-check"></i></div>
    `;
    imageModelDropdown.appendChild(defaultOption);
    
    // 更新触发按钮显示为默认
    const triggerBtn = document.querySelector('#imageModelDropdown > span');
    if (triggerBtn) {
        triggerBtn.textContent = '-- 请选择 --';
    }
    
    // 如果没有模型数据，使用默认硬编码
    if (!models || models.length === 0) {
        console.warn('没有获取到图片模型，使用默认硬编码');
        models = [
            { id: 'image_5.0_lite', name: '图片5.0 Lite', description: '指令响应更精准，生成效果更智能', is_new: true },
            { id: 'image_4.6', name: '图片4.6', description: '人像一致性保持更好，性价比更高', is_new: true },
            { id: 'image_4.5', name: '图片4.5', description: '强化一致性、风格与图文响应', is_new: false },
            { id: 'image_4.1', name: '图片4.1', description: '更专业的创意、美学和一致性保持', is_new: false },
            { id: 'image_4.0', name: '图片4.0', description: '支持多参考图、系列组图生成', is_new: false }
        ];
    }
    
    // 渲染模型选项
    models.forEach((model, index) => {
        const modelOption = document.createElement('div');
        modelOption.className = 'model-option';
        modelOption.setAttribute('data-model-id', model.id);
        
        const badgeHtml = model.is_new ? '<span class="model-badge">New</span>' : '';
        
        modelOption.innerHTML = `
            <div class="model-icon"><i class="fas fa-paper-plane"></i></div>
            <div class="model-info">
                <div class="model-name">${model.name}${badgeHtml}</div>
                <div class="model-desc">${model.description || ''}</div>
            </div>
        `;
        
        imageModelDropdown.appendChild(modelOption);
    });
    
    // 重新绑定点击事件
    bindModelOptionEvents();
    
    console.log('✅ 图片模型列表渲染完成，共', models.length, '个模型');
}

/**
 * 渲染视频模型列表到 DOM
 * @param {Array} models 视频模型数组
 */
function renderVideoModels(models) {
    // 查找视频模型下拉菜单容器
    const videoModelDropdown = document.querySelector('#videoModelDropdown .dropdown-menu');
    if (!videoModelDropdown) {
        console.warn('未找到视频模型下拉菜单容器');
        return;
    }
    
    // 清空现有内容（保留 header）
    const header = videoModelDropdown.querySelector('.model-panel-header');
    videoModelDropdown.innerHTML = '';
    if (header) {
        header.textContent = '请选择模型';
        videoModelDropdown.appendChild(header);
    }
    
    // 添加默认选项
    const defaultOption = document.createElement('div');
    defaultOption.className = 'model-option active';
    defaultOption.setAttribute('data-model-id', '');
    defaultOption.innerHTML = `
        <div class="model-icon"><i class="fas fa-cube"></i></div>
        <div class="model-info">
            <div class="model-name">-- 请选择模型 --</div>
            <div class="model-desc">根据比例和分辨率自动推荐</div>
        </div>
        <div class="model-check"><i class="fas fa-check"></i></div>
    `;
    videoModelDropdown.appendChild(defaultOption);
    
    // 更新触发按钮显示为默认
    const triggerBtn = document.querySelector('#videoModelDropdown > span');
    if (triggerBtn) {
        triggerBtn.textContent = '-- 请选择 --';
    }
    
    // 如果没有模型数据，使用默认硬编码
    if (!models || models.length === 0) {
        console.warn('没有获取到视频模型，使用默认硬编码');
        models = [
            { id: 'seedance_2.0_fast_vip', name: 'Seedance 2.0 Fast VIP', description: '极速推理，会员专属通道，音视文图均可参考', is_new: true, is_vip: true },
            { id: 'seedance_2.0_vip', name: 'Seedance 2.0 VIP', description: '全模态能力，会员专属通道，音视文图均可参考', is_new: true, is_vip: true },
            { id: 'seedance_2.0_fast', name: 'Seedance 2.0 Fast', description: '高性价比，音视文图均可参考', is_new: true, is_vip: false },
            { id: 'seedance_2.0', name: 'Seedance 2.0', description: '全能王者，音视文图均可参考', is_new: true, is_vip: false, free_trial: true }
        ];
    }
    
    // 渲染模型选项
    models.forEach((model, index) => {
        const modelOption = document.createElement('div');
        modelOption.className = 'model-option';
        modelOption.setAttribute('data-model-id', model.id);
        
        const vipBadge = model.is_vip ? '<span class="model-badge-diamond">&#10022;</span>' : '';
        const newBadge = model.is_new ? '<span class="model-badge">New</span>' : '';
        const freeBadge = model.free_trial ? '<span class="model-badge-special">限免1次</span>' : '';
        
        modelOption.innerHTML = `
            <div class="model-icon"><i class="fas fa-cube"></i></div>
            <div class="model-info">
                <div class="model-name">${model.name}${vipBadge}${newBadge}${freeBadge}</div>
                <div class="model-desc">${model.description || ''}</div>
            </div>
        `;
        
        videoModelDropdown.appendChild(modelOption);
    });
    
    // 重新绑定点击事件
    bindModelOptionEvents();
    
    console.log('✅ 视频模型列表渲染完成，共', models.length, '个模型');
}

/**
 * 绑定模型选项点击事件
 */
function bindModelOptionEvents() {
    document.querySelectorAll('.model-option').forEach(option => {
        // 移除旧的事件监听器（通过克隆）
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        newOption.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = newOption.closest('.dropdown-menu');
            if (!menu) return;
            
            // 移除其他选项的 active 状态
            menu.querySelectorAll('.model-option').forEach(opt => {
                opt.classList.remove('active');
                const check = opt.querySelector('.model-check');
                if (check) check.remove();
            });
            
            // 添加当前选项的 active 状态
            newOption.classList.add('active');
            if (!newOption.querySelector('.model-check')) {
                const checkDiv = document.createElement('div');
                checkDiv.className = 'model-check';
                checkDiv.innerHTML = '<i class="fas fa-check"></i>';
                newOption.appendChild(checkDiv);
            }
            
            // 更新触发按钮文本
            const parentDrop = menu.closest('.control-dropdown');
            const labelSpan = parentDrop?.querySelector('span:first-child');
            const nameEl = newOption.querySelector('.model-name');
            if (labelSpan && nameEl) {
                // 提取纯文本（去掉 badge）
                const modelName = nameEl.childNodes[0]?.textContent?.trim() || nameEl.textContent.trim();
                labelSpan.textContent = modelName;
            }
            
            // 关闭下拉菜单
            menu.style.display = 'none';
            
            console.log('🎯 已选择模型:', newOption.getAttribute('data-model-id'));
        });
    });
}

/**
 * 刷新模型列表（根据当前选择的比例和分辨率）
 */
async function refreshModelsWithParams() {
    console.log('🔄 根据参数刷新模型列表...');
    
    const params = getCurrentParams();
    console.log('当前参数:', params);
    
    // 获取带参数的模型列表
    const models = await fetchModelsWithParams(params);
    
    // 根据场景类型渲染对应的模型列表
    if (params.sceneType === 'image') {
        renderImageModels(models.image_models);
    } else if (params.sceneType === 'video') {
        renderVideoModels(models.video_models);
    }
    
    console.log('✅ 模型列表已根据参数刷新');
}

/**
 * 绑定比例和分辨率选择事件
 */
function bindRatioResolutionEvents() {
    // 图片场景的比例选择
    document.querySelectorAll('#imageRatioResDropdown .ratio-item').forEach(item => {
        item.addEventListener('click', async () => {
            // 延迟一下，等待UI更新完成
            setTimeout(async () => {
                await refreshModelsWithParams();
            }, 100);
        });
    });
    
    // 图片场景的分辨率选择
    document.querySelectorAll('#imageRatioResDropdown .resolution-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            setTimeout(async () => {
                await refreshModelsWithParams();
            }, 100);
        });
    });
    
    // 视频场景的比例选择
    document.querySelectorAll('#videoRatioResDropdown .ratio-item').forEach(item => {
        item.addEventListener('click', async () => {
            setTimeout(async () => {
                await refreshModelsWithParams();
            }, 100);
        });
    });
    
    // 视频场景的分辨率选择
    document.querySelectorAll('#videoRatioResDropdown .resolution-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            setTimeout(async () => {
                await refreshModelsWithParams();
            }, 100);
        });
    });
    
    console.log('✅ 比例和分辨率选择事件已绑定');
}

/**
 * 初始化模型列表（页面加载时调用）
 */
async function initModels() {
    console.log('🚀 开始初始化模型列表...');
    
    // 首先测试 API 连通性
    const isConnected = await testApiConnection();
    
    if (!isConnected) {
        console.warn('⚠️ API 未连通，将使用默认硬编码模型');
        showToast('无法连接到后端服务，使用默认模型', 'warning');
        // 使用默认硬编码渲染
        renderImageModels([]);
        renderVideoModels([]);
    } else {
        // API 连通，获取真实模型列表（带当前参数）
        await refreshModelsWithParams();
    }
    
    // 绑定比例和分辨率变化事件
    bindRatioResolutionEvents();
    
    console.log('✅ 模型列表初始化完成');
}

// ======================== 登录页面相关 ========================
function initLoginTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
}

// ⚠️ 【模拟API - 登录】当前仅做非空判断后直接跳转，未调用真实登录接口
//    真实后端需替换为：POST /api/v1/auth/login { username, password } → 获取 token 存入 localStorage
function initLoginForm() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const username = document.getElementById('username')?.value;
            const password = document.getElementById('password')?.value;
            if (username && password) {
                window.location.href = 'pc_community.html';
            } else {
                alert('请输入账号和密码');
            }
        });
    }
}

// ======================== 生成页面核心：发送按钮与消息反馈 ========================
function initSendButton() {
    // 查找发送按钮（class="send-btn"）和聊天容器
    const sendBtn = document.querySelector('.send-btn');
    const chatInput = document.querySelector('.chat-input');
    const chatMessages = document.querySelector('.chat-messages');

    if (!sendBtn) {
        console.warn('未找到发送按钮 .send-btn');
        return;
    }
    if (!chatInput) {
        console.warn('未找到输入框 .chat-input');
        return;
    }
    if (!chatMessages) {
        console.warn('未找到消息容器 .chat-messages');
        return;
    }

    // 移除可能存在的旧监听器，避免重复绑定
    sendBtn.removeEventListener('click', handleSend);
    sendBtn.addEventListener('click', handleSend);

    // 也支持回车键发送
    chatInput.removeEventListener('keypress', handleKeyPress);
    chatInput.addEventListener('keypress', handleKeyPress);

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    async function handleSend() {
        const prompt = chatInput.value.trim();
        if (!prompt) {
            showToast('请输入描述内容', 'warning');
            return;
        }

        const modelName = getCurrentModelName();

        // 1. 添加用户消息
        addUserMessage(prompt);
        // 清空输入框
        chatInput.value = '';

        // 2. 添加“生成中...”的 bot 消息
        const loadingMsg = addLoadingMessage(modelName);

        // 调用生成接口，端点由 buildGenerateRequest() 返回
        try {
            const sceneType = getActiveSceneType();
            const requestBody = buildGenerateRequest(prompt, sceneType);
            const response = await postJson(requestBody.endpoint, requestBody.body);
            if (response.code !== 200) {
                throw new Error(response.message || '生成接口返回异常');
            }

            const taskId = response.data?.task_id;
            if (!taskId) {
                throw new Error('后端未返回任务ID');
            }

            const taskResult = await pollTaskStatus(taskId, 20);
            renderTaskResult(loadingMsg, taskResult, sceneType);
        } catch (error) {
            console.error('生成失败', error);
            updateLoadingToResult(loadingMsg, 'error', { message: error.message || '生成失败，请稍后重试' });
        }
    }

    // 获取当前可见场景中的选中模型名称
    function getCurrentModelName() {
        const visibleScene = Array.from(document.querySelectorAll('.scene-controls')).find(scene => {
            return window.getComputedStyle(scene).display !== 'none';
        });
        let activeModel = visibleScene?.querySelector('.model-option.active') || document.querySelector('.model-option.active');
        if (!activeModel) {
            const dropdownLabel = document.querySelector('.control-dropdown.model-dropdown span');
            return dropdownLabel ? dropdownLabel.textContent.trim() : '大模型';
        }
        const nameEl = activeModel.querySelector('.model-name');
        return nameEl ? nameEl.textContent.trim() : activeModel.textContent.trim();
    }

    function getActiveSceneType() {
        const scene = Array.from(document.querySelectorAll('.scene-controls')).find(scene => {
            return window.getComputedStyle(scene).display !== 'none';
        });
        if (!scene) return 'image';
        if (scene.classList.contains('video-scene')) return 'video';
        if (scene.classList.contains('digital-human-scene')) return 'digital-human';
        if (scene.classList.contains('voiceover-scene')) return 'voiceover';
        if (scene.classList.contains('agent-scene')) return 'agent';
        return 'image';
    }

    function getSelectedModelId() {
        const activeModel = document.querySelector('.model-option.active');
        if (activeModel) {
            return activeModel.getAttribute('data-model-id') || activeModel.textContent.trim();
        }
        const fallback = document.querySelector('.control-dropdown.model-dropdown span');
        return fallback ? fallback.textContent.trim() : '';
    }

    function getSelectedRatio() {
        const activeRatio = document.querySelector('.ratio-item.active');
        return activeRatio?.getAttribute('data-ratio') || activeRatio?.textContent.trim() || '1:1';
    }

    function getSelectedResolution() {
        return document.querySelector('.resolution-btn.active')?.getAttribute('data-res') || document.querySelector('.res-label')?.textContent.trim() || '2K';
    }

    function getSelectedCount() {
        return parseInt(document.querySelector('.qty-item.active')?.getAttribute('data-count') || '3', 10);
    }

    function getSelectedDuration() {
        return parseInt(document.querySelector('.duration-item.active')?.getAttribute('data-duration') || '4', 10);
    }

    // ⚠️ 【模拟数据 - 硬编码音色】当前固定返回 'voice_001'，真实后端应从 GET /api/v1/models 获取可用音色列表
    function getSelectedVoiceId() {
        return 'voice_001';
    }

    function getSelectedAgentType() {
        const text = document.querySelector('.selected-type')?.textContent.trim().toLowerCase() || 'image';
        if (text.includes('图') || text.includes('image')) return 'image';
        if (text.includes('视') || text.includes('video')) return 'video';
        return 'image';
    }

    // ⚠️ 【模拟API - 请求构建器】根据场景类型构建不同的API请求
    //    以下5个端点当前均为模拟实现，替换真实后端时需确保请求/响应格式一致：
    //    - /generate/image          → POST 图片生成
    //    - /generate/video/text-to-video → POST 文生视频
    //    - /generate/digital-human  → POST 数字人生成
    //    - /generate/voiceover      → POST 配音生成
    //    - /generate/agent          → POST Agent模式生成
    //    默认模型等参数当前为硬编码，真实后端应从 GET /api/v1/models 动态获取
    function buildGenerateRequest(prompt, sceneType) {
        const modelId = getSelectedModelId();
        const ratio = getSelectedRatio();
        const resolution = getSelectedResolution();

        if (sceneType === 'video') {
            return {
                endpoint: '/generate/video/text-to-video',
                body: {
                    prompt,
                    model: modelId || 'seedance_2.0_fast',
                    ratio,
                    resolution,
                    duration: getSelectedDuration()
                }
            };
        }

        if (sceneType === 'digital-human') {
            return {
                endpoint: '/generate/digital-human',
                body: {
                    character_image: '',
                    voice_id: getSelectedVoiceId(),
                    speech_content: document.querySelector('#speechContent')?.value.trim() || prompt,
                    action_description: document.querySelector('#actionDesc')?.value.trim() || ''
                }
            };
        }

        if (sceneType === 'voiceover') {
            return {
                endpoint: '/generate/voiceover',
                body: {
                    voice_id: getSelectedVoiceId(),
                    content: document.querySelector('#voiceoverContent')?.value.trim() || prompt,
                    speed: 1.0,
                    pitch: 1.0
                }
            };
        }

        if (sceneType === 'agent') {
            return {
                endpoint: '/generate/agent',
                body: {
                    prompt,
                    type: getSelectedAgentType(),
                    model: modelId || 'image_5.0_lite',
                    ratio,
                    resolution
                }
            };
        }

        return {
            endpoint: '/generate/image',
            body: {
                prompt,
                model: modelId || 'image_5.0_lite',
                ratio,
                resolution,
                count: getSelectedCount()
            }
        };
    }

    // ✅ 【API请求封装】通用POST请求函数
    //    使用 API_CONFIG.BASE_URL 作为基础路径
    async function postJson(path, body) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`网络请求失败: ${response.status} ${response.statusText} ${text}`);
        }
        return response.json();
    }

    // ✅ 【API - 任务轮询】轮询查询生成任务状态
    //    轮询 GET /generate/task/{taskId}，每2秒一次，最多20次
    async function pollTaskStatus(taskId, maxAttempts = 20) {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const response = await fetch(`${API_CONFIG.BASE_URL}/generate/task/${taskId}`, {
                method: 'GET',
                headers
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`任务查询失败: ${response.status} ${response.statusText} ${text}`);
            }
            const data = await response.json();
            if (data.code !== 200) {
                throw new Error(data.message || '任务查询返回异常');
            }
            const task = data.data;
            if (task.status === 'completed') {
                return task;
            }
            if (task.status === 'failed') {
                throw new Error('后台任务执行失败');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('任务超时，请稍后查看生成结果');
    }

    // ⚠️ 【模拟数据 - 结果渲染】根据后端返回的 task result 渲染生成结果
    //    期望的 result 数据结构（需与真实后端保持一致）：
    //    - image:    { images: [{ id, url }] }
    //    - video:    { video: { id, url, duration } }
    //    - voiceover:{ audio: { id, url } }
    //    - 其他:     { message: string }
    function renderTaskResult(loadingElem, taskResult, sceneType) {
        const result = taskResult.result || {};
        const modelName = getCurrentModelName();
        const feedbackText = `模型 ${modelName} 已生成完成，任务ID：${taskResult.task_id}`;
        if (sceneType === 'video' && result.video?.url) {
            updateLoadingToResult(loadingElem, 'video', {
                feedback: feedbackText,
                videoUrl: result.video.url
            });
            return;
        }
        if (sceneType === 'image' && Array.isArray(result.images)) {
            updateLoadingToResult(loadingElem, 'image', {
                feedback: feedbackText,
                images: result.images.map(img => img.url || img)
            });
            return;
        }
        if (sceneType === 'voiceover' && result.audio?.url) {
            updateLoadingToResult(loadingElem, 'video', {
                feedback: feedbackText,
                videoUrl: result.audio.url
            });
            return;
        }
        if (taskResult.status === 'completed') {
            updateLoadingToResult(loadingElem, 'text', {
                feedback: feedbackText
            });
            return;
        }
        updateLoadingToResult(loadingElem, 'error', { message: '未能识别生成结果，请检查后端返回。' });
    }

    // 辅助函数：添加用户消息
    function addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message message-user';
        msgDiv.innerHTML = `<div class="message-content"><div class="message-text">${escapeHtml(text)}</div></div>`;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    // 辅助函数：添加“生成中...”消息，返回该消息元素
    function addLoadingMessage(modelName) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message message-bot';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">模型 ${escapeHtml(modelName)} 正在生成，请稍候...</div>
                <div class="message-loading"><i class="fas fa-spinner fa-spin"></i></div>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        scrollToBottom();
        return loadingDiv;
    }

    // 辅助函数：将 loading 消息替换为最终结果
    function updateLoadingToResult(loadingElem, type, data) {
        const feedbackText = data.feedback || '大模型已返回结果。';
        if (type === 'image') {
            const imagesHtml = (data.images || []).map(url => `<div class="image-item"><img src="${url}" alt="生成的图片"></div>`).join('');
            loadingElem.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(feedbackText)}</div>
                    <div class="message-images">${imagesHtml}</div>
                </div>
            `;
        } else if (type === 'video') {
            loadingElem.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(feedbackText)}</div>
                    <div class="message-video">
                        <video controls src="${data.videoUrl}" style="max-width:100%; border-radius:8px;"></video>
                    </div>
                </div>
            `;
        } else if (type === 'text') {
            loadingElem.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(feedbackText)}</div>
                </div>
            `;
        } else {
            loadingElem.innerHTML = `
                <div class="message-content">
                    <div class="message-text" style="color:#e53e3e;">❌ ${escapeHtml(data.message || '生成失败')}</div>
                </div>
            `;
        }
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 简单的防XSS
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
}

// ======================== 资产页面（保留原有功能） ========================
function initAssetFilters() { /* 保持不变 */ }
function initAssetDelete() { /* 保持不变 */ }
function initAdminNav() { /* 保持不变 */ }
function initCommunityInteraction() { /* 保持不变 */ }
function initFileUpload() { /* 保持不变 */ }
function initPagination() { /* 保持不变 */ }
function initSearch() { /* 保持不变 */ }
function initBatchActions() { /* 保持不变 */ }
function initDynamicChat() { /* 保持不变 */ }

// ======================== UI 组件初始化（下拉菜单、比例等） ========================
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.control-dropdown');
    dropdowns.forEach(dropdown => {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!menu) return;
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.style.display === 'block';
            document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
            menu.style.display = isOpen ? 'none' : 'block';
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.style.display = 'none');
    });
    // 下拉选项点击更新文本
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = item.closest('.dropdown-menu');
            const parentDrop = item.closest('.control-dropdown');
            if (parentDrop) {
                const labelSpan = parentDrop.querySelector('span:first-child');
                if (labelSpan && !labelSpan.querySelector('i')) {
                    labelSpan.textContent = item.textContent.trim();
                }
            }
            if (menu) {
                menu.querySelectorAll('.dropdown-item').forEach(opt => opt.classList.remove('active'));
                item.classList.add('active');
                menu.style.display = 'none';
            }
        });
    });

    // 专门处理模型选择项
    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = option.closest('.dropdown-menu');
            if (!menu) return;
            menu.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            const parentDrop = menu.closest('.control-dropdown');
            const labelSpan = parentDrop?.querySelector('span:first-child');
            const nameEl = option.querySelector('.model-name');
            const labelText = nameEl ? nameEl.textContent.trim() : option.textContent.trim();
            if (labelSpan) {
                labelSpan.textContent = labelText;
            }
            menu.style.display = 'none';
        });
    });
}

function initRatioButtons() {
    // 比例按钮（用于 agent 面板等）
    document.querySelectorAll('.ratio-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('.ratio-grid');
            if (container) {
                container.querySelectorAll('.ratio-item').forEach(r => r.classList.remove('active'));
                btn.classList.add('active');
            }
            // 如果该比例按钮位于某个下拉菜单内，同时更新上级显示文本
            const parentDropdown = btn.closest('.control-dropdown');
            if (parentDropdown) {
                const labelSpan = parentDropdown.querySelector('span:first-child');
                if (labelSpan) labelSpan.textContent = btn.querySelector('span')?.textContent || btn.textContent;
            }
        });
    });
    // 分辨率按钮
    document.querySelectorAll('.resolution-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('.resolution-options');
            if (container) {
                container.querySelectorAll('.resolution-btn').forEach(r => r.classList.remove('active'));
                btn.classList.add('active');
            }
            const parentDropdown = btn.closest('.control-dropdown');
            if (parentDropdown) {
                const resLabel = parentDropdown.querySelector('.res-label');
                if (resLabel) resLabel.textContent = btn.textContent.trim();
            }
        });
    });
}

function initResolutionSelector() { /* 保留空实现或合并到上面 */ }
function initQuantitySelector() {
    const qtyItems = document.querySelectorAll('.qty-item');
    qtyItems.forEach(item => {
        item.addEventListener('click', () => {
            const container = item.closest('.quantity-dropdown');
            if (container) {
                container.querySelectorAll('.qty-item').forEach(q => q.classList.remove('active'));
                item.classList.add('active');
            }
            const parentDrop = item.closest('.control-dropdown');
            if (parentDrop) {
                const targetSpan = parentDrop.querySelector('span:not(.qty-item)');
                if (targetSpan) targetSpan.textContent = item.textContent + ' / 张';
            }
        });
    });
}

// 场景切换（保留原有但确保不覆盖发送按钮）
function initSceneSwitch() {
    const sceneItems = document.querySelectorAll('.dropdown-item[data-scene]');
    sceneItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const scene = item.getAttribute('data-scene');
            // 切换显示对应的面板
            document.querySelectorAll('.scene-controls').forEach(ctrl => ctrl.style.display = 'none');
            document.querySelectorAll('.digital-human-inputs, .voiceover-inputs').forEach(extra => extra.style.display = 'none');
            if (scene === 'video') {
                document.querySelector('.video-scene').style.display = 'flex';
            } else if (scene === 'digital-human') {
                document.querySelector('.digital-human-scene').style.display = 'flex';
                document.querySelector('.digital-human-inputs').style.display = 'block';
            } else if (scene === 'voiceover') {
                document.querySelector('.voiceover-scene').style.display = 'flex';
                document.querySelector('.voiceover-inputs').style.display = 'block';
            } else if (scene === 'agent') {
                document.querySelector('.agent-scene').style.display = 'flex';
            } else {
                document.querySelector('.image-scene').style.display = 'flex';
            }
            // 更新所有场景中的 active 样式
            sceneItems.forEach(si => si.classList.remove('active'));
            document.querySelectorAll(`.dropdown-item[data-scene="${scene}"]`).forEach(si => si.classList.add('active'));
            item.closest('.dropdown-menu').style.display = 'none';
        });
    });
}

// Agent 自定义面板相关
function initAgentPanel() {
    const customBtn = document.querySelector('.custom-btn');
    const panel = document.querySelector('.agent-custom-panel');
    if (customBtn && panel) {
        customBtn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
    }
    const autoToggle = document.getElementById('autoToggle');
    if (autoToggle) {
        autoToggle.addEventListener('change', function() {
            const modelDropdowns = panel?.querySelectorAll('.model-dropdown') || [];
            const sliderCircle = this.nextElementSibling?.querySelector('span');
            if (this.checked) {
                if (sliderCircle) sliderCircle.style.transform = 'translateX(20px)';
                modelDropdowns.forEach(d => { d.style.opacity = '0.5'; d.style.pointerEvents = 'none'; });
            } else {
                if (sliderCircle) sliderCircle.style.transform = 'translateX(0)';
                modelDropdowns.forEach(d => { d.style.opacity = '1'; d.style.pointerEvents = 'auto'; });
            }
        });
    }
    // 标签页切换
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', function() {
            const panel = this.closest('.agent-custom-panel');
            if (!panel) return;
            panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            panel.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            panel.querySelector(`.${tab}-tab`).style.display = 'block';
        });
    });
}

// 剩余的原函数（占位，避免报错）
function initGenerateTypes() {}
function initGenerateButton() {}
function initNewGenerateButton() {} // 已用 initSendButton 替代
function initAll() {
    initLoginTabs();
    initLoginForm();
    initAssetFilters();
    initAssetDelete();
    initAdminNav();
    initCommunityInteraction();
    initFileUpload();
    initPagination();
    initSearch();
    initBatchActions();
    initDynamicChat();
    initDropdowns();
    initRatioButtons();
    initResolutionSelector();
    initQuantitySelector();
    initSceneSwitch();
    initAgentPanel();
    initSendButton();      // 核心：绑定发送按钮
    initModels();          // 🆕 初始化模型列表（从API获取）
}

// 页面加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}