import 'package:flutter/material.dart';

import 'session.dart';
import 'auth/auth_page.dart';
import 'pages/donor_page.dart';
import 'pages/admin_operational_page.dart';
import 'pages/tracking_page.dart';

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
            title: const Text('Donasi Track Flutter'),
            actions: <Widget>[
              if (widget.session.isAuthenticated) ...<Widget>[
                IconButton(
                  onPressed: widget.session.logout,
                  icon: const Icon(Icons.logout),
                  tooltip: 'Logout',
                ),
              ] else ...<Widget>[
                IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => AuthStandalonePage(session: widget.session),
                      ),
                    );
                  },
                  icon: const Icon(Icons.login),
                  tooltip: 'Login',
                ),
              ],
            ],
          ),
          body: pages[index],
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
