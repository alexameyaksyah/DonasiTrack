# Architecture Guide

## Project Structure

DonasiTrack Mobile menggunakan Clean Architecture dengan struktur folder sebagai berikut:

```
lib/
├── main.dart
├── models/           # Data models & entities
├── services/         # Business logic & API calls
├── widgets/          # Reusable UI components
├── screens/          # Full screen pages
├── utils/            # Helper functions & utilities
├── constants/        # Constants & configurations
└── src/              # Source files (session management, etc)
```

## Architecture Layers

### 1. **Models Layer**
- Mendefinisikan struktur data aplikasi
- Menghandle serialization/deserialization JSON

### 2. **Services Layer**
- ApiService: HTTP client untuk API calls
- AuthService: Authentication logic
- StorageService: Local storage management
- NotificationService: Push notifications
- PaymentService: Payment processing

### 3. **Presentation Layer (UI)**
- Screens: Halaman penuh aplikasi
- Widgets: Komponen UI reusable

### 4. **Utilities Layer**
- FormatUtils: Formatting data untuk display
- ValidationUtils: Form validation
- DateUtils: Date/time handling
- SnackBarUtils: User notifications
- LoggingUtils: Debug logging

## Data Flow

1. **User Interaction** → UI Event
2. **Screen/Widget** → Calls Service
3. **Service** → API Call via ApiService
4. **Response** → Convert to Model
5. **Model** → Display in UI

## State Management

Untuk state management kompleks, gunakan Provider atau Riverpod:
- SimpleLiveData untuk state sederhana
- Provider untuk dependency injection
- Riverpod untuk reactive programming

## Best Practices

1. **Separation of Concerns**: Pisahkan logic, UI, dan data
2. **DRY**: Jangan repeat code, buat reusable components
3. **SOLID**: Follow SOLID principles
4. **Error Handling**: Always handle errors gracefully
5. **Testing**: Write unit tests untuk services & utils
