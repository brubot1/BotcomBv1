// plugins/inviteRank.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const INVITES_DIR = './invites_data';
const POINTS_ADD = 10;

const LEVELS = [
    { name: 'Bronze', min: 0, icon: '🟤' },
    { name: 'Prata', min: 50, icon: '⚪' },
    { name: 'Ouro', min: 150, icon: '🟡' },
    { name: 'Platina', min: 300, icon: '💎' },
    { name: 'Diamante', min: 500, icon: '🔥' }
];

async function ensureDir() {
    if (!existsSync(INVITES_DIR)) {
        mkdirSync(INVITES_DIR, { recursive: true });
    }
}

async function loadGroupData(groupJid) {
    await ensureDir();
    const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = join(INVITES_DIR, fileName);
    
    if (existsSync(filePath)) {
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return { users: {} };
}

async function saveGroupData(groupJid, data) {
    await ensureDir();
    const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = join(INVITES_DIR, fileName);
    await writeFile(filePath, JSON.stringify(data, null, 2));
}

function getUserLevel(points) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].min) return LEVELS[i];
    }
    return LEVELS[0];
}

function getMentionTag(userId) {
    // Se for null ou undefined, retorna "Alguém"
    if (!userId) return 'Alguém';
    
    // Se for string, tentar extrair número
    if (typeof userId === 'string') {
        const number = userId.split('@')[0];
        if (number && number.length > 0) {
            return `@${number}`;
        }
    }
    
    return 'Alguém';
}

// Processar entrada de novo membro
export async function handleNewMember(sock, groupJid, newMemberId, inviterId) {
    try {
        if (!inviterId) {
            console.log('⚠️ Entrada por link - sem pontos');
            return;
        }
        const data = await loadGroupData(groupJid);
        
        if (!data.users[inviterId]) {
            data.users[inviterId] = { points: 0, invites: [], totalInvites: 0 };
        }
        
        if (!data.users[inviterId].invites.includes(newMemberId)) {
            data.users[inviterId].points += POINTS_ADD;
            data.users[inviterId].invites.push(newMemberId);
            data.users[inviterId].totalInvites++;
            
            await saveGroupData(groupJid, data);
            
            const level = getUserLevel(data.users[inviterId].points);
            
            await sock.sendMessage(groupJid, {
                text: `🎉 ${getMentionTag(inviterId)} convidou um novo membro! (+${POINTS_ADD} pontos)\n\n📊 Agora tem *${data.users[inviterId].points}* pontos\n🏆 Nível: ${level.icon} *${level.name}*`,
                mentions: [inviterId]
            });
        }
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// !addpoints
export async function addPoints(sock, message, groupJid, senderId, text) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin === 'admin' || 
                       metadata.participants.find(p => p.id === senderId)?.admin === 'superadmin';
        
        if (!isAdmin) {
            await sock.sendMessage(groupJid, { text: '❌ Apenas administradores!' }, { quoted: message });
            return;
        }
        
        let targetUserId = null;
        let points = null;
        
        // 1️⃣ Verificar menção
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned && mentioned.length > 0) {
            targetUserId = mentioned[0];
            const args = text.split(' ');
            points = parseInt(args[args.length - 1]);
        }
        
        // 2️⃣ Verificar se é reply
        if (!targetUserId) {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMsg) {
                targetUserId = message.key.participant || message.key.remoteJid;
                const args = text.split(' ');
                points = parseInt(args[1]);
            }
        }
        
        // 3️⃣ Verificar número manual
        if (!targetUserId) {
            const args = text.split(' ');
            const possibleNumber = args[1]?.replace(/\D/g, '');
            if (possibleNumber && possibleNumber.length >= 10) {
                targetUserId = `${possibleNumber}@s.whatsapp.net`;
                points = parseInt(args[2]);
            }
        }
        
        if (!targetUserId || !points || isNaN(points)) {
            await sock.sendMessage(groupJid, {
                text: '❌ Use:\n!addpoints @usuario 50\nou\n!addpoints 5535999999999 50\nou\n(responda a mensagem) !addpoints 50'
            }, { quoted: message });
            return;
        }
        
        const data = await loadGroupData(groupJid);
        
        if (!data.users[targetUserId]) {
            data.users[targetUserId] = { points: 0, invites: [], totalInvites: 0 };
        }
        
        data.users[targetUserId].points += points;
        await saveGroupData(groupJid, data);
        
        await sock.sendMessage(groupJid, {
            text: `✅ Adicionado *${points}* pontos para ${getMentionTag(targetUserId)}!\n\n📊 Agora tem *${data.users[targetUserId].points}* pontos.`,
            mentions: [targetUserId]
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, { text: '❌ Erro ao adicionar pontos' }, { quoted: message });
    }
}

