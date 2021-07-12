import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

import {
  AccessToken,
  Account,
  OrderItem,
  OrderParent,
  PrismaClient,
  Product,
  User,
} from '@prisma/client';
const prisma = new PrismaClient();

// util
const md5str = (str: string): string => {
  return crypto.createHash('md5').update(str, 'binary').digest('hex');
};

// User
const findUserByLoginId = async (loginId: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: {
      loginId,
    },
  });
  return user;
};
// 会員登録
export const register = async (
  loginId: string,
  password: string
): Promise<User> => {
  if (await findUserByLoginId(loginId)) {
    throw new Error('duplicated loginId');
  }

  const user = await prisma.user.create({
    data: {
      loginId,
      password: md5str(password),
    },
  });

  return user;
};
// ログイン
export const login = async (
  loginId: string,
  password: string
): Promise<User> => {
  const user = await findUserByLoginId(loginId);
  if (!user) {
    throw new Error('user not found.');
  }
  if (user.password != md5str(password)) {
    throw new Error('user not found.');
  }
  return user;
};

export const findUserById = async (id: number): Promise<User> => {
  const u = await prisma.user.findFirst({
    where: {
      id,
    },
  });
  if (!u) {
    throw new Error('user not found');
  }
  return u;
};

// AccessToken
export const issueAccessToken = async (user: User): Promise<AccessToken> => {
  await prisma.accessToken.deleteMany({
    where: {
      user,
    },
  });

  const at = await prisma.accessToken.create({
    data: {
      userId: user.id,
      accessToken: uuidv4(),
    },
  });
  return at;
};

export const accessToken2User = async (accessToken: string): Promise<User> => {
  const at = await prisma.accessToken.findFirst({
    where: { accessToken },
  });
  if (!at) {
    throw new Error('not logged in');
  }
  const user = await findUserById(at.userId);
  if (!user) {
    throw new Error('not logged in');
  }
  return user;
};

// Account
export const findAccount = async (user: User): Promise<Account | null> => {
  return await prisma.account.findFirst({
    where: { user },
  });
};

export const connectAccount = async (
  user: User,
  stripeAccountId: string
): Promise<Account> => {
  const a = await prisma.account.create({
    data: {
      userId: user.id,
      stripeAccountId,
      draft: true,
    },
  });
  return a;
};

export const removeDraft = async (account: Account): Promise<Account> => {
  const a = await prisma.account.update({
    where: {
      stripeAccountId: account.stripeAccountId,
    },
    data: {
      draft: true,
    },
  });
  return a;
};

// Product
// 商品登録
export const registerProduct = async (
  user: User,
  name: string,
  amount: number,
  url: string
): Promise<Product> => {
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

  const p = await prisma.product.create({
    data: {
      userId: user.id,
      name,
      amount,
      url,
    },
  });
  return p;
};

// 商品一覧（ユーザ毎）
export const listProductByUser = async (user: User): Promise<Product[]> => {
  return await prisma.product.findMany({
    where: {
      user,
    },
  });
};

// 商品検索（全部)
export const listProducts = async (query: string): Promise<Product[]> => {
  if (!query) {
    return await prisma.product.findMany();
  }
  return await prisma.product.findMany({
    where: {
      name: {
        contains: query,
      },
    },
  });
};

export const findProduct = async (id: number): Promise<Product> => {
  const p = await prisma.product.findFirst({
    where: { id },
  });
  if (!p) {
    throw new Error('product not found');
  }
  return p;
};

// Order
export const createOrder = async (
  amount: number,
  transferGroupId: string
): Promise<OrderParent> => {
  const o = await prisma.orderParent.create({
    data: {
      amount,
      transferGroupId,
      // userId: number;
      createdAt: new Date(),
      status: 'ORDER',
      paidAt: null,
      chargeId: null,
    },
  });
  return o;
};

export const refundOrder = async (order: OrderParent): Promise<void> => {
  await prisma.orderParent.update({
    where: { id: order.id },
    data: {
      status: 'REFUND',
    },
  });
};

export const paidOrder = async (
  transferGroupId: string,
  chargeId: string
): Promise<void> => {
  const o = await prisma.orderParent.update({
    where: {
      transferGroupId,
    },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      chargeId,
    },
  });
  // TODO 要チェック
  if (!o) {
    throw new Error('order not found.');
  }
};

export const findOrderByTransferGroup = async (
  transferGroupId: string
): Promise<
  OrderParent & {
    orderItems: OrderItem[];
  }
> => {
  const parent = await prisma.orderParent.findFirst({
    where: { transferGroupId },
    include: {
      orderItems: true,
    },
  });
  if (!parent) {
    throw new Error('order not found.');
  }
  return parent;
};

export const listOrderParent = async (): Promise<OrderParent[]> => {
  return await prisma.orderParent.findMany({
    where: { status: 'PAID' },
  });
};

export const findOrder = async (
  id: number
): Promise<
  OrderParent & {
    orderItems: OrderItem[];
  }
> => {
  const parent = await prisma.orderParent.findFirst({
    where: {
      id,
    },
    include: {
      orderItems: true,
    },
  });
  if (!parent) {
    throw new Error('order not found.');
  }

  return parent;
};

export const addOrderItem = async (
  parent: OrderParent,
  product: Product,
  transferRatio: number = 0.9
): Promise<OrderItem> => {
  const transfer = Math.ceil(product.amount * transferRatio);
  const fee = product.amount - transfer;

  const item = await prisma.orderItem.create({
    data: {
      parentId: parent.id,
      productId: product.id,
      transfer,
      fee,
      transferId: null,
    },
  });
  return item;
};

export const saveTransfer = async (
  item: OrderItem,
  transferId: string
): Promise<void> => {
  await prisma.orderItem.update({
    where: { id: item.id },
    data: { transferId },
  });
};

export const listOrder = async (user: User): Promise<OrderItem[]> => {
  const items = await prisma.orderItem.findMany({
    where: {
      product: {
        user,
      },
    },
  });
  return items;
};
