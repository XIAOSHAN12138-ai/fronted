// ============================================================
// ✅ 【API对接说明】本文件已实现与后端 API 的对接
// 
// 已实现的接口：
//    1. GET  /api/v1/models              → 获取模型列表（initModels）
//    2. POST /api/v1/generate            → 统一生成接口（postJson）
//    3. GET  /api/v1/tasks/{task_id}     → 任务状态查询（pollTaskStatus）
//    4. POST /api/v1/tasks/{task_id}/cancel → 取消任务（cancelTask）
// 
// 配置方式：
//    - 修改 API_CONFIG.BASE_URL 为真实后端地址
//    - 当前默认: 'http://localhost:8003/api/v1'
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
    BASE_URL: 'http://192.168.31.243:8003/api/v1',
    
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

let uploadedFiles = [];

const HISTORY_STORAGE_KEY = 'platform_generated_files';

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
    
    const isConnected = await testApiConnection();
    
    if (!isConnected) {
        console.warn('⚠️ API 未连通，将使用默认硬编码模型');
        showToast('无法连接到后端服务，使用默认模型', 'warning');
        renderImageModels([]);
        renderVideoModels([]);
    } else {
        const models = await fetchModels();
        if (models.image_models && models.image_models.length > 0) {
            renderImageModels(models.image_models);
        } else {
            renderImageModels([]);
        }
        if (models.video_models && models.video_models.length > 0) {
            renderVideoModels(models.video_models);
        } else {
            renderVideoModels([]);
        }
    }
    
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

// ======================== 文件上传与预览 ========================
function initFileUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadMenu = document.getElementById('uploadMenu');
    const localFileInput = document.getElementById('localFileInput');
    const previewContainer = document.getElementById('uploadedFilesPreview');
    const historyModalOverlay = document.getElementById('historyModalOverlay');
    const historyModalClose = document.getElementById('historyModalClose');
    const historyModalBody = document.getElementById('historyModalBody');
    const historyConfirmBtn = document.getElementById('historyConfirmBtn');

    if (!uploadBtn || !previewContainer) return;

    let selectedHistoryFiles = [];

    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        uploadMenu.classList.remove('show');
    });

    uploadMenu.querySelector('[data-action="local"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadMenu.classList.remove('show');
        localFileInput.click();
    });

    uploadMenu.querySelector('[data-action="history"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadMenu.classList.remove('show');
        openHistoryModal();
    });

    localFileInput.addEventListener('change', () => {
        const files = Array.from(localFileInput.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileType = file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'other';
                uploadedFiles.push({
                    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    type: fileType,
                    url: reader.result,
                    name: file.name,
                    purpose: 'reference'
                });
                renderFilePreviews();
            };
            reader.readAsDataURL(file);
        });
        localFileInput.value = '';
    });

    function openHistoryModal() {
        selectedHistoryFiles = [];
        renderHistoryFiles();
        historyModalOverlay.style.display = 'flex';
    }

    function renderHistoryFiles() {
        const history = getHistoryFiles();
        if (history.length === 0) {
            historyModalBody.innerHTML = '<div class="history-empty">暂无历史生成文件</div>';
            return;
        }
        historyModalBody.innerHTML = history.map(file => {
            const isSelected = selectedHistoryFiles.some(f => f.id === file.id);
            const mediaContent = file.type === 'image'
                ? `<img src="${file.url}" alt="${file.name || ''}">`
                : `<video src="${file.url}" muted></video>`;
            return `<div class="history-file-item${isSelected ? ' selected' : ''}" data-file-id="${file.id}">
                ${mediaContent}
            </div>`;
        }).join('');

        historyModalBody.querySelectorAll('.history-file-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.getAttribute('data-file-id');
                const file = history.find(f => f.id === fileId);
                if (!file) return;
                const idx = selectedHistoryFiles.findIndex(f => f.id === fileId);
                if (idx >= 0) {
                    selectedHistoryFiles.splice(idx, 1);
                    item.classList.remove('selected');
                } else {
                    selectedHistoryFiles.push(file);
                    item.classList.add('selected');
                }
            });
        });
    }

    historyConfirmBtn.addEventListener('click', () => {
        selectedHistoryFiles.forEach(file => {
            if (!uploadedFiles.some(f => f.id === file.id)) {
                uploadedFiles.push({ ...file, purpose: 'reference' });
            }
        });
        renderFilePreviews();
        historyModalOverlay.style.display = 'none';
    });

    historyModalClose.addEventListener('click', () => {
        historyModalOverlay.style.display = 'none';
    });

    historyModalOverlay.addEventListener('click', (e) => {
        if (e.target === historyModalOverlay) {
            historyModalOverlay.style.display = 'none';
        }
    });

    function renderFilePreviews() {
        if (uploadedFiles.length === 0) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
            return;
        }
        previewContainer.style.display = 'flex';
        previewContainer.innerHTML = uploadedFiles.map((file, index) => {
            let content;
            if (file.type === 'image') {
                content = `<img src="${file.url}" alt="${file.name || ''}">`;
            } else if (file.type === 'video') {
                content = `<video src="${file.url}" muted></video>`;
            } else if (file.type === 'audio') {
                content = `<div class="file-type-icon"><i class="fas fa-volume-up"></i></div>`;
            } else {
                content = `<div class="file-type-icon"><i class="fas fa-file"></i></div>`;
            }
            return `<div class="file-preview-item" data-file-index="${index}">
                ${content}
                <button class="file-preview-delete" data-delete-index="${index}">&times;</button>
            </div>`;
        }).join('');

        previewContainer.querySelectorAll('.file-preview-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-delete-index'), 10);
                uploadedFiles.splice(idx, 1);
                renderFilePreviews();
            });
        });
    }
}

