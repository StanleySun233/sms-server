const backendToErrorKey: Record<string, string> = {
  'Invalid username or password': 'invalidCredentials',
  'Username already exists': 'usernameExists',
  'Email already exists': 'emailExists',
  'Current password is incorrect': 'currentPasswordIncorrect',
  'User not found': 'userNotFound',
};

export function getAuthErrorKey(backendMessage: string): string | null {
  return backendToErrorKey[backendMessage] ?? null;
}
