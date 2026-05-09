class ApiEndpoints {
  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';

  // User endpoints
  static const String users = '/users';
  static const String userProfile = '/users/profile';
  static const String updateProfile = '/users/profile/update';

  // Donation endpoints
  static const String donations = '/donations';
  static const String createDonation = '/donations/create';
  static const String getDonation = '/donations/{id}';
  static const String userDonations = '/donations/user/{userId}';
  static const String donationStats = '/donations/stats';

  // Campaign endpoints
  static const String campaigns = '/campaigns';
  static const String activeCampaigns = '/campaigns/active';
  static const String getCampaign = '/campaigns/{id}';
  static const String campaignDonations = '/campaigns/{id}/donations';

  // Category endpoints
  static const String categories = '/categories';
  static const String donationCategories = '/categories/donations';

  // Organization endpoints
  static const String organizations = '/organizations';
  static const String getOrganization = '/organizations/{id}';
  static const String organizationCampaigns = '/organizations/{id}/campaigns';
}
