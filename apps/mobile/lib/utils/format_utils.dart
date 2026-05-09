class FormatUtils {
  static String formatCurrency(double amount, {String symbol = 'Rp'}) => '$symbol ${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';

  static String formatNumber(double number) => number.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',');

  static String formatPercentage(double value) => '${value.toStringAsFixed(1)}%';

  static String formatDate(DateTime date) => '${date.day}/${date.month}/${date.year}';

  static String formatTime(DateTime dateTime) => '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';

  static String formatDateTime(DateTime dateTime) => '${formatDate(dateTime)} ${formatTime(dateTime)}';

  static String truncateText(String text, int length) => text.length > length ? '${text.substring(0, length)}...' : text;
}
