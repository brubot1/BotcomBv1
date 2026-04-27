# 📦 Project Scan: botBv1

Generated: 2026-04-20 18:33:12.017432

## 🌳 Project Structure

```
📁 botBv1/
├── package.json
├── Funcionou.txt
├── config.js
├── index.js
├── botBv2_scan.md
├── sticker.js
├── inviteRank.js
│   ├── welcomeHandler.js
│   ├── groupHandler.js
│   ├── protectionHandler.js
│   ├── stickerHandler.js
│   ├── toImageHandler.js
│   ├── removeBgHandler.js
│   ├── stickerPackHandler.js
│   ├── circleHandler.js
│   ├── menuHandler.js
│   ├── antiLinkHandler.js
│   ├── antiSpamHandler.js
│   ├── mediaUtils.js
│   ├── protectionUtils.js
```

---

## 📜 Files (20 arquivos)


### 📄 `package.json`

```
{
  "name": "sticker-bot-md",
  "version": "1.0.0",
  "description": "Bot de Figurinhas para WhatsApp",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "qr": "node index.js --qr",
    "clean": "rm -rf sessions"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.4.0",
    "axios": "^1.6.0",
    "wa-sticker-formatter": "^4.3.2",
    "node-webpmux": "^3.1.1",
    "sharp": "^0.32.0",
    "qrcode-terminal": "^0.12.0",
    "pino": "^8.0.0",
    "file-type": "^18.0.0",
"form-data": "^4.0.0"
  },
  "keywords": ["whatsapp", "bot", "sticker"],
  "author": "Seu Nome",
  "license": "MIT"
}

```


### 📄 `Funcionou.txt`

```
✅ Funcionalidades Implementadas:

· Figurinhas de imagens - Funcionando perfeitamente
· Figurinhas de vídeos - Agora funcionando!
· Sistema de cache inteligente - Sem bloqueios
· Comandos úteis - !ping, !espaco, !help
· Reconexão automática - Bot se reconecta sozinho
//9 de abr. 2016
· comando !toimg adicionado
· comando !bg (isso tira o fundo da imagem e faz o sticker sem fundo
· comando sticker em data base adicionado
Como usar:

Admin:

1. !addsticker reacoes - Depois responde uma figurinha
2. !packs - Ver todos os pacotes
3. !rmsticker reacoes_001 - Remove figurinha

Qualquer membro:

1. !packs - Ver pacotes disponíveis
2. !pack reacoes - Recebe 1 figurinha
3. !pack reacoes 3 - Recebe 3 figurinhas
4. !sticker - Figurinha aleatória
· 
· 

```


### 📄 `config.js`

```
/**
 * Configuração do Sticker Bot
 * APENAS: Ban de gringos na entrada
 */

export const config = {
    sessionName: 'session',
    prefix: '!',
    ownerNumber: 'SEU_NUMERO',
    botName: 'StickerBot',
         // 🔑 API KEYS (Remove.bg)
    // ========================================
    removeBgApiKeys: [
        'SUA_API1','SUA_API2','SUA_API3'
    ],
    
    // ========================================
    // 📊 LIMITES DE MÍDIA
    // ========================================
    maxVideoDuration: 10,
    maxVideoSize: 8 * 1024 * 1024,
    maxImageSize: 5 * 1024 * 1024,
    
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
    connectionMethods: ['qr', 'code'],

    // ========================================
    // 🔨 BAN DE GRINGOS NA ENTRADA
    // ========================================
    protection: {
        
        // 🔨 BAN AUTOMÁTICO NA ENTRADA
        antigringo: {
            enabled: true,                    // ATIVAR BAN
            countryCode: '55',               // Apenas Brasil
            validateDDD: false,              // Não validar DDD específico
            allowedDDD: [],                  // Qualquer DDD brasileiro
            whitelist: [],                   // Nenhuma exceção
            customMessage: null
        },

        // 🔗 ANTILINK DESATIVADO
        antilink: {
            enabled: false,                  // DESATIVADO
            whitelistDomains: [],
            blockShorteners: true,
            blockInstagram: false,
            blockTelegram: false,
            blockWhatsApp: false,
            customMessage: null
        },

        // 📋 EXCEÇÕES (Ninguém em exceção, nem admin)
        exceptions: [],

        // 🔨 AÇÕES DO BAN
        actions: {
            sendMessage: false,              // Não enviar msg de bloqueio
            deleteMessage: false,            // Não deletar msg
            logBlock: true,                  // Apenas logar
            
            banMessage: true,                // Notificar quando bane
            banLog: true                     // Logar bans
        }
    },

    // ========================================
    // 🎉 WELCOME (Sistema de Boas-vindas)
    // ========================================
    welcome: {
        enabled: false,
        groups: {}
    }
};


```


### 📄 `index.js`

```
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs/promises';
import { config } from './config.js';
import { stickerPlugin } from './plugins/sticker.js';
import { GroupHandler } from './src/handlers/groupHandler.js';
import { WelcomeHandler } from './src/handlers/welcomeHandler.js';
import { MenuHandler } from './src/handlers/menuHandler.js';
import { CircleHandler } from './src/handlers/circleHandler.js';
import { StickerPackHandler } from './src/handlers/stickerPackHandler.js';
import { AntiLinkHandler } from './src/handlers/antiLinkHandler.js';
import { AntiSpamHandler } from './src/handlers/antiSpamHandler.js';
import { handleNewMember, handleMemberLeave, showRank, showTopInvites, showMyInvites, resetUserInvites } from './plugins/inviteRank.js';
const startTime = Date.now();

class StickerBot {
    constructor() {
        this.sock = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 5000;
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionStartTime = null;
        this.autoCodeGenerated = false;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log('🚀 Iniciando Sticker Bot...');
        console.log(`📞 Número: ${config.ownerNumber}\n`);
        this.init();
    }
// Métodot auxiliar para pegar timeWindow (adicione na classe Stickebot
async getTimeWindow(groupJid) {
    const config = await AntiSpamHandler.loadConfig(groupJid);
    return config.timeWindow / 1000;
}
    async init() {
        if (this.isConnecting) {
            console.log('⚠️ Conexão já em andamento...');
            return;
        }

        this.isConnecting = true;
        console.log('🔄 Iniciando conexão...');
        
        try {
            await WelcomeHandler.init();
            await GroupHandler.init();
            await MenuHandler.init();
            await StickerPackHandler.init();
            await AntiLinkHandler.init();
            await AntiSpamHandler.init();
            
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
            
            this.sock = makeWASocket({
                auth: state,
                version,
                logger: pino({ level: 'silent' }),
                browser: Browsers.ubuntu('Chrome'),
                printQRInTerminal: false,
                connectTimeoutMs: 30000,
                defaultQueryTimeoutMs: 30000,
            });

            this.setupEventHandlers(saveCreds);
            this.setupTerminalInterface();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error.message);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'open') {
                this.handleConnectionOpen();
            } else if (connection === 'close') {
                this.handleConnectionClose(lastDisconnect);
            } else if (connection === 'connecting') {
                console.log('🔄 Conectando ao WhatsApp...');
                this.isConnecting = true;
            }

            if (qr) {
                console.log('\n📱 QR CODE DISPONÍVEL:');
                qrcode.generate(qr, { small: true });
                console.log('💡 Escaneie com seu WhatsApp para conectar\n');
                this.autoCodeGenerated = false;
            }
        });

        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));

        this.sock.ev.on('group-participants.update', (update) => {
            const { id, participants, action } = update;
            GroupHandler.handleGroupParticipantsUpdate(
                { participants, action },
                this.sock,
                id
            );
        });
    }

    handleConnectionOpen() {
        console.log('✅ CONECTADO COM SUCESSO!');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.autoCodeGenerated = false;
        this.connectionStartTime = Date.now();
        this.showWelcomeMessage();
    }

    handleConnectionClose(lastDisconnect) {
        this.isConnected = false;
        this.isConnecting = false;
        
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`\n🔌 Conexão fechada. Código: ${statusCode}`);
        
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
            console.log('🔄 Sessão expirada. Limpando e tentando nova conexão...');
            this.clearSession();
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔁 Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay/1000}s`);
            this.scheduleReconnect();
        } else {
            console.log('❌ Máximo de tentativas. Use "restart".');
        }
    }

    async clearSession() {
        try {
            console.log('🧹 Limpando sessão expirada...');
            await fs.rm(config.sessionName, { recursive: true, force: true });
            console.log('✅ Sessão limpa. Reconectando...');
            
            setTimeout(() => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.autoCodeGenerated = false;
                this.init();
            }, 2000);
            
        } catch (error) {
            console.log('⚠️ Erro ao limpar sessão:', error.message);
            setTimeout(() => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.autoCodeGenerated = false;
                this.init();
            }, 2000);
        }
    }

    scheduleReconnect() {
        setTimeout(() => {
            console.log('🔄 Reconectando...');
            this.isConnecting = false;
            this.init();
        }, this.reconnectDelay);
    }

    async generatePairingCode() {
        if (this.autoCodeGenerated) {
            console.log('⚠️ Código já gerado. Aguarde.');
            return;
        }

        if (this.isConnected) {
            console.log('✅ Já conectado!');
            return;
        }

        if (!this.sock) {
            console.log('❌ Socket não pronto.');
            return;
        }

        try {
            console.log('\n📱 SOLICITANDO CÓDIGO...');
            
            const cleanNumber = config.ownerNumber.replace(/\D/g, '');
            
            if (!cleanNumber || cleanNumber.length < 10) {
                console.log('❌ Número inválido.');
                return;
            }

            console.log(`📟 Número: ${cleanNumber}`);
            
            this.autoCodeGenerated = true;
            const code = await this.sock.requestPairingCode(cleanNumber);
            
            console.log('\n✅ CÓDIGO GERADO!');
            console.log('══════════════════════════════');
            console.log(`📟 CÓDIGO: ${code}`);
            console.log('══════════════════════════════');
            console.log('\n📝 INSTRUÇÕES:');
            console.log('1. WhatsApp → Menu → Dispositivos conectados');
            console.log('2. "Conectar um dispositivo"');
            console.log(`3. Digite: ${code}`);
            console.log('\n⏰ Válido por 5 minutos\n');
            
        } catch (error) {
            console.log('❌ Erro ao gerar código:', error.message);
            console.log('💡 Escaneie o QR code que aparecerá automaticamente\n');
            this.autoCodeGenerated = false;
        }
    }

    setupTerminalInterface() {
        console.log(`
╔══════════════════════════════╗
║         STICKER BOT          ║
║   Conexão por QR + Código    ║
╠══════════════════════════════╣
║ 📝 Comandos:                 ║
║ • code    - Gerar código     ║
║ • restart - Reiniciar        ║
║ • clear   - Limpar sessão    ║
║ • status  - Info conexão     ║
║ • help    - Ajuda            ║
║ • exit    - Sair             ║
╚══════════════════════════════╝
        `);

        this.rl.on('line', (input) => {
            const command = input.trim().toLowerCase();
            
            switch (command) {
                case 'code':
                    this.generatePairingCode();
                    break;
                case 'restart':
                    console.log('🔄 Reiniciando...');
                    this.restartBot();
                    break;
                case 'clear':
                    console.log('🧹 Limpando sessão...');
                    this.clearSession();
                    break;
                case 'status':
                    this.showStatus();
                    break;
                case 'exit':
                    console.log('👋 Saindo...');
                    this.shutdown();
                    break;
                case 'help':
                    this.showHelp();
                    break;
                default:
                    console.log('❌ Comando inválido. Digite "help" para ver os comandos.');
            }
        });
    }

    async restartBot() {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.autoCodeGenerated = false;
        if (this.sock) {
            await this.sock.end();
        }
        setTimeout(() => this.init(), 2000);
    }

    async shutdown() {
        if (this.sock) {
            await this.sock.end();
        }
        process.exit(0);
    }

    showStatus() {
        const now = Date.now();
        const uptime = now - startTime;
        const connectionUptime = this.connectionStartTime ? now - this.connectionStartTime : 0;
        
        console.log(`
🏓 STATUS DO BOT

📊 Tempos:
• Bot: ${this.formatTime(uptime)}
• Conexão: ${this.isConnected ? this.formatTime(connectionUptime) : '❌ Offline'}

🔗 Conexão:
• Status: ${this.isConnected ? '✅ Conectado' : this.isConnecting ? '🔄 Conectando' : '❌ Offline'}
• Tentativas: ${this.reconnectAttempts}/${this.maxReconnectAttempts}
        `);
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    showHelp() {
        console.log(`
🤖 AJUDA - STICKER BOT

📌 COMANDOS DO TERMINAL:
• code    - Gerar código alfanumérico
• restart - Reiniciar o bot
• clear   - Limpar sessão expirada
• status  - Ver status da conexão
• exit    - Sair do bot
• help    - Ver esta ajuda

🔑 COMO CONECTAR:

Opção 1: QR CODE (Automático)
• Aguarde o QR code aparecer
• Abra WhatsApp → Menu → Dispositivos conectados
• Clique em "Conectar um dispositivo"
• Escaneie o QR code

Opção 2: CÓDIGO ALFANUMÉRICO (Mais rápido)
• Digite: code
• Copie o código gerado
• Abra WhatsApp → Menu → Dispositivos conectados
• Clique em "Conectar um dispositivo"
• Digite o código

🔧 SOLUÇÃO PARA ERRO 401:
• Use "clear" para limpar sessão expirada
• Ou o bot faz automaticamente
• Depois gere um novo código com "code"

📞 Número: ${config.ownerNumber}
        `);
    }

    showWelcomeMessage() {
        console.log(`
╔══════════════════════════════╗
║         STICKER BOT          ║
║      ✅ CONECTADO!           ║
╠══════════════════════════════╣
║ 🤖 Pronto para uso!          ║
║ 📝 Comandos via !help        ║
║ 💬 Terminal: help            ║
╚══════════════════════════════╝
        `);
    }

    async handleMessages({ messages }) {
        if (!this.isConnected) return;
        
        try {
            const message = messages[0];
            if (!message.message || message.key.remoteJid === 'status@broadcast') return;

            const text = this.getMessageText(message);
            const command = text?.toLowerCase().split(' ')[0];
            const isGroup = message.key.remoteJid.includes('@g.us');
            const groupJid = message.key.remoteJid;
            const senderNumber = message.key.participant || message.key.remoteJid;
            const senderId = message.key.participant || message.key.remoteJid;

            console.log(`📨 ${text?.substring(0, 40) || '(mídia)'}`);
// No index.js, dentro de handleMessages, quando chegar uma mensagem de entrada:
if (message.message?.groupParticipantAdded) {
    const addedUsers = message.message.groupParticipantAdded;
    const adderId = message.key.participant || message.key.remoteJid;
    
    for (const newUser of addedUsers) {
        await handleNewMember(this.sock, groupJid, newUser, adderId, '');
    }
}

            // ========================================
            // 🔗 ANTI-LINK - Verificar links (ANTES dos comandos)
            // ========================================
            if (isGroup && text && !command?.startsWith('!')) {
                const isAdminUser = await AntiLinkHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    const check = await AntiLinkHandler.checkMessage(text, groupJid, senderId);
                    
                    if (check.blocked) {
                        console.log(`🚫 Link bloqueado: ${check.domain} de ${senderId}`);
                        
                        await this.sock.sendMessage(groupJid, {
                            delete: message.key
                        });
                        
                        const warnMsg = AntiLinkHandler.getWarningMessage(check.action, check.domain);
                        await this.sock.sendMessage(groupJid, {
                            text: warnMsg
                        });
                        
                        if (check.action === 'kick') {
                            await AntiLinkHandler.kickUser(this.sock, groupJid, senderId);
                            await this.sock.sendMessage(groupJid, {
                                text: `🔨 Usuário removido por enviar link proibido: ${check.domain}`
                            });
                        }
                        
                        return;
                    }
                }
            }

            // ========================================
            // 🛡️ ANTI-SPAM
            // ========================================
            // ========================================
// 🛡️ ANTI-SPAM (Só para COMANDOS)
// ========================================
if (isGroup) {
    const isAdminUser = await AntiSpamHandler.isAdmin(this.sock, groupJid, senderId);
    const isOwner = senderNumber.includes(config.ownerNumber.replace(/\D/g, ''));
    
    // SÓ verifica se for um COMANDO (começa com !)
    if (!isAdminUser && !isOwner && text?.startsWith('!')) {
        const config = await AntiSpamHandler.loadConfig(groupJid);
        
        if (config.enabled) {
            const spamCheck = await AntiSpamHandler.checkCommand(groupJid, senderId, config);
            
            if (spamCheck.blocked) {
                // Enviar aviso
                await this.sock.sendMessage(groupJid, {
                    text: spamCheck.message
                }, { quoted: message });
                
                // Não processa o comando
                return;
            }
        }
    }
}

            // ========================================
            // 📌 COMANDOS DO ANTI-LINK
            // ========================================
            if (command === '!antilink') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await AntiLinkHandler.isAdmin(this.sock, groupJid, senderId);
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem configurar o anti-link'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const subCommand = args[1];
                
                if (subCommand === 'on') {
                    await AntiLinkHandler.setEnabled(groupJid, true);
                    await this.sock.sendMessage(groupJid, {
                        text: '✅ Anti-link ATIVADO!'
                    }, { quoted: message });
                    return;
                }
                
                if (subCommand === 'off') {
                    await AntiLinkHandler.setEnabled(groupJid, false);
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Anti-link DESATIVADO!'
                    }, { quoted: message });
                    return;
                }
                
                if (subCommand === 'action') {
                    const action = args[2];
                    if (!action) {
                        await this.sock.sendMessage(groupJid, {
                            text: '❌ Use: !antilink action delete/warn/kick'
                        }, { quoted: message });
                        return;
                    }
                    
                    const result = await AntiLinkHandler.setAction(groupJid, action);
                    if (result.success) {
                        const actionText = action === 'delete' ? 'deletar mensagem' : action === 'warn' ? 'avisar' : 'remover usuário';
                        await this.sock.sendMessage(groupJid, {
                            text: `✅ Ação alterada para: ${actionText}`
                        }, { quoted: message });
                    } else {
                        await this.sock.sendMessage(groupJid, {
                            text: result.error
                        }, { quoted: message });
                    }
                    return;
                }
                
                if (subCommand === 'status') {
                    const status = await AntiLinkHandler.getStatus(groupJid);
                    await this.sock.sendMessage(groupJid, {
                        text: status
                    }, { quoted: message });
                    return;
                }
                
                await this.sock.sendMessage(groupJid, {
                    text: `🔗 *COMANDOS ANTI-LINK*\n\n` +
                          `• !antilink on - Ativar\n` +
                          `• !antilink off - Desativar\n` +
                          `• !antilink action delete/warn/kick - Ação\n` +
                          `• !antilink status - Ver status`
                }, { quoted: message });
                return;
            }

            // ========================================
            // 📌 COMANDOS DO ANTI-SPAM
            // ========================================
            // ========================================
// 📌 COMANDOS DO ANTI-SPAM
// ========================================
if (command === '!antispam') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    
    const isAdminUser = await AntiSpamHandler.isAdmin(this.sock, groupJid, senderId);
    if (!isAdminUser) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Apenas administradores podem configurar o anti-spam'
        }, { quoted: message });
        return;
    }
    
    const args = text.split(' ');
    const subCommand = args[1];
    
    if (subCommand === 'on') {
        await AntiSpamHandler.setEnabled(groupJid, true);
        await this.sock.sendMessage(groupJid, {
            text: '✅ Anti-spam ATIVADO!\n\nLimite: 4 comandos em 5 segundos\nMensagens normais: liberadas'
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'off') {
        await AntiSpamHandler.setEnabled(groupJid, false);
        await this.sock.sendMessage(groupJid, {
            text: '❌ Anti-spam DESATIVADO!'
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'limit') {
        const limit = parseInt(args[2]);
        if (!limit || limit < 1) {
            await this.sock.sendMessage(groupJid, {
                text: '❌ Use: !antispam limit [número]\n📌 Exemplo: !antispam limit 6'
            }, { quoted: message });
            return;
        }
        await AntiSpamHandler.setCommandLimit(groupJid, limit);
        await this.sock.sendMessage(groupJid, {
            text: `✅ Limite alterado para ${limit} comandos em ${await this.getTimeWindow(groupJid)} segundos`
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'time') {
        const seconds = parseInt(args[2]);
        if (!seconds || seconds < 1) {
            await this.sock.sendMessage(groupJid, {
                text: '❌ Use: !antispam time [segundos]\n📌 Exemplo: !antispam time 10'
            }, { quoted: message });
            return;
        }
        await AntiSpamHandler.setBlockTime(groupJid, seconds);
        await this.sock.sendMessage(groupJid, {
            text: `✅ Tempo de bloqueio alterado para ${seconds} segundos`
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'clear') {
        const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) {
            await this.sock.sendMessage(groupJid, {
                text: '❌ Marque o usuário: !antispam clear @usuario'
            }, { quoted: message });
            return;
        }
        await AntiSpamHandler.clearUserCommands(groupJid, mentionedUser);
        await this.sock.sendMessage(groupJid, {
            text: `✅ Registro de comandos limpo para o usuário!`
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'status') {
        const status = await AntiSpamHandler.getStatus(groupJid);
        await this.sock.sendMessage(groupJid, {
            text: status
        }, { quoted: message });
        return;
    }
    
    // Ajuda
    await this.sock.sendMessage(groupJid, {
        text: `🛡️ *COMANDOS ANTI-SPAM (Só para comandos)*\n\n` +
              `• !antispam on - Ativar\n` +
              `• !antispam off - Desativar\n` +
              `• !antispam limit [n] - Mudar limite (padrão: 4)\n` +
              `• !antispam time [s] - Mudar tempo bloqueio (padrão: 5s)\n` +
              `• !antispam clear @user - Limpar registro\n` +
              `• !antispam status - Ver status\n\n` +
              `💬 Mensagens normais NÃO são bloqueadas!`
    }, { quoted: message });
    return;
}

            // ========================================
            // 🔓 COMANDO !unmute
            // ========================================
            if (command === '!unmute') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await AntiSpamHandler.isAdmin(this.sock, groupJid, senderId);
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem desmutar usuários'
                    }, { quoted: message });
                    return;
                }
                
                const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!mentionedUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Marque o usuário: !unmute @usuario'
                    }, { quoted: message });
                    return;
                }
                
                await AntiSpamHandler.unmuteUser(groupJid, mentionedUser);
                await this.sock.sendMessage(groupJid, {
                    text: `✅ Usuário desmutado!`
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🏓 COMANDO !ping
            // ========================================
            if (command === '!ping') {
                const start = Date.now();
                await this.sock.sendMessage(groupJid, {
                    text: '🏓 Pong!'
                }, { quoted: message });
                const end = Date.now();
                await this.sock.sendMessage(groupJid, {
                    text: `⏱️ Latência: ${end - start}ms`
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🎉 WELCOME
            // ========================================
            if (command === '!onwelcome' || command === '!setbemvindo') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                let stickerBuffer = null;

                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    stickerBuffer = quotedMessage.stickerMessage;
                }
                
                if (!stickerBuffer && message.message?.stickerMessage) {
                    stickerBuffer = message.message.stickerMessage;
                }

                if (!stickerBuffer) {
                    await this.sock.sendMessage(groupJid, {
                        text: `📝 Responda a uma FIGURINHA e digite: !setwelcome`
                    }, { quoted: message });
                    return;
                }

                try {
                    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
                    
                    const stream = await downloadContentFromMessage(stickerBuffer, 'sticker');
                    let buffer = Buffer.from([]);
                    
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    
                    const success = await WelcomeHandler.saveWelcomeSticker(groupJid, buffer, 'sticker');
                    
                    if (success) {
                        await this.sock.sendMessage(groupJid, {
                            text: '✅ Figurinha salva!\n\n🎉 Welcome ativado'
                        }, { quoted: message });
                    } else {
                        await this.sock.sendMessage(groupJid, {
                            text: '❌ Erro ao salvar figurinha'
                        }, { quoted: message });
                    }
                    
                } catch (error) {
                    console.error('❌ Erro:', error);
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Erro ao processar figurinha'
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!ofwelcome' || command === '!desativarwelcome') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                await WelcomeHandler.disableWelcome(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '✅ Welcome desativado'
                }, { quoted: message });
                return;
            }

            if (command === '!welcomestatus' || command === '!statuswelcome') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                const status = WelcomeHandler.getWelcomeStatus(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: status
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🔨 BAN
            // ========================================
            if (command === '!enableban' || command === '!onban') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                GroupHandler.enableBan(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '🔨 Ban ATIVADO\n\n❌ Gringos serão banidos'
                }, { quoted: message });
                return;
            }

            if (command === '!disableban' || command === '!ofban') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                GroupHandler.disableBan(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '🔓 Ban DESATIVADO\n\n✅ Todos podem entrar'
                }, { quoted: message });
                return;
            }

            if (command === '!banstatus' || command === '!statusban') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                const status = GroupHandler.getBanStatus(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: status
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🎨 FIGURINHAS
            // ========================================
            if (command === '!toimg' || command === '!toimage' || command === '!figimg') {
                const { ToImageHandler } = await import('./src/handlers/toImageHandler.js');
                const result = await ToImageHandler.convertStickerToImage(message, this.sock);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!removebg' || command === '!bg') {
                const { RemoveBgHandler } = await import('./src/handlers/removeBgHandler.js');
                const result = await RemoveBgHandler.removeBackground(message, this.sock);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!scircle' || command === '!circle' || command === '!redondo') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const result = await CircleHandler.createCircleSticker(message, this.sock);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            // ========================================
            // 📦 PACOTES DE STICKERS
            // ========================================
            if (command === '!addsticker' || command === '!addfig') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await StickerPackHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores do grupo podem adicionar figurinhas'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const packName = args[1];
                
                if (!packName) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Use: !addsticker [nome do pacote]\n\n📌 Exemplo: !addsticker reacoes'
                    }, { quoted: message });
                    return;
                }
                
                const stickerBuffer = await StickerPackHandler.downloadSticker(message);
                
                if (!stickerBuffer) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Responda a uma FIGURINHA com o comando !addsticker'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.saveSticker(packName, stickerBuffer, message, this.sock);
                
                if (result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: `✅ Figurinha salva!\n\n📦 Pacote: ${result.packName}\n🆔 ID: ${result.fileName}\n📊 Total: ${result.total} figurinhas`
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!pack') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const packName = args[1];
                let quantity = parseInt(args[2]) || 1;
                
                if (!packName) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Use: !pack [nome do pacote] [quantidade]\n\n📌 Exemplo: !pack reacoes\n📌 Exemplo: !pack reacoes 3'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.sendStickers(this.sock, groupJid, packName, quantity, message);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!packs' || command === '!listpack') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const packs = await StickerPackHandler.listPacks();
                
                if (packs.length === 0) {
                    await this.sock.sendMessage(groupJid, {
                        text: '📦 Nenhum pacote disponível ainda.\n\nAdicione figurinhas com: !addsticker [nome]'
                    }, { quoted: message });
                    return;
                }
                
                let packList = '📦 *PACOTES DISPONÍVEIS*\n\n';
                for (const pack of packs) {
                    packList += `• *${pack.name}* - ${pack.count} figurinhas\n`;
                }
                packList += '\n📌 Use: !pack [nome] para receber\n📌 Use: !pack [nome] 3 para várias';
                
                await this.sock.sendMessage(groupJid, {
                    text: packList
                }, { quoted: message });
                return;
            }

            if (command === '!sticker' && text === '!sticker') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.sendRandomSticker(this.sock, groupJid, message);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!rmsticker' || command === '!removefig') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await StickerPackHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores do grupo podem remover figurinhas'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const stickerId = args[1];
                
                if (!stickerId) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Use: !rmsticker [ID]\n\n📌 Exemplo: !rmsticker reacoes_001'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.removeSticker(stickerId, message, this.sock);
                
                if (result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: `✅ Figurinha ${result.stickerId} removida do pacote "${result.packName}"`
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }
// !rank
if (command === '!rank') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    await showRank(this.sock, message, groupJid, senderId);
    return;
}

