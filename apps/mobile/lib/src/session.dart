import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSession extends ChangeNotifier {
  static const String _tokenKey = 'session_token';
  static const String _userIdKey = 'session_user_id';
  static const String _roleKey = 'session_role';
  static const String _apiKey = 'api_base_url';

  String token = '';
  String userId = '';
  String role = 'DONOR';
  String apiBaseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  String get effectiveApiBase {
    if (apiBaseUrl.trim().isNotEmpty) return apiBaseUrl.trim();
    if (kIsWeb) return 'http://localhost:4000/api';
    return 'http://10.0.2.2:4000/api';
  }

  bool get isAuthenticated => token.isNotEmpty;

  Future<void> load() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    token = prefs.getString(_tokenKey) ?? '';
    userId = prefs.getString(_userIdKey) ?? '';
    role = prefs.getString(_roleKey) ?? 'DONOR';
    apiBaseUrl = prefs.getString(_apiKey) ?? apiBaseUrl;
    notifyListeners();
  }

  Future<void> saveSession({
    required String newToken,
    required String newUserId,
    required String newRole,
  }) async {
    token = newToken;
    userId = newUserId;
    role = newRole;
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_roleKey, role);
    notifyListeners();
  }

  Future<void> saveApiBase(String value) async {
    apiBaseUrl = value.trim();
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_apiKey, apiBaseUrl);
    notifyListeners();
  }

  Future<void> logout() async {
    token = '';
    userId = '';
    role = 'DONOR';
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_roleKey);
    notifyListeners();
  }
}
