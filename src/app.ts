import express from 'express';
import session from "express-session"
import bodyParser from "body-parser"
import Stripe from 'stripe';

const stripe = new Stripe(process.env["SECRET_KEY"] || "", {
  apiVersion: "2020-08-27"
})

const app = express()
const port = 8000

declare module 'express-session' {
  interface SessionData {
    accountID: string;
  }
}

app.use(
  session({
    secret: "Set this to a random string that is kept secure",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static('public'));
app.use(express.json());
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

app.get('/', async (req, res) => {
  const account = await stripe.accounts.create({
    type: 'standard',
  })

  const accountId = account.id
  req.session.accountID = accountId;

  const accountLinks = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `http://localhost:${port}/reauth`,
    return_url: `http://localhost:${port}/return`,
    type: 'account_onboarding',
  });

  res.redirect(accountLinks.url)
})

app.get("/reauth", async (req, res) => {
  const accountId = req.session.accountID

  if (!accountId) {
    res.redirect("/")
    return
  }

  const accountLinks = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `http://localhost:${port}/reauth`,
    return_url: `http://localhost:${port}/return`,
    type: 'account_onboarding',
  });

  res.redirect(accountLinks.url)
})

app.get("/return", async (req, res) => {
  const accountId = req.session.accountID
  if (!accountId) {
    res.redirect("/")
    return
  }
  const account = await stripe.accounts.retrieve(
    accountId
  );
  // TODO charges_enabled, details_submittedを見て
  // 登録が正常に行われたかを確認する必要がある。
  console.log(account)
  res.send("return")
})

app.get('/secret', async (req, res) => {
  // amountはここで算出する
  const amount = 1000;
  const fee = amount * 0.3; // TODO 額に応じて計算する
  const intent = await stripe.paymentIntents.create({
    payment_method_types: ['card'],
    amount,
    currency: 'jpy',
    application_fee_amount: fee,
  }, {
    stripeAccount: "売り手のアカウントID",
  });
  res.json({
    client_secret: intent.client_secret,
    api_key: process.env["API_KEY"],
  });
});

const endpointSecret = 'whsec_...';
app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'] || "";

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
    handleSuccessfulPaymentIntent(connectedAccountId, paymentIntent);
  }

  response.json({received: true});
});

const handleSuccessfulPaymentIntent = (connectedAccountId: string | undefined, paymentIntent: Stripe.Event.Data.Object) => {
  // Fulfill the purchase.
  console.log('Connected account ID: ' + connectedAccountId);
  console.log(JSON.stringify(paymentIntent));
}

/*
app.get("/oauth", async (req, res) => {
  // TODO oauth urlにstateをつけて、チェックを行う。
  // if (req.session.state != req.query.state) {
  //   // エラーにする
  // }

  if (req.query.error) {
    res.send(req.query.error)
    return
  }

  const code = req.query.code
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  });

  console.log(response)
  var connectedAccountId = response.stripe_user_id;

  const account = await stripe.accounts.retrieve(
    connectedAccountId
  );
  // TODO charges_enabled, details_submittedを見て
  // 登録が正常に行われたかを確認する必要がある。
  console.log(account)
  // TODO ユーザー情報と紐付けを行う。
  res.send("OK")
});
*/

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