// !top
if (command === '!top' || command === '!topconvites') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    await showTopInvites(this.sock, message, groupJid);
    return;
}

// !meusconvites
if (command === '!meusconvites' || command === '!meusconvidados') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    await showMyInvites(this.sock, message, groupJid, senderId);
    return;
}

// !resetconvites (admin)
if (command === '!resetconvites') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    await resetUserInvites(this.sock, message, groupJid, senderId, mentionedUser);
    return;
}
            // ========================================
            // 📌 MENU
            // ========================================
            if (command === '!setmenu') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await MenuHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem definir a imagem do menu'
                    }, { quoted: message });
                    return;
                }
                
                const imageBuffer = await MenuHandler.downloadImage(message);
                
                if (!imageBuffer) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Responda a uma IMAGEM com !setmenu'
                    }, { quoted: message });
                    return;
                }
                
                const result = await MenuHandler.saveMenuImage(groupJid, imageBuffer);
                
                if (result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: '✅ Imagem do menu salva!\n\nUse !menu para ver o novo menu'
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Erro ao salvar imagem'
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!delmenu') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await MenuHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem remover a imagem do menu'
                    }, { quoted: message });
                    return;
                }
                
                await MenuHandler.deleteMenuImage(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '✅ Imagem do menu removida! O menu voltará ao formato texto.'
                }, { quoted: message });
                return;
            }

            if (command === '!menu') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const menuText = MenuHandler.getMenuText();
                const menuImage = await MenuHandler.getMenuImage(groupJid);
                
                if (menuImage) {
                    await this.sock.sendMessage(groupJid, {
                        image: menuImage,
                        caption: menuText
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: menuText
                    }, { quoted: message });
                }
                return;
            }

            // ========================================
            // 🎨 STICKER PLUGIN
            // ========================================
            if (command === '!fig' || command === '!sticker' || command === '!s') {
                await stickerPlugin(this.sock, message);
                return;
            }

            // ========================================
            // ❓ HELP
            // ========================================
if (command === '!help') {
    const text = `
🤖 STICKER BOT - AJUDA COMPLETA

🎨 FIGURINHAS:
• !fig / !s / !sticker - Criar figurinha
• !toimg / !toimage - Converter figurinha para imagem
• !removebg / !bg - Remover fundo da imagem
• !scircle / !redondo - Sticker redondo

📦 PACOTES DE FIGURINHAS:
• !pack [nome] - Receber figurinha
• !packs - Listar pacotes
• !addsticker [nome] - (Admin) Salvar
• !rmsticker [ID] - (Admin) Remover

🎉 WELCOME:
• !setwelcome - Configurar sticker de boas-vindas
• !disablewelcome - Desativar
• !welcomestatus - Status

🔨 BAN:
• !enableban - Ativar ban de gringos
• !disableban - Desativar
• !banstatus - Status

🔗 ANTI-LINK:
• !antilink on/off - Ativar/Desativar
• !antilink action delete/warn/kick - Ação
• !antilink status - Ver status

🛡️ ANTI-SPAM (Só comandos):
• !antispam on/off - Ativar/Desativar
• !antispam limit [n] - Mudar limite (padrão: 4)
• !antispam time [s] - Mudar tempo bloqueio (padrão: 5s)
• !antispam clear @user - Limpar registro
• !antispam status - Ver status

🏆 CONVITES:
• !rank - Ver seus pontos e nível
• !top - Top convites do grupo
• !meusconvites - Quem você convidou
• !resetconvites @user - (Admin) Resetar pontos

📌 MENU:
• !menu - Menu principal
• !setmenu - (Admin) Definir imagem do menu

🏓 UTILIDADES:
• !ping - Verificar latência

💬 Mensagens normais NUNCA são bloqueadas!
    `;
    await this.sock.sendMessage(groupJid, { text }, { quoted: message });
    return;
}
        } catch (error) {
            console.log('❌ Erro:', error.message);
        }
    }

    getMessageText(message) {
        const msg = message.message;
        return (
            msg?.conversation ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            msg?.extendedTextMessage?.text
        );
    }
}

console.log('🎯 Iniciando bot...');
console.log('💡 Aguarde o QR code ou digite "code" para código alfanumérico\n');
new StickerBot();

```


### 📄 `botBv2_scan.md`

```
# 📦 Project Scan: botBv1

Generated: 2026-04-20 16:55:33.688970

## 🌳 Project Structure

```
📁 botBv1/
├── package.json
├── Funcionou.txt
├── config.js
├── index.js
├── sticker.js
├── inviteRank.js
│   ├── welcomeHandler.js
│   ├── groupHandler.js
│   ├── protectionHandler.js
│   ├── stickerHandler.js
│   ├── toImageHandler.js
│   ├── removeBgHandler.js
│   ├── stickerPackHandler.js
│   ├── circleHandler.js
│   ├── menuHandler.js
│   ├── antiLinkHandler.js
│   ├── antiSpamHandler.js
│   ├── mediaUtils.js
│   ├── protectionUtils.js
```

---

## 📜 Files (19 arquivos)


### 📄 `package.json`

```
{
  "name": "sticker-bot-md",
  "version": "1.0.0",
  "description": "Bot de Figurinhas para WhatsApp",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "qr": "node index.js --qr",
    "clean": "rm -rf sessions"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.4.0",
    "axios": "^1.6.0",
    "wa-sticker-formatter": "^4.3.2",
    "node-webpmux": "^3.1.1",
    "sharp": "^0.32.0",
    "qrcode-terminal": "^0.12.0",
    "pino": "^8.0.0",
    "file-type": "^18.0.0",
"form-data": "^4.0.0"
  },
  "keywords": ["whatsapp", "bot", "sticker"],
  "author": "Seu Nome",
  "license": "MIT"
}

```


### 📄 `Funcionou.txt`

```
✅ Funcionalidades Implementadas:

· Figurinhas de imagens - Funcionando perfeitamente
· Figurinhas de vídeos - Agora funcionando!
· Sistema de cache inteligente - Sem bloqueios
· Comandos úteis - !ping, !espaco, !help
· Reconexão automática - Bot se reconecta sozinho
//9 de abr. 2016
· comando !toimg adicionado
· comando !bg (isso tira o fundo da imagem e faz o sticker sem fundo
· comando sticker em data base adicionado
Como usar:

Admin:

1. !addsticker reacoes - Depois responde uma figurinha
2. !packs - Ver todos os pacotes
3. !rmsticker reacoes_001 - Remove figurinha

Qualquer membro:

1. !packs - Ver pacotes disponíveis
2. !pack reacoes - Recebe 1 figurinha
3. !pack reacoes 3 - Recebe 3 figurinhas
4. !sticker - Figurinha aleatória
· 
· 

```


### 📄 `config.js`

```
/**
 * Configuração do Sticker Bot
 * APENAS: Ban de gringos na entrada
 */

export const config = {
    sessionName: 'session',
    prefix: '!',
    ownerNumber: 'SEU_NUMERO',
    botName: 'StickerBot',
         // 🔑 API KEYS (Remove.bg)
    // ========================================
    removeBgApiKeys: [
        'SUA_API1','SUA_API2','SUA_API3'
    ],
    
    // ========================================
    // 📊 LIMITES DE MÍDIA
    // ========================================
    maxVideoDuration: 10,
    maxVideoSize: 8 * 1024 * 1024,
    maxImageSize: 5 * 1024 * 1024,
    
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
    connectionMethods: ['qr', 'code'],

    // ========================================
    // 🔨 BAN DE GRINGOS NA ENTRADA
    // ========================================
    protection: {
        
        // 🔨 BAN AUTOMÁTICO NA ENTRADA
        antigringo: {
            enabled: true,                    // ATIVAR BAN
            countryCode: '55',               // Apenas Brasil
            validateDDD: false,              // Não validar DDD específico
            allowedDDD: [],                  // Qualquer DDD brasileiro
            whitelist: [],                   // Nenhuma exceção
            customMessage: null
        },

        // 🔗 ANTILINK DESATIVADO
        antilink: {
            enabled: false,                  // DESATIVADO
            whitelistDomains: [],
            blockShorteners: true,
            blockInstagram: false,
            blockTelegram: false,
            blockWhatsApp: false,
            customMessage: null
        },

        // 📋 EXCEÇÕES (Ninguém em exceção, nem admin)
        exceptions: [],

        // 🔨 AÇÕES DO BAN
        actions: {
            sendMessage: false,              // Não enviar msg de bloqueio
            deleteMessage: false,            // Não deletar msg
            logBlock: true,                  // Apenas logar
            
            banMessage: true,                // Notificar quando bane
            banLog: true                     // Logar bans
        }
    },

    // ========================================
    // 🎉 WELCOME (Sistema de Boas-vindas)
    // ========================================
    welcome: {
        enabled: false,
        groups: {}
    }
};


```


### 📄 `index.js`

```
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs/promises';
import { config } from './config.js';
import { stickerPlugin } from './plugins/sticker.js';
import { GroupHandler } from './src/handlers/groupHandler.js';
import { WelcomeHandler } from './src/handlers/welcomeHandler.js';
import { MenuHandler } from './src/handlers/menuHandler.js';
import { CircleHandler } from './src/handlers/circleHandler.js';
import { StickerPackHandler } from './src/handlers/stickerPackHandler.js';
import { AntiLinkHandler } from './src/handlers/antiLinkHandler.js';
import { AntiSpamHandler } from './src/handlers/antiSpamHandler.js';
import { handleNewMember, handleMemberLeave, showRank, showTopInvites, showMyInvites, resetUserInvites } from './plugins/inviteRank.js';
const startTime = Date.now();

class StickerBot {
    constructor() {
        this.sock = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 5000;
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionStartTime = null;
        this.autoCodeGenerated = false;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log('🚀 Iniciando Sticker Bot...');
        console.log(`📞 Número: ${config.ownerNumber}\n`);
        this.init();
    }
// Métodot auxiliar para pegar timeWindow (adicione na classe Stickebot
async getTimeWindow(groupJid) {
    const config = await AntiSpamHandler.loadConfig(groupJid);
    return config.timeWindow / 1000;
}
    async init() {
        if (this.isConnecting) {
            console.log('⚠️ Conexão já em andamento...');
            return;
        }

        this.isConnecting = true;
        console.log('🔄 Iniciando conexão...');
        
        try {
            await WelcomeHandler.init();
            await GroupHandler.init();
            await MenuHandler.init();
            await StickerPackHandler.init();
            await AntiLinkHandler.init();
            await AntiSpamHandler.init();
            
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
            
            this.sock = makeWASocket({
                auth: state,
                version,
                logger: pino({ level: 'silent' }),
                browser: Browsers.ubuntu('Chrome'),
                printQRInTerminal: false,
                connectTimeoutMs: 30000,
                defaultQueryTimeoutMs: 30000,
            });

            this.setupEventHandlers(saveCreds);
            this.setupTerminalInterface();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error.message);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'open') {
                this.handleConnectionOpen();
            } else if (connection === 'close') {
                this.handleConnectionClose(lastDisconnect);
            } else if (connection === 'connecting') {
                console.log('🔄 Conectando ao WhatsApp...');
                this.isConnecting = true;
            }

            if (qr) {
                console.log('\n📱 QR CODE DISPONÍVEL:');
                qrcode.generate(qr, { small: true });
                console.log('💡 Escaneie com seu WhatsApp para conectar\n');
                this.autoCodeGenerated = false;
            }
        });

        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));

        this.sock.ev.on('group-participants.update', (update) => {
            const { id, participants, action } = update;
            GroupHandler.handleGroupParticipantsUpdate(
                { participants, action },
                this.sock,
                id
            );
        });
    }

    handleConnectionOpen() {
        console.log('✅ CONECTADO COM SUCESSO!');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.autoCodeGenerated = false;
        this.connectionStartTime = Date.now();
        this.showWelcomeMessage();
    }

    handleConnectionClose(lastDisconnect) {
        this.isConnected = false;
        this.isConnecting = false;
        
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`\n🔌 Conexão fechada. Código: ${statusCode}`);
        
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
            console.log('🔄 Sessão expirada. Limpando e tentando nova conexão...');
            this.clearSession();
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔁 Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${this.reconnectDelay/1000}s`);
            this.scheduleReconnect();
        } else {
            console.log('❌ Máximo de tentativas. Use "restart".');
        }
    }

    async clearSession() {
        try {
            console.log('🧹 Limpando sessão expirada...');
            await fs.rm(config.sessionName, { recursive: true, force: true });
            console.log('✅ Sessão limpa. Reconectando...');
            
            setTimeout(() => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.autoCodeGenerated = false;
                this.init();
            }, 2000);
            
        } catch (error) {
            console.log('⚠️ Erro ao limpar sessão:', error.message);
            setTimeout(() => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.autoCodeGenerated = false;
                this.init();
            }, 2000);
        }
    }

    scheduleReconnect() {
        setTimeout(() => {
            console.log('🔄 Reconectando...');
            this.isConnecting = false;
            this.init();
        }, this.reconnectDelay);
    }

    async generatePairingCode() {
        if (this.autoCodeGenerated) {
            console.log('⚠️ Código já gerado. Aguarde.');
            return;
        }

        if (this.isConnected) {
            console.log('✅ Já conectado!');
            return;
        }

        if (!this.sock) {
            console.log('❌ Socket não pronto.');
            return;
        }

        try {
            console.log('\n📱 SOLICITANDO CÓDIGO...');
            
            const cleanNumber = config.ownerNumber.replace(/\D/g, '');
            
            if (!cleanNumber || cleanNumber.length < 10) {
                console.log('❌ Número inválido.');
                return;
            }

            console.log(`📟 Número: ${cleanNumber}`);
            
            this.autoCodeGenerated = true;
            const code = await this.sock.requestPairingCode(cleanNumber);
            
            console.log('\n✅ CÓDIGO GERADO!');
            console.log('══════════════════════════════');
            console.log(`📟 CÓDIGO: ${code}`);
            console.log('══════════════════════════════');
            console.log('\n📝 INSTRUÇÕES:');
            console.log('1. WhatsApp → Menu → Dispositivos conectados');
            console.log('2. "Conectar um dispositivo"');
            console.log(`3. Digite: ${code}`);
            console.log('\n⏰ Válido por 5 minutos\n');
            
        } catch (error) {
            console.log('❌ Erro ao gerar código:', error.message);
            console.log('💡 Escaneie o QR code que aparecerá automaticamente\n');
            this.autoCodeGenerated = false;
        }
    }

    setupTerminalInterface() {
        console.log(`
╔══════════════════════════════╗
║         STICKER BOT          ║
║   Conexão por QR + Código    ║
╠══════════════════════════════╣
║ 📝 Comandos:                 ║
║ • code    - Gerar código     ║
║ • restart - Reiniciar        ║
║ • clear   - Limpar sessão    ║
║ • status  - Info conexão     ║
║ • help    - Ajuda            ║
║ • exit    - Sair             ║
╚══════════════════════════════╝
        `);

        this.rl.on('line', (input) => {
            const command = input.trim().toLowerCase();
            
            switch (command) {
                case 'code':
                    this.generatePairingCode();
                    break;
                case 'restart':
                    console.log('🔄 Reiniciando...');
                    this.restartBot();
                    break;
                case 'clear':
                    console.log('🧹 Limpando sessão...');
                    this.clearSession();
                    break;
                case 'status':
                    this.showStatus();
                    break;
                case 'exit':
                    console.log('👋 Saindo...');
                    this.shutdown();
                    break;
                case 'help':
                    this.showHelp();
                    break;
                default:
                    console.log('❌ Comando inválido. Digite "help" para ver os comandos.');
            }
        });
    }

    async restartBot() {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.autoCodeGenerated = false;
        if (this.sock) {
            await this.sock.end();
        }
        setTimeout(() => this.init(), 2000);
    }

    async shutdown() {
        if (this.sock) {
            await this.sock.end();
        }
        process.exit(0);
    }

    showStatus() {
        const now = Date.now();
        const uptime = now - startTime;
        const connectionUptime = this.connectionStartTime ? now - this.connectionStartTime : 0;
        
        console.log(`
🏓 STATUS DO BOT

📊 Tempos:
• Bot: ${this.formatTime(uptime)}
• Conexão: ${this.isConnected ? this.formatTime(connectionUptime) : '❌ Offline'}

🔗 Conexão:
• Status: ${this.isConnected ? '✅ Conectado' : this.isConnecting ? '🔄 Conectando' : '❌ Offline'}
• Tentativas: ${this.reconnectAttempts}/${this.maxReconnectAttempts}
        `);
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    showHelp() {
        console.log(`
🤖 AJUDA - STICKER BOT

📌 COMANDOS DO TERMINAL:
• code    - Gerar código alfanumérico
• restart - Reiniciar o bot
• clear   - Limpar sessão expirada
• status  - Ver status da conexão
• exit    - Sair do bot
• help    - Ver esta ajuda

🔑 COMO CONECTAR:

Opção 1: QR CODE (Automático)
• Aguarde o QR code aparecer
• Abra WhatsApp → Menu → Dispositivos conectados
• Clique em "Conectar um dispositivo"
• Escaneie o QR code

Opção 2: CÓDIGO ALFANUMÉRICO (Mais rápido)
• Digite: code
• Copie o código gerado
• Abra WhatsApp → Menu → Dispositivos conectados
• Clique em "Conectar um dispositivo"
• Digite o código

🔧 SOLUÇÃO PARA ERRO 401:
• Use "clear" para limpar sessão expirada
• Ou o bot faz automaticamente
• Depois gere um novo código com "code"

📞 Número: ${config.ownerNumber}
        `);
    }

    showWelcomeMessage() {
        console.log(`
╔══════════════════════════════╗
║         STICKER BOT          ║
║      ✅ CONECTADO!           ║
╠══════════════════════════════╣
║ 🤖 Pronto para uso!          ║
║ 📝 Comandos via !help        ║
║ 💬 Terminal: help            ║
╚══════════════════════════════╝
        `);
    }

    async handleMessages({ messages }) {
        if (!this.isConnected) return;
        
        try {
            const message = messages[0];
            if (!message.message || message.key.remoteJid === 'status@broadcast') return;

            const text = this.getMessageText(message);
            const command = text?.toLowerCase().split(' ')[0];
            const isGroup = message.key.remoteJid.includes('@g.us');
            const groupJid = message.key.remoteJid;
            const senderNumber = message.key.participant || message.key.remoteJid;
            const senderId = message.key.participant || message.key.remoteJid;

            console.log(`📨 ${text?.substring(0, 40) || '(mídia)'}`);
// No index.js, dentro de handleMessages, quando chegar uma mensagem de entrada:
if (message.message?.groupParticipantAdded) {
    const addedUsers = message.message.groupParticipantAdded;
    const adderId = message.key.participant || message.key.remoteJid;
    
    for (const newUser of addedUsers) {
        await handleNewMember(this.sock, groupJid, newUser, adderId, '');
    }
}

            // ========================================
            // 🔗 ANTI-LINK - Verificar links (ANTES dos comandos)
            // ========================================
            if (isGroup && text && !command?.startsWith('!')) {
                const isAdminUser = await AntiLinkHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    const check = await AntiLinkHandler.checkMessage(text, groupJid, senderId);
                    
                    if (check.blocked) {
                        console.log(`🚫 Link bloqueado: ${check.domain} de ${senderId}`);
                        
                        await this.sock.sendMessage(groupJid, {
                            delete: message.key
                        });
                        
                        const warnMsg = AntiLinkHandler.getWarningMessage(check.action, check.domain);
                        await this.sock.sendMessage(groupJid, {
                            text: warnMsg
                        });
                        
                        if (check.action === 'kick') {
                            await AntiLinkHandler.kickUser(this.sock, groupJid, senderId);
                            await this.sock.sendMessage(groupJid, {
                                text: `🔨 Usuário removido por enviar link proibido: ${check.domain}`
                            });
                        }
                        
                        return;
                    }
                }
            }

            // ========================================
            // 🛡️ ANTI-SPAM
            // ========================================
            // ========================================
// 🛡️ ANTI-SPAM (Só para COMANDOS)
// ========================================
if (isGroup) {
    const isAdminUser = await AntiSpamHandler.isAdmin(this.sock, groupJid, senderId);
    const isOwner = senderNumber.includes(config.ownerNumber.replace(/\D/g, ''));
    
    // SÓ verifica se for um COMANDO (começa com !)
    if (!isAdminUser && !isOwner && text?.startsWith('!')) {
        const config = await AntiSpamHandler.loadConfig(groupJid);
        
        if (config.enabled) {
            const spamCheck = await AntiSpamHandler.checkCommand(groupJid, senderId, config);
            
            if (spamCheck.blocked) {
                // Enviar aviso
                await this.sock.sendMessage(groupJid, {
                    text: spamCheck.message
                }, { quoted: message });
                
                // Não processa o comando
                return;
            }
        }
    }
}

            // ========================================
            // 📌 COMANDOS DO ANTI-LINK
            // ========================================
            if (command === '!antilink') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await AntiLinkHandler.isAdmin(this.sock, groupJid, senderId);
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem configurar o anti-link'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const subCommand = args[1];
                
                if (subCommand === 'on') {
                    await AntiLinkHandler.setEnabled(groupJid, true);
                    await this.sock.sendMessage(groupJid, {
                        text: '✅ Anti-link ATIVADO!'
                    }, { quoted: message });
                    return;
                }
                
                if (subCommand === 'off') {
                    await AntiLinkHandler.setEnabled(groupJid, false);
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Anti-link DESATIVADO!'
                    }, { quoted: message });
                    return;
                }
                
                if (subCommand === 'action') {
                    const action = args[2];
                    if (!action) {
                        await this.sock.sendMessage(groupJid, {
                            text: '❌ Use: !antilink action delete/warn/kick'
                        }, { quoted: message });
                        return;
                    }
                    
                    const result = await AntiLinkHandler.setAction(groupJid, action);
                    if (result.success) {
                        const actionText = action === 'delete' ? 'deletar mensagem' : action === 'warn' ? 'avisar' : 'remover usuário';
                        await this.sock.sendMessage(groupJid, {
                            text: `✅ Ação alterada para: ${actionText}`
                        }, { quoted: message });
                    } else {
                        await this.sock.sendMessage(groupJid, {
                            text: result.error
                        }, { quoted: message });
                    }
                    return;
                }
                
                if (subCommand === 'status') {
                    const status = await AntiLinkHandler.getStatus(groupJid);
                    await this.sock.sendMessage(groupJid, {
                        text: status
                    }, { quoted: message });
                    return;
                }
                
                await this.sock.sendMessage(groupJid, {
                    text: `🔗 *COMANDOS ANTI-LINK*\n\n` +
                          `• !antilink on - Ativar\n` +
                          `• !antilink off - Desativar\n` +
                          `• !antilink action delete/warn/kick - Ação\n` +
                          `• !antilink status - Ver status`
                }, { quoted: message });
                return;
            }

            // ========================================
            // 📌 COMANDOS DO ANTI-SPAM
            // ========================================
            // ========================================
