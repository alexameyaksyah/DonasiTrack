# Testing Guide

## Unit Testing

Untuk menguji services dan utils:

```dart
import 'package:test/test.dart';

void main() {
  group('FormatUtils', () {
    test('formatCurrency should format double to currency string', () {
      expect(FormatUtils.formatCurrency(1000), 'Rp 1.000');
      expect(FormatUtils.formatCurrency(1000000), 'Rp 1.000.000');
    });

    test('formatDate should format DateTime to string', () {
      final date = DateTime(2024, 5, 9);
      expect(FormatUtils.formatDate(date), '9/5/2024');
    });
  });

  group('ValidationUtils', () {
    test('validateEmail should validate email format', () {
      expect(ValidationUtils.validateEmail('invalid'), 'Please enter a valid email');
      expect(ValidationUtils.validateEmail('user@example.com'), null);
    });

    test('validatePassword should validate password strength', () {
      expect(ValidationUtils.validatePassword('123'), 'Password must be at least 6 characters');
      expect(ValidationUtils.validatePassword('password123'), null);
    });
  });
}
```

## Widget Testing

Untuk menguji UI components:

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Login screen should display', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    
    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.byType(TextFormField), findsWidgets);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
```

## Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/utils/format_utils_test.dart

# Run tests with coverage
flutter test --coverage
```

## Mocking External Dependencies

```dart
import 'package:mockito/mockito.dart';

class MockApiService extends Mock implements ApiService {}

void main() {
  late MockApiService mockApiService;

  setUp(() {
    mockApiService = MockApiService();
  });

  test('should fetch donations from API', () async {
    when(mockApiService.get('/donations'))
        .thenAnswer((_) async => [{'id': '1', 'amount': 50000}]);

    final donations = await mockApiService.get('/donations');
    expect(donations.length, 1);
    verify(mockApiService.get('/donations')).called(1);
  });
}
```

## Test Coverage

Target: **80%+ code coverage**

Cek coverage dengan:

```bash
flutter test --coverage
lcov --list coverage/lcov.info
```
