enum DonationStatus {
  pending,
  completed,
  failed,
  cancelled,
}

enum CampaignStatus {
  active,
  completed,
  cancelled,
  draft,
}

enum UserRole {
  donor,
  organization,
  admin,
}

enum TransactionType {
  donation,
  refund,
  reversal,
}

extension DonationStatusExtension on DonationStatus {
  String get displayName {
    switch (this) {
      case DonationStatus.pending:
        return 'Pending';
      case DonationStatus.completed:
        return 'Completed';
      case DonationStatus.failed:
        return 'Failed';
      case DonationStatus.cancelled:
        return 'Cancelled';
    }
  }
}

extension CampaignStatusExtension on CampaignStatus {
  String get displayName {
    switch (this) {
      case CampaignStatus.active:
        return 'Active';
      case CampaignStatus.completed:
        return 'Completed';
      case CampaignStatus.cancelled:
        return 'Cancelled';
      case CampaignStatus.draft:
        return 'Draft';
    }
  }
}
