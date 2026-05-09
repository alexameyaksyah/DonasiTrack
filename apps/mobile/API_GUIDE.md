# API Integration Guide

## Base Configuration

API base URL diatur di `lib/constants/app_constants.dart`:

```dart
static const String apiBaseUrl = 'https://api.donasitrack.app';
static const String apiTimeout = '30000'; // 30 seconds
```

## Authentication

Semua request API harus include token authentication:

```dart
final apiService = ApiService(baseUrl: AppConstants.apiBaseUrl);
final response = await apiService.get('/donations');
```

Token disimpan di `AuthService`:

```dart
// Login
await authService.login('user@email.com', 'password');

// Get token
String? token = authService.token;

// Logout
await authService.logout();
```

## Common Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/donations` | GET | Get all donations |
| `/donations/create` | POST | Create new donation |
| `/campaigns` | GET | Get all campaigns |
| `/campaigns/{id}` | GET | Get campaign detail |
| `/users/profile` | GET | Get user profile |
| `/users/profile/update` | PUT | Update user profile |

## Error Handling

```dart
try {
  final data = await apiService.get('/donations');
} catch (e) {
  SnackBarUtils.showError(context, 'Failed to load data: $e');
}
```

## Rate Limiting

API mungkin memiliki rate limiting. Handle dengan:
- Caching response
- Show local data jika API unavailable
- Implement retry logic dengan exponential backoff

## Testing

Untuk testing, gunakan mock API:

```dart
final mockClient = MockHttpClient();
final apiService = ApiService(
  baseUrl: AppConstants.apiBaseUrl,
  client: mockClient,
);
```
