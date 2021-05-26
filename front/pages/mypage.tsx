import Head from 'next/head'
import { useEffect } from 'react'
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
  })
  return (
    <div>
      <Head>
        <title>mypage</title>
      </Head>
      <h1>MYPAGE</h1>
    </div>
  )
}
