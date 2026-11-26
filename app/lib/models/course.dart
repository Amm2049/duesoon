/// One row of `GET /courses` (SPEC §4.2).
class Course {
  final int id;
  final String code;
  final String name;

  const Course({required this.id, required this.code, required this.name});

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as int,
      code: json['code'] as String,
      name: json['name'] as String,
    );
  }
}
