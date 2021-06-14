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
  User,
  registerProduct,
  listProductByUser,
  listProducts,
  loadData,
  saveData,
  findProduct,
  findUserById,
  createOrder,
  paidOrder,
} from './db';

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
app.use(express.json());
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});
app.use((req, res, next) => {
  if (
    [
      '/login',
      '/register',
      '/list_products',
      '/buy_products',
      '/webhook',
    ].includes(req.originalUrl)
  ) {
    // アクセストークン不要
    next();
  } else {
    try {
      const aceessToken = req.header('Authorization') || '';
      const user = accessToken2User(aceessToken);
      req.authUser = user;
      next();
    } catch (e) {
      res.status(403).json({
        error: e.message,
      });
    }
  }
});

app.post('/login', (req, res) => {
  const data = req.body;
  const user = login(data.loginId, data.password);
  res.json({
    accessToken: issueAccessToken(user).accessToken,
  });
});

app.post('/register', (req, res) => {
  const data = req.body;
  const user = register(data.loginId, data.password);
  res.json({
    success: true,
  });
});

app.post('/user', async (req, res) => {
  const account = findAccount(req.authUser);
  res.json({
    user: req.authUser, // TODO 不要な情報は省く
    account,
  });
});

app.post('/connect_stripe', async (req, res) => {
  // すでにAccountがあれば、↓はやらない
  let account = findAccount(req.authUser);
  if (!account) {
    // Accountのデータを作る（ドラフト状態）
    const res = await stripe.accounts.create({
      type: 'express',
    });
    account = connectAccount(req.authUser, res.id);
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
  const account = findAccount(req.authUser);

  if (!account) {
    throw new Error('account not found');
  }

  const r = await stripe.accounts.retrieve(account.stripeAccountId);

  if (r.charges_enabled && r.details_submitted) {
    removeDraft(account);
  }
  res.json({
    success: true,
  });
});

app.post('/register_product', (req, res) => {
  const data = req.body;
  registerProduct(req.authUser, data.name, parseInt(data.amount, 10), data.url);
  res.json({
    success: true,
  });
});

app.post('/list_products_by_user', (req, res) => {
  res.json({
    products: listProductByUser(req.authUser),
  });
});

app.post('/list_products', (req, res) => {
  res.json({
    products: listProducts(req.body.query),
  });
});

app.post('/buy_products', async (req, res) => {
  // { "product_id": 999 }
  const product = findProduct(req.body.product_id);
  const user = findUserById(product.userId);
  const account = findAccount(user);
  if (!account) {
    // mypage側(/register_product)で防ぐべき。
    throw new Error('invalid status');
  }

  const amount = product.amount;
  const fee = amount * 0.1;
  const intent = await stripe.paymentIntents.create(
    {
      payment_method_types: ['card'],
      amount,
      currency: 'jpy',
      application_fee_amount: fee,
    },
    {
      stripeAccount: account.stripeAccountId,
    }
  );

  if (!intent.client_secret) {
    throw new Error('stripe error');
  }

  createOrder(product, intent.client_secret);

  res.json({
    stripe_account: account.stripeAccountId,
    client_secret: intent.client_secret,
    api_key: process.env['API_KEY'],
  });
});

const endpointSecret = 'whsec_...';
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  (request, response) => {
    const sig = request.headers['stripe-signature'] || '';

    let event;

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures for more information.
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const connectedAccountId = event.account;
      // TODO 要確認
      // @ts-ignore
      paidOrder(paymentIntent.client_secret);
    }

    response.json({ received: true });
  }
);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  return res.status(400).json({
    error: err.message,
  });
});

app.listen(port, () => {
  loadData();
  console.log(`Example app listening at http://localhost:${port}`);
});

process.on('exit', () => {
  saveData();
});

process.on('SIGINT', () => {
  process.exit();
});
