# ChatCord - Discord & Slack Style Chat Application

ChatCord is a complete, responsive, real-time chat application built using **React.js (Vite)**, **Material UI (MUI)**, and **Firebase** (Authentication, Cloud Firestore, and Firebase Storage).

---

## Features

- 🔐 **Secure Authentication**: Google Sign-in & Email/Password Sign-in, User Registration (with Profile Picture), Password recovery, and Protected Router guards.
- 💬 **Real-time Chat Rooms**: Create rooms, search channels, join chats, edit or delete your own messages, and send image attachments.
- 🎯 **Advanced Messaging**: Multi-user typing indicators, message pin board drawer, reply-threads support, and custom popover emoji reactions (👍, ❤️, 😂, 🎉, etc.).
- 👥 **Presence Status**: Tracks and displays online/offline user states in real-time.
- 🌓 **Dynamic Themes**: Seamless transitions between premium Dark Mode and Light Mode, saved to browser LocalStorage.
- 📱 **Fully Responsive Layout**: Collapsible Sidebar navigation drawer optimized for mobile, tablet, and desktop screens.
- 🚀 **Production Security**: Encrypted API secrets using `.env` values, and Firestore + Storage security rules.

---

## Tech Stack

- **Frontend**: React.js (Vite, React Router DOM, React Context API)
- **Design & UI**: Material UI (MUI), Emotion, MUI Icons
- **Database / Backend**:
  - Firebase Authentication (Google & Password logins)
  - Cloud Firestore (Real-time DB)
  - Firebase Storage (Image uploads)

---

## Folder Structure

```text
src/
├── components/
│   ├── Navbar.jsx          # App navigation toolbar
│   ├── Sidebar.jsx         # Collapsible channel side navigation drawer
│   ├── Message.jsx         # Individual chat message bubble
│   ├── MessageInput.jsx    # Chat input bar (emoji, image preview, typing hooks)
│   ├── ChatRoomCard.jsx    # Channel listing grid element
│   ├── Loader.jsx          # Skeleton, full-screen spinner, typing animation
│   ├── ProtectedRoute.jsx  # Route guard redirecting unauthenticated users
│   └── ProfileMenu.jsx     # Avatar popup menu card
│
├── pages/
│   ├── Login.jsx           # User credentials & Google login
│   ├── Register.jsx        # Account signup with profile picture selector
│   ├── Dashboard.jsx       # Channel explore list & personal profile summary
│   ├── ChatRoom.jsx        # Real-time room feed with member roster & pin drawer
│   ├── Profile.jsx         # Edit name, bio, profile photo, lists user's channels
│   └── Settings.jsx        # Theme toggles, notifications configurations
│
├── context/
│   └── AuthContext.jsx     # Firebase auth listeners & user presence logic
│
├── services/
│   ├── firebase.js         # Firebase initializations
│   ├── auth.js             # Email/Google sign-in actions
│   └── firestore.js        # Chat DB query handlers
│
├── hooks/
│   └── useAuth.js          # Helper hook to call Auth Context
│
├── utils/
│   └── helpers.js          # Chat timestamps, avatar initials generators
│
├── App.jsx                 # Theme wrappers & route declaration
├── main.jsx                # React DOM render script
├── theme.js                # Custom Material UI light & dark theme settings
└── index.css               # Global reset styles
```

---

## Setup Instructions

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Firebase in the Console
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Go to **Authentication** -> **Sign-in method** and enable:
   - **Email/Password**
   - **Google**
3. Go to **Firestore Database** and click **Create database**. Start in test mode or production mode.
4. Go to **Storage** and click **Get Started**. Enable Firebase Storage.

### 3. Create `.env` Local Config File
Copy the `.env.example` file and rename it to `.env` in the root folder of the project. Replace the dummy values with your actual Firebase API keys:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Apply Firebase Security Rules
To secure your data, copy the contents of the local security configuration files and paste them into your Firebase web portal:
- Copy the rules from [firestore.rules](file:///firestore.rules) and paste them into the **Rules** tab of your Firestore Database in Firebase.
- Copy the rules from [storage.rules](file:///storage.rules) and paste them into the **Rules** tab of your Storage bucket in Firebase.

### 5. Create Firestore Indexes (If prompted)
Firestore requires composite indexes for complex sorting. If you run the project and see a console warning or error when loading channels or messages, click the auto-generated link in your browser console log. It will automatically build the index in your Firebase console.
The index needed is:
- Collection: `chatRooms` -> Documents -> Subcollection: `messages`
- Fields: `createdAt` Ascending, `pinned` Descending (or similar depending on filter order).

---

## Run Locally

Start the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## Production Build & Deployment

To compile the application into static files optimized for production:
```bash
npm run build
```
The output files will be built in the `dist` directory. You can deploy this directory to hosting providers such as **Vercel**, **Netlify**, or **Firebase Hosting**.
