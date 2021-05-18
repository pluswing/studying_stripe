interface User {
  id: number;
  login_id: string;
  password: string;
}

interface Account {
  user_id: number;
  stripe_account_id: string;
}

interface Product {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  url: string;
}

interface Settlement {
  id: number;
  product_id: number;
  user_id: number;
  created_at: Date;
}
