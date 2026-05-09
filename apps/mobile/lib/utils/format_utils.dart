class FormatUtils {
  static String formatCurrency(double amount, {String symbol = 'Rp'}) {
    return '$symbol ${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
  }

  static String formatNumber(double number) {
    return number.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',');
  }

  static String formatPercentage(double value) {
    return '${value.toStringAsFixed(1)}%';
  }

  static String formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  static String formatTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  static String formatDateTime(DateTime dateTime) {
    return '${formatDate(dateTime)} ${formatTime(dateTime)}';
  }

  static String truncateText(String text, int length) {
    return text.length > length ? '${text.substring(0, length)}...' : text;
  }
}
