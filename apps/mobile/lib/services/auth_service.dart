class AuthService {
  String? _token;
  String? _userId;

  bool get isAuthenticated => _token != null;

  String? get token => _token;

  String? get userId => _userId;

  Future<void> login(String email, String password) async {
    // Simulate login
    _token = 'token_${DateTime.now().millisecondsSinceEpoch}';
    _userId = 'user_123';
  }

  Future<void> register(String name, String email, String password) async {
    // Simulate registration
    _token = 'token_${DateTime.now().millisecondsSinceEpoch}';
    _userId = 'user_${DateTime.now().millisecondsSinceEpoch}';
  }

  Future<void> logout() async {
    // Logout
    _token = null;
    _userId = null;
  }

  Future<void> refreshToken() async {
    if (_token != null) {
      _token = 'token_${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  Future<bool> verifyToken() async {
    return _token != null;
  }
}
