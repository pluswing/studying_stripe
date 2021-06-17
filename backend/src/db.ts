import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

export interface User {
  id: number;
  loginId: string;
  password: string;
}

interface AccessToken {
  userId: number;
  accessToken: string;
}

export interface Account {
  userId: number;
  stripeAccountId: string;
  draft: boolean;
}

export interface Product {
  id: number;
  userId: number;
  name: string;
  amount: number;
  url: string;
}

interface Order {
  id: number;
  transferGroupId: string; // unique
  amount: number;
  status: 'order' | 'paid';
  createdAt: Date;
  paidAt: Date | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  productId: number;
  // userId: number;
  transfer: number;
  fee: number; // transfer + fee = product.amount
}

// util
const md5str = (str: string): string => {
  return crypto.createHash('md5').update(str, 'binary').digest('hex');
};

// User
let users: User[] = [];
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

export const findUserById = (id: number): User => {
  const u = users.find((u) => u.id == id);
  if (!u) {
    throw new Error('user not found');
  }
  return u;
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
let accounts: Account[] = [];
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
let products: Product[] = [];
// 商品登録
export const registerProduct = (
  user: User,
  name: string,
  amount: number,
  url: string
): Product => {
  // MEMO validation

  if (!name) {
    throw new Error('required name');
  }
  if (!amount) {
    throw new Error('required amount');
  }
  if (amount < 0) {
    throw new Error('invalid amount');
  }
  if (!url) {
    throw new Error('required url');
  }

  const p: Product = {
    id: products.length + 1,
    userId: user.id,
    name,
    amount,
    url,
  };
  products.push(p);
  return p;
};

// 商品一覧（ユーザ毎）
export const listProductByUser = (user: User): Product[] => {
  return products.filter((p) => p.userId == user.id);
};

// 商品検索（全部)
export const listProducts = (query: string): Product[] => {
  if (!query) {
    return products;
  }
  return products.filter((p) => p.name.indexOf(query) != -1);
};

export const findProduct = (id: number): Product => {
  const p = products.find((p) => p.id == id);
  if (!p) {
    throw new Error('product not found');
  }
  return p;
};

// Order
let orders: Order[] = [];
export const createOrder = (product: Product, clientSecret: string): Order => {
  const o: Order = {
    id: orders.length + 1,
    productId: product.id,
    // userId: number;
    createdAt: new Date(),
    status: 'order',
    clientSecret,
  };
  orders.push(o);
  return o;
};

export const paidOrder = (clientSecret: string): void => {
  const o = orders.find((o) => o.clientSecret == clientSecret);
  if (!o) {
    throw new Error('order not found.');
  }
  o.status = 'paid';
};

export const listOrder = (user: User): Order[] => {
  const productIds = listProductByUser(user).map((p) => p.id);
  return orders.filter((o) => productIds.includes(o.productId));
};

// general
export const saveData = () => {
  fs.writeFileSync(
    'data.json',
    JSON.stringify({
      users,
      accessTokens,
      accounts,
      products,
      orders,
    })
  );
  console.log('*** DONE SAVE ***');
};

export const loadData = () => {
  if (!fs.existsSync('data.json')) {
    return;
  }
  const data = JSON.parse(fs.readFileSync('data.json').toString());
  users = data.users || [];
  accessTokens = data.accessTokens || [];
  accounts = data.accounts || [];
  products = data.products || [];
  orders = data.orders || [];
  console.log('*** DONE LOAD ***');
};
