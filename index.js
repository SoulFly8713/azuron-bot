const {
    Client, GatewayIntentBits, Partials, PermissionsBitField, EmbedBuilder,
    ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder,
    TextInputStyle, REST, Routes, SlashCommandBuilder, ActivityType
} = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif 🚀");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server aktif.");
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
});

const LOG_CHANNEL_ID = '1470356769653133368';
const SUGGESTION_CHANNEL_ID = '1470356769653133368';
const WELCOME_CHANNEL_ID = '1471564344578932829';
const BOT_VOICE_CHANNEL_ID = '1473737542166774042';
const TICKET_STAFF_ROLE_ID = '1464184391881457704';

const linkProtection = new Set();
const deleteTimers = new Map();

function createEmbed(title, description, color = 0x5865F2) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || 'İşlem detayları aşağıdadır.')
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Azuron Türkiye', iconURL: client.user.displayAvatarURL() });
}

function createErrorEmbed(description) {
    return new EmbedBuilder()
        .setTitle('❌ İşlem Başarısız')
        .setDescription(description)
        .setColor(0xE74C3C)
        .setTimestamp()
        .setFooter({ text: 'Yetki veya Sistem Hatası', iconURL: client.user.displayAvatarURL() });
}

async function sendLog(guild, title, description, color = 0xE67E22) {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (channel) {
        await channel.send({ embeds: [createEmbed(title, description, color)] });
    }
}

