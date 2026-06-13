import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MoonPalette {
  // Blood donation themed palette
  static const Color lavender = Color(0xFFB00020); // primary deep red
  static const Color orchid = Color(0xFFFF6F61); // warm accent
  static const Color thistle = Color(0xFFF8D7DA); // light pink
  static const Color pearl = Color(0xFFFFEBEE); // very light
  static const Color ink = Color(0xFF2A0A0A); // dark maroon
  static const Color muted = Color(0xFF7A3A3A); // muted maroon
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
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: MoonPalette.lavender.withValues(alpha: 0.22),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: MoonPalette.lavender.withValues(alpha: 0.22),
          ),
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
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: MoonPalette.ink,
          side: BorderSide(color: MoonPalette.lavender.withValues(alpha: 0.35)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ), 
      // ignore: deprecated_member_use
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
      // ignore: deprecated_member_use
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
      // The home is determined by the authentication state, which is loaded asynchronously.
      home: FutureBuilder<void>(
        future: bootstrap,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          // Once the session is loaded, we listen to its changes to update the UI accordingly.

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

// A standalone page for authentication, used when the user is not authenticated.
class AuthStandalonePage extends StatelessWidget {
  const AuthStandalonePage({super.key, required this.session});

  final AppSession session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: AuthPage(session: session)),
    );
  }
}

// AppSession manages the user's authentication state and related information, as well as the API base URL. It uses SharedPreferences to persist data across app launches and notifies listeners when changes occur.
class AppSession extends ChangeNotifier {
  static const String _tokenKey = 'session_token';
  static const String _userIdKey = 'session_user_id';
  static const String _roleKey = 'session_role';
  static const String _nameKey = 'session_name';
  static const String _emailKey = 'session_email';
  static const String _apiKey = 'api_base_url';

  String token = '';
  String userId = '';
  String role = 'DONOR';
  String name = 'Donatur';
  String email = '';
  String apiBaseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  // effectiveApiBase determines the actual API base URL to use, prioritizing the user-configured value, then falling back to sensible defaults for web and mobile.
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
    name = prefs.getString(_nameKey) ?? 'Donatur';
    email = prefs.getString(_emailKey) ?? '';
    apiBaseUrl = prefs.getString(_apiKey) ?? apiBaseUrl;
    notifyListeners();
  }

  Future<void> saveSession({
    required String newToken,
    required String newUserId,
    required String newRole,
    required String newName,
    required String newEmail,
  }) async {
    token = newToken;
    userId = newUserId;
    role = newRole;
    name = newName;
    email = newEmail;
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_roleKey, role);
    await prefs.setString(_nameKey, name);
    await prefs.setString(_emailKey, email);
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
    name = 'Donatur';
    email = '';
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_roleKey);
    await prefs.remove(_nameKey);
    await prefs.remove(_emailKey);
    notifyListeners();
  }
}

