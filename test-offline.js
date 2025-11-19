const readline = require('readline');
const fs = require('fs-extra');

class OfflineBotTester {
    constructor() {
        this.chatSessions = new Map();
        this.sessionsFile = './test-chat-sessions.json';
        this.currentUser = 'test-user@test.com';
        this.loadChatSessions();

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('Bot de WhatsApp - Modo de Prueba');
        console.log('====================================');
        console.log('Escribe tus mensajes como si fuera WhatsApp');
        console.log('Escribe "salir" para terminar\n');

        this.startTesting();
    }

    async startTesting() {
        this.showWelcome();
        this.promptUser();
    }

    showWelcome() {
        console.log('Bot conectado correctamente!');
        console.log('Ahora puedes empezar a chatear...\n');
    }

    promptUser() {
        this.rl.question('Tú: ', async (input) => {
            if (input.toLowerCase() === 'salir' || input.toLowerCase() === 'exit') {
                console.log('\n========================================');
                console.log('Cerrando modo de prueba...');
                console.log('========================================');
                await this.cleanup();
                console.log('\nAdiós! Sesión de prueba terminada.');
                this.rl.close();
                process.exit(0);
                return;
            }

            const response = await this.handleMessage(input);

            // Handle both single response and array of responses
            const responses = Array.isArray(response) ? response : [response];

            for (const msg of responses) {
                console.log(`\nBot: ${msg}\n`);
            }

            this.promptUser();
        });
    }

    async cleanup() {
        try {
            console.log('Limpiando datos de sesión de prueba...');

            // Delete test chat sessions file
            if (fs.existsSync('./test-chat-sessions.json')) {
                fs.unlinkSync('./test-chat-sessions.json');
                console.log('✓ Historial de pruebas eliminado');
            }

            console.log('✓ Todos los datos de prueba limpiados.');
        } catch (error) {
            console.error('Error durante la limpieza:', error);
        }
    }

    async handleMessage(messageText) {
        const chatId = this.currentUser;

        // Ignore empty messages
        const msgLower = messageText.trim().toLowerCase();
        if (!msgLower || msgLower === '') {
            return 'Mensaje vacío ignorado.';
        }

        let session = this.chatSessions.get(chatId) || {
            currentMenu: 'main',
            history: [],
            menuHistory: [],
            lastActivity: new Date()
        };

        session.history.push({
            timestamp: new Date(),
            message: messageText,
            type: 'user'
        });

        let response;

        switch (session.currentMenu) {
            case 'main':
                response = await this.handleMainMenu(msgLower, session);
                break;
            case 'recruitment':
                response = await this.handleRecruitmentMenu(msgLower, session);
                break;
            case 'information':
                response = await this.handleInformationMenu(msgLower, session);
                break;
            default:
                response = await this.handleMainMenu(msgLower, session);
                break;
        }

        if (response) {
            // Handle both single response and array of responses
            const responses = Array.isArray(response) ? response : [response];

            for (const msg of responses) {
                session.history.push({
                    timestamp: new Date(),
                    message: msg,
                    type: 'bot'
                });
            }
        }

        session.lastActivity = new Date();
        this.chatSessions.set(chatId, session);
        this.saveChatSessions();

        return response;
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

    async handleChatHistoryMenu(messageText, session) {
        if (messageText === 'back' || messageText === 'menu') {
            session.currentMenu = 'main';
            return this.getMainMenu();
        }

        if (messageText === 'full' || messageText === '1') {
            return this.getFullChatHistory(session);
        }

        if (messageText === 'recent' || messageText === '2') {
            return this.getRecentHistory(session, 10);
        }

        if (messageText === 'clear' || messageText === '3') {
            session.history = [];
            session.currentMenu = 'main';
            return "Chat history cleared!\n\n" + this.getMainMenu();
        }

        return this.getChatHistoryMenu(session);
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
            return `*¿Dónde estamos ubicados?*

Nos encontramos en:

Av. Francisco Villa #880c
Col. Las Gaviotas
Puerto Vallarta

atrás | menu`;
        }

        if (messageText === '2' || messageText === 'empresa' || messageText === 'más información') {
            session.viewingOption = true;
            return `*¿Dónde puedo encontrar más información sobre la empresa?*

Toda la información sobre nuestros servicios y nuestra trayectoria está disponible en nuestro sitio web.

Te invitamos a explorarlo para tener una visión completa:
https://semjoseguridad.com/

atrás | menu`;
        }

        if (messageText === '3' || messageText === 'horarios' || messageText === 'horario') {
            session.viewingOption = true;
            return `*¿Cuáles son nuestros horarios de atención?*

Lunes a Viernes:
Turno matutino: 9:00 AM - 2:00 PM
Turno vespertino: 3:00 PM - 5:00 PM

Sábados y domingos permanecemos cerrados.

atrás | menu`;
        }

        if (messageText === '4' || messageText === 'inclusion' || messageText === 'inclusión') {
            session.viewingOption = true;
            return `*¿Cuál es nuestra política de inclusión?*

Aquí lo que realmente importa es tu talento y tus ganas de crecer.

Creamos un espacio de trabajo seguro y respetuoso donde la diversidad nos enriquece.

Sin importar quién eres, en Grupo Semjo eres bienvenido/a.

atrás | menu`;
        }

        if (messageText === '5' || messageText === 'beneficios') {
            session.viewingOption = true;
            return `*¿Qué beneficios ofrecemos?*

Nuestro compromiso es ofrecer condiciones laborales superiores:

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
        return `*¿Cómo puedo aplicar a la vacante?*

Para avanzar en el proceso, ayúdanos a completar los datos en el siguiente enlace, por favor:

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
            `Interesting! You said: "${message}". What are your thoughts on that?`,
            `I see you mentioned: "${message}". How does that make you feel?`,
            `"${message}" - that's worth exploring further. Can you elaborate?`,
            `Got it: "${message}". What would you like to discuss next?`,
            `That's fascinating: "${message}". I'd love to hear more about your perspective.`,
            `You brought up: "${message}". That reminds me of something interesting...`,
            `"${message}" - I can see why that's important to you. What's next?`
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
                console.log(`Cargadas ${this.chatSessions.size} sesiones de prueba`);
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
}

// Start the offline tester
const tester = new OfflineBotTester();

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
    console.log('\n\n========================================');
    console.log('Cerrando modo de prueba...');
    console.log('========================================');
    await tester.cleanup();
    console.log('\nAdiós! Sesión de prueba terminada.');
    process.exit(0);
});

// Also handle SIGTERM for graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n\n========================================');
    console.log('Cerrando modo de prueba...');
    console.log('========================================');
    await tester.cleanup();
    console.log('\nAdiós! Sesión de prueba terminada.');
    process.exit(0);
});