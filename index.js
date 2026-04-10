const {
    Client, GatewayIntentBits, Partials, PermissionsBitField, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder,
    TextInputStyle, REST, Routes, SlashCommandBuilder, ActivityType, MessageFlags,
    AuditLogEvent, RoleSelectMenuBuilder
} = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require("express");
const { Sequelize, DataTypes } = require('sequelize');

const E = {
    yildiz: '<:yildiz:1491436289487278281>',
    duzenle: '<:duzenle:1491436286979080202>',
    arama: '<:arama:1491436285120745552>',
    konfeti: '<:konfeti:1491436283212468305>',
    duyuru2: '<:duyuru2:1491436279454236742>',
    copkutusu: '<:copkutusu:1491436277478719488>',
    tekrar: '<:tekrar:1491436275432161320>',
    susturma: '<:susturma:1491436812730634281>',
    bakim: '<:bakim:1491436513458655272>',
    thumbsup: '<:thumbsup:1491436511953027293>',
    thumbsdown: '<:thumbsdown:1491436510455660544>',
    forum: '<:forum:1491436508895252641>',
    kayit: '<:kayit:1491436507058274325>',
    kesif: '<:kesif:1491436505678352576>',
    etkinlik: '<:etkinlik:1491436503493251212>',
    bilet: '<:bilet:1491436329874100414>',
    uye: '<:uye:1491436328238190785>',
    ban: '<:ban:1491436326875303946>',
    susturmaacma: '<:susturmaacma:1491436325310562335>',
    duyuru: '<:duyuru:1491436324002070571>',
    ev: '<:ev:1491436321418379414>',
    oyun: '<:oyun:1491436319539200100>',
    zamanasimi: '<:zamanasimi:1491436318230839316>',
    surpiz: '<:surpiz:1491436316674752522>',
    onay: '<:onay:1491436314774470656>',
    red: '<:red:1491436313055068220>',
    engel: '<:engel:1491436311427416075>',
    uye2: '<:uye2:1491436309569343528>',
    yardim: '<:yardim:1491436307371528242>',
    kanalac: '<:kanalac:1491436296445497525>',
    kanalkapa: '<:kanalkapa:1491436292297330698>',
    admin: '<:admin:1491439896882057226>'
};

const E_ID = {
    yildiz: '1491436289487278281',
    duzenle: '1491436286979080202',
    arama: '1491436285120745552',
    konfeti: '1491436283212468305',
    duyuru2: '1491436279454236742',
    copkutusu: '1491436277478719488',
    tekrar: '1491436275432161320',
    susturma: '1491436812730634281',
    bakim: '1491436513458655272',
    thumbsup: '1491436511953027293',
    thumbsdown: '1491436510455660544',
    forum: '1491436508895252641',
    kayit: '1491436507058274325',
    kesif: '1491436505678352576',
    etkinlik: '1491436503493251212',
    bilet: '1491436329874100414',
    uye: '1491436328238190785',
    ban: '1491436326875303946',
    susturmaacma: '1491436325310562335',
    duyuru: '1491436324002070571',
    ev: '1491436321418379414',
    oyun: '1491436319539200100',
    zamanasimi: '1491436318230839316',
    surpiz: '1491436316674752522',
    onay: '1491436314774470656',
    red: '1491436313055068220',
    engel: '1491436311427416075',
    uye2: '1491436309569343528',
    yardim: '1491436307371528242',
    kanalac: '1491436296445497525',
    kanalkapa: '1491436292297330698',
    admin: '1491439896882057226'
};

const app = express();

app.get("/", (req, res) => {
    res.send("Bot aktif " + E.kesif);
});

app.listen(process.env.PORT || 3000, () => {});

process.on('unhandledRejection', error => {
    console.error("Hata:", error);
});

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const GuildSettings = sequelize.define('GuildSettings', {
    guildId: { type: DataTypes.STRING, primaryKey: true },
    linkProtection: { type: DataTypes.BOOLEAN, defaultValue: false },
    autoRole: { type: DataTypes.STRING, allowNull: true },
    logChannel: { type: DataTypes.STRING, allowNull: true },
    welcomeChannel: { type: DataTypes.STRING, allowNull: true },
    botVoiceChannel: { type: DataTypes.STRING, allowNull: true },
    ticketStaffRole: { type: DataTypes.STRING, allowNull: true }
});

const CustomRole = sequelize.define('CustomRole', {
    userId: { type: DataTypes.STRING, primaryKey: true },
    roleId: { type: DataTypes.STRING, allowNull: false }
});

const Giveaway = sequelize.define('Giveaway', {
    messageId: { type: DataTypes.STRING, primaryKey: true },
    channelId: DataTypes.STRING,
    title: DataTypes.STRING,
    desc: DataTypes.TEXT,
    winnersCount: DataTypes.INTEGER,
    endsAt: DataTypes.BIGINT,
    host: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    participants: {
        type: DataTypes.TEXT,
        get() {
            const rawValue = this.getDataValue('participants');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('participants', JSON.stringify(value));
        }
    }
});

const CustomMessage = sequelize.define('CustomMessage', {
    userId: { type: DataTypes.STRING, primaryKey: true },
    replyText: { type: DataTypes.TEXT, allowNull: false }
});

const AutoMessage = sequelize.define('AutoMessage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    channelId: { type: DataTypes.STRING, allowNull: false },
    messageText: { type: DataTypes.TEXT, allowNull: false },
    intervalHours: { type: DataTypes.FLOAT, allowNull: false },
    lastSentAt: { type: DataTypes.BIGINT, defaultValue: 0 }
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Channel]
});

client.on('error', error => {
    console.error("Discord Bağlantı Hatası:", error);
});

const TARGET_ROLE_ID = '1473029465587323076';

const linkProtection = new Set();
const deleteTimers = new Map();
const formCache = new Map();
const pendingApplications = new Set();
const autoRoles = new Map();
const logChannels = new Map();
const welcomeChannels = new Map();
const botVoiceChannels = new Map();
const ticketStaffRoles = new Map();
const customRoleSetup = new Map();
const userCustomRoles = new Map();
const activeGiveaways = new Map();
const customUserMessages = new Map();
const guildInvites = new Map();
const userInvites = new Map();
const tempVoiceChannels = new Set();

function createEmbed(title, description, color = 0x5865F2) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Azuron Türkiye', iconURL: client.user.displayAvatarURL() });
        
    if (description) {
        embed.setDescription(description);
    }
    
    return embed;
}

function createErrorEmbed(description) {
    return new EmbedBuilder()
        .setTitle(`${E.red} İşlem Başarısız`)
        .setDescription(description)
        .setColor(0xE74C3C)
        .setTimestamp()
        .setFooter({ text: 'Hata', iconURL: client.user.displayAvatarURL() });
}

async function sendLog(guild, title, description, color = 0xE67E22) {
    const logChannelId = logChannels.get(guild.id);
    if (!logChannelId) return;
    const channel = guild.channels.cache.get(logChannelId);
    if (channel) {
        await channel.send({ embeds: [createEmbed(title, description, color)] }).catch(() => {});
    }
}

async function finalizeCustomRoleSetup(guild, member, setupData, iconUrl, replyMethod) {
    try {
        const targetRole = guild.roles.cache.get(TARGET_ROLE_ID);
        const options = {
            name: setupData.name,
            color: setupData.color,
            reason: `${member.user.tag} için özel takviyeci rolü oluşturuldu.`,
            permissions: []
        };

        if (iconUrl && guild.features.includes('ROLE_ICONS')) {
            options.icon = iconUrl;
        }

        const newRole = await guild.roles.create(options);
        
        if (targetRole) {
            await newRole.setPosition(targetRole.position + 1).catch(() => {});
        }

        await member.roles.add(newRole);
        userCustomRoles.set(member.id, newRole.id);
        
        const [roleRecord, created] = await CustomRole.findOrCreate({
            where: { userId: member.id },
            defaults: { roleId: newRole.id }
        });

        if (!created) {
            roleRecord.roleId = newRole.id;
            await roleRecord.save();
        }

        customRoleSetup.delete(member.id);

        const successEmbed = createEmbed(`${E.yildiz} Özel Rol Oluşturuldu`, `**${setupData.name}** isimli özel rolünüz başarıyla oluşturuldu ve size verildi!`, 0x2ECC71);

        await replyMethod(successEmbed);
        await sendLog(guild, `${E.yildiz} Özel Rol Oluşturuldu`, `**Oluşturan:** ${member.user.tag}\n**Rol Adı:** ${setupData.name}\n**Renk:** ${setupData.color}`, 0x2ECC71);
    } catch (error) {
        customRoleSetup.delete(member.id);
        await replyMethod(createErrorEmbed('Rol oluşturulurken bir hata meydana geldi. Sunucunun rol ikonlarını desteklediğinden ve yetkilerimin tam olduğundan emin olun.'));
    }
}

