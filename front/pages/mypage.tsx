import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';

export default function Mypage() {
  const [user, setUser] = useState({
    loginId: ""
  })
  const [account, setAccount] = useState({
    userId: ""
  })

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

      // TODO 他マイページに必要なデータを読み込む。
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
    </div>
  )
}
