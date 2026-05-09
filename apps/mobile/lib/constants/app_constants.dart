class AppConstants {
  // App name and version
  static const String appName = 'DonasiTrack';
  static const String appVersion = '1.0.0';
  static const String appBuild = '1';

  // API endpoints
  static const String apiBaseUrl = 'https://api.donasitrack.app';
  static const String apiTimeout = '30000'; // 30 seconds

  // Storage keys
  static const String keyToken = 'auth_token';
  static const String keyUserId = 'user_id';
  static const String keyUserData = 'user_data';
  static const String keyTheme = 'app_theme';
  static const String keyLanguage = 'app_language';

  // Page sizes
  static const int pageSize = 20;
  static const int initialLoadSize = 10;

  // Delays (in milliseconds)
  static const int redirectDelay = 2000;
  static const int animationDuration = 300;
}