function getParticipantsPageData(gwData, page) {
    const participants = Array.from(gwData.participants);
    const total = participants.length;
    const perPage = 10;
    const maxPage = Math.ceil(total / perPage) || 1;
    page = Math.max(1, Math.min(page, maxPage));

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const currentSlice = participants.slice(start, end);

    let desc = `Bu liste **${gwData.title}** adlı çekilişe katılan üyeleri göstermektedir:\n\n`;
    if (total === 0) {
        desc += "Henüz katılımcı bulunmamaktadır.";
    } else {
        currentSlice.forEach((id, index) => {
            desc += `${start + index + 1}. <@${id}>\n`;
        });
    }
    desc += `\n**Toplam Katılımcı:** ${total}`;

    const embed = new EmbedBuilder()
        .setTitle(`Çekiliş Katılımcıları (Sayfa ${page}/${maxPage})`)
        .setDescription(desc)
        .setColor(0x2B2D31);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gwp_prev_${gwData.messageId}_${page}`).setEmoji(E_ID.tekrar).setStyle(ButtonStyle.Secondary).setDisabled(page === 1),
        new ButtonBuilder().setCustomId(`gwp_next_${gwData.messageId}_${page}`).setEmoji(E_ID.tekrar).setStyle(ButtonStyle.Secondary).setDisabled(page === maxPage)
    );

    return { embeds: [embed], components: [row] };
}

async function endGiveaway(messageId) {
    const gwData = activeGiveaways.get(messageId);
    if (!gwData) return;

    const channel = client.channels.cache.get(gwData.channelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return;

    const participantsArray = Array.from(gwData.participants);
    let winnersText = '';

    if (participantsArray.length === 0) {
        winnersText = 'Yeterli katılım olmadığı için çekiliş iptal edildi.';
    } else {
        const winners = [];
        const drawCount = Math.min(gwData.winnersCount, participantsArray.length);
        for (let i = 0; i < drawCount; i++) {
            const randomIndex = Math.floor(Math.random() * participantsArray.length);
            winners.push(`<@${participantsArray.splice(randomIndex, 1)[0]}>`);
        }
        winnersText = `**Kazananlar:** ${winners.join(', ')}`;
    }

    const endEmbed = new EmbedBuilder()
        .setTitle(`${E.konfeti} ${gwData.title} (Sona Erdi)`)
        .setDescription(`**Açıklama:** ${gwData.desc}\n\n${winnersText}\n**Başlatan:** <@${gwData.host}>`)
        .setColor(0x2B2D31);

    const disabledJoinButton = new ButtonBuilder()
        .setCustomId('btn_gw_join')
        .setLabel(`${gwData.participants.size}`)
        .setEmoji(E_ID.konfeti)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const disabledPartButton = new ButtonBuilder()
        .setCustomId('btn_gw_participants')
        .setLabel('Katılımcılar')
        .setEmoji(E_ID.uye)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    await msg.edit({ embeds: [endEmbed], components: [new ActionRowBuilder().addComponents(disabledJoinButton, disabledPartButton)] });

    if (gwData.participants.size > 0) {
        await msg.channel.send(`Tebrikler ${winnersText}! **${gwData.title}** çekilişini kazandınız!`);
    }

    activeGiveaways.delete(messageId);
    await Giveaway.update({ status: 'ended' }, { where: { messageId: messageId } }).catch(() => {});
}

client.on('clientReady', async () => {
    client.user.setActivity({
        name: 'Azuron Türkiye',
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/discord'
    });

    if (process.env.DATABASE_URL) {
        try {
            await sequelize.sync({ alter: true });
            
            const settings = await GuildSettings.findAll();
            settings.forEach(s => {
                if (s.linkProtection) linkProtection.add(s.guildId);
                if (s.autoRole) autoRoles.set(s.guildId, s.autoRole);
                if (s.logChannel) logChannels.set(s.guildId, s.logChannel);
                if (s.welcomeChannel) welcomeChannels.set(s.guildId, s.welcomeChannel);
                if (s.botVoiceChannel) botVoiceChannels.set(s.guildId, s.botVoiceChannel);
                if (s.ticketStaffRole) ticketStaffRoles.set(s.guildId, s.ticketStaffRole);
            });

            const roles = await CustomRole.findAll();
            roles.forEach(r => userCustomRoles.set(r.userId, r.roleId));

            const customMsgs = await CustomMessage.findAll();
            customMsgs.forEach(m => customUserMessages.set(m.userId, m.replyText));

            const giveaways = await Giveaway.findAll({ where: { status: 'active' } });
            const now = Date.now();
            giveaways.forEach(g => {
                activeGiveaways.set(g.messageId, {
                    messageId: g.messageId,
                    channelId: g.channelId,
                    participants: new Set(g.participants || []),
                    winnersCount: g.winnersCount,
                    title: g.title,
                    desc: g.desc,
                    host: g.host
                });

                const remaining = g.endsAt - now;
                if (remaining <= 0) {
                    endGiveaway(g.messageId);
                } else {
                    setTimeout(() => endGiveaway(g.messageId), remaining);
                }
            });
        } catch (error) {}
    }

    client.guilds.cache.forEach(async guild => {
        try {
            const firstInvites = await guild.invites.fetch();
            guildInvites.set(guild.id, new Map(firstInvites.map(invite => [invite.code, invite.uses])));
        } catch (error) {}
    });

    botVoiceChannels.forEach((channelId, guildId) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            const voiceChannel = guild.channels.cache.get(channelId);
            if (voiceChannel) {
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: true
                });
            }
        }
    });

    setInterval(() => {
        botVoiceChannels.forEach((channelId, guildId) => {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                const voiceChannel = guild.channels.cache.get(channelId);
                if (voiceChannel) {
                    const connection = getVoiceConnection(guildId);
                    if (!connection) {
                        joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: guildId,
                            adapterCreator: guild.voiceAdapterCreator,
                            selfDeaf: true
                        });
                    }
                }
            }
        });
    }, 60000);

    setInterval(async () => {
        try {
            const autoMessages = await AutoMessage.findAll();
            const now = Date.now();
            for (const autoMsg of autoMessages) {
                const intervalMs = autoMsg.intervalHours * 3600000;
                if (now - autoMsg.lastSentAt >= intervalMs) {
                    const channel = client.channels.cache.get(autoMsg.channelId);
                    if (!channel) continue;
                    const lastMessages = await channel.messages.fetch({ limit: 1 }).catch(() => null);
                    const lastMessage = lastMessages?.first();
                    if (lastMessage && lastMessage.author.id === client.user.id) continue;
                    await channel.send({ content: autoMsg.messageText }).catch(() => {});
                    autoMsg.lastSentAt = now;
                    await autoMsg.save();
                }
            }
        } catch (error) {}
    }, 60000);

    const commands = [
        new SlashCommandBuilder()
            .setName('log')
            .setDescription('Log kanalı ayarları')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
            .addSubcommand(s => s
                .setName('kanal-ayarla')
                .setDescription('Sunucu loglarının gönderileceği kanalı belirler.')
                .addChannelOption(o => o.setName('kanal').setDescription('Kanal seçin').setRequired(true))
            )
            .addSubcommand(s => s
                .setName('kaldır')
                .setDescription('Sunucu log sistemini kapatır.')
            ),
        new SlashCommandBuilder()
            .setName('ses')
            .setDescription('Ses kanalı ayarları')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
            .addSubcommand(s => s
                .setName('bağla')
                .setDescription('Botu belirtilen ses kanalına bağlar.')
                .addChannelOption(o => o.setName('kanal').setDescription('Kanal seçin').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
            ),
        new SlashCommandBuilder()
            .setName('karşılama')
            .setDescription('Sunucu karşılama mesajı ayarları')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
            .addSubcommand(s => s
                .setName('kanal-ayarla')
                .setDescription('Yeni üyelerin karşılanacağı kanalı belirler.')
                .addChannelOption(o => o.setName('kanal').setDescription('Kanal seçin').setRequired(true))
            )
            .addSubcommand(s => s
                .setName('kaldır')
                .setDescription('Karşılama mesajı sistemini kapatır.')
            ),
        new SlashCommandBuilder()
            .setName('çekiliş')
            .setDescription('Sunucuda yeni bir çekiliş başlatır.')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('yeniden-çek')
            .setDescription('Sona ermiş bir çekiliş için yeni kazanan belirler.')
            .addStringOption(o => o.setName('mesaj_id').setDescription('Çekiliş mesajının ID\'si').setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('özel')
            .setDescription('Sunucu takviyecilerine özel komutlar.')
            .addSubcommand(s => s
                .setName('rol-ayarla')
                .setDescription('Sadece sunucuya takviye yapanlar için özel rol oluşturur.')
            )
            .addSubcommand(s => s
                .setName('rol-sil')
                .setDescription('Oluşturduğunuz özel rolü siler.')
            )
            .addSubcommand(s => s
                .setName('mesaj-ayarla')
                .setDescription('Belirtilen kullanıcı bota etiket attığında verilecek özel yanıtı ayarlar.')
                .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
                .addStringOption(o => o.setName('mesaj').setDescription('Verilecek mesaj/link').setRequired(true))
            )
            .addSubcommand(s => s
                .setName('mesaj-sil')
                .setDescription('Kullanıcının özel mesajını sistemden siler.')
                .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
            ),
        new SlashCommandBuilder()
            .setName('rol')
            .setDescription('Sunucu rol ayarlarını yönetir.')
            .addSubcommand(s => s
                .setName('ayarla')
                .setDescription('Sunucuya katılanlara verilecek otomatik rolü ayarlar.')
                .addRoleOption(o => o
                    .setName('rol')
                    .setDescription('Verilecek rol')
                    .setRequired(true)
                )
            )
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
        new SlashCommandBuilder()
            .setName('mod-form')
            .setDescription('Moderatör başvuru formunu kanala gönderir.')
            .addIntegerOption(o => o.setName('sure').setDescription('Formun açık kalacağı süre (Saat)').setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('ses-panel')
            .setDescription('Ses yönetim panelini aktif eder (Yönetici)')
            .setDMPermission(false)
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('sil')
            .setDescription('Belirtilen miktarda mesajı kanaldan temizler')
            .addIntegerOption(o => o.setName('miktar').setDescription('Silinecek mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
        new SlashCommandBuilder()
            .setName('yardım')
            .setDescription('Botun komut listesini gösterir.'),
        new SlashCommandBuilder()
            .setName('link-engel')
            .setDescription('Sunucu içi link paylaşım korumasını yönetir.')
            .addSubcommand(s => s.setName('aç').setDescription('Link engelini aktif eder.'))
            .addSubcommand(s => s.setName('kapa').setDescription('Link engelini devre dışı bırakır.'))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('öneri')
            .setDescription('Yönetim ekibine bir öneri gönderin.'),
        new SlashCommandBuilder()
            .setName('bilet')
            .setDescription('Bilet sistemini yönetir.')
            .addSubcommand(s => s.setName('oluştur').setDescription('Bilet sistemini sunucuya kurar.'))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kullanıcıyı sunucudan uzaklaştırır')
            .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
            .addStringOption(o => o.setName('sebep').setDescription('Gerekçe'))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Kullanıcıyı yasaklar')
            .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
            .addStringOption(o => o.setName('sebep').setDescription('Gerekçe'))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Kullanıcıya süreli kısıtlama uygular')
            .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
            .addIntegerOption(o => o.setName('sure').setDescription('Dakika').setRequired(true))
            .addStringOption(o => o.setName('sebep').setDescription('Gerekçe'))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
        new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Kullanıcının kısıtlamasını kaldırır')
            .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
        new SlashCommandBuilder()
            .setName('sunucu-bilgi')
            .setDescription('Sunucu hakkındaki detaylı bilgileri gösterir.'),
        new SlashCommandBuilder()
            .setName('kullanıcı-bilgi')
            .setDescription('Belirtilen kullanıcı hakkında bilgi verir.')
            .addUserOption(o => o.setName('kullanici').setDescription('Bilgisi alınacak kullanıcı').setRequired(false)),
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Botun gecikme süresini gösterir.'),
        new SlashCommandBuilder()
            .setName('medya')
            .setDescription('TikTok videosunu oynatır.')
            .addStringOption(o => o.setName('link').setDescription('Video linki').setRequired(true)),
        new SlashCommandBuilder()
            .setName('hatırlatma')
            .setDescription('Kanala otomatik hatırlatma mesajı ayarlar (Yönetici).')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
            .addSubcommand(s => s
                .setName('ayarla')
                .setDescription('Belirli saat aralıklarıyla gönderilecek mesajı ayarlar.')
                .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek mesaj').setRequired(true))
                .addNumberOption(o => o.setName('saat').setDescription('Kaç saatte bir gönderilsin? (Örn: 2 veya 0.5)').setRequired(true))
            )
            .addSubcommand(s => s
                .setName('sil')
                .setDescription('Bu kanaldaki tüm otomatik hatırlatmaları durdurur ve siler.')
            ),
        new SlashCommandBuilder()
            .setName('kanal-kilit')
            .setDescription('Kanalı kilitler veya kilidini açar.')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
            .addSubcommand(s => s
                .setName('kapa')
                .setDescription('Kanalı kilitler.')
                .addIntegerOption(o => o.setName('sure').setDescription('Dakika cinsinden kilitli kalma süresi (Boş ise süresiz)').setRequired(false))
            )
            .addSubcommand(s => s
                .setName('aç')
                .setDescription('Kilitli kanalın kilidini açar.')
            )
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {}
});

client.on('inviteCreate', invite => {
    const invites = guildInvites.get(invite.guild.id) || new Map();
    invites.set(invite.code, invite.uses);
    guildInvites.set(invite.guild.id, invites);
});

client.on('inviteDelete', invite => {
    const invites = guildInvites.get(invite.guild.id) || new Map();
    invites.delete(invite.code);
    guildInvites.set(invite.guild.id, invites);
});

client.on('guildMemberAdd', async member => {
    try {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = guildInvites.get(member.guild.id) || new Map();
        
        const invite = newInvites.find(i => {
            const oldUses = oldInvites.get(i.code) || 0;
            return i.uses > oldUses;
        });

        if (invite && invite.inviter) {
            userInvites.set(member.id, invite.inviter.id);
        }

        guildInvites.set(member.guild.id, new Map(newInvites.map(i => [i.code, i.uses])));
    } catch (error) {}

    const welcomeChannelId = welcomeChannels.get(member.guild.id);
    if (welcomeChannelId) {
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        if (channel) {
            channel.send(`${member} Hoş geldin! Seninle birlikte **${member.guild.memberCount}** kişiyiz!`);
        }
    }

    const autoRoleId = autoRoles.get(member.guild.id);
    if (autoRoleId) {
        const roleToGive = member.guild.roles.cache.get(autoRoleId);
        if (roleToGive) {
            try {
                await member.roles.add(roleToGive);
            } catch (error) {}
        }
    }
});

client.on('guildBanAdd', async ban => {
    const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
    const banLog = fetchedLogs.entries.first();
    let executor = 'Bilinmiyor';
    if (banLog && banLog.target.id === ban.user.id && banLog.createdAt > Date.now() - 5000) {
        executor = banLog.executor.tag;
    }
    await sendLog(ban.guild, `${E.ban} Kullanıcı Yasaklandı`, `**Kullanıcı:** ${ban.user.tag}\n**Yetkili:** ${executor}\n**Sebep:** ${ban.reason || 'Belirtilmedi'}`, 0xC0392B);
});

client.on('guildBanRemove', async ban => {
    const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove });
    const unbanLog = fetchedLogs.entries.first();
    let executor = 'Bilinmiyor';
    if (unbanLog && unbanLog.target.id === ban.user.id && unbanLog.createdAt > Date.now() - 5000) {
        executor = unbanLog.executor.tag;
    }
    await sendLog(ban.guild, `${E.kanalkapa} Yasaklama Kaldırıldı`, `**Kullanıcı:** ${ban.user.tag}\n**Yetkili:** ${executor}`, 0x2ECC71);
});

client.on('guildMemberRemove', async member => {
    const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
    const kickLog = fetchedLogs.entries.first();
    
    const inviterId = userInvites.get(member.id);
    const inviterText = inviterId ? `<@${inviterId}>` : 'Bilinmiyor';

    if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > Date.now() - 5000) {
        await sendLog(member.guild, `${E.ev} Kullanıcı Atıldı`, `**Kullanıcı:** ${member.user.tag}\n**Yetkili:** ${kickLog.executor.tag}\n**Sebep:** ${kickLog.reason || 'Belirtilmedi'}`, 0xE67E22);
    } else {
        const leaveLogId = logChannels.get(member.guild.id);
        if (leaveLogId) {
            const leaveChannel = member.guild.channels.cache.get(leaveLogId);
            if (leaveChannel) {
                const leaveEmbed = createEmbed(`${E.engel} Üye Ayrıldı`, `**Kullanıcı:** <@${member.id}> (${member.user.tag})\n**Davet Eden:** ${inviterText}`, 0xE74C3C);
                await leaveChannel.send({ embeds: [leaveEmbed] }).catch(() => {});
            }
        }
    }
    
    userInvites.delete(member.id);

    for (const [msgId, gw] of activeGiveaways.entries()) {
        if (gw.participants.has(member.id)) {
            gw.participants.delete(member.id);
            Giveaway.update(
                { participants: Array.from(gw.participants) },
                { where: { messageId: msgId } }
            ).catch(() => {});
            
            const channel = client.channels.cache.get(gw.channelId);
            if (channel) {
                const msg = await channel.messages.fetch(msgId).catch(() => null);
                if (msg) {
                    const joinBtn = new ButtonBuilder().setCustomId('btn_gw_join').setLabel(`${gw.participants.size}`).setEmoji(E_ID.konfeti).setStyle(ButtonStyle.Primary);
                    const partBtn = new ButtonBuilder().setCustomId('btn_gw_participants').setLabel('Katılımcılar').setEmoji(E_ID.uye).setStyle(ButtonStyle.Secondary);
                    msg.edit({ components: [new ActionRowBuilder().addComponents(joinBtn, partBtn)] }).catch(() => {});
                }
            }
        }
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
        const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
        const muteLog = fetchedLogs.entries.first();
        let executor = 'Bilinmiyor';
        let reason = 'Belirtilmedi';
        if (muteLog && muteLog.target.id === newMember.id && muteLog.createdAt > Date.now() - 5000 && muteLog.changes.some(c => c.key === 'communication_disabled_until')) {
            executor = muteLog.executor.tag;
            reason = muteLog.reason || 'Belirtilmedi';
        }
        await sendLog(newMember.guild, `${E.susturma} Susturuldu`, `**Kullanıcı:** ${newMember.user.tag}\n**Yetkili:** ${executor}\n**Bitiş:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>\n**Sebep:** ${reason}`, 0xF1C40F);
    } else if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
        const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
        const unmuteLog = fetchedLogs.entries.first();
        let executor = 'Bilinmiyor';
        if (unmuteLog && unmuteLog.target.id === newMember.id && unmuteLog.createdAt > Date.now() - 5000 && unmuteLog.changes.some(c => c.key === 'communication_disabled_until')) {
            executor = unmuteLog.executor.tag;
        }
        await sendLog(newMember.guild, `${E.susturmaacma} Susturma Kaldırıldı`, `**Kullanıcı:** ${newMember.user.tag}\n**Yetkili:** ${executor}`, 0x2ECC71);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.mentions.has(client.user.id) && customUserMessages.has(message.author.id)) {
        return message.reply(customUserMessages.get(message.author.id));
    }

    if (customRoleSetup.has(message.author.id)) {
        const setupData = customRoleSetup.get(message.author.id);
        
        if (setupData.step === 'name') {
            const roleName = message.content;
            
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('color_FF0000').setLabel('Kırmızı').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('color_00FF00').setLabel('Yeşil').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('color_0000FF').setLabel('Mavi').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('color_FFFF00').setLabel('Sarı').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('color_800080').setLabel('Mor').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('color_FFA500').setLabel('Turuncu').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_00FFFF').setLabel('Cyan').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_FFC0CB').setLabel('Pembe').setStyle(ButtonStyle.Secondary)
            );
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('color_FFFFFF').setLabel('Beyaz').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_000000').setLabel('Siyah').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_808080').setLabel('Gri').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_A52A2A').setLabel('Kahverengi').setStyle(ButtonStyle.Secondary)
            );
            const row4 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('color_FFD700').setLabel('Altın').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_C0C0C0').setLabel('Gümüş').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_008080').setLabel('Teal').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('color_4B0082').setLabel('Lacivert').setStyle(ButtonStyle.Secondary)
            );

            const colorEmbed = createEmbed('Özel Rol Kurulumu (Adım 2/3)', `Harika! Rol adını **${roleName}** olarak belirlediniz. Lütfen aşağıdaki butonlardan rolünüzün rengini seçin.`, 0x5865F2);
            
            message.delete().catch(() => {});
            setupData.originalInteraction.editReply({ embeds: [colorEmbed], components: [row1, row2, row3, row4] });
            customRoleSetup.set(message.author.id, { ...setupData, step: 'color', name: roleName });
            return;
        }

        if (setupData.step === 'icon') {
            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                    const iconUrl = attachment.url;
                    message.delete().catch(() => {});
                    await finalizeCustomRoleSetup(message.guild, message.member, setupData, iconUrl, async (embed) => {
                        await setupData.originalInteraction.editReply({ embeds: [embed], components: [] }).catch(async () => {
                            await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
                        });
                    });
                    return;
                }
            }
            message.delete().catch(() => {});
            message.channel.send({ content: `<@${message.author.id}>, lütfen geçerli bir resim yükleyin veya menüden Atla/İptal seçeneğini kullanın.` }).then(m => setTimeout(() => m.delete().catch(()=>{}), 4000));
            return;
        }
    }
    
    const lowerContent = message.content.toLowerCase();

    const otoYanitlar = {
        'sa': 'Aleykümselam, hoş geldin!',
        'selamünaleyküm': 'Aleykümselam, hoş geldin!',
        'selam': 'Selam, hoş geldin!',
        'merhaba': 'Merhaba! Nasılsın?',
        'günaydın': 'Günaydın!',
        'iyi geceler': 'İyi geceler!',
    };

    if (otoYanitlar[lowerContent]) {
        return message.reply(otoYanitlar[lowerContent]);
    }
    
    if (linkProtection.has(message.guild.id)) {
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        
        const discordInviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)([a-zA-Z0-9-]+)/gi;
        
        const allowedInvites = ['azuron']; 

        const matches = [...message.content.matchAll(discordInviteRegex)];
        
        const hasIllegalLink = matches.some(match => !allowedInvites.includes(match[1].toLowerCase()));
        
        if (hasIllegalLink) {
            await message.delete().catch(() => {});
            
            const warningMsg = await message.channel.send({
                embeds: [createErrorEmbed(`<@${message.author.id}>, **Reklam:** Bu sunucuda başka Discord sunucularının davet bağlantılarını paylaşmak yasaktır!`)]
            });
            
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
        }
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const generatorChannelId = await getGeneratorChannelId(newState.guild);

    if (newState.channelId === generatorChannelId) {
        const guild = newState.guild;
        const user = newState.member.user;
        const category = newState.channel.parent;
        const newChannel = await guild.channels.create({
            name: `🔊 ${user.username}`,
            type: ChannelType.GuildVoice,
            parent: category,
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers]
                },
                {
                    id: guild.id,
                    allow: [PermissionsBitField.Flags.Connect]
                }
            ]
        });

        tempVoiceChannels.add(newChannel.id);

        await newState.setChannel(newChannel);

        const embed = createEmbed(
            `${E.susturmaacma} ${user.username} Yönetim Paneli`,
            `Özel odanız başarıyla oluşturuldu. Aşağıdaki menüyü kullanarak odanızı yönetebilirsiniz.`,
            0x3498DB
        );

        const settingsMenu = new StringSelectMenuBuilder()
            .setCustomId('vc_settings')
            .setPlaceholder('Kanal Ayarları')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('İsim Değiştir').setValue('action_name').setEmoji(E_ID.duzenle),
                new StringSelectMenuOptionBuilder().setLabel('Kişi Limiti').setValue('action_limit').setEmoji(E_ID.arama),
                new StringSelectMenuOptionBuilder().setLabel('Davet Et (ID)').setValue('action_invite_id').setEmoji(E_ID.forum),
                new StringSelectMenuOptionBuilder().setLabel('Odadan At (ID)').setValue('action_kick_id').setEmoji(E_ID.engel),
                new StringSelectMenuOptionBuilder().setLabel('Odayı Devret (ID)').setValue('action_transfer').setEmoji(E_ID.yildiz),
                new StringSelectMenuOptionBuilder().setLabel('Oda Yetkilisi Ekle (ID)').setValue('action_add_admin').setEmoji(E_ID.onay),
                new StringSelectMenuOptionBuilder().setLabel('Kilitle').setValue('action_lock').setEmoji(E_ID.kanalkapa),
                new StringSelectMenuOptionBuilder().setLabel('Kilidi Aç').setValue('action_unlock').setEmoji(E_ID.kanalac),
                new StringSelectMenuOptionBuilder().setLabel('Detaylı Bilgi').setValue('action_info').setEmoji(E_ID.kesif),
                new StringSelectMenuOptionBuilder().setLabel('Odayı Sil').setValue('action_delete').setEmoji(E_ID.copkutusu)
            );

        const row1 = new ActionRowBuilder().addComponents(settingsMenu);
        await newChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row1] });
    }

    if (newState.channel && tempVoiceChannels.has(newState.channel.id)) {
        if (deleteTimers.has(newState.channel.id)) {
            clearTimeout(deleteTimers.get(newState.channel.id));
            deleteTimers.delete(newState.channel.id);
        }
    }

    if (oldState.channel && tempVoiceChannels.has(oldState.channel.id) && oldState.channel.members.size === 0) {
        const timer = setTimeout(async () => {
            const channel = oldState.channel;
            try {
                let ownerId = null;
                channel.permissionOverwrites.cache.forEach((perm, id) => {
                    if (perm.type === 1 && perm.allow.has(PermissionsBitField.Flags.ManageChannels)) ownerId = id;
                });
                if (ownerId) {
                    const user = await client.users.fetch(ownerId).catch(() => null);
                    if (user) {
                        const dmEmbed = createEmbed(
                            'Oda Kapatıldı',
                            `**Merhaba, ${oldState.guild.name}** sunucusundaki odanızda kimse kalmadığı için kanal otomatik olarak kapatılmıştır.`,
                            0x95A5A6
                        );
                        await user.send({ embeds: [dmEmbed] }).catch(() => {});
                    }
                }
                await channel.delete().catch(() => {});
                deleteTimers.delete(channel.id);
                tempVoiceChannels.delete(channel.id);
            } catch (e) {}
        }, 5000);
        deleteTimers.set(oldState.channel.id, timer);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options, member, guild } = interaction;

        if (commandName === 'ses') {
            const sub = options.getSubcommand();
            if (sub === 'bağla') {
                const targetChannel = options.getChannel('kanal');
                botVoiceChannels.set(guild.id, targetChannel.id);
                await GuildSettings.upsert({ guildId: guild.id, botVoiceChannel: targetChannel.id });
                joinVoiceChannel({
                    channelId: targetChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true
                });
                return interaction.reply({ embeds: [createEmbed(`${E.onay} Başarılı`, `Bot başarıyla ${targetChannel} kanalına bağlandı.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'log') {
            const sub = options.getSubcommand();
            if (sub === 'kanal-ayarla') {
                const targetChannel = options.getChannel('kanal');
                logChannels.set(guild.id, targetChannel.id);
                await GuildSettings.upsert({ guildId: guild.id, logChannel: targetChannel.id });
                return interaction.reply({ embeds: [createEmbed(`${E.onay} Başarılı`, `Sunucu log kanalı başarıyla ${targetChannel} olarak ayarlandı.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
            } else if (sub === 'kaldır') {
                logChannels.delete(guild.id);
                await GuildSettings.update({ logChannel: null }, { where: { guildId: guild.id } });
                return interaction.reply({ embeds: [createEmbed(`${E.onay} Başarılı`, 'Log sistemi kapatıldı ve kanal kaldırıldı.', 0x2ECC71)], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'karşılama') {
            const sub = options.getSubcommand();
            if (sub === 'kanal-ayarla') {
                const targetChannel = options.getChannel('kanal');
                welcomeChannels.set(guild.id, targetChannel.id);
                await GuildSettings.upsert({ guildId: guild.id, welcomeChannel: targetChannel.id });
                return interaction.reply({ embeds: [createEmbed(`${E.onay} Başarılı`, `Karşılama kanalı başarıyla ${targetChannel} olarak ayarlandı.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
            } else if (sub === 'kaldır') {
                welcomeChannels.delete(guild.id);
                await GuildSettings.update({ welcomeChannel: null }, { where: { guildId: guild.id } });
                return interaction.reply({ embeds: [createEmbed(`${E.onay} Başarılı`, 'Karşılama mesajı sistemi kapatıldı ve kanal kaldırıldı.', 0x2ECC71)], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'çekiliş') {
            const modal = new ModalBuilder().setCustomId('modal_giveaway').setTitle('Çekiliş Başlat');

            const titleInput = new TextInputBuilder().setCustomId('gw_title').setLabel('Başlık').setStyle(TextInputStyle.Short).setRequired(true);
            const descInput = new TextInputBuilder().setCustomId('gw_desc').setLabel('Açıklama').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const winnersInput = new TextInputBuilder().setCustomId('gw_winners').setLabel('Kazanan Sayısı').setStyle(TextInputStyle.Short).setRequired(true);
            const durationInput = new TextInputBuilder().setCustomId('gw_duration').setLabel('Süre (Saat)').setStyle(TextInputStyle.Short).setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(winnersInput),
                new ActionRowBuilder().addComponents(durationInput)
            );

            await interaction.showModal(modal);
        }

        if (commandName === 'yeniden-çek') {
            const messageId = options.getString('mesaj_id');
            const gwData = await Giveaway.findOne({ where: { messageId: messageId, status: 'ended' } });
            
            if (!gwData) {
                return interaction.reply({ content: 'Belirtilen ID ile sona ermiş bir çekiliş bulunamadı.', flags: MessageFlags.Ephemeral });
            }

            const participantsArray = gwData.participants;
            if (!participantsArray || participantsArray.length === 0) {
                return interaction.reply({ content: 'Bu çekilişe katılan kimse olmadığı için yeniden çekiliş yapılamaz.', flags: MessageFlags.Ephemeral });
            }

            const randomIndex = Math.floor(Math.random() * participantsArray.length);
            const winner = `<@${participantsArray[randomIndex]}>`;

            const channel = client.channels.cache.get(gwData.channelId);
            if (channel) {
                const msg = await channel.messages.fetch(messageId).catch(() => null);
                if (msg) {
                    await msg.reply({ content: `${E.konfeti} **Yeniden Çekiliş Sonucu:** Tebrikler ${winner}! **${gwData.title}** çekilişinin yeni kazananı oldun!` });
                    return interaction.reply({ content: 'Yeniden çekiliş başarıyla yapıldı ve kanala gönderildi.', flags: MessageFlags.Ephemeral });
                }
            }
            
            return interaction.reply({ content: `Çekiliş mesajı bulunamadı ancak kazanan: ${winner}`, flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'ping') {
            return interaction.reply({ content: `${E.oyun} ...pong! ${Math.round(client.ws.ping)} ms`, flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'medya') {
            let originalUrl = options.getString('link');
            
            let urlMatch = originalUrl.match(/https?:\/\/[^\s]+/i);
            if (!urlMatch) {
                if (!originalUrl.startsWith('http')) {
                    originalUrl = 'https://' + originalUrl;
                }
            } else {
                originalUrl = urlMatch[0];
            }

            let parsedUrl;
            try {
                parsedUrl = new URL(originalUrl);
            } catch(e) {
                return interaction.reply({ content: 'Lütfen geçerli bir URL girin.', flags: MessageFlags.Ephemeral });
            }

            if (parsedUrl.hostname.includes('tiktok.com')) {
                parsedUrl.hostname = 'tnktok.com';
            } else {
                return interaction.reply({ content: 'Lütfen geçerli bir TikTok linki girin.', flags: MessageFlags.Ephemeral });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Bilgi')
                    .setEmoji(E_ID.kesif)
                    .setStyle(ButtonStyle.Link)
                    .setURL(originalUrl),
                new ButtonBuilder()
                    .setCustomId(`del_media_${interaction.user.id}`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(E_ID.copkutusu)
            );

            return interaction.reply({ content: parsedUrl.toString(), components: [row] });
        }

        if (commandName === 'sunucu-bilgi') {
            const owner = await guild.fetchOwner();
            const embed = createEmbed(`${E.ev} Sunucu Bilgileri`, null, 0x5865F2)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'Sunucu Adı', value: guild.name, inline: true },
                    { name: 'Sunucu ID', value: guild.id, inline: true },
                    { name: 'Kurucu', value: `${owner.user.tag}`, inline: true },
                    { name: 'Üye Sayısı', value: `${guild.memberCount}`, inline: true },
                    { name: 'Takviye Seviyesi', value: `${guild.premiumTier}`, inline: true },
                    { name: 'Takviye Sayısı', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                    { name: 'Kuruluş Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
                );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'kullanıcı-bilgi') {
            const targetUser = options.getUser('kullanici') || interaction.user;
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            const embed = createEmbed(`${E.uye2} Kullanıcı Bilgileri`, null, 0x5865F2)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Kullanıcı Adı', value: targetUser.tag, inline: true },
                    { name: 'Kullanıcı ID', value: targetUser.id, inline: true },
                    { name: 'Hesap Kurulum Tarihi', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: false }
                );
            if (targetMember) {
                const roles = targetMember.roles.cache.filter(r => r.id !== guild.id).map(r => r).join(', ') || 'Yok';
                embed.addFields(
                    { name: 'Sunucuya Katılım Tarihi', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`, inline: false },
                    { name: 'Roller', value: roles, inline: false }
                );
            }
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'özel') {
            const sub = options.getSubcommand();
            
            if (sub === 'mesaj-ayarla') {
                if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ embeds: [createErrorEmbed('Bu komutu sadece yöneticiler kullanabilir.')], flags: MessageFlags.Ephemeral });
                }

                const targetUser = options.getUser('kullanici');
                const replyMsg = options.getString('mesaj');

                await CustomMessage.upsert({ userId: targetUser.id, replyText: replyMsg });
                customUserMessages.set(targetUser.id, replyMsg);

                return interaction.reply({ embeds: [createEmbed('Özel Mesaj Ayarlandı', `<@${targetUser.id}> bota etiket attığında artık şu yanıt verilecek:\n\n${replyMsg}`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
            }

            if (sub === 'mesaj-sil') {
                if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return interaction.reply({ embeds: [createErrorEmbed('Bu komutu sadece yöneticiler kullanabilir.')], flags: MessageFlags.Ephemeral });
                }

                const targetUser = options.getUser('kullanici');

                if (!customUserMessages.has(targetUser.id)) {
                    return interaction.reply({ embeds: [createErrorEmbed('Bu kullanıcının sistemde kayıtlı özel bir mesajı bulunmuyor.')], flags: MessageFlags.Ephemeral });
                }

                await CustomMessage.destroy({ where: { userId: targetUser.id } });
                customUserMessages.delete(targetUser.id);

                return interaction.reply({ embeds: [createEmbed('Özel Mesaj Silindi', `<@${targetUser.id}> kullanıcısının özel mesajı sistemden kaldırıldı.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
            }

            if (!member.premiumSince && !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ embeds: [createErrorEmbed('Bu komutu kullanabilmek için sunucuya takviye (boost) yapmanız gerekmektedir.')], flags: MessageFlags.Ephemeral });
            }

            if (sub === 'rol-ayarla') {
                if (userCustomRoles.has(member.id)) {
                    const existingRoleId = userCustomRoles.get(member.id);
                    const existingRole = guild.roles.cache.get(existingRoleId);
                    if (existingRole) {
                        return interaction.reply({ embeds: [createErrorEmbed('Zaten özel bir rolünüz bulunuyor. Yeni bir tane oluşturmak için önce mevcut rolünüzü `/özel rol-sil` komutuyla silmelisiniz.')], flags: MessageFlags.Ephemeral });
                    } else {
                        userCustomRoles.delete(member.id);
                        await CustomRole.destroy({ where: { userId: member.id } }).catch(() => {});
                    }
                }

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const setupEmbed = createEmbed('Özel Rol Kurulumu (Adım 1/3)', 'Lütfen oluşturmak istediğiniz özel rolün adını bu kanala yazın.', 0x5865F2);
                await interaction.editReply({ embeds: [setupEmbed] });

                customRoleSetup.set(member.id, { step: 'name', originalInteraction: interaction });

                setTimeout(() => {
                    if (customRoleSetup.has(member.id) && customRoleSetup.get(member.id).step === 'name') {
                        customRoleSetup.delete(member.id);
                        interaction.editReply({ embeds: [createErrorEmbed('Belirtilen süre içerisinde yanıt vermediğiniz için kurulum iptal edildi.')], components: [] }).catch(() => {});
                    }
                }, 60000);
            }

            if (sub === 'rol-sil') {
                if (!userCustomRoles.has(member.id)) {
                    return interaction.reply({ embeds: [createErrorEmbed('Size ait silinecek özel bir rol bulunamadı.')], flags: MessageFlags.Ephemeral });
                }

                const roleId = userCustomRoles.get(member.id);
                const role = guild.roles.cache.get(roleId);

                if (!role) {
                    userCustomRoles.delete(member.id);
                    await CustomRole.destroy({ where: { userId: member.id } }).catch(() => {});
                    return interaction.reply({ embeds: [createErrorEmbed('Rol sunucuda bulunamadı, hafızadan temizlendi.')], flags: MessageFlags.Ephemeral });
                }

                const confirmEmbed = createEmbed('Özel Rol Silme Onayı', `**${role.name}** isimli özel rolünüzü kalıcı olarak silmek istediğinize emin misiniz?`, 0xE74C3C);
                
                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`confirm_delete_${roleId}`).setLabel('Evet, Sil').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('cancel_delete').setLabel('İptal').setStyle(ButtonStyle.Secondary)
                );

                await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'rol') {
            const sub = options.getSubcommand();
            if (sub === 'ayarla') {
                const targetRole = options.getRole('rol');
                const guildId = guild.id;

                if (targetRole.position >= guild.members.me.roles.highest.position) {
                    return interaction.reply({ 
                        embeds: [createErrorEmbed(`**İşlem Başarısız:** ${targetRole} rolü benim rollerimden daha üstte veya aynı sırada. Lütfen sunucu ayarlarından benim rolümü daha yukarı taşıyın.`)], 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                if (autoRoles.get(guildId) === targetRole.id) {
                    autoRoles.delete(guildId);
                    await GuildSettings.upsert({ guildId: guildId, autoRole: null });
                    return interaction.reply({ 
                        embeds: [createEmbed('Otomatik Rol Kapatıldı', `Otomatik rol sistemi devre dışı bırakıldı. Artık yeni üyelere ${targetRole} rolü **verilmeyecek**.`, 0xE74C3C)] 
                    });
                } 
                else {
                    autoRoles.set(guildId, targetRole.id);
                    await GuildSettings.upsert({ guildId: guildId, autoRole: targetRole.id });
                    return interaction.reply({ 
                        embeds: [createEmbed('Otomatik Rol Ayarlandı', `Otomatik rol başarıyla ${targetRole} olarak ayarlandı. Sunucuya yeni katılanlara bu rol verilecek.`, 0x2ECC71)] 
                    });
                }
            }
        }

        if (commandName === 'mod-form') {
            const durationHours = options.getInteger('sure');
            const durationMs = durationHours * 3600000;
            const endTime = Math.floor(Date.now() / 1000) + (durationHours * 3600);

            const formEmbed = new EmbedBuilder()
                .setTitle(`${E.onay} Moderatör Başvuru Formu`)
                .setDescription(`Sunucumuzun yetkili ekibine katılmak istiyorsan aşağıdaki butona tıklayarak başvuru formunu doldurabilirsin.\n\n${E.zamanasimi} **Son Başvuru:** <t:${endTime}:F> (<t:${endTime}:R>)\n\nLütfen soruları özenle ve dürüstçe yanıtlayın. Form **iki aşamalıdır**, ilk 5 soruyu gönderdikten sonra diğer 3 soru ekrana gelecektir.`)
                .setColor(0x5865F2)
                .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Azuron Türkiye Yetkili Alımı', iconURL: client.user.displayAvatarURL() });

            const formButton = new ButtonBuilder()
                .setCustomId('btn_open_mod_form')
                .setLabel('Formu Doldur')
                .setStyle(ButtonStyle.Success)
                .setEmoji(E_ID.duzenle);

            const row = new ActionRowBuilder().addComponents(formButton);

            await interaction.reply({ content: 'Form başarıyla kanala gönderildi.', flags: MessageFlags.Ephemeral });
            const formMessage = await interaction.channel.send({ embeds: [formEmbed], components: [row] });

            setTimeout(async () => {
                try {
                    const fetchedMessage = await interaction.channel.messages.fetch(formMessage.id);
                    if (fetchedMessage) {
                        const disabledButton = new ButtonBuilder()
                            .setCustomId('btn_open_mod_form')
                            .setLabel('Başvurular Kapandı')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(E_ID.kanalkapa)
                            .setDisabled(true);
                        
                        const disabledRow = new ActionRowBuilder().addComponents(disabledButton);
                        
                        await fetchedMessage.edit({ components: [disabledRow] });
                    }
                } catch (error) {}
            }, durationMs);
        }

        if (commandName === 'yardım') {
            const embed = createEmbed('Yardım Menüsü', `${E.yardim} Lütfen detaylarını görmek istediğiniz kategoriyi aşağıdaki menüden seçin.`, 0x5865F2);
            
            const menu = new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('Kategori Seçin...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Genel Komutlar').setValue('help_genel').setEmoji(E_ID.kesif),
                    new StringSelectMenuOptionBuilder().setLabel('Yönetici Komutları').setValue('help_admin').setEmoji(E_ID.admin),
                    new StringSelectMenuOptionBuilder().setLabel('Takviyeci Komutları').setValue('help_booster').setEmoji(E_ID.yildiz),
                    new StringSelectMenuOptionBuilder().setLabel('Sistemler').setValue('help_systems').setEmoji(E_ID.bakim)
                );
            
            const row = new ActionRowBuilder().addComponents(menu);
            return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'ses-panel') {
            await interaction.deferReply();
            const category = await guild.channels.create({ name: 'ÖZEL ODALAR', type: ChannelType.GuildCategory });
            const voiceChannel = await guild.channels.create({ name: '➕ Oda Oluştur', type: ChannelType.GuildVoice, parent: category.id });
            await interaction.editReply({
                embeds: [createEmbed('Kurulum Başarılı', `Oda kurulumu tamamlandı.. <#${voiceChannel.id}> kanalı kullanıma hazır.`, 0x2ECC71)]
            });
        }

        if (commandName === 'sil') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ embeds: [createErrorEmbed('Mesajlar silinemedi, sunucuda Mesajları Yönet yetkisine sahip olmalısınız.')], flags: MessageFlags.Ephemeral });
            }

            const miktar = options.getInteger('miktar');
            try {
                const silinenler = await interaction.channel.bulkDelete(miktar, true);
                await interaction.reply({ embeds: [createEmbed('Temizlik Başarılı', `Kanalda **${silinenler.size}** adet mesaj silindi.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
                await sendLog(guild, `${E.copkutusu} Mesajlar Silindi`, `**Yetkili:** ${member.user.tag}\n**Kanal:** <#${interaction.channel.id}>\n**Miktar:** ${silinenler.size} mesaj`, 0x3498DB);
            } catch (error) {
                await interaction.reply({ embeds: [createErrorEmbed('Mesajlar silinemedi.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'link-engel') {
            const sub = options.getSubcommand();
            if (sub === 'aç') {
                linkProtection.add(guild.id);
                GuildSettings.upsert({ guildId: guild.id, linkProtection: true });
                interaction.reply({ embeds: [createEmbed('Link Engelleme', 'Link engelleme sistemi **AKTİF** edilmiştir.', 0x2ECC71)] });
            } else if (sub === 'kapa') {
                linkProtection.delete(guild.id);
                GuildSettings.upsert({ guildId: guild.id, linkProtection: false });
                interaction.reply({ embeds: [createEmbed('Link Engelleme', 'Link engelleme sistemi **DEVRE DIŞI** bırakılmıştır.', 0xE67E22)] });
            }
        }

        if (commandName === 'öneri') {
            const modal = new ModalBuilder().setCustomId('modal_suggestion').setTitle('Öneri ve İstek Formu');
            const input = new TextInputBuilder()
                .setCustomId('suggestion_text')
                .setLabel('Öneriniz Nedir?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }

        if (commandName === 'bilet') {
            const sub = options.getSubcommand();
            if (sub === 'oluştur') {
                const existingCategory = guild.channels.cache.find(c => c.name === `${E.bilet} Bilet Sistemi` && c.type === ChannelType.GuildCategory);
                if (existingCategory) {
                    return interaction.reply({ embeds: [createErrorEmbed(`Bilet sistemi zaten kurulu.`)], flags: MessageFlags.Ephemeral });
                }
                
                const roleMenu = new RoleSelectMenuBuilder()
                    .setCustomId('ticket_staff_role_select')
                    .setPlaceholder('Biletlerle ilgilenecek rolü seçiniz.')
                    .setMaxValues(1);
                    
                const row = new ActionRowBuilder().addComponents(roleMenu);
                return interaction.reply({ content: 'Kurulum Aşaması: Biletlerle ilgilenecek yetkili rolünü seçin.', components: [row], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'kick') {
            const target = options.getUser('kullanici');
            const reason = options.getString('sebep') || 'Belirtilmedi';
            const targetMember = await guild.members.fetch(target.id).catch(() => null);
            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı sunucuda bulunamadı.')], flags: MessageFlags.Ephemeral });
            if (target.id === member.id) return interaction.reply({ embeds: [createErrorEmbed('Kendi üzerinizde uzaklaştırma işlemi uygulayamazsınız.')], flags: MessageFlags.Ephemeral });
            if (targetMember.kickable) {
                await targetMember.kick(reason);
                interaction.reply({ embeds: [createEmbed('Uzaklaştırma (Kick)', `**${target.tag}** sunucudan uzaklaştırılmıştır.\n**Gerekçe:** ${reason}`, 0xE67E22)] });
                await sendLog(guild, `${E.ev} Kullanıcı Atıldı`, `**Yetkili:** ${member.user.tag}\n**Atılan:** ${target.tag}\n**Sebep:** ${reason}`, 0xE67E22);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**İşlem Başarısız:** Bu kullanıcının rolü benim rolümden daha yüksek veya eşit olduğu için işlem yapılamıyor.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'ban') {
            const target = options.getUser('kullanici');
            const reason = options.getString('sebep') || 'Belirtilmedi';
            if (target.id === member.id) return interaction.reply({ embeds: [createErrorEmbed('Kendinizi yasaklayamazsınız.')], flags: MessageFlags.Ephemeral });
            try {
                await guild.members.ban(target, { reason: reason });
                interaction.reply({ embeds: [createEmbed('Yasaklama (Ban)', `**${target.tag}** sunucudan kalıcı olarak yasaklanmıştır.\n**Gerekçe:** ${reason}`, 0xC0392B)] });
                await sendLog(guild, `${E.ban} Kullanıcı Yasaklandı`, `**Yetkili:** ${member.user.tag}\n**Yasaklanan:** ${target.tag}\n**Sebep:** ${reason}`, 0xC0392B);
            } catch (e) {
                interaction.reply({ embeds: [createErrorEmbed('**İşlem Başarısız:** Kullanıcıyı yasaklamak için yeterli yetkiye sahip değilim.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'mute') {
            const target = options.getUser('kullanici');
            const duration = options.getInteger('sure');
            const reason = options.getString('sebep') || 'Belirtilmedi';
            const targetMember = await guild.members.fetch(target.id).catch(() => null);
            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı sunucuda bulunamadı.')], flags: MessageFlags.Ephemeral });
            if (target.id === member.id) return interaction.reply({ embeds: [createErrorEmbed('Kendinize susturma işlemi uygulayamazsınız.')], flags: MessageFlags.Ephemeral });
            if (targetMember.moderatable) {
                await targetMember.timeout(duration * 60000, reason);
                interaction.reply({ embeds: [createEmbed('Süreli Susturma (Timeout)', `**${target.tag}** kullanıcısına **${duration} dakika** boyunca susturulma uygulanmıştır.`, 0xF1C40F)] });
                await sendLog(guild, `${E.susturma} Kullanıcı Susturuldu`, `**Yetkili:** ${member.user.tag}\n**Susturulan:** ${target.tag}\n**Süre:** ${duration} Dakika\n**Sebep:** ${reason}`, 0xF1C40F);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**Hata:** Bu kullanıcı Yönetici yetkisine sahip veya rolü benden yüksek.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'unmute') {
            const target = options.getUser('kullanici');
            const targetMember = await guild.members.fetch(target.id).catch(() => null);
            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('Üye sunucuda bulunamadı.')], flags: MessageFlags.Ephemeral });
            if (targetMember.moderatable) {
                await targetMember.timeout(null);
                interaction.reply({ embeds: [createEmbed('Susturma Kaldırıldı', `**${target.tag}** kullanıcısının susturması kaldırılmıştır.`, 0x2ECC71)] });
                await sendLog(guild, `${E.susturmaacma} Susturma Kaldırıldı`, `**Yetkili:** ${member.user.tag}\n**Kullanıcı:** ${target.tag}`, 0x2ECC71);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**Hata:** İşlem gerçekleştirilemedi. Yetkilerimi kontrol ediniz.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'hatırlatma') {
            const sub = options.getSubcommand();
            if (sub === 'ayarla') {
                const mesajText = options.getString('mesaj');
                const saatInterval = options.getNumber('saat');

                await AutoMessage.create({
                    channelId: interaction.channel.id,
                    messageText: mesajText,
                    intervalHours: saatInterval,
                    lastSentAt: Date.now()
                });

                return interaction.reply({ 
                    embeds: [createEmbed(`${E.onay} Hatırlatma Ayarlandı`, `Bu kanala her **${saatInterval} saatte bir** aşağıdaki mesaj gönderilecek:\n\n\`${mesajText}\``, 0x2ECC71)], 
                    flags: MessageFlags.Ephemeral 
                });
            }

            if (sub === 'sil') {
                const deletedCount = await AutoMessage.destroy({ where: { channelId: interaction.channel.id } });
                
                if (deletedCount > 0) {
                    return interaction.reply({ 
                        embeds: [createEmbed(`${E.copkutusu} Hatırlatmalar Silindi`, `Bu kanala ait **${deletedCount}** adet aktif hatırlatma başarıyla durduruldu ve silindi.`, 0x2ECC71)], 
                        flags: MessageFlags.Ephemeral 
                    });
                } else {
                    return interaction.reply({ 
                        embeds: [createErrorEmbed('Bu kanalda ayarlanmış herhangi bir otomatik hatırlatma bulunamadı.')], 
                        flags: MessageFlags.Ephemeral 
                    });
                }
            }
        }

        if (commandName === 'kanal-kilit') {
            const sub = options.getSubcommand();
            if (sub === 'kapa') {
                const sure = options.getInteger('sure');
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
                
                if (sure) {
                    interaction.reply({ embeds: [createEmbed('Kanal Kilitlendi', `${E.kanalkapa} Kanal ${sure} dakika boyunca kilitlendi.`, 0xE74C3C)] });
                    setTimeout(async () => {
                        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }).catch(()=>{});
                        interaction.channel.send({ embeds: [createEmbed('Kanal Kilidi Açıldı', `${E.kanalac} Süre dolduğu için kanal kilidi otomatik olarak açıldı.`, 0x2ECC71)] }).catch(()=>{});
                    }, sure * 60000);
                } else {
                    interaction.reply({ embeds: [createEmbed('Kanal Kilitlendi', `${E.kanalkapa} Kanal süresiz olarak kilitlendi.`, 0xE74C3C)] });
                }
            } else if (sub === 'aç') {
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
                interaction.reply({ embeds: [createEmbed('Kanal Kilidi Açıldı', `${E.kanalac} Kanalın kilidi açıldı.`, 0x2ECC71)] });
            }
        }
    }

    if (interaction.isRoleSelectMenu() && interaction.customId === 'ticket_staff_role_select') {
        await interaction.deferUpdate();
        const selectedRoleId = interaction.values[0];
        ticketStaffRoles.set(interaction.guild.id, selectedRoleId);
        await GuildSettings.upsert({ guildId: interaction.guild.id, ticketStaffRole: selectedRoleId });
        
        const ticketCategory = await interaction.guild.channels.create({
            name: `🎫 Bilet Sistemi`,
            type: ChannelType.GuildCategory
        });

        const ticketSetupChannel = await interaction.guild.channels.create({
            name: 'bilet-oluştur',
            type: ChannelType.GuildText,
            parent: ticketCategory.id,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.SendMessages], allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });

        const supportEmbed = new EmbedBuilder()
            .setTitle(`${E.bilet} Destek Sistemi`)
            .setDescription(
                '**Merhaba, Azuron Türkiye Destek Merkezine Hoş Geldiniz!**\n\n' +
                'Herhangi bir konuda yardıma ihtiyaç duyuyorsanız aşağıdaki menüyü kullanarak bilet oluşturabilirsiniz.\n\n' +
                `> ${E.kayit} Biletiniz açıldığında yalnızca siz ve yetkili ekibimiz görebilir.\n` +
                `> ${E.zamanasimi} Ekibimiz en kısa sürede size geri dönecektir.\n` +
                `> ${E.engel} Lütfen bilet açmadan önce konunuzu net bir şekilde belirleyin.\n\n` +
                '**Destek almak için aşağıdaki menüden seçim yapın.**'
            )
            .setColor(0x5865F2)
            .setTimestamp()
            .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() })
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL());

        const ticketOpenMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_open_menu')
            .setPlaceholder('Bilet türünü seçin...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Destek Bileti Aç')
                    .setDescription('Genel konularda yetkili ekibinden destek alın.')
                    .setValue('open_support_ticket')
                    .setEmoji(E_ID.bilet),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Şikayet Bileti Aç')
                    .setDescription('Bir kullanıcı hakkında şikayette bulunun.')
                    .setValue('open_report_ticket')
                    .setEmoji(E_ID.duyuru2),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Öneri Bileti Aç')
                    .setDescription('Sunucuya özel öneri veya isteklerinizi iletin.')
                    .setValue('open_suggestion_ticket')
                    .setEmoji(E_ID.yildiz)
            );

        const ticketMenuRow = new ActionRowBuilder().addComponents(ticketOpenMenu);

        await ticketSetupChannel.send({ embeds: [supportEmbed], components: [ticketMenuRow] });

        await interaction.editReply({
            content: null,
            embeds: [createEmbed(`${E.onay} Bilet Sistemi Kuruldu`, `Bilet sistemi başarıyla aktif edildi.\nYetkili Rolü: <@&${selectedRoleId}>\n\n${E.kayit} **Kategori:** ${ticketCategory.name}\n${E.forum} **Kanal:** <#${ticketSetupChannel.id}>`, 0x2ECC71)],
            components: []
        });
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'help_menu') {
            const value = interaction.values[0];
            let newEmbed;
            
            if (value === 'help_genel') {
                newEmbed = createEmbed(`${E.kesif} Genel Komutlar`, '`/yardım` - Botun komut listesini gösterir.\n`/öneri` - Yönetim ekibine bir öneri gönderin.\n`/ping` - Botun gecikme süresini gösterir.\n`/sunucu-bilgi` - Sunucu hakkındaki detaylı bilgileri gösterir.\n`/kullanıcı-bilgi` - Belirtilen kullanıcı hakkında bilgi verir.\n`/medya` - TikTok videosunu oynatır.', 0x5865F2);
            } else if (value === 'help_admin') {
                newEmbed = createEmbed(`${E.admin} Yönetici Komutları`, '`/log kanal-ayarla` - Log kanalını seçer.\n`/log kaldır` - Log sistemini kapatır.\n`/karşılama kanal-ayarla` - Karşılama kanalını ayarlar.\n`/karşılama kaldır` - Karşılama sistemini kapatır.\n`/ses bağla` - Botu istenen sese sabitler.\n`/çekiliş` - Sunucuda yeni bir çekiliş başlatır.\n`/yeniden-çek` - Sona ermiş bir çekiliş için yeni kazanan belirler.\n`/mod-form` - Moderatör başvuru formunu kanala gönderir.\n`/ses-panel` - Ses yönetim panelini aktif eder.\n`/bilet oluştur` - Bilet sistemini sunucuya kurar.\n`/link-engel` - Sunucu içi link paylaşım korumasını yönetir.\n`/kick` - Kullanıcıyı sunucudan uzaklaştırır.\n`/ban` - Kullanıcıyı yasaklar.\n`/mute` - Kullanıcıya süreli kısıtlama uygular.\n`/unmute` - Kullanıcının kısıtlamasını kaldırır.\n`/sil` - Belirtilen miktarda mesajı kanaldan temizler.\n`/rol ayarla` - Sunucuya katılanlara verilecek otomatik rolü ayarlar.\n`/özel mesaj-ayarla` - Özel yanıt ayarlar.\n`/özel mesaj-sil` - Özel mesajı siler.\n`/hatırlatma ayarla` - Hatırlatma mesajı ayarlar.\n`/hatırlatma sil` - Hatırlatmaları siler.\n`/kanal-kilit aç` - Kanalın kilidini açar.\n`/kanal-kilit kapa` - Kanalı kilitler.', 0x5865F2);
            } else if (value === 'help_booster') {
                newEmbed = createEmbed(`${E.yildiz} Takviyeci Komutları`, '`/özel rol-ayarla` - Özel rol oluşturur.\n`/özel rol-sil` - Özel rolü siler.', 0x5865F2);
            } else if (value === 'help_systems') {
                newEmbed = createEmbed(`${E.bakim} Sistemler`, `**Ses Sistemi:** Özel oda kurmak için **Oda Oluştur** kanalına girmeniz yeterlidir.\n**Bilet Sistemi:** **bilet-oluştur** kanalındaki menüden destek bileti açabilirsiniz.`, 0x5865F2);
            }
            
            return interaction.update({ embeds: [newEmbed] });
        }

        if (interaction.customId === 'ticket_open_menu') {
            const value = interaction.values[0];
            const typeMap = {
                open_support_ticket: `${E.bilet} Destek`,
                open_report_ticket: `${E.duyuru2} Şikayet`,
                open_suggestion_ticket: `${E.yildiz} Öneri`
            };
            const selectedType = typeMap[value] || 'Genel';

            const modal = new ModalBuilder()
                .setCustomId(`modal_ticket_${value}`)
                .setTitle(`${selectedType} Bileti Oluştur`);

            const topicInput = new TextInputBuilder()
                .setCustomId('ticket_topic')
                .setLabel('Bilet Konusu')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Sorununuzu veya talebinizi kısaca açıklayın...')
                .setMinLength(10)
                .setMaxLength(500)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(topicInput));
            await interaction.showModal(modal);
            return;
        }

        if (interaction.customId === 'ticket_closed_actions') {
            const guild = interaction.guild;
            const channel = interaction.channel;
            const topic = channel.topic || '';
            const ownerIdMatch = topic.match(/OWNER:(\d+)/);
            const ownerId = ownerIdMatch ? ownerIdMatch[1] : null;

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ embeds: [createErrorEmbed('Bu işlemi gerçekleştirmek için yetkili olmanız gerekmektedir.')], flags: MessageFlags.Ephemeral });
            }

            const action = interaction.values[0];

            if (action === 'ticket_delete') {
                await interaction.reply({ embeds: [createEmbed(`${E.copkutusu} Bilet Silindi`, 'Bu bilet kalıcı olarak siliniyor...', 0xE74C3C)] });
                await sendLog(guild, `${E.copkutusu} Bilet Silindi`, `**Kanal:** ${channel.name}\n**Silen:** ${interaction.user.tag}`, 0xE74C3C);
                setTimeout(() => channel.delete().catch(() => {}), 3000);
            }

            if (action === 'ticket_reopen') {
                if (!ownerId) {
                    return interaction.reply({ embeds: [createErrorEmbed('Bilet sahibi bilgisine ulaşılamadı.')], flags: MessageFlags.Ephemeral });
                }

                await channel.permissionOverwrites.edit(ownerId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });

                const reopenEmbed = new EmbedBuilder()
                    .setTitle(`${E.kanalac} Bilet Yeniden Açıldı`)
                    .setDescription(`Bu bilet <@${interaction.user.id}> tarafından yeniden açılmıştır.\n\n<@${ownerId}> Biletiniz yeniden aktif hale getirildi.`)
                    .setColor(0x2ECC71)
                    .setTimestamp()
                    .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() });

                const closeAgainButton = new ButtonBuilder()
                    .setCustomId('ticket_close_btn')
                    .setLabel('Bileti Kapat')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(E_ID.kanalkapa);

                const btnRow = new ActionRowBuilder().addComponents(closeAgainButton);

                await interaction.reply({ embeds: [reopenEmbed], components: [btnRow] });
                await sendLog(guild, `${E.kanalac} Bilet Yeniden Açıldı`, `**Kanal:** ${channel.name}\n**Açan Yetkili:** ${interaction.user.tag}`, 0x2ECC71);
            }
            return;
        }

        if (interaction.customId.startsWith('vc_')) {
            const channel = interaction.channel;
            if (!interaction.member.permissionsIn(channel).has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ embeds: [createErrorEmbed('**Yetkisiz Erişim:** Bu odanın yönetim paneline erişim izniniz bulunmamaktadır.')], flags: MessageFlags.Ephemeral });
            }

            const selection = interaction.values[0];

            if (selection === 'action_invite_id') {
                const modal = new ModalBuilder().setCustomId('modal_invite').setTitle('Üye Davet');
                const input = new TextInputBuilder().setCustomId('invite_id').setLabel('Kullanıcı ID').setStyle(TextInputStyle.Short).setPlaceholder('Örn: 123456789012345678').setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (selection === 'action_kick_id') {
                const modal = new ModalBuilder().setCustomId('modal_kick').setTitle('Üye Uzaklaştırma');
                const input = new TextInputBuilder().setCustomId('kick_id').setLabel('Kullanıcı ID').setStyle(TextInputStyle.Short).setPlaceholder('Örn: 123456789012345678').setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (selection === 'action_transfer') {
                const modal = new ModalBuilder().setCustomId('modal_transfer').setTitle('Odayı Devret');
                const input = new TextInputBuilder().setCustomId('transfer_id').setLabel('Yeni Sahibin ID\'si').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (selection === 'action_add_admin') {
                const modal = new ModalBuilder().setCustomId('modal_add_admin').setTitle('Oda Yetkilisi Ekle');
                const input = new TextInputBuilder().setCustomId('admin_id').setLabel('Yetkili Yapılacak ID').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (selection === 'action_lock') {
                await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
                interaction.reply({ embeds: [createEmbed('Oda Kilitlendi', 'Oda kilitlenmiştir.', 0xE74C3C)], flags: MessageFlags.Ephemeral });
            } else if (selection === 'action_unlock') {
                await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
                interaction.reply({ embeds: [createEmbed('Oda Kilidi Açıldı', 'Oda kilidi açılmıştır.', 0x2ECC71)], flags: MessageFlags.Ephemeral });
            } else if (selection === 'action_delete') {
                interaction.reply({ embeds: [createEmbed('Silme İşlemi', 'Kanal siliniyor...', 0xE74C3C)], flags: MessageFlags.Ephemeral });
                tempVoiceChannels.delete(channel.id)
                await channel.delete();
            } else if (selection === 'action_info') {
                const memberCount = channel.members.size;
                const limit = channel.userLimit === 0 ? 'Sınırsız' : channel.userLimit;
                const bitrate = channel.bitrate / 1000;
                const isLocked = channel.permissionOverwrites.resolve(interaction.guild.id)?.deny.has(PermissionsBitField.Flags.Connect) ? `${E.kanalkapa} Kilitli` : `${E.kanalac} Açık`;
                const region = channel.rtcRegion || 'Otomatik';
                const membersList = channel.members.map(m => m.user.tag).join(', ') || 'Odada kimse yok.';
                const shortMembersList = membersList.length > 1000 ? membersList.substring(0, 997) + '...' : membersList;
                const infoEmbed = createEmbed(`${E.kesif} Oda İstatistikleri`, null, 0x3498DB)
                    .addFields(
                        { name: 'Kanal Adı', value: `${channel.name}`, inline: true },
                        { name: 'Kanal ID', value: `\`${channel.id}\``, inline: true },
                        { name: 'Kilit Durumu', value: `${isLocked}`, inline: true },
                        { name: 'Ses Kalitesi', value: `${bitrate} kbps`, inline: true },
                        { name: 'Sunucu Bölgesi', value: `${region}`, inline: true },
                        { name: 'Doluluk Oranı', value: `${memberCount} / ${limit}`, inline: true },
                        { name: 'Aktif Kullanıcılar', value: `\`\`\`${shortMembersList}\`\`\``, inline: false }
                    );
                interaction.reply({ embeds: [infoEmbed], flags: MessageFlags.Ephemeral });
            } else if (selection === 'action_name') {
                const modal = new ModalBuilder().setCustomId('modal_rename').setTitle('Kanal Adını Düzenle');
                const input = new TextInputBuilder().setCustomId('new_name').setLabel('Yeni İsim').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (selection === 'action_limit') {
                const modal = new ModalBuilder().setCustomId('modal_limit').setTitle('Kapasite Sınırı');
                const input = new TextInputBuilder().setCustomId('new_limit').setLabel('Limit (0 = Sınırsız)').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'btn_gw_join') {
            const gw = activeGiveaways.get(interaction.message.id);
            if (!gw) {
                return interaction.reply({ content: 'Bu çekiliş artık aktif değil veya sona ermiş.', flags: MessageFlags.Ephemeral });
            }

            if (gw.participants.has(interaction.user.id)) {
                const leaveBtn = new ButtonBuilder()
                    .setCustomId(`btn_gw_leave_${interaction.message.id}`)
                    .setLabel('Çekilişten Ayrıl')
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(leaveBtn);

                return interaction.reply({ 
                    content: 'Zaten çekilişe katıldın. Çekilişten ayrılmak için "Çekilişten Ayrıl" tuşuna basınız.', 
                    components: [row],
                    flags: MessageFlags.Ephemeral 
                });
            } else {
                gw.participants.add(interaction.user.id);

                await Giveaway.update(
                    { participants: Array.from(gw.participants) },
                    { where: { messageId: interaction.message.id } }
                ).catch(() => {});

                const joinBtn = new ButtonBuilder().setCustomId('btn_gw_join').setLabel(`${gw.participants.size}`).setEmoji(E_ID.konfeti).setStyle(ButtonStyle.Primary);
                const partBtn = new ButtonBuilder().setCustomId('btn_gw_participants').setLabel('Katılımcılar').setEmoji(E_ID.uye).setStyle(ButtonStyle.Secondary);
                await interaction.message.edit({ components: [new ActionRowBuilder().addComponents(joinBtn, partBtn)] });

                return interaction.reply({ content: `Çekilişe başarıyla katıldın! ${E.konfeti}`, flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId.startsWith('btn_gw_leave_')) {
            const msgId = interaction.customId.replace('btn_gw_leave_', '');
            const gw = activeGiveaways.get(msgId);
            if (!gw) return interaction.update({ content: 'Bu çekiliş artık aktif değil.', components: [] });

            if (gw.participants.has(interaction.user.id)) {
                gw.participants.delete(interaction.user.id);
                
                await Giveaway.update(
                    { participants: Array.from(gw.participants) },
                    { where: { messageId: msgId } }
                ).catch(() => {});

                const channel = client.channels.cache.get(gw.channelId);
                if (channel) {
                    const msg = await channel.messages.fetch(msgId).catch(() => null);
                    if (msg) {
                        const joinBtn = new ButtonBuilder().setCustomId('btn_gw_join').setLabel(`${gw.participants.size}`).setEmoji(E_ID.konfeti).setStyle(ButtonStyle.Primary);
                        const partBtn = new ButtonBuilder().setCustomId('btn_gw_participants').setLabel('Katılımcılar').setEmoji(E_ID.uye).setStyle(ButtonStyle.Secondary);
                        await msg.edit({ components: [new ActionRowBuilder().addComponents(joinBtn, partBtn)] }).catch(() => {});
                    }
                }

                return interaction.update({ content: 'Çekilişten başarıyla ayrıldın.', components: [] });
            } else {
                return interaction.update({ content: 'Zaten çekilişte değilsin.', components: [] });
            }
        }

        if (interaction.customId === 'btn_gw_participants') {
            const gw = activeGiveaways.get(interaction.message.id);
            if (!gw) {
                return interaction.reply({ content: 'Bu çekilişe ait veri bulunamadı.', flags: MessageFlags.Ephemeral });
            }

            const pageData = getParticipantsPageData(gw, 1);
            return interaction.reply({ embeds: pageData.embeds, components: pageData.components, flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId.startsWith('gwp_')) {
            const parts = interaction.customId.split('_');
            const action = parts[1];
            const msgId = parts[2];
            const currentPage = parseInt(parts[3]);

            const gw = activeGiveaways.get(msgId);
            if (!gw) {
                return interaction.update({ content: 'Bu çekiliş artık aktif değil.', embeds: [], components: [] });
            }

            let newPage = action === 'next' ? currentPage + 1 : currentPage - 1;
            const pageData = getParticipantsPageData(gw, newPage);
            
            return interaction.update({ embeds: pageData.embeds, components: pageData.components });
        }

        if (interaction.customId.startsWith('del_media_')) {
            const ownerId = interaction.customId.replace('del_media_', '');
            if (interaction.user.id === ownerId || interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                await interaction.message.delete().catch(() => {});
            } else {
                await interaction.reply({ content: 'Bu medyayı silmek için yetkiniz yok.', flags: MessageFlags.Ephemeral });
            }
            return;
        }

        if (interaction.customId.startsWith('color_')) {
            const userId = interaction.user.id;
            if (!customRoleSetup.has(userId) || customRoleSetup.get(userId).step !== 'color') return;

            const setupData = customRoleSetup.get(userId);
            const hexColor = interaction.customId.replace('color_', '#');
            
            customRoleSetup.set(userId, { ...setupData, step: 'icon', color: hexColor });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('skip_icon').setLabel('Atla').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('cancel_setup').setLabel('İptal Et').setStyle(ButtonStyle.Danger)
            );

            await interaction.update({ 
                embeds: [createEmbed('Özel Rol Kurulumu (Adım 3/3)', `Rol rengini belirlediniz. İsteğe bağlı olarak bu kanala bir resim göndererek rolünüze ikon ekleyebilirsiniz.\nİstemiyorsanız **Atla** butonuna basabilirsiniz.`, 0x5865F2)], 
                components: [row] 
            });
        }

        if (interaction.customId === 'skip_icon') {
            const userId = interaction.user.id;
            if (!customRoleSetup.has(userId) || customRoleSetup.get(userId).step !== 'icon') return;

            const setupData = customRoleSetup.get(userId);
            await interaction.deferUpdate();
            
            await finalizeCustomRoleSetup(interaction.guild, interaction.member, setupData, null, async (embed) => {
                await interaction.editReply({ embeds: [embed], components: [] });
            });
        }

        if (interaction.customId === 'cancel_setup') {
            const userId = interaction.user.id;
            if (!customRoleSetup.has(userId)) return;

            customRoleSetup.delete(userId);
            await interaction.update({ embeds: [createEmbed('İptal Edildi', 'Özel rol kurulum işlemi iptal edildi.', 0xE74C3C)], components: [] });
        }

        if (interaction.customId.startsWith('confirm_delete_')) {
            const roleId = interaction.customId.replace('confirm_delete_', '');
            const guild = interaction.guild;
            const role = guild.roles.cache.get(roleId);

            if (role) {
                try {
                    await role.delete(`${interaction.user.tag} kendi isteğiyle özel rolünü sildi.`);
                    userCustomRoles.delete(interaction.user.id);
                    await CustomRole.destroy({ where: { userId: interaction.user.id } }).catch(() => {});
                    await interaction.update({ embeds: [createEmbed('Rol Silindi', 'Özel rolünüz başarıyla silindi.', 0x2ECC71)], components: [] });
                    await sendLog(guild, `${E.copkutusu} Özel Rol Silindi`, `**Silen:** ${interaction.user.tag}\n**Rol:** ${role.name}`, 0xE74C3C);
                } catch (error) {
                    await interaction.update({ embeds: [createErrorEmbed('Rol silinirken yetki hatası oluştu.')], components: [] });
                }
            } else {
                userCustomRoles.delete(interaction.user.id);
                await CustomRole.destroy({ where: { userId: interaction.user.id } }).catch(() => {});
                await interaction.update({ embeds: [createErrorEmbed('Rol zaten silinmiş veya bulunamadı.')], components: [] });
            }
        }

        if (interaction.customId === 'cancel_delete') {
            await interaction.update({ embeds: [createEmbed('İşlem İptal Edildi', 'Rol silme işlemi iptal edildi.', 0x5865F2)], components: [] });
        }
        
        if (interaction.customId === 'btn_open_mod_form') {
            if (pendingApplications.has(interaction.user.id)) {
                return interaction.reply({ 
                    embeds: [createErrorEmbed('Zaten yetkililer tarafından değerlendirilmeyi bekleyen bir başvurunuz bulunuyor. Lütfen sonucun açıklanmasını bekleyin.')], 
                    flags: MessageFlags.Ephemeral 
                });
            }
            
            const modal1 = new ModalBuilder().setCustomId('modal_mod_part1').setTitle('Moderatör Başvurusu (Aşama 1/2)');

            const q1 = new TextInputBuilder()
                .setCustomId('q1')
                .setLabel('Daha önce yetkili oldun mu? Görevlerin?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Daha önce herhangi bir Discord sunucusunda yetkili/moderatör oldun mu? Neler yaptın?')
                .setRequired(true);
                
            const q2 = new TextInputBuilder()
                .setCustomId('q2')
                .setLabel('Discord aktiflik süren ve saatlerin?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Günlük olarak ortalama kaç saat aktif olabiliyorsun ve hangi saat aralıklarındasın?")
                .setRequired(true);
                
            const q3 = new TextInputBuilder()
                .setCustomId('q3')
                .setLabel('Neden bizi seçiyorsun?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Neden bizim sunucumuzda moderatör olmak istiyorsun?')
                .setRequired(true);
                
            const q4 = new TextInputBuilder()
                .setCustomId('q4')
                .setLabel('Spam/Raid durumunda ne yaparsın?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Sunucuya bir anda spam veya reklam saldırısı başlarsa alacağın önlemler ne olur?')
                .setRequired(true);
                
            const q5 = new TextInputBuilder()
                .setCustomId('q5')
                .setLabel('Tartışan üyelere nasıl müdahale edersin?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('İki üye tartışmaya ve hakaret etmeye başlarsa, onlara nasıl müdahale edersin?')
                .setRequired(true);

            modal1.addComponents(
                new ActionRowBuilder().addComponents(q1),
                new ActionRowBuilder().addComponents(q2),
                new ActionRowBuilder().addComponents(q3),
                new ActionRowBuilder().addComponents(q4),
                new ActionRowBuilder().addComponents(q5)
            );

            await interaction.showModal(modal1);
        }

        if (interaction.customId === 'btn_mod_part2') {
            const cacheData = formCache.get(interaction.user.id);
            if (!cacheData) {
                return interaction.reply({ embeds: [createErrorEmbed('Başvuru süreniz doldu veya bir hata oluştu. Lütfen baştan başlayın.')], flags: MessageFlags.Ephemeral });
            }

            const modal2 = new ModalBuilder().setCustomId('modal_mod_part2').setTitle('Moderatör Başvurusu (Aşama 2/2)');

            const q6 = new TextInputBuilder()
                .setCustomId('q6')
                .setLabel('İyi bir moderatörün 3 özelliği?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Sence iyi bir moderatörün en önemli üç özelliği ne olmalıdır?')
                .setRequired(true);
                
            const q7 = new TextInputBuilder()
                .setCustomId('q7')
                .setLabel('Sohbeti canlandırmak için ne yaparsın?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Sunucudaki üyelerin daha aktif olması ve sohbetin canlanması için neler yapabilirsin?')
                .setRequired(true);
                
            const q8 = new TextInputBuilder()
                .setCustomId('q8')
                .setLabel('Kararsız kaldığın durumda ne yaparsın?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Karar vermekte zorlandığın veya nasıl bir ceza vereceğinden emin olmadığın bir durumda ne yaparsın?')
                .setRequired(true);

            modal2.addComponents(
                new ActionRowBuilder().addComponents(q6),
                new ActionRowBuilder().addComponents(q7),
                new ActionRowBuilder().addComponents(q8)
            );

            await interaction.showModal(modal2);
        }

        if (interaction.customId === 'ticket_close_btn') {
            const channel = interaction.channel;
            const topic = channel.topic || '';
            const ownerIdMatch = topic.match(/OWNER:(\d+)/);
            const ownerId = ownerIdMatch ? ownerIdMatch[1] : null;

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && interaction.user.id !== ownerId) {
                return interaction.reply({ embeds: [createErrorEmbed('Bu bileti kapatmak için yetkiniz bulunmamaktadır.')], flags: MessageFlags.Ephemeral });
            }

            if (ownerId) {
                await channel.permissionOverwrites.edit(ownerId, {
                    ViewChannel: false,
                    SendMessages: false
                });
            }

            const closedEmbed = new EmbedBuilder()
                .setTitle(`${E.kanalkapa} Bilet Kapatıldı`)
                .setDescription(`Bu bilet <@${interaction.user.id}> tarafından kapatılmıştır.\n\n${ownerId ? `> ${E.bilet} **Bilet Sahibi:** <@${ownerId}>` : ''}\n> ${E.zamanasimi} **Kapatma Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>`)
                .setColor(0xE74C3C)
                .setTimestamp()
                .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() });

            const closedActionsMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_closed_actions')
                .setPlaceholder('Bilet işlemini seçin...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Bileti Yeniden Aç')
                        .setDescription('Bileti tekrar aktif hale getirir ve sahibine erişim verir.')
                        .setValue('ticket_reopen')
                        .setEmoji(E_ID.kanalac),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Bileti Sil')
                        .setDescription('Bu kanalı kalıcı olarak siler.')
                        .setValue('ticket_delete')
                        .setEmoji(E_ID.copkutusu)
                );

            const actionsRow = new ActionRowBuilder().addComponents(closedActionsMenu);

            await interaction.reply({ embeds: [closedEmbed], components: [actionsRow] });
            await sendLog(
                interaction.guild,
                `${E.kanalkapa} Bilet Kapatıldı`,
                `**Kanal:** ${channel.name}\n**Kapatan:** ${interaction.user.tag}${ownerId ? `\n**Bilet Sahibi:** <@${ownerId}>` : ''}`,
                0xE74C3C
            );
        }

        if (interaction.customId.startsWith('mod_approve_') || interaction.customId.startsWith('mod_reject_')) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ embeds: [createErrorEmbed('Bu işlemi sadece yöneticiler yapabilir.')], flags: MessageFlags.Ephemeral });
            }

            const isApprove = interaction.customId.startsWith('mod_approve_');
            const targetUserId = interaction.customId.split('_')[2];
            const targetUser = await client.users.fetch(targetUserId).catch(() => null);

            pendingApplications.delete(targetUserId);

            const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

            if (isApprove) {
                originalEmbed.setColor(0x2ECC71);
                originalEmbed.addFields({ name: 'Durum', value: `${E.onay} <@${interaction.user.id}> tarafından onaylandı.` });

                const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                if (targetMember) {
                    await targetMember.roles.add('1473256763028672512').catch(err => {});
                }
                
                if (targetUser) {
                    const dmEmbed = createEmbed(
                        `${E.onay} Başvurunuz Onaylandı`, 
                        `Merhaba **${targetUser.username}**, \n\n**${interaction.guild.name}** sunucusu için yapmış olduğunuz moderatör başvurusu yetkili ekibimiz tarafından incelendi ve **ONAYLANDI**! \n\nTebrikler! Ekibimiz sizinle en kısa sürede iletişime geçecektir.`, 
                        0x2ECC71
                    );
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            } else {
                originalEmbed.setColor(0xE74C3C);
                originalEmbed.addFields({ name: 'Durum', value: `${E.red} <@${interaction.user.id}> tarafından reddedildi.` });
                
                if (targetUser) {
                    const dmEmbed = createEmbed(
                        `${E.red} Başvurunuz Reddedildi`, 
                        `Merhaba **${targetUser.username}**, \n\n**${interaction.guild.name}** sunucusu için yapmış olduğunuz moderatör başvurusu yetkili ekibimiz tarafından detaylıca incelendi ve maalesef **REDDEDİLDİ**. \n\nİlginiz için teşekkür ederiz. İlerleyen dönemlerde eksiklerinizi tamamlayarak tekrar başvuru yapabilirsiniz.`, 
                        0xE74C3C
                    );
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            }

            await interaction.update({ embeds: [originalEmbed], components: [] });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_giveaway') {
            const title = interaction.fields.getTextInputValue('gw_title');
            const desc = interaction.fields.getTextInputValue('gw_desc');
            const winnersCount = parseInt(interaction.fields.getTextInputValue('gw_winners'));
            const durationHours = parseFloat(interaction.fields.getTextInputValue('gw_duration'));

            if (isNaN(winnersCount) || winnersCount < 1 || isNaN(durationHours) || durationHours <= 0) {
                return interaction.reply({ content: 'Lütfen sayısal değerleri geçerli bir şekilde girin.', flags: MessageFlags.Ephemeral });
            }

            const durationMs = Math.floor(durationHours * 60 * 60 * 1000);
            const endsAt = Date.now() + durationMs;

            const embed = new EmbedBuilder()
                .setTitle(`${E.konfeti} ${title}`)
                .setDescription(`Katılmak için butona tıkla!\n\n**Açıklama:** ${desc}\n\n**Kazanan Sayısı:** ${winnersCount}\n**Başlatan:** <@${interaction.user.id}>\n**Bitiş:** <t:${Math.floor(endsAt / 1000)}:R> (<t:${Math.floor(endsAt / 1000)}:T>)`)
                .setColor(0x5865F2)
                .setTimestamp(endsAt);

            const joinButton = new ButtonBuilder()
                .setCustomId('btn_gw_join')
                .setLabel('0')
                .setEmoji(E_ID.konfeti)
                .setStyle(ButtonStyle.Primary);

            const participantsButton = new ButtonBuilder()
                .setCustomId('btn_gw_participants')
                .setLabel('Katılımcılar')
                .setEmoji(E_ID.uye)
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(joinButton, participantsButton);

            const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

            activeGiveaways.set(msg.id, {
                messageId: msg.id,
                channelId: interaction.channel.id,
                participants: new Set(),
                winnersCount: winnersCount,
                title: title,
                desc: desc,
                host: interaction.user.id
            });

            await Giveaway.create({
                messageId: msg.id,
                channelId: interaction.channel.id,
                title: title,
                desc: desc,
                winnersCount: winnersCount,
                endsAt: endsAt,
                host: interaction.user.id,
                participants: [],
                status: 'active'
            }).catch(() => {});

            setTimeout(() => {
                endGiveaway(msg.id);
            }, durationMs);
        }

        if (interaction.customId === 'modal_mod_part1') {
            const a1 = interaction.fields.getTextInputValue('q1');
            const a2 = interaction.fields.getTextInputValue('q2');
            const a3 = interaction.fields.getTextInputValue('q3');
            const a4 = interaction.fields.getTextInputValue('q4');
            const a5 = interaction.fields.getTextInputValue('q5');

            if (formCache.has(interaction.user.id)) {
                clearTimeout(formCache.get(interaction.user.id).timer);
            }

            formCache.set(interaction.user.id, {
                answers: { a1, a2, a3, a4, a5 },
                timer: setTimeout(() => formCache.delete(interaction.user.id), 15 * 60 * 1000)
            });

            const nextButton = new ButtonBuilder()
                .setCustomId('btn_mod_part2')
                .setLabel('Aşama 2\'ye Geç')
                .setStyle(ButtonStyle.Primary)
                .setEmoji(E_ID.tekrar);

            const row = new ActionRowBuilder().addComponents(nextButton);

            await interaction.reply({ 
                content: `${E.onay} İlk 5 soruyu başarıyla doldurdun! Başvurunu tamamlamak için aşağıdaki butona tıklayarak son 3 soruyu yanıtla.`, 
                components: [row],
                flags: MessageFlags.Ephemeral 
            });
        }

        if (interaction.customId === 'modal_mod_part2') {
            const cacheData = formCache.get(interaction.user.id);
            if (!cacheData) {
                return interaction.reply({ embeds: [createErrorEmbed('Başvuru süreniz doldu veya bir hata oluştu. Lütfen baştan başlayın.')], flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const { a1, a2, a3, a4, a5 } = cacheData.answers;
            const a6 = interaction.fields.getTextInputValue('q6');
            const a7 = interaction.fields.getTextInputValue('q7');
            const a8 = interaction.fields.getTextInputValue('q8');

            clearTimeout(cacheData.timer);
            formCache.delete(interaction.user.id);

            const resultChannelId = logChannels.get(interaction.guild.id);
            if (resultChannelId) {
                const resultChannel = interaction.guild.channels.cache.get(resultChannelId);
                if (resultChannel) {
                    const appEmbed = new EmbedBuilder()
                        .setTitle(`${E.forum} Yeni Moderatör Başvurusu`)
                        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                        .setColor(0x3498DB)
                        .addFields(
                            { name: '👤 Başvuran', value: `<@${interaction.user.id}> (ID: ${interaction.user.id})`, inline: false },
                            { name: '1️⃣ Daha önce yetkili oldun mu?', value: a1, inline: false },
                            { name: '2️⃣ Aktiflik saatlerin?', value: a2, inline: false },
                            { name: '3️⃣ Neden biz?', value: a3, inline: false },
                            { name: '4️⃣ Spam/Raid durumunda alacağın önlemler?', value: a4, inline: false },
                            { name: '5️⃣ Tartışmalara müdahale?', value: a5, inline: false },
                            { name: '6️⃣ İyi modun 3 özelliği?', value: a6, inline: false },
                            { name: '7️⃣ Sohbet canlandırma?', value: a7, inline: false },
                            { name: '8️⃣ Kararsız kalınan anlar?', value: a8, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Azuron Türkiye Başvuru Sistemi' });

                    const approveBtn = new ButtonBuilder()
                        .setCustomId(`mod_approve_${interaction.user.id}`)
                        .setLabel('Onayla')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji(E_ID.onay);

                    const rejectBtn = new ButtonBuilder()
                        .setCustomId(`mod_reject_${interaction.user.id}`)
                        .setLabel('Reddet')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji(E_ID.red);

                    const actionRow = new ActionRowBuilder().addComponents(approveBtn, rejectBtn);

                    await resultChannel.send({ embeds: [appEmbed], components: [actionRow] });
                    
                    pendingApplications.add(interaction.user.id);
                    
                    await interaction.editReply({ embeds: [createEmbed('Başarılı', 'Başvuru formunuz yetkililere başarıyla iletildi. İlginiz için teşekkür ederiz.', 0x2ECC71)] });
                } else {
                    await interaction.editReply({ embeds: [createErrorEmbed('Başvuru gönderilecek kanal bulunamadı. Lütfen log kanalı ayarlamalarını kontrol edin.')] });
                }
            } else {
                await interaction.editReply({ embeds: [createErrorEmbed('Sunucuda log kanalı ayarlanmadığı için başvuru gönderilemedi.')] });
            }
        }

        if (
            interaction.customId === 'modal_ticket_open_support_ticket' ||
            interaction.customId === 'modal_ticket_open_report_ticket' ||
            interaction.customId === 'modal_ticket_open_suggestion_ticket'
        ) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const topic = interaction.fields.getTextInputValue('ticket_topic');
            const user = interaction.user;
            const guild = interaction.guild;

            const typeKeyMap = {
                modal_ticket_open_support_ticket: { label: `${E.bilet} Destek`, color: 0x5865F2 },
                modal_ticket_open_report_ticket: { label: `${E.duyuru2} Şikayet`, color: 0xE74C3C },
                modal_ticket_open_suggestion_ticket: { label: `${E.yildiz} Öneri`, color: 0xF1C40F }
            };
            const ticketType = typeKeyMap[interaction.customId];

            const ticketCategory = guild.channels.cache.find(c =>
               c.name === `🎫 Bilet Sistemi` && c.type === ChannelType.GuildCategory
            );

            if (!ticketCategory) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Bilet sistemi kategorisi bulunamadı. Lütfen bir yöneticiden `/bilet oluştur` komutunu çalıştırmasını isteyin.')]
                });
            }

            const existingTicket = guild.channels.cache.find(c =>
                c.topic && c.topic.includes(`OWNER:${user.id}`) && c.parentId === ticketCategory.id
            );

            if (existingTicket) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(`Zaten açık bir biletiniz var: <#${existingTicket.id}>\nLütfen mevcut biletiniz kapatılmadan yeni bilet açmayınız.`)]
                });
            }

            const safeUsername = user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'kullanici';
            
            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ];

            const staffRoleId = ticketStaffRoles.get(guild.id);
            if (staffRoleId) {
                permissionOverwrites.push({
                    id: staffRoleId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                });
            }

            const staffRoles = guild.roles.cache.filter(r =>
                r.permissions.has(PermissionsBitField.Flags.ManageMessages) && r.id !== guild.id && r.id !== staffRoleId
            );

            staffRoles.forEach(role => {
                permissionOverwrites.push({
                    id: role.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                });
            });

            const ticketChannel = await guild.channels.create({
                name: `${safeUsername}-bilet`,
                type: ChannelType.GuildText,
                parent: ticketCategory.id,
                topic: `OWNER:${user.id} | Tür: ${ticketType.label}`,
                permissionOverwrites: permissionOverwrites
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`${ticketType.label} Bileti`)
                .setDescription(
                    `Merhaba <@${user.id}>, biletiniz başarıyla oluşturuldu!\n\n` +
                    `> **${E.forum} Bilet Türü:** ${ticketType.label}\n` +
                    `> **${E.duzenle} Konu:** ${topic}\n` +
                    `> **${E.uye2} Bilet Sahibi:** <@${user.id}>\n` +
                    `> **${E.kayit} Oluşturulma:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `Yetkili ekibimiz en kısa sürede sizinle ilgilenecektir. Lütfen bekleyiniz.`
                )
                .setColor(ticketType.color)
                .setTimestamp()
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() });

            const closeButton = new ButtonBuilder()
                .setCustomId('ticket_close_btn')
                .setLabel('Bileti Kapat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji(E_ID.kanalkapa);

            const closeRow = new ActionRowBuilder().addComponents(closeButton);

            let pingContent = `<@${user.id}>`;
            if (staffRoleId) {
                pingContent += ` <@&${staffRoleId}>`;
            }

            await ticketChannel.send({
                content: pingContent,
                embeds: [ticketEmbed],
                components: [closeRow]
            });

            await interaction.editReply({
                embeds: [createEmbed(
                    `${E.onay} Bilet Oluşturuldu`,
                    `Biletiniz başarıyla oluşturuldu! <#${ticketChannel.id}>`,
                    0x2ECC71
                )]
            });

            await sendLog(
                guild,
                `${E.bilet} Yeni Bilet Açıldı`,
                `**Bilet Sahibi:** ${user.tag}\n**Tür:** ${ticketType.label}\n**Kanal:** <#${ticketChannel.id}>\n**Konu:** ${topic}`,
                ticketType.color
            );
            return;
        }

        if (interaction.customId === 'modal_rename') {
            const newName = interaction.fields.getTextInputValue('new_name');
            await interaction.channel.setName(`🔊 ${newName}`);
            interaction.reply({ embeds: [createEmbed('Güncelleme Başarılı', `Kanal adı **${newName}** olarak değiştirildi.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId === 'modal_limit') {
            const limit = parseInt(interaction.fields.getTextInputValue('new_limit'));
            if (!isNaN(limit) && limit >= 0 && limit < 100) {
                await interaction.channel.setUserLimit(limit);
                interaction.reply({ embeds: [createEmbed('Güncelleme Başarılı', `Kullanıcı limiti **${limit === 0 ? 'Sınırsız' : limit}** olarak ayarlandı.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
            } else {
                interaction.reply({ embeds: [createErrorEmbed('Lütfen 0 ile 99 arasında geçerli bir sayı giriniz.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'modal_invite') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const targetId = interaction.fields.getTextInputValue('invite_id');
            try {
                const targetUser = await client.users.fetch(targetId);
                const channel = interaction.channel;
                const invite = await channel.createInvite({ maxUses: 1, unique: true });
                const inviteEmbed = createEmbed(`${E.forum} Davet`, `Merhaba,\n\n**${interaction.user.tag}** sizi **${interaction.guild.name}** sunucusundaki özel sesli odasına davet etti.`, 0x2ECC71)
                    .addFields({ name: 'Katılım Bağlantısı', value: `[Giriş Yap](${invite.url})` });
                await targetUser.send({ embeds: [inviteEmbed] });
                await interaction.editReply({ embeds: [createEmbed('İletildi', `Davet **${targetUser.tag}** kullanıcısına başarıyla gönderildi.`, 0x2ECC71)] });
            } catch (e) {
                await interaction.editReply({ embeds: [createErrorEmbed('Kullanıcı bulunamadı veya DM kutusu kapalı.')] });
            }
        }

        if (interaction.customId === 'modal_kick') {
            const targetId = interaction.fields.getTextInputValue('kick_id');
            try {
                const targetMember = await interaction.guild.members.fetch(targetId);
                if (targetMember.voice.channelId === interaction.channel.id) {
                    await targetMember.voice.disconnect();
                    interaction.reply({ embeds: [createEmbed('İşlem Başarılı', 'Kullanıcı odadan atıldı.', 0xE67E22)], flags: MessageFlags.Ephemeral });
                } else {
                    interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı şu anda bu odada bulunmamaktadır.')], flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                interaction.reply({ embeds: [createErrorEmbed('Kullanıcı sunucuda bulunamadı veya ID hatalı.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'modal_transfer') {
            const targetId = interaction.fields.getTextInputValue('transfer_id');
            try {
                const targetMember = await interaction.guild.members.fetch(targetId);
                if (targetMember.voice.channelId === interaction.channel.id) {
                    await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ManageChannels: null, MoveMembers: null });
                    await interaction.channel.permissionOverwrites.edit(targetId, { Connect: true, ManageChannels: true, MoveMembers: true });
                    interaction.reply({ embeds: [createEmbed('Oda Devredildi', `Odanın sahipliği **${targetMember.user.tag}** kullanıcısına devredildi.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
                } else {
                    interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı şu anda bu odada bulunmamaktadır.')], flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                interaction.reply({ embeds: [createErrorEmbed('Kullanıcı sunucuda bulunamadı veya ID hatalı.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'modal_add_admin') {
            const targetId = interaction.fields.getTextInputValue('admin_id');
            try {
                const targetMember = await interaction.guild.members.fetch(targetId);
                if (targetMember.voice.channelId === interaction.channel.id) {
                    await interaction.channel.permissionOverwrites.edit(targetId, { Connect: true, ManageChannels: true, MoveMembers: true });
                    interaction.reply({ embeds: [createEmbed('Yetkili Eklendi', `**${targetMember.user.tag}** artık bu odada yetkili.`, 0x2ECC71)], flags: MessageFlags.Ephemeral });
                } else {
                    interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı şu anda bu odada bulunmamaktadır.')], flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                interaction.reply({ embeds: [createErrorEmbed('Kullanıcı sunucuda bulunamadı veya ID hatalı.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'modal_suggestion') {
            const text = interaction.fields.getTextInputValue('suggestion_text');
            const suggestionChannelId = logChannels.get(interaction.guild.id);
            if (suggestionChannelId) {
                const suggestionChannel = interaction.guild.channels.cache.get(suggestionChannelId);
                if (suggestionChannel) {
                    const suggestEmbed = createEmbed(`${E.yildiz} Yeni Öneri / İstek`, text, 0xF1C40F)
                        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                        .addFields({ name: 'Kullanıcı ID', value: interaction.user.id });
                    await suggestionChannel.send({ embeds: [suggestEmbed] });
                    await interaction.reply({ embeds: [createEmbed('İletildi', 'Öneriniz yetkili ekibe başarıyla iletilmiştir. Teşekkür ederiz.', 0x2ECC71)], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ embeds: [createErrorEmbed('Hata: Öneri kanalı (Log kanalı) bulunamadı.')], flags: MessageFlags.Ephemeral });
                }
            } else {
                await interaction.reply({ embeds: [createErrorEmbed('Hata: Sunucuda log kanalı ayarlanmamış.')], flags: MessageFlags.Ephemeral });
            }
        }
    }
});

client.on('messageDelete', async message => {
    if (!message.guild || !message.author || message.author.bot) return;

    const logChannelId = logChannels.get(message.guild.id);
    if (!logChannelId) return;
    
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    let executor = message.author.tag;
    const fetchedLogs = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
    const deletionLog = fetchedLogs.entries.first();

    if (deletionLog && deletionLog.target.id === message.author.id && deletionLog.extra.channel.id === message.channel.id && deletionLog.createdAt > Date.now() - 5000) {
        executor = deletionLog.executor.tag;
    }

    let description = `**Mesaj Sahibi:** <@${message.author.id}> (${message.author.tag})\n**Silen Kişi:** ${executor}\n**Kanal:** <#${message.channel.id}>\n`;
    let contentUrl = null;

    if (message.content) {
        description += `\n**Silinen İçerik:**\n${message.content}`;
        const tenorMatch = message.content.match(/https?:\/\/tenor\.com\/view\/[a-zA-Z0-9-]+/);
        const gifMatch = message.content.match(/https?:\/\/[^\s]+\.(gif|png|jpg|jpeg)/i);
        if (tenorMatch) {
            contentUrl = tenorMatch[0] + ".gif";
        } else if (gifMatch) {
            contentUrl = gifMatch[0];
        }
    }

    const images = [];
    const files = [];

    if (message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                images.push(attachment.proxyURL);
            } else {
                files.push({ attachment: attachment.proxyURL, name: attachment.name });
            }
        });
    }

    if (!message.content && files.length === 0 && images.length === 0 && !contentUrl) {
        description += `\n*İçerik bulunamadı veya sadece sistem mesajı/embed.*`;
    }

    const embeds = [];
    const baseEmbedUrl = "https://discord.com";

    const mainEmbed = createEmbed(`${E.copkutusu} Mesaj Silindi`, description, 0xE74C3C).setURL(baseEmbedUrl);

    if (images.length > 0) {
        mainEmbed.setImage(images[0]);
        embeds.push(mainEmbed);
        for (let i = 1; i < images.length && i < 4; i++) {
            const extraEmbed = new EmbedBuilder().setURL(baseEmbedUrl).setImage(images[i]);
            embeds.push(extraEmbed);
        }
    } else if (contentUrl) {
        mainEmbed.setImage(contentUrl);
        embeds.push(mainEmbed);
    } else {
        embeds.push(mainEmbed);
    }

    await logChannel.send({ embeds: embeds, files: files }).catch(() => {});
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || !oldMessage.author || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const logChannelId = logChannels.get(oldMessage.guild.id);
    if (!logChannelId) return;
    
    const logChannel = oldMessage.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const updateEmbed = createEmbed(
        `${E.duzenle} Mesaj Düzenlendi`,
        `**Kullanıcı:** <@${oldMessage.author.id}> (${oldMessage.author.tag})\n**Kanal:** <#${oldMessage.channel.id}> - [Mesaja Git](${newMessage.url})\n\n**Eski İçerik:**\n${oldMessage.content || '*Yok*'}\n\n**Yeni İçerik:**\n${newMessage.content || '*Yok*'}`,
        0xF1C40F
    );

    await logChannel.send({ embeds: [updateEmbed] });
});

async function getGeneratorChannelId(guild) {
    const c = guild.channels.cache.find(c => c.name === '➕ Oda Oluştur' && c.type === ChannelType.GuildVoice);
    return c ? c.id : null;
}

client.on("debug", console.log);
client.on("error", console.error);

client.once('ready', () => {
    console.log(`Bot basariyla aktif oldu: ${client.user.tag}`);
});

client.login(process.env.TOKEN)
    .then(() => {
        console.log("Token dogru.");
    })
    .catch(err => {
        console.error("Hata:", err);
    });
