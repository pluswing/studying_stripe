import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import AddProduct from "../components/AddProduct"

interface Product {
  id: number;
  userId: number;
  name: string;
  amount: number;
  url: string;
}

export default function Products() {
  const [products, setProducts] = useState([] as Product[])

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
    setProducts(data.products || [])
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
        </div>
      ))
      }
    </div>
  )
}
