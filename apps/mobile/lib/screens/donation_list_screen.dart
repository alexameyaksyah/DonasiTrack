import 'package:flutter/material.dart';

class DonationListScreen extends StatefulWidget {
  const DonationListScreen({super.key});

  @override
  State<DonationListScreen> createState() => _DonationListScreenState();
}

class _DonationListScreenState extends State<DonationListScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> donations = [];

  @override
  void initState() {
    super.initState();
    _loadDonations();
  }

  Future<void> _loadDonations() async {
    try {
      // Load donations from API
      setState(() => _isLoading = true);
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
      appBar: AppBar(title: const Text('My Donations')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : donations.isEmpty
              ? const Center(child: Text('No donations yet'))
              : RefreshIndicator(
                  onRefresh: _loadDonations,
                  child: ListView.builder(
                    itemCount: donations.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(donations[index]['category'] ?? 'Donation'),
                        subtitle: Text('Rp ${donations[index]['amount'] ?? 0}'),
                        trailing: const Icon(Icons.arrow_forward),
                        onTap: () {
                          // Navigate to donation detail
                        },
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to create donation
        },
        child: const Icon(Icons.add),
      ),
    );
}