// 📌 COMANDOS DO ANTI-SPAM
// ========================================
if (command === '!antispam') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    
    const isAdminUser = await AntiSpamHandler.isAdmin(this.sock, groupJid, senderId);
    if (!isAdminUser) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Apenas administradores podem configurar o anti-spam'
        }, { quoted: message });
        return;
    }
    
    const args = text.split(' ');
    const subCommand = args[1];
    
    if (subCommand === 'on') {
        await AntiSpamHandler.setEnabled(groupJid, true);
        await this.sock.sendMessage(groupJid, {
            text: '✅ Anti-spam ATIVADO!\n\nLimite: 4 comandos em 5 segundos\nMensagens normais: liberadas'
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'off') {
        await AntiSpamHandler.setEnabled(groupJid, false);
        await this.sock.sendMessage(groupJid, {
            text: '❌ Anti-spam DESATIVADO!'
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'limit') {
        const limit = parseInt(args[2]);
        if (!limit || limit < 1) {
            await this.sock.sendMessage(groupJid, {
                text: '❌ Use: !antispam limit [número]\n📌 Exemplo: !antispam limit 6'
            }, { quoted: message });
            return;
        }
        await AntiSpamHandler.setCommandLimit(groupJid, limit);
        await this.sock.sendMessage(groupJid, {
            text: `✅ Limite alterado para ${limit} comandos em ${await this.getTimeWindow(groupJid)} segundos`
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'time') {
        const seconds = parseInt(args[2]);
        if (!seconds || seconds < 1) {
            await this.sock.sendMessage(groupJid, {
                text: '❌ Use: !antispam time [segundos]\n📌 Exemplo: !antispam time 10'
            }, { quoted: message });
            return;
        }
        await AntiSpamHandler.setBlockTime(groupJid, seconds);
        await this.sock.sendMessage(groupJid, {
            text: `✅ Tempo de bloqueio alterado para ${seconds} segundos`
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'clear') {
        const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) {
            await this.sock.sendMessage(groupJid, {
                text: '❌ Marque o usuário: !antispam clear @usuario'
            }, { quoted: message });
            return;
        }
        await AntiSpamHandler.clearUserCommands(groupJid, mentionedUser);
        await this.sock.sendMessage(groupJid, {
            text: `✅ Registro de comandos limpo para o usuário!`
        }, { quoted: message });
        return;
    }
    
    if (subCommand === 'status') {
        const status = await AntiSpamHandler.getStatus(groupJid);
        await this.sock.sendMessage(groupJid, {
            text: status
        }, { quoted: message });
        return;
    }
    
    // Ajuda
    await this.sock.sendMessage(groupJid, {
        text: `🛡️ *COMANDOS ANTI-SPAM (Só para comandos)*\n\n` +
              `• !antispam on - Ativar\n` +
              `• !antispam off - Desativar\n` +
              `• !antispam limit [n] - Mudar limite (padrão: 4)\n` +
              `• !antispam time [s] - Mudar tempo bloqueio (padrão: 5s)\n` +
              `• !antispam clear @user - Limpar registro\n` +
              `• !antispam status - Ver status\n\n` +
              `💬 Mensagens normais NÃO são bloqueadas!`
    }, { quoted: message });
    return;
}

            // ========================================
            // 🔓 COMANDO !unmute
            // ========================================
            if (command === '!unmute') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await AntiSpamHandler.isAdmin(this.sock, groupJid, senderId);
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem desmutar usuários'
                    }, { quoted: message });
                    return;
                }
                
                const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!mentionedUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Marque o usuário: !unmute @usuario'
                    }, { quoted: message });
                    return;
                }
                
                await AntiSpamHandler.unmuteUser(groupJid, mentionedUser);
                await this.sock.sendMessage(groupJid, {
                    text: `✅ Usuário desmutado!`
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🏓 COMANDO !ping
            // ========================================
            if (command === '!ping') {
                const start = Date.now();
                await this.sock.sendMessage(groupJid, {
                    text: '🏓 Pong!'
                }, { quoted: message });
                const end = Date.now();
                await this.sock.sendMessage(groupJid, {
                    text: `⏱️ Latência: ${end - start}ms`
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🎉 WELCOME
            // ========================================
            if (command === '!onwelcome' || command === '!setbemvindo') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                let stickerBuffer = null;

                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    stickerBuffer = quotedMessage.stickerMessage;
                }
                
                if (!stickerBuffer && message.message?.stickerMessage) {
                    stickerBuffer = message.message.stickerMessage;
                }

                if (!stickerBuffer) {
                    await this.sock.sendMessage(groupJid, {
                        text: `📝 Responda a uma FIGURINHA e digite: !setwelcome`
                    }, { quoted: message });
                    return;
                }

                try {
                    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
                    
                    const stream = await downloadContentFromMessage(stickerBuffer, 'sticker');
                    let buffer = Buffer.from([]);
                    
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    
                    const success = await WelcomeHandler.saveWelcomeSticker(groupJid, buffer, 'sticker');
                    
                    if (success) {
                        await this.sock.sendMessage(groupJid, {
                            text: '✅ Figurinha salva!\n\n🎉 Welcome ativado'
                        }, { quoted: message });
                    } else {
                        await this.sock.sendMessage(groupJid, {
                            text: '❌ Erro ao salvar figurinha'
                        }, { quoted: message });
                    }
                    
                } catch (error) {
                    console.error('❌ Erro:', error);
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Erro ao processar figurinha'
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!ofwelcome' || command === '!desativarwelcome') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                await WelcomeHandler.disableWelcome(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '✅ Welcome desativado'
                }, { quoted: message });
                return;
            }

            if (command === '!welcomestatus' || command === '!statuswelcome') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                const status = WelcomeHandler.getWelcomeStatus(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: status
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🔨 BAN
            // ========================================
            if (command === '!enableban' || command === '!onban') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                GroupHandler.enableBan(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '🔨 Ban ATIVADO\n\n❌ Gringos serão banidos'
                }, { quoted: message });
                return;
            }

            if (command === '!disableban' || command === '!ofban') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                GroupHandler.disableBan(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '🔓 Ban DESATIVADO\n\n✅ Todos podem entrar'
                }, { quoted: message });
                return;
            }

            if (command === '!banstatus' || command === '!statusban') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas em grupos'
                    }, { quoted: message });
                    return;
                }

                const status = GroupHandler.getBanStatus(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: status
                }, { quoted: message });
                return;
            }

            // ========================================
            // 🎨 FIGURINHAS
            // ========================================
            if (command === '!toimg' || command === '!toimage' || command === '!figimg') {
                const { ToImageHandler } = await import('./src/handlers/toImageHandler.js');
                const result = await ToImageHandler.convertStickerToImage(message, this.sock);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!removebg' || command === '!bg') {
                const { RemoveBgHandler } = await import('./src/handlers/removeBgHandler.js');
                const result = await RemoveBgHandler.removeBackground(message, this.sock);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!scircle' || command === '!circle' || command === '!redondo') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const result = await CircleHandler.createCircleSticker(message, this.sock);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            // ========================================
            // 📦 PACOTES DE STICKERS
            // ========================================
            if (command === '!addsticker' || command === '!addfig') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await StickerPackHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores do grupo podem adicionar figurinhas'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const packName = args[1];
                
                if (!packName) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Use: !addsticker [nome do pacote]\n\n📌 Exemplo: !addsticker reacoes'
                    }, { quoted: message });
                    return;
                }
                
                const stickerBuffer = await StickerPackHandler.downloadSticker(message);
                
                if (!stickerBuffer) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Responda a uma FIGURINHA com o comando !addsticker'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.saveSticker(packName, stickerBuffer, message, this.sock);
                
                if (result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: `✅ Figurinha salva!\n\n📦 Pacote: ${result.packName}\n🆔 ID: ${result.fileName}\n📊 Total: ${result.total} figurinhas`
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!pack') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const packName = args[1];
                let quantity = parseInt(args[2]) || 1;
                
                if (!packName) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Use: !pack [nome do pacote] [quantidade]\n\n📌 Exemplo: !pack reacoes\n📌 Exemplo: !pack reacoes 3'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.sendStickers(this.sock, groupJid, packName, quantity, message);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!packs' || command === '!listpack') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const packs = await StickerPackHandler.listPacks();
                
                if (packs.length === 0) {
                    await this.sock.sendMessage(groupJid, {
                        text: '📦 Nenhum pacote disponível ainda.\n\nAdicione figurinhas com: !addsticker [nome]'
                    }, { quoted: message });
                    return;
                }
                
                let packList = '📦 *PACOTES DISPONÍVEIS*\n\n';
                for (const pack of packs) {
                    packList += `• *${pack.name}* - ${pack.count} figurinhas\n`;
                }
                packList += '\n📌 Use: !pack [nome] para receber\n📌 Use: !pack [nome] 3 para várias';
                
                await this.sock.sendMessage(groupJid, {
                    text: packList
                }, { quoted: message });
                return;
            }

            if (command === '!sticker' && text === '!sticker') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.sendRandomSticker(this.sock, groupJid, message);
                
                if (!result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!rmsticker' || command === '!removefig') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await StickerPackHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores do grupo podem remover figurinhas'
                    }, { quoted: message });
                    return;
                }
                
                const args = text.split(' ');
                const stickerId = args[1];
                
                if (!stickerId) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Use: !rmsticker [ID]\n\n📌 Exemplo: !rmsticker reacoes_001'
                    }, { quoted: message });
                    return;
                }
                
                const result = await StickerPackHandler.removeSticker(stickerId, message, this.sock);
                
                if (result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: `✅ Figurinha ${result.stickerId} removida do pacote "${result.packName}"`
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: result.error
                    }, { quoted: message });
                }
                return;
            }
// !rank
if (command === '!rank') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    await showRank(this.sock, message, groupJid, senderId);
    return;
}

// !top
if (command === '!top' || command === '!topconvites') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    await showTopInvites(this.sock, message, groupJid);
    return;
}

// !meusconvites
if (command === '!meusconvites' || command === '!meusconvidados') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    await showMyInvites(this.sock, message, groupJid, senderId);
    return;
}

// !resetconvites (admin)
if (command === '!resetconvites') {
    if (!isGroup) {
        await this.sock.sendMessage(groupJid, {
            text: '❌ Este comando só funciona em grupos'
        }, { quoted: message });
        return;
    }
    const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    await resetUserInvites(this.sock, message, groupJid, senderId, mentionedUser);
    return;
}
            // ========================================
            // 📌 MENU
            // ========================================
            if (command === '!setmenu') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await MenuHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem definir a imagem do menu'
                    }, { quoted: message });
                    return;
                }
                
                const imageBuffer = await MenuHandler.downloadImage(message);
                
                if (!imageBuffer) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Responda a uma IMAGEM com !setmenu'
                    }, { quoted: message });
                    return;
                }
                
                const result = await MenuHandler.saveMenuImage(groupJid, imageBuffer);
                
                if (result.success) {
                    await this.sock.sendMessage(groupJid, {
                        text: '✅ Imagem do menu salva!\n\nUse !menu para ver o novo menu'
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Erro ao salvar imagem'
                    }, { quoted: message });
                }
                return;
            }

            if (command === '!delmenu') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const isAdminUser = await MenuHandler.isAdmin(this.sock, groupJid, senderId);
                
                if (!isAdminUser) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Apenas administradores podem remover a imagem do menu'
                    }, { quoted: message });
                    return;
                }
                
                await MenuHandler.deleteMenuImage(groupJid);
                
                await this.sock.sendMessage(groupJid, {
                    text: '✅ Imagem do menu removida! O menu voltará ao formato texto.'
                }, { quoted: message });
                return;
            }

            if (command === '!menu') {
                if (!isGroup) {
                    await this.sock.sendMessage(groupJid, {
                        text: '❌ Este comando só funciona em grupos'
                    }, { quoted: message });
                    return;
                }
                
                const menuText = MenuHandler.getMenuText();
                const menuImage = await MenuHandler.getMenuImage(groupJid);
                
                if (menuImage) {
                    await this.sock.sendMessage(groupJid, {
                        image: menuImage,
                        caption: menuText
                    }, { quoted: message });
                } else {
                    await this.sock.sendMessage(groupJid, {
                        text: menuText
                    }, { quoted: message });
                }
                return;
            }

            // ========================================
            // 🎨 STICKER PLUGIN
            // ========================================
            if (command === '!fig' || command === '!sticker' || command === '!s') {
                await stickerPlugin(this.sock, message);
                return;
            }

            // ========================================
            // ❓ HELP
            // ========================================
if (command === '!help') {
    const text = `
🤖 STICKER BOT - AJUDA COMPLETA

🎨 FIGURINHAS:
• !fig / !s / !sticker - Criar figurinha
• !toimg / !toimage - Converter figurinha para imagem
• !removebg / !bg - Remover fundo da imagem
• !scircle / !redondo - Sticker redondo

📦 PACOTES DE FIGURINHAS:
• !pack [nome] - Receber figurinha
• !packs - Listar pacotes
• !addsticker [nome] - (Admin) Salvar
• !rmsticker [ID] - (Admin) Remover

🎉 WELCOME:
• !setwelcome - Configurar sticker de boas-vindas
• !disablewelcome - Desativar
• !welcomestatus - Status

🔨 BAN:
• !enableban - Ativar ban de gringos
• !disableban - Desativar
• !banstatus - Status

🔗 ANTI-LINK:
• !antilink on/off - Ativar/Desativar
• !antilink action delete/warn/kick - Ação
• !antilink status - Ver status

🛡️ ANTI-SPAM (Só comandos):
• !antispam on/off - Ativar/Desativar
• !antispam limit [n] - Mudar limite (padrão: 4)
• !antispam time [s] - Mudar tempo bloqueio (padrão: 5s)
• !antispam clear @user - Limpar registro
• !antispam status - Ver status

🏆 CONVITES:
• !rank - Ver seus pontos e nível
• !top - Top convites do grupo
• !meusconvites - Quem você convidou
• !resetconvites @user - (Admin) Resetar pontos

📌 MENU:
• !menu - Menu principal
• !setmenu - (Admin) Definir imagem do menu

🏓 UTILIDADES:
• !ping - Verificar latência

💬 Mensagens normais NUNCA são bloqueadas!
    `;
    await this.sock.sendMessage(groupJid, { text }, { quoted: message });
    return;
}
        } catch (error) {
            console.log('❌ Erro:', error.message);
        }
    }

    getMessageText(message) {
        const msg = message.message;
        return (
            msg?.conversation ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            msg?.extendedTextMessage?.text
        );
    }
}

console.log('🎯 Iniciando bot...');
console.log('💡 Aguarde o QR code ou digite "code" para código alfanumérico\n');
new StickerBot();

```


### 📄 `plugins/sticker.js`

```
//atualizador porcdeedsek
import { StickerHandler } from '../src/handlers/stickerHandler.js';

export async function stickerPlugin(sock, message) {
    try {
        console.log('🔄 Iniciando processo de sticker...');

        const result = await StickerHandler.createStickerFromMessage(message, sock);
        
        if (!result.success) {
            await sock.sendMessage(message.key.remoteJid, {
                text: result.error
            }, { quoted: message });
            return;
        }

        console.log('📤 Enviando sticker...');
        
        await sock.sendMessage(message.key.remoteJid, {
            sticker: result.buffer
        }, { quoted: message });

        console.log('✅ Sticker enviado com sucesso!');

    } catch (error) {
        console.error('💥 Erro fatal no sticker plugin:', error);
        
        await sock.sendMessage(message.key.remoteJid, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

export const stickerCommands = {
    name: 'sticker',
    description: 'Cria stickers de imagens, vídeos e visualização única',
    usage: 'Envie imagem/vídeo com !fig OU marque uma mídia com !fig\n✅ Agora suporta visualização única!',
    aliases: ['fig', 's']
};

```


### 📄 `plugins/inviteRank.js`

```
// plugins/inviteRank.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const INVITES_DIR = './invites_data';
const POINTS_ADD = 10;      // Pontos por convidar alguém novo
const POINTS_RETURN = 5;    // Pontos por convidar alguém que já saiu

// Níveis
const LEVELS = [
    { name: 'Bronze', min: 0, icon: '🟤' },
    { name: 'Prata', min: 50, icon: '⚪' },
    { name: 'Ouro', min: 150, icon: '🟡' },
    { name: 'Platina', min: 300, icon: '💎' },
    { name: 'Diamante', min: 500, icon: '🔥' }
];

// Garantir pasta de dados
async function ensureDir() {
    if (!existsSync(INVITES_DIR)) {
        mkdirSync(INVITES_DIR, { recursive: true });
        console.log('📁 Pasta de dados de convites criada');
    }
}

// Carregar dados do grupo
async function loadGroupData(groupJid) {
    await ensureDir();
    const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = join(INVITES_DIR, fileName);
    
    if (existsSync(filePath)) {
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    
    return {
        users: {},      // { userId: { name, points, invites: [userId], totalInvites } }
        membersHistory: {}  // { userId: lastSeen }
    };
}

// Salvar dados do grupo
async function saveGroupData(groupJid, data) {
    await ensureDir();
    const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = join(INVITES_DIR, fileName);
    await writeFile(filePath, JSON.stringify(data, null, 2));
}

// Obter nível do usuário
function getUserLevel(points) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].min) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

// Obter nome do usuário (se disponível)
async function getUserName(sock, groupJid, userId) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const participant = metadata.participants.find(p => p.id === userId);
        if (participant) {
            return participant.name || participant.pushname || userId.split('@')[0];
        }
    } catch (error) {}
    return userId.split('@')[0];
}

// Processar entrada de novo membro
export async function handleNewMember(sock, groupJid, newMemberId, inviterId, inviterName) {
    try {
        const data = await loadGroupData(groupJid);
        
        // Verificar se é a primeira vez do membro
        const isFirstTime = !data.membersHistory[newMemberId];
        
        // Pontos a dar
        let pointsEarned = isFirstTime ? POINTS_ADD : POINTS_RETURN;
        
        // Inicializar usuário se não existir
        if (!data.users[inviterId]) {
            data.users[inviterId] = {
                name: inviterName,
                points: 0,
                invites: [],
                totalInvites: 0
            };
        }
        
        // Verificar se já convidou essa pessoa antes
        const alreadyInvited = data.users[inviterId].invites.includes(newMemberId);
        
        if (!alreadyInvited) {
            // Adicionar pontos
            data.users[inviterId].points += pointsEarned;
            data.users[inviterId].invites.push(newMemberId);
            data.users[inviterId].totalInvites++;
            
            // Salvar histórico do membro
            data.membersHistory[newMemberId] = {
                firstJoined: Date.now(),
                invitedBy: inviterId,
                timesJoined: (data.membersHistory[newMemberId]?.timesJoined || 0) + 1
            };
            
            await saveGroupData(groupJid, data);
            
            // Buscar nome do convidado
            const newMemberName = await getUserName(sock, groupJid, newMemberId);
            const inviterDisplayName = await getUserName(sock, groupJid, inviterId);
            const level = getUserLevel(data.users[inviterId].points);
            
            // Enviar mensagem de notificação
            const message = `🎉 *${inviterDisplayName}* convidou *${newMemberName}*! (+${pointsEarned} pontos)\n\n📊 *${inviterDisplayName}* agora tem *${data.users[inviterId].points}* pontos\n🏆 Nível: ${level.icon} *${level.name}*\n👥 Total de convites: *${data.users[inviterId].totalInvites}*`;
            
            await sock.sendMessage(groupJid, { text: message });
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar convite:', error);
    }
}

// Processar remoção de membro (para histórico)
export async function handleMemberLeave(groupJid, memberId) {
    try {
        const data = await loadGroupData(groupJid);
        // Não removemos do histórico, só marcamos que saiu
        if (data.membersHistory[memberId]) {
            data.membersHistory[memberId].lastLeft = Date.now();
            await saveGroupData(groupJid, data);
        }
    } catch (error) {
        console.error('❌ Erro ao processar saída:', error);
    }
}

// Comando !rank
export async function showRank(sock, message, groupJid, senderId) {
    try {
        const data = await loadGroupData(groupJid);
        
        if (!data.users[senderId]) {
            await sock.sendMessage(groupJid, {
                text: '📊 Você ainda não convidou ninguém!\n\nConvide amigos para o grupo e ganhe pontos! 🎉'
            }, { quoted: message });
            return;
        }
        
        const user = data.users[senderId];
        const level = getUserLevel(user.points);
        
        // Calcular próximo nível
        let nextLevel = null;
        for (let i = 0; i < LEVELS.length - 1; i++) {
            if (user.points < LEVELS[i + 1].min) {
                nextLevel = LEVELS[i + 1];
                break;
            }
        }
        
        // Calcular posição no ranking
        const sorted = Object.entries(data.users).sort((a, b) => b[1].points - a[1].points);
        const position = sorted.findIndex(([id]) => id === senderId) + 1;
        
        let rankText = `🏆 *SEU RANKING DE CONVITES*\n\n`;
        rankText += `📊 *Pontos:* ${user.points}\n`;
        rankText += `🎖️ *Nível:* ${level.icon} ${level.name}\n`;
        rankText += `👥 *Convidados:* ${user.totalInvites}\n`;
        rankText += `📈 *Posição:* ${position}º lugar\n`;
        
        if (nextLevel) {
            const needed = nextLevel.min - user.points;
            rankText += `\n📌 *Próximo nível:* ${nextLevel.icon} ${nextLevel.name}\n`;
            rankText += `✨ *Faltam:* ${needed} pontos\n`;
        }
        
        await sock.sendMessage(groupJid, { text: rankText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao buscar ranking'
        }, { quoted: message });
    }
}

// Comando !top
export async function showTopInvites(sock, message, groupJid) {
    try {
        const data = await loadGroupData(groupJid);
        
        const sorted = Object.entries(data.users)
            .sort((a, b) => b[1].points - a[1].points)
            .slice(0, 10);
        
        if (sorted.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '📊 Nenhum convite registrado ainda!\n\nConvide amigos para aparecer no ranking! 🎉'
            }, { quoted: message });
            return;
        }
        
        let topText = `🏆 *TOP CONVITES DO GRUPO*\n\n`;
        
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < sorted.length; i++) {
            const [userId, userData] = sorted[i];
            const medal = i < 3 ? medals[i] : `${i + 1}️⃣`;
            const level = getUserLevel(userData.points);
            
            // Buscar nome (pode não ter, usa número)
            let name = userData.name || userId.split('@')[0];
            if (name.length > 20) name = name.slice(0, 17) + '...';
            
            topText += `${medal} *${name}* - ${userData.points} pts (${level.icon} ${level.name})\n`;
            topText += `   👥 ${userData.totalInvites} convite(s)\n\n`;
        }
        
        topText += `📌 Use *!rank* para ver sua pontuação!`;
        
        await sock.sendMessage(groupJid, { text: topText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao buscar top convites'
        }, { quoted: message });
    }
}

// Comando !meusconvites
export async function showMyInvites(sock, message, groupJid, senderId) {
    try {
        const data = await loadGroupData(groupJid);
        
        if (!data.users[senderId] || data.users[senderId].invites.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '📊 Você ainda não convidou ninguém!\n\nUse o link do grupo ou adicione diretamente para ganhar pontos! 🎉'
            }, { quoted: message });
            return;
        }
        
        const user = data.users[senderId];
        
        let invitesText = `👥 *PESSOAS QUE VOCÊ CONVIDOU*\n\n`;
        invitesText += `Total: *${user.totalInvites}* convite(s)\n`;
        invitesText += `Pontos: *${user.points}*\n\n`;
        
        invitesText += `📋 *Lista:*\n`;
        
        // Mostrar últimos 10 convites
        const lastInvites = user.invites.slice(-10);
        for (let i = 0; i < lastInvites.length; i++) {
            const invitedId = lastInvites[i];
            // Buscar nome (se disponível no histórico)
            const history = data.membersHistory[invitedId];
            invitesText += `${i + 1}. ${invitedId.split('@')[0]}\n`;
        }
        
        if (user.invites.length > 10) {
            invitesText += `\n... e mais ${user.invites.length - 10} convite(s)`;
        }
        
        await sock.sendMessage(groupJid, { text: invitesText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao buscar seus convites'
        }, { quoted: message });
    }
}

