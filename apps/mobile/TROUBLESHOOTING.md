# Troubleshooting Guide

## Common Issues & Solutions

### 1. Build Errors

**Error: "Android SDK not found"**
- Solution: Install Android SDK via Android Studio atau set ANDROID_SDK_ROOT

**Error: "CocoaPods could not find compatible versions"**
- Solution: Run `flutter clean` then `flutter pub get` dan `cd ios && pod update`

### 2. Runtime Errors

**Error: "Null check operator used on null value"**
- Cause: Trying to access null value tanpa null check
- Solution: Add null checks atau gunakan null coalescing operator (??)

**Error: "MissingPluginException"**
- Cause: Native plugin tidak ter-build
- Solution: Run `flutter clean` dan `flutter pub get` again

### 3. API Connection Issues

**Error: "Failed to connect to API"**
- Check: API URL di constants
- Check: Internet connection
- Check: API server status
- Solution: Add timeout handling dan retry logic

**Error: "Unauthorized (401)"**
- Cause: Invalid atau expired token
- Solution: Refresh token atau re-login

### 4. UI Issues

**Error: "RenderFlex overflowed"**
- Cause: Widget exceeds available space
- Solution: Wrap dengan SingleChildScrollView atau reduce widget size

**Error: "setState called after dispose"**
- Cause: Trying to update disposed widget
- Solution: Check if mounted sebelum setState

### 5. Performance Issues

**App is slow or freezes**
- Check: Heavy computations di main thread
- Solution: Use isolates untuk heavy operations
- Use: ListView.builder untuk large lists

**Memory leak**
- Check: Proper disposal of resources (StreamSubscription, AnimationController)
- Solution: Override dispose() dan call super.dispose()

## Debug Tips

### Enable Debug Logging
```dart
import 'utils/logging_utils.dart';

LoggingUtils.debug('Debug message', tag: 'MyScreen');
LoggingUtils.error('Error occurred', exception: e);
```

### Use Flutter DevTools
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

### Hot Reload vs Hot Restart
- **Hot Reload**: Instant code changes
- **Hot Restart**: Rebuild entire app

### Debugging Network Calls
- Use Charles Proxy atau Fiddler
- Log API requests/responses
- Check network tab di DevTools

## Performance Profiling

```bash
# Profile app
flutter run --profile

# Generate performance report
flutter test --profile
```

## Getting Help

1. Check Flutter documentation
2. Search GitHub Issues
3. Ask on Stack Overflow
4. Create GitHub Issue dengan details
5. Contact maintainers
