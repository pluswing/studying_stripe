import Head from 'next/head'
import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router';

export default function Mypage() {
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
      <a onClick={connectStripe}>Stripeと連携</a>
    </div>
  )
}
