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

export default function Mypage() {
  const [user, setUser] = useState({
    loginId: ""
  })
  const [account, setAccount] = useState({
    userId: ""
  })
  const [products, setProducts] = useState([] as Product[])

  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchUser()
      await fetchProducts()
    })()
  }, [])

  const fetchUser = async () => {
    const res =  await fetch("http://localhost:8000/user", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem("access_token")
      },
      body: JSON.stringify({})
    })
    const data = await res.json()
    if (data.error) {
      router.replace("/login")
      return
    }
    setUser(data.user)
    setAccount(data.account || {userId: ""})
  }

  const fetchProducts = async () => {
    // 商品一覧取得
    const res2 =  await fetch("http://localhost:8000/list_products_by_user", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem("access_token")
      },
      body: JSON.stringify({})
    })
    const data2 = await res2.json()
    setProducts(data2.products || [])
  }

  const connectStripe = useCallback(async () => {
    const res =  await fetch("http://localhost:8000/connect_stripe", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("access_token")
        },
        body: JSON.stringify({
          // returnUrl: "",
        })
      })
    const data = await res.json()
    if (data.error) {
      console.log(data)
      return;
    }
    location.href = data.url
  }, [])


  const dashboard = useCallback(async () => {
    const res =  await fetch("http://localhost:8000/dashboard", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("access_token")
        },
        body: JSON.stringify({
        })
      })
    const data = await res.json()
    if (data.error) {
      console.log(data)
      return;
    }
    location.href = data.url
  }, [])
return (
    <div>
      <Head>
        <title>mypage</title>
      </Head>
      <h1>MYPAGE</h1>
      ようこそ！{user.loginId}さん<br/>
      {account.userId ? (
        <div>
          <div>Stripe連携はされています</div>
          <a onClick={dashboard}>ダッシュボード</a>
        </div>
      ) : (
        <div>
          <div>Stripe連携はされていません</div>
          <br/>
          <a onClick={connectStripe}>Stripeと連携</a>
        </div>
        )}
      <hr/>
      <AddProduct onAdded={fetchProducts}/>
      <hr/>
      {products.map((p) => (
        <div>
          <div>{p.name}</div>
          <div>{p.amount}</div>
        </div>
      ))
      }
    </div>
  )
}
