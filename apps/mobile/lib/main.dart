import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MoonPalette {
  static const Color lavender = Color(0xFF9985F3);
  static const Color orchid = Color(0xFFC7B7FC);
  static const Color thistle = Color(0xFFE2D3EF);
  static const Color pearl = Color(0xFFF4ECFE);
  static const Color ink = Color(0xFF2A1D56);
  static const Color muted = Color(0xFF685B8D);
}

void main() {
  runApp(const DonasiTrackMobileApp());
}

class DonasiTrackMobileApp extends StatefulWidget {
  const DonasiTrackMobileApp({super.key});

  @override
  State<DonasiTrackMobileApp> createState() => _DonasiTrackMobileAppState();
}

class _DonasiTrackMobileAppState extends State<DonasiTrackMobileApp> {
  final AppSession session = AppSession();
  late final Future<void> bootstrap = session.load();

  ThemeData _buildTheme() {
    final ColorScheme scheme = ColorScheme.fromSeed(
      seedColor: MoonPalette.lavender,
      primary: MoonPalette.lavender,
      secondary: MoonPalette.orchid,
      surface: const Color(0xFFFDF9FF),
      onPrimary: Colors.white,
      onSecondary: MoonPalette.ink,
      onSurface: MoonPalette.ink,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: Colors.transparent,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
          color: MoonPalette.ink,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white.withValues(alpha: 0.76),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: MoonPalette.lavender.withValues(alpha: 0.25)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.72),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: MoonPalette.lavender.withValues(alpha: 0.22)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: MoonPalette.lavender.withValues(alpha: 0.22)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: MoonPalette.lavender, width: 1.4),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: MoonPalette.lavender,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: MoonPalette.ink,
          side: BorderSide(color: MoonPalette.lavender.withValues(alpha: 0.35)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white.withValues(alpha: 0.78),
        indicatorColor: MoonPalette.orchid.withValues(alpha: 0.64),
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final bool selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? MoonPalette.ink : MoonPalette.muted,
          );
        }),
      ),
      dividerColor: MoonPalette.thistle,
      textTheme: const TextTheme(
        titleLarge: TextStyle(
          color: MoonPalette.ink,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
        ),
        titleMedium: TextStyle(
          color: MoonPalette.ink,
          fontWeight: FontWeight.w700,
        ),
        bodyMedium: TextStyle(color: MoonPalette.muted),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Donasi Track Mobile',
      theme: _buildTheme(),
      builder: (BuildContext context, Widget? child) {
        return DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: <Color>[
                Color(0xFFF8F1FF),
                MoonPalette.pearl,
                Color(0xFFE7DBFF),
              ],
            ),
          ),
          child: child,
        );
      },
      home: FutureBuilder<void>(
        future: bootstrap,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          return AnimatedBuilder(
            animation: session,
            builder: (context, _) {
              if (!session.isAuthenticated) {
                return AuthStandalonePage(session: session);
              }

              return HomeShell(session: session);
            },
          );
        },
      ),
    );
  }
}

class AuthStandalonePage extends StatelessWidget {
  const AuthStandalonePage({super.key, required this.session});

  final AppSession session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: SafeArea(child: AuthPage(session: session)));
  }
}

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

