# 📻 Discord Radio Bot

Discord сервер дээр **24/7** радио стрим тоглуулдаг бот.  
Discord.js v14 + @discordjs/voice ашигласан.

---

## 📁 Файлын бүтэц

```
discord-radio-bot/
├── index.js              # Үндсэн бот (холболт, auto-reconnect, player)
├── deploy-commands.js    # Slash команд бүртгэх скрипт
├── commands/
│   ├── play.js           # /play команд
│   ├── stop.js           # /stop команд
│   └── status.js         # /status команд
├── .env.example          # Орчны хувьсагчдын загвар
├── .gitignore
└── package.json
```

---

## ⚙️ Суулгах & Ажиллуулах

### 1. Сан суулгах
```bash
npm install
```

### 2. Орчны тохиргоо хийх
```bash
cp .env.example .env
```
`.env` файлыг нээж дараах утгуудыг өөрийнхөөр солино:

| Хувьсагч     | Тайлбар                                              |
|-------------|------------------------------------------------------|
| `TOKEN`      | Discord Developer Portal дахь Bot Token             |
| `CLIENT_ID`  | Апп-ын Application ID (deploy-д хэрэгтэй)           |
| `GUILD_ID`   | Тоглуулах сервер (guild)-ийн ID                      |
| `CHANNEL_ID` | Voice channel-ийн ID                                 |
| `RADIO_URL`  | Радио стримийн URL (mp3/aac/ogg stream)              |

### 3. Slash командуудыг Discord-д бүртгэх (нэг удаа)
```bash
npm run deploy
```

### 4. Ботыг эхлүүлэх
```bash
npm start
```

---

## 🎮 Slash Командууд

| Команд      | Тайлбар                                    |
|------------|--------------------------------------------|
| `/play`    | Радио стримийг тоглуулна                   |
| `/stop`    | Радиог зогсоож, Voice channel-аас гарна    |
| `/status`  | Ботын холболт, uptime, URL харуулна        |

---

## 🔄 Auto-Reconnect Логик

```
Холболт тасарсан
      │
      ▼
entersState(Signalling | Connecting, 5сек) ── амжилттай ──► Дахин холбогдлоо ✓
      │
   Амжилтгүй
      │
      ▼
connection.destroy()
      │
      ▼
scheduleReconnect(15сек) ──► connectToChannel() дахин дуудна
      │
      ▼
(Амжилтгүй бол 15сек тутамд давтана)
      │
      ▼
Heartbeat (5 минут тутамд): холболтгүй бол scheduleReconnect(1сек)
```

---

## 🚀 Production дээр ажиллуулах (PM2)

```bash
npm install -g pm2
pm2 start index.js --name radio-bot
pm2 save
pm2 startup
```

---

## 🛠 Шаардлагатай Discord Bot Permissions

Developer Portal → Bot → Privileged Gateway Intents:
- ✅ **Server Members Intent** (шаардлагагүй болж магадгүй)
- ✅ **Voice States** (заавал!)

OAuth2 Scopes: `bot`, `applications.commands`  
Bot Permissions: `Connect`, `Speak`, `View Channels`

---

## 📦 Хамааралтай сангууд

| Сан                   | Зориулалт                        |
|----------------------|----------------------------------|
| `discord.js`          | Discord API wrapper              |
| `@discordjs/voice`    | Voice channel + аудио удирдлага  |
| `@discordjs/opus`     | Opus codec (аудио шахалт)        |
| `opusscript`          | Opus backup (native байхгүй үед) |
| `libsodium-wrappers`  | Аудио шифрлэлт                  |
| `ffmpeg-static`       | Аудио stream хөрвүүлэгч          |
| `dotenv`              | .env файл уншигч                 |
