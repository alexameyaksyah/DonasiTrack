# DonasiTrack Mobile App

Aplikasi mobile untuk platform DonasiTrack - aplikasi manajemen donasi yang komprehensif.

## Fitur

- Dashboard donasi real-time
- Kelola profil pengguna
- Tracking donasi
- Notifikasi push
- Integrasi payment gateway

## Teknologi

- Flutter untuk cross-platform development (iOS & Android)
- Dart sebagai bahasa pemrograman
- REST API integration

## Setup

### Prerequisites
- Flutter SDK (v3.0 atau lebih baru)
- Dart SDK
- Android Studio (untuk Android)
- Xcode (untuk iOS)

### Installation

```bash
# Clone repository
git clone https://github.com/alexameyaksyah/DonasiTrack.git

# Navigate to mobile app
cd apps/mobile

# Get dependencies
flutter pub get

# Run app
flutter run
```

## Build

### Android
```bash
flutter build apk
```

### iOS
```bash
flutter build ios
```

## Project Structure

```
lib/
├── main.dart           # Entry point
├── models/            # Data models
├── screens/           # UI screens
├── services/          # API & business logic
├── widgets/           # Reusable widgets
└── utils/             # Helper functions
```

## Contributors

- alexameyaksyah

## License

MIT