// Comando admin: !resetconvites @user
export async function resetUserInvites(sock, message, groupJid, senderId, mentionedUser) {
    try {
        // Verificar se quem mandou é admin
        const metadata = await sock.groupMetadata(groupJid);
        const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin === 'admin' || 
                       metadata.participants.find(p => p.id === senderId)?.admin === 'superadmin';
        
        if (!isAdmin) {
            await sock.sendMessage(groupJid, {
                text: '❌ Apenas administradores podem resetar pontos!'
            }, { quoted: message });
            return;
        }
        
        if (!mentionedUser) {
            await sock.sendMessage(groupJid, {
                text: '❌ Marque o usuário: !resetconvites @usuario'
            }, { quoted: message });
            return;
        }
        
        const data = await loadGroupData(groupJid);
        
        if (data.users[mentionedUser]) {
            const userName = await getUserName(sock, groupJid, mentionedUser);
            delete data.users[mentionedUser];
            await saveGroupData(groupJid, data);
            
            await sock.sendMessage(groupJid, {
                text: `✅ Pontos de *${userName}* foram resetados!`
            }, { quoted: message });
        } else {
            await sock.sendMessage(groupJid, {
                text: '❌ Usuário não tem pontos registrados!'
            }, { quoted: message });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao resetar pontos'
        }, { quoted: message });
    }
}

```


### 📄 `src/handlers/welcomeHandler.js`

```
/**
 * Handler de Boas-vindas - CORRIGIDO
 * Baixa, salva e envia figurinha corretamente
 */

import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

export class WelcomeHandler {
    
    static WELCOME_DIR = './welcome_stickers';

    /**
     * Inicializa pasta
     */
    static async init() {
        try {
            if (!existsSync(this.WELCOME_DIR)) {
                await mkdir(this.WELCOME_DIR, { recursive: true });
                console.log(`📁 Pasta de welcome criada`);
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    /**
     * Envia welcome sticker quando novo membro entra
     */
    static async sendWelcomeSticker(sock, groupJid, participantNumber) {
        try {
            if (!this.isWelcomeEnabled(groupJid)) {
                console.log(`ℹ️ Welcome desativado`);
                return;
            }

            const stickerBuffer = await this.getWelcomeSticker(groupJid);
            
            if (!stickerBuffer) {
                console.log(`⚠️ Figurinha não configurada`);
                return;
            }

            // ✅ ENVIAR FIGURINHA CORRETAMENTE
            console.log(`📤 Enviando figurinha (${stickerBuffer.length} bytes)...`);
            
            await sock.sendMessage(groupJid, {
                sticker: stickerBuffer
            });

            console.log(`✅ Welcome sticker enviado!`);

        } catch (error) {
            console.error('❌ Erro:', error.message);
        }
    }

    /**
     * Salvar figurinha de welcome
     * CORRIGIDO: Verifica tamanho do arquivo
     */
    static async saveWelcomeSticker(groupJid, stickerBuffer, mediaType = 'image') {
        try {
            if (!stickerBuffer || stickerBuffer.length === 0) {
                console.log(`❌ Buffer vazio! Não conseguiu baixar figurinha`);
                return false;
            }

            console.log(`📥 Buffer recebido: ${stickerBuffer.length} bytes`);

            const fileName = `${groupJid}.webp`;
            const filePath = join(this.WELCOME_DIR, fileName);
            
            // Salvar arquivo
            await writeFile(filePath, stickerBuffer);
            
            // ✅ VERIFICAR se foi salvo
            const stats = statSync(filePath);
            console.log(`📁 Arquivo salvo: ${filePath}`);
            console.log(`📊 Tamanho: ${stats.size} bytes`);

            if (stats.size === 0) {
                console.log(`❌ Arquivo salvo mas vazio!`);
                return false;
            }

            console.log(`\n✅ FIGURINHA SALVA COM SUCESSO!`);
            console.log(`📊 Tamanho: ${stats.size} bytes`);
            console.log(`👥 Grupo: ${groupJid}`);
            console.log(`\n🚀 A figurinha será enviada quando novo membro entrar!`);
            console.log(`❌ Para desativar, use: !disablewelcome`);
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            return false;
        }
    }

    /**
     * Obter figurinha salva
     */
    static async getWelcomeSticker(groupJid) {
        try {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            
            if (!existsSync(filePath)) {
                console.log(`❌ Arquivo não existe: ${filePath}`);
                return null;
            }

            const stats = statSync(filePath);
            
            if (stats.size === 0) {
                console.log(`❌ Arquivo vazio: ${filePath}`);
                return null;
            }

            console.log(`✅ Carregando figurinha (${stats.size} bytes)`);
            return await readFile(filePath);

        } catch (error) {
            console.error('❌ Erro ao ler:', error);
            return null;
        }
    }

    /**
     * Desativar welcome
     */
    static async disableWelcome(groupJid) {
        try {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ Welcome desativado`);
                return true;
            }
            
            console.log(`ℹ️ Welcome não estava ativado`);
            return false;

        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Verificar se welcome está ativado
     */
    static isWelcomeEnabled(groupJid) {
        const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
        
        if (!existsSync(filePath)) {
            return false;
        }

        try {
            const stats = statSync(filePath);
            return stats.size > 0;
        } catch {
            return false;
        }
    }

    /**
     * Status do welcome
     */
    static getWelcomeStatus(groupJid) {
        const isEnabled = this.isWelcomeEnabled(groupJid);
        
        if (isEnabled) {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            const stats = statSync(filePath);
            return `✅ Welcome ATIVADO\n\n📊 Tamanho: ${stats.size} bytes\n🎉 Figurinha será enviada`;
        } else {
            return `❌ Welcome DESATIVADO\n\n📝 Configure com:\n1. Responda a uma figurinha\n2. Digite: !setwelcome`;
        }
    }
}

```


### 📄 `src/handlers/groupHandler.js`

```
/**
 * Handler de Grupo - BAN CONFIGURÁVEL
 * Ativa/Desativa ban de gringos com comando
 */

import { ProtectionUtils } from '../utils/protectionUtils.js';
import { WelcomeHandler } from './welcomeHandler.js';
import { config } from '../../config.js';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { handleNewMember } from '../../plugins/inviteRank.js'; 
export class GroupHandler {
    
    static BAN_DIR = './ban_config';

    /**
     * Inicializa pasta de config
     */
    static async init() {
        try {
            if (!existsSync(this.BAN_DIR)) {
                const fs = await import('fs/promises');
                await fs.mkdir(this.BAN_DIR, { recursive: true });
                console.log(`📁 Pasta de ban config criada`);
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    /**
     * Processa quando membro entra no grupo
     */
    static async handleGroupParticipantsUpdate(update, sock, groupJid) {
        try {
            const { participants, action } = update;

            if (action !== 'add') {
                return;
            }

            console.log(`\n👥 NOVO(S) MEMBRO(S) ENTRANDO`);
            console.log(`📍 Grupo: ${groupJid}`);

            // Processar cada novo membro
            for (const participant of participants) {
                await this.handleNewMember(participant, sock, groupJid);
            }

        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }

    /**
     * Processa novo membro
     */
    static async handleNewMember(participant, sock, groupJid) {
        try {
            // Extrair número
            const number = ProtectionUtils.extractNumber({ key: { participant } }, true);

            if (!number) {
                console.log(`⚠️ Número inválido`);
                return;
            }

            console.log(`📱 Novo membro: ${number}`);

            // Verificar se é gringo
            const isForeign = ProtectionUtils.isForeignNumber(number, config.protection.antigringo.countryCode);
            
            // ✅ VERIFICAR SE BAN ESTÁ ATIVADO
            const banEnabled = this.isBanEnabled(groupJid);

            if (isForeign && banEnabled) {
                // Gringo + Ban ativado = BAN
                console.log(`⛔ GRINGO + BAN ATIVADO`);
                console.log(`🔨 BANINDO...`);

                await this.banMember(sock, groupJid, participant);

                if (config.protection.actions.banMessage) {
                    await this.sendBanNotification(sock, groupJid);
                }

            } else {
              // Após identificar quem convidou (inviterId), chame:
await handleNewMember(sock, groupJid, participant, inviterId, inviterName);
                // Qualquer outro caso = WELCOME
                if (isForeign && !banEnabled) {
                    console.log(`🌍 Gringo (mas ban desativado)`);
                } else {
                    console.log(`🇧🇷 Brasileiro`);
                }
                
                console.log(`✅ Bem-vindo ao grupo!`);
                
                // Manda welcome sticker
                await WelcomeHandler.sendWelcomeSticker(sock, groupJid, number);
            }

        } catch (error) {
            console.error(`❌ Erro:`, error);
        }
    }

    /**
     * Verifica se ban está ativado para este grupo
     */
    static isBanEnabled(groupJid) {
        const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
        return existsSync(banFile);
    }

    /**
     * Ativa ban de gringos
     */
    static enableBan(groupJid) {
        try {
            const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
            writeFileSync(banFile, '1');
            console.log(`✅ Ban de gringos ATIVADO`);
            return true;
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Desativa ban de gringos
     */
    static disableBan(groupJid) {
        try {
            const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
            if (existsSync(banFile)) {
                unlinkSync(banFile);
            }
            console.log(`✅ Ban de gringos DESATIVADO`);
            return true;
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Ver status do ban
     */
    static getBanStatus(groupJid) {
        const isEnabled = this.isBanEnabled(groupJid);
        
        if (isEnabled) {
            return `🔨 Ban de gringos: ATIVADO\n\n❌ Gringos serão banidos\n✅ Brasileiros receberão welcome`;
        } else {
            return `🔓 Ban de gringos: DESATIVADO\n\n✅ Todos podem entrar\n✅ Todos receberão welcome`;
        }
    }

    /**
     * Bane um membro
     */
    static async banMember(sock, groupJid, participant) {
        try {
            await sock.groupParticipantsUpdate(
                groupJid,
                [participant],
                'remove'
            );

            console.log(`✅ Banido!`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao banir:`, error.message);
            return false;
        }
    }

    /**
     * Notifica ban
     */
    static async sendBanNotification(sock, groupJid) {
        try {
            const message = `⛔ Membro gringo foi banido!\n\n🇧🇷 Este grupo aceita apenas brasileiros.`;

            await sock.sendMessage(groupJid, {
                text: message
            });

        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
}

```


### 📄 `src/handlers/protectionHandler.js`

```
/**
 * Handler de Proteção - VERSÃO SIMPLES
 * Apenas deixa mensagens passarem normalmente
 * O ban acontece em groupHandler.js
 */

import { ProtectionUtils } from '../utils/protectionUtils.js';
import { config } from '../../config.js';

export class ProtectionHandler {
    
    /**
     * Valida mensagens - AGORA APENAS DEIXA PASSAR
     * Ban de gringos acontece quando entram no grupo
     */
    static validateMessage(message) {
        try {
            // Não faz nada com mensagens
            // Ban automático acontece em groupHandler.js
            console.log(`✅ Mensagem passando (sem validação)`);
            return { blocked: false };

        } catch (error) {
            console.error('❌ Erro ao validar:', error);
            return { blocked: false };
        }
    }

    /**
     * Extrai texto da mensagem
     */
    static getMessageText(message) {
        const msg = message.message;
        return (
            msg?.conversation ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            msg?.extendedTextMessage?.text ||
            ''
        );
    }

    /**
     * Envia mensagem de bloqueio
     */
    static async sendBlockMessage(sock, message, blockInfo) {
        try {
            const blockMessage = ProtectionUtils.getBlockMessage(blockInfo.type);
            
            await sock.sendMessage(message.key.remoteJid, {
                text: blockMessage
            }, { quoted: message });

            console.log(`✅ Mensagem de bloqueio enviada`);
        } catch (error) {
            console.error('❌ Erro ao enviar bloqueio:', error);
        }
    }

    /**
     * Deleta mensagem bloqueada
     */
    static async deleteBlockedMessage(sock, message) {
        try {
            await sock.sendMessage(message.key.remoteJid, {
                delete: message.key
            });
            console.log('✅ Mensagem deletada');
        } catch (error) {
            console.log('⚠️ Não foi possível deletar');
        }
    }
}

```


### 📄 `src/handlers/stickerHandler.js`

```
//ATUALIZADOpor deedpseek
import { downloadContentFromMessage, proto } from '@whiskeysockets/baileys';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export class StickerHandler {
    static async createStickerFromMessage(message, sock) {
        try {
            console.log('🔄 Processando sticker...');

            // ✅ AGORA SUPORTA VISUALIZAÇÃO ÚNICA
            let mediaMessage = message;
            let isViewOnce = false;

            // Verificar se é mensagem marcada (quoted)
            if (message.message?.extendedTextMessage?.contextInfo) {
                console.log('📌 Mensagem marcada detectada');
                const contextInfo = message.message.extendedTextMessage.contextInfo;
                mediaMessage = {
                    ...message,
                    message: contextInfo.quotedMessage
                };
                
                // Verificar se é visualização única marcada
                isViewOnce = contextInfo.quotedMessage?.viewOnceMessageV2 ||
                           contextInfo.quotedMessage?.viewOnceMessageV2Extension;
            }

            // Verificar se é visualização única direta
            if (!isViewOnce) {
                isViewOnce = mediaMessage.message?.viewOnceMessageV2 ||
                           mediaMessage.message?.viewOnceMessageV2Extension;
            }

            // ✅ EXTRAIR MÍDIA DE VISUALIZAÇÃO ÚNICA
            let actualMediaMessage = mediaMessage;
            if (isViewOnce) {
                console.log('👁️ Visualização única detectada');
                // Extrair a mídia real de dentro da mensagem de visualização única
                actualMediaMessage = {
                    ...mediaMessage,
                    message: mediaMessage.message?.viewOnceMessageV2?.message ||
                            mediaMessage.message?.viewOnceMessageV2Extension?.message
                };
            }

            // Verificar se tem mídia (agora incluindo visualização única)
            const isImage = actualMediaMessage.message?.imageMessage ||
                          actualMediaMessage.message?.viewOnceMessageV2?.message?.imageMessage;
            
            const isVideo = actualMediaMessage.message?.videoMessage ||
                          actualMediaMessage.message?.viewOnceMessageV2?.message?.videoMessage;

            if (!isImage && !isVideo) {
                return {
                    success: false,
                    error: '❌ Nenhuma mídia encontrada. Envie uma imagem/vídeo ou marque uma mídia existente.'
                };
            }

            console.log(isVideo ? '🎥 Vídeo detectado' + (isViewOnce ? ' (visualização única)' : '') : 
                         '🖼️ Imagem detectada' + (isViewOnce ? ' (visualização única)' : ''));
            
            console.log('📥 Baixando mídia...');

            // ✅ DOWNLOAD SUPORTANDO VISUALIZAÇÃO ÚNICA
            const mediaBuffer = await this.downloadMedia(actualMediaMessage, isVideo ? 'video' : 'image', isViewOnce);
            
            if (!mediaBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao baixar mídia. Tente enviar novamente.'
                };
            }

            console.log(`✅ Download concluído: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB`);

            // Criar sticker
            let stickerBuffer;
            if (isVideo) {
                stickerBuffer = await this.createVideoSticker(mediaBuffer);
            } else {
                stickerBuffer = await this.createImageSticker(mediaBuffer);
            }

            if (!stickerBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao criar figurinha'
                };
            }

            console.log('✅ Figurinha criada com sucesso!' + (isViewOnce ? ' (de visualização única)' : ''));
            return { success: true, buffer: stickerBuffer };

        } catch (error) {
            console.error('💥 Erro no StickerHandler:', error);
            await this.cleanTempFiles();
            
            if (error.message.includes('view once') || error.message.includes('view_once')) {
                return {
                    success: false,
                    error: '❌ Não foi possível processar visualização única. O WhatsApp pode ter bloqueado o acesso.'
                };
            }
            
            return {
                success: false,
                error: '❌ Erro ao processar mídia'
            };
        }
    }

    // ✅ MÉTODO ATUALIZADO: Suporte a visualização única
    static async downloadMedia(message, type, isViewOnce = false) {
        try {
            console.log(isViewOnce ? '🔓 Processando visualização única...' : '📥 Baixando mídia normal...');
            
            let media;
            
            if (isViewOnce) {
                // Para visualização única, a mídia está em viewOnceMessageV2.message
                media = message.message?.viewOnceMessageV2?.message?.[`${type}Message`] ||
                       message.message?.[`${type}Message`];
            } else {
                // Para mídia normal
                media = message.message?.[`${type}Message`];
            }

            if (!media) {
                throw new Error('Mídia não encontrada');
            }

            // Método mais confiável para download
            const stream = await downloadContentFromMessage(media, type);
            
            const bufferChunks = [];
            for await (const chunk of stream) {
                bufferChunks.push(chunk);
            }
            
            const buffer = Buffer.concat(bufferChunks);
            
            if (buffer.length === 0) {
                throw new Error('Mídia vazia');
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro no download:', error);
            
            // Tentar método alternativo
            try {
                console.log('🔄 Tentando método alternativo...');
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                
                // Para visualização única, precisamos ajustar a mensagem
                let downloadMessage = message;
                if (isViewOnce) {
                    downloadMessage = {
                        ...message,
                        message: message.message?.viewOnceMessageV2?.message || message.message
                    };
                }
                
                return await downloadMediaMessage(
                    downloadMessage,
                    'buffer',
                    {},
                    { reuploadRequest: async () => {} }
                );
            } catch (fallbackError) {
                console.error('❌ Método alternativo também falhou:', fallbackError);
                
                if (isViewOnce) {
                    throw new Error('Não foi possível acessar mídia de visualização única');
                } else {
                    throw new Error('Não foi possível baixar a mídia');
                }
            }
        }
    }

    static async createImageSticker(imageBuffer) {
        try {
            console.log('🎨 Criando sticker de imagem...');
            
            // Forçar 512x512 distorcendo a imagem
            const processedImage = await sharp(imageBuffer)
                .resize(512, 512, {
                    fit: 'fill', // Distorce para caber no quadrado
                    withoutEnlargement: false
                })
                .png()
                .toBuffer();

            const sticker = new Sticker(processedImage, {
                pack: 'link do grupo ',
                author: 'inst:@sticker of kings',
                type: StickerTypes.FULL,
                quality: 80,
                background: 'transparent'
            });

            return await sticker.toBuffer();
            
        } catch (error) {
            console.error('❌ Erro ao criar sticker de imagem:', error);
            throw error;
        }
    }

    static async createVideoSticker(videoBuffer) {
        let tempInput, tempOutput;
        
        try {
            console.log('🎬 Criando sticker de vídeo...');
            
            const timestamp = Date.now();
            tempInput = `./temp_video_${timestamp}.mp4`;
            tempOutput = `./temp_sticker_${timestamp}.webp`;
            
            await writeFile(tempInput, videoBuffer);

            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .inputOptions(['-loglevel error', '-y'])
                    .outputOptions([
                        '-vcodec libwebp',
                        '-vf scale=512:512:flags=lanczos',
                        '-loop 0',
                        '-r 10',
                        '-preset default',
                        '-an',
                        '-quality 60',
                        '-compression_level 4',
                        '-f webp'
                    ])
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempOutput);
            });

            const stickerBuffer = await readFile(tempOutput);
            return stickerBuffer;
            
        } catch (error) {
            console.error('❌ Erro ao criar sticker de vídeo:', error);
            throw error;
        } finally {
            await this.safeUnlink(tempInput);
            await this.safeUnlink(tempOutput);
        }
    }

    static async safeUnlink(filePath) {
        try {
            if (filePath) await unlink(filePath);
        } catch (error) {
            // Ignora erros
        }
    }

    static async cleanTempFiles() {
        try {
            const files = await readdir('.');
            const tempFiles = files.filter(file => 
                file.startsWith('temp_') && 
                (file.endsWith('.mp4') || file.endsWith('.webp'))
            );
            
            for (const file of tempFiles) {
                await this.safeUnlink(file);
            }
        } catch (error) {
            // Ignora erros
        }
    }
}

