import crypto from 'crypto';

interface User {
  id: number;
  loginId: string;
  password: string;
}

interface Account {
  userId: number;
  stripeAccountId: string;
}

interface Product {
  id: number;
  userId: number;
  name: string;
  amount: number;
  url: string;
}

interface Settlement {
  id: number;
  productId: number;
  userId: number;
  createdAt: Date;
}

// util
const md5str = (str: string): string => {
  return crypto.createHash('md5').update(str, 'binary').digest('hex');
};

// User
const users: User[] = [];
const findUserByLoginId = (loginId: string): User | undefined => {
  return users.find((u) => u.loginId == loginId);
};
// 会員登録
export const register = (loginId: string, password: string): User => {
  if (findUserByLoginId(loginId)) {
    throw new Error('duplicated loginId');
  }

  const user: User = {
    id: users.length + 1,
    loginId,
    password: md5str(password),
  };
  users.push(user);
  return user;
};
// ログイン
export const login = (loginId: string, password: string): User => {
  const user = findUserByLoginId(loginId);
  if (!user) {
    throw new Error('user not found.');
  }
  if (user.password != md5str(password)) {
    throw new Error('user not found.');
  }
  return user;
};

// Account
// Product
// Settlement