// ApiClient provides methods to interact with the backend API, including authentication, fetching campaigns, making donations, tracking shipments, and uploading proof of delivery. It uses the Dio package for HTTP requests and includes error handling to provide feedback on failed operations.
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
      data: {'name': name, 'email': email, 'password': password}, // The register endpoint is assumed to be similar to login in terms of response structure, returning user info and token on success.
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<Map<String, dynamic>>> campaigns() async {
    final Response<dynamic> response = await dio.get('/campaigns');
    return (response.data as List<dynamic>)
        .map((dynamic item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }
  // The donate method submits a new donation to the API, including the campaign ID and any additional details required by the backend. It uses the authenticated session to ensure that only logged-in users can make donations.
  Future<void> donate(Map<String, dynamic> body) async {
    await dio.post(
      '/donations',
      data: body,
      options: Options(headers: authHeader),
    );
  }
  // myDonations fetches the donation history for the authenticated user, allowing them to see their past donations and their statuses. This method also requires authentication and returns a list of donations in a structured format.
  Future<List<Map<String, dynamic>>> myDonations() async {
    final Response<dynamic> response = await dio.get(
      '/donations/me',
      options: Options(headers: authHeader),
    );
    return (response.data as List<dynamic>)
        .map((dynamic item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }
  // trackingByCode retrieves the current status and history of a shipment based on its tracking code. This allows users to track their donations or shipments in real-time, providing transparency and updates on the delivery process.
  Future<Map<String, dynamic>> trackingByCode(String code) async {
    final Response<dynamic> response = await dio.get('/tracking/$code');
    return Map<String, dynamic>.from(response.data as Map);
  }
  // myOperationalShipments fetches the list of shipments that the authenticated user (in this case, an admin or logistics personnel) is responsible for managing. This allows them to see their assigned tasks and update shipment statuses accordingly.
  Future<List<Map<String, dynamic>>> myOperationalShipments() async {
    final Response<dynamic> response = await dio.get(
      '/logistics/mine',
      options: Options(headers: authHeader),
    );
    return (response.data as List<dynamic>)
        .map((dynamic item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }
  // updateShipmentStatus allows logistics personnel to update the status of a shipment, including adding notes, location data, and proof of delivery photos. This method ensures that the shipment's progress is accurately reflected in the system and provides necessary information for both the logistics team and the donors.
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
  // uploadProof handles the uploading of proof of delivery photos to the server. It takes an XFile (which can come from the image picker or camera), converts it to a MultipartFile, and sends it to the API. The server is expected to return a URL for the uploaded photo, which can then be associated with a shipment status update.
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

// HomeShell is the main page shown to authenticated users, which conditionally displays different tabs and content based on the user's role (donor or admin). It also handles interactions from the admin tabs to prefill data in the form tab when scanning codes or selecting shipments.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.session});

  final AppSession session;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

// The state of HomeShell manages the currently selected tab index and any prefill data for the admin form when coming from the scanner or tasks tabs. It builds the UI with a bottom navigation bar that switches between different pages based on the user's role.
class _HomeShellState extends State<HomeShell> {
  int index = 0;
  String? adminPrefillCode;
  String? adminPrefillShipmentId;

  void _handleAdminCode(String code) {
    setState(() {
      adminPrefillCode = code;
      adminPrefillShipmentId = null;
      index = 1;
    });
  }

  void _handleAdminShipment(Map<String, dynamic> shipment) {
    setState(() {
      adminPrefillShipmentId = shipment['id']?.toString();
      adminPrefillCode = shipment['trackingCode']?.toString();
      index = 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool isDonorMode = widget.session.role == 'DONOR';
    final List<Widget> pages = isDonorMode
        ? <Widget>[
            DonorPage(session: widget.session),
            DonorTrackingTab(session: widget.session),
            DonorProfileTab(session: widget.session),
          ]
        : <Widget>[
            AdminScannerTab(
              session: widget.session,
              onCodeCaptured: _handleAdminCode,
            ),
            AdminFormTab(
              session: widget.session,
              prefillCode: adminPrefillCode,
              prefillShipmentId: adminPrefillShipmentId,
            ),
            AdminTasksTab(
              session: widget.session,
              onSelectShipment: _handleAdminShipment,
            ),
          ];

    final List<({IconData icon, String label})> destinations = isDonorMode
        ? <({IconData icon, String label})>[
            (icon: Icons.home_rounded, label: 'Beranda'),
            (icon: Icons.adjust_rounded, label: 'Lacak'),
            (icon: Icons.person_rounded, label: 'Profil'),
          ]
        : <({IconData icon, String label})>[
            (icon: Icons.qr_code_scanner_rounded, label: 'Scanner'),
            (icon: Icons.assignment_rounded, label: 'Form'),
            (icon: Icons.list_alt_rounded, label: 'Tugas'),
          ];

    return AnimatedBuilder(
      animation: widget.session,
      builder: (context, _) {
        return Scaffold(
          appBar: null,
          body: SafeArea(
            child: Padding(
              padding: isDonorMode
                  ? const EdgeInsets.fromLTRB(14, 14, 14, 10)
                  : const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: pages[index],
            ),
          ),
          bottomNavigationBar: SafeArea(
            top: false,
            child: Container(
              margin: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: MoonPalette.lavender.withValues(alpha: 0.28),
                ),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: MoonPalette.lavender.withValues(alpha: 0.18),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                children: List<Widget>.generate(destinations.length, (
                  int tabIndex,
                ) {
                  final bool selected = index == tabIndex;
                  final destination = destinations[tabIndex];
                  return Expanded(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => setState(() => index = tabIndex),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOut,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(11),
                          color: selected
                              ? MoonPalette.orchid.withValues(alpha: 0.52)
                              : Colors.transparent,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Icon(
                              destination.icon,
                              size: 18,
                              color: selected
                                  ? MoonPalette.ink
                                  : MoonPalette.muted,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              destination.label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: selected
                                    ? MoonPalette.ink
                                    : MoonPalette.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        );
      },
    );
  }
}

// AuthPage is a stateful widget that provides the UI and logic for both login and registration. It includes form fields for email, password, and name (for registration), as well as handling API interactions for authentication and displaying messages based on success or failure of operations.
class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.session});

  final AppSession session;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

// The state of AuthPage manages the form fields, loading state, and messages for both login and registration. It includes methods to handle login and registration logic, as well as toggling between the two modes and showing information about password reset (which is not implemented yet).
class _AuthPageState extends State<AuthPage> {
  final TextEditingController loginEmail = TextEditingController();
  final TextEditingController loginPassword = TextEditingController();
  final TextEditingController registerName = TextEditingController();
  final TextEditingController registerEmail = TextEditingController();
  final TextEditingController registerPassword = TextEditingController();
  final TextEditingController apiBase = TextEditingController();
  bool isRegister = false;
  bool showLoginPassword = false;
  bool showRegisterPassword = false;
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
    loginPassword.dispose();
    registerName.dispose();
    registerEmail.dispose();
    registerPassword.dispose();
    apiBase.dispose();
    super.dispose();
  }

  String _nameFromEmail(String email) {
    final String localPart = email.split('@').first.trim();
    if (localPart.isEmpty) return 'Donatur';
    final String clean = localPart.replaceAll(RegExp(r'[^a-zA-Z0-9]'), ' '); // Replace non-alphanumeric characters with space
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
        content: Text(
          'Fitur reset password akan tersedia di update berikutnya.',
        ),
      ),
    );
  }

  // ignore: unused_element
  Future<void> _saveApiBaseOnly() async {
    await widget.session.saveApiBase(apiBase.text);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('API base disimpan: ${widget.session.effectiveApiBase}'),
      ),
    );
  }

  Future<void> _doLogin() async {
    if (loginEmail.text.trim().isEmpty || loginPassword.text.isEmpty) {
      setState(() => message = 'Email dan password wajib diisi.');
      return;
    }

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
        password: loginPassword.text,
      );

      final Map<String, dynamic> user = Map<String, dynamic>.from(
        result['user'] as Map,
      );
      await widget.session.saveSession(
        newToken: result['token'] as String,
        newUserId: user['id'] as String,
        newRole: user['role'] as String,
        newName: user['name'] as String? ?? 'Donatur',
        newEmail: user['email'] as String? ?? '',
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
    if (registerEmail.text.trim().isEmpty || registerPassword.text.isEmpty) {
      setState(() => message = 'Email dan password wajib diisi.');
      return;
    }
    if (registerPassword.text.length < 6) {
      setState(() => message = 'Password minimal 6 karakter.');
      return;
    }
    final RegExp _emailRe = RegExp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$"); // Simple email validation regex
    if (!_emailRe.hasMatch(registerEmail.text.trim())) {
      setState(() => message = 'Email tidak valid.');
      return;
    }

    setState(() {
      loading = true;
      message = '';
    });
    // The registration process is similar to login, but it also includes saving the API base URL before making the request. On successful registration, it saves the session and updates the message accordingly. Error handling is included to provide feedback on what went wrong during registration.
    try {
      await widget.session.saveApiBase(apiBase.text);
      final ApiClient api = ApiClient(widget.session);
      final String email = registerEmail.text.trim();
      final String name = registerName.text.trim();
      final Map<String, dynamic> result = await api.register(
        name: name.isEmpty ? _nameFromEmail(email) : name,
        email: email,
        password: registerPassword.text,
      );

      final Map<String, dynamic> user = Map<String, dynamic>.from(
        result['user'] as Map,
      );
      await widget.session.saveSession(
        newToken: result['token'] as String,
        newUserId: user['id'] as String,
        newRole: user['role'] as String,
        newName: user['name'] as String? ?? 'Donatur',
        newEmail: user['email'] as String? ?? '',
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
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: MoonPalette.lavender.withValues(alpha: 0.28),
                      ),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: <Color>[Color(0xFFF8F2FF), Color(0xFFF0E9FC)],
                      ),
                      boxShadow: <BoxShadow>[
                        BoxShadow(
                          color: const Color(
                            0xFF3E2384,
                          ).withValues(alpha: 0.20),
                          blurRadius: 36,
                          offset: const Offset(0, 14),
                        ),
                      ],
                    ),
                    child: Column(
                      children: <Widget>[
                        Padding(
                          padding: const EdgeInsets.fromLTRB(18, 16, 14, 14),
                          child: Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  onLogin ? 'Log in' : 'Sign up',
                                  style: const TextStyle(
                                    color: MoonPalette.ink,
                                    fontSize: 34,
                                    height: 1,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.8,
                                  ),
                                ),
                              ),
                              IconButton.filledTonal(
                                onPressed: () {
                                  if (!onLogin) {
                                    _toggleMode();
                                    return;
                                  }
                                  setState(() {
                                    message = '';
                                    loginEmail.clear();
                                    loginPassword.clear();
                                  });
                                },
                                style: IconButton.styleFrom(
                                  backgroundColor: MoonPalette.orchid
                                      .withValues(alpha: 0.32),
                                  foregroundColor: MoonPalette.muted,
                                ),
                                icon: const Icon(Icons.close_rounded),
                              ),
                            ],
                          ),
                        ),
                        Divider(
                          height: 1,
                          thickness: 1,
                          color: MoonPalette.lavender.withValues(alpha: 0.20),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
                          child: Column(
                            children: <Widget>[
                              if (!onLogin) ...<Widget>[
                                TextField(
                                  controller: registerName,
                                  textInputAction: TextInputAction.next,
                                  decoration: const InputDecoration(
                                    hintText: 'Name',
                                  ),
                                ),
                                const SizedBox(height: 10),
                              ],
                              TextField(
                                controller: onLogin
                                    ? loginEmail
                                    : registerEmail,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                decoration: const InputDecoration(
                                  hintText: 'E-mail',
                                ),
                              ),
                              const SizedBox(height: 10),
                              TextField(
                                controller: onLogin
                                    ? loginPassword
                                    : registerPassword,
                                obscureText: onLogin
                                    ? !showLoginPassword
                                    : !showRegisterPassword,
                                textInputAction: TextInputAction.done,
                                decoration: InputDecoration(
                                  hintText: 'Password',
                                  suffixIcon: IconButton(
                                    onPressed: () {
                                      setState(() {
                                        if (onLogin) {
                                          showLoginPassword =
                                              !showLoginPassword;
                                        } else {
                                          showRegisterPassword =
                                              !showRegisterPassword;
                                        }
                                      });
                                    },
                                    icon: Icon(
                                      (onLogin
                                              ? showLoginPassword
                                              : showRegisterPassword)
                                          ? Icons.visibility_off_outlined
                                          : Icons.visibility_outlined,
                                      color: MoonPalette.muted,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (onLogin)
                                Align(
                                  alignment: Alignment.center,
                                  child: TextButton(
                                    onPressed: loading
                                        ? null
                                        : _showForgotPasswordInfo,
                                    child: const Text('Forgot your password?'),
                                  ),
                                ),
                              const SizedBox(height: 2),
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: <Color>[
                                      Color(0xFF7D66E8),
                                      MoonPalette.lavender,
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: FilledButton(
                                  onPressed: loading
                                      ? null
                                      : (onLogin ? _doLogin : _doRegister),
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size.fromHeight(48),
                                    backgroundColor: Colors.transparent,
                                    disabledBackgroundColor: Colors.transparent,
                                    shadowColor: Colors.transparent,
                                  ),
                                  child: loading
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : Text(onLogin ? 'Login' : 'Sign up'),
                                ),
                              ),
                              if (message.isNotEmpty) ...<Widget>[
                                const SizedBox(height: 10),
                                Text(
                                  message,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: MoonPalette.muted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Divider(
                          height: 1,
                          thickness: 1,
                          color: MoonPalette.lavender.withValues(alpha: 0.20),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: <Widget>[
                              Text(
                                onLogin
                                    ? "Don't have an account? "
                                    : 'Already have an account? ',
                                style: const TextStyle(
                                  color: MoonPalette.muted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              TextButton(
                                onPressed: loading ? null : _toggleMode,
                                style: TextButton.styleFrom(
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                  padding: EdgeInsets.zero,
                                ),
                                child: Text(
                                  onLogin ? 'Sign up' : 'Log in', // The button text changes based on the current mode, prompting the user to switch to the other mode if needed. The styling emphasizes the action and provides a clear call to action for users who may need to create an account or return to the login screen.
                                  style: const TextStyle(
                                    color: MoonPalette.lavender,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// DonorPage is the main page for donor users, which displays a list of campaigns and the user's donation history. It includes functionality to load campaigns from the API (with caching), display donation history, and submit new donations through a bottom sheet form.
class DonorPage extends StatefulWidget {
  const DonorPage({super.key, required this.session});

  final AppSession session;

  @override
  State<DonorPage> createState() => _DonorPageState();
}

// The state of DonorPage manages the list of campaigns, donation history, loading states, and messages. It includes methods to load campaigns (with caching), load donations, submit new donations, and open a bottom sheet for making a donation to a specific campaign.
class _DonorPageState extends State<DonorPage> {
  static const String campaignCacheKey = 'campaign_cache';
  static const String donationQueueKey = 'donation_queue';

  List<Map<String, dynamic>> campaigns = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> donations = <Map<String, dynamic>>[];
  String message = '';
  bool loading = false;
  bool isCampaignLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCampaigns();
    _loadDonations();
  }

  @override
  void dispose() => super.dispose();

  String _rupiah(int value) {
    final String reversed = value.toString().split('').reversed.join();
    final String grouped = reversed.replaceAllMapped(RegExp(r'.{1,3}'), (
      Match match, 
    ) {
      return '${match.group(0)}.';
    });
    final String normalized = grouped
        .split('')
        .reversed
        .join()
        .replaceFirst(RegExp(r'^\.'), '');
    return 'Rp $normalized'; // The _rupiah method formats an integer value into a string representation of Indonesian Rupiah currency. It reverses the number, groups digits in sets of three, and then reverses it back to create the standard currency format with dots as thousand separators. The final string is prefixed with "Rp " to indicate the currency. This method is used to display donation amounts in a user-friendly format on the donor page.
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0; // The _asInt method is a utility function that attempts to convert a dynamic value into an integer. It handles cases where the value might already be an int, a num (which can be a double), or a string that can be parsed into an integer. If the conversion fails, it returns 0 as a default. This method is useful for ensuring that values representing amounts or quantities are consistently treated as integers throughout the code, especially when dealing with data from APIs that might have varying formats.
  }

  Future<void> _loadDonations() async {
    if (!widget.session.isAuthenticated) return;

    try {
      final ApiClient api = ApiClient(widget.session);
      final List<Map<String, dynamic>> history = await api.myDonations(); // The _loadDonations method fetches the authenticated user's donation history from the API. It checks if the user is authenticated before making the request. If successful, it updates the state with the retrieved donation history. If there's an error (such as the endpoint not being available), it catches the exception and allows for a graceful fallback without crashing the app. This method is called during initialization to populate the donation history on the donor page.
      if (!mounted) return;
      setState(() => donations = history);
    } catch (_) {
      // Keep graceful fallback if history endpoint is not available.
    }
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
      }); // The _loadCampaigns method is responsible for fetching the list of campaigns from the API. It first checks if there is a cached version of the campaigns stored in SharedPreferences. If a cache exists, it loads the campaigns from there to provide a faster initial display. Then, it attempts to fetch the latest campaigns from the API. If the API call is successful, it updates the state with the fresh data and updates the cache. If there's an error during the API call, it retains the cached data and updates the message to inform the user that they are viewing cached data. Finally, it sets the loading state to false once the process is complete.
    }
    // After loading from cache, it proceeds to fetch the latest campaigns from the API. If the API call is successful, it updates the state with the new campaigns and saves them to the cache. If the API call fails, it checks if there were any campaigns loaded from the cache and updates the message to indicate that cached data is being used. This ensures that users can still see campaign information even if there are issues with fetching fresh data from the server.
    try {
      final ApiClient api = ApiClient(widget.session);
      final List<Map<String, dynamic>> fresh = await api.campaigns();
      setState(() => campaigns = fresh);
      await prefs.setString(campaignCacheKey, jsonEncode(fresh));
    } catch (_) {
      if (campaigns.isNotEmpty) {
        setState(() => message = 'Menggunakan data cache lokal.');
      }
    } finally {
      if (mounted) {
        setState(() => isCampaignLoading = false);
      }
    }
  }

  String _campaignImageUrl(Map<String, dynamic> campaign) {
    final String? fromApi = campaign['imageUrl']?.toString();
    if (fromApi != null && fromApi.isNotEmpty) {
      return fromApi; // The _campaignImageUrl method generates a URL for the campaign's image. It first checks if the campaign data includes an 'imageUrl' field that is a non-empty string. If such a URL exists, it returns that URL directly. If not, it constructs a placeholder image URL using the campaign's title and disaster type as seeds for the Picsum Photos service. This ensures that even campaigns without a specified image will have a unique and visually distinct placeholder image based on their content.
    }

    final String title = Uri.encodeComponent(
      campaign['title']?.toString() ?? 'donasi',
    );
    final String disaster = Uri.encodeComponent(
      campaign['disasterType']?.toString() ?? 'bencana',
    );
    return 'https://picsum.photos/seed/$title-$disaster/800/360'; // If the campaign does not have a specific image URL, the method creates a unique placeholder image URL using the campaign's title and disaster type. It encodes these values to ensure they are safe for use in a URL and then constructs a URL for the Picsum Photos service, which will generate a random image based on the provided seed. This allows each campaign to have a visually distinct image even if no specific image is provided by the API.
  }

  Widget _buildCampaignSkeletonCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.74),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: MoonPalette.lavender.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            height: 68,
            decoration: BoxDecoration(
              color: MoonPalette.orchid.withValues(alpha: 0.42),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 12,
            width: 180,
            decoration: BoxDecoration(
              color: MoonPalette.orchid.withValues(alpha: 0.38),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            height: 9,
            width: 140,
            decoration: BoxDecoration(
              color: MoonPalette.thistle.withValues(alpha: 0.52),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: MoonPalette.thistle.withValues(alpha: 0.52),
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            height: 36,
            decoration: BoxDecoration(
              color: MoonPalette.orchid.withValues(alpha: 0.34),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitDonation(Map<String, dynamic> body) async {
    if (!widget.session.isAuthenticated) {
      setState(() => message = 'Login sebagai DONOR dulu.');
      return;
    }

    setState(() {
      loading = true;
      message = '';
    });

    try {
      final ApiClient api = ApiClient(widget.session);
      await api.donate(body);
      await _loadDonations();
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

  Future<void> _openDonateSheet(Map<String, dynamic> campaign) async {
    final TextEditingController amountController = TextEditingController();
    final TextEditingController itemNameController = TextEditingController();
    final TextEditingController quantityController = TextEditingController();
    final TextEditingController proofUrlController = TextEditingController();
    String donationType = 'MONEY';
    bool localLoading = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF2E2E2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                14,
                16,
                14 + MediaQuery.of(context).viewInsets.bottom,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      'Donasi untuk ${campaign['title']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: donationType,
                      dropdownColor: const Color(0xFF3A3A3A),
                      items: const <DropdownMenuItem<String>>[
                        DropdownMenuItem(value: 'MONEY', child: Text('Uang')),
                        DropdownMenuItem(value: 'GOODS', child: Text('Barang')),
                      ],
                      onChanged: (String? value) {
                        setModalState(() => donationType = value ?? 'MONEY');
                      },
                      decoration: const InputDecoration(
                        labelText: 'Jenis donasi',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Nominal (untuk uang)',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: itemNameController,
                      decoration: const InputDecoration(
                        labelText: 'Nama barang (untuk barang)',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: quantityController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Jumlah barang',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: proofUrlController,
                      decoration: const InputDecoration(
                        labelText: 'URL bukti transfer/foto',
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: localLoading
                          ? null
                          : () async {
                              final Map<String, dynamic> body =
                                  <String, dynamic>{
                                    'campaignId': campaign['id']?.toString(),
                                    'type': donationType,
                                    'amount':
                                        amountController.text.trim().isEmpty
                                        ? null
                                        : int.tryParse(
                                            amountController.text.trim(),
                                          ),
                                    'itemName':
                                        itemNameController.text.trim().isEmpty
                                        ? null
                                        : itemNameController.text.trim(),
                                    'quantity':
                                        quantityController.text.trim().isEmpty
                                        ? null
                                        : int.tryParse(
                                            quantityController.text.trim(),
                                          ),
                                    'transferProofUrl':
                                        proofUrlController.text.trim().isEmpty
                                        ? null
                                        : proofUrlController.text.trim(),
                                  };

                              setModalState(() => localLoading = true);
                              await _submitDonation(body);
                              if (!context.mounted) return;
                              Navigator.pop(context);
                            },
                      child: Text(
                        localLoading ? 'Mengirim...' : 'Kirim Donasi',
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    amountController.dispose();
    itemNameController.dispose();
    quantityController.dispose();
    proofUrlController.dispose();
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
    final int totalDonation = donations
        .where(
          (Map<String, dynamic> donation) =>
              donation['verificationStatus']?.toString() == 'VERIFIED',
        )
        .fold<int>(
          0,
          (int sum, Map<String, dynamic> donation) =>
              sum + _asInt(donation['amount']),
        );
    final int totalCampaignHelped = donations
        .map((Map<String, dynamic> donation) => donation['campaignId'])
        .whereType<String>()
        .toSet()
        .length;
    final List<Map<String, dynamic>> activeCampaigns = campaigns
        .where(
          (Map<String, dynamic> campaign) =>
              campaign['status']?.toString() == 'OPEN',
        )
        .toList();

    return ListView(
      padding: const EdgeInsets.all(0),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.78),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: MoonPalette.lavender.withValues(alpha: 0.22),
            ),
          ),
          child: Row(
            children: <Widget>[
              Icon(
                Icons.lock,
                color: MoonPalette.lavender.withValues(alpha: 0.92),
                size: 16,
              ),
              const SizedBox(width: 6),
              const Text(
                'DonasiTrack',
                style: TextStyle(
                  color: MoonPalette.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: MoonPalette.orchid.withValues(alpha: 0.42),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Row(
                  children: <Widget>[
                    Icon(
                      Icons.circle,
                      size: 8,
                      color: MoonPalette.lavender.withValues(alpha: 0.92),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Online',
                      style: TextStyle(
                        color: MoonPalette.ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: <Color>[
                Color(0xFF8B73EF),
                Color(0xFFA890F8),
              ],
            ),
            borderRadius: BorderRadius.circular(14),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: MoonPalette.lavender.withValues(alpha: 0.2),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text(
                'Total donasi kamu',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),

              const SizedBox(height: 3),

              Text(
                _rupiah(totalDonation),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 36,
                  height: 1,
                ),
              ),

              const SizedBox(height: 4),

              Text(
                '$totalCampaignHelped kampanye didukung',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                ),
              ),

              const SizedBox(height: 8),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Kampanye Aktif',
          style: TextStyle(
            color: MoonPalette.ink,
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),
        if (isCampaignLoading && activeCampaigns.isEmpty) ...<Widget>[
          _buildCampaignSkeletonCard(),
          _buildCampaignSkeletonCard(),
        ],
        ...activeCampaigns.map((Map<String, dynamic> campaign) {
          final int target = _asInt(campaign['targetAmount']);
          final int collected = _asInt(campaign['collectedAmount']);
          final int progress = target <= 0
              ? 0
              : ((collected / target) * 100).clamp(0, 100).round();

          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.76),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: MoonPalette.lavender.withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                SizedBox(
                  height: 68,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      _campaignImageUrl(campaign),
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorBuilder:
                          (BuildContext context, Object _, StackTrace? __) {
                            return Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: <Color>[
                                    campaign['disasterType']?.toString() ==
                                            'Banjir'
                                        ? const Color(0xFFA6C9EF)
                                        : const Color(0xFF9BDDC4),
                                    campaign['disasterType']?.toString() ==
                                            'Banjir'
                                        ? const Color(0xFF4A90E2)
                                        : const Color(0xFF6ED1B0),
                                  ],
                                ),
                              ),
                              alignment: Alignment.center,
                              child: const Icon(
                                Icons.volunteer_activism,
                                color: Colors.white,
                                size: 24,
                              ),
                            );
                          },
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  campaign['title']?.toString() ?? '-',
                  style: const TextStyle(
                    color: MoonPalette.ink,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Target: ${_rupiah(target)}',
                  style: const TextStyle(
                    color: MoonPalette.muted,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: progress / 100,
                    minHeight: 6,
                    backgroundColor: MoonPalette.thistle.withValues(alpha: 0.9),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      MoonPalette.lavender,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: <Widget>[
                    Text(
                      '${_rupiah(collected)} terkumpul',
                      style: const TextStyle(
                        color: MoonPalette.muted,
                        fontSize: 11,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '$progress%',
                      style: const TextStyle(
                        color: MoonPalette.lavender,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: loading ? null : () => _openDonateSheet(campaign),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: MoonPalette.ink,
                    side: BorderSide(
                      color: MoonPalette.lavender.withValues(alpha: 0.38),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Donasi Sekarang'),
                ),
              ],
            ),
          );
        }),
        if (activeCampaigns.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text(
              'Belum ada kampanye aktif. Silakan minta admin membuat kampanye baru.',
              style: TextStyle(color: MoonPalette.muted),
            ),
          ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: _syncDonationQueue,
          child: const Text('Sync donasi offline'),
        ),
        if (message.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              message,
              style: const TextStyle(color: MoonPalette.muted),
            ),
          ),
      ],
    );
  }
}

// DonorTrackingTab is a stateful widget that allows donors to track their donations using a tracking code. It includes a text field for entering the tracking code, a button to search for the tracking information, and displays the tracking events in a list format with visual indicators for each status.
class DonorTrackingTab extends StatefulWidget {
  const DonorTrackingTab({super.key, required this.session});

  final AppSession session;

  @override
  State<DonorTrackingTab> createState() => _DonorTrackingTabState();
}

// The state of DonorTrackingTab manages the tracking code input, the payload of tracking information, messages for the user, and loading states. It includes methods to find tracking information based on the code, determine visual indicators for different tracking statuses, and build the UI to display the tracking events.
class _DonorTrackingTabState extends State<DonorTrackingTab> {
  final TextEditingController code = TextEditingController();
  Map<String, dynamic>? payload;
  String message = '';
  bool isTrackingLoading = false;

  @override
  void dispose() {
    code.dispose();
    super.dispose();
  }

  Future<void> _findTracking() async {
    setState(() {
      isTrackingLoading = true;
      message = '';
    });

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
    } finally {
      if (mounted) {
        setState(() => isTrackingLoading = false);
      }
    }
  }

  ({IconData icon, Color color}) _statusVisual(String status) {
    switch (status) {
      case 'DELIVERED':
        return (icon: Icons.check, color: const Color(0xFF2AC89A));
      case 'IN_TRANSIT':
        return (icon: Icons.local_shipping, color: const Color(0xFFF0A329));
      case 'PICKED_UP':
        return (icon: Icons.move_up, color: const Color(0xFFF0A329));
      case 'FAILED':
        return (icon: Icons.close, color: const Color(0xFFE45F6B));
      default:
        return (icon: Icons.access_time, color: Colors.white54);
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<dynamic> events = payload == null
        ? <dynamic>[]
        : (payload!['trackingEvents'] as List<dynamic>? ?? <dynamic>[]);

    return ListView(
      padding: const EdgeInsets.all(0),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.78),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: MoonPalette.lavender.withValues(alpha: 0.22),
            ),
          ),
          child: Row(
            children: <Widget>[
              Icon(
                Icons.lock,
                color: MoonPalette.lavender.withValues(alpha: 0.92),
                size: 16,
              ),
              const SizedBox(width: 6),
              const Text(
                'DonasiTrack',
                style: TextStyle(
                  color: MoonPalette.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: MoonPalette.orchid.withValues(alpha: 0.42),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Row(
                  children: <Widget>[
                    Icon(
                      Icons.circle,
                      size: 8,
                      color: MoonPalette.lavender.withValues(alpha: 0.92),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Online',
                      style: TextStyle(
                        color: MoonPalette.ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Lacak Donasimu',
          style: TextStyle(
            color: MoonPalette.ink,
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: <Widget>[
            Expanded(
              child: TextField(
                controller: code,
                decoration: const InputDecoration(
                  hintText: 'Masukkan ID donasi...',
                ),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(onPressed: _findTracking, child: const Text('Cari')),
          ],
        ),
        if (isTrackingLoading) ...<Widget>[
          const SizedBox(height: 14),
          ...List<Widget>.generate(3, (int index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(
                      color: Color(0x66C7B7FC),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Container(
                          height: 11,
                          width: 120,
                          decoration: BoxDecoration(
                            color: MoonPalette.orchid.withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(7),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 9,
                          width: 170,
                          decoration: BoxDecoration(
                            color: MoonPalette.thistle.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(7),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
        if (message.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(
              message,
              style: const TextStyle(color: MoonPalette.muted),
            ),
          ),
        if (payload != null) ...<Widget>[
          const SizedBox(height: 14),
          Text(
            'Donasi #${payload!['trackingCode'] ?? '-'} - ${payload!['campaign']?['title'] ?? '-'}',
            style: const TextStyle(
              color: MoonPalette.ink,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 14),
          ...events.map((dynamic item) {
            final Map<String, dynamic> event = Map<String, dynamic>.from(
              item as Map,
            );
            final String status = event['status']?.toString() ?? '';
            final visual = _statusVisual(status);
            final String createdAt = event['createdAt']?.toString() ?? '';
            final String trimmedDate = createdAt.length >= 16
                ? createdAt.substring(0, 16).replaceFirst('T', ' ')
                : createdAt;

            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: visual.color,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(visual.icon, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          status,
                          style: const TextStyle(
                            color: MoonPalette.ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          event['note']?.toString() ?? 'Tanpa catatan',
                          style: const TextStyle(
                            color: MoonPalette.muted,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          trimmedDate,
                          style: const TextStyle(
                            color: MoonPalette.muted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ],
    );
  }
}

// DonorProfileTab is a stateful widget that displays the donor's profile information, including their name, email, total donations, and the number of campaigns they have supported. It also includes a method to load the donor's profile statistics from the API and display them in a visually appealing format.
class DonorProfileTab extends StatefulWidget {
  const DonorProfileTab({super.key, required this.session});

  final AppSession session;

  @override
  State<DonorProfileTab> createState() => _DonorProfileTabState();
}

// The state of DonorProfileTab manages the total donation amount, the total number of campaigns helped, and the loading state for the profile information. It includes a method to load the profile statistics from the API, which calculates the total donations and campaigns supported by the donor, and updates the UI accordingly.
class _DonorProfileTabState extends State<DonorProfileTab> {
  int totalDonation = 0;
  int totalCampaignHelped = 0;
  bool loadingProfile = true;

  String _rupiah(int value) {
    final String reversed = value.toString().split('').reversed.join();
    final String grouped = reversed.replaceAllMapped(RegExp(r'.{1,3}'), (
      Match match,
    ) {
      return '${match.group(0)}.';
    });
    final String normalized = grouped
        .split('')
        .reversed
        .join()
        .replaceFirst(RegExp(r'^\.'), '');
    return 'Rp $normalized';
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  @override
  void initState() {
    super.initState();
    _loadProfileStats();
  }

  Future<void> _loadProfileStats() async {
    if (!widget.session.isAuthenticated) return;
    try {
      final ApiClient api = ApiClient(widget.session);
      final List<Map<String, dynamic>> donations = await api.myDonations();
      final int sum = donations
          .where(
            (Map<String, dynamic> donation) =>
                donation['verificationStatus']?.toString() == 'VERIFIED',
          )
          .fold<int>(
            0,
            (int acc, Map<String, dynamic> donation) =>
                acc + _asInt(donation['amount']),
          );
      final int campaignCount = donations
          .map((Map<String, dynamic> donation) => donation['campaignId'])
          .whereType<String>()
          .toSet()
          .length;

      if (!mounted) return;
      setState(() {
        totalDonation = sum;
        totalCampaignHelped = campaignCount;
        loadingProfile = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        totalDonation = 0;
        totalCampaignHelped = 0;
        loadingProfile = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(0),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.78),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: MoonPalette.lavender.withValues(alpha: 0.22),
            ),
          ),
          child: Row(
            children: <Widget>[
              Icon(
                Icons.lock,
                color: MoonPalette.lavender.withValues(alpha: 0.92),
                size: 16,
              ),
              const SizedBox(width: 6),
              const Text(
                'DonasiTrack',
                style: TextStyle(
                  color: MoonPalette.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: MoonPalette.orchid.withValues(alpha: 0.42),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Row(
                  children: <Widget>[
                    Icon(
                      Icons.circle,
                      size: 8,
                      color: MoonPalette.lavender.withValues(alpha: 0.92),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Online',
                      style: TextStyle(
                        color: MoonPalette.ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 26),
        CircleAvatar(
          radius: 36,
          backgroundColor: Colors.white.withValues(alpha: 0.85),
          child: Text(
            widget.session.name.isEmpty
                ? 'D'
                : widget.session.name.characters.first.toUpperCase(),
            style: const TextStyle(
              fontSize: 30,
              color: MoonPalette.lavender,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            widget.session.name,
            style: const TextStyle(
              color: MoonPalette.ink,
              fontWeight: FontWeight.w800,
              fontSize: 24,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Center(
          child: Text(
            widget.session.email,
            style: const TextStyle(color: MoonPalette.muted, fontSize: 13),
          ),
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.76),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: MoonPalette.lavender.withValues(alpha: 0.2),
            ),
          ),
          child: loadingProfile
              ? Column(
                  children: <Widget>[
                    Container(
                      height: 14,
                      decoration: BoxDecoration(
                        color: MoonPalette.orchid.withValues(alpha: 0.38),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      height: 14,
                      decoration: BoxDecoration(
                        color: MoonPalette.thistle.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ],
                )
              : Column(
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        const Text(
                          'Total donasi',
                          style: TextStyle(
                            color: MoonPalette.muted,
                            fontSize: 13,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          _rupiah(totalDonation),
                          style: const TextStyle(
                            color: MoonPalette.ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 17,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: <Widget>[
                        const Text(
                          'Kampanye dibantu',
                          style: TextStyle(
                            color: MoonPalette.muted,
                            fontSize: 13,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '$totalCampaignHelped kampanye',
                          style: const TextStyle(
                            color: MoonPalette.ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 17,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
        const SizedBox(height: 18),
        OutlinedButton.icon(
          onPressed: widget.session.logout,
          icon: const Icon(Icons.logout),
          label: const Text('Logout'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      ],
    );
  }
}

// AdminHeader is a stateless widget that displays the header section for the admin interface. It includes the application name, user role, online status, and a logout button. It also displays the title and subtitle for the current admin page.
class AdminHeader extends StatelessWidget {
  const AdminHeader({
    super.key,
    required this.session,
    required this.title,
    this.subtitle,
  });

  final AppSession session;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: MoonPalette.lavender.withValues(alpha: 0.25),
                ),
              ),
              child: const Icon(Icons.shield_rounded, size: 18),
            ),
            const SizedBox(width: 8),
            const Text(
              'DonasiTrack',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F4EA),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text(
                'Relawan',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0E6B63),
                ),
              ),
            ),
            const Spacer(),
            Row(
              children: <Widget>[
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF22C55E),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'Online',
                  style: TextStyle(fontSize: 12, color: MoonPalette.muted),
                ),
                IconButton(
                  onPressed: session.logout,
                  icon: const Icon(Icons.logout, size: 18),
                  tooltip: 'Logout',
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        if (subtitle != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              subtitle!,
              style: const TextStyle(color: MoonPalette.muted),
            ),
          ),
      ],
    );
  }
}

// AdminScannerTab is a stateful widget that provides an interface for volunteers to scan QR codes of aid recipients. It includes a button to initiate the QR code scanning process, and displays messages based on the scanning results. The scanned code is passed back to the parent widget through a callback function.
class AdminScannerTab extends StatefulWidget {
  const AdminScannerTab({
    super.key,
    required this.session,
    required this.onCodeCaptured,
  });

  final AppSession session;
  final ValueChanged<String> onCodeCaptured;

  @override
  State<AdminScannerTab> createState() => _AdminScannerTabState();
}

// The state of AdminScannerTab manages the message to be displayed to the user based on the scanning results. It includes a method to initiate the QR code scanning process, which navigates to a separate page for scanning and waits for the result. If a valid QR code is scanned, it updates the message and calls the provided callback function with the scanned code.
class _AdminScannerTabState extends State<AdminScannerTab> {
  String message = '';

  Future<void> _scanQrCode() async {
    final String? scanned = await Navigator.push<String>(
      context,
      MaterialPageRoute<String>(builder: (_) => const QrScannerPage()),
    );
    if (scanned != null && scanned.isNotEmpty) {
      setState(() => message = 'QR terbaca: $scanned');
      widget.onCodeCaptured(scanned);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
      children: <Widget>[
        AdminHeader(
          session: widget.session,
          title: 'Scanner QR Bantuan',
          subtitle: 'Arahkan kamera ke QR Code penerima bantuan.',
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: <Widget>[
                Container(
                  height: 210,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F2434),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFF4ADE80),
                      width: 1.2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.qr_code_scanner,
                      color: Colors.white54,
                      size: 54,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Arahkan ke QR Code penerima',
                  style: TextStyle(color: MoonPalette.muted),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _scanQrCode,
                  child: const Text('Scan QR'),
                ),
                if (message.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      message,
                      style: const TextStyle(color: MoonPalette.muted),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// AdminFormTab is a stateful widget that provides a form interface for volunteers to update the status of aid deliveries. It includes fields for entering the shipment ID or tracking code, recipient name, notes, and options to capture location and upload proof photos. The form data is submitted to the API to update the shipment status.
class AdminFormTab extends StatefulWidget {
  const AdminFormTab({
    super.key,
    required this.session,
    this.prefillCode,
    this.prefillShipmentId,
  });

  final AppSession session;
  final String? prefillCode;
  final String? prefillShipmentId;

  @override
  State<AdminFormTab> createState() => _AdminFormTabState();
}

// The state of AdminFormTab manages the input fields for shipment ID, recipient name, notes, the selected status, messages for the user, the URL of the uploaded photo proof, and the captured location. It includes methods to resolve the shipment ID from a tracking code, capture the user's location, pick and upload a photo as proof, and submit the tracking information to the API. If the submission fails (e.g., due to network issues), it queues the tracking data locally using SharedPreferences for later synchronization.
class _AdminFormTabState extends State<AdminFormTab> {
  static const String trackingQueueKey = 'tracking_queue';

  final TextEditingController shipmentInput = TextEditingController();
  final TextEditingController recipientName = TextEditingController();
  final TextEditingController note = TextEditingController();

  String status = 'DELIVERED';
  String message = '';
  String? uploadedPhotoUrl;
  Position? position;

  @override
  void initState() {
    super.initState();
    _applyPrefill();
  }

  @override
  void didUpdateWidget(AdminFormTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.prefillCode != widget.prefillCode ||
        oldWidget.prefillShipmentId != widget.prefillShipmentId) {
      _applyPrefill();
    }
  }

  void _applyPrefill() {
    if (widget.prefillShipmentId != null &&
        widget.prefillShipmentId!.trim().isNotEmpty) {
      shipmentInput.text = widget.prefillShipmentId!.trim();
    } else if (widget.prefillCode != null &&
        widget.prefillCode!.trim().isNotEmpty) {
      shipmentInput.text = widget.prefillCode!.trim();
    }
  }

  @override
  void dispose() {
    shipmentInput.dispose();
    recipientName.dispose();
    note.dispose();
    super.dispose();
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

    if (shipmentInput.text.trim().isEmpty) {
      setState(() => message = 'Tracking code atau shipment ID wajib diisi.');
      return;
    }

    final String shipmentId = await _resolveShipmentId(shipmentInput.text);
    final List<String> noteParts = <String>[];
    if (recipientName.text.trim().isNotEmpty) {
      noteParts.add('Penerima: ${recipientName.text.trim()}');
    }
    if (note.text.trim().isNotEmpty) {
      noteParts.add(note.text.trim());
    }
    final String? combinedNote = noteParts.isEmpty
        ? null
        : noteParts.join(' - ');

    final Map<String, dynamic> body = <String, dynamic>{
      'shipmentId': shipmentId,
      'status': status,
      'note': combinedNote,
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

  @override
  Widget build(BuildContext context) {
    final String gpsLabel = position == null
        ? 'Belum diambil'
        : '${position!.latitude.toStringAsFixed(5)}, ${position!.longitude.toStringAsFixed(5)}';

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
      children: <Widget>[
        AdminHeader(
          session: widget.session,
          title: 'Bukti Serah Terima',
          subtitle: 'Lengkapi laporan penyerahan bantuan di lapangan.',
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                TextField(
                  controller: shipmentInput,
                  decoration: const InputDecoration(
                    labelText: 'Tracking Code / Shipment ID',
                    hintText: 'contoh: DNT-123456-ABCD',
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children:
                      <String>[
                        'PICKED_UP',
                        'IN_TRANSIT',
                        'DELIVERED',
                        'FAILED',
                      ].map((String value) {
                        final bool selected = status == value;
                        return ChoiceChip(
                          label: Text(value),
                          selected: selected,
                          onSelected: (_) => setState(() => status = value),
                        );
                      }).toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: recipientName,
                  decoration: const InputDecoration(labelText: 'Nama Penerima'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: note,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Catatan',
                    hintText: 'Kondisi penerima, catatan penting...',
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Upload Foto Bukti',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _pickAndUploadPhoto,
                  child: Container(
                    height: 110,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: MoonPalette.lavender.withValues(alpha: 0.25),
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        const Icon(Icons.camera_alt_outlined),
                        const SizedBox(height: 6),
                        Text(
                          uploadedPhotoUrl == null
                              ? 'Tap untuk upload foto'
                              : 'Foto siap diupload',
                          style: const TextStyle(color: MoonPalette.muted),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: <Widget>[
                    Expanded(child: Text('Koordinat GPS\n$gpsLabel')),
                    OutlinedButton(
                      onPressed: _captureLocation,
                      child: const Text('Ambil Lokasi'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submitTracking,
                    child: const Text('Kirim Laporan'),
                  ),
                ),
                if (message.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      message,
                      style: const TextStyle(color: MoonPalette.muted),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// AdminTasksTab is a stateful widget that displays the list of operational tasks assigned to the volunteer. It fetches the list of shipments from the API and displays them in a card format, showing the campaign title, item details, destination, and status. The volunteer can tap on a shipment to view more details or update its status.
class AdminTasksTab extends StatefulWidget {
  const AdminTasksTab({
    super.key,
    required this.session,
    required this.onSelectShipment,
  });

  final AppSession session;
  final ValueChanged<Map<String, dynamic>> onSelectShipment;

  @override
  State<AdminTasksTab> createState() => _AdminTasksTabState();
}

// The state of AdminTasksTab manages the future that loads the list of shipments assigned to the volunteer. It includes a method to fetch the shipments from the API, and helper methods to determine the color and label for each shipment status. The build method uses a FutureBuilder to display the list of shipments, showing loading indicators, error messages, or the shipment cards as appropriate.
class _AdminTasksTabState extends State<AdminTasksTab> {
  late Future<List<Map<String, dynamic>>> futureShipments = _loadShipments();

  Future<List<Map<String, dynamic>>> _loadShipments() async {
    final ApiClient api = ApiClient(widget.session);
    return api.myOperationalShipments();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'CREATED':
        return const Color(0xFFFBBF24);
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return const Color(0xFF22C55E);
      case 'DELIVERED':
        return const Color(0xFF3B82F6);
      case 'FAILED':
        return const Color(0xFFEF4444);
      default:
        return MoonPalette.muted;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'CREATED':
        return 'Menunggu';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'Aktif';
      case 'DELIVERED':
        return 'Selesai';
      case 'FAILED':
        return 'Gagal';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: futureShipments,
      builder: (context, snapshot) {
        final List<Map<String, dynamic>> shipments =
            snapshot.data ?? <Map<String, dynamic>>[];

        return RefreshIndicator(
          onRefresh: () async {
            setState(() => futureShipments = _loadShipments());
            await futureShipments;
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
            children: <Widget>[
              AdminHeader(
                session: widget.session,
                title: 'Tugas Hari Ini',
                subtitle: 'Daftar pengiriman yang ditugaskan ke Anda.',
              ),
              const SizedBox(height: 12),
              if (snapshot.connectionState == ConnectionState.waiting)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(),
                  ),
                ),
              if (snapshot.hasError)
                const Text('Gagal memuat tugas. Tarik untuk refresh.'),
              if (snapshot.connectionState != ConnectionState.waiting &&
                  shipments.isEmpty)
                const Text('Belum ada tugas operasional.'),
              ...shipments.map((Map<String, dynamic> item) {
                final Map<String, dynamic> campaign = Map<String, dynamic>.from(
                  (item['campaign'] ?? <String, dynamic>{}) as Map,
                );
                final Map<String, dynamic> inventory =
                    Map<String, dynamic>.from(
                      (item['item'] ?? <String, dynamic>{}) as Map,
                    );
                final String status = item['status']?.toString() ?? '-';
                final String title =
                    campaign['title']?.toString() ??
                    inventory['name']?.toString() ??
                    'Pengiriman Bantuan';
                final String subtitle =
                    '${inventory['quantity'] ?? item['quantity'] ?? '-'} ${inventory['name'] ?? 'paket'} - ${item['destinationLocation'] ?? '-'}';

                return Card(
                  child: ListTile(
                    onTap: () => widget.onSelectShipment(item),
                    title: Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(subtitle),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        _statusLabel(status),
                        style: TextStyle(
                          color: _statusColor(status),
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

// TrackingPage is a stateful widget that provides an interface for users to track the status of their aid deliveries using a tracking code. It includes a text field for entering the tracking code, a button to search for the tracking information, and displays the tracking details and timeline of events related to the aid delivery. The tracking information is fetched from the API based on the entered tracking code.
class TrackingPage extends StatefulWidget {
  const TrackingPage({super.key, required this.session});

  final AppSession session;

  @override
  State<TrackingPage> createState() => _TrackingPageState();
}

// The state of TrackingPage manages the input field for the tracking code, the payload of tracking information retrieved from the API, and messages to be displayed to the user. It includes a method to fetch the tracking information based on the entered tracking code, and updates the UI accordingly. The build method displays the input field, search button, and if tracking information is available, it shows the status, campaign details, item details, and a timeline of events related to the aid delivery.
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
                Text(
                  'Tracking Bantuan',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
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
            child: Text(
              message,
              style: const TextStyle(color: MoonPalette.muted),
            ),
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

// QrScannerPage is a stateful widget that provides a full-screen interface for scanning QR codes using the device's camera. It uses the MobileScanner package to access the camera and detect QR codes. When a QR code is detected, it captures the code value and returns it to the previous page through the Navigator.
class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

// The state of QrScannerPage manages a boolean flag to prevent multiple captures of QR codes. It builds a Scaffold with an AppBar and a MobileScanner widget as the body. The MobileScanner listens for barcode detections, and when a valid QR code is detected, it sets the captured flag to true and pops the page, returning the scanned code value to the previous page.
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
