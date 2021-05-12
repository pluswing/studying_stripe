const express = require('express')
const session = require("express-session")
const stripe = require('stripe')(process.env["SECRET_KEY"])
const app = express()
const port = 8000

app.use(
  session({
    secret: "Set this to a random string that is kept secure",
    resave: false,
    saveUninitialized: true,
  })
);

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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