// !rank
export async function showRank(sock, message, groupJid, senderId) {
    try {
        const data = await loadGroupData(groupJid);
        
        if (!data.users[senderId]) {
            await sock.sendMessage(groupJid, {
                text: '📊 Você ainda não tem pontos!\n\nConvide amigos para ganhar pontos! 🎉'
            }, { quoted: message });
            return;
        }
        
        const user = data.users[senderId];
        const level = getUserLevel(user.points);
        
        const sorted = Object.entries(data.users).sort((a, b) => b[1].points - a[1].points);
        const position = sorted.findIndex(([id]) => id === senderId) + 1;
        
        let nextLevel = null;
        for (let i = 0; i < LEVELS.length - 1; i++) {
            if (user.points < LEVELS[i + 1].min) {
                nextLevel = LEVELS[i + 1];
                break;
            }
        }
        
        let rankText = `🏆 *SEU RANKING*\n\n`;
        rankText += `📊 *Pontos:* ${user.points}\n`;
        rankText += `🎖️ *Nível:* ${level.icon} ${level.name}\n`;
        rankText += `👥 *Convidados:* ${user.totalInvites}\n`;
        rankText += `📈 *Posição:* ${position}º lugar\n`;
        
        if (nextLevel) {
            const needed = nextLevel.min - user.points;
            rankText += `\n📌 *Próximo nível:* ${nextLevel.icon} ${nextLevel.name}\n✨ *Faltam:* ${needed} pontos\n`;
        }
        
        await sock.sendMessage(groupJid, { text: rankText }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, { text: '❌ Erro ao buscar ranking' }, { quoted: message });
    }
}

// !top
// !top - Versão com layout bonito
export async function showTopInvites(sock, message, groupJid) {
    try {
        const data = await loadGroupData(groupJid);
        
        const sorted = Object.entries(data.users)
            .sort((a, b) => b[1].points - a[1].points)
            .slice(0, 10);
        
        if (sorted.length === 0) {
            await sock.sendMessage(groupJid, {
                text: '📊 Nenhum ponto registrado ainda!\n\nConvide amigos para aparecer no ranking! 🎉'
            }, { quoted: message });
            return;
        }
        
        let topText = `╭━━━━━🏆 *LEADERBOARD* 🏆━━━━━╮\n\n`;
        const medals = ['🥇', '🥈', '🥉'];
        const mentions = [];
        
        for (let i = 0; i < sorted.length; i++) {
            const [userId, userData] = sorted[i];
            const medal = i < 3 ? medals[i] : `${i + 1}️⃣`;
            const level = getUserLevel(userData.points);
            const userNumber = userId.split('@')[0];
            
            topText += `${medal} *@${userNumber}*\n`;
            topText += `   🎯 Pontos: ${userData.points}\n`;
            topText += `   👥 Convites: ${userData.totalInvites}\n`;
            topText += `   🏅 Nível: ${level.icon} ${level.name}\n\n`;
            mentions.push(userId);
        }
        
        topText += `╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        topText += `📌 Use *!rank* para ver sua pontuação`;
        
        await sock.sendMessage(groupJid, { text: topText, mentions: mentions }, { quoted: message });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, { text: '❌ Erro ao buscar top' }, { quoted: message });
    }
}

// !resetconvites
export async function resetUserInvites(sock, message, groupJid, senderId, mentionedUser) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin === 'admin' || 
                       metadata.participants.find(p => p.id === senderId)?.admin === 'superadmin';
        
        if (!isAdmin) {
            await sock.sendMessage(groupJid, { text: '❌ Apenas administradores!' }, { quoted: message });
            return;
        }
        
        let targetUser = mentionedUser;
        
        if (!targetUser) {
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) {
                targetUser = mentioned[0];
            }
        }
        
        if (!targetUser) {
            await sock.sendMessage(groupJid, { text: '❌ Marque o usuário: !resetconvites @usuario' }, { quoted: message });
            return;
        }
        
        const data = await loadGroupData(groupJid);
        
        if (data.users[targetUser]) {
            delete data.users[targetUser];
            await saveGroupData(groupJid, data);
            await sock.sendMessage(groupJid, {
                text: `✅ Pontos de ${getMentionTag(targetUser)} foram resetados!`,
                mentions: [targetUser]
            }, { quoted: message });
        } else {
            await sock.sendMessage(groupJid, { text: '❌ Usuário não tem pontos!' }, { quoted: message });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await sock.sendMessage(groupJid, { text: '❌ Erro ao resetar' }, { quoted: message });
    }
}

export { loadGroupData, saveGroupData };