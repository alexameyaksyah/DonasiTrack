class LoggingUtils {
  static const String _prefix = '[DonasiTrack]';

  static void info(String message, {String? tag}) {
    final logMessage = '[$_prefix${tag != null ? ': $tag' : ''}] INFO: $message';
    print(logMessage);
  }

  static void debug(String message, {String? tag}) {
    final logMessage = '[$_prefix${tag != null ? ': $tag' : ''}] DEBUG: $message';
    print(logMessage);
  }

  static void warning(String message, {String? tag}) {
    final logMessage = '[$_prefix${tag != null ? ': $tag' : ''}] WARNING: $message';
    print(logMessage);
  }

  static void error(String message, {String? tag, Exception? exception}) {
    final logMessage =
        '[$_prefix${tag != null ? ': $tag' : ''}] ERROR: $message${exception != null ? '\n$exception' : ''}';
    print(logMessage);
  }
}
