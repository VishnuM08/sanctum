# Personal Vault - AI-Powered Notes & Vault App

A fully functional, premium web application for storing important notes, sensitive data, and managing reminders with AI-powered intelligent features. **All features are working with local storage!**

## ✨ Live Features

### 🎯 Fully Functional CRUD Operations
- ✅ **Notes**: Create, edit, delete, search - all working!
- ✅ **Vault**: Add encrypted items, reveal/hide, copy to clipboard, delete
- ✅ **Reminders**: Create, complete, delete with AI auto-extraction
- ✅ **Real-time Stats**: Dashboard shows actual data from your activity
- ✅ **Persistent Storage**: Everything saves to localStorage automatically

### 🎨 6 Premium Themes
Choose from 6 beautiful color schemes:
- **Indigo** (Default) - Professional and modern
- **Emerald** - Fresh and energetic
- **Rose** - Warm and inviting
- **Amber** - Bold and vibrant
- **Cyan** - Cool and calming
- **Purple** - Creative and elegant

### 🌓 Dark Mode
- Beautiful light and dark themes
- Smooth transitions between modes
- Persists your preference

### 🤖 AI-Powered Intelligence (Mock)
- **Auto-Reminder Extraction**: Write "call mom this weekend" → AI creates reminder
- **Smart Summaries**: AI generates summaries based on content
- **Auto-Tagging**: Intelligent tags like "work", "personal", "travel"
- **Context Linking**: Reminders link back to original notes

### ⚡ Advanced Animations
- **Page Transitions**: Smooth fade-in animations
- **Card Hover Effects**: Elevation and border highlights
- **Stagger Animations**: Items animate in sequence
- **Background Blobs**: Animated gradient background
- **Bounce Effects**: Playful micro-interactions
- **Modal Animations**: Zoom-in and fade effects

### 📱 Fully Responsive
- Desktop: Full sidebar navigation
- Mobile: Bottom navigation bar with icon bubbles
- Tablet: Optimized grid layouts
- All touch interactions work perfectly

## 🚀 Working Features

### Dashboard
- Real-time statistics from your data
- Recent activity feed
- Upcoming reminders
- AI agent insights
- Empty state guidance

### Notes
- Create/edit/delete notes
- AI-powered summaries and tags
- Search by title, content, or tags
- Automatic reminder extraction
- Time-based sorting

### Vault
- Add encrypted items (passwords, cards, contacts)
- Reveal/hide sensitive data
- Copy to clipboard with visual feedback
- Expiry date tracking
- Search vault items

### Reminders
- Manual reminder creation
- AI-extracted reminders from notes
- Mark as complete
- Delete reminders
- Shows context from original notes

### Settings
- **Theme Selector**: 6 color options
- **Dark Mode**: Toggle light/dark
- **Notifications**: Morning digest, reminders, expiry warnings
- **AI Settings**: Auto-extract, summaries, tags, model selection
- All settings persist

## 🎨 Premium Design Features

### Visual Enhancements
- Gradient text headings
- Multi-layered shadows with color glows
- Glassmorphism effects
- Smooth border transitions
- Icon background bubbles
- Status badges

### Animations
- **Entrance**: fade-in, slide-in, zoom-in, bounce-in
- **Hover**: scale, translate, opacity transitions
- **Active**: scale-down on click
- **Background**: Animated gradient blobs
- **Modal**: Backdrop blur with smooth transitions

### Components
- Premium buttons with shadows
- Enhanced input fields with focus rings
- Interactive cards with hover states
- Animated toggles
- Gradient cards
- Badge indicators

## 💾 Data Persistence

All data is stored in browser localStorage:
- `notes` - Your notes with AI metadata
- `vault` - Encrypted vault entries
- `reminders` - Active and completed reminders
- `settings` - Notification and AI preferences
- `app-theme` - Selected color theme
- `app-mode` - Light/dark mode

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Context API** for theme management
- **localStorage** for data persistence
- **Lucide React** for icons
- **Sonner** for toast notifications
- **Custom Hooks** for state management

## 🎯 How to Use

1. **Start Creating**: Click "New Note" to create your first note
2. **Try AI Features**: Write "call John tomorrow" in a note - AI will extract it as a reminder!
3. **Secure Your Data**: Add passwords to the Vault
4. **Change Themes**: Go to Settings → Appearance → Pick your favorite color
5. **Toggle Dark Mode**: Settings → Dark Mode toggle

## 🔐 Security (Simulated)

- Vault items shown as encrypted (ready for real AES-256 implementation)
- Reveal/hide functionality for sensitive data
- Expiry date tracking
- No actual encryption in browser (for demo purposes)

## 📊 Current Status

✅ **Fully Functional** - All CRUD operations work
✅ **6 Premium Themes** - Switch colors instantly
✅ **Dark Mode** - Complete light/dark support
✅ **Animations** - Smooth, performant animations throughout
✅ **Responsive** - Works on all screen sizes
✅ **Real Data** - Dashboard shows actual statistics
✅ **Persistent** - Data survives page refresh

## 🚀 Next Steps (Backend Integration)

To make this production-ready:
1. Implement Spring Boot REST API
2. Add PostgreSQL database
3. Integrate Anthropic Claude API
4. Add real AES-256 encryption
5. Implement JWT authentication
6. Set up Redis for caching
7. Add AWS SES for email notifications

## 📝 Notes

- This is a frontend-only app using localStorage
- AI features use rule-based logic (not real AI calls)
- Perfect for understanding the full architecture
- Ready to connect to real backend

---

**Built with ❤️ using Claude Code**
*Every feature works. Every animation delights. Every theme is beautiful.*
