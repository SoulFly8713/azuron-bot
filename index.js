const {
    Client, GatewayIntentBits, Partials, PermissionsBitField, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder,
    TextInputStyle, REST, Routes, SlashCommandBuilder, ActivityType, MessageFlags,
    AuditLogEvent
} = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require("express");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();

app.get("/", (req, res) => {
    res.send("Bot aktif 🚀");
});

app.listen(process.env.PORT || 3000, () => {});

process.on('unhandledRejection', error => {});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Channel]
});

client.on('error', error => {});

const LOG_CHANNEL_ID = '1470356769653133368';
const SUGGESTION_CHANNEL_ID = '1470356769653133368';
const MOD_FORM_CHANNEL_ID = '1470356769653133368';
const WELCOME_CHANNEL_ID = '1471564344578932829';
const BOT_VOICE_CHANNEL_ID = '1473737542166774042';
const TICKET_STAFF_ROLE_ID = '1464184391881457704';
const TARGET_ROLE_ID = '1473029465587323076';

const linkProtection = new Set();
const deleteTimers = new Map();
const formCache = new Map();
const pendingApplications = new Set();
const autoRoles = new Map();
const customRoleSetup = new Map();
const userCustomRoles = new Map();

let sonMangaLinki = "";
const TAKIP_EDILECEK_MANGA = 'https://sadscans.net/series/chainsaw-man';

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
        .setTitle('❌ İşlem Başarısız')
        .setDescription(description)
        .setColor(0xE74C3C)
        .setTimestamp()
        .setFooter({ text: 'Hata', iconURL: client.user.displayAvatarURL() });
}

async function sendLog(guild, title, description, color = 0xE67E22) {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
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
        customRoleSetup.delete(member.id);

        const successEmbed = createEmbed('Özel Rol Oluşturuldu 🎉', `**${setupData.name}** isimli özel rolünüz başarıyla oluşturuldu ve size verildi!`, 0x2ECC71);

        await replyMethod(successEmbed);
        await sendLog(guild, '✨ Özel Rol Oluşturuldu', `**Oluşturan:** ${member.user.tag}\n**Rol Adı:** ${setupData.name}\n**Renk:** ${setupData.color}`, 0x2ECC71);
    } catch (error) {
        customRoleSetup.delete(member.id);
        await replyMethod(createErrorEmbed('Rol oluşturulurken bir hata meydana geldi. Sunucunun rol ikonlarını desteklediğinden ve yetkilerimin tam olduğundan emin olun.'));
    }
}

client.on('clientReady', async () => {
    client.user.setActivity({
        name: 'Azuron Türkiye',
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/discord'
    });

    setInterval(async () => {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            await page.goto(TAKIP_EDILECEK_MANGA, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            const data = await page.evaluate(() => {
                const sonBolum = document.querySelector('.wp-manga-chapter > a');
                if (!sonBolum) return null;
                return {
                    link: sonBolum.href,
                    baslik: sonBolum.innerText.trim()
                };
            });

            if (data) {
                let tamLink = data.link;
                if (tamLink && !tamLink.startsWith('http')) {
                    tamLink = `https://sadscans.net${tamLink}`;
                }

                if (tamLink && tamLink !== sonMangaLinki && sonMangaLinki !== "") {
                    sonMangaLinki = tamLink;
                    const duyuruKanali = client.channels.cache.get('1453839041886814219');
                    if (duyuruKanali) {
                        const embed = createEmbed('Yeni Bölüm Çıktı! 🎉', `**${data.baslik}** okumaya hazır!\n\n[Hemen Okumak İçin Tıkla](${tamLink})`, 0x5865F2);
                        await duyuruKanali.send({ content: '<@&1471571169105809686>', embeds: [embed] });
                    }
                } else if (sonMangaLinki === "" && tamLink) {
                    sonMangaLinki = tamLink;
                }
            }
        } catch (error) {
            console.error("Manga Hata:", error.message);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }, 60000);

    const voiceChannel = client.channels.cache.get(BOT_VOICE_CHANNEL_ID);
    if (voiceChannel) {
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true
        });
    }

    setInterval(() => {
        const checkVoiceChannel = client.channels.cache.get(BOT_VOICE_CHANNEL_ID);
        if (checkVoiceChannel) {
            const connection = getVoiceConnection(checkVoiceChannel.guild.id);
            if (!connection) {
                joinVoiceChannel({
                    channelId: checkVoiceChannel.id,
                    guildId: checkVoiceChannel.guild.id,
                    adapterCreator: checkVoiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: true
                });
            }
        }
    }, 60000);

    const commands = [
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
            .addSubcommand(s => s.setName('olustur').setDescription('Bilet sistemini sunucuya kurar.'))
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
            .setDescription('Botun gecikme süresini gösterir.')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {}
});