```


### 📄 `src/handlers/toImageHandler.js`

```
// src/handlers/toImageHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export class ToImageHandler {
    
    /**
     * Converte sticker para imagem
     */
    static async convertStickerToImage(message, sock) {
        try {
            console.log('🔄 Iniciando conversão sticker → imagem...');

            // Verificar se é mensagem marcada (respondendo a figurinha)
            let stickerMessage = null;
            let isQuoted = false;

            if (message.message?.extendedTextMessage?.contextInfo) {
                const contextInfo = message.message.extendedTextMessage.contextInfo;
                if (contextInfo.quotedMessage?.stickerMessage) {
                    stickerMessage = contextInfo.quotedMessage.stickerMessage;
                    isQuoted = true;
                    console.log('📌 Figurinha marcada detectada');
                }
            }

            // Verificar se a mensagem atual é figurinha
            if (!stickerMessage && message.message?.stickerMessage) {
                stickerMessage = message.message.stickerMessage;
                console.log('📌 Figurinha direta detectada');
            }

            if (!stickerMessage) {
                return {
                    success: false,
                    error: '❌ Responda a uma figurinha ou envie uma figurinha com o comando !toimg'
                };
            }

            console.log('📥 Baixando figurinha...');

            // Baixar o sticker
            const stickerBuffer = await this.downloadSticker(stickerMessage);
            
            if (!stickerBuffer || stickerBuffer.length === 0) {
                return {
                    success: false,
                    error: '❌ Erro ao baixar a figurinha'
                };
            }

            console.log(`✅ Download concluído: ${(stickerBuffer.length / 1024).toFixed(2)}KB`);

            // Converter sticker para imagem
            const imageBuffer = await this.convertStickerToImageBuffer(stickerBuffer);

            if (!imageBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao converter figurinha para imagem'
                };
            }

            console.log(`✅ Conversão concluída: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

            // Enviar a imagem
            await sock.sendMessage(message.key.remoteJid, {
                image: imageBuffer,
                caption: '🖼️ *Figurinha convertida para imagem*\n\n📏 Tamanho original preservado'
            }, { quoted: message });

            console.log('✅ Imagem enviada com sucesso!');
            
            return { success: true };

        } catch (error) {
            console.error('❌ Erro ao converter sticker:', error);
            return {
                success: false,
                error: '❌ Erro ao processar a figurinha. Verifique se é uma figurina válida.'
            };
        }
    }

    /**
     * Baixa o sticker do WhatsApp
     */
    static async downloadSticker(stickerMessage) {
        try {
            const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
            const chunks = [];
            
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            
            return Buffer.concat(chunks);
            
        } catch (error) {
            console.error('❌ Erro no download:', error);
            throw error;
        }
    }

    /**
     * Converte sticker WebP para PNG/JPEG
     */
    static async convertStickerToImageBuffer(stickerBuffer) {
        let tempInput = null;
        let tempOutput = null;
        
        try {
            const timestamp = Date.now();
            tempInput = path.join('./temp', `sticker_${timestamp}.webp`);
            tempOutput = path.join('./temp', `output_${timestamp}.png`);
            
            // Garantir que pasta temp existe
            const { mkdir } = await import('fs/promises');
            await mkdir('./temp', { recursive: true });
            
            // Salvar sticker temporariamente
            await writeFile(tempInput, stickerBuffer);
            
            // Converter WebP para PNG usando Sharp
            await sharp(tempInput)
                .png({
                    quality: 100,
                    compressionLevel: 6
                })
                .toFile(tempOutput);
            
            // Ler o arquivo convertido
            const { readFile } = await import('fs/promises');
            const imageBuffer = await readFile(tempOutput);
            
            // Obter dimensões da imagem original
            const metadata = await sharp(tempInput).metadata();
            console.log(`📐 Dimensões originais: ${metadata.width}x${metadata.height}`);
            
            // Se a imagem for muito pequena (sticker geralmente é 512x512), 
            // podemos manter o tamanho original ou redimensionar
            // Por padrão, mantemos o tamanho original do sticker
            
            return imageBuffer;
            
        } catch (error) {
            console.error('❌ Erro na conversão:', error);
            
            // Tentar método alternativo: converter para JPEG
            try {
                console.log('🔄 Tentando converter para JPEG...');
                const timestamp = Date.now();
                tempInput = path.join('./temp', `sticker_${timestamp}.webp`);
                tempOutput = path.join('./temp', `output_${timestamp}.jpg`);
                
                await writeFile(tempInput, stickerBuffer);
                
                await sharp(tempInput)
                    .jpeg({
                        quality: 90,
                        progressive: true
                    })
                    .toFile(tempOutput);
                
                const { readFile } = await import('fs/promises');
                return await readFile(tempOutput);
                
            } catch (fallbackError) {
                console.error('❌ Método alternativo falhou:', fallbackError);
                throw error;
            }
            
        } finally {
            // Limpar arquivos temporários
            await this.cleanTempFile(tempInput);
            await this.cleanTempFile(tempOutput);
        }
    }

    /**
     * Limpa arquivos temporários
     */
    static async cleanTempFile(filePath) {
        try {
            if (filePath) {
                await unlink(filePath);
            }
        } catch (error) {
            // Ignora erros de arquivo não encontrado
        }
    }
}

```


### 📄 `src/handlers/removeBgHandler.js`

```
// src/handlers/removeBgHandler.js
import axios from 'axios';
import { Sticker } from 'wa-sticker-formatter';
import FormData from 'form-data';
import { config } from '../../config.js';

export class RemoveBgHandler {
    
    static async removeBackground(message, sock) {
        try {
            console.log('🔄 Iniciando remoção de fundo...');

            // Verificar se respondeu a uma imagem
            let quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let directImage = message.message?.imageMessage;
            
            const imageMsg = quotedImage || directImage;
            
            if (!imageMsg) {
                return {
                    success: false,
                    error: '❌ Responda a uma imagem ou envie uma imagem com !removebg\n\n📌 Exemplo: Envie uma foto e digite !removebg'
                };
            }
            
            // Avisar que está processando
            await sock.sendMessage(message.key.remoteJid, {
                text: '🔄 Removendo fundo da imagem...⏳'
            }, { quoted: message });
            
            // Baixar a imagem
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            console.log(`📥 Imagem baixada: ${(buffer.length / 1024).toFixed(2)}KB`);
            
            // Tentar remover fundo com as chaves disponíveis
            const cleanImageBuffer = await this.tryRemoveBackground(buffer);
            
            if (!cleanImageBuffer) {
                return {
                    success: false,
                    error: '❌ Todas as APIs estão sem limite ou offline.\n\n📊 Tente novamente amanhã ou use outra conta.'
                };
            }
            
            console.log(`✅ Fundo removido! Tamanho: ${(cleanImageBuffer.length / 1024).toFixed(2)}KB`);
            
            // Criar sticker com fundo removido
            const sticker = new Sticker(cleanImageBuffer, {
                pack: 'StickerBot',
                author: 'Remove.bg',
                type: 'full',
                quality: 80
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            // Enviar sticker
            await sock.sendMessage(message.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: message });
            
            console.log('✅ Sticker sem fundo enviado!');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro detalhado:', error);
            
            // Mensagem de erro mais amigável
            let errorMsg = '❌ Erro ao remover fundo. Tente novamente.';
            
            if (error.code === 'ECONNABORTED') {
                errorMsg = '❌ Tempo esgotado. Tente novamente.';
            } else if (error.message?.includes('timeout')) {
                errorMsg = '❌ Demorou muito. Tente uma imagem menor.';
            }
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    /**
     * Tenta remover fundo usando múltiplas chaves de API
     */
    static async tryRemoveBackground(imageBuffer) {
        // Se não tem chaves configuradas, erro
        if (!config.removeBgApiKeys || config.removeBgApiKeys.length === 0) {
            console.error('❌ Nenhuma chave de API configurada no config.js');
            return null;
        }
        
        let lastError = null;
        
        // Tentar cada chave de API
        for (let i = 0; i < config.removeBgApiKeys.length; i++) {
            const apiKey = config.removeBgApiKeys[i];
            
            // Pular chaves vazias
            if (!apiKey || apiKey.trim() === '') {
                console.log(`⚠️ Chave ${i + 1} está vazia, pulando...`);
                continue;
            }
            
            try {
                console.log(`🔄 Tentando API ${i + 1}/${config.removeBgApiKeys.length}...`);
                
                const formData = new FormData();
                formData.append('image_file', imageBuffer, {
                    filename: 'image.png',
                    contentType: 'image/png'
                });
                formData.append('size', 'auto');
                
                const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'X-Api-Key': apiKey
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                // Verificar se resposta é válida
                if (!response.data || response.data.length === 0) {
                    throw new Error('Resposta vazia da API');
                }
                
                // Verificar se resposta é HTML (erro)
                const firstBytes = response.data.slice(0, 10).toString();
                if (firstBytes.includes('<!DOCTYPE') || firstBytes.includes('<html')) {
                    console.log(`⚠️ API ${i + 1} retornou HTML (possivelmente erro)`);
                    continue;
                }
                
                console.log(`✅ API ${i + 1} funcionou!`);
                return Buffer.from(response.data);
                
            } catch (error) {
                console.log(`⚠️ API ${i + 1} falhou:`);
                
                if (error.response) {
                    const status = error.response.status;
                    console.log(`   Status: ${status}`);
                    
                    if (status === 402) {
                        console.log(`   Motivo: Limite mensal excedido`);
                    } else if (status === 401) {
                        console.log(`   Motivo: Chave inválida`);
                    } else if (status === 413) {
                        console.log(`   Motivo: Imagem muito grande`);
                    } else if (status === 429) {
                        console.log(`   Motivo: Muitas requisições`);
                    } else {
                        console.log(`   Motivo: Erro desconhecido`);
                    }
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`   Motivo: Timeout`);
                } else {
                    console.log(`   Motivo: ${error.message}`);
                }
                
                lastError = error;
                
                // Se não for erro de limite (402), tenta próxima chave mesmo assim
                // Se for erro de imagem (413), para de tentar
                if (error.response?.status === 413) {
                    console.log(`📐 Imagem muito grande, não adianta tentar outras chaves`);
                    break;
                }
                
                // Continua para próxima chave
                continue;
            }
        }
        
        console.log(`❌ Todas as ${config.removeBgApiKeys.length} chaves falharam`);
        return null;
    }
}

```


### 📄 `src/handlers/stickerPackHandler.js`

```
// src/handlers/stickerPackHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export class StickerPackHandler {
    
    static STICKERS_DIR = './stickers';
    static MAX_STICKERS_PER_REQUEST = 3;
    static DELAY_BETWEEN_STICKERS = 800; // ms
    
    /**
     * Inicializa a pasta de stickers
     */
    static async init() {
        try {
            if (!existsSync(this.STICKERS_DIR)) {
                mkdirSync(this.STICKERS_DIR, { recursive: true });
                console.log('📁 Pasta de stickers criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Lista todos os pacotes disponíveis
     */
    static async listPacks() {
        try {
            const packs = await readdir(this.STICKERS_DIR);
            const result = [];
            
            for (const pack of packs) {
                const packPath = join(this.STICKERS_DIR, pack);
                const stats = await readdir(packPath);
                const stickerFiles = stats.filter(f => f.endsWith('.webp'));
                
                result.push({
                    name: pack,
                    count: stickerFiles.length
                });
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erro ao listar pacotes:', error);
            return [];
        }
    }
    
    /**
     * Salva uma figurinha
     */
    static async saveSticker(packName, stickerBuffer, message, sock) {
        try {
            // Validar pacote
            if (!packName || packName.trim() === '') {
                return { success: false, error: '❌ Nome do pacote inválido' };
            }
            
            // Limpar nome do pacote (apenas letras e números)
            packName = packName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (packName.length < 3) {
                return { success: false, error: '❌ Nome do pacote deve ter pelo menos 3 caracteres' };
            }
            
            // Criar pasta do pacote
            const packDir = join(this.STICKERS_DIR, packName);
            if (!existsSync(packDir)) {
                mkdirSync(packDir, { recursive: true });
            }
            
            // Contar stickers existentes
            const existingFiles = readdirSync(packDir).filter(f => f.endsWith('.webp'));
            const nextId = existingFiles.length + 1;
            
            // Nome do arquivo
            const fileName = `${packName}_${String(nextId).padStart(3, '0')}.webp`;
            const filePath = join(packDir, fileName);
            
            // Salvar sticker
            await writeFile(filePath, stickerBuffer);
            
            console.log(`✅ Sticker salvo: ${fileName} (${(stickerBuffer.length / 1024).toFixed(2)}KB)`);
            
            return {
                success: true,
                fileName: fileName,
                packName: packName,
                total: nextId
            };
            
        } catch (error) {
            console.error('❌ Erro ao salvar sticker:', error);
            return { success: false, error: '❌ Erro ao salvar figurinha' };
        }
    }
    
    /**
     * Envia figurinhas de um pacote
     */
    static async sendStickers(sock, groupJid, packName, quantity, quotedMessage) {
        try {
            // Validar quantidade
            let qty = Math.min(quantity, this.MAX_STICKERS_PER_REQUEST);
            if (qty < 1) qty = 1;
            
            // Verificar se pacote existe
            const packDir = join(this.STICKERS_DIR, packName);
            if (!existsSync(packDir)) {
                return { success: false, error: `❌ Pacote "${packName}" não encontrado` };
            }
            
            // Listar stickers do pacote
            const files = readdirSync(packDir).filter(f => f.endsWith('.webp'));
            
            if (files.length === 0) {
                return { success: false, error: `❌ Pacote "${packName}" está vazio` };
            }
            
            // Embaralhar e pegar os primeiros 'qty'
            const shuffled = [...files].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, qty);
            
            // Enviar mensagem de início
            await sock.sendMessage(groupJid, {
                text: `🎲 Enviando ${selected.length} figurinha(s) do pacote "${packName}"...`
            }, { quoted: quotedMessage });
            
            // Enviar cada sticker com delay
            for (let i = 0; i < selected.length; i++) {
                const filePath = join(packDir, selected[i]);
                const stickerBuffer = await readFile(filePath);
                
                await sock.sendMessage(groupJid, {
                    sticker: stickerBuffer
                });
                
                // Delay entre stickers (evitar spam)
                if (i < selected.length - 1) {
                    await this.delay(this.DELAY_BETWEEN_STICKERS);
                }
            }
            
            return { success: true, count: selected.length, total: files.length };
            
        } catch (error) {
            console.error('❌ Erro ao enviar stickers:', error);
            return { success: false, error: '❌ Erro ao enviar figurinhas' };
        }
    }
    
    /**
     * Envia sticker aleatório de qualquer pacote
     */
    static async sendRandomSticker(sock, groupJid, quotedMessage) {
        try {
            // Listar todos os pacotes
            const packs = await this.listPacks();
            
            if (packs.length === 0) {
                return { success: false, error: '❌ Nenhum pacote disponível' };
            }
            
            // Filtrar pacotes com stickers
            const validPacks = [];
            for (const pack of packs) {
                const packDir = join(this.STICKERS_DIR, pack.name);
                const files = readdirSync(packDir).filter(f => f.endsWith('.webp'));
                if (files.length > 0) {
                    validPacks.push({ name: pack.name, files });
                }
            }
            
            if (validPacks.length === 0) {
                return { success: false, error: '❌ Nenhuma figurinha disponível' };
            }
            
            // Escolher pacote aleatório
            const randomPack = validPacks[Math.floor(Math.random() * validPacks.length)];
            const randomFile = randomPack.files[Math.floor(Math.random() * randomPack.files.length)];
            const filePath = join(this.STICKERS_DIR, randomPack.name, randomFile);
            
            const stickerBuffer = await readFile(filePath);
            
            await sock.sendMessage(groupJid, {
                sticker: stickerBuffer
            });
            
            return { success: true, pack: randomPack.name };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return { success: false, error: '❌ Erro ao enviar figurinha' };
        }
    }
    
    /**
     * Remove uma figurinha
     */
    static async removeSticker(stickerId, message, sock) {
        try {
            // Formato: pacote_numero (ex: reacoes_001)
            const parts = stickerId.split('_');
            if (parts.length < 2) {
                return { success: false, error: '❌ ID inválido. Use: pack_001' };
            }
            
            const packName = parts.slice(0, -1).join('_');
            const fileName = `${stickerId}.webp`;
            const filePath = join(this.STICKERS_DIR, packName, fileName);
            
            if (!existsSync(filePath)) {
                return { success: false, error: '❌ Figurinha não encontrada' };
            }
            
            unlinkSync(filePath);
            
            return { success: true, packName: packName, stickerId: stickerId };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return { success: false, error: '❌ Erro ao remover figurinha' };
        }
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Delay helper
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Baixa sticker da mensagem
     */
    static async downloadSticker(message) {
        try {
            let stickerMsg = null;
            
            // Verificar se respondeu a uma figurinha
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
                stickerMsg = message.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            }
            // Verificar se a mensagem é uma figurinha
            else if (message.message?.stickerMessage) {
                stickerMsg = message.message.stickerMessage;
            }
            
            if (!stickerMsg) {
                return null;
            }
            
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return null;
        }
    }
}

```


### 📄 `src/handlers/circleHandler.js`

```
// src/handlers/circleHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import sharp from 'sharp';

export class CircleHandler {
    
    /**
     * Cria sticker redondo a partir de uma imagem ou sticker
     */
    static async createCircleSticker(message, sock) {
        try {
            console.log('🔄 Criando sticker redondo...');
            
            // Verificar se respondeu a uma imagem ou sticker
            let quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
            let directImage = message.message?.imageMessage;
            let directSticker = message.message?.stickerMessage;
            
            const imageMsg = quotedImage || directImage;
            const stickerMsg = quotedSticker || directSticker;
            
            let buffer = null;
            
            // Baixar imagem ou sticker
            if (imageMsg) {
                const stream = await downloadContentFromMessage(imageMsg, 'image');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                console.log('📥 Imagem baixada');
                
            } else if (stickerMsg) {
                const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                console.log('📥 Sticker baixado');
                
            } else {
                return {
                    success: false,
                    error: '❌ Responda a uma IMAGEM ou FIGURINHA com !scircle'
                };
            }
            
            // Criar máscara circular usando SVG (nativo, sem canvas)
            const size = 512;
            
            // SVG para máscara circular
            const svgMask = `
                <svg width="${size}" height="${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
                </svg>
            `;
            
            // Aplicar máscara circular com sharp
            const circleBuffer = await sharp(buffer)
                .resize(size, size, {
                    fit: 'cover',
                    position: 'centre'
                })
                .composite([{
                    input: Buffer.from(svgMask),
                    blend: 'dest-in'
                }])
                .png()
                .toBuffer();
            
            // Criar sticker
            const sticker = new Sticker(circleBuffer, {
                pack: 'StickerBot',
                author: 'Circle Sticker',
                type: 'full',
                quality: 90
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            await sock.sendMessage(message.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: message });
            
            console.log('✅ Sticker redondo enviado!');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return {
                success: false,
                error: '❌ Erro ao criar sticker redondo. Tente outra imagem.'
            };
        }
    }
}

```


### 📄 `src/handlers/menuHandler.js`

```
// src/handlers/menuHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export class MenuHandler {
    
    static MENU_DIR = './menu';
    
    /**
     * Inicializa a pasta do menu
     */
    static async init() {
        try {
            if (!existsSync(this.MENU_DIR)) {
                mkdirSync(this.MENU_DIR, { recursive: true });
                console.log('📁 Pasta do menu criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Salva imagem do menu para um grupo específico
     */
    static async saveMenuImage(groupJid, imageBuffer) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            await writeFile(filePath, imageBuffer);
            
            console.log(`✅ Imagem do menu salva para ${groupJid}`);
            return { success: true, filePath };
            
        } catch (error) {
            console.error('❌ Erro ao salvar imagem do menu:', error);
            return { success: false, error: 'Erro ao salvar imagem' };
        }
    }
    
    /**
     * Remove imagem do menu de um grupo
     */
    static async deleteMenuImage(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ Imagem do menu removida para ${groupJid}`);
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro ao remover imagem:', error);
            return { success: false, error: 'Erro ao remover imagem' };
        }
    }
    
    /**
     * Pega imagem do menu de um grupo
     */
    static async getMenuImage(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            if (existsSync(filePath)) {
                const buffer = await readFile(filePath);
                return buffer;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao ler imagem:', error);
            return null;
        }
    }
    
    /**
     * Gera o texto do menu
     */
    static getMenuText() {
        return `
╭━━━━━━━━━━━━━━━━━━━━╮
┃     🤖 STICKER BOT    
┃     Menu Principal    
╰━━━━━━━━━━━━━━━━━━━━╯

┌─── 🎨 FIGURINHAS ───┐
│ !fig     → Criar sticker
│ !s       → Atalho rápido
│ !toimg   → Sticker → Imagem
│ !removebg→ Remover fundo
│ !scircle → Sticker redondo
└─────────────────────┘

┌─── 📦 PACOTES ────┐
│ !pack [nome]  → Pegar sticker
│ !packs        → Listar pacotes
│ !sticker      → Sticker aleatório
└──────────────────┘

┌─── 🎉 WELCOME ───┐
│ !setwelcome      → Configurar
│ !disablewelcome  → Desativar
│ !welcomestatus   → Status
└──────────────────┘

┌─── 🔨 BAN ────┐
│ !enableban   → Ativar
│ !disableban  → Desativar
│ !banstatus   → Status
└───────────────┘

┌─── 📌 MENU ───┐
│ !menu         → Este menu
│ !setmenu      → Definir imagem (admin)
│ !delmenu      → Remover imagem (admin)
└────────────────┘

✨ Envie !help para mais detalhes
        `;
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Baixa imagem da mensagem
     */
    static async downloadImage(message) {
        try {
            let imageMsg = null;
            
            // Verificar se respondeu a uma imagem
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                imageMsg = message.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            // Verificar se a mensagem é uma imagem
            else if (message.message?.imageMessage) {
                imageMsg = message.message.imageMessage;
            }
            
            if (!imageMsg) {
                return null;
            }
            
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro ao baixar imagem:', error);
            return null;
        }
    }
}

