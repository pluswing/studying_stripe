import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router';


export interface OrderParent {
  id: number;
  transferGroupId: string; // unique
  amount: number;
  status: 'order' | 'paid';
  createdAt: Date;
  paidAt: Date | null;
  chargeId: string | null;
}

export interface OrderItem {
  id: number;
  parentId: number;
  productId: number;
  // userId: number;
  transfer: number;
  fee: number; // transfer + fee = product.amount
  transferId: string | null;
}

export interface Order {
  parent: OrderParent;
  items: OrderItem[];
}


export default function OrderDetail() {
  const router = useRouter()
  const { id } = router.query

  const [order, setOrder] = useState({} as Order)

  useEffect(() => {
    (async () => {
      await fetchOrders(id as string)
    })()
  }, [id])

  const fetchOrders = async (id: string) => {
    if (!id) return
    const res =  await fetch("http://localhost:8000/platform/order_detail", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': localStorage.getItem("access_token")
      },
      body: JSON.stringify({
        id,
      })
    })
    const data = await res.json()
    // if (data.error) {
    //   router.replace("/login")
    //   return
    // }
    setOrder(data.order)
  }


  return (
    <div>
      <Head>
        <title>PLATFORM</title>
      </Head>
      <h1>注文詳細: ID:{id}</h1>
      {order.parent ? (
      <div>
        <div>{order.parent.id}</div>
        <div>{order.parent.paidAt}</div>
        <div>{order.parent.amount}</div>
        <button>返金</button>
      </div>
      ) : <div></div>}
      {order.items ? (
        order.items.map((i) => (
        <div>
          <div>{i.productId}</div>
          <div>{i.transfer}</div>
          <div>{i.fee}</div>
        </div>
        )))
      : <div></div>}
    </div>
  )
}
