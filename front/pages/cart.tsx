import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import CheckoutFrom from "../components/CheckoutForm"

interface Product {
  id: number;
  userId: number;
  name: string;
  amount: number;
  url: string;
}

interface CartItem {
  product: Product;
  count: number;
}

export default function Products() {
  const [cartItem, setCartItem] = useState([] as CartItem[])
  const [stripePromise, setStripePromise] = useState({} as any)
  const [clientSecret, setClientSecret] = useState("")

  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchProducts()
    })()
  }, [])

  const fetchProducts = async () => {
    // 商品一覧取得
    const res =  await fetch("http://localhost:8000/list_products", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "" // TODO
      })
    })
    const data = await res.json()

    const items: CartItem[] = []
    const cart = JSON.parse(localStorage.getItem("cart"))
    data.products.forEach((p: Product) => {
      if (Object.keys(cart).includes(`${p.id}`)) {
        const count = cart[p.id]
        items.push({
          product: p,
          count,
        })
      }
    })
    setCartItem(items)
  }

  const doBuy = async (productId: number) => {
    const res =  await fetch("http://localhost:8000/buy_products", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_ids: [productId]
      })
    })
    const data = await res.json()
    const stripePromise = loadStripe(data.api_key);
    setStripePromise(stripePromise)
    setClientSecret(data.client_secret)
  }

return (
    <div>
      <Head>
        <title>PRODUCTS</title>
      </Head>
      <h1>PRODUCTS</h1>
      {products.map((p) => (
        <div className="border-gray-800 border-2 p-2 m-1">
          <div>{p.name}</div>
          <div>{p.amount}</div>
          <div><button onClick={() => {doBuy(p.id)}}>購入</button></div>
        </div>
      ))
      }
      {stripePromise && clientSecret ? (
      <Elements stripe={stripePromise}>
        <CheckoutFrom client_secret={clientSecret}/>
      </Elements>
      ) : (<div/>)}
    </div>
  )
}
