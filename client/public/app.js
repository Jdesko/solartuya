// Elementos da página
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const messageBox = document.getElementById('messageBox');
const deviceDataDiv = document.getElementById('deviceData');

// Variáveis globais
let accessToken = null;
let credentials = null;

// Mostrar mensagens
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

// Obter token de acesso via backend
async function getAccessToken() {
    const clientId = document.getElementById('clientId').value.trim();
    const clientSecret = document.getElementById('clientSecret').value.trim();
    
    if (!clientId || !clientSecret) {
        throw new Error('Client ID e Client Secret são obrigatórios');
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId, clientSecret })
        });

        const data = await response.json();
        
        if (data.success) {
            accessToken = data.result.access_token;
            return accessToken;
        } else {
            throw new Error(data.msg || 'Erro ao obter token');
        }
    } catch (error) {
        throw new Error(`Erro de conexão: ${error.message}`);
    }
}

// Obter dados do dispositivo via backend
async function getDeviceData(deviceId) {
    if (!accessToken) {
        throw new Error('Token de acesso não disponível');
    }

    try {
        const response = await fetch(`/api/device/${deviceId}/status`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            return data.result;
        } else {
            throw new Error(data.msg || 'Erro ao obter dados do dispositivo');
        }
    } catch (error) {
        throw new Error(`Erro ao carregar dados: ${error.message}`);
    }
}

// Exibir dados do dispositivo
function displayDeviceData(deviceData) {
    if (!deviceData || !Array.isArray(deviceData)) {
        deviceDataDiv.innerHTML = `
            <div class="device-card">
                <div class="device-header">
                    <div class="device-name">⚠️ Sem Dados</div>
                    <div class="status-badge status-offline">offline</div>
                </div>
                <p>Nenhum dado disponível para este dispositivo.</p>
            </div>
        `;
        return;
    }

    // Converter dados para formato mais fácil de usar
    const statusMap = {};
    deviceData.forEach(item => {
        statusMap[item.code] = item.value;
    });

    let html = '';

    // Verificar se temos dados de energia
    if (statusMap.cur_power || statusMap.cur_power1) {
        html += `
            <div class="device-card">
                <div class="device-header">
                    <div class="device-name">⚡ Monitor de Energia</div>
                    <div class="status-badge status-${statusMap.device_state || statusMap.device_state1 || 'working'}">
                        ${statusMap.device_state || statusMap.device_state1 || 'online'}
                    </div>
                </div>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-value">${statusMap.cur_power || statusMap.cur_power1 || 0}W</div>
                        <div class="metric-label">Potência Atual</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${((statusMap.cur_current || statusMap.cur_current1 || 0) / 1000).toFixed(2)}A</div>
                        <div class="metric-label">Corrente</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${((statusMap.cur_voltage || statusMap.cur_voltage1 || 0) / 10).toFixed(1)}V</div>
                        <div class="metric-label">Tensão</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${((statusMap.total_energy || statusMap.total_energy1 || 0) / 1000).toFixed(2)}</div>
                        <div class="metric-label">kWh Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    deviceDataDiv.innerHTML = html || `
        <div class="device-card">
            <div class="device-header">
                <div class="device-name">📊 Dados do Dispositivo</div>
                <div class="status-badge status-working">online</div>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${deviceData.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <span style="opacity: 0.8;">${item.code}:</span>
                        <strong>${item.value}</strong>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Função de login
async function handleLogin() {
    const clientId = document.getElementById('clientId').value.trim();
    const clientSecret = document.getElementById('clientSecret').value.trim();
    const deviceId = document.getElementById('deviceId').value.trim();

    if (!clientId || !clientSecret || !deviceId) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = '🔄 Conectando...';

    try {
        credentials = { clientId, clientSecret, deviceId };
        await getAccessToken();
        
        const deviceData = await getDeviceData(deviceId);
        
        loginPage.classList.remove('active');
        dashboardPage.classList.add('active');
        displayDeviceData(deviceData);
        
    } catch (error) {
        showMessage(`Erro: ${error.message}`, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '🔐 Conectar à Tuya Cloud';
    }
}

// Atualizar dados
async function refreshData() {
    if (!credentials) return;

    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Atualizando...';

    try {
        const deviceData = await getDeviceData(credentials.deviceId);
        displayDeviceData(deviceData);
        showMessage('✅ Dados atualizados com sucesso!', 'success');
    } catch (error) {
        showMessage(`Erro ao atualizar: ${error.message}`, 'error');
    }

    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 Atualizar Dados';
}

// Função de logout
function handleLogout() {
    dashboardPage.classList.remove('active');
    loginPage.classList.add('active');
    
    credentials = null;
    accessToken = null;
    
    document.getElementById('clientId').value = '';
    document.getElementById('clientSecret').value = '';
    document.getElementById('deviceId').value = '';
    
    loginBtn.disabled = false;
    loginBtn.textContent = '🔐 Conectar à Tuya Cloud';
    
    messageBox.style.display = 'none';
}

// Event listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
refreshBtn.addEventListener('click', refreshData);

// Permitir login com Enter
['clientId', 'clientSecret', 'deviceId'].forEach(id => {
    document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
});