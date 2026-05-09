import 'package:flutter/material.dart';

class CampaignListScreen extends StatefulWidget {
  const CampaignListScreen({super.key});

  @override
  State<CampaignListScreen> createState() => _CampaignListScreenState();
}

class _CampaignListScreenState extends State<CampaignListScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> campaigns = [];

  @override
  void initState() {
    super.initState();
    _loadCampaigns();
  }

  Future<void> _loadCampaigns() async {
    try {
      setState(() => _isLoading = true);
      // Load campaigns from API
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Active Campaigns')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : campaigns.isEmpty
              ? const Center(child: Text('No campaigns available'))
              : RefreshIndicator(
                  onRefresh: _loadCampaigns,
                  child: ListView.builder(
                    itemCount: campaigns.length,
                    itemBuilder: (context, index) {
                      final campaign = campaigns[index];
                      return Card(
                        margin: const EdgeInsets.all(8),
                        child: ListTile(
                          leading: const Icon(Icons.campaign),
                          title: Text(campaign['title'] ?? 'Campaign'),
                          subtitle: LinearProgressIndicator(
                            value: 0.5, // campaign progress
                          ),
                          trailing: const Icon(Icons.arrow_forward),
                          onTap: () {
                            // Navigate to campaign detail
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
}
