import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../session.dart';
import '../api_client.dart';

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
