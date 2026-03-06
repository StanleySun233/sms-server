const authErrorMap: Record<string, string> = {
  'Invalid username or password': '用户名或密码错误',
  'Username already exists': '用户名已被注册',
  'Email already exists': '邮箱已被注册',
  'Current password is incorrect': '当前密码错误',
  'User not found': '用户不存在',
};

export function getAuthErrorMessage(backendMessage: string): string {
  return authErrorMap[backendMessage] || backendMessage;
}
