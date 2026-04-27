// plugins/menuDono.js
import { CommandLimitsHandler } from '../src/handlers/commandLimitsHandler.js';

export async function menuDono(sock, message, groupJid, senderId, text, isAdmin) {
    try {
        if (!isAdmin) {
            await sock.sendMessage(groupJid, {
                text: '❌ *Apenas administradores* podem usar este comando!'
            }, { quoted: message });
            return;
        }
        
        const config = await CommandLimitsHandler.loadConfig(groupJid);
        const args = text.split(' ');
        const subCommand = args[1];
        
        // !menudono
        if (!subCommand) {
            const status = config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO';
            const menu = `
╭━━━━━🔧 *MENU DO DONO* 🔧━━━━━╮

📊 *Status:* ${status}
💰 *Preço por comando extra:* ${config.pricePerExtra} pontos

📌 *COMANDOS:*

• !menudono on - Ativar sistema
• !menudono off - Desativar sistema
• !menudono price [valor] - Mudar preço
• !menudono limit [comando] [limite] - Mudar limite
• !menudono limits - Ver todos os limites
• !menudono user @user - Ver uso do usuário
• !menudono reset @user - Resetar uso do usuário

╰━━━━━━━━━━━━━━━━━━━━╯

🎯 *LIMITES ATUAIS:*
${Object.entries(config.limits).slice(0, 5).map(([cmd, limit]) => `• ${cmd}: ${limit === 999 ? '∞' : limit}`).join('\n')}
            `;
            await sock.sendMessage(groupJid, { text: menu }, { quoted: message });
            return;
        }
        
        // !menudono on
        if (subCommand === 'on') {
            config.enabled = true;
            await CommandLimitsHandler.saveConfig(groupJid, config);
            await sock.sendMessage(groupJid, { text: '✅ *Sistema de limites ATIVADO!*\n\nUsuários terão limites grátis diários.' }, { quoted: message });
            return;
        }
        
        // !menudono off
        if (subCommand === 'off') {
            config.enabled = false;
            await CommandLimitsHandler.saveConfig(groupJid, config);
            await sock.sendMessage(groupJid, { text: '❌ *Sistema de limites DESATIVADO!*\n\nComandos voltaram a ser ilimitados.' }, { quoted: message });
            return;
        }
        
        // !menudono price [valor]
        if (subCommand === 'price') {
            const price = parseInt(args[2]);
            if (!price || price < 1) {
                await sock.sendMessage(groupJid, { text: '❌ Use: !menudono price [valor]\n📌 Exemplo: !menudono price 10' }, { quoted: message });
                return;
            }
            config.pricePerExtra = price;
            await CommandLimitsHandler.saveConfig(groupJid, config);
            await sock.sendMessage(groupJid, { text: `✅ Preço alterado para *${price}* pontos por comando extra!` }, { quoted: message });
            return;
        }
        
        // !menudono limit [comando] [limite]
        if (subCommand === 'limit') {
            const cmdName = args[2];
            const limit = parseInt(args[3]);
            
            if (!cmdName || !limit) {
                await sock.sendMessage(groupJid, { text: '❌ Use: !menudono limit [comando] [limite]\n📌 Exemplo: !menudono limit !fig 20' }, { quoted: message });
                return;
            }
            
            config.limits[cmdName] = limit;
            await CommandLimitsHandler.saveConfig(groupJid, config);
            await sock.sendMessage(groupJid, { text: `✅ Limite de *${cmdName}* alterado para *${limit === 999 ? '∞' : limit}* usos/dia!` }, { quoted: message });
            return;
        }
        
        // !menudono limits
        if (subCommand === 'limits') {
            let limitText = `📋 *LIMITES CONFIGURADOS*\n\n`;
            for (const [cmd, limit] of Object.entries(config.limits)) {
                limitText += `• ${cmd}: ${limit === 999 ? '∞' : limit}\n`;
            }
            await sock.sendMessage(groupJid, { text: limitText }, { quoted: message });
            return;
        }
        
        // !menudono user @user
        if (subCommand === 'user') {
            const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!mentionedUser) {
                await sock.sendMessage(groupJid, { text: '❌ Marque o usuário: !menudono user @usuario' }, { quoted: message });
                return;
            }
            
            const userNumber = mentionedUser.split('@')[0];
            let userStatus = `👤 *@${userNumber}*\n\n`;
            
            for (const [cmd, limit] of Object.entries(config.limits)) {
                const usage = await CommandLimitsHandler.getUsage(groupJid, mentionedUser, cmd);
                const used = usage.commands[cmd] || 0;
                userStatus += `• ${cmd}: ${used}/${limit === 999 ? '∞' : limit}\n`;
            }
            
            await sock.sendMessage(groupJid, { text: userStatus, mentions: [mentionedUser] }, { quoted: message });
            return;
        }
        
        // !menudono reset @user
        if (subCommand === 'reset') {
            const mentionedUser = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!mentionedUser) {
                await sock.sendMessage(groupJid, { text: '❌ Marque o usuário: !menudono reset @usuario' }, { quoted: message });
                return;
            }
            
            const usagePath = await CommandLimitsHandler.getUsagePath(groupJid, mentionedUser);
            if (existsSync(usagePath)) {
                const { unlink } = await import('fs/promises');
                await unlink(usagePath);
            }
            
            await sock.sendMessage(groupJid, { text: `✅ Uso do usuário resetado!`, mentions: [mentionedUser] }, { quoted: message });
            return;
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, { text: '❌ Erro ao executar comando' }, { quoted: message });
    }
}