class ApiClient {
  ApiClient(this.session)
    : dio = Dio(
        BaseOptions(
          baseUrl: session.effectiveApiBase,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 20),
        ),
      );

  final AppSession session;
  final Dio dio;

  Map<String, String> get authHeader => {
    if (session.token.isNotEmpty) 'Authorization': 'Bearer ${session.token}',
  };

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final Response<dynamic> response = await dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final Response<dynamic> response = await dio.post(
      '/auth/register',
      data: {'name': name, 'email': email, 'password': password},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<Map<String, dynamic>>> campaigns() async {
    final Response<dynamic> response = await dio.get('/campaigns');
    return (response.data as List<dynamic>)
        .map((dynamic item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  Future<void> donate(Map<String, dynamic> body) async {
    await dio.post(
      '/donations',
      data: body,
      options: Options(headers: authHeader),
    );
  }

  Future<Map<String, dynamic>> trackingByCode(String code) async {
    final Response<dynamic> response = await dio.get('/tracking/$code');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> updateShipmentStatus({
    required String shipmentId,
    required String status,
    String? note,
    double? latitude,
    double? longitude,
    String? photoUrl,
  }) async {
    await dio.patch(
      '/logistics/$shipmentId/status',
      data: {
        'status': status,
        'note': note,
        'latitude': latitude,
        'longitude': longitude,
        'photoUrl': photoUrl,
      },
      options: Options(headers: authHeader),
    );
  }

  Future<String> uploadProof(XFile file) async {
    final MultipartFile multipart = kIsWeb
        ? MultipartFile.fromBytes(await file.readAsBytes(), filename: file.name)
        : await MultipartFile.fromFile(file.path, filename: file.name);

    final FormData formData = FormData.fromMap({'file': multipart});
    final Response<dynamic> response = await dio.post(
      '/uploads/proof',
      data: formData,
      options: Options(headers: authHeader, contentType: 'multipart/form-data'),
    );

    final Map<String, dynamic> map = Map<String, dynamic>.from(
      response.data as Map,
    );
    return map['url'] as String;
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.session});

  final AppSession session;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = <Widget>[
      DonorPage(session: widget.session),
      AdminOperationalPage(session: widget.session),
      TrackingPage(session: widget.session),
    ];

    return AnimatedBuilder(
      animation: widget.session,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Donasi Track Mobile'),
            actions: <Widget>[
              if (widget.session.isAuthenticated)
                IconButton(
                  onPressed: widget.session.logout,
                  icon: const Icon(Icons.logout),
                  tooltip: 'Logout',
                ),
            ],
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: pages[index],
            ),
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: (int value) => setState(() => index = value),
            destinations: const <NavigationDestination>[
              NavigationDestination(
                icon: Icon(Icons.favorite),
                label: 'Donatur',
              ),
              NavigationDestination(
                icon: Icon(Icons.admin_panel_settings),
                label: 'Operasional',
              ),
              NavigationDestination(
                icon: Icon(Icons.timeline),
                label: 'Tracking',
              ),
            ],
          ),
        );
      },
    );
  }
}

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.session});

  final AppSession session;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final TextEditingController loginEmail = TextEditingController();
  final TextEditingController registerEmail = TextEditingController();
  final TextEditingController apiBase = TextEditingController();
  bool isRegister = false;
  bool loading = false;
  String message = '';

  @override
  void initState() {
    super.initState();
    apiBase.text = widget.session.effectiveApiBase;
  }

  @override
  void dispose() {
    loginEmail.dispose();
    registerEmail.dispose();
    apiBase.dispose();
    super.dispose();
  }

  String _passwordForEmail(String email) {
    final String normalized = email.trim().toLowerCase();
    return 'moon-$normalized-2026';
  }

  String _nameFromEmail(String email) {
    final String localPart = email.split('@').first.trim();
    if (localPart.isEmpty) return 'Donatur';
    final String clean = localPart.replaceAll(RegExp(r'[^a-zA-Z0-9]'), ' ');
    final List<String> words = clean
        .split(' ')
        .where((String part) => part.trim().isNotEmpty)
        .toList();
    if (words.isEmpty) return 'Donatur';
    return words
        .map(
          (String word) =>
              '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}',
        )
        .join(' ');
  }

  void _toggleMode() {
    setState(() {
      isRegister = !isRegister;
      message = '';
    });
  }

  void _showForgotPasswordInfo() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Fitur reset password akan tersedia di update berikutnya.'),
      ),
    );
  }

  void _showSocialInfo(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Login $provider belum tersedia.')),
    );
  }

  Future<void> _saveApiBaseOnly() async {
    await widget.session.saveApiBase(apiBase.text);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('API base disimpan: ${widget.session.effectiveApiBase}')),
    );
  }

  Future<void> _doLogin() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
      await widget.session.saveApiBase(apiBase.text);
      final ApiClient api = ApiClient(widget.session);
      final String email = loginEmail.text.trim();
      final Map<String, dynamic> result = await api.login(
        email: email,
        password: _passwordForEmail(email),
      );

      final Map<String, dynamic> user = Map<String, dynamic>.from(
        result['user'] as Map,
      );
      await widget.session.saveSession(
        newToken: result['token'] as String,
        newUserId: user['id'] as String,
        newRole: user['role'] as String,
      );

      if (!mounted) return;
      setState(() => message = 'Login berhasil');
    } on DioException catch (error) {
      final String? serverMessage = error.response?.data is Map
          ? (error.response?.data['message'] as String?)
          : null;
      setState(() => message = serverMessage ?? 'Login gagal');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _doRegister() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
      await widget.session.saveApiBase(apiBase.text);
      final ApiClient api = ApiClient(widget.session);
      final String email = registerEmail.text.trim();
      final Map<String, dynamic> result = await api.register(
        name: _nameFromEmail(email),
        email: email,
        password: _passwordForEmail(email),
      );

      final Map<String, dynamic> user = Map<String, dynamic>.from(
        result['user'] as Map,
      );
      await widget.session.saveSession(
        newToken: result['token'] as String,
        newUserId: user['id'] as String,
        newRole: user['role'] as String,
      );

      if (!mounted) return;
      setState(() => message = 'Registrasi berhasil');
    } on DioException catch (error) {
      final String? serverMessage = error.response?.data is Map
          ? (error.response?.data['message'] as String?)
          : null;
      setState(() => message = serverMessage ?? 'Registrasi gagal');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool onLogin = !isRegister;

    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  const SizedBox(height: 6),
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.82),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(
                        Icons.add,
                        color: MoonPalette.lavender,
                        size: 36,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    onLogin ? "Let's Sign In." : "Create Account.",
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 34,
                      height: 0.95,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1,
                      color: Color(0xFF1F2333),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    onLogin
                        ? 'Experience AI Health Assistant for everyone.'
                        : 'Daftar cepat cukup pakai email.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: MoonPalette.muted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Email Address',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF23253A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: onLogin ? loginEmail : registerEmail,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      hintText: 'elementary221b@gmail.com',
                      prefixIcon: Icon(Icons.mail_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 18),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: <Color>[Color(0xFF6A35E6), Color(0xFF8D4CFF)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: <BoxShadow>[
                        BoxShadow(
                          color: MoonPalette.lavender.withValues(alpha: 0.35),
                          blurRadius: 22,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: FilledButton.icon(
                      onPressed: loading
                          ? null
                          : (onLogin ? _doLogin : _doRegister),
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        disabledBackgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        minimumSize: const Size.fromHeight(56),
                      ),
                      icon: loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.arrow_forward_rounded),
                      label: Text(onLogin ? 'Sign In' : 'Sign Up'),
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (onLogin) ...<Widget>[
                    Row(
                      children: <Widget>[
                        const Expanded(child: Divider()),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'or continue with',
                            style: TextStyle(
                              color: MoonPalette.muted.withValues(alpha: 0.9),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const Expanded(child: Divider()),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _showSocialInfo('Facebook'),
                            child: const Text('f'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _showSocialInfo('Google'),
                            child: const Text('G'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _showSocialInfo('Instagram'),
                            child: const Text('ig'),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (message.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.72),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        message,
                        style: const TextStyle(
                          color: Color(0xFF40435C),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Text(
                        onLogin
                            ? "Don't have an account? "
                            : 'Already have an account? ',
                        style: const TextStyle(
                          color: Color(0xFF4D516B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TextButton(
                        onPressed: loading ? null : _toggleMode,
                        style: TextButton.styleFrom(
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          padding: EdgeInsets.zero,
                        ),
                        child: Text(
                          onLogin ? 'Sign Up.' : 'Sign In.',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: MoonPalette.lavender,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (onLogin)
                    Center(
                      child: TextButton(
                        onPressed: loading ? null : _showForgotPasswordInfo,
                        child: const Text('Need help login?'),
                      ),
                    ),
                  const SizedBox(height: 8),
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: const Text(
                      'API Connection',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: MoonPalette.muted,
                        fontSize: 13,
                      ),
                    ),
                    childrenPadding: const EdgeInsets.only(bottom: 10),
                    children: <Widget>[
                      TextField(
                        controller: apiBase,
                        decoration: const InputDecoration(
                          labelText: 'API Base URL',
                          hintText: 'http://10.0.2.2:4000/api',
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton(
                          onPressed: loading ? null : _saveApiBaseOnly,
                          child: const Text('Save API'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class DonorPage extends StatefulWidget {
  const DonorPage({super.key, required this.session});

  final AppSession session;

  @override
  State<DonorPage> createState() => _DonorPageState();
}

class _DonorPageState extends State<DonorPage> {
  static const String campaignCacheKey = 'campaign_cache';
  static const String donationQueueKey = 'donation_queue';

  final TextEditingController campaignId = TextEditingController();
  final TextEditingController amount = TextEditingController();
  final TextEditingController itemName = TextEditingController();
  final TextEditingController quantity = TextEditingController();
  final TextEditingController proofUrl = TextEditingController();

  List<Map<String, dynamic>> campaigns = <Map<String, dynamic>>[];
  String donationType = 'MONEY';
  String message = '';
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _loadCampaigns();
  }

  @override
  void dispose() {
    campaignId.dispose();
    amount.dispose();
    itemName.dispose();
    quantity.dispose();
    proofUrl.dispose();
    super.dispose();
  }

  Future<void> _loadCampaigns() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? cache = prefs.getString(campaignCacheKey);
    if (cache != null && cache.isNotEmpty) {
      final List<dynamic> decoded = jsonDecode(cache) as List<dynamic>;
      setState(() {
        campaigns = decoded
            .map((dynamic item) => Map<String, dynamic>.from(item as Map))
            .toList();
      });
    }

    try {
      final ApiClient api = ApiClient(widget.session);
      final List<Map<String, dynamic>> fresh = await api.campaigns();
      setState(() => campaigns = fresh);
      await prefs.setString(campaignCacheKey, jsonEncode(fresh));
    } catch (_) {
      if (campaigns.isNotEmpty) {
        setState(() => message = 'Menggunakan data cache lokal.');
      }
    }
  }

  Future<void> _submitDonation() async {
    if (!widget.session.isAuthenticated) {
      setState(() => message = 'Login sebagai DONOR dulu.');
      return;
    }

    setState(() {
      loading = true;
      message = '';
    });

    final Map<String, dynamic> body = <String, dynamic>{
      'campaignId': campaignId.text.trim(),
      'type': donationType,
      'amount': amount.text.trim().isEmpty
          ? null
          : int.tryParse(amount.text.trim()),
      'itemName': itemName.text.trim().isEmpty ? null : itemName.text.trim(),
      'quantity': quantity.text.trim().isEmpty
          ? null
          : int.tryParse(quantity.text.trim()),
      'transferProofUrl': proofUrl.text.trim().isEmpty
          ? null
          : proofUrl.text.trim(),
    };

    try {
      final ApiClient api = ApiClient(widget.session);
      await api.donate(body);
      setState(
        () => message = 'Donasi terkirim dan menunggu verifikasi admin.',
      );
    } catch (_) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final String? existing = prefs.getString(donationQueueKey);
      final List<dynamic> queue = existing == null
          ? <dynamic>[]
          : (jsonDecode(existing) as List<dynamic>);
      queue.add(body);
      await prefs.setString(donationQueueKey, jsonEncode(queue));
      setState(
        () => message = 'Offline: donasi disimpan lokal untuk disinkronkan.',
      );
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _syncDonationQueue() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? existing = prefs.getString(donationQueueKey);
    if (existing == null) {
      setState(() => message = 'Queue kosong.');
      return;
    }

    final ApiClient api = ApiClient(widget.session);
    final List<Map<String, dynamic>> queue =
        (jsonDecode(existing) as List<dynamic>)
            .map((dynamic item) => Map<String, dynamic>.from(item as Map))
            .toList();
    final List<Map<String, dynamic>> remain = <Map<String, dynamic>>[];

    for (final Map<String, dynamic> item in queue) {
      try {
        await api.donate(item);
      } catch (_) {
        remain.add(item);
      }
    }

    if (remain.isEmpty) {
      await prefs.remove(donationQueueKey);
      setState(() => message = 'Semua donasi offline berhasil dikirim.');
    } else {
      await prefs.setString(donationQueueKey, jsonEncode(remain));
      setState(() => message = '${remain.length} item masih di queue offline.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        const Card(
          child: Padding(
            padding: EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Eksplorasi Kampanye',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                SizedBox(height: 4),
                Text(
                  'Pilih kampanye, isi detail donasi, dan kirim saat online atau offline.',
                  style: TextStyle(color: MoonPalette.muted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        ...campaigns.map(
          (Map<String, dynamic> campaign) => Card(
            child: ListTile(
              title: Text(campaign['title']?.toString() ?? '-'),
              subtitle: Text(
                '${campaign['disasterType']} | ${campaign['location']}\n'
                'ID: ${campaign['id']}\n'
                'Terkumpul: ${campaign['collectedAmount']} / ${campaign['targetAmount']}',
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Form Donasi',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        TextField(
          controller: campaignId,
          decoration: const InputDecoration(labelText: 'Campaign ID'),
        ),
        DropdownButtonFormField<String>(
          initialValue: donationType,
          items: const <DropdownMenuItem<String>>[
            DropdownMenuItem(value: 'MONEY', child: Text('MONEY')),
            DropdownMenuItem(value: 'GOODS', child: Text('GOODS')),
          ],
          onChanged: (String? value) =>
              setState(() => donationType = value ?? 'MONEY'),
          decoration: const InputDecoration(labelText: 'Jenis Donasi'),
        ),
        TextField(
          controller: amount,
          decoration: const InputDecoration(labelText: 'Nominal (untuk MONEY)'),
        ),
        TextField(
          controller: itemName,
          decoration: const InputDecoration(
            labelText: 'Nama barang (untuk GOODS)',
          ),
        ),
        TextField(
          controller: quantity,
          decoration: const InputDecoration(
            labelText: 'Jumlah barang (untuk GOODS)',
          ),
        ),
        TextField(
          controller: proofUrl,
          decoration: const InputDecoration(
            labelText: 'URL bukti transfer/foto',
          ),
        ),
        const SizedBox(height: 10),
        FilledButton(
          onPressed: loading ? null : _submitDonation,
          child: const Text('Kirim Donasi'),
        ),
        OutlinedButton(
          onPressed: _syncDonationQueue,
          child: const Text('Sync Queue Offline'),
        ),
        if (message.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(message, style: const TextStyle(color: MoonPalette.muted)),
          ),
      ],
    );
  }
}

class AdminOperationalPage extends StatefulWidget {
  const AdminOperationalPage({super.key, required this.session});

  final AppSession session;

  @override
  State<AdminOperationalPage> createState() => _AdminOperationalPageState();
}

class _AdminOperationalPageState extends State<AdminOperationalPage> {
  static const String trackingQueueKey = 'tracking_queue';

  final TextEditingController shipmentInput = TextEditingController();
  final TextEditingController note = TextEditingController();

  String status = 'PICKED_UP';
  String message = '';
  String? uploadedPhotoUrl;
  Position? position;

  @override
  void dispose() {
    shipmentInput.dispose();
    note.dispose();
    super.dispose();
  }

  Future<void> _scanQrCode() async {
    final String? scanned = await Navigator.push<String>(
      context,
      MaterialPageRoute<String>(builder: (_) => const QrScannerPage()),
    );
    if (scanned != null && scanned.isNotEmpty) {
      setState(() {
        shipmentInput.text = scanned;
        message = 'QR terbaca: $scanned';
      });
    }
  }

  Future<String> _resolveShipmentId(String rawInput) async {
    final String input = rawInput.trim();
    if (input.startsWith('DNT-')) {
      final ApiClient api = ApiClient(widget.session);
      final Map<String, dynamic> payload = await api.trackingByCode(input);
      return payload['id']?.toString() ?? input;
    }
    return input;
  }

  Future<void> _captureLocation() async {
    final bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => message = 'Layanan lokasi tidak aktif.');
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      setState(() => message = 'Izin lokasi ditolak.');
      return;
    }

    final Position current = await Geolocator.getCurrentPosition();
    setState(() {
      position = current;
      message = 'Koordinat berhasil diambil.';
    });
  }

  Future<void> _pickAndUploadPhoto() async {
    if (!widget.session.isAuthenticated) {
      setState(() => message = 'Login dulu untuk upload bukti.');
      return;
    }

    final ImagePicker picker = ImagePicker();
    final XFile? file = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 75,
    );
    if (file == null) return;

    try {
      final ApiClient api = ApiClient(widget.session);
      final String url = await api.uploadProof(file);
      setState(() {
        uploadedPhotoUrl = url;
        message = 'Foto bukti berhasil diupload.';
      });
    } catch (_) {
      setState(() => message = 'Upload foto gagal.');
    }
  }

  Future<void> _submitTracking() async {
    if (!widget.session.isAuthenticated) {
      setState(() => message = 'Login sebagai ADMIN dulu.');
      return;
    }

    if (widget.session.role != 'ADMIN') {
      setState(() => message = 'Fitur operasional hanya untuk ADMIN.');
      return;
    }

    final String shipmentId = await _resolveShipmentId(shipmentInput.text);
    final Map<String, dynamic> body = <String, dynamic>{
      'shipmentId': shipmentId,
      'status': status,
      'note': note.text.trim().isEmpty ? null : note.text.trim(),
      'latitude': position?.latitude,
      'longitude': position?.longitude,
      'photoUrl': uploadedPhotoUrl,
    };

    try {
      final ApiClient api = ApiClient(widget.session);
      await api.updateShipmentStatus(
        shipmentId: shipmentId,
        status: status,
        note: body['note'] as String?,
        latitude: body['latitude'] as double?,
        longitude: body['longitude'] as double?,
        photoUrl: body['photoUrl'] as String?,
      );
      setState(() => message = 'Status pengiriman berhasil diperbarui.');
    } catch (_) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final String? existing = prefs.getString(trackingQueueKey);
      final List<dynamic> queue = existing == null
          ? <dynamic>[]
          : (jsonDecode(existing) as List<dynamic>);
      queue.add(body);
      await prefs.setString(trackingQueueKey, jsonEncode(queue));
      setState(() => message = 'Offline: tracking masuk queue lokal.');
    }
  }

  Future<void> _syncTrackingQueue() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? existing = prefs.getString(trackingQueueKey);
    if (existing == null) {
      setState(() => message = 'Queue tracking kosong.');
      return;
    }

    final List<Map<String, dynamic>> queue =
        (jsonDecode(existing) as List<dynamic>)
            .map((dynamic item) => Map<String, dynamic>.from(item as Map))
            .toList();
    final List<Map<String, dynamic>> remain = <Map<String, dynamic>>[];
    final ApiClient api = ApiClient(widget.session);

    for (final Map<String, dynamic> item in queue) {
      try {
        await api.updateShipmentStatus(
          shipmentId: item['shipmentId'].toString(),
          status: item['status'].toString(),
          note: item['note']?.toString(),
          latitude: (item['latitude'] as num?)?.toDouble(),
          longitude: (item['longitude'] as num?)?.toDouble(),
          photoUrl: item['photoUrl']?.toString(),
        );
      } catch (_) {
        remain.add(item);
      }
    }

    if (remain.isEmpty) {
      await prefs.remove(trackingQueueKey);
      setState(() => message = 'Queue tracking sukses disinkronkan.');
    } else {
      await prefs.setString(trackingQueueKey, jsonEncode(remain));
      setState(() => message = '${remain.length} event tracking masih antri.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        const Card(
          child: Padding(
            padding: EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Operasional Admin', style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: 4),
                Text(
                  'Scan QR, update status, foto bukti, dan sinkronisasi queue offline.',
                  style: TextStyle(color: MoonPalette.muted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: shipmentInput,
          decoration: const InputDecoration(
            labelText: 'Shipment ID atau Tracking Code',
            hintText: 'contoh: DNT-123456-ABCD atau shipment id',
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _scanQrCode,
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Scan QR Code'),
        ),
        DropdownButtonFormField<String>(
          initialValue: status,
          items: const <DropdownMenuItem<String>>[
            DropdownMenuItem(value: 'PICKED_UP', child: Text('PICKED_UP')),
            DropdownMenuItem(value: 'IN_TRANSIT', child: Text('IN_TRANSIT')),
            DropdownMenuItem(value: 'DELIVERED', child: Text('DELIVERED')),
            DropdownMenuItem(value: 'FAILED', child: Text('FAILED')),
          ],
          onChanged: (String? value) =>
              setState(() => status = value ?? 'PICKED_UP'),
          decoration: const InputDecoration(labelText: 'Status'),
        ),
        TextField(
          controller: note,
          decoration: const InputDecoration(labelText: 'Catatan lapangan'),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _captureLocation,
          icon: const Icon(Icons.my_location),
          label: const Text('Ambil Geolocation'),
        ),
        if (position != null)
          Text(
            'Lokasi: ${position!.latitude.toStringAsFixed(6)}, ${position!.longitude.toStringAsFixed(6)}',
            style: const TextStyle(color: MoonPalette.muted),
          ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _pickAndUploadPhoto,
          icon: const Icon(Icons.camera_alt),
          label: const Text('Ambil & Upload Foto Bukti'),
        ),
        if (uploadedPhotoUrl != null) Text('Foto URL: $uploadedPhotoUrl'),
        const SizedBox(height: 10),
        FilledButton(
          onPressed: _submitTracking,
          child: const Text('Kirim Update Tracking'),
        ),
        OutlinedButton(
          onPressed: _syncTrackingQueue,
          child: const Text('Sync Queue Tracking Offline'),
        ),
        if (message.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(message, style: const TextStyle(color: MoonPalette.muted)),
          ),
      ],
    );
  }
}

class TrackingPage extends StatefulWidget {
  const TrackingPage({super.key, required this.session});

  final AppSession session;

  @override
  State<TrackingPage> createState() => _TrackingPageState();
}

class _TrackingPageState extends State<TrackingPage> {
  final TextEditingController code = TextEditingController();
  Map<String, dynamic>? payload;
  String message = '';

  @override
  void dispose() {
    code.dispose();
    super.dispose();
  }

  Future<void> _findTracking() async {
    try {
      final ApiClient api = ApiClient(widget.session);
      final Map<String, dynamic> data = await api.trackingByCode(
        code.text.trim(),
      );
      setState(() {
        payload = data;
        message = '';
      });
    } on DioException catch (error) {
      final String? serverMessage = error.response?.data is Map
          ? (error.response?.data['message'] as String?)
          : null;
      setState(() {
        payload = null;
        message = serverMessage ?? 'Tracking tidak ditemukan';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<dynamic> events = payload == null
        ? <dynamic>[]
        : (payload!['trackingEvents'] as List<dynamic>? ?? <dynamic>[]);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        const Card(
          child: Padding(
            padding: EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Tracking Bantuan', style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: 4),
                Text(
                  'Lacak perjalanan bantuan secara realtime berdasarkan tracking code.',
                  style: TextStyle(color: MoonPalette.muted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: code,
          decoration: const InputDecoration(labelText: 'Tracking Code'),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: _findTracking,
          child: const Text('Cari Timeline'),
        ),
        if (message.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(message, style: const TextStyle(color: MoonPalette.muted)),
          ),
        if (payload != null) ...<Widget>[
          const SizedBox(height: 10),
          Text('Status: ${payload!['status']}'),
          Text('Kampanye: ${payload!['campaign']?['title']}'),
          Text(
            'Item: ${payload!['item']?['name']} (${payload!['item']?['quantity']})',
          ),
          const Divider(height: 24),
          const Text('Timeline', style: TextStyle(fontWeight: FontWeight.bold)),
          ...events.map((dynamic item) {
            final Map<String, dynamic> event = Map<String, dynamic>.from(
              item as Map,
            );
            final Map<String, dynamic> createdBy = Map<String, dynamic>.from(
              (event['createdBy'] ?? <String, dynamic>{}) as Map,
            );
            return Card(
              child: ListTile(
                title: Text(event['status']?.toString() ?? '-'),
                subtitle: Text(
                  '${event['note'] ?? 'Tanpa catatan'}\n'
                  '${event['createdAt']}\n'
                  'By: ${createdBy['name'] ?? '-'} (${createdBy['role'] ?? '-'})\n'
                  '${event['latitude'] != null ? 'Lat: ${event['latitude']}, Lng: ${event['longitude']}' : ''}',
                ),
              ),
            );
          }),
        ],
      ],
    );
  }
}

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> {
  bool captured = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR')),
      body: MobileScanner(
        onDetect: (BarcodeCapture capture) {
          if (captured) return;
          if (capture.barcodes.isEmpty) return;
          final String? code = capture.barcodes.first.rawValue;
          if (code == null || code.isEmpty) return;

          captured = true;
          Navigator.pop(context, code);
        },
      ),
    );
  }
}
