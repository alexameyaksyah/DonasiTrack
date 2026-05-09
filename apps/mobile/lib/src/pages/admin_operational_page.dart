import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../session.dart';
import '../api_client.dart';
import '../widgets/qr_scanner_page.dart';

class AdminOperationalPage extends StatefulWidget {
  const AdminOperationalPage({required this.session, super.key});

  final AppSession session;

  @override
  State<AdminOperationalPage> createState() => _AdminOperationalPageState();
}

class _AdminOperationalPageState extends State<AdminOperationalPage> {
  static const String trackingQueueKey = 'tracking_queue';

  final TextEditingController shipmentInput = TextEditingController();
  final TextEditingController note = TextEditingController();
  final TextEditingController apiBaseController = TextEditingController();

  String status = 'PICKED_UP';
  String message = '';
  String? uploadedPhotoUrl;
  Position? position;

  @override
  void dispose() {
    shipmentInput.dispose();
    note.dispose();
    apiBaseController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    apiBaseController.text = widget.session.effectiveApiBase;
  }

  Future<void> _scanQrCode() async {
    final scanned = await Navigator.push<String>(
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
    final input = rawInput.trim();
    if (input.startsWith('DNT-')) {
      final api = ApiClient(widget.session);
      final payload = await api.trackingByCode(input);
      return payload['id']?.toString() ?? input;
    }
    return input;
  }

  Future<void> _captureLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => message = 'Layanan lokasi tidak aktif.');
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      setState(() => message = 'Izin lokasi ditolak.');
      return;
    }

    final current = await Geolocator.getCurrentPosition();
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

    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 75,
    );
    if (file == null) return;

    try {
      final api = ApiClient(widget.session);
      final url = await api.uploadProof(file);
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

    final shipmentId = await _resolveShipmentId(shipmentInput.text);
    final body = <String, dynamic>{
      'shipmentId': shipmentId,
      'status': status,
      'note': note.text.trim().isEmpty ? null : note.text.trim(),
      'latitude': position?.latitude,
      'longitude': position?.longitude,
      'photoUrl': uploadedPhotoUrl,
    };

    try {
      final api = ApiClient(widget.session);
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
      final prefs = await SharedPreferences.getInstance();
      final existing = prefs.getString(trackingQueueKey);
      final queue = existing == null
          ? <dynamic>[]
          : (jsonDecode(existing) as List<dynamic>);
      queue.add(body);
      await prefs.setString(trackingQueueKey, jsonEncode(queue));
      setState(() => message = 'Offline: tracking masuk queue lokal.');
    }
  }

  Future<void> _syncTrackingQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(trackingQueueKey);
    if (existing == null) {
      setState(() => message = 'Queue tracking kosong.');
      return;
    }

    final queue =
        (jsonDecode(existing) as List<dynamic>)
            .map((dynamic item) => Map<String, dynamic>.from(item as Map))
            .toList();
    final remain = <Map<String, dynamic>>[];
    final api = ApiClient(widget.session);

    for (final item in queue) {
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
  Widget build(BuildContext context) => ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        const Text(
          'Operasional Admin',
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
        const SizedBox(height: 16),
        // Admin-only: API base editor
        if (widget.session.isAuthenticated && widget.session.role == 'ADMIN') ...<Widget>[
          const Divider(),
          const SizedBox(height: 8),
          const Text('Admin Settings', style: TextStyle(fontWeight: FontWeight.bold)),
          TextField(
            controller: apiBaseController,
            decoration: const InputDecoration(
              labelText: 'API Base URL',
              hintText: 'http://10.0.2.2:4000/api',
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () async {
              await widget.session.saveApiBase(apiBaseController.text.trim());
              setState(() => message = 'API Base disimpan. Aktif: ${widget.session.effectiveApiBase}');
            },
            child: const Text('Simpan API Base'),
          ),
          const SizedBox(height: 8),
          Text('Aktif: ${widget.session.effectiveApiBase}'),
        ],
      ],
    );
}
