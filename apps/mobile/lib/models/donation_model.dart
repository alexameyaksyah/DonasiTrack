class Donation {
  final String id;
  final String userId;
  final double amount;
  final String currency;
  final String category;
  final String? description;
  final DateTime donationDate;
  final String status;

  Donation({
    required this.id,
    required this.userId,
    required this.amount,
    required this.currency,
    required this.category,
    this.description,
    required this.donationDate,
    required this.status,
  });

  factory Donation.fromJson(Map<String, dynamic> json) {
    return Donation(
      id: json['id'] as String,
      userId: json['userId'] as String,
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String,
      category: json['category'] as String,
      description: json['description'] as String?,
      donationDate: DateTime.parse(json['donationDate'] as String),
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'amount': amount,
      'currency': currency,
      'category': category,
      'description': description,
      'donationDate': donationDate.toIso8601String(),
      'status': status,
    };
  }
}