function getHistoryFiles() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function addToHistory(file) {
    const history = getHistoryFiles();
    history.unshift({
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: file.type || 'image',
        url: file.url || file,
        name: file.name || ''
    });
    if (history.length > 50) history.length = 50;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
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

    let currentAbortController = null;
    let isSending = false;
    let currentTaskId = null;

    function setButtonState(sending) {
        isSending = sending;
        if (sending) {
            sendBtn.classList.add('sending');
            sendBtn.querySelector('i').className = 'fas fa-stop';
        } else {
            sendBtn.classList.remove('sending');
            sendBtn.querySelector('i').className = 'fas fa-paper-plane';
            currentAbortController = null;
            currentTaskId = null;
        }
    }

    sendBtn.removeEventListener('click', handleSendClick);
    sendBtn.addEventListener('click', handleSendClick);

    chatInput.removeEventListener('keypress', handleKeyPress);
    chatInput.addEventListener('keypress', handleKeyPress);

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    }

    function handleSendClick() {
        if (isSending) {
            handleStop();
        } else {
            handleSend();
        }
    }

    function handleStop() {
        if (currentAbortController) {
            currentAbortController.abort();
        }
        if (currentTaskId) {
            cancelTask(currentTaskId);
        }
        setButtonState(false);
        showToast('已中止生成', 'info');
    }

    async function cancelTask(taskId) {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            await fetch(`${API_CONFIG.BASE_URL}/tasks/${taskId}/cancel`, {
                method: 'POST',
                headers
            });
        } catch (e) {
            console.warn('取消任务请求失败:', e);
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
        // 清空已上传文件
        uploadedFiles = [];
        renderFilePreviewsAfterSend();

        // 2. 添加“生成中...”的 bot 消息
        const loadingMsg = addLoadingMessage(modelName);

        // 调用生成接口，端点由 buildGenerateRequest() 返回
        currentAbortController = new AbortController();
        setButtonState(true);

        try {
            const sceneType = getActiveSceneType();
            const requestBody = buildGenerateRequest(prompt, sceneType);
            const response = await postJson(requestBody.endpoint, requestBody.body, currentAbortController.signal);
            if (response.code !== 200) {
                throw new Error(response.message || '生成接口返回异常');
            }

            currentTaskId = response.data?.task_id;
            if (!currentTaskId) {
                throw new Error('后端未返回任务ID');
            }

            const taskResult = await pollTaskStatus(currentTaskId, 20, currentAbortController.signal);
            renderTaskResult(loadingMsg, taskResult, sceneType);
        } catch (error) {
            if (error.name === 'AbortError') {
                updateLoadingToResult(loadingMsg, 'text', { feedback: '生成已中止' });
            } else {
                console.error('生成失败', error);
                updateLoadingToResult(loadingMsg, 'error', { message: error.message || '生成失败，请稍后重试' });
            }
        } finally {
            setButtonState(false);
        }
    }

    function renderFilePreviewsAfterSend() {
        const previewContainer = document.getElementById('uploadedFilesPreview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
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
        return parseInt(document.querySelector('.dropdown-item.active[data-duration]')?.getAttribute('data-duration') || '4', 10);
    }

    function getSelectedRefMode() {
        return document.querySelector('.dropdown-item.active[data-ref-mode]')?.getAttribute('data-ref-mode') || 'all';
    }

    function mapRefModeToFeature(refMode) {
        const featureMap = {
            'all': 'global_reference',
            'firstlast': 'first_last_frame',
            'multiframe': 'multi_reference',
            'text-to-video': 'text_to_video',
            'object-repair': 'global_reference',
            'color-restore': 'global_reference',
            'smart-remove': 'global_reference',
            'object-replace': 'global_reference',
            'effect-replicate': 'template_effect',
            'ai-outfit': 'global_reference',
            'scene-replace': 'global_reference',
            'local-adjust': 'global_reference',
            'motion-imitate': 'motion_control',
            'first-frame-gen': 'global_reference',
            'lip-sync': 'lip_sync',
            'style-replace': 'template_effect'
        };
        return featureMap[refMode] || 'global_reference';
    }

    // ⚠️ 【模拟数据 - 硬编码音色】当前固定返回 'voice_001'，真实后端应从 GET /api/v1/models 获取可用音色列表
    function getSelectedVoiceId() {
        return 'voice_001';
    }

    // ✅ 【API - 请求构建器】根据场景类型构建统一的生成请求
    //    统一端点: POST /api/v1/generate
    //    请求格式: { output_type, model, feature, parameters, prompt, input_files }
    function buildGenerateRequest(prompt, sceneType) {
        const modelId = getSelectedModelId();
        const ratio = getSelectedRatio();
        const resolution = getSelectedResolution();
        const inputFiles = buildInputFiles();

        if (sceneType === 'video') {
            const refMode = getSelectedRefMode();
            const feature = mapRefModeToFeature(refMode);
            const params = {
                resolution: resolution || '1080P',
                duration: getSelectedDuration(),
                ratio: ratio || '16:9'
            };
            if (feature === 'lip_sync') {
                params.face_id = 0;
                params.audio_start_time = 0;
                params.audio_volume = 1.0;
                params.original_audio_volume = 0.0;
            }
            if (feature === 'motion_control') {
                params.keep_original_sound = 'no';
            }
            if (feature === 'template_effect') {
                params.template = 'morphlab';
            }
            return {
                endpoint: '/generate',
                body: {
                    output_type: 'video',
                    model: modelId || 'kling_3.0',
                    feature: feature,
                    parameters: params,
                    prompt: prompt,
                    input_files: inputFiles
                }
            };
        }

        if (sceneType === 'digital-human') {
            return {
                endpoint: '/generate',
                body: {
                    output_type: 'digital_human',
                    model: modelId || 'kling_2.6',
                    feature: 'digital_human',
                    parameters: {
                        voice_id: getSelectedVoiceId(),
                        action_description: document.querySelector('#actionDesc')?.value.trim() || ''
                    },
                    prompt: document.querySelector('#speechContent')?.value.trim() || prompt,
                    input_files: inputFiles
                }
            };
        }

        return {
            endpoint: '/generate',
            body: {
                output_type: 'image',
                model: modelId || 'image_5.0_lite',
                feature: getSelectedImageFeature(),
                parameters: {
                    resolution: resolution || '1080P',
                    ratio: ratio || '1:1',
                    count: getSelectedCount()
                },
                prompt: prompt,
                input_files: inputFiles
            }
        };
    }

    function buildInputFiles() {
        return uploadedFiles.map(file => ({
            type: file.type,
            url: file.url,
            purpose: file.purpose || 'reference',
            object_id: file.object_id || undefined
        }));
    }

    function getSelectedImageFeature() {
        const activeFunc = document.querySelector('.function-selector .dropdown-item.active');
        if (!activeFunc) return 'text_to_image';
        const funcName = activeFunc.getAttribute('data-function') || activeFunc.textContent.trim();
        const featureMap = {
            '文生图': 'text_to_image',
            '参考图': 'image_reference',
            '风格转换': 'style_transfer',
            '局部重绘': 'inpainting',
            '扩图': 'outpainting',
            '消除笔': 'object_removal',
            'AI换脸': 'face_swap',
            'AI换装': 'outfit_change'
        };
        return featureMap[funcName] || 'text_to_image';
    }

    // ✅ 【API请求封装】通用POST请求函数
    //    使用 API_CONFIG.BASE_URL 作为基础路径
    async function postJson(path, body, signal = null) {
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
            body: JSON.stringify(body),
            signal
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`网络请求失败: ${response.status} ${response.statusText} ${text}`);
        }
        return response.json();
    }

    // ✅ 【API - 任务轮询】轮询查询生成任务状态
    //    轮询 GET /tasks/{taskId}/status，每2秒一次，最多20次
    async function pollTaskStatus(taskId, maxAttempts = 20, signal = null) {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (signal?.aborted) {
                throw new DOMException('任务轮询已中止', 'AbortError');
            }
            const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/${taskId}/status`, {
                method: 'GET',
                headers,
                signal
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

    // ✅ 【API - 结果渲染】根据后端返回的 task result 渲染生成结果
    //    期望的 result 数据结构（与 API 文档一致）：
    //    - image:    { images: [{ id, url }] }
    //    - video:    { video_url, thumbnail_url }
    //    - digital_human: { video_url, thumbnail_url }
    function renderTaskResult(loadingElem, taskResult, sceneType) {
        const result = taskResult.result || {};
        const modelName = getCurrentModelName();
        const feedbackText = `模型 ${modelName} 已生成完成，任务ID：${taskResult.task_id}`;
        if ((sceneType === 'video' || sceneType === 'digital-human') && result.video_url) {
            addToHistory({ type: 'video', url: result.video_url, name: taskResult.task_id });
            updateLoadingToResult(loadingElem, 'video', {
                feedback: feedbackText,
                videoUrl: result.video_url
            });
            return;
        }
        if (sceneType === 'image' && Array.isArray(result.images)) {
            result.images.forEach(img => {
                addToHistory({ type: 'image', url: img.url || img, name: img.id || '' });
            });
            updateLoadingToResult(loadingElem, 'image', {
                feedback: feedbackText,
                images: result.images.map(img => img.url || img)
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

function initSceneSwitch() {
    const sceneItems = document.querySelectorAll('.dropdown-item[data-scene]');
    sceneItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const scene = item.getAttribute('data-scene');
            document.querySelectorAll('.scene-controls').forEach(ctrl => ctrl.style.display = 'none');
            document.querySelectorAll('.digital-human-inputs').forEach(extra => extra.style.display = 'none');
            if (scene === 'video') {
                document.querySelector('.video-scene').style.display = 'flex';
            } else if (scene === 'digital-human') {
                document.querySelector('.digital-human-scene').style.display = 'flex';
                document.querySelector('.digital-human-inputs').style.display = 'block';
            } else {
                document.querySelector('.image-scene').style.display = 'flex';
            }
            sceneItems.forEach(si => si.classList.remove('active'));
            document.querySelectorAll(`.dropdown-item[data-scene="${scene}"]`).forEach(si => si.classList.add('active'));
            document.querySelectorAll('.scene-controls').forEach(ctrl => {
                const firstDropdown = ctrl.querySelector('.control-dropdown');
                if (firstDropdown) {
                    const labelSpan = firstDropdown.querySelector('span:first-child');
                    if (labelSpan && !labelSpan.querySelector('i')) {
                        const activeItem = ctrl.querySelector(`.dropdown-item[data-scene="${scene}"]`);
                        if (activeItem) {
                            labelSpan.textContent = activeItem.textContent.trim();
                        }
                    }
                }
            });
            item.closest('.dropdown-menu').style.display = 'none';

            refreshModelsWithParams();
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
    initSendButton();      // 核心：绑定发送按钮
    initModels();          // 🆕 初始化模型列表（从API获取）
}

// 页面加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}