client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (channel) {
        channel.send(`${member} Hoş geldin! Seninle birlikte **${member.guild.memberCount}** kişiyiz!`);
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
    await sendLog(ban.guild, '🔨 Kullanıcı Yasaklandı', `**Kullanıcı:** ${ban.user.tag}\n**Yetkili:** ${executor}\n**Sebep:** ${ban.reason || 'Belirtilmedi'}`, 0xC0392B);
});

client.on('guildBanRemove', async ban => {
    const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove });
    const unbanLog = fetchedLogs.entries.first();
    let executor = 'Bilinmiyor';
    if (unbanLog && unbanLog.target.id === ban.user.id && unbanLog.createdAt > Date.now() - 5000) {
        executor = unbanLog.executor.tag;
    }
    await sendLog(ban.guild, '🔓 Yasaklama Kaldırıldı', `**Kullanıcı:** ${ban.user.tag}\n**Yetkili:** ${executor}`, 0x2ECC71);
});

client.on('guildMemberRemove', async member => {
    const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
    const kickLog = fetchedLogs.entries.first();
    if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > Date.now() - 5000) {
        await sendLog(member.guild, '🚪 Kullanıcı Atıldı', `**Kullanıcı:** ${member.user.tag}\n**Yetkili:** ${kickLog.executor.tag}\n**Sebep:** ${kickLog.reason || 'Belirtilmedi'}`, 0xE67E22);
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
        await sendLog(newMember.guild, '😶 Susturuldu', `**Kullanıcı:** ${newMember.user.tag}\n**Yetkili:** ${executor}\n**Bitiş:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>\n**Sebep:** ${reason}`, 0xF1C40F);
    } else if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
        const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
        const unmuteLog = fetchedLogs.entries.first();
        let executor = 'Bilinmiyor';
        if (unmuteLog && unmuteLog.target.id === newMember.id && unmuteLog.createdAt > Date.now() - 5000 && unmuteLog.changes.some(c => c.key === 'communication_disabled_until')) {
            executor = unmuteLog.executor.tag;
        }
        await sendLog(newMember.guild, '🔊 Susturma Kaldırıldı', `**Kullanıcı:** ${newMember.user.tag}\n**Yetkili:** ${executor}`, 0x2ECC71);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.author.id === '1065161665009700895' && message.mentions.has(client.user.id)) {
        return message.reply('https://tenor.com/view/hmph-hmph-anime-tsundere-gif-25758864');
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
        await newState.setChannel(newChannel);

        const embed = createEmbed(
            `🔊 ${user.username} Yönetim Paneli`,
            `Özel odanız başarıyla oluşturuldu. Aşağıdaki menüyü kullanarak odanızı yönetebilirsiniz.`,
            0x3498DB
        );

        const settingsMenu = new StringSelectMenuBuilder()
            .setCustomId('vc_settings')
            .setPlaceholder('⚙️ Kanal Ayarları')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('İsim Değiştir').setValue('action_name').setEmoji('📝'),
                new StringSelectMenuOptionBuilder().setLabel('Kişi Limiti').setValue('action_limit').setEmoji('🔢'),
                new StringSelectMenuOptionBuilder().setLabel('Davet Et (ID)').setValue('action_invite_id').setEmoji('📩'),
                new StringSelectMenuOptionBuilder().setLabel('Odadan At (ID)').setValue('action_kick_id').setEmoji('🚫'),
                new StringSelectMenuOptionBuilder().setLabel('Odayı Devret (ID)').setValue('action_transfer').setEmoji('👑'),
                new StringSelectMenuOptionBuilder().setLabel('Oda Yetkilisi Ekle (ID)').setValue('action_add_admin').setEmoji('🛡️'),
                new StringSelectMenuOptionBuilder().setLabel('Kilitle').setValue('action_lock').setEmoji('🔒'),
                new StringSelectMenuOptionBuilder().setLabel('Kilidi Aç').setValue('action_unlock').setEmoji('🔓'),
                new StringSelectMenuOptionBuilder().setLabel('Detaylı Bilgi').setValue('action_info').setEmoji('📊'),
                new StringSelectMenuOptionBuilder().setLabel('Odayı Sil').setValue('action_delete').setEmoji('🗑️')
            );

        const row1 = new ActionRowBuilder().addComponents(settingsMenu);
        await newChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row1] });
    }

    if (newState.channel && newState.channel.name.startsWith('🔊')) {
        if (deleteTimers.has(newState.channel.id)) {
            clearTimeout(deleteTimers.get(newState.channel.id));
            deleteTimers.delete(newState.channel.id);
        }
    }

    if (oldState.channel && oldState.channel.name.startsWith('🔊') && oldState.channel.members.size === 0) {
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
            } catch (e) {}
        }, 5000);
        deleteTimers.set(oldState.channel.id, timer);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options, member, guild } = interaction;

        if (commandName === 'ping') {
            return interaction.reply({ content: `🏓 ...pong! ${Math.round(client.ws.ping)} ms`, flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'sunucu-bilgi') {
            const owner = await guild.fetchOwner();
            const embed = createEmbed('🏢 Sunucu Bilgileri', null, 0x5865F2)
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
            const embed = createEmbed('👤 Kullanıcı Bilgileri', null, 0x5865F2)
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
                    return interaction.reply({ 
                        embeds: [createEmbed('Otomatik Rol Kapatıldı', `Otomatik rol sistemi devre dışı bırakıldı. Artık yeni üyelere ${targetRole} rolü **verilmeyecek**.`, 0xE74C3C)] 
                    });
                } 
                else {
                    autoRoles.set(guildId, targetRole.id);
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
                .setTitle('🛡️ Moderatör Başvuru Formu')
                .setDescription(`Sunucumuzun yetkili ekibine katılmak istiyorsan aşağıdaki butona tıklayarak başvuru formunu doldurabilirsin.\n\n⏳ **Son Başvuru:** <t:${endTime}:F> (<t:${endTime}:R>)\n\nLütfen soruları özenle ve dürüstçe yanıtlayın. Form **iki aşamalıdır**, ilk 5 soruyu gönderdikten sonra diğer 3 soru ekrana gelecektir.`)
                .setColor(0x5865F2)
                .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Azuron Türkiye Yetkili Alımı', iconURL: client.user.displayAvatarURL() });

            const formButton = new ButtonBuilder()
                .setCustomId('btn_open_mod_form')
                .setLabel('Formu Doldur')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📝');

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
                            .setEmoji('🔒')
                            .setDisabled(true);
                        
                        const disabledRow = new ActionRowBuilder().addComponents(disabledButton);
                        
                        await fetchedMessage.edit({ components: [disabledRow] });
                    }
                } catch (error) {}
            }, durationMs);
        }

        if (commandName === 'yardım') {
            const helpEmbed = createEmbed('📑 Komut Listesi', 'Aşağıda botun kullanılabilir komutları listelenmiştir.', 0x5865F2)
                .addFields(
                    { name: '🛠️ Genel Komutlar', value: '`/yardım`, `/öneri`, `/ping`, `/sunucu-bilgi`, `/kullanıcı-bilgi`' },
                    { name: '🛡️ Yönetici Komutları', value: '`/mod-form`, `/ses-panel`, `/bilet olustur`, `/link-engel`, `/kick`, `/ban`, `/mute`, `/unmute`, `/sil`, `/rol ayarla`' },
                    { name: '🚀 Takviyeci Komutları', value: '`/özel rol-ayarla`, `/özel rol-sil`' },
                    { name: '🔊 Ses Sistemi', value: 'Özel oda kurmak için **Oda Oluştur** kanalına girmeniz yeterlidir.' },
                    { name: '🎫 Bilet Sistemi', value: '**bilet-oluştur** kanalındaki menüden destek bileti açabilirsiniz.' }
                );
            return interaction.reply({ embeds: [helpEmbed], flags: MessageFlags.Ephemeral });
        }

        if (commandName === 'ses-panel') {
            await interaction.deferReply();
            const category = await guild.channels.create({ name: 'ÖZEL ODALAR', type: ChannelType.GuildCategory });
            const voiceChannel = await guild.channels.create({ name: '➕ Oda Oluştur', type: ChannelType.GuildVoice, parent: category.id });
            await interaction.editReply({
                embeds: [createEmbed('Kurulum Başarılı', `Sistem aktif edilmiştir. <#${voiceChannel.id}> kanalı kullanıma hazırdır.`, 0x2ECC71)]
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
                await sendLog(guild, '🧹 Mesajlar Silindi', `**Yetkili:** ${member.user.tag}\n**Kanal:** <#${interaction.channel.id}>\n**Miktar:** ${silinenler.size} mesaj`, 0x3498DB);
            } catch (error) {
                await interaction.reply({ embeds: [createErrorEmbed('Mesajlar silinemedi.')], flags: MessageFlags.Ephemeral });
            }
        }

        if (commandName === 'link-engel') {
            const sub = options.getSubcommand();
            if (sub === 'aç') {
                linkProtection.add(guild.id);
                interaction.reply({ embeds: [createEmbed('Link Engelleme', 'Link engelleme sistemi **AKTİF** edilmiştir.', 0x2ECC71)] });
            } else if (sub === 'kapa') {
                linkProtection.delete(guild.id);
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
            if (sub === 'olustur') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const existingCategory = guild.channels.cache.find(c =>
                    c.name === '🎫 Bilet Sistemi' && c.type === ChannelType.GuildCategory
                );
                if (existingCategory) {
                    return interaction.editReply({
                        embeds: [createErrorEmbed('Bilet sistemi zaten kurulu. Lütfen mevcut **🎫 Bilet Sistemi** kategorisini kontrol edin.')]
                    });
                }

                const ticketCategory = await guild.channels.create({
                    name: '🎫 Bilet Sistemi',
                    type: ChannelType.GuildCategory
                });

                const ticketSetupChannel = await guild.channels.create({
                    name: 'bilet-oluştur',
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.SendMessages], allow: [PermissionsBitField.Flags.ViewChannel] }
                    ]
                });

                const supportEmbed = new EmbedBuilder()
                    .setTitle('🎫 Destek Sistemi')
                    .setDescription(
                        '**Merhaba, Azuron Türkiye Destek Merkezine Hoş Geldiniz!**\n\n' +
                        'Herhangi bir konuda yardıma ihtiyaç duyuyorsanız aşağıdaki menüyü kullanarak bilet oluşturabilirsiniz.\n\n' +
                        '> 📌 Biletiniz açıldığında yalnızca siz ve yetkili ekibimiz görebilir.\n' +
                        '> ⏱️ Ekibimiz en kısa sürede size geri dönecektir.\n' +
                        '> ❗ Lütfen bilet açmadan önce konunuzu net bir şekilde belirleyin.\n\n' +
                        '**Destek almak için aşağıdaki menüden seçim yapın.**'
                    )
                    .setColor(0x5865F2)
                    .setTimestamp()
                    .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() })
                    .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL());

                const ticketOpenMenu = new StringSelectMenuBuilder()
                    .setCustomId('ticket_open_menu')
                    .setPlaceholder('📋 Bilet türünü seçin...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Destek Bileti Aç')
                            .setDescription('Genel konularda yetkili ekibinden destek alın.')
                            .setValue('open_support_ticket')
                            .setEmoji('🎫'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Şikayet Bileti Aç')
                            .setDescription('Bir kullanıcı hakkında şikayette bulunun.')
                            .setValue('open_report_ticket')
                            .setEmoji('🚨'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Öneri Bileti Aç')
                            .setDescription('Sunucuya özel öneri veya isteklerinizi iletin.')
                            .setValue('open_suggestion_ticket')
                            .setEmoji('💡')
                    );

                const ticketMenuRow = new ActionRowBuilder().addComponents(ticketOpenMenu);

                await ticketSetupChannel.send({ embeds: [supportEmbed], components: [ticketMenuRow] });

                await interaction.editReply({
                    embeds: [createEmbed(
                        '✅ Bilet Sistemi Kuruldu',
                        `Bilet sistemi başarıyla aktif edildi.\n\n📁 **Kategori:** ${ticketCategory.name}\n💬 **Kanal:** <#${ticketSetupChannel.id}>`,
                        0x2ECC71
                    )]
                });
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
                interaction.reply({ embeds: [createEmbed('Uzaklaştırma (Kick)', `**${target.tag}** sunucudan uzaklaştırılmıştır.\n**Gerekçe:** ${reason}`, 0xE67E22)], flags: MessageFlags.Ephemeral });
                await sendLog(guild, '🚪 Kullanıcı Atıldı', `**Yetkili:** ${member.user.tag}\n**Atılan:** ${target.tag}\n**Sebep:** ${reason}`, 0xE67E22);
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
                interaction.reply({ embeds: [createEmbed('Yasaklama (Ban)', `**${target.tag}** sunucudan kalıcı olarak yasaklanmıştır.\n**Gerekçe:** ${reason}`, 0xC0392B)], flags: MessageFlags.Ephemeral });
                await sendLog(guild, '🔨 Kullanıcı Yasaklandı', `**Yetkili:** ${member.user.tag}\n**Yasaklanan:** ${target.tag}\n**Sebep:** ${reason}`, 0xC0392B);
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
                interaction.reply({ embeds: [createEmbed('Süreli Susturma (Timeout)', `**${target.tag}** kullanıcısına **${duration} dakika** boyunca susturulma uygulanmıştır.`, 0xF1C40F)], flags: MessageFlags.Ephemeral });
                await sendLog(guild, '😶 Kullanıcı Susturuldu', `**Yetkili:** ${member.user.tag}\n**Susturulan:** ${target.tag}\n**Süre:** ${duration} Dakika\n**Sebep:** ${reason}`, 0xF1C40F);
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
                await sendLog(guild, '🔊 Susturma Kaldırıldı', `**Yetkili:** ${member.user.tag}\n**Kullanıcı:** ${target.tag}`, 0x2ECC71);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**Hata:** İşlem gerçekleştirilemedi. Yetkilerimi kontrol ediniz.')], flags: MessageFlags.Ephemeral });
            }
        }
    }

    if (interaction.isButton()) {
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
                    await interaction.update({ embeds: [createEmbed('Rol Silindi', 'Özel rolünüz başarıyla silindi.', 0x2ECC71)], components: [] });
                    await sendLog(guild, '🗑️ Özel Rol Silindi', `**Silen:** ${interaction.user.tag}\n**Rol:** ${role.name}`, 0xE74C3C);
                } catch (error) {
                    await interaction.update({ embeds: [createErrorEmbed('Rol silinirken yetki hatası oluştu.')], components: [] });
                }
            } else {
                userCustomRoles.delete(interaction.user.id);
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
                .setTitle('🔒 Bilet Kapatıldı')
                .setDescription(`Bu bilet <@${interaction.user.id}> tarafından kapatılmıştır.\n\n${ownerId ? `> 🎫 **Bilet Sahibi:** <@${ownerId}>` : ''}\n> ⏰ **Kapatma Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>`)
                .setColor(0xE74C3C)
                .setTimestamp()
                .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() });

            const closedActionsMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_closed_actions')
                .setPlaceholder('🔧 Bilet işlemini seçin...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Bileti Yeniden Aç')
                        .setDescription('Bileti tekrar aktif hale getirir ve sahibine erişim verir.')
                        .setValue('ticket_reopen')
                        .setEmoji('🔓'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Bileti Sil')
                        .setDescription('Bu kanalı kalıcı olarak siler.')
                        .setValue('ticket_delete')
                        .setEmoji('🗑️')
                );

            const actionsRow = new ActionRowBuilder().addComponents(closedActionsMenu);

            await interaction.reply({ embeds: [closedEmbed], components: [actionsRow] });
            await sendLog(
                interaction.guild,
                '🔒 Bilet Kapatıldı',
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
                originalEmbed.addFields({ name: 'Durum', value: `✅ <@${interaction.user.id}> tarafından onaylandı.` });

                const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                if (targetMember) {
                    await targetMember.roles.add('1473256763028672512').catch(err => {});
                }
                
                if (targetUser) {
                    const dmEmbed = createEmbed(
                        '✅ Başvurunuz Onaylandı', 
                        `Merhaba **${targetUser.username}**, \n\n**${interaction.guild.name}** sunucusu için yapmış olduğunuz moderatör başvurusu yetkili ekibimiz tarafından incelendi ve **ONAYLANDI**! \n\nTebrikler! Ekibimiz sizinle en kısa sürede iletişime geçecektir.`, 
                        0x2ECC71
                    );
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            } else {
                originalEmbed.setColor(0xE74C3C);
                originalEmbed.addFields({ name: 'Durum', value: `❌ <@${interaction.user.id}> tarafından reddedildi.` });
                
                if (targetUser) {
                    const dmEmbed = createEmbed(
                        '❌ Başvurunuz Reddedildi', 
                        `Merhaba **${targetUser.username}**, \n\n**${interaction.guild.name}** sunucusu için yapmış olduğunuz moderatör başvurusu yetkili ekibimiz tarafından detaylıca incelendi ve maalesef **REDDEDİLDİ**. \n\nİlginiz için teşekkür ederiz. İlerleyen dönemlerde eksiklerinizi tamamlayarak tekrar başvuru yapabilirsiniz.`, 
                        0xE74C3C
                    );
                    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                }
            }

            await interaction.update({ embeds: [originalEmbed], components: [] });
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_open_menu') {
            const value = interaction.values[0];
            const typeMap = {
                open_support_ticket: '🎫 Destek',
                open_report_ticket: '🚨 Şikayet',
                open_suggestion_ticket: '💡 Öneri'
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
                await interaction.reply({ embeds: [createEmbed('🗑️ Bilet Silindi', 'Bu bilet kalıcı olarak siliniyor...', 0xE74C3C)] });
                await sendLog(guild, '🗑️ Bilet Silindi', `**Kanal:** ${channel.name}\n**Silen:** ${interaction.user.tag}`, 0xE74C3C);
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
                    .setTitle('🔓 Bilet Yeniden Açıldı')
                    .setDescription(`Bu bilet <@${interaction.user.id}> tarafından yeniden açılmıştır.\n\n<@${ownerId}> Biletiniz yeniden aktif hale getirildi.`)
                    .setColor(0x2ECC71)
                    .setTimestamp()
                    .setFooter({ text: 'Azuron Türkiye Destek Sistemi', iconURL: client.user.displayAvatarURL() });

                const closeAgainButton = new ButtonBuilder()
                    .setCustomId('ticket_close_btn')
                    .setLabel('Bileti Kapat')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒');

                const btnRow = new ActionRowBuilder().addComponents(closeAgainButton);

                await interaction.reply({ embeds: [reopenEmbed], components: [btnRow] });
                await sendLog(guild, '🔓 Bilet Yeniden Açıldı', `**Kanal:** ${channel.name}\n**Açan Yetkili:** ${interaction.user.tag}`, 0x2ECC71);
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
                await channel.delete();
            } else if (selection === 'action_info') {
                const memberCount = channel.members.size;
                const limit = channel.userLimit === 0 ? 'Sınırsız' : channel.userLimit;
                const bitrate = channel.bitrate / 1000;
                const isLocked = channel.permissionOverwrites.resolve(interaction.guild.id)?.deny.has(PermissionsBitField.Flags.Connect) ? '🔒 Kilitli' : '🔓 Açık';
                const region = channel.rtcRegion || 'Otomatik';
                const membersList = channel.members.map(m => m.user.tag).join(', ') || 'Odada kimse yok.';
                const shortMembersList = membersList.length > 1000 ? membersList.substring(0, 997) + '...' : membersList;
                const infoEmbed = createEmbed('📊 Oda İstatistikleri', null, 0x3498DB)
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

    if (interaction.isModalSubmit()) {
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
                .setEmoji('➡️');

            const row = new ActionRowBuilder().addComponents(nextButton);

            await interaction.reply({ 
                content: '✅ İlk 5 soruyu başarıyla doldurdun! Başvurunu tamamlamak için aşağıdaki butona tıklayarak son 3 soruyu yanıtla.', 
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

            const resultChannel = interaction.guild.channels.cache.get(MOD_FORM_CHANNEL_ID);

            if (resultChannel) {
                const appEmbed = new EmbedBuilder()
                    .setTitle('📄 Yeni Moderatör Başvurusu')
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
                    .setEmoji('✅');

                const rejectBtn = new ButtonBuilder()
                    .setCustomId(`mod_reject_${interaction.user.id}`)
                    .setLabel('Reddet')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌');

                const actionRow = new ActionRowBuilder().addComponents(approveBtn, rejectBtn);

                await resultChannel.send({ embeds: [appEmbed], components: [actionRow] });
                
                pendingApplications.add(interaction.user.id);
                
                await interaction.editReply({ embeds: [createEmbed('Başarılı', 'Başvuru formunuz yetkililere başarıyla iletildi. İlginiz için teşekkür ederiz.', 0x2ECC71)] });
            } else {
                await interaction.editReply({ embeds: [createErrorEmbed('Başvuru gönderilecek kanal bulunamadı. Lütfen yöneticilere bildirin.')] });
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
                modal_ticket_open_support_ticket: { label: '🎫 Destek', color: 0x5865F2 },
                modal_ticket_open_report_ticket: { label: '🚨 Şikayet', color: 0xE74C3C },
                modal_ticket_open_suggestion_ticket: { label: '💡 Öneri', color: 0xF1C40F }
            };
            const ticketType = typeKeyMap[interaction.customId];

            const ticketCategory = guild.channels.cache.find(c =>
                c.name === '🎫 Bilet Sistemi' && c.type === ChannelType.GuildCategory
            );

            if (!ticketCategory) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Bilet sistemi kategorisi bulunamadı. Lütfen bir yöneticiden `/bilet olustur` komutunu çalıştırmasını isteyin.')]
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
            const staffRoles = guild.roles.cache.filter(r =>
                r.permissions.has(PermissionsBitField.Flags.ManageMessages) && r.id !== guild.id
            );

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
                    `> **📋 Bilet Türü:** ${ticketType.label}\n` +
                    `> **📝 Konu:** ${topic}\n` +
                    `> **👤 Bilet Sahibi:** <@${user.id}>\n` +
                    `> **📅 Oluşturulma:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
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
                .setEmoji('🔒');

            const closeRow = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({
                content: `<@${user.id}> <@&${TICKET_STAFF_ROLE_ID}>`,
                embeds: [ticketEmbed],
                components: [closeRow]
            });

            await interaction.editReply({
                embeds: [createEmbed(
                    '✅ Bilet Oluşturuldu',
                    `Biletiniz başarıyla oluşturuldu! <#${ticketChannel.id}>`,
                    0x2ECC71
                )]
            });

            await sendLog(
                guild,
                '🎫 Yeni Bilet Açıldı',
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
                const inviteEmbed = createEmbed('📩 Davet', `Merhaba,\n\n**${interaction.user.tag}** sizi **${interaction.guild.name}** sunucusundaki özel sesli odasına davet etti.`, 0x2ECC71)
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
            const suggestionChannel = interaction.guild.channels.cache.get(SUGGESTION_CHANNEL_ID);
            if (suggestionChannel) {
                const suggestEmbed = createEmbed('💡 Yeni Öneri / İstek', text, 0xF1C40F)
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .addFields({ name: 'Kullanıcı ID', value: interaction.user.id });
                await suggestionChannel.send({ embeds: [suggestEmbed] });
                await interaction.reply({ embeds: [createEmbed('İletildi', 'Öneriniz yetkili ekibe başarıyla iletilmiştir. Teşekkür ederiz.', 0x2ECC71)], flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ embeds: [createErrorEmbed('Hata: Öneri kanalı bulunamadı.')], flags: MessageFlags.Ephemeral });
            }
        }
    }
});

