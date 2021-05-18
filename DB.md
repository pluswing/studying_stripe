# tables

- users
  - login_id
  - password (hash)
  ...

- accounts
  - user_id
  - stripe_account_id
  ...

- products
  - name
  - amount
  - url (商品)
  - user_id

- settlements
  - product_id
  - user_id
  - created_at
