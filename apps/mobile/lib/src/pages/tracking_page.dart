import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../session.dart';
import '../api_client.dart';

class TrackingPage extends StatefulWidget {
  const TrackingPage({required this.session, super.key});

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
      final api = ApiClient(widget.session);
      final data = await api.trackingByCode(
        code.text.trim(),
      );
      setState(() {
        payload = data;
        message = '';
      });
    } on DioException catch (error) {
      final serverMessage = error.response?.data is Map
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
    final events = payload == null
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
            final event = Map<String, dynamic>.from(
              item as Map,
            );
            final createdBy = Map<String, dynamic>.from(
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
