import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'express-async-errors';
import Stripe from 'stripe';
import {
  register,
  login,
  issueAccessToken,
  accessToken2User,
  findAccount,
  connectAccount,
  removeDraft,
  registerProduct,
  listProductByUser,
  listProducts,
  findProduct,
  findUserById,
  createOrder,
  paidOrder,
  addOrderItem,
  findOrderByTransferGroup,
  saveTransfer,
  listOrderParent,
  refundOrder,
  findOrder,
} from './db';
import { v4 as uuidv4 } from 'uuid';
import { Account, Product, User } from '@prisma/client';

const stripe = new Stripe(process.env['SECRET_KEY'] || '', {
  apiVersion: '2020-08-27',
});

const app = express();
const port = 8000;

declare module 'express-session' {
  interface SessionData {
    accountID: string;
  }
}
declare global {
  namespace Express {
    interface Request {
      authUser: User;
    }
  }
}

app.use(cors());
app.use(
  session({
    secret: 'Set this to a random string that is kept secure',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static('public'));
// app.use(express.json());
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json({ limit: '50mb' })(req, res, next);
  }
});
app.use(async (req, res, next) => {
  if (
    [
      '/login',
      '/register',
      '/list_products',
      '/buy_products',
      '/webhook',
      // FIXME
      '/platform/orders',
      '/platform/order_detail',
      '/platform/refund_order',
    ].includes(req.originalUrl)
  ) {
    // アクセストークン不要
    next();
  } else {
    try {
      const aceessToken = req.header('Authorization') || '';
      const user = await accessToken2User(aceessToken);
      req.authUser = user;
      next();
    } catch (e) {
      res.status(403).json({
        error: e.message,
      });
    }
  }
});

app.post('/login', async (req, res) => {
  const data = req.body;
  const user = await login(data.loginId, data.password);
  res.json({
    accessToken: (await issueAccessToken(user)).accessToken,
  });
});

app.post('/register', async (req, res) => {
  const data = req.body;
  await register(data.loginId, data.password);
  res.json({
    success: true,
  });
});

app.post('/user', async (req, res) => {
  const account = await findAccount(req.authUser);
  res.json({
    user: req.authUser, // TODO 不要な情報は省く
    account,
  });
});

app.post('/connect_stripe', async (req, res) => {
  // すでにAccountがあれば、↓はやらない
  let account = await findAccount(req.authUser);
  if (!account) {
    // Accountのデータを作る（ドラフト状態）
    const res = await stripe.accounts.create({
      country: 'JP',
      type: 'custom',
      business_type: 'individual',
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });
    account = await connectAccount(req.authUser, res.id);
  }

  const accountLinks = await stripe.accountLinks.create({
    account: account.stripeAccountId,
    refresh_url: `http://localhost:3000/mypage`,
    return_url: `http://localhost:3000/return`,
    type: 'account_onboarding',
  });

  res.json({
    url: accountLinks.url,
  });
});

app.post('/done_connected', async (req, res) => {
  const account = await findAccount(req.authUser);

  if (!account) {
    throw new Error('account not found');
  }

  const r = await stripe.accounts.retrieve(account.stripeAccountId);

  if (r.charges_enabled && r.details_submitted) {
    await removeDraft(account);
  }
  res.json({
    success: true,
  });
});

app.post('/register_product', async (req, res) => {
  const data = req.body;
  await registerProduct(
    req.authUser,
    data.name,
    parseInt(data.amount, 10),
    data.url
  );
  res.json({
    success: true,
  });
});

app.post('/list_products_by_user', async (req, res) => {
  res.json({
    products: await listProductByUser(req.authUser),
  });
});

app.post('/list_products', async (req, res) => {
  res.json({
    products: await listProducts(req.body.query),
  });
});

app.post('/dashboard', async (req, res) => {
  const account = await findAccount(req.authUser);
  if (!account) {
    throw new Error('account not found');
  }
  const link = await stripe.accounts.createLoginLink(account.stripeAccountId);
  res.json({
    url: link.url,
  });
});

