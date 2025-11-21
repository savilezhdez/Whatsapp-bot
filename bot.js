const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './sessions'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        this.chatSessions = new Map();
        this.sessionsFile = './chat-sessions.json';
        this.lastMessageTime = Date.now();
        this.healthCheckInterval = null;
        this.loadChatSessions();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('\n========================================');
            console.log('Escanea este código QR con tu WhatsApp:');
            console.log('========================================\n');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('authenticated', () => {
            console.log('✓ Autenticación exitosa!');
        });

        this.client.on('auth_failure', async (msg) => {
            console.error('\n========================================');
            console.error('Error de autenticación:', msg);
            console.error('========================================');
            console.log('Limpiando sesiones antiguas y reiniciando...\n');
            this.stopHealthCheck();
            try {
                if (this.client) await this.client.destroy();
            } catch (e) { /* already destroyed */ }
            await this.clearWhatsAppSession();
            await this.restart();
        });

        this.client.on('ready', async () => {
            console.log('\n========================================');
            console.log('✓ Bot de WhatsApp listo!');
            console.log('========================================\n');

            // Set up browser disconnect handler
            try {
                const browser = await this.client.pupBrowser;
                browser.on('disconnected', async () => {
                    console.log('⚠ Navegador desconectado inesperadamente');
                    this.stopHealthCheck();

                    // Try to destroy client first to release file locks
                    try {
                        if (this.client) {
                            await this.client.destroy();
                        }
                    } catch (e) {
                        // Client might already be destroyed, that's ok
                    }

                    await this.clearWhatsAppSession();
                    await this.restart();
                });
            } catch (error) {
                console.log('No se pudo configurar manejador de desconexión del navegador');
            }

            this.startHealthCheck();
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log('Cargando...', percent, message);
        });

        this.client.on('change_state', state => {
            console.log('Estado cambiado a:', state);
        });

        this.client.on('message', async (message) => {
            await this.handleMessage(message);
        });

        // Handle remote logout (when user disconnects from WhatsApp settings)
        this.client.on('remote_session_saved', async () => {
            console.log('\n========================================');
            console.log('⚠ Sesión cerrada remotamente desde WhatsApp');
            console.log('========================================');
            await this.handleRemoteLogout();
        });

        this.client.on('disconnected', async (reason) => {
            console.log('\n========================================');
            console.log('Cliente desconectado:', reason);
            console.log('========================================');

            try {
                // Stop health check before restarting
                this.stopHealthCheck();

                // Always clear sessions and restart on disconnect
                console.log('Limpiando sesiones y reiniciando...\n');

                // Destroy client first
                try {
                    if (this.client) await this.client.destroy();
                } catch (e) {
                    console.log('Cliente ya destruido');
                }

                await this.clearWhatsAppSession();
                await this.restart();
            } catch (error) {
                console.error('Error manejando desconexión:', error.message);
                console.log('Intentando reinicio forzado...');
                await this.forceRestart();
            }
        });
    }

    async handleRemoteLogout() {
        try {
            console.log('Procesando cierre de sesión remoto...');
            this.stopHealthCheck();

            // Destroy client
            try {
                if (this.client) await this.client.destroy();
            } catch (e) { /* ignore */ }

            // Clear all session data
            await this.clearWhatsAppSession();

            // Restart to get new QR
            console.log('Reiniciando para generar nuevo QR...\n');
            await this.restart();
        } catch (error) {
            console.error('Error en logout remoto:', error.message);
            await this.forceRestart();
        }
    }

    async forceRestart() {
        try {
            console.log('\n========================================');
            console.log('REINICIO FORZADO');
            console.log('========================================\n');

            // Stop everything
            this.stopHealthCheck();

            // Force delete sessions with retries
            for (let i = 0; i < 3; i++) {
                try {
                    if (fs.existsSync('./sessions')) {
                        fs.removeSync('./sessions');
                        break;
                    }
                } catch (e) {
                    if (i === 2) console.log('No se pudo eliminar sessions, continuando...');
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // Clear chat sessions
            try {
                if (fs.existsSync('./chat-sessions.json')) {
                    fs.unlinkSync('./chat-sessions.json');
                }
            } catch (e) { /* ignore */ }

            this.chatSessions.clear();

            // Create completely new client
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './sessions'
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            this.lastMessageTime = Date.now();
            this.setupEventHandlers();
            await this.client.initialize();

            console.log('✓ Reinicio forzado completado\n');
        } catch (error) {
            console.error('Error crítico en reinicio forzado:', error);
            console.log('\n⚠️  Por favor, cierra y vuelve a abrir el bot manualmente.');
        }
    }

    async clearWhatsAppSession() {
        try {
            // Wait for browser to fully close before deleting files
            console.log('Esperando a que el navegador cierre completamente...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Clear chat sessions first (easier to delete)
            if (fs.existsSync('./chat-sessions.json')) {
                fs.unlinkSync('./chat-sessions.json');
                console.log('✓ Historial de conversaciones eliminado');
            }

            this.chatSessions.clear();

            // Try to delete sessions folder with retry logic
            await this.deleteSessionsFolder();

        } catch (error) {
            console.error('Error limpiando sesiones:', error.message);
            console.log('Continuando con el reinicio...');
        }
    }

    async deleteSessionsFolder(retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                if (fs.existsSync('./sessions')) {
                    // Try to delete
                    fs.removeSync('./sessions');
                    console.log('✓ Sesión de WhatsApp eliminada');
                    return;
                } else {
                    // Folder doesn't exist, we're good
                    return;
                }
            } catch (error) {
                if (error.code === 'EPERM' && i < retries - 1) {
                    console.log(`⚠ Carpeta sessions ocupada, reintentando en ${(i + 1) * 2}s... (intento ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
                } else if (error.code === 'EPERM') {
                    console.log('⚠ No se pudo eliminar la carpeta sessions (está en uso).');
                    console.log('Se eliminará automáticamente en el próximo inicio.');
                    return; // Continue anyway
                } else {
                    throw error;
                }
            }
        }
    }

    async restart() {
        try {
            console.log('Reiniciando el bot...\n');

            // Stop health check first
            this.stopHealthCheck();

            // Destroy current client
            if (this.client) {
                await this.client.destroy();
            }

            // Reset last message time
            this.lastMessageTime = Date.now();

            // Create new client with fresh session
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './sessions'
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            // Re-setup event handlers
            this.setupEventHandlers();

            // Initialize
            await this.client.initialize();
        } catch (error) {
            console.error('Error reiniciando el bot:', error);
            console.log('Por favor, cierra el programa y vuelve a iniciarlo.');
        }
    }

    startHealthCheck() {
        console.log('✓ Monitoreo de salud activado');

        // Check connection health every 60 seconds (reduced frequency to avoid overload)
        this.healthCheckInterval = setInterval(async () => {
            try {
                // Check if client and puppeteer are still alive
                if (!this.client || !this.client.pupPage) {
                    console.log('⚠ Cliente o página cerrada. Reiniciando...');
                    this.stopHealthCheck();
                    try {
                        if (this.client) await this.client.destroy();
                    } catch (e) { /* already destroyed */ }
                    await this.clearWhatsAppSession();
                    await this.restart();
                    return;
                }

                const state = await this.client.getState();
                const now = Date.now();
                const timeSinceLastMessage = Math.floor((now - this.lastMessageTime) / 1000);

                console.log(`[Health Check] Estado: ${state} | Último mensaje hace: ${timeSinceLastMessage}s`);

                // If state is not CONNECTED, try to reconnect
                if (state !== 'CONNECTED') {
                    console.log('⚠ Bot no está conectado. Intentando reconectar...');
                    this.stopHealthCheck();
                    try {
                        if (this.client) await this.client.destroy();
                    } catch (e) { /* already destroyed */ }
                    await this.clearWhatsAppSession();
                    await this.restart();
                }
            } catch (error) {
                // Check if error is due to session/page being closed
                if (error.message && (error.message.includes('Session closed') ||
                    error.message.includes('Target closed') ||
                    error.message.includes('Protocol error'))) {
                    console.error('⚠ Sesión de navegador cerrada detectada.');
                    console.log('Reiniciando bot...');
                    this.stopHealthCheck();
                    try {
                        if (this.client) await this.client.destroy();
                    } catch (e) { /* already destroyed */ }
                    await this.clearWhatsAppSession();
                    await this.restart();
                } else {
                    console.error('Error en health check:', error.message);
                }
            }
        }, 60000); // Check every 60 seconds
    }

    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('✓ Monitoreo de salud detenido');
        }
    }

    clearChatMemories() {
        try {
            // Clear in-memory chat sessions
            this.chatSessions.clear();
            console.log('✓ Memorias en RAM limpiadas');

            // Delete chat sessions file
            if (fs.existsSync('./chat-sessions.json')) {
                fs.unlinkSync('./chat-sessions.json');
                console.log('✓ Archivo de sesiones eliminado');
            }

            // NOTE: We do NOT delete the WhatsApp auth session (./sessions folder)
            // This way the bot stays connected and doesn't need to scan QR again
        } catch (error) {
            console.error('Error limpiando memorias de chat:', error.message);
        }
    }

    async handleMessage(message) {
        // Update last message time to track activity
        this.lastMessageTime = Date.now();

        // Ignore status broadcasts
        if (message.from === 'status@broadcast') return;
        // Ignore bot's own messages to prevent loops
        if (message.fromMe) return;
        // Ignore media messages
        if (message.hasMedia) return;
        // Ignore group chats - only respond to individual chats
        if (message.from.endsWith('@g.us')) {
            console.log('Ignored group message from:', message.from);
            return;
        }

        const chatId = message.from;
        const messageText = message.body.trim().toLowerCase();

        // Ignore empty messages
        if (!messageText || messageText === '') {
            console.log(`[${new Date().toLocaleTimeString()}] Ignored empty message from ${chatId}`);
            return;
        }

        // Ignore messages from saved contacts (only respond to unknown numbers)
        // IMPORTANT: This is READ-ONLY - we only check, never modify or delete contacts
        try {
            const contact = await message.getContact();

            // Extra safety: verify contact object exists and has the property we need
            if (!contact) {
                console.log(`[${new Date().toLocaleTimeString()}] Contact info not available, treating as unknown number`);
                // Continue to respond - better safe than sorry
            } else if (typeof contact.isMyContact !== 'boolean') {
                console.log(`[${new Date().toLocaleTimeString()}] Contact.isMyContact property not available, treating as unknown number`);
                // Continue to respond - property might not be loaded yet
            } else if (contact.isMyContact === true) {
                // Contact is saved - ignore message
                const contactName = contact.name || contact.pushname || 'Unknown';
                console.log(`[${new Date().toLocaleTimeString()}] ✋ Ignored message from SAVED contact: "${contactName}" (${chatId})`);
                console.log(`   → Contact filter is working correctly (READ-ONLY check)`);
                return; // Don't respond to saved contacts
            } else {
                // Contact is NOT saved - this is an unknown number, respond to it
                console.log(`[${new Date().toLocaleTimeString()}] ✅ Unknown number detected, bot will respond`);
            }
        } catch (error) {
            // If ANY error occurs checking contact status, respond anyway
            console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Error checking contact: ${error.message}`);
            console.log(`   → Continuing to respond (fail-safe mode)`);
            console.log(`   → NOTE: Bot ONLY reads contacts, NEVER modifies or deletes them`);
            // Continue execution - better to respond than to miss a potential customer
        }

        // Log incoming message for debugging
        console.log(`[${new Date().toLocaleTimeString()}] Message from ${chatId}: "${message.body}"`);

        let session = this.chatSessions.get(chatId) || {
            currentMenu: 'main',
            history: [],
            menuHistory: [],
            lastActivity: new Date()
        };

        session.history.push({
            timestamp: new Date(),
            message: message.body,
            type: 'user'
        });

        let response;

        switch (session.currentMenu) {
            case 'main':
                response = await this.handleMainMenu(messageText, session);
                break;
            case 'recruitment':
                response = await this.handleRecruitmentMenu(messageText, session);
                break;
            case 'information':
                response = await this.handleInformationMenu(messageText, session);
                break;
            default:
                response = await this.handleMainMenu(messageText, session);
                break;
        }

        if (response) {
            // Check if response is an array (multiple messages)
            const responses = Array.isArray(response) ? response : [response];

            // Log outgoing message for debugging
            console.log(`Replying to ${chatId} with ${responses.length} message(s)`);

            // Send each message separately
            for (let i = 0; i < responses.length; i++) {
                const msg = responses[i];

                session.history.push({
                    timestamp: new Date(),
                    message: msg,
                    type: 'bot'
                });

                // Reply ONLY to the message sender
                await message.reply(msg);

                // Small delay between messages if there are multiple
                if (i < responses.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        session.lastActivity = new Date();
        this.chatSessions.set(chatId, session);
        this.saveChatSessions();
    }

    async handleMainMenu(messageText, session) {
        if (messageText === '1' || messageText === 'reclutamiento' || messageText === 'proceso' || messageText === 'trabajo') {
            session.menuHistory.push('main');
            session.currentMenu = 'recruitment';
            return this.getRecruitmentMenu();
        }

        if (messageText === '2' || messageText === 'información' || messageText === 'info' || messageText === 'empresa') {
            session.menuHistory.push('main');
            session.currentMenu = 'information';
            return this.getInformationMenu();
        }

        // Check if this is the first message (only 1 item in history = the message we just pushed)
        const isFirstMessage = session.history.length === 1;

        if (isFirstMessage) {
            // First message - just show welcome menu without error
            return this.getMainMenu();
        }

        // Invalid option - send error and menu as separate messages
        return [
            'Opción no válida. Por favor, selecciona una opción del menú.',
            this.getMainMenu()
        ];
    }

    async handleRecruitmentMenu(messageText, session) {
        if (messageText === 'menu' || messageText === 'menú') {
            session.menuHistory = [];
            session.currentMenu = 'main';
            return this.getMainMenu();
        }

        if (messageText === 'atrás' || messageText === 'atras' || messageText === 'back' || messageText === 'volver') {
            if (session.menuHistory.length > 0) {
                const previousMenu = session.menuHistory.pop();
                session.currentMenu = previousMenu;

                // Return the appropriate menu based on where we're going back to
                switch (previousMenu) {
                    case 'main':
                        return this.getMainMenu();
                    case 'recruitment':
                        return this.getRecruitmentMenu();
                    case 'information':
                        return this.getInformationMenu();
                    default:
                        return this.getMainMenu();
                }
            } else {
                // No history, go to main menu
                session.currentMenu = 'main';
                return this.getMainMenu();
            }
        }

        // Check if user is trying to use numbers or keywords - inform them this section has no options
        if (messageText === '1' || messageText === '2' ||
            messageText === 'reclutamiento' || messageText === 'proceso' || messageText === 'trabajo' ||
            messageText === 'información' || messageText === 'info' || messageText === 'empresa') {
            return [
                'Esta sección no tiene opciones para seleccionar. La información de reclutamiento está arriba.',
                'Para volver al menú principal, escribe: menu'
            ];
        }

        // Any other input - show a gentle reminder
        return 'Para volver al menú principal, escribe: menu';
    }

    async handleInformationMenu(messageText, session) {
        if (messageText === 'menu' || messageText === 'menú') {
            session.menuHistory = [];
            session.currentMenu = 'main';
            session.viewingOption = false;
            return this.getMainMenu();
        }

        if (messageText === 'atrás' || messageText === 'atras' || messageText === 'back' || messageText === 'volver') {
            // If viewing an option response, go back to the menu
            if (session.viewingOption) {
                session.viewingOption = false;
                return this.getInformationMenu();
            }

            // Otherwise, go back in navigation history
            if (session.menuHistory.length > 0) {
                const previousMenu = session.menuHistory.pop();
                session.currentMenu = previousMenu;

                // Return the appropriate menu based on where we're going back to
                switch (previousMenu) {
                    case 'main':
                        return this.getMainMenu();
                    case 'recruitment':
                        return this.getRecruitmentMenu();
                    case 'information':
                        return this.getInformationMenu();
                    default:
                        return this.getMainMenu();
                }
            } else {
                // No history, go to main menu
                session.currentMenu = 'main';
                return this.getMainMenu();
            }
        }

        if (messageText === '1' || messageText === 'ubicados' || messageText === 'ubicación') {
            session.viewingOption = true;
            return `Nos encontramos en:

Av. Francisco Villa #880c
Col. Las Gaviotas
Puerto Vallarta

atrás | menu`;
        }

        if (messageText === '2' || messageText === 'empresa' || messageText === 'más información') {
            session.viewingOption = true;
            return `Toda la información sobre nuestros servicios y nuestra trayectoria está disponible en nuestro sitio web.

Te invitamos a explorarlo para tener una visión completa:
https://semjoseguridad.com/

atrás | menu`;
        }

        if (messageText === '3' || messageText === 'horarios' || messageText === 'horario') {
            session.viewingOption = true;
            return `Lunes a Viernes:
Turno matutino: 9:00 AM - 2:00 PM
Turno vespertino: 3:00 PM - 5:00 PM

Sábados y domingos permanecemos cerrados.

atrás | menu`;
        }

        if (messageText === '4' || messageText === 'inclusion' || messageText === 'inclusión') {
            session.viewingOption = true;
            return `Aquí lo que realmente importa es tu talento y tus ganas de crecer.

Creamos un espacio de trabajo seguro y respetuoso donde la diversidad nos enriquece.

Sin importar quién eres, en Grupo Semjo eres bienvenido/a.

atrás | menu`;
        }

        if (messageText === '5' || messageText === 'beneficios') {
            session.viewingOption = true;
            return `Nuestro compromiso es ofrecer condiciones laborales superiores:

- Todas las prestaciones de ley
- Puntualidad absoluta en tus pagos
- Esquema de bonos por productividad
- Oportunidades tangibles de crecimiento
- Estabilidad de tener descansos fijos

atrás | menu`;
        }

        // Invalid option - send error and menu as separate messages
        session.viewingOption = false;
        return [
            'Opción no válida. Por favor, selecciona una opción del menú.',
            this.getInformationMenu()
        ];
    }

    getMainMenu() {
        return `Hola! Bienvenido

1. Proceso de Reclutamiento
2. Información General`;
    }

    getRecruitmentMenu() {
        return `Para avanzar en el proceso, ayúdanos a completar los datos en el siguiente enlace, por favor:

https://forms.gle/tHHQGEDpPcRUe6T1A

Tu perfil será revisado y serás contactado para informarte sobre las siguientes etapas.

atrás | menu`;
    }

    getInformationMenu() {
        return `1. ¿Dónde están ubicados?
2. Más información sobre la empresa
3. Horarios de atención
4. Política de inclusión
5. Beneficios que ofrecemos

atrás | menu`;
    }

    getChatHistoryMenu(session) {
        const messageCount = session.history.length;
        const lastActivity = session.lastActivity ?
            new Date(session.lastActivity).toLocaleString() : 'Never';

        return `*Chat History Menu*

*Statistics:*
- Total messages: ${messageCount}
- Last activity: ${lastActivity}

*Options:*
1. View Full History
2. View Recent Messages (last 10)
3. Clear History

Type "back" to return to main menu`;
    }

    getFullChatHistory(session) {
        if (session.history.length === 0) {
            return "No chat history found.";
        }

        let history = "*Full Chat History:*\n\n";
        session.history.forEach((entry, index) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const sender = entry.type === 'user' ? 'You' : 'Bot';
            history += `${index + 1}. [${time}] ${sender}: ${entry.message}\n\n`;
        });

        history += "\nType 'back' to return to history menu";
        return history;
    }

    getRecentHistory(session, count = 5) {
        if (session.history.length === 0) {
            return "No recent chat history found.";
        }

        const recentMessages = session.history.slice(-count);
        let history = `*Recent Chat History (last ${count}):*\n\n`;

        recentMessages.forEach((entry, index) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const sender = entry.type === 'user' ? 'You' : 'Bot';
            history += `${index + 1}. [${time}] ${sender}: ${entry.message}\n\n`;
        });

        return history;
    }

    generateConversationResponse(message) {
        const responses = [
            `Thanks for sharing: "${message}". Tell me more!`,
            `Interesting! You said: "${message}". What's your thoughts on that?`,
            `I see you mentioned: "${message}". How does that make you feel?`,
            `"${message}" - that's worth exploring further. Can you elaborate?`,
            `Got it: "${message}". What would you like to discuss next?`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    loadChatSessions() {
        try {
            if (fs.existsSync(this.sessionsFile)) {
                const data = fs.readFileSync(this.sessionsFile, 'utf8');
                const sessions = JSON.parse(data);

                for (const [key, value] of Object.entries(sessions)) {
                    this.chatSessions.set(key, value);
                }
                console.log(`Cargadas ${this.chatSessions.size} sesiones de chat`);
            }
        } catch (error) {
            console.error('Error cargando sesiones:', error);
        }
    }

    saveChatSessions() {
        try {
            const sessionsObj = Object.fromEntries(this.chatSessions);
            fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsObj, null, 2));
        } catch (error) {
            console.error('Error guardando sesiones:', error);
        }
    }

    async start() {
        try {
            console.log('Iniciando el bot de WhatsApp...\n');
            await this.client.initialize();
        } catch (error) {
            console.error('\n========================================');
            console.error('Error iniciando el bot:', error);
            console.error('========================================');
            console.log('Limpiando sesiones y reintentando...\n');
            await this.clearWhatsAppSession();
            await this.restart();
        }
    }
}

const bot = new WhatsAppBot();
bot.start();

// Cleanup function to clear chat session data ONLY
// NOTE: Does NOT delete WhatsApp authentication - bot will reconnect automatically
async function cleanupChatSessionsOnly() {
    try {
        console.log('Limpiando memorias de chat...');

        // Delete chat sessions file (conversation history)
        if (fs.existsSync('./chat-sessions.json')) {
            fs.unlinkSync('./chat-sessions.json');
            console.log('✓ Historial de conversaciones eliminado');
        }

        // NOTE: We do NOT delete ./sessions folder here
        // This preserves WhatsApp authentication so no QR scan is needed on restart

        console.log('✓ Memorias de chat limpiadas. WhatsApp se reconectará automáticamente.');
    } catch (error) {
        console.error('Error durante la limpieza:', error);
    }
}

// Handle shutdown signals
process.on('SIGINT', async () => {
    console.log('\n\n========================================');
    console.log('Deteniendo el bot...');
    console.log('========================================');

    bot.stopHealthCheck();
    await bot.client.destroy();
    await cleanupChatSessionsOnly(); // Only clear chat memories, keep WhatsApp auth

    console.log('\nBot detenido correctamente. ¡Hasta pronto!');
    process.exit(0);
});

// Also handle SIGTERM for graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n\n========================================');
    console.log('Deteniendo el bot...');
    console.log('========================================');

    bot.stopHealthCheck();
    await bot.client.destroy();
    await cleanupChatSessionsOnly(); // Only clear chat memories, keep WhatsApp auth

    console.log('\nBot detenido correctamente. ¡Hasta pronto!');
    process.exit(0);
});