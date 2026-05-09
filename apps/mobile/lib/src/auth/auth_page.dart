import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../session.dart';
import '../api_client.dart';

class AuthStandalonePage extends StatelessWidget {
  const AuthStandalonePage({super.key, required this.session});

  final AppSession session;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login / Daftar')),
      body: AuthPage(session: session),
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
  bool loading = false;
  String message = '';


  @override
  void dispose() {
    loginEmail.dispose();
    loginPassword.dispose();
    registerName.dispose();
    registerEmail.dispose();
    registerPassword.dispose();
    super.dispose();
  }

  Future<void> _doLogin() async {
    setState(() {
      loading = true;
      message = '';
    });

    try {
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
      final ApiClient api = ApiClient(widget.session);
      await api.register(
        name: registerName.text.trim(),
        email: registerEmail.text.trim(),
        password: registerPassword.text.trim(),
      );

      // Do not auto-login after register. Prompt user to login.
      if (!mounted) return;
      if (!mounted) return;
      // show snackbar confirmation and switch to Login tab
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registrasi berhasil. Silakan login.')),
      );
      setState(() {
        message = 'Registrasi berhasil. Silakan login.';
        registerName.clear();
        registerEmail.clear();
        registerPassword.clear();
      });
      // switch to Login tab
      final TabController tab = DefaultTabController.of(context);
      tab.animateTo(0);
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
    return DefaultTabController(
      length: 2,
      child: Column(
        children: <Widget>[
          Material(
            color: Colors.transparent,
            child: TabBar(
              labelColor: Theme.of(context).colorScheme.primary,
              unselectedLabelColor: Colors.grey[600],
              tabs: const <Tab>[Tab(text: 'Login'), Tab(text: 'Registrasi')],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: <Widget>[
                // Login tab
                SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
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
                      if (message.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 10),
                        Text(message),
                      ],
                    ],
                  ),
                ),

                // Register tab
                SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Text('Registrasi', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
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
                      const SizedBox(height: 8),
                      const Text('Role: DONOR', style: TextStyle(fontWeight: FontWeight.bold)),
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
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
