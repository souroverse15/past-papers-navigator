# Past Papers Navigator

A modern, responsive web application for browsing and viewing past examination papers with dedicated mobile and desktop experiences.

## ✨ Features

### 📱 Mobile & Tablet Optimized

- **Dedicated Mobile Components**: Custom-built mobile interface with touch-friendly navigation
- **Responsive Design**: Seamless experience across all device sizes
- **Enhanced Mobile File Navigator**: Touch-optimized file browsing with search and filtering
- **Mobile Paper Viewer**: Optimized PDF viewing with zoom controls and fullscreen mode
- **Bottom Navigation**: Easy access to main features on mobile devices

### 🖥️ Desktop Experience

- **Collapsible Sidebar**: Clean, organized navigation with keyboard shortcuts
- **Split-View Layout**: File navigator and paper viewer side by side
- **Advanced Search**: Powerful search functionality across all papers
- **Keyboard Shortcuts**: Ctrl+B to toggle sidebar

### 📄 Paper Management

- **Multiple Paper Types**: Question Papers, Mark Schemes, Solutions, and Booklets
- **Smart Organization**: Organized by exam board, subject, year, and session
- **Quick Access**: Recently viewed papers and favorites
- **Download Support**: Direct download of papers

### 🔐 User Features

- **Google Authentication**: Secure login with Google accounts
- **Progress Tracking**: Track your exam preparation progress
- **Mock Exam Timer**: Built-in timer for practice sessions
- **Personal Dashboard**: View your statistics and progress

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/past-papers-navigator.git
cd past-papers-navigator
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📱 Mobile Features

### Enhanced Mobile Navigation

- **Touch-Friendly Interface**: Large touch targets and smooth animations
- **Search & Filter**: Advanced search with year filtering
- **Folder Indicators**: Visual indicators for complete papers and solutions
- **Responsive Layout**: Adapts to different screen sizes and orientations

### Mobile Paper Viewer

- **Optimized PDF Viewing**: Smooth scrolling and zoom controls
- **Tab Navigation**: Easy switching between question papers, mark schemes, and solutions
- **Fullscreen Mode**: Distraction-free viewing experience
- **Download Support**: Direct download functionality

### Tablet Experience

- **Split-View Layout**: File navigator and paper viewer side by side
- **Optimized for Touch**: Larger touch targets and improved spacing
- **Landscape Optimization**: Better use of screen real estate

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Hosting**: Firebase Hosting
- **State Management**: React Context API

## 📂 Project Structure

```
src/
├── components/
│   ├── mobile/              # Mobile-specific components
│   │   ├── MobileFileNavigator.jsx
│   │   ├── MobilePaperViewer.jsx
│   │   └── MobilePastPapersNavigator.jsx
│   ├── layout/              # Layout components
│   │   └── MobileLayout.jsx
│   ├── PastPapersNavigator.jsx  # Desktop main component
│   ├── PaperViewer.jsx         # Desktop paper viewer
│   ├── FileNavigator.jsx       # Desktop file navigator
│   └── Sidebar.jsx             # Desktop sidebar
├── hooks/
│   └── useMediaQuery.js        # Responsive design hook
├── contexts/
│   └── AuthContext.jsx        # Authentication context
├── firebase/
│   ├── config.js              # Firebase configuration
│   └── userService.js         # User-related Firebase functions
└── styles/
    └── index.css              # Global styles
```

## 🎯 Responsive Breakpoints

- **Mobile**: ≤ 768px
- **Tablet**: 769px - 1024px
- **Desktop**: ≥ 1025px

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization

The codebase is organized with a clear separation between mobile and desktop components:

- **Mobile components** are located in `src/components/mobile/`
- **Desktop components** are in the main `src/components/` directory
- **Shared utilities** and hooks are in their respective directories

### Media Query Hook

The application uses a custom `useMediaQuery` hook for responsive design:

```javascript
import { useIsMobile, useIsTablet, useIsDesktop } from "./hooks/useMediaQuery";

const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();
```

## 🚀 Deployment

The application is configured for deployment on Firebase Hosting:

1. Build the project:

```bash
npm run build
```

2. Deploy to Firebase:

```bash
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- Tailwind CSS for styling
- Lucide React for icons
- React team for the amazing framework