```


### 📄 `src/handlers/antiLinkHandler.js`

```
// src/handlers/antiLinkHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class AntiLinkHandler {
    
    static ANTI_LINK_DIR = './antilink_config';
    
    // Domínios bloqueados por padrão
    static DEFAULT_BLOCKED_DOMAINS = [
    'whatsapp.com',
    'chat.whatsapp.com',
    'wa.me',
    'youtube.com',
    'youtu.be',
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly',
    'shorte.st',
    'fc.lc',
    'linktree.com',
    'instagram.com',
    'facebook.com',
    'tiktok.com',
    'twitter.com'
];
    
    /**
     * Inicializa a pasta de configuração
     */
    static async init() {
        try {
            if (!existsSync(this.ANTI_LINK_DIR)) {
                mkdirSync(this.ANTI_LINK_DIR, { recursive: true });
                console.log('📁 Pasta do anti-link criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Salva configuração de um grupo
     */
    static async saveConfig(groupJid, config) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_LINK_DIR, fileName);
            await writeFile(filePath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar config:', error);
            return false;
        }
    }
    
    /**
     * Carrega configuração de um grupo
     */
    static async loadConfig(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_LINK_DIR, fileName);
            
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return JSON.parse(data);
            }
            
            // Configuração padrão
            return {
                enabled: false,
                action: 'delete', // 'delete', 'warn', 'kick'
                blockedDomains: [...this.DEFAULT_BLOCKED_DOMAINS],
                whitelistDomains: [],
                whitelistUsers: [],
                customMessage: null
            };
        } catch (error) {
            console.error('❌ Erro ao carregar config:', error);
            return {
                enabled: false,
                action: 'delete',
                blockedDomains: [...this.DEFAULT_BLOCKED_DOMAINS],
                whitelistDomains: [],
                whitelistUsers: [],
                customMessage: null
            };
        }
    }
    
    /**
     * Ativa/desativa anti-link no grupo
     */
    static async setEnabled(groupJid, enabled) {
        const config = await this.loadConfig(groupJid);
        config.enabled = enabled;
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Define ação para links
     */
    static async setAction(groupJid, action) {
        const validActions = ['delete', 'warn', 'kick'];
        if (!validActions.includes(action)) {
            return { success: false, error: 'Ação inválida. Use: delete, warn ou kick' };
        }
        
        const config = await this.loadConfig(groupJid);
        config.action = action;
        await this.saveConfig(groupJid, config);
        return { success: true, config };
    }
    
    /**
     * Adiciona domínio à whitelist
     */
    static async addWhitelistDomain(groupJid, domain) {
        const config = await this.loadConfig(groupJid);
        if (!config.whitelistDomains.includes(domain)) {
            config.whitelistDomains.push(domain);
            await this.saveConfig(groupJid, config);
        }
        return config;
    }
    
    /**
     * Remove domínio da whitelist
     */
    static async removeWhitelistDomain(groupJid, domain) {
        const config = await this.loadConfig(groupJid);
        config.whitelistDomains = config.whitelistDomains.filter(d => d !== domain);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Adiciona usuário à whitelist
     */
    static async addWhitelistUser(groupJid, userNumber) {
        const config = await this.loadConfig(groupJid);
        if (!config.whitelistUsers.includes(userNumber)) {
            config.whitelistUsers.push(userNumber);
            await this.saveConfig(groupJid, config);
        }
        return config;
    }
    
    /**
     * Remove usuário da whitelist
     */
    static async removeWhitelistUser(groupJid, userNumber) {
        const config = await this.loadConfig(groupJid);
        config.whitelistUsers = config.whitelistUsers.filter(u => u !== userNumber);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Verifica se uma mensagem contém link bloqueado
     */
    static async checkMessage(messageText, groupJid, senderNumber) {
        const config = await this.loadConfig(groupJid);
        
        if (!config.enabled) {
            return { blocked: false, reason: 'disabled' };
        }
        
        // Verificar se usuário está na whitelist
        if (config.whitelistUsers.includes(senderNumber)) {
            return { blocked: false, reason: 'whitelist_user' };
        }
        
        if (!messageText) {
            return { blocked: false, reason: 'no_text' };
        }
        
        // Extrair links da mensagem
        const urls = this.extractUrls(messageText);
        
        if (urls.length === 0) {
            return { blocked: false, reason: 'no_links' };
        }
        
        // Verificar cada URL
        for (const url of urls) {
            const domain = this.extractDomain(url);
            
            // Verificar se está na whitelist
            if (config.whitelistDomains.includes(domain)) {
                continue; // Pula, não bloqueia
            }
            
            // Verificar se está na lista de bloqueio
            if (this.isBlockedDomain(domain, config.blockedDomains)) {
                return {
                    blocked: true,
                    reason: 'link_blocked',
                    domain: domain,
                    action: config.action,
                    url: url
                };
            }
        }
        
        return { blocked: false, reason: 'allowed' };
    }
    
    /**
     * Extrai URLs do texto
     */
    static extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
        const matches = text.match(urlRegex);
        return matches || [];
    }
    
    /**
     * Extrai domínio de uma URL
     */
    static extractDomain(url) {
        try {
            let cleanUrl = url;
            if (!cleanUrl.startsWith('http')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            const hostname = new URL(cleanUrl).hostname;
            return hostname.replace(/^www\./, '');
        } catch {
            // Se falhar, tenta extrair manualmente
            const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
            return match ? match[1] : url;
        }
    }
    
    /**
     * Verifica se domínio está bloqueado
     */
    static isBlockedDomain(domain, blockedDomains) {
    const lowerDomain = domain.toLowerCase();
    return blockedDomains.some(blocked => {
        const lowerBlocked = blocked.toLowerCase();
        return lowerDomain === lowerBlocked || lowerDomain.endsWith(`.${lowerBlocked}`);
    });
}
    
    /**
     * Gera mensagem de aviso
     */
    static getWarningMessage(action, domain) {
        const messages = {
            delete: `⚠️ *LINK BLOQUEADO*\n\nO domínio *${domain}* não é permitido neste grupo.\nSua mensagem foi deletada.`,
            warn: `⚠️ *ATENÇÃO*\n\nLinks para *${domain}* não são permitidos neste grupo.\n\n📌 Próxima vez será removido(a) do grupo.`,
            kick: `🚫 *LINK PROIBIDO*\n\nVocê compartilhou um link para *${domain}*.\nIsso viola as regras do grupo.`
        };
        
        return messages[action] || messages.delete;
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Remove usuário do grupo
     */
    static async kickUser(sock, groupJid, participant) {
        try {
            await sock.groupParticipantsUpdate(groupJid, [participant], 'remove');
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover:', error);
            return false;
        }
    }
    
    /**
     * Obtém status do anti-link para exibição
     */
    static async getStatus(groupJid) {
        const config = await this.loadConfig(groupJid);
        
        let statusText = `🔗 *ANTI-LINK*\n\n`;
        statusText += `📊 Status: ${config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}\n`;
        statusText += `⚡ Ação: ${config.action === 'delete' ? '🗑️ Deletar' : config.action === 'warn' ? '⚠️ Avisar' : '🔨 Remover'}\n\n`;
        
        if (config.enabled) {
            statusText += `🚫 *DOMÍNIOS BLOQUEADOS:*\n`;
            const blocked = config.blockedDomains.slice(0, 10);
            for (const domain of blocked) {
                statusText += `• ${domain}\n`;
            }
            if (config.blockedDomains.length > 10) {
                statusText += `• ... e mais ${config.blockedDomains.length - 10}\n`;
            }
            
            if (config.whitelistDomains.length > 0) {
                statusText += `\n✅ *DOMÍNIOS LIBERADOS:*\n`;
                for (const domain of config.whitelistDomains) {
                    statusText += `• ${domain}\n`;
                }
            }
            
            if (config.whitelistUsers.length > 0) {
                statusText += `\n👑 *USUÁRIOS LIBERADOS:* ${config.whitelistUsers.length}\n`;
            }
        }
        
        statusText += `\n📌 *COMANDOS:*\n`;
        statusText += `• !antilink on/off - Ativar/Desativar\n`;
        statusText += `• !antilink action delete/warn/kick - Definir ação\n`;
        statusText += `• !antilink whitelist add/remove [domínio] - Liberar domínio\n`;
        statusText += `• !antilink allow/deny [@usuário] - Liberar/Bloquear usuário\n`;
        statusText += `• !antilink status - Ver configuração\n`;
        
        return statusText;
    }
}

```


### 📄 `src/handlers/antiSpamHandler.js`

```
// src/handlers/antiSpamHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class AntiSpamHandler {
    
    static ANTI_SPAM_DIR = './antispam_config';
    
    static DEFAULT_CONFIG = {
        enabled: false,
        commandLimit: 4,
        timeWindow: 5000,
        blockTime: 5000
    };
    
    static userCommands = new Map();
    static userBlocked = new Map();
    
    static async init() {
        try {
            if (!existsSync(this.ANTI_SPAM_DIR)) {
                mkdirSync(this.ANTI_SPAM_DIR, { recursive: true });
                console.log('📁 Pasta do anti-spam criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    static async saveConfig(groupJid, config) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_SPAM_DIR, fileName);
            await writeFile(filePath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static async loadConfig(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_SPAM_DIR, fileName);
            
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return { ...this.DEFAULT_CONFIG, ...JSON.parse(data) };
            }
            return { ...this.DEFAULT_CONFIG };
        } catch (error) {
            return { ...this.DEFAULT_CONFIG };
        }
    }
    
    static async setEnabled(groupJid, enabled) {
        const config = await this.loadConfig(groupJid);
        config.enabled = enabled;
        await this.saveConfig(groupJid, config);
        if (!enabled) this.clearGroupData(groupJid);
        return config;
    }
    
    static async setCommandLimit(groupJid, limit) {
        const config = await this.loadConfig(groupJid);
        config.commandLimit = Math.min(limit, 20);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    static async setBlockTime(groupJid, seconds) {
        const config = await this.loadConfig(groupJid);
        config.blockTime = seconds * 1000;
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    static clearGroupData(groupJid) {
        const prefix = `${groupJid}_`;
        for (const key of this.userCommands.keys()) {
            if (key.startsWith(prefix)) this.userCommands.delete(key);
        }
        for (const key of this.userBlocked.keys()) {
            if (key.startsWith(prefix)) this.userBlocked.delete(key);
        }
    }
    
    static isBlocked(groupJid, userId) {
        const key = `${groupJid}_${userId}`;
        const until = this.userBlocked.get(key);
        if (until && until > Date.now()) return true;
        if (until && until <= Date.now()) this.userBlocked.delete(key);
        return false;
    }
    
    static blockUser(groupJid, userId, durationMs) {
        const key = `${groupJid}_${userId}`;
        this.userBlocked.set(key, Date.now() + durationMs);
    }
    
    static async checkCommand(groupJid, userId, config) {
        if (!config.enabled) {
            return { blocked: false };
        }
        
        if (this.isBlocked(groupJid, userId)) {
            return { 
                blocked: true, 
                message: `⏰ Aguarde alguns segundos antes de usar comandos novamente.`
            };
        }
        
        const now = Date.now();
        const key = `${groupJid}_${userId}`;
        let history = this.userCommands.get(key) || [];
        history = history.filter(t => (now - t) < config.timeWindow);
        
        if (history.length >= config.commandLimit) {
            this.blockUser(groupJid, userId, config.blockTime);
            const blockSeconds = Math.ceil(config.blockTime / 1000);
            this.userCommands.set(key, []);
            
            return {
                blocked: true,
                message: `⚠️ Você está usando comandos muito rápido!\nPor favor, aguarde ${blockSeconds} segundos.`
            };
        }
        
        history.push(now);
        this.userCommands.set(key, history);
        return { blocked: false };
    }
    
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            return admins.includes(participant);
        } catch (error) {
            return false;
        }
    }
    
    static async getStatus(groupJid) {
        const config = await this.loadConfig(groupJid);
        return `🛡️ *ANTI-SPAM*\n\n📊 Status: ${config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}\n📨 Limite: ${config.commandLimit} comandos em ${config.timeWindow / 1000}s\n⏰ Bloqueio: ${config.blockTime / 1000}s`;
    }
}

```


### 📄 `src/utils/mediaUtils.js`

```
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { Sticker } from 'wa-sticker-formatter';

export class MediaUtils {
    static async validateMedia(buffer) {
        try {
            const type = await fileTypeFromBuffer(buffer);
            if (!type) throw new Error('Tipo de arquivo não reconhecido');
            return type;
        } catch (error) {
            throw new Error('Erro ao validar mídia');
        }
    }

    static async resizeImage(buffer, maxSize = 512) {
        try {
            return await sharp(buffer)
                .resize(maxSize, maxSize, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    fastShrinkOnLoad: true
                })
                .jpeg({ 
                    quality: 70,
                    mozjpeg: true
                })
                .toBuffer();
        } catch (error) {
            console.log('⚠️ Usando imagem original');
            return buffer;
        }
    }

    static async createSticker(mediaBuffer, options = {}) {
        const {
            pack = 'StickerBot',
            author = 'Bot',
            categories = ['✨'],
            quality = 30,
            type = 'full'
        } = options;

        try {
            const sticker = new Sticker(mediaBuffer, {
                pack,
                author,
                categories,
                quality: Math.max(5, Math.min(quality, 50)), // Garante entre 5-50
                type,
                background: type === 'crop' ? '#000000' : 'transparent'
            });

            return await sticker.toBuffer();
        } catch (error) {
            console.error('❌ Erro ao criar sticker:', error);
            
            // Erros específicos do wa-sticker-formatter
            if (error.message.includes('ffmpeg') || error.message.includes('video')) {
                throw new Error('Codec de vídeo não suportado');
            } else if (error.message.includes('buffer')) {
                throw new Error('Arquivo de mídia corrompido');
            } else {
                throw new Error('Erro ao processar mídia para figurinha');
            }
        }
    }
}

```


### 📄 `src/utils/protectionUtils.js`

```
/**
 * Utilitários de Proteção - VERSÃO SIMPLES
 * Apenas para suport ao BAN de gringos na entrada
 * Sem AntiLink
 */

export class ProtectionUtils {
    
    /**
     * Extrai o número
     */
    static extractNumber(message, isGroup = false) {
        let jidToExtract;
        
        if (isGroup) {
            jidToExtract = message.key.participant;
        } else {
            jidToExtract = message.key.remoteJid;
        }

        if (!jidToExtract) {
            return null;
        }

        let number = jidToExtract.replace(/\D/g, '');

        console.log(`📱 Número: ${number}`);

        if (number.length >= 10) {
            return number;
        }

        return null;
    }

    /**
     * Verifica se é grupo
     */
    static isGroup(remoteJid) {
        return remoteJid.includes('@g.us');
    }

    /**
     * Verifica se é gringo
     */
    static isForeignNumber(number, allowedCountryCode = '55') {
        if (!number || number.length < 10) {
            return false;
        }

        const isForeign = !number.startsWith(allowedCountryCode);
        console.log(`🌍 Começa com ${allowedCountryCode}? ${!isForeign}`);
        
        return isForeign;
    }

    /**
     * Verifica exceção
     */
    static isException(number, exceptions = []) {
        if (!exceptions || exceptions.length === 0 || !number) {
            return false;
        }
        
        for (const exc of exceptions) {
            let cleanExc = exc.toString().trim().replace(/\D/g, '');
            
            if (number === cleanExc) {
                console.log(`✅ Em exceção`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Verifica owner
     */
    static isOwner(number, ownerNumber) {
        if (!number) return false;

        let cleanOwner = ownerNumber.toString().trim().replace(/\D/g, '');
        const isOwner = number === cleanOwner;
        
        return isOwner;
    }

    /**
     * Mensagem
     */
    static getBlockMessage(reason) {
        return '⛔ BLOQUEADO';
    }

    /**
     * Log
     */
    static logBlock(type, senderNumber, reason) {
        console.log(`\n🚫 ${type} | ${senderNumber}`);
    }
}

```


```


### 📄 `plugins/sticker.js`

```
//atualizador porcdeedsek
import { StickerHandler } from '../src/handlers/stickerHandler.js';

export async function stickerPlugin(sock, message) {
    try {
        console.log('🔄 Iniciando processo de sticker...');

        const result = await StickerHandler.createStickerFromMessage(message, sock);
        
        if (!result.success) {
            await sock.sendMessage(message.key.remoteJid, {
                text: result.error
            }, { quoted: message });
            return;
        }

        console.log('📤 Enviando sticker...');
        
        await sock.sendMessage(message.key.remoteJid, {
            sticker: result.buffer
        }, { quoted: message });

        console.log('✅ Sticker enviado com sucesso!');

    } catch (error) {
        console.error('💥 Erro fatal no sticker plugin:', error);
        
        await sock.sendMessage(message.key.remoteJid, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

export const stickerCommands = {
    name: 'sticker',
    description: 'Cria stickers de imagens, vídeos e visualização única',
    usage: 'Envie imagem/vídeo com !fig OU marque uma mídia com !fig\n✅ Agora suporta visualização única!',
    aliases: ['fig', 's']
};

```


### 📄 `plugins/inviteRank.js`

```
// plugins/inviteRank.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const INVITES_DIR = './invites_data';
const POINTS_ADD = 10;      // Pontos por convidar alguém novo
const POINTS_RETURN = 5;    // Pontos por convidar alguém que já saiu

// Níveis
const LEVELS = [
    { name: 'Bronze', min: 0, icon: '🟤' },
    { name: 'Prata', min: 50, icon: '⚪' },
    { name: 'Ouro', min: 150, icon: '🟡' },
    { name: 'Platina', min: 300, icon: '💎' },
    { name: 'Diamante', min: 500, icon: '🔥' }
];

// Garantir pasta de dados
async function ensureDir() {
    if (!existsSync(INVITES_DIR)) {
        mkdirSync(INVITES_DIR, { recursive: true });
        console.log('📁 Pasta de dados de convites criada');
    }
}

// Carregar dados do grupo
async function loadGroupData(groupJid) {
    await ensureDir();
    const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = join(INVITES_DIR, fileName);
    
    if (existsSync(filePath)) {
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    
    return {
        users: {},      // { userId: { name, points, invites: [userId], totalInvites } }
        membersHistory: {}  // { userId: lastSeen }
    };
}

// Salvar dados do grupo
async function saveGroupData(groupJid, data) {
    await ensureDir();
    const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = join(INVITES_DIR, fileName);
    await writeFile(filePath, JSON.stringify(data, null, 2));
}

// Obter nível do usuário
function getUserLevel(points) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].min) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

// Buscar nome do usuário no grupo
async function getUserName(sock, groupJid, userId) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const participant = metadata.participants.find(p => p.id === userId);
        if (participant) {
            if (participant.name) return participant.name;
            if (participant.pushname) return participant.pushname;
        }
    } catch (error) {
        console.error('❌ Erro ao buscar nome:', error);
    }
    
    // Fallback: mostrar parte do ID
    const id = userId.split('@')[0];
    if (id.length > 12) {
        return `...${id.slice(-6)}`;
    }
    return id;
}

// Processar entrada de novo membro
export async function handleNewMember(sock, groupJid, newMemberId, inviterId, inviterName) {
    try {
        console.log(`🎯 Processando convite: ${inviterId} convidou ${newMemberId}`);
        
        // Buscar nome do convidador se não veio
        let inviterDisplayName = inviterName;
        if (!inviterDisplayName || inviterDisplayName === '') {
            inviterDisplayName = await getUserName(sock, groupJid, inviterId);
        }
        
        const data = await loadGroupData(groupJid);
        
        // Verificar se é a primeira vez do membro
        const isFirstTime = !data.membersHistory[newMemberId];
        
        // Pontos a dar
        let pointsEarned = isFirstTime ? POINTS_ADD : POINTS_RETURN;
        
        // Inicializar usuário se não existir
        if (!data.users[inviterId]) {
            data.users[inviterId] = {
                name: inviterDisplayName,
                points: 0,
                invites: [],
                totalInvites: 0
            };
        } else {
            // Atualizar nome se mudou
            data.users[inviterId].name = inviterDisplayName;
        }
        
        // Verificar se já convidou essa pessoa antes
        const alreadyInvited = data.users[inviterId].invites.includes(newMemberId);
        
        if (!alreadyInvited) {
            // Adicionar pontos
            data.users[inviterId].points += pointsEarned;
            data.users[inviterId].invites.push(newMemberId);
            data.users[inviterId].totalInvites++;
            
            // Salvar histórico do membro
            data.membersHistory[newMemberId] = {
                firstJoined: Date.now(),
                invitedBy: inviterId,
                timesJoined: (data.membersHistory[newMemberId]?.timesJoined || 0) + 1
            };
            
            await saveGroupData(groupJid, data);
            
            // Buscar nome do convidado
            const newMemberName = await getUserName(sock, groupJid, newMemberId);
            const level = getUserLevel(data.users[inviterId].points);
            
            // Enviar mensagem de notificação
            const message = `🎉 *${inviterDisplayName}* convidou *${newMemberName}*! (+${pointsEarned} pontos)\n\n📊 *${inviterDisplayName}* agora tem *${data.users[inviterId].points}* pontos\n🏆 Nível: ${level.icon} *${level.name}*\n👥 Total de convites: *${data.users[inviterId].totalInvites}*`;
            
            await sock.sendMessage(groupJid, { text: message });
            console.log(`✅ Pontos registrados: ${inviterDisplayName} +${pointsEarned}`);
        } else {
            console.log(`⚠️ ${inviterDisplayName} já havia convidado esta pessoa`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar convite:', error);
    }
}

// Processar remoção de membro (para histórico)
export async function handleMemberLeave(groupJid, memberId) {
    try {
        const data = await loadGroupData(groupJid);
        if (data.membersHistory[memberId]) {
            data.membersHistory[memberId].lastLeft = Date.now();
            await saveGroupData(groupJid, data);
        }
    } catch (error) {
        console.error('❌ Erro ao processar saída:', error);
    }
}

// Comando !rank
export async function showRank(sock, message, groupJid, senderId) {
    try {
        const data = await loadGroupData(groupJid);
        
        if (!data.users[senderId]) {
            await sock.sendMessage(groupJid, {
                text: '📊 Você ainda não convidou ninguém!\n\nConvide amigos para o grupo e ganhe pontos! 🎉'
            }, { quoted: message });
            return;
        }
        
        const user = data.users[senderId];
        const level = getUserLevel(user.points);
        
        // Calcular próximo nível
        let nextLevel = null;
        for (let i = 0; i < LEVELS.length - 1; i++) {
            if (user.points < LEVELS[i + 1].min) {
                nextLevel = LEVELS[i + 1];
                break;
            }
        }
        
        // Calcular posição no ranking
        const sorted = Object.entries(data.users).sort((a, b) => b[1].points - a[1].points);
        const position = sorted.findIndex(([id]) => id === senderId) + 1;
        
        let rankText = `🏆 *SEU RANKING DE CONVITES*\n\n`;
        rankText += `📊 *Pontos:* ${user.points}\n`;
        rankText += `🎖️ *Nível:* ${level.icon} ${level.name}\n`;
        rankText += `👥 *Convidados:* ${user.totalInvites}\n`;
        rankText += `📈 *Posição:* ${position}º lugar\n`;
        
        if (nextLevel) {
            const needed = nextLevel.min - user.points;
            rankText += `\n📌 *Próximo nível:* ${nextLevel.icon} ${nextLevel.name}\n`;
            rankText += `✨ *Faltam:* ${needed} pontos\n`;
        }
        
        await sock.sendMessage(groupJid, { text: rankText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao buscar ranking'
        }, { quoted: message });
    }
}

// Comando !top
export async function showTopInvites(sock, message, groupJid) {
    try {
        const data = await loadGroupData(groupJid);
        
        const sorted = Object.entries(data.users)
            .sort((a, b) => b[1].points - a[1].points)
            .slice(0, 10);
        
        if (sorted.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '📊 Nenhum convite registrado ainda!\n\nConvide amigos para aparecer no ranking! 🎉'
            }, { quoted: message });
            return;
        }
        
        let topText = `🏆 *TOP CONVITES DO GRUPO*\n\n`;
        
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < sorted.length; i++) {
            const [userId, userData] = sorted[i];
            const medal = i < 3 ? medals[i] : `${i + 1}️⃣`;
            const level = getUserLevel(userData.points);
            
            // Buscar nome salvo ou buscar do grupo
            let name = userData.name;
            if (!name || name === 'null') {
                name = await getUserName(sock, groupJid, userId);
                // Atualizar nome
                userData.name = name;
                data.users[userId].name = name;
                await saveGroupData(groupJid, data);
            }
            
            if (name.length > 20) name = name.slice(0, 17) + '...';
            
            topText += `${medal} *${name}* - ${userData.points} pts (${level.icon} ${level.name})\n`;
            topText += `   👥 ${userData.totalInvites} convite(s)\n\n`;
        }
        
        topText += `📌 Use *!rank* para ver sua pontuação!`;
        
        await sock.sendMessage(groupJid, { text: topText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao buscar top convites'
        }, { quoted: message });
    }
}

// Comando !meusconvites
export async function showMyInvites(sock, message, groupJid, senderId) {
    try {
        const data = await loadGroupData(groupJid);
        
        if (!data.users[senderId] || data.users[senderId].invites.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '📊 Você ainda não convidou ninguém!\n\nUse o botão "Adicionar" para convidar amigos e ganhar pontos! 🎉'
            }, { quoted: message });
            return;
        }
        
        const user = data.users[senderId];
        
        let invitesText = `👥 *PESSOAS QUE VOCÊ CONVIDOU*\n\n`;
        invitesText += `Total: *${user.totalInvites}* convite(s)\n`;
        invitesText += `Pontos: *${user.points}*\n\n`;
        
        invitesText += `📋 *Lista:*\n`;
        
        // Mostrar últimos 10 convites (buscar nomes)
        const lastInvites = user.invites.slice(-10);
        for (let i = 0; i < lastInvites.length; i++) {
            const invitedId = lastInvites[i];
            const invitedName = await getUserName(sock, groupJid, invitedId);
            invitesText += `${i + 1}. ${invitedName}\n`;
        }
        
        if (user.invites.length > 10) {
            invitesText += `\n... e mais ${user.invites.length - 10} convite(s)`;
        }
        
        await sock.sendMessage(groupJid, { text: invitesText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao buscar seus convites'
        }, { quoted: message });
    }
}

// Comando admin: !resetconvites @user
export async function resetUserInvites(sock, message, groupJid, senderId, mentionedUser) {
    try {
        // Verificar se quem mandou é admin
        const metadata = await sock.groupMetadata(groupJid);
        const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin === 'admin' || 
                       metadata.participants.find(p => p.id === senderId)?.admin === 'superadmin';
        
        if (!isAdmin) {
            await sock.sendMessage(groupJid, {
                text: '❌ Apenas administradores podem resetar pontos!'
            }, { quoted: message });
            return;
        }
        
        if (!mentionedUser) {
            await sock.sendMessage(groupJid, {
                text: '❌ Marque o usuário: !resetconvites @usuario'
            }, { quoted: message });
            return;
        }
        
        const data = await loadGroupData(groupJid);
        
        if (data.users[mentionedUser]) {
            const userName = await getUserName(sock, groupJid, mentionedUser);
            delete data.users[mentionedUser];
            await saveGroupData(groupJid, data);
            
            await sock.sendMessage(groupJid, {
                text: `✅ Pontos de *${userName}* foram resetados!`
            }, { quoted: message });
        } else {
            await sock.sendMessage(groupJid, {
                text: '❌ Usuário não tem pontos registrados!'
            }, { quoted: message });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, {
            text: '❌ Erro ao resetar pontos'
        }, { quoted: message });
    }
}

```


### 📄 `src/handlers/welcomeHandler.js`

```
/**
 * Handler de Boas-vindas - CORRIGIDO
 * Baixa, salva e envia figurinha corretamente
 */

import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

export class WelcomeHandler {
    
    static WELCOME_DIR = './welcome_stickers';

    /**
     * Inicializa pasta
     */
    static async init() {
        try {
            if (!existsSync(this.WELCOME_DIR)) {
                await mkdir(this.WELCOME_DIR, { recursive: true });
                console.log(`📁 Pasta de welcome criada`);
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    /**
     * Envia welcome sticker quando novo membro entra
     */
    static async sendWelcomeSticker(sock, groupJid, participantNumber) {
        try {
            if (!this.isWelcomeEnabled(groupJid)) {
                console.log(`ℹ️ Welcome desativado`);
                return;
            }

            const stickerBuffer = await this.getWelcomeSticker(groupJid);
            
            if (!stickerBuffer) {
                console.log(`⚠️ Figurinha não configurada`);
                return;
            }

            // ✅ ENVIAR FIGURINHA CORRETAMENTE
            console.log(`📤 Enviando figurinha (${stickerBuffer.length} bytes)...`);
            
            await sock.sendMessage(groupJid, {
                sticker: stickerBuffer
            });

            console.log(`✅ Welcome sticker enviado!`);

        } catch (error) {
            console.error('❌ Erro:', error.message);
        }
    }

    /**
     * Salvar figurinha de welcome
     * CORRIGIDO: Verifica tamanho do arquivo
     */
    static async saveWelcomeSticker(groupJid, stickerBuffer, mediaType = 'image') {
        try {
            if (!stickerBuffer || stickerBuffer.length === 0) {
                console.log(`❌ Buffer vazio! Não conseguiu baixar figurinha`);
                return false;
            }

            console.log(`📥 Buffer recebido: ${stickerBuffer.length} bytes`);

            const fileName = `${groupJid}.webp`;
            const filePath = join(this.WELCOME_DIR, fileName);
            
            // Salvar arquivo
            await writeFile(filePath, stickerBuffer);
            
            // ✅ VERIFICAR se foi salvo
            const stats = statSync(filePath);
            console.log(`📁 Arquivo salvo: ${filePath}`);
            console.log(`📊 Tamanho: ${stats.size} bytes`);

            if (stats.size === 0) {
                console.log(`❌ Arquivo salvo mas vazio!`);
                return false;
            }

            console.log(`\n✅ FIGURINHA SALVA COM SUCESSO!`);
            console.log(`📊 Tamanho: ${stats.size} bytes`);
            console.log(`👥 Grupo: ${groupJid}`);
            console.log(`\n🚀 A figurinha será enviada quando novo membro entrar!`);
            console.log(`❌ Para desativar, use: !disablewelcome`);
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            return false;
        }
    }

    /**
     * Obter figurinha salva
     */
    static async getWelcomeSticker(groupJid) {
        try {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            
            if (!existsSync(filePath)) {
                console.log(`❌ Arquivo não existe: ${filePath}`);
                return null;
            }

            const stats = statSync(filePath);
            
            if (stats.size === 0) {
                console.log(`❌ Arquivo vazio: ${filePath}`);
                return null;
            }

            console.log(`✅ Carregando figurinha (${stats.size} bytes)`);
            return await readFile(filePath);

        } catch (error) {
            console.error('❌ Erro ao ler:', error);
            return null;
        }
    }

    /**
     * Desativar welcome
     */
    static async disableWelcome(groupJid) {
        try {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ Welcome desativado`);
                return true;
            }
            
            console.log(`ℹ️ Welcome não estava ativado`);
            return false;

        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Verificar se welcome está ativado
     */
    static isWelcomeEnabled(groupJid) {
        const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
        
        if (!existsSync(filePath)) {
            return false;
        }

        try {
            const stats = statSync(filePath);
            return stats.size > 0;
        } catch {
            return false;
        }
    }

    /**
     * Status do welcome
     */
    static getWelcomeStatus(groupJid) {
        const isEnabled = this.isWelcomeEnabled(groupJid);
        
        if (isEnabled) {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            const stats = statSync(filePath);
            return `✅ Welcome ATIVADO\n\n📊 Tamanho: ${stats.size} bytes\n🎉 Figurinha será enviada`;
        } else {
            return `❌ Welcome DESATIVADO\n\n📝 Configure com:\n1. Responda a uma figurinha\n2. Digite: !setwelcome`;
        }
    }
}

```


### 📄 `src/handlers/groupHandler.js`

```
/**
 * Handler de Grupo - BAN CONFIGURÁVEL
 * Ativa/Desativa ban de gringos com comando
 */

import { ProtectionUtils } from '../utils/protectionUtils.js';
import { WelcomeHandler } from './welcomeHandler.js';
import { config } from '../../config.js';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { handleNewMember } from '../../plugins/inviteRank.js'; 
export class GroupHandler {
    
    static BAN_DIR = './ban_config';

    /**
     * Inicializa pasta de config
     */
    static async init() {
        try {
            if (!existsSync(this.BAN_DIR)) {
                const fs = await import('fs/promises');
                await fs.mkdir(this.BAN_DIR, { recursive: true });
                console.log(`📁 Pasta de ban config criada`);
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    /**
     * Processa quando membro entra no grupo
     */
    static async handleGroupParticipantsUpdate(update, sock, groupJid) {
        try {
            const { participants, action } = update;

            if (action !== 'add') {
                return;
            }

            console.log(`\n👥 NOVO(S) MEMBRO(S) ENTRANDO`);
            console.log(`📍 Grupo: ${groupJid}`);

            // Processar cada novo membro
            for (const participant of participants) {
                await this.handleNewMember(participant, sock, groupJid);
            }

        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }

    /**
     * Processa novo membro
     */
    static async handleNewMember(participant, sock, groupJid) {
        try {
            // Extrair número
            const number = ProtectionUtils.extractNumber({ key: { participant } }, true);

            if (!number) {
                console.log(`⚠️ Número inválido`);
                return;
            }

            console.log(`📱 Novo membro: ${number}`);

            // Verificar se é gringo
            const isForeign = ProtectionUtils.isForeignNumber(number, config.protection.antigringo.countryCode);
            
            // ✅ VERIFICAR SE BAN ESTÁ ATIVADO
            const banEnabled = this.isBanEnabled(groupJid);

            if (isForeign && banEnabled) {
                // Gringo + Ban ativado = BAN
                console.log(`⛔ GRINGO + BAN ATIVADO`);
                console.log(`🔨 BANINDO...`);

                await this.banMember(sock, groupJid, participant);

                if (config.protection.actions.banMessage) {
                    await this.sendBanNotification(sock, groupJid);
                }

            } else {
              // Após identificar quem convidou (inviterId), chame:
await handleNewMember(sock, groupJid, participant, inviterId, inviterName);
                // Qualquer outro caso = WELCOME
                if (isForeign && !banEnabled) {
                    console.log(`🌍 Gringo (mas ban desativado)`);
                } else {
                    console.log(`🇧🇷 Brasileiro`);
                }
                
                console.log(`✅ Bem-vindo ao grupo!`);
                
                // Manda welcome sticker
                await WelcomeHandler.sendWelcomeSticker(sock, groupJid, number);
            }

        } catch (error) {
            console.error(`❌ Erro:`, error);
        }
    }

    /**
     * Verifica se ban está ativado para este grupo
     */
    static isBanEnabled(groupJid) {
        const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
        return existsSync(banFile);
    }

    /**
     * Ativa ban de gringos
     */
    static enableBan(groupJid) {
        try {
            const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
            writeFileSync(banFile, '1');
            console.log(`✅ Ban de gringos ATIVADO`);
            return true;
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Desativa ban de gringos
     */
    static disableBan(groupJid) {
        try {
            const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
            if (existsSync(banFile)) {
                unlinkSync(banFile);
            }
            console.log(`✅ Ban de gringos DESATIVADO`);
            return true;
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Ver status do ban
     */
    static getBanStatus(groupJid) {
        const isEnabled = this.isBanEnabled(groupJid);
        
        if (isEnabled) {
            return `🔨 Ban de gringos: ATIVADO\n\n❌ Gringos serão banidos\n✅ Brasileiros receberão welcome`;
        } else {
            return `🔓 Ban de gringos: DESATIVADO\n\n✅ Todos podem entrar\n✅ Todos receberão welcome`;
        }
    }

    /**
     * Bane um membro
     */
    static async banMember(sock, groupJid, participant) {
        try {
            await sock.groupParticipantsUpdate(
                groupJid,
                [participant],
                'remove'
            );

            console.log(`✅ Banido!`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao banir:`, error.message);
            return false;
        }
    }

    /**
     * Notifica ban
     */
    static async sendBanNotification(sock, groupJid) {
        try {
            const message = `⛔ Membro gringo foi banido!\n\n🇧🇷 Este grupo aceita apenas brasileiros.`;

            await sock.sendMessage(groupJid, {
                text: message
            });

        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
}

```


### 📄 `src/handlers/protectionHandler.js`

```
/**
 * Handler de Proteção - VERSÃO SIMPLES
 * Apenas deixa mensagens passarem normalmente
 * O ban acontece em groupHandler.js
 */

import { ProtectionUtils } from '../utils/protectionUtils.js';
import { config } from '../../config.js';

export class ProtectionHandler {
    
    /**
     * Valida mensagens - AGORA APENAS DEIXA PASSAR
     * Ban de gringos acontece quando entram no grupo
     */
    static validateMessage(message) {
        try {
            // Não faz nada com mensagens
            // Ban automático acontece em groupHandler.js
            console.log(`✅ Mensagem passando (sem validação)`);
            return { blocked: false };

        } catch (error) {
            console.error('❌ Erro ao validar:', error);
            return { blocked: false };
        }
    }

    /**
     * Extrai texto da mensagem
     */
    static getMessageText(message) {
        const msg = message.message;
        return (
            msg?.conversation ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            msg?.extendedTextMessage?.text ||
            ''
        );
    }

    /**
     * Envia mensagem de bloqueio
     */
    static async sendBlockMessage(sock, message, blockInfo) {
        try {
            const blockMessage = ProtectionUtils.getBlockMessage(blockInfo.type);
            
            await sock.sendMessage(message.key.remoteJid, {
                text: blockMessage
            }, { quoted: message });

            console.log(`✅ Mensagem de bloqueio enviada`);
        } catch (error) {
            console.error('❌ Erro ao enviar bloqueio:', error);
        }
    }

    /**
     * Deleta mensagem bloqueada
     */
    static async deleteBlockedMessage(sock, message) {
        try {
            await sock.sendMessage(message.key.remoteJid, {
                delete: message.key
            });
            console.log('✅ Mensagem deletada');
        } catch (error) {
            console.log('⚠️ Não foi possível deletar');
        }
    }
}

```


### 📄 `src/handlers/stickerHandler.js`

```
//ATUALIZADOpor deedpseek
import { downloadContentFromMessage, proto } from '@whiskeysockets/baileys';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export class StickerHandler {
    static async createStickerFromMessage(message, sock) {
        try {
            console.log('🔄 Processando sticker...');

            // ✅ AGORA SUPORTA VISUALIZAÇÃO ÚNICA
            let mediaMessage = message;
            let isViewOnce = false;

            // Verificar se é mensagem marcada (quoted)
            if (message.message?.extendedTextMessage?.contextInfo) {
                console.log('📌 Mensagem marcada detectada');
                const contextInfo = message.message.extendedTextMessage.contextInfo;
                mediaMessage = {
                    ...message,
                    message: contextInfo.quotedMessage
                };
                
                // Verificar se é visualização única marcada
                isViewOnce = contextInfo.quotedMessage?.viewOnceMessageV2 ||
                           contextInfo.quotedMessage?.viewOnceMessageV2Extension;
            }

            // Verificar se é visualização única direta
            if (!isViewOnce) {
                isViewOnce = mediaMessage.message?.viewOnceMessageV2 ||
                           mediaMessage.message?.viewOnceMessageV2Extension;
            }

            // ✅ EXTRAIR MÍDIA DE VISUALIZAÇÃO ÚNICA
            let actualMediaMessage = mediaMessage;
            if (isViewOnce) {
                console.log('👁️ Visualização única detectada');
                // Extrair a mídia real de dentro da mensagem de visualização única
                actualMediaMessage = {
                    ...mediaMessage,
                    message: mediaMessage.message?.viewOnceMessageV2?.message ||
                            mediaMessage.message?.viewOnceMessageV2Extension?.message
                };
            }

            // Verificar se tem mídia (agora incluindo visualização única)
            const isImage = actualMediaMessage.message?.imageMessage ||
                          actualMediaMessage.message?.viewOnceMessageV2?.message?.imageMessage;
            
            const isVideo = actualMediaMessage.message?.videoMessage ||
                          actualMediaMessage.message?.viewOnceMessageV2?.message?.videoMessage;

            if (!isImage && !isVideo) {
                return {
                    success: false,
                    error: '❌ Nenhuma mídia encontrada. Envie uma imagem/vídeo ou marque uma mídia existente.'
                };
            }

            console.log(isVideo ? '🎥 Vídeo detectado' + (isViewOnce ? ' (visualização única)' : '') : 
                         '🖼️ Imagem detectada' + (isViewOnce ? ' (visualização única)' : ''));
            
            console.log('📥 Baixando mídia...');

            // ✅ DOWNLOAD SUPORTANDO VISUALIZAÇÃO ÚNICA
            const mediaBuffer = await this.downloadMedia(actualMediaMessage, isVideo ? 'video' : 'image', isViewOnce);
            
            if (!mediaBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao baixar mídia. Tente enviar novamente.'
                };
            }

            console.log(`✅ Download concluído: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB`);

            // Criar sticker
            let stickerBuffer;
            if (isVideo) {
                stickerBuffer = await this.createVideoSticker(mediaBuffer);
            } else {
                stickerBuffer = await this.createImageSticker(mediaBuffer);
            }

            if (!stickerBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao criar figurinha'
                };
            }

            console.log('✅ Figurinha criada com sucesso!' + (isViewOnce ? ' (de visualização única)' : ''));
            return { success: true, buffer: stickerBuffer };

        } catch (error) {
            console.error('💥 Erro no StickerHandler:', error);
            await this.cleanTempFiles();
            
            if (error.message.includes('view once') || error.message.includes('view_once')) {
                return {
                    success: false,
                    error: '❌ Não foi possível processar visualização única. O WhatsApp pode ter bloqueado o acesso.'
                };
            }
            
            return {
                success: false,
                error: '❌ Erro ao processar mídia'
            };
        }
    }

    // ✅ MÉTODO ATUALIZADO: Suporte a visualização única
    static async downloadMedia(message, type, isViewOnce = false) {
        try {
            console.log(isViewOnce ? '🔓 Processando visualização única...' : '📥 Baixando mídia normal...');
            
            let media;
            
            if (isViewOnce) {
                // Para visualização única, a mídia está em viewOnceMessageV2.message
                media = message.message?.viewOnceMessageV2?.message?.[`${type}Message`] ||
                       message.message?.[`${type}Message`];
            } else {
                // Para mídia normal
                media = message.message?.[`${type}Message`];
            }

            if (!media) {
                throw new Error('Mídia não encontrada');
            }

            // Método mais confiável para download
            const stream = await downloadContentFromMessage(media, type);
            
            const bufferChunks = [];
            for await (const chunk of stream) {
                bufferChunks.push(chunk);
            }
            
            const buffer = Buffer.concat(bufferChunks);
            
            if (buffer.length === 0) {
                throw new Error('Mídia vazia');
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro no download:', error);
            
            // Tentar método alternativo
            try {
                console.log('🔄 Tentando método alternativo...');
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                
                // Para visualização única, precisamos ajustar a mensagem
                let downloadMessage = message;
                if (isViewOnce) {
                    downloadMessage = {
                        ...message,
                        message: message.message?.viewOnceMessageV2?.message || message.message
                    };
                }
                
                return await downloadMediaMessage(
                    downloadMessage,
                    'buffer',
                    {},
                    { reuploadRequest: async () => {} }
                );
            } catch (fallbackError) {
                console.error('❌ Método alternativo também falhou:', fallbackError);
                
                if (isViewOnce) {
                    throw new Error('Não foi possível acessar mídia de visualização única');
                } else {
                    throw new Error('Não foi possível baixar a mídia');
                }
            }
        }
    }

    static async createImageSticker(imageBuffer) {
        try {
            console.log('🎨 Criando sticker de imagem...');
            
            // Forçar 512x512 distorcendo a imagem
            const processedImage = await sharp(imageBuffer)
                .resize(512, 512, {
                    fit: 'fill', // Distorce para caber no quadrado
                    withoutEnlargement: false
                })
                .png()
                .toBuffer();

            const sticker = new Sticker(processedImage, {
                pack: 'link do grupo ',
                author: 'inst:@sticker of kings',
                type: StickerTypes.FULL,
                quality: 80,
                background: 'transparent'
            });

            return await sticker.toBuffer();
            
        } catch (error) {
            console.error('❌ Erro ao criar sticker de imagem:', error);
            throw error;
        }
    }

    static async createVideoSticker(videoBuffer) {
        let tempInput, tempOutput;
        
        try {
            console.log('🎬 Criando sticker de vídeo...');
            
            const timestamp = Date.now();
            tempInput = `./temp_video_${timestamp}.mp4`;
            tempOutput = `./temp_sticker_${timestamp}.webp`;
            
            await writeFile(tempInput, videoBuffer);

            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .inputOptions(['-loglevel error', '-y'])
                    .outputOptions([
                        '-vcodec libwebp',
                        '-vf scale=512:512:flags=lanczos',
                        '-loop 0',
                        '-r 10',
                        '-preset default',
                        '-an',
                        '-quality 60',
                        '-compression_level 4',
                        '-f webp'
                    ])
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempOutput);
            });

            const stickerBuffer = await readFile(tempOutput);
            return stickerBuffer;
            
        } catch (error) {
            console.error('❌ Erro ao criar sticker de vídeo:', error);
            throw error;
        } finally {
            await this.safeUnlink(tempInput);
            await this.safeUnlink(tempOutput);
        }
    }

    static async safeUnlink(filePath) {
        try {
            if (filePath) await unlink(filePath);
        } catch (error) {
            // Ignora erros
        }
    }

    static async cleanTempFiles() {
        try {
            const files = await readdir('.');
            const tempFiles = files.filter(file => 
                file.startsWith('temp_') && 
                (file.endsWith('.mp4') || file.endsWith('.webp'))
            );
            
            for (const file of tempFiles) {
                await this.safeUnlink(file);
            }
        } catch (error) {
            // Ignora erros
        }
    }
}

```


### 📄 `src/handlers/toImageHandler.js`

```
// src/handlers/toImageHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export class ToImageHandler {
    
    /**
     * Converte sticker para imagem
     */
    static async convertStickerToImage(message, sock) {
        try {
            console.log('🔄 Iniciando conversão sticker → imagem...');

            // Verificar se é mensagem marcada (respondendo a figurinha)
            let stickerMessage = null;
            let isQuoted = false;

            if (message.message?.extendedTextMessage?.contextInfo) {
                const contextInfo = message.message.extendedTextMessage.contextInfo;
                if (contextInfo.quotedMessage?.stickerMessage) {
                    stickerMessage = contextInfo.quotedMessage.stickerMessage;
                    isQuoted = true;
                    console.log('📌 Figurinha marcada detectada');
                }
            }

            // Verificar se a mensagem atual é figurinha
            if (!stickerMessage && message.message?.stickerMessage) {
                stickerMessage = message.message.stickerMessage;
                console.log('📌 Figurinha direta detectada');
            }

            if (!stickerMessage) {
                return {
                    success: false,
                    error: '❌ Responda a uma figurinha ou envie uma figurinha com o comando !toimg'
                };
            }

            console.log('📥 Baixando figurinha...');

            // Baixar o sticker
            const stickerBuffer = await this.downloadSticker(stickerMessage);
            
            if (!stickerBuffer || stickerBuffer.length === 0) {
                return {
                    success: false,
                    error: '❌ Erro ao baixar a figurinha'
                };
            }

            console.log(`✅ Download concluído: ${(stickerBuffer.length / 1024).toFixed(2)}KB`);

            // Converter sticker para imagem
            const imageBuffer = await this.convertStickerToImageBuffer(stickerBuffer);

            if (!imageBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao converter figurinha para imagem'
                };
            }

            console.log(`✅ Conversão concluída: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

            // Enviar a imagem
            await sock.sendMessage(message.key.remoteJid, {
                image: imageBuffer,
                caption: '🖼️ *Figurinha convertida para imagem*\n\n📏 Tamanho original preservado'
            }, { quoted: message });

            console.log('✅ Imagem enviada com sucesso!');
            
            return { success: true };

        } catch (error) {
            console.error('❌ Erro ao converter sticker:', error);
            return {
                success: false,
                error: '❌ Erro ao processar a figurinha. Verifique se é uma figurina válida.'
            };
        }
    }

    /**
     * Baixa o sticker do WhatsApp
     */
    static async downloadSticker(stickerMessage) {
        try {
            const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
            const chunks = [];
            
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            
            return Buffer.concat(chunks);
            
        } catch (error) {
            console.error('❌ Erro no download:', error);
            throw error;
        }
    }

    /**
     * Converte sticker WebP para PNG/JPEG
     */
    static async convertStickerToImageBuffer(stickerBuffer) {
        let tempInput = null;
        let tempOutput = null;
        
        try {
            const timestamp = Date.now();
            tempInput = path.join('./temp', `sticker_${timestamp}.webp`);
            tempOutput = path.join('./temp', `output_${timestamp}.png`);
            
            // Garantir que pasta temp existe
            const { mkdir } = await import('fs/promises');
            await mkdir('./temp', { recursive: true });
            
            // Salvar sticker temporariamente
            await writeFile(tempInput, stickerBuffer);
            
            // Converter WebP para PNG usando Sharp
            await sharp(tempInput)
                .png({
                    quality: 100,
                    compressionLevel: 6
                })
                .toFile(tempOutput);
            
            // Ler o arquivo convertido
            const { readFile } = await import('fs/promises');
            const imageBuffer = await readFile(tempOutput);
            
            // Obter dimensões da imagem original
            const metadata = await sharp(tempInput).metadata();
            console.log(`📐 Dimensões originais: ${metadata.width}x${metadata.height}`);
            
            // Se a imagem for muito pequena (sticker geralmente é 512x512), 
            // podemos manter o tamanho original ou redimensionar
            // Por padrão, mantemos o tamanho original do sticker
            
            return imageBuffer;
            
        } catch (error) {
            console.error('❌ Erro na conversão:', error);
            
            // Tentar método alternativo: converter para JPEG
            try {
                console.log('🔄 Tentando converter para JPEG...');
                const timestamp = Date.now();
                tempInput = path.join('./temp', `sticker_${timestamp}.webp`);
                tempOutput = path.join('./temp', `output_${timestamp}.jpg`);
                
                await writeFile(tempInput, stickerBuffer);
                
                await sharp(tempInput)
                    .jpeg({
                        quality: 90,
                        progressive: true
                    })
                    .toFile(tempOutput);
                
                const { readFile } = await import('fs/promises');
                return await readFile(tempOutput);
                
            } catch (fallbackError) {
                console.error('❌ Método alternativo falhou:', fallbackError);
                throw error;
            }
            
        } finally {
            // Limpar arquivos temporários
            await this.cleanTempFile(tempInput);
            await this.cleanTempFile(tempOutput);
        }
    }

    /**
     * Limpa arquivos temporários
     */
    static async cleanTempFile(filePath) {
        try {
            if (filePath) {
                await unlink(filePath);
            }
        } catch (error) {
            // Ignora erros de arquivo não encontrado
        }
    }
}

```


### 📄 `src/handlers/removeBgHandler.js`

```
// src/handlers/removeBgHandler.js
import axios from 'axios';
import { Sticker } from 'wa-sticker-formatter';
import FormData from 'form-data';
import { config } from '../../config.js';

export class RemoveBgHandler {
    
    static async removeBackground(message, sock) {
        try {
            console.log('🔄 Iniciando remoção de fundo...');

            // Verificar se respondeu a uma imagem
            let quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let directImage = message.message?.imageMessage;
            
            const imageMsg = quotedImage || directImage;
            
            if (!imageMsg) {
                return {
                    success: false,
                    error: '❌ Responda a uma imagem ou envie uma imagem com !removebg\n\n📌 Exemplo: Envie uma foto e digite !removebg'
                };
            }
            
            // Avisar que está processando
            await sock.sendMessage(message.key.remoteJid, {
                text: '🔄 Removendo fundo da imagem...⏳'
            }, { quoted: message });
            
            // Baixar a imagem
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            console.log(`📥 Imagem baixada: ${(buffer.length / 1024).toFixed(2)}KB`);
            
            // Tentar remover fundo com as chaves disponíveis
            const cleanImageBuffer = await this.tryRemoveBackground(buffer);
            
            if (!cleanImageBuffer) {
                return {
                    success: false,
                    error: '❌ Todas as APIs estão sem limite ou offline.\n\n📊 Tente novamente amanhã ou use outra conta.'
                };
            }
            
            console.log(`✅ Fundo removido! Tamanho: ${(cleanImageBuffer.length / 1024).toFixed(2)}KB`);
            
            // Criar sticker com fundo removido
            const sticker = new Sticker(cleanImageBuffer, {
                pack: 'StickerBot',
                author: 'Remove.bg',
                type: 'full',
                quality: 80
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            // Enviar sticker
            await sock.sendMessage(message.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: message });
            
            console.log('✅ Sticker sem fundo enviado!');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro detalhado:', error);
            
            // Mensagem de erro mais amigável
            let errorMsg = '❌ Erro ao remover fundo. Tente novamente.';
            
            if (error.code === 'ECONNABORTED') {
                errorMsg = '❌ Tempo esgotado. Tente novamente.';
            } else if (error.message?.includes('timeout')) {
                errorMsg = '❌ Demorou muito. Tente uma imagem menor.';
            }
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    /**
     * Tenta remover fundo usando múltiplas chaves de API
     */
    static async tryRemoveBackground(imageBuffer) {
        // Se não tem chaves configuradas, erro
        if (!config.removeBgApiKeys || config.removeBgApiKeys.length === 0) {
            console.error('❌ Nenhuma chave de API configurada no config.js');
            return null;
        }
        
        let lastError = null;
        
        // Tentar cada chave de API
        for (let i = 0; i < config.removeBgApiKeys.length; i++) {
            const apiKey = config.removeBgApiKeys[i];
            
            // Pular chaves vazias
            if (!apiKey || apiKey.trim() === '') {
                console.log(`⚠️ Chave ${i + 1} está vazia, pulando...`);
                continue;
            }
            
            try {
                console.log(`🔄 Tentando API ${i + 1}/${config.removeBgApiKeys.length}...`);
                
                const formData = new FormData();
                formData.append('image_file', imageBuffer, {
                    filename: 'image.png',
                    contentType: 'image/png'
                });
                formData.append('size', 'auto');
                
                const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'X-Api-Key': apiKey
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                // Verificar se resposta é válida
                if (!response.data || response.data.length === 0) {
                    throw new Error('Resposta vazia da API');
                }
                
                // Verificar se resposta é HTML (erro)
                const firstBytes = response.data.slice(0, 10).toString();
                if (firstBytes.includes('<!DOCTYPE') || firstBytes.includes('<html')) {
                    console.log(`⚠️ API ${i + 1} retornou HTML (possivelmente erro)`);
                    continue;
                }
                
                console.log(`✅ API ${i + 1} funcionou!`);
                return Buffer.from(response.data);
                
            } catch (error) {
                console.log(`⚠️ API ${i + 1} falhou:`);
                
                if (error.response) {
                    const status = error.response.status;
                    console.log(`   Status: ${status}`);
                    
                    if (status === 402) {
                        console.log(`   Motivo: Limite mensal excedido`);
                    } else if (status === 401) {
                        console.log(`   Motivo: Chave inválida`);
                    } else if (status === 413) {
                        console.log(`   Motivo: Imagem muito grande`);
                    } else if (status === 429) {
                        console.log(`   Motivo: Muitas requisições`);
                    } else {
                        console.log(`   Motivo: Erro desconhecido`);
                    }
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`   Motivo: Timeout`);
                } else {
                    console.log(`   Motivo: ${error.message}`);
                }
                
                lastError = error;
                
                // Se não for erro de limite (402), tenta próxima chave mesmo assim
                // Se for erro de imagem (413), para de tentar
                if (error.response?.status === 413) {
                    console.log(`📐 Imagem muito grande, não adianta tentar outras chaves`);
                    break;
                }
                
                // Continua para próxima chave
                continue;
            }
        }
        
        console.log(`❌ Todas as ${config.removeBgApiKeys.length} chaves falharam`);
        return null;
    }
}

```


### 📄 `src/handlers/stickerPackHandler.js`

```
// src/handlers/stickerPackHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export class StickerPackHandler {
    
    static STICKERS_DIR = './stickers';
    static MAX_STICKERS_PER_REQUEST = 3;
    static DELAY_BETWEEN_STICKERS = 800; // ms
    
    /**
     * Inicializa a pasta de stickers
     */
    static async init() {
        try {
            if (!existsSync(this.STICKERS_DIR)) {
                mkdirSync(this.STICKERS_DIR, { recursive: true });
                console.log('📁 Pasta de stickers criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Lista todos os pacotes disponíveis
     */
    static async listPacks() {
        try {
            const packs = await readdir(this.STICKERS_DIR);
            const result = [];
            
            for (const pack of packs) {
                const packPath = join(this.STICKERS_DIR, pack);
                const stats = await readdir(packPath);
                const stickerFiles = stats.filter(f => f.endsWith('.webp'));
                
                result.push({
                    name: pack,
                    count: stickerFiles.length
                });
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erro ao listar pacotes:', error);
            return [];
        }
    }
    
    /**
     * Salva uma figurinha
     */
    static async saveSticker(packName, stickerBuffer, message, sock) {
        try {
            // Validar pacote
            if (!packName || packName.trim() === '') {
                return { success: false, error: '❌ Nome do pacote inválido' };
            }
            
            // Limpar nome do pacote (apenas letras e números)
            packName = packName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (packName.length < 3) {
                return { success: false, error: '❌ Nome do pacote deve ter pelo menos 3 caracteres' };
            }
            
            // Criar pasta do pacote
            const packDir = join(this.STICKERS_DIR, packName);
            if (!existsSync(packDir)) {
                mkdirSync(packDir, { recursive: true });
            }
            
            // Contar stickers existentes
            const existingFiles = readdirSync(packDir).filter(f => f.endsWith('.webp'));
            const nextId = existingFiles.length + 1;
            
            // Nome do arquivo
            const fileName = `${packName}_${String(nextId).padStart(3, '0')}.webp`;
            const filePath = join(packDir, fileName);
            
            // Salvar sticker
            await writeFile(filePath, stickerBuffer);
            
            console.log(`✅ Sticker salvo: ${fileName} (${(stickerBuffer.length / 1024).toFixed(2)}KB)`);
            
            return {
                success: true,
                fileName: fileName,
                packName: packName,
                total: nextId
            };
            
        } catch (error) {
            console.error('❌ Erro ao salvar sticker:', error);
            return { success: false, error: '❌ Erro ao salvar figurinha' };
        }
    }
    
    /**
     * Envia figurinhas de um pacote
     */
    static async sendStickers(sock, groupJid, packName, quantity, quotedMessage) {
        try {
            // Validar quantidade
            let qty = Math.min(quantity, this.MAX_STICKERS_PER_REQUEST);
            if (qty < 1) qty = 1;
            
            // Verificar se pacote existe
            const packDir = join(this.STICKERS_DIR, packName);
            if (!existsSync(packDir)) {
                return { success: false, error: `❌ Pacote "${packName}" não encontrado` };
            }
            
            // Listar stickers do pacote
            const files = readdirSync(packDir).filter(f => f.endsWith('.webp'));
            
            if (files.length === 0) {
                return { success: false, error: `❌ Pacote "${packName}" está vazio` };
            }
            
            // Embaralhar e pegar os primeiros 'qty'
            const shuffled = [...files].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, qty);
            
            // Enviar mensagem de início
            await sock.sendMessage(groupJid, {
                text: `🎲 Enviando ${selected.length} figurinha(s) do pacote "${packName}"...`
            }, { quoted: quotedMessage });
            
            // Enviar cada sticker com delay
            for (let i = 0; i < selected.length; i++) {
                const filePath = join(packDir, selected[i]);
                const stickerBuffer = await readFile(filePath);
                
                await sock.sendMessage(groupJid, {
                    sticker: stickerBuffer
                });
                
                // Delay entre stickers (evitar spam)
                if (i < selected.length - 1) {
                    await this.delay(this.DELAY_BETWEEN_STICKERS);
                }
            }
            
            return { success: true, count: selected.length, total: files.length };
            
        } catch (error) {
            console.error('❌ Erro ao enviar stickers:', error);
            return { success: false, error: '❌ Erro ao enviar figurinhas' };
        }
    }
    
    /**
     * Envia sticker aleatório de qualquer pacote
     */
    static async sendRandomSticker(sock, groupJid, quotedMessage) {
        try {
            // Listar todos os pacotes
            const packs = await this.listPacks();
            
            if (packs.length === 0) {
                return { success: false, error: '❌ Nenhum pacote disponível' };
            }
            
            // Filtrar pacotes com stickers
            const validPacks = [];
            for (const pack of packs) {
                const packDir = join(this.STICKERS_DIR, pack.name);
                const files = readdirSync(packDir).filter(f => f.endsWith('.webp'));
                if (files.length > 0) {
                    validPacks.push({ name: pack.name, files });
                }
            }
            
            if (validPacks.length === 0) {
                return { success: false, error: '❌ Nenhuma figurinha disponível' };
            }
            
            // Escolher pacote aleatório
            const randomPack = validPacks[Math.floor(Math.random() * validPacks.length)];
            const randomFile = randomPack.files[Math.floor(Math.random() * randomPack.files.length)];
            const filePath = join(this.STICKERS_DIR, randomPack.name, randomFile);
            
            const stickerBuffer = await readFile(filePath);
            
            await sock.sendMessage(groupJid, {
                sticker: stickerBuffer
            });
            
            return { success: true, pack: randomPack.name };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return { success: false, error: '❌ Erro ao enviar figurinha' };
        }
    }
    
    /**
     * Remove uma figurinha
     */
    static async removeSticker(stickerId, message, sock) {
        try {
            // Formato: pacote_numero (ex: reacoes_001)
            const parts = stickerId.split('_');
            if (parts.length < 2) {
                return { success: false, error: '❌ ID inválido. Use: pack_001' };
            }
            
            const packName = parts.slice(0, -1).join('_');
            const fileName = `${stickerId}.webp`;
            const filePath = join(this.STICKERS_DIR, packName, fileName);
            
            if (!existsSync(filePath)) {
                return { success: false, error: '❌ Figurinha não encontrada' };
            }
            
            unlinkSync(filePath);
            
            return { success: true, packName: packName, stickerId: stickerId };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return { success: false, error: '❌ Erro ao remover figurinha' };
        }
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Delay helper
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Baixa sticker da mensagem
     */
    static async downloadSticker(message) {
        try {
            let stickerMsg = null;
            
            // Verificar se respondeu a uma figurinha
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
                stickerMsg = message.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            }
            // Verificar se a mensagem é uma figurinha
            else if (message.message?.stickerMessage) {
                stickerMsg = message.message.stickerMessage;
            }
            
            if (!stickerMsg) {
                return null;
            }
            
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return null;
        }
    }
}

```


### 📄 `src/handlers/circleHandler.js`

```
// src/handlers/circleHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import sharp from 'sharp';

export class CircleHandler {
    
    /**
     * Cria sticker redondo a partir de uma imagem ou sticker
     */
    static async createCircleSticker(message, sock) {
        try {
            console.log('🔄 Criando sticker redondo...');
            
            // Verificar se respondeu a uma imagem ou sticker
            let quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
            let directImage = message.message?.imageMessage;
            let directSticker = message.message?.stickerMessage;
            
            const imageMsg = quotedImage || directImage;
            const stickerMsg = quotedSticker || directSticker;
            
            let buffer = null;
            
            // Baixar imagem ou sticker
            if (imageMsg) {
                const stream = await downloadContentFromMessage(imageMsg, 'image');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                console.log('📥 Imagem baixada');
                
            } else if (stickerMsg) {
                const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                console.log('📥 Sticker baixado');
                
            } else {
                return {
                    success: false,
                    error: '❌ Responda a uma IMAGEM ou FIGURINHA com !scircle'
                };
            }
            
            // Criar máscara circular usando SVG (nativo, sem canvas)
            const size = 512;
            
            // SVG para máscara circular
            const svgMask = `
                <svg width="${size}" height="${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
                </svg>
            `;
            
            // Aplicar máscara circular com sharp
            const circleBuffer = await sharp(buffer)
                .resize(size, size, {
                    fit: 'cover',
                    position: 'centre'
                })
                .composite([{
                    input: Buffer.from(svgMask),
                    blend: 'dest-in'
                }])
                .png()
                .toBuffer();
            
            // Criar sticker
            const sticker = new Sticker(circleBuffer, {
                pack: 'StickerBot',
                author: 'Circle Sticker',
                type: 'full',
                quality: 90
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            await sock.sendMessage(message.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: message });
            
            console.log('✅ Sticker redondo enviado!');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return {
                success: false,
                error: '❌ Erro ao criar sticker redondo. Tente outra imagem.'
            };
        }
    }
}

```


### 📄 `src/handlers/menuHandler.js`

```
// src/handlers/menuHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export class MenuHandler {
    
    static MENU_DIR = './menu';
    
    /**
     * Inicializa a pasta do menu
     */
    static async init() {
        try {
            if (!existsSync(this.MENU_DIR)) {
                mkdirSync(this.MENU_DIR, { recursive: true });
                console.log('📁 Pasta do menu criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Salva imagem do menu para um grupo específico
     */
    static async saveMenuImage(groupJid, imageBuffer) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            await writeFile(filePath, imageBuffer);
            
            console.log(`✅ Imagem do menu salva para ${groupJid}`);
            return { success: true, filePath };
            
        } catch (error) {
            console.error('❌ Erro ao salvar imagem do menu:', error);
            return { success: false, error: 'Erro ao salvar imagem' };
        }
    }
    
    /**
     * Remove imagem do menu de um grupo
     */
    static async deleteMenuImage(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ Imagem do menu removida para ${groupJid}`);
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro ao remover imagem:', error);
            return { success: false, error: 'Erro ao remover imagem' };
        }
    }
    
    /**
     * Pega imagem do menu de um grupo
     */
    static async getMenuImage(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            if (existsSync(filePath)) {
                const buffer = await readFile(filePath);
                return buffer;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao ler imagem:', error);
            return null;
        }
    }
    
    /**
     * Gera o texto do menu
     */
    static getMenuText() {
        return `
╭━━━━━━━━━━━━━━━━━━━━╮
┃     🤖 STICKER BOT    
┃     Menu Principal    
╰━━━━━━━━━━━━━━━━━━━━╯

┌─── 🎨 FIGURINHAS ───┐
│ !fig     → Criar sticker
│ !s       → Atalho rápido
│ !toimg   → Sticker → Imagem
│ !removebg→ Remover fundo
│ !scircle → Sticker redondo
└─────────────────────┘

┌─── 📦 PACOTES ────┐
│ !pack [nome]  → Pegar sticker
│ !packs        → Listar pacotes
│ !sticker      → Sticker aleatório
└──────────────────┘

┌─── 🎉 WELCOME ───┐
│ !setwelcome      → Configurar
│ !disablewelcome  → Desativar
│ !welcomestatus   → Status
└──────────────────┘

┌─── 🔨 BAN ────┐
│ !enableban   → Ativar
│ !disableban  → Desativar
│ !banstatus   → Status
└───────────────┘

┌─── 📌 MENU ───┐
│ !menu         → Este menu
│ !setmenu      → Definir imagem (admin)
│ !delmenu      → Remover imagem (admin)
└────────────────┘

✨ Envie !help para mais detalhes
        `;
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Baixa imagem da mensagem
     */
    static async downloadImage(message) {
        try {
            let imageMsg = null;
            
            // Verificar se respondeu a uma imagem
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                imageMsg = message.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            // Verificar se a mensagem é uma imagem
            else if (message.message?.imageMessage) {
                imageMsg = message.message.imageMessage;
            }
            
            if (!imageMsg) {
                return null;
            }
            
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro ao baixar imagem:', error);
            return null;
        }
    }
}

```


### 📄 `src/handlers/antiLinkHandler.js`

```
// src/handlers/antiLinkHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class AntiLinkHandler {
    
    static ANTI_LINK_DIR = './antilink_config';
    
    // Domínios bloqueados por padrão
    static DEFAULT_BLOCKED_DOMAINS = [
    'whatsapp.com',
    'chat.whatsapp.com',
    'wa.me',
    'youtube.com',
    'youtu.be',
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly',
    'shorte.st',
    'fc.lc',
    'linktree.com',
    'instagram.com',
    'facebook.com',
    'tiktok.com',
    'twitter.com'
];
    
    /**
     * Inicializa a pasta de configuração
     */
    static async init() {
        try {
            if (!existsSync(this.ANTI_LINK_DIR)) {
                mkdirSync(this.ANTI_LINK_DIR, { recursive: true });
                console.log('📁 Pasta do anti-link criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Salva configuração de um grupo
     */
    static async saveConfig(groupJid, config) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_LINK_DIR, fileName);
            await writeFile(filePath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar config:', error);
            return false;
        }
    }
    
    /**
     * Carrega configuração de um grupo
     */
    static async loadConfig(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_LINK_DIR, fileName);
            
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return JSON.parse(data);
            }
            
            // Configuração padrão
            return {
                enabled: false,
                action: 'delete', // 'delete', 'warn', 'kick'
                blockedDomains: [...this.DEFAULT_BLOCKED_DOMAINS],
                whitelistDomains: [],
                whitelistUsers: [],
                customMessage: null
            };
        } catch (error) {
            console.error('❌ Erro ao carregar config:', error);
            return {
                enabled: false,
                action: 'delete',
                blockedDomains: [...this.DEFAULT_BLOCKED_DOMAINS],
                whitelistDomains: [],
                whitelistUsers: [],
                customMessage: null
            };
        }
    }
    
    /**
     * Ativa/desativa anti-link no grupo
     */
    static async setEnabled(groupJid, enabled) {
        const config = await this.loadConfig(groupJid);
        config.enabled = enabled;
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Define ação para links
     */
    static async setAction(groupJid, action) {
        const validActions = ['delete', 'warn', 'kick'];
        if (!validActions.includes(action)) {
            return { success: false, error: 'Ação inválida. Use: delete, warn ou kick' };
        }
        
        const config = await this.loadConfig(groupJid);
        config.action = action;
        await this.saveConfig(groupJid, config);
        return { success: true, config };
    }
    
    /**
     * Adiciona domínio à whitelist
     */
    static async addWhitelistDomain(groupJid, domain) {
        const config = await this.loadConfig(groupJid);
        if (!config.whitelistDomains.includes(domain)) {
            config.whitelistDomains.push(domain);
            await this.saveConfig(groupJid, config);
        }
        return config;
    }
    
    /**
     * Remove domínio da whitelist
     */
    static async removeWhitelistDomain(groupJid, domain) {
        const config = await this.loadConfig(groupJid);
        config.whitelistDomains = config.whitelistDomains.filter(d => d !== domain);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Adiciona usuário à whitelist
     */
    static async addWhitelistUser(groupJid, userNumber) {
        const config = await this.loadConfig(groupJid);
        if (!config.whitelistUsers.includes(userNumber)) {
            config.whitelistUsers.push(userNumber);
            await this.saveConfig(groupJid, config);
        }
        return config;
    }
    
    /**
     * Remove usuário da whitelist
     */
    static async removeWhitelistUser(groupJid, userNumber) {
        const config = await this.loadConfig(groupJid);
        config.whitelistUsers = config.whitelistUsers.filter(u => u !== userNumber);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Verifica se uma mensagem contém link bloqueado
     */
    static async checkMessage(messageText, groupJid, senderNumber) {
        const config = await this.loadConfig(groupJid);
        
        if (!config.enabled) {
            return { blocked: false, reason: 'disabled' };
        }
        
        // Verificar se usuário está na whitelist
        if (config.whitelistUsers.includes(senderNumber)) {
            return { blocked: false, reason: 'whitelist_user' };
        }
        
        if (!messageText) {
            return { blocked: false, reason: 'no_text' };
        }
        
        // Extrair links da mensagem
        const urls = this.extractUrls(messageText);
        
        if (urls.length === 0) {
            return { blocked: false, reason: 'no_links' };
        }
        
        // Verificar cada URL
        for (const url of urls) {
            const domain = this.extractDomain(url);
            
            // Verificar se está na whitelist
            if (config.whitelistDomains.includes(domain)) {
                continue; // Pula, não bloqueia
            }
            
            // Verificar se está na lista de bloqueio
            if (this.isBlockedDomain(domain, config.blockedDomains)) {
                return {
                    blocked: true,
                    reason: 'link_blocked',
                    domain: domain,
                    action: config.action,
                    url: url
                };
            }
        }
        
        return { blocked: false, reason: 'allowed' };
    }
    
    /**
     * Extrai URLs do texto
     */
    static extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
        const matches = text.match(urlRegex);
        return matches || [];
    }
    
    /**
     * Extrai domínio de uma URL
     */
    static extractDomain(url) {
        try {
            let cleanUrl = url;
            if (!cleanUrl.startsWith('http')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            const hostname = new URL(cleanUrl).hostname;
            return hostname.replace(/^www\./, '');
        } catch {
            // Se falhar, tenta extrair manualmente
            const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
            return match ? match[1] : url;
        }
    }
    
    /**
     * Verifica se domínio está bloqueado
     */
    static isBlockedDomain(domain, blockedDomains) {
    const lowerDomain = domain.toLowerCase();
    return blockedDomains.some(blocked => {
        const lowerBlocked = blocked.toLowerCase();
        return lowerDomain === lowerBlocked || lowerDomain.endsWith(`.${lowerBlocked}`);
    });
}
    
    /**
     * Gera mensagem de aviso
     */
    static getWarningMessage(action, domain) {
        const messages = {
            delete: `⚠️ *LINK BLOQUEADO*\n\nO domínio *${domain}* não é permitido neste grupo.\nSua mensagem foi deletada.`,
            warn: `⚠️ *ATENÇÃO*\n\nLinks para *${domain}* não são permitidos neste grupo.\n\n📌 Próxima vez será removido(a) do grupo.`,
            kick: `🚫 *LINK PROIBIDO*\n\nVocê compartilhou um link para *${domain}*.\nIsso viola as regras do grupo.`
        };
        
        return messages[action] || messages.delete;
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Remove usuário do grupo
     */
    static async kickUser(sock, groupJid, participant) {
        try {
            await sock.groupParticipantsUpdate(groupJid, [participant], 'remove');
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover:', error);
            return false;
        }
    }
    
    /**
     * Obtém status do anti-link para exibição
     */
    static async getStatus(groupJid) {
        const config = await this.loadConfig(groupJid);
        
        let statusText = `🔗 *ANTI-LINK*\n\n`;
        statusText += `📊 Status: ${config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}\n`;
        statusText += `⚡ Ação: ${config.action === 'delete' ? '🗑️ Deletar' : config.action === 'warn' ? '⚠️ Avisar' : '🔨 Remover'}\n\n`;
        
        if (config.enabled) {
            statusText += `🚫 *DOMÍNIOS BLOQUEADOS:*\n`;
            const blocked = config.blockedDomains.slice(0, 10);
            for (const domain of blocked) {
                statusText += `• ${domain}\n`;
            }
            if (config.blockedDomains.length > 10) {
                statusText += `• ... e mais ${config.blockedDomains.length - 10}\n`;
            }
            
            if (config.whitelistDomains.length > 0) {
                statusText += `\n✅ *DOMÍNIOS LIBERADOS:*\n`;
                for (const domain of config.whitelistDomains) {
                    statusText += `• ${domain}\n`;
                }
            }
            
            if (config.whitelistUsers.length > 0) {
                statusText += `\n👑 *USUÁRIOS LIBERADOS:* ${config.whitelistUsers.length}\n`;
            }
        }
        
        statusText += `\n📌 *COMANDOS:*\n`;
        statusText += `• !antilink on/off - Ativar/Desativar\n`;
        statusText += `• !antilink action delete/warn/kick - Definir ação\n`;
        statusText += `• !antilink whitelist add/remove [domínio] - Liberar domínio\n`;
        statusText += `• !antilink allow/deny [@usuário] - Liberar/Bloquear usuário\n`;
        statusText += `• !antilink status - Ver configuração\n`;
        
        return statusText;
    }
}

```


### 📄 `src/handlers/antiSpamHandler.js`

```
// src/handlers/antiSpamHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class AntiSpamHandler {
    
    static ANTI_SPAM_DIR = './antispam_config';
    
    static DEFAULT_CONFIG = {
        enabled: false,
        commandLimit: 4,
        timeWindow: 5000,
        blockTime: 5000
    };
    
    static userCommands = new Map();
    static userBlocked = new Map();
    
    static async init() {
        try {
            if (!existsSync(this.ANTI_SPAM_DIR)) {
                mkdirSync(this.ANTI_SPAM_DIR, { recursive: true });
                console.log('📁 Pasta do anti-spam criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    static async saveConfig(groupJid, config) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_SPAM_DIR, fileName);
            await writeFile(filePath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static async loadConfig(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_SPAM_DIR, fileName);
            
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return { ...this.DEFAULT_CONFIG, ...JSON.parse(data) };
            }
            return { ...this.DEFAULT_CONFIG };
        } catch (error) {
            return { ...this.DEFAULT_CONFIG };
        }
    }
    
    static async setEnabled(groupJid, enabled) {
        const config = await this.loadConfig(groupJid);
        config.enabled = enabled;
        await this.saveConfig(groupJid, config);
        if (!enabled) this.clearGroupData(groupJid);
        return config;
    }
    
    static async setCommandLimit(groupJid, limit) {
        const config = await this.loadConfig(groupJid);
        config.commandLimit = Math.min(limit, 20);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    static async setBlockTime(groupJid, seconds) {
        const config = await this.loadConfig(groupJid);
        config.blockTime = seconds * 1000;
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    static clearGroupData(groupJid) {
        const prefix = `${groupJid}_`;
        for (const key of this.userCommands.keys()) {
            if (key.startsWith(prefix)) this.userCommands.delete(key);
        }
        for (const key of this.userBlocked.keys()) {
            if (key.startsWith(prefix)) this.userBlocked.delete(key);
        }
    }
    
    static isBlocked(groupJid, userId) {
        const key = `${groupJid}_${userId}`;
        const until = this.userBlocked.get(key);
        if (until && until > Date.now()) return true;
        if (until && until <= Date.now()) this.userBlocked.delete(key);
        return false;
    }
    
    static blockUser(groupJid, userId, durationMs) {
        const key = `${groupJid}_${userId}`;
        this.userBlocked.set(key, Date.now() + durationMs);
    }
    
    static async checkCommand(groupJid, userId, config) {
        if (!config.enabled) {
            return { blocked: false };
        }
        
        if (this.isBlocked(groupJid, userId)) {
            return { 
                blocked: true, 
                message: `⏰ Aguarde alguns segundos antes de usar comandos novamente.`
            };
        }
        
        const now = Date.now();
        const key = `${groupJid}_${userId}`;
        let history = this.userCommands.get(key) || [];
        history = history.filter(t => (now - t) < config.timeWindow);
        
        if (history.length >= config.commandLimit) {
            this.blockUser(groupJid, userId, config.blockTime);
            const blockSeconds = Math.ceil(config.blockTime / 1000);
            this.userCommands.set(key, []);
            
            return {
                blocked: true,
                message: `⚠️ Você está usando comandos muito rápido!\nPor favor, aguarde ${blockSeconds} segundos.`
            };
        }
        
        history.push(now);
        this.userCommands.set(key, history);
        return { blocked: false };
    }
    
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            return admins.includes(participant);
        } catch (error) {
            return false;
        }
    }
    
    static async getStatus(groupJid) {
        const config = await this.loadConfig(groupJid);
        return `🛡️ *ANTI-SPAM*\n\n📊 Status: ${config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}\n📨 Limite: ${config.commandLimit} comandos em ${config.timeWindow / 1000}s\n⏰ Bloqueio: ${config.blockTime / 1000}s`;
    }
}

```


### 📄 `src/utils/mediaUtils.js`

```
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { Sticker } from 'wa-sticker-formatter';

export class MediaUtils {
    static async validateMedia(buffer) {
        try {
            const type = await fileTypeFromBuffer(buffer);
            if (!type) throw new Error('Tipo de arquivo não reconhecido');
            return type;
        } catch (error) {
            throw new Error('Erro ao validar mídia');
        }
    }

    static async resizeImage(buffer, maxSize = 512) {
        try {
            return await sharp(buffer)
                .resize(maxSize, maxSize, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    fastShrinkOnLoad: true
                })
                .jpeg({ 
                    quality: 70,
                    mozjpeg: true
                })
                .toBuffer();
        } catch (error) {
            console.log('⚠️ Usando imagem original');
            return buffer;
        }
    }

    static async createSticker(mediaBuffer, options = {}) {
        const {
            pack = 'StickerBot',
            author = 'Bot',
            categories = ['✨'],
            quality = 30,
            type = 'full'
        } = options;

        try {
            const sticker = new Sticker(mediaBuffer, {
                pack,
                author,
                categories,
                quality: Math.max(5, Math.min(quality, 50)), // Garante entre 5-50
                type,
                background: type === 'crop' ? '#000000' : 'transparent'
            });

            return await sticker.toBuffer();
        } catch (error) {
            console.error('❌ Erro ao criar sticker:', error);
            
            // Erros específicos do wa-sticker-formatter
            if (error.message.includes('ffmpeg') || error.message.includes('video')) {
                throw new Error('Codec de vídeo não suportado');
            } else if (error.message.includes('buffer')) {
                throw new Error('Arquivo de mídia corrompido');
            } else {
                throw new Error('Erro ao processar mídia para figurinha');
            }
        }
    }
}

```


### 📄 `src/utils/protectionUtils.js`

```
/**
 * Utilitários de Proteção - VERSÃO SIMPLES
 * Apenas para suport ao BAN de gringos na entrada
 * Sem AntiLink
 */

export class ProtectionUtils {
    
    /**
     * Extrai o número
     */
    static extractNumber(message, isGroup = false) {
        let jidToExtract;
        
        if (isGroup) {
            jidToExtract = message.key.participant;
        } else {
            jidToExtract = message.key.remoteJid;
        }

        if (!jidToExtract) {
            return null;
        }

        let number = jidToExtract.replace(/\D/g, '');

        console.log(`📱 Número: ${number}`);

        if (number.length >= 10) {
            return number;
        }

        return null;
    }

    /**
     * Verifica se é grupo
     */
    static isGroup(remoteJid) {
        return remoteJid.includes('@g.us');
    }

    /**
     * Verifica se é gringo
     */
    static isForeignNumber(number, allowedCountryCode = '55') {
        if (!number || number.length < 10) {
            return false;
        }

        const isForeign = !number.startsWith(allowedCountryCode);
        console.log(`🌍 Começa com ${allowedCountryCode}? ${!isForeign}`);
        
        return isForeign;
    }

    /**
     * Verifica exceção
     */
    static isException(number, exceptions = []) {
        if (!exceptions || exceptions.length === 0 || !number) {
            return false;
        }
        
        for (const exc of exceptions) {
            let cleanExc = exc.toString().trim().replace(/\D/g, '');
            
            if (number === cleanExc) {
                console.log(`✅ Em exceção`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Verifica owner
     */
    static isOwner(number, ownerNumber) {
        if (!number) return false;

        let cleanOwner = ownerNumber.toString().trim().replace(/\D/g, '');
        const isOwner = number === cleanOwner;
        
        return isOwner;
    }

    /**
     * Mensagem
     */
    static getBlockMessage(reason) {
        return '⛔ BLOQUEADO';
    }

    /**
     * Log
     */
    static logBlock(type, senderNumber, reason) {
        console.log(`\n🚫 ${type} | ${senderNumber}`);
    }
}

```
