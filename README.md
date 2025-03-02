# Onetime Authenticator

A secure, modern, cross-platform two-factor authentication (2FA) app built with React Native and Expo. Onetime Authenticator helps you manage your TOTP tokens with a clean interface and powerful features.

## Features

- **Time-based One-time Passwords (TOTP)** - Industry-standard implementation for secure authentication codes
- **Multiple Import Methods**:
  - QR Code Scanning - Quickly add accounts by scanning QR codes
  - Photo Import - Import QR codes from saved photos
  - Manual Entry - Add accounts using setup keys
- **Multiple Languages** - Internationalization with support for 20+ languages including English, Spanish, French, German, Chinese, Japanese, and many more
- **Dark & Light Themes** - Comfortable viewing in any environment with automatic system theme detection
- **Secure Storage** - Optional encryption for stored authentication tokens
- **Cross-Platform** - Works on iOS, Android, and Web browsers with appropriate feature degradation
- **Modern UI** - Clean, intuitive interface with smooth animations and visual feedback
- **Backup & Restore** - Export and import your accounts for safe recovery
- **Import from Other Apps** - Transfer your accounts from other authenticator applications

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/otauth.git
cd otauth
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open the app:
   - Scan the QR code with Expo Go on your mobile device
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Open the web version in your browser (automatically opened)

## Usage

### Managing Authentication Tokens

#### Adding a New Account

1. **Via QR Code** (iOS/Android):
   - Tap the "Add" tab
   - Select "Scan QR Code"
   - Point your camera at the QR code provided by your service
   - The account will be added automatically

2. **Via Photo Import** (iOS/Android):
   - Tap the "Add" tab
   - Select "Import from Photo"
   - Choose a photo containing a QR code
   - The app will scan and import the account

3. **Manual Entry** (All Platforms):
   - Tap the "Add" tab
   - Select "Enter Setup Key"
   - Fill in the required fields:
     - Account Name (e.g., "Work Email")
     - Service Provider (e.g., "Google")
     - Secret Key (the key provided by your service)
   - Optionally configure advanced settings:
     - Algorithm (SHA1, SHA256, SHA512)
     - Digits (typically 6)
     - Period (typically 30 seconds)
   - Tap "Add Account"

#### Using Authentication Codes

- All your accounts are displayed on the main "Accounts" tab
- Each code updates automatically when it expires
- The circular progress indicator shows time remaining until the next code
- Tap on a code to copy it to your clipboard
- Long-press an account to access options like deletion

### Importing Accounts

Onetime Authenticator supports importing accounts from other authenticator apps:

1. Go to the "Settings" tab
2. Tap "Import From Other App"
3. Choose your import method:
   - **Scan QR Code** (iOS/Android) - Scan the export/migration QR code from your other app
   - **Import from Photo** (iOS/Android) - Select a photo containing a QR code
   - **Manual Entry** - Enter the account details manually

The app will automatically extract and import valid accounts, skipping any duplicates.

### Backing Up Your Accounts

1. Go to the "Settings" tab
2. Under "Backup & Restore", select "Export Tokens"
3. Choose where to save your encrypted backup file

### Restoring From Backup

1. Go to the "Settings" tab
2. Under "Backup & Restore", select "Import Tokens"
3. Select your backup file
4. Your accounts will be restored

## Platform Compatibility

Onetime Authenticator is designed with cross-platform compatibility in mind:

- **iOS and Android**:
  - Full feature support
  - Native camera access for QR code scanning
  - Photo library access for importing QR codes
  - Secure storage with encryption
  - Native haptic feedback
  - Share and export functionality

- **Web**:
  - Graceful degradation of native features
  - Manual entry always available
  - Web-compatible storage solutions
  - Responsive design for all screen sizes
  - Keyboard shortcuts and accessibility

## Project Structure

```
otauth/
├── app/                  # App routes and navigation
│   ├── _layout.tsx       # Root layout component
│   ├── (tabs)/           # Tab-based navigation
│   │   ├── _layout.tsx   # Tab configuration
│   │   ├── index.tsx     # Accounts list screen
│   │   ├── add.tsx       # Add new account screen
│   │   └── settings.tsx  # Settings screen
│   ├── import.tsx        # Import from other apps
│   └── +not-found.tsx    # 404 page
├── components/           # Reusable components
│   ├── AddAccountManual.tsx    # Manual account entry form
│   ├── PhotoQRScanner.tsx      # Photo QR code scanner
│   ├── QRCodeScanner.tsx       # Live QR code scanner
│   ├── TokenCard.tsx           # TOTP token display card
│   └── TokenImporter.tsx       # Token import manager
├── constants/            # App constants and theme definitions
├── context/             # React context providers
│   └── ThemeContext.tsx  # Theme management
├── i18n/                # Internationalization
│   └── translations/    # Language files
├── utils/               # Utility functions
│   ├── otp.ts           # OTP generation logic
│   ├── scannerUtils.ts  # Camera and scanning utilities
│   └── storage.ts       # Data persistence logic
└── package.json         # Project dependencies
```

## Privacy and Security

Onetime Authenticator prioritizes your privacy and security:

- **Zero Data Collection**: The app never collects or transmits any user data
- **Local Processing**: All authentication happens locally on your device
- **Optional Encryption**: Secure your tokens with device-level encryption
- **No Network Requests**: The app functions completely offline after installation
- **No Analytics or Tracking**: Your usage patterns are never monitored
- **Safe Photo Access**: Photo imports are processed locally and never uploaded

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to improve the app.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OTPAuth](https://github.com/hectorm/otpauth) - TOTP generation library
- [Expo](https://expo.dev) - React Native development platform
- [Lucide](https://lucide.dev) - Beautiful, consistent icons
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Powerful animation library
- The React Native and open source communities for their invaluable tools and libraries

---

Built with ❤️ using React Native and Expo
