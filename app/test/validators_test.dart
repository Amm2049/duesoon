import 'package:flutter_test/flutter_test.dart';

import 'package:duesoon/utils/validators.dart';

// Mirrors api/test/validate.test.js boundaries (SPEC §4.4): app and server must agree.
void main() {
  group('name', () {
    test('empty / spaces only → required', () {
      expect(Validators.name(null), 'Name is required');
      expect(Validators.name('   '), 'Name is required');
    });
    test('50 chars ok, 51 too long (after trim)', () {
      expect(Validators.name('  ${'a' * 50}  '), isNull);
      expect(Validators.name('a' * 51), 'Name must be at most 50 characters');
    });
  });

  group('email', () {
    test('valid, with spaces and capitals (server trims + lowercases)', () {
      expect(Validators.email(' Mai@DueSoon.test '), isNull);
    });
    test('missing parts are invalid', () {
      for (final bad in ['mai', 'mai@', 'mai@duesoon', '@duesoon.test', 'm ai@x.co']) {
        expect(Validators.email(bad), 'Email is not valid', reason: bad);
      }
    });
    test('empty → required; over 100 chars → invalid', () {
      expect(Validators.email(''), 'Email is required');
      expect(Validators.email('${'a' * 90}@duesoon.test'), 'Email is not valid'); // 103
    });
  });

  group('new password (register)', () {
    test('5 chars no, 6 chars yes', () {
      expect(Validators.newPassword('12345'), 'Password must be at least 6 characters');
      expect(Validators.newPassword('123456'), isNull);
    });
    test('72 bytes ok, 73 bytes too long', () {
      expect(Validators.newPassword('a' * 72), isNull);
      expect(Validators.newPassword('a' * 73), 'Password is too long');
    });
    test('Thai: 24 chars = 72 bytes ok, 25 chars = 75 bytes too long', () {
      expect(Validators.newPassword('ก' * 24), isNull);
      expect(Validators.newPassword('ก' * 25), 'Password is too long');
    });
    test('spaces count (not trimmed)', () {
      expect(Validators.newPassword('   abc'), isNull);
    });
  });

  test('login password only needs to be non-empty', () {
    expect(Validators.loginPassword(''), 'Password is required');
    expect(Validators.loginPassword('x'), isNull);
  });

  test('confirm password must match', () {
    expect(Validators.confirmPassword('', 'secret1'), 'Please confirm your password');
    expect(Validators.confirmPassword('secret2', 'secret1'), 'Passwords do not match');
    expect(Validators.confirmPassword('secret1', 'secret1'), isNull);
  });
}
