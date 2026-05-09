class DonationCategory {

  DonationCategory({
    required this.id,
    required this.name,
    this.description,
    this.icon,
    required this.color,
  });

  factory DonationCategory.fromJson(Map<String, dynamic> json) {
    return DonationCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String,
    );
  }
  final String id;
  final String name;
  final String? description;
  final String? icon;
  final String color;

  Map<String, dynamic> toJson() => {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'color': color,
    };
}
