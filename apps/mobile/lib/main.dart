import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Donasi Track Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F7B6C)),
        useMaterial3: true,
      ),
      home: FutureBuilder<void>(
        future: bootstrap,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          return HomeShell(session: session);
        },
      ),
    );
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
    required String role,
  }) async {
    final Response<dynamic> response = await dio.post(
      '/auth/register',
      data: {'name': name, 'email': email, 'password': password, 'role': role},
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
      AuthPage(session: widget.session),
      DonorPage(session: widget.session),
      VolunteerPage(session: widget.session),
      TrackingPage(session: widget.session),
    ];

    return AnimatedBuilder(
      animation: widget.session,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Donasi Track Flutter'),
            actions: <Widget>[
              if (widget.session.isAuthenticated)
                IconButton(
                  onPressed: widget.session.logout,
                  icon: const Icon(Icons.logout),
                  tooltip: 'Logout',
                ),
            ],
          ),
          body: pages[index],
          bottomNavigationBar: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: (int value) => setState(() => index = value),
            destinations: const <NavigationDestination>[
              NavigationDestination(icon: Icon(Icons.login), label: 'Auth'),
              NavigationDestination(
                icon: Icon(Icons.volunteer_activism),
                label: 'Donatur',
              ),
              NavigationDestination(
                icon: Icon(Icons.qr_code_scanner),
                label: 'Relawan',
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
  final TextEditingController loginPassword = TextEditingController();
  final TextEditingController registerName = TextEditingController();
  final TextEditingController registerEmail = TextEditingController();
  final TextEditingController registerPassword = TextEditingController();
  final TextEditingController apiBase = TextEditingController();
  String registerRole = 'DONOR';
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

  Future<void> _doLogin() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
      await widget.session.saveApiBase(apiBase.text);
      final ApiClient api = ApiClient(widget.session);
      final Map<String, dynamic> result = await api.login(
        email: loginEmail.text.trim(),
        password: loginPassword.text.trim(),
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
      final Map<String, dynamic> result = await api.register(
        name: registerName.text.trim(),
        email: registerEmail.text.trim(),
        password: registerPassword.text.trim(),
        role: registerRole,
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          TextField(
            controller: apiBase,
            decoration: const InputDecoration(
              labelText: 'API Base URL',
              hintText: 'http://10.0.2.2:4000/api',
            ),
          ),
          const SizedBox(height: 8),
          Text('Aktif: ${widget.session.effectiveApiBase}'),
          const SizedBox(height: 12),
          Text('Session role: ${widget.session.role}'),
          const Divider(height: 28),
          const Text('Login', style: TextStyle(fontWeight: FontWeight.bold)),
          TextField(
            controller: loginEmail,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          TextField(
            controller: loginPassword,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: loading ? null : _doLogin,
            child: const Text('Login'),
          ),
          const Divider(height: 28),
          const Text(
            'Registrasi',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextField(
            controller: registerName,
            decoration: const InputDecoration(labelText: 'Nama'),
          ),
          TextField(
            controller: registerEmail,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          TextField(
            controller: registerPassword,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          DropdownButtonFormField<String>(
            initialValue: registerRole,
            items: const <DropdownMenuItem<String>>[
              DropdownMenuItem(value: 'DONOR', child: Text('DONOR')),
              DropdownMenuItem(value: 'VOLUNTEER', child: Text('VOLUNTEER')),
              DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
            ],
            onChanged: (String? value) =>
                setState(() => registerRole = value ?? 'DONOR'),
            decoration: const InputDecoration(labelText: 'Role'),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: loading ? null : _doRegister,
            child: const Text('Registrasi'),
          ),
          if (message.isNotEmpty) ...<Widget>[
            const SizedBox(height: 10),
            Text(message),
          ],
        ],
      ),
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
        const Text(
          'Eksplorasi Kampanye',
          style: TextStyle(fontWeight: FontWeight.bold),
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
        const Divider(height: 30),
        const Text(
          'Form Donasi',
          style: TextStyle(fontWeight: FontWeight.bold),
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
          Padding(padding: const EdgeInsets.only(top: 8), child: Text(message)),
      ],
    );
  }
}

class VolunteerPage extends StatefulWidget {
  const VolunteerPage({super.key, required this.session});

  final AppSession session;

  @override
  State<VolunteerPage> createState() => _VolunteerPageState();
}

class _VolunteerPageState extends State<VolunteerPage> {
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
      setState(() => message = 'Login sebagai VOLUNTEER dulu.');
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
        const Text(
          'Relawan Lapangan',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
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
          Padding(padding: const EdgeInsets.only(top: 8), child: Text(message)),
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
        const Text(
          'Tracking Bantuan',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
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
          Padding(padding: const EdgeInsets.only(top: 8), child: Text(message)),
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