client.on('clientReady', async () => {
    console.log(`${client.user.tag} aktif.`);
    client.user.setActivity({
        name: 'Azuron Türkiye',
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/discord'
    });

    const voiceChannel = client.channels.cache.get(BOT_VOICE_CHANNEL_ID);
    if (voiceChannel) {
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true
        });
        console.log(`Bot ${voiceChannel.name} kanalına bağlandı.`);
    }

    const commands = [
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
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash komutlar başarıyla yüklendi.');
    } catch (error) {
        console.error(error);
    }
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (channel) {
        channel.send(`${member} Hoş geldin! Seninle birlikte **${member.guild.memberCount}** kişiyiz!`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    const lowerContent = message.content.toLowerCase();
    if (lowerContent === 'sa' || lowerContent === 'selamünaleyküm') {
        return message.reply('Aleykümselam, hoş geldin!');
    }
    if (linkProtection.has(message.guild.id)) {
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,})/gi;
        if (linkRegex.test(message.content)) {
            await message.delete().catch(() => {});
            const warningMsg = await message.channel.send({
                embeds: [createErrorEmbed(`<@${message.author.id}>, **Link Engel:** Bu sunucuda bağlantı (link) paylaşımı yasaklanmıştır.`)]
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

        if (commandName === 'yardım') {
            const helpEmbed = createEmbed('📑 Komut Listesi', 'Aşağıda botun kullanılabilir komutları listelenmiştir.', 0x5865F2)
                .addFields(
                    { name: '🛠️ Genel Komutlar', value: '`/yardım` - Komut listesini gösterir.\n`/öneri` - Sunucu için öneri gönderir.' },
                    { name: '🛡️ Yönetici Komutları', value: '`/ses-panel` - Özel oda sistemini kurar.\n`/bilet olustur` - Bilet sistemini kurar.\n`/link-engel` - Link korumasını açar/kapatır.\n`/kick` - Kullanıcı atar.\n`/ban` - Kullanıcı yasaklar.\n`/mute` - Kullanıcı susturur.\n`/unmute` - Susturmayı kaldırır.\n`/sil` - Mesajları temizler.' },
                    { name: '🔊 Ses Sistemi', value: 'Özel oda kurmak için **Oda Oluştur** kanalına girmeniz yeterlidir.' },
                    { name: '🎫 Bilet Sistemi', value: '**bilet-oluştur** kanalındaki menüden destek bileti açabilirsiniz.' }
                );
            return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
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
                return interaction.reply({ embeds: [createErrorEmbed('Mesajlar silinemedi, sunucuda Mesajları Yönet yetkisine sahip olmalısınız.')], ephemeral: true });
            }

            const miktar = options.getInteger('miktar');
            try {
                const silinenler = await interaction.channel.bulkDelete(miktar, true);
                await interaction.reply({ embeds: [createEmbed('Temizlik Başarılı', `Kanalda **${silinenler.size}** adet mesaj silindi.`, 0x2ECC71)], ephemeral: true });
                await sendLog(guild, '🧹 Mesajlar Silindi', `**Yetkili:** ${member.user.tag}\n**Kanal:** <#${interaction.channel.id}>\n**Miktar:** ${silinenler.size} mesaj`, 0x3498DB);
            } catch (error) {
                await interaction.reply({ embeds: [createErrorEmbed('Mesajlar silinemedi.')], ephemeral: true });
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
                await interaction.deferReply({ ephemeral: true });

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
            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı sunucuda bulunamadı.')], ephemeral: true });
            if (target.id === member.id) return interaction.reply({ embeds: [createErrorEmbed('Kendi üzerinizde uzaklaştırma işlemi uygulayamazsınız.')], ephemeral: true });
            if (targetMember.kickable) {
                await targetMember.kick(reason);
                interaction.reply({ embeds: [createEmbed('Uzaklaştırma (Kick)', `**${target.tag}** sunucudan uzaklaştırılmıştır.\n**Gerekçe:** ${reason}`, 0xE67E22)], ephemeral: true });
                await sendLog(guild, '🚪 Kullanıcı Atıldı', `**Yetkili:** ${member.user.tag}\n**Atılan:** ${target.tag}\n**Sebep:** ${reason}`, 0xE67E22);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**İşlem Başarısız:** Bu kullanıcının rolü benim rolümden daha yüksek veya eşit olduğu için işlem yapılamıyor.')], ephemeral: true });
            }
        }

        if (commandName === 'ban') {
            const target = options.getUser('kullanici');
            const reason = options.getString('sebep') || 'Belirtilmedi';
            if (target.id === member.id) return interaction.reply({ embeds: [createErrorEmbed('Kendinizi yasaklayamazsınız.')], ephemeral: true });
            try {
                await guild.members.ban(target, { reason: reason });
                interaction.reply({ embeds: [createEmbed('Yasaklama (Ban)', `**${target.tag}** sunucudan kalıcı olarak yasaklanmıştır.\n**Gerekçe:** ${reason}`, 0xC0392B)], ephemeral: true });
                await sendLog(guild, '🔨 Kullanıcı Yasaklandı', `**Yetkili:** ${member.user.tag}\n**Yasaklanan:** ${target.tag}\n**Sebep:** ${reason}`, 0xC0392B);
            } catch (e) {
                interaction.reply({ embeds: [createErrorEmbed('**İşlem Başarısız:** Kullanıcıyı yasaklamak için yeterli yetkiye sahip değilim.')], ephemeral: true });
            }
        }

      if (commandName === 'mute') {
            const target = options.getUser('kullanici');
            const duration = options.getInteger('sure');
            const reason = options.getString('sebep') || 'Belirtilmedi';
            const targetMember = await guild.members.fetch(target.id).catch(() => null);
            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı sunucuda bulunamadı.')], ephemeral: true });
            if (target.id === member.id) return interaction.reply({ embeds: [createErrorEmbed('Kendinize susturma işlemi uygulayamazsınız.')], ephemeral: true });
            if (targetMember.moderatable) {
                await targetMember.timeout(duration * 60000, reason);
                interaction.reply({ embeds: [createEmbed('Süreli Susturma (Timeout)', `**${target.tag}** kullanıcısına **${duration} dakika** boyunca susturulma uygulanmıştır.`, 0xF1C40F)], ephemeral: true });
                await sendLog(guild, '😶 Kullanıcı Susturuldu', `**Yetkili:** ${member.user.tag}\n**Susturulan:** ${target.tag}\n**Süre:** ${duration} Dakika\n**Sebep:** ${reason}`, 0xF1C40F);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**Hata:** Bu kullanıcı Yönetici yetkisine sahip veya rolü benden yüksek.')], ephemeral: true });
            }
        }

        if (commandName === 'unmute') {
            const target = options.getUser('kullanici');
            const targetMember = await guild.members.fetch(target.id).catch(() => null);
            if (!targetMember) return interaction.reply({ embeds: [createErrorEmbed('Üye sunucuda bulunamadı.')], ephemeral: true });
            if (targetMember.moderatable) {
                await targetMember.timeout(null);
                interaction.reply({ embeds: [createEmbed('Susturma Kaldırıldı', `**${target.tag}** kullanıcısının susturması kaldırılmıştır.`, 0x2ECC71)] });
                await sendLog(guild, '🔊 Susturma Kaldırıldı', `**Yetkili:** ${member.user.tag}\n**Kullanıcı:** ${target.tag}`, 0x2ECC71);
            } else {
                interaction.reply({ embeds: [createErrorEmbed('**Hata:** İşlem gerçekleştirilemedi. Yetkilerimi kontrol ediniz.')], ephemeral: true });
            }
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
                return interaction.reply({ embeds: [createErrorEmbed('Bu işlemi gerçekleştirmek için yetkili olmanız gerekmektedir.')], ephemeral: true });
            }

            const action = interaction.values[0];

            if (action === 'ticket_delete') {
                await interaction.reply({ embeds: [createEmbed('🗑️ Bilet Silindi', 'Bu bilet kalıcı olarak siliniyor...', 0xE74C3C)] });
                await sendLog(guild, '🗑️ Bilet Silindi', `**Kanal:** ${channel.name}\n**Silen:** ${interaction.user.tag}`, 0xE74C3C);
                setTimeout(() => channel.delete().catch(() => {}), 3000);
            }

            if (action === 'ticket_reopen') {
                if (!ownerId) {
                    return interaction.reply({ embeds: [createErrorEmbed('Bilet sahibi bilgisine ulaşılamadı.')], ephemeral: true });
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
                return interaction.reply({ embeds: [createErrorEmbed('**Yetkisiz Erişim:** Bu odanın yönetim paneline erişim izniniz bulunmamaktadır.')], ephemeral: true });
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
            } else if (selection === 'action_lock') {
                await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
                interaction.reply({ embeds: [createEmbed('Oda Kilitlendi', 'Oda kilitlenmiştir.', 0xE74C3C)], ephemeral: true });
            } else if (selection === 'action_unlock') {
                await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
                interaction.reply({ embeds: [createEmbed('Oda Kilidi Açıldı', 'Oda kilidi açılmıştır.', 0x2ECC71)], ephemeral: true });
            } else if (selection === 'action_delete') {
                interaction.reply({ embeds: [createEmbed('Silme İşlemi', 'Kanal siliniyor...', 0xE74C3C)], ephemeral: true });
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
                interaction.reply({ embeds: [infoEmbed], ephemeral: true });
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
        if (interaction.customId === 'ticket_close_btn') {
            const channel = interaction.channel;
            const topic = channel.topic || '';
            const ownerIdMatch = topic.match(/OWNER:(\d+)/);
            const ownerId = ownerIdMatch ? ownerIdMatch[1] : null;

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && interaction.user.id !== ownerId) {
                return interaction.reply({ embeds: [createErrorEmbed('Bu bileti kapatmak için yetkiniz bulunmamaktadır.')], ephemeral: true });
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
    }

    if (interaction.isModalSubmit()) {
        if (
            interaction.customId === 'modal_ticket_open_support_ticket' ||
            interaction.customId === 'modal_ticket_open_report_ticket' ||
            interaction.customId === 'modal_ticket_open_suggestion_ticket'
        ) {
            await interaction.deferReply({ ephemeral: true });

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
            interaction.reply({ embeds: [createEmbed('Güncelleme Başarılı', `Kanal adı **${newName}** olarak değiştirildi.`, 0x2ECC71)], ephemeral: true });
        }

        if (interaction.customId === 'modal_limit') {
            const limit = parseInt(interaction.fields.getTextInputValue('new_limit'));
            if (!isNaN(limit) && limit >= 0 && limit < 100) {
                await interaction.channel.setUserLimit(limit);
                interaction.reply({ embeds: [createEmbed('Güncelleme Başarılı', `Kullanıcı limiti **${limit === 0 ? 'Sınırsız' : limit}** olarak ayarlandı.`, 0x2ECC71)], ephemeral: true });
            } else {
                interaction.reply({ embeds: [createErrorEmbed('Lütfen 0 ile 99 arasında geçerli bir sayı giriniz.')], ephemeral: true });
            }
        }

        if (interaction.customId === 'modal_invite') {
            await interaction.deferReply({ ephemeral: true });
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
                    interaction.reply({ embeds: [createEmbed('İşlem Başarılı', 'Kullanıcı odadan atıldı.', 0xE67E22)], ephemeral: true });
                } else {
                    interaction.reply({ embeds: [createErrorEmbed('Belirtilen kullanıcı şu anda bu odada bulunmamaktadır.')], ephemeral: true });
                }
            } catch (e) {
                interaction.reply({ embeds: [createErrorEmbed('Kullanıcı sunucuda bulunamadı veya ID hatalı.')], ephemeral: true });
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
                await interaction.reply({ embeds: [createEmbed('İletildi', 'Öneriniz yetkili ekibe başarıyla iletilmiştir. Teşekkür ederiz.', 0x2ECC71)], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [createErrorEmbed('Hata: Öneri kanalı bulunamadı.')], ephemeral: true });
            }
        }
    }
});

client.on('messageDelete', async message => {
    if (!message.guild || !message.author || message.author.bot) return;

    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    let description = `**Kullanıcı:** <@${message.author.id}> (${message.author.tag})\n**Kanal:** <#${message.channel.id}>\n`;

    if (message.content) {
        description += `\n**Silinen İçerik:**\n${message.content}`;
    }

    let imageUrl = null;
    if (message.attachments.size > 0) {
        description += `\n\n**Silinen Medya/Ekler:**\n${message.attachments.map(a => `[Dosya Bağlantısı](${a.proxyURL})`).join('\n')}`;
        
        const firstAttachment = message.attachments.first();
        if (firstAttachment.contentType && firstAttachment.contentType.startsWith('image/')) {
            imageUrl = firstAttachment.proxyURL; 
        }
    }

    if (!message.content && message.attachments.size === 0) {
        description += `\n*İçerik bulunamadı veya sadece sistem mesajı/embed.*`;
    }

    const deleteEmbed = createEmbed('🗑️ Mesaj Silindi', description, 0xE74C3C);
    
    if (imageUrl) {
        deleteEmbed.setImage(imageUrl);
    }

    await logChannel.send({ embeds: [deleteEmbed] }).catch(() => {});
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
