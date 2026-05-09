import 'package:flutter/material.dart';

import 'src/session.dart';
import 'src/home_shell.dart';
import 'src/auth/auth_page.dart';

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
  Widget build(BuildContext context) => MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Donasi Track Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0E6B63),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF7FAF9),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0E6B63),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
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
