import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> {
  bool captured = false;

  @override
  Widget build(BuildContext context) => Scaffold(
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
