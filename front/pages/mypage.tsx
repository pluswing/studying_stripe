import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';

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
    })()

  }, [])

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
return (
    <div>
      <Head>
        <title>mypage</title>
      </Head>
      <h1>MYPAGE</h1>
      ようこそ！{user.loginId}さん<br/>
      Stripe連携は{account.userId ? "されています": "されていません"}<br/>
      <a onClick={connectStripe}>Stripeと連携</a>
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
