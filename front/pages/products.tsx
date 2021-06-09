import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import {Elements, CardElement} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import { API_KEY } from "../components/apikey"
import CheckoutFrom from "../components/CheckoutForm"

interface Product {
  id: number;
  userId: number;
  name: string;
  amount: number;
  url: string;
}

export default function Products() {
  const [products, setProducts] = useState([] as Product[])
  const [clientSecret, setClientSecret] = useState("")

  const router = useRouter();

  const stripePromise = loadStripe(API_KEY, {
    // stripeAccount: '/* ログインしてないとだめ？ */'
  });

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
    setProducts(data.products || [])
  }

  const doBuy = async (productId: number) => {
    const res =  await fetch("http://localhost:8000/buy_products", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId
      })
    })
    const data = await res.json()
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
      {clientSecret ? (
      <Elements stripe={stripePromise}>
        <CheckoutFrom client_secret={clientSecret}/>
      </Elements>
      ) : (<div/>)}
    </div>
  )
}