client.on('messageDelete', async message => {
    if (!message.guild || !message.author || message.author.bot) return;

    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    let executor = message.author.tag;
    const fetchedLogs = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
    const deletionLog = fetchedLogs.entries.first();

    if (deletionLog && deletionLog.target.id === message.author.id && deletionLog.extra.channel.id === message.channel.id && deletionLog.createdAt > Date.now() - 5000) {
        executor = deletionLog.executor.tag;
    }

    let description = `**Mesaj Sahibi:** <@${message.author.id}> (${message.author.tag})\n**Silen Kişi:** ${executor}\n**Kanal:** <#${message.channel.id}>\n`;

    if (message.content) {
        description += `\n**Silinen İçerik:**\n${message.content}`;
    }

    const files = [];
    let imageUrl = null;

    if (message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
            if (attachment.contentType && attachment.contentType.startsWith('image/') && !imageUrl) {
                imageUrl = attachment.proxyURL;
            } else {
                files.push({ attachment: attachment.proxyURL, name: attachment.name });
            }
        });
    }

    if (!message.content && files.length === 0 && !imageUrl) {
        description += `\n*İçerik bulunamadı veya sadece sistem mesajı/embed.*`;
    }

    const deleteEmbed = createEmbed('🗑️ Mesaj Silindi', description, 0xE74C3C);
    if (imageUrl) {
        deleteEmbed.setImage(imageUrl);
    }

    await logChannel.send({ embeds: [deleteEmbed], files: files }).catch(() => {});
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || !oldMessage.author || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const logChannel = oldMessage.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const updateEmbed = createEmbed(
        '✏️ Mesaj Düzenlendi',
        `**Kullanıcı:** <@${oldMessage.author.id}> (${oldMessage.author.tag})\n**Kanal:** <#${oldMessage.channel.id}> - [Mesaja Git](${newMessage.url})\n\n**Eski İçerik:**\n${oldMessage.content || '*Yok*'}\n\n**Yeni İçerik:**\n${newMessage.content || '*Yok*'}`,
        0xF1C40F
    );

    await logChannel.send({ embeds: [updateEmbed] });
});

async function getGeneratorChannelId(guild) {
    const c = guild.channels.cache.find(c => c.name === '➕ Oda Oluştur' && c.type === ChannelType.GuildVoice);
    return c ? c.id : null;
}

client.login(process.env.TOKEN);
