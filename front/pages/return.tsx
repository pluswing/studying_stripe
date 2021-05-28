import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router';

export default function Return() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const res =  await fetch("http://localhost:8000/done_connected", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("access_token")
        },
        body: JSON.stringify({})
      })
      router.replace("/mypage")
    })()
  }, [])

return (
    <div>
      <Head>
        <title>RETURN</title>
      </Head>
    </div>
  )
}
