import Head from 'next/head'
import { useEffect, useState } from 'react'

export interface OrderParent {
  id: number;
  transferGroupId: string; // unique
  amount: number;
  status: 'order' | 'paid';
  createdAt: Date;
  paidAt: Date | null;
  chargeId: string | null;
}

export default function Platform() {
  const [orders, setOrders] = useState([] as OrderParent[])

  useEffect(() => {
    (async () => {
      await fetchOrders()
    })()
  }, [])

  const fetchOrders = async () => {
    const res =  await fetch("http://localhost:8000/platform/orders", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': localStorage.getItem("access_token")
      },
      body: JSON.stringify({})
    })
    const data = await res.json()
    // if (data.error) {
    //   router.replace("/login")
    //   return
    // }
    setOrders(data.orders)
  }
return (
    <div>
      <Head>
        <title>PLATFORM</title>
      </Head>
      <h1>PLATFORM</h1>
      <hr/>
      <h2>注文一覧</h2>
      {orders.map((o) => (
        <div>
          <div>{o.id}</div>
          <div>{o.paidAt}</div>
          <div>{o.amount}</div>
          <button>詳細</button>
        </div>
      ))
      }
    </div>
  )
}
