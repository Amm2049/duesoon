/// The logged-in user. `/login` and `/register` include the email; `/me` does not.
class User {
  final int id;
  final String name;
  final String? email;

  const User({required this.id, required this.name, this.email});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String?,
    );
  }
}
