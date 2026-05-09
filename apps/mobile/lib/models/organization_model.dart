class Organization {
  final String id;
  final String name;
  final String description;
  final String? logoUrl;
  final String? website;
  final String? email;
  final String? phone;
  final String? address;
  final String status;
  final DateTime createdAt;

  Organization({
    required this.id,
    required this.name,
    required this.description,
    this.logoUrl,
    this.website,
    this.email,
    this.phone,
    this.address,
    required this.status,
    required this.createdAt,
  });

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      logoUrl: json['logoUrl'] as String?,
      website: json['website'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'logoUrl': logoUrl,
      'website': website,
      'email': email,
      'phone': phone,
      'address': address,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
