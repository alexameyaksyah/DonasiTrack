import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import 'session.dart';

class ApiClient {
  ApiClient(this.session)
    : dio = Dio(
        BaseOptions(
          baseUrl: session.effectiveApiBase,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 20),
        ),
      );

  final AppSession session;
  final Dio dio;

  Map<String, String> get authHeader => {
    if (session.token.isNotEmpty) 'Authorization': 'Bearer ${session.token}',
  };

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final Response<dynamic> response = await dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final Response<dynamic> response = await dio.post(
      '/auth/register',
      data: {'name': name, 'email': email, 'password': password},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<Map<String, dynamic>>> campaigns() async {
    final Response<dynamic> response = await dio.get('/campaigns');
    return (response.data as List<dynamic>)
        .map((dynamic item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  Future<void> donate(Map<String, dynamic> body) async {
    await dio.post(
      '/donations',
      data: body,
      options: Options(headers: authHeader),
    );
  }

  Future<Map<String, dynamic>> trackingByCode(String code) async {
    final Response<dynamic> response = await dio.get('/tracking/$code');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> updateShipmentStatus({
    required String shipmentId,
    required String status,
    String? note,
    double? latitude,
    double? longitude,
    String? photoUrl,
  }) async {
    await dio.patch(
      '/logistics/$shipmentId/status',
      data: {
        'status': status,
        'note': note,
        'latitude': latitude,
        'longitude': longitude,
        'photoUrl': photoUrl,
      },
      options: Options(headers: authHeader),
    );
  }

  Future<String> uploadProof(XFile file) async {
    final MultipartFile multipart = kIsWeb
        ? MultipartFile.fromBytes(await file.readAsBytes(), filename: file.name)
        : await MultipartFile.fromFile(file.path, filename: file.name);

    final FormData formData = FormData.fromMap({'file': multipart});
    final Response<dynamic> response = await dio.post(
      '/uploads/proof',
      data: formData,
      options: Options(headers: authHeader, contentType: 'multipart/form-data'),
    );

    final Map<String, dynamic> map = Map<String, dynamic>.from(
      response.data as Map,
    );
    return map['url'] as String;
  }
}