app.post('/buy_products', async (req, res) => {
  // req.body.items = { [product_id]: 個数, ... }
  const items: Array<{
    product: Product;
    account: Account;
    count: number;
  }> = [];
  for (const id of Object.keys(req.body.items)) {
    const product = await findProduct(parseInt(id, 10));
    const user = await findUserById(product.userId);
    const account = await findAccount(user);
    if (!account) {
      // mypage側(/register_product)で防ぐべき。
      throw new Error('invalid status');
    }
    items.push({
      product,
      account,
      count: parseInt(req.body.items[id], 10),
    });
  }

  const amount = items.reduce((total, item) => {
    return total + item.product.amount * item.count;
  }, 0);

  const transferGroup = uuidv4();

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'jpy',
    payment_method_types: ['card'],
    transfer_group: transferGroup,
  });

  if (!intent.client_secret) {
    throw new Error('stripe error');
  }

  console.log('INTENT:');
  console.log(intent);

  const order = await createOrder(amount, transferGroup);
  for (const item of items) {
    await addOrderItem(order, item.product, item.count);
  }

  res.json({
    client_secret: intent.client_secret,
    api_key: process.env['API_KEY'],
  });
});

const endpointSecret = 'whsec_L2ODS7oriu7DBcWg3hYNxZ4jFaiPOJbe';
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'] || '';

    let event;

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures for more information.
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const transferGroup = paymentIntent.transfer_group;
      if (!transferGroup) {
        throw new Error('empty transfer_group');
      }
      const chargeId = paymentIntent.charges.data[0].id;
      const order = await findOrderByTransferGroup(transferGroup);

      /*
      for (const item of order.orderItems) {
        const product = await findProduct(item.productId);
        const user = await findUserById(product.userId);
        const account = await findAccount(user);
        if (!account) {
          throw new Error('invalid status');
        }
        const transfer = await stripe.transfers.create({
          amount: item.transfer,
          currency: 'jpy',
          destination: account.stripeAccountId,
          transfer_group: transferGroup,
          source_transaction: chargeId,
        });
        await saveTransfer(item, transfer.id);
      }
      */
      await paidOrder(transferGroup, chargeId);
    }
    response.json({ received: true });
  }
);

app.post('/platform/orders', async (req, res) => {
  res.json({
    orders: await listOrderParent(),
  });
});
app.post('/platform/order_detail', async (req, res) => {
  const id = parseInt(req.body.id, 10);
  res.json({
    order: await findOrder(id),
  });
});
app.post('/platform/refund_order', async (req, res) => {
  const id = parseInt(req.body.id, 10);
  const order = await findOrder(id);
  if (order.status != 'PAID') {
    throw new Error('not paid');
  }
  const refund = await stripe.refunds.create({
    charge: order.chargeId!,
  });
  // FIXME "status": "succeeded",の確認をしたほうが良い
  console.log(refund);
  for (const item of order.orderItems) {
    const reversal = await stripe.transfers.createReversal(item.transferId!, {
      amount: item.transfer,
    });
    console.log(reversal);
  }
  await refundOrder(order);
  res.json({
    ok: true,
  });
});
app.post('/stripe/account/get', async (req, res) => {
  const account = await findAccount(req.authUser);

  if (!account) {
    throw new Error('account not found');
  }
  const sa = await stripe.accounts.retrieve(account.stripeAccountId);
  res.json(sa);
});

app.post('/stripe/account/update', async (req, res) => {
  const account = await findAccount(req.authUser);

  if (!account) {
    throw new Error('account not found');
  }

  const front = req.body.individual.verification.document.front;
  const back = req.body.individual.verification.document.back;
  delete req.body.individual.verification.document.front;
  delete req.body.individual.verification.document.back;

  if (front) {
    const binaryData = Buffer.from(
      front.replace(/^data:.*?;base64,/, ''),
      'base64'
    );
    const file = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data: binaryData,
        name: 'front.jpg',
        type: 'application/octet-stream',
      },
    });
    req.body.individual.verification.document.front = file.id;
  }

  if (back) {
    const binaryData = Buffer.from(
      back.replace(/^data:.*?;base64,/, ''),
      'base64'
    );
    const file = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data: binaryData,
        name: 'back.jpg',
        type: 'application/octet-stream',
      },
    });
    req.body.individual.verification.document.back = file.id;
  }
  await stripe.accounts.update(account.stripeAccountId, req.body);
  res.json({
    ok: true,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  return res.status(400).json({
    error: err.message,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

process.on('exit', () => {
  // 終了時処理
});
process.on('SIGINT', () => {
  process.exit();
});
