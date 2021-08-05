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

    // ここで個数が0の物を削除する。
    const cart = JSON.parse(localStorage.getItem("cart") || "{}")
    Object.keys(cart).forEach((productId) => {
      if (cart[productId] <= 0) {
        delete cart[productId]
      }
    })
    localStorage.setItem("cart", JSON.stringify(cart))

    const items: CartItem[] = []
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

  const doBuy = async () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "{}")
    const res =  await fetch("http://localhost:8000/buy_products", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cart
      })
    })
    const data = await res.json()
    const stripePromise = loadStripe(data.api_key);
    setStripePromise(stripePromise)
    setClientSecret(data.client_secret)
  }

  const changeCount = (c: CartItem, e) => {
    const item = cartItem.find((i) => i.product.id == c.product.id)
    if (!item) {
      return
    }
    item.count = parseInt(e.target.value, 10)
    setCartItem([...cartItem])
    changeCartCount(item)
  }

  const changeCartCount = (item: CartItem) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "{}")
    cart[item.product.id] = item.count
    localStorage.setItem("cart", JSON.stringify(cart))
  }

  return (
    <div>
      <Head>
        <title>CART</title>
      </Head>
      <h1>CART</h1>
      {cartItem.map((c) => (
        <div className="border-gray-800 border-2 p-2 m-1">
          <div>{c.product.name}</div>
          <div>{c.product.amount}円</div>
          <div>
            <input type="number" min="0" max="100" value={c.count} onChange={(e) => changeCount(c, e)}/>個
          </div>
        </div>
      ))
      }
      <div><button onClick={() => {doBuy()}}>購入する</button></div>
      {stripePromise && clientSecret ? (
      <Elements stripe={stripePromise}>
        <CheckoutFrom client_secret={clientSecret}/>
      </Elements>
      ) : (<div/>)}
    </div>
  )
}
