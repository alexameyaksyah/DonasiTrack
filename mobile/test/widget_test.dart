import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App bootstraps', (WidgetTester tester) async {
    await tester.pumpWidget(const DonasiTrackMobileApp());
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
