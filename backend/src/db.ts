import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: number;
  loginId: string;
  password: string;
}

interface AccessToken {
  userId: number;
  accessToken: string;
}

interface Account {
  userId: number;
  stripeAccountId: string;
  draft: boolean;
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

// AccessToken
let accessTokens: AccessToken[] = [];
export const issueAccessToken = (user: User): AccessToken => {
  accessTokens = accessTokens.filter((a) => a.userId != user.id);
  const at: AccessToken = {
    userId: user.id,
    accessToken: uuidv4(),
  };
  accessTokens.push(at);
  return at;
};

export const accessToken2User = (accessToken: string): User => {
  const at = accessTokens.find((a) => a.accessToken == accessToken);
  if (!at) {
    throw new Error('not logged in');
  }
  const user = users.find((u) => u.id == at.userId);
  if (!user) {
    throw new Error('not logged in');
  }
  return user;
};

// Account
const accounts: Account[] = [];
export const findAccount = (user: User): Account | undefined => {
  return accounts.find((a) => a.userId == user.id);
};

export const connectAccount = (
  user: User,
  stripeAccountId: string
): Account => {
  const a: Account = {
    userId: user.id,
    stripeAccountId,
    draft: true,
  };
  accounts.push(a);
  return a;
};

export const removeDraft = (account: Account): Account => {
  account.draft = false;
  return account;
};

// Product
// Settlement
