<!-- @format -->

**[Try Ziloss Live](https://your-deployment-url.vercel.app)** _(Deploy using the guide below)_ 📚 Ziloss - Smart Study Session Manager

> A modern, intuitive study session management app that helps you schedule, track, and optimize your learning sessions.

## ✨ Features

- **📅 Smart Scheduling**: Create and manage study sessions with flexible date ranges
- **⏱️ Session Tracking**: Track active sessions with real-time progress monitoring
- **📊 Progress Analytics**: Visual progress tracking with weekly insights
- **🎵 Background Music**: Built-in music player for focused studying
- **❌ Session Management**: Cancel or modify sessions as needed
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🌙 Modern UI**: Clean, intuitive interface built with Tailwind CSS

## 🚀 Live Demo

**[Try StudyFlow Live](https://your-deployment-url.vercel.app)** _(Deploy using the guide below)_

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: TanStack Query
- **Build Tools**: Vite, ESBuild

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/your-username/Ziloss.git
cd Ziloss
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env with your database connection string
```

4. **Setup database**

```bash
npm run db:push
```

5. **Start development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

## 🌐 Deployment

Ready to share Ziloss with the world? Follow our comprehensive [Deployment Guide](./DEPLOYMENT.md) for step-by-step instructions to deploy for free on Vercel, Railway, or Render.

**Quick Deploy Options:**

- **Vercel + Neon**: Best free option with generous limits
- **Railway**: Simplest setup, $5/month free credits
- **Render**: Good alternative with PostgreSQL included

## 📖 Usage

### Creating Study Sessions

1. Click the "+" button or use the floating action button
2. Fill in subject, duration, and date range
3. Sessions are automatically created for each day in the range

### Managing Sessions

- **Start Session**: Click on any upcoming session
- **Cancel Session**: Use the X button on session cards
- **View Progress**: Check the Stats page for detailed analytics

### Session States

- **🕒 Upcoming**: Sessions scheduled for the future
- **▶️ In Progress**: Currently active study sessions
- **✅ Completed**: Finished sessions with tracked progress
- **❌ Canceled**: Canceled sessions (preserved for history)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Test your changes thoroughly
- Update documentation if needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for better study session management
- Thanks to the open-source community for amazing tools

---

**Made with ❤️ for students and lifelong learners**

_Start organizing your study sessions better today!_ 🎓

## Features

- 📅 **Study Session Scheduling** - Plan your study sessions with custom subjects, dates, and durations
- ⏰ **Pomodoro Timer** - Built-in timer with customizable durations (25min, 30min, 45min, 1hr, etc.)
- 🎵 **Background Music** - Soft ambient music during study sessions with volume control
- 💪 **Motivational Quotes** - Daily inspirational quotes to keep you motivated
- 📊 **Progress Tracking** - Weekly and monthly study statistics
- 📱 **Mobile-First Design** - Optimized for mobile devices with touch-friendly interface

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: In-memory storage (easily switchable to PostgreSQL)
- **UI Components**: Shadcn/ui + Radix UI
- **Build Tool**: Vite
- **State Management**: TanStack Query

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

You can check if you have them installed by running:

```bash
node --version
npm --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/)

## Installation & Setup

1. **Clone or download the project files** to your local machine

2. **Navigate to the project directory**:

   ```bash
   cd studyflow-app
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:5000
   ```

The app should now be running on your local system!

## Project Structure

```
studyflow-app/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main app pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend Express server
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   └── storage.ts        # Data storage layer
├── shared/               # Shared types and schemas
└── package.json         # Dependencies and scripts
```

## How to Use

### 1. Home Page

- View today's scheduled study sessions
- See your weekly progress
- Read daily motivational quotes
- Control background music

### 2. Schedule Page

- Create new study sessions with the + button
- Set subject, date range, start time, and duration
- View sessions by date with navigation arrows
- See session statistics

### 3. Timer Page

- Choose from preset durations (Pomodoro, breaks, custom times)
- Start/pause/stop the timer
- Get notifications when sessions complete
- View progress with circular timer display

### 4. Stats Page

- Track weekly and monthly study hours
- See completion rates and streaks
- View subject-wise breakdowns
- Monitor goal progress

## Customization

### Adding New Music Tracks

Edit `client/src/lib/music-tracks.ts` to add your own background music:

```typescript
export const musicTracks: MusicTrack[] = [
	{
		id: "your-track",
		title: "Your Track Name",
		artist: "Artist Name",
		audioUrl: "path/to/your/audio.mp3",
		imageUrl: "path/to/cover.jpg",
		description: "Description of the track",
	},
	// ... other tracks
];
```

### Adding New Motivational Quotes

Edit `client/src/lib/quotes.ts` to add your own quotes:

```typescript
export const motivationalQuotes: MotivationalQuote[] = [
	{
		text: "Your motivational quote here",
		author: "Author Name",
	},
	// ... other quotes
];
```

### Switching to PostgreSQL Database

The app currently uses in-memory storage. To use a real database:

1. Set up a PostgreSQL database
2. Add your database connection URL to environment variables
3. The app is already configured to work with PostgreSQL via Drizzle ORM

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, the app will automatically try other ports or you can specify a different port:

```bash
PORT=3000 npm run dev
```

### Audio Not Playing

- Make sure your browser allows audio autoplay
- Check that the audio URLs in `music-tracks.ts` are accessible
- Some browsers require user interaction before playing audio

### App Not Loading

- Check that all dependencies are installed: `npm install`
- Make sure Node.js version is 18 or higher
- Check the terminal for any error messages

## Mobile Usage

The app is optimized for mobile devices. For the best experience:

- Add the web app to your home screen on mobile
- Use in portrait mode
- Enable notifications for study session alerts

## Contributing

Feel free to customize the app for your needs! The codebase is modular and easy to extend with new features.

## Support

If you encounter any issues, check:

1. Node.js and npm versions are up to date
2. All dependencies are installed
3. No other services are using port 5000
4. Browser console for any JavaScript errors

Happy studying! 📚✨
