import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';

interface BalanceData {
  id: number
  userId: number
  amount: number
  orderItemId: number
  createdAt: Date
}

export default function Balance() {
  const [balanceTotal, setBalanceTotal] = useState(0)
  const [balanceList, setBalanceList] = useState([] as BalanceData[])

  const [amount, setAmount] = useState("")

  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchBalance()
    })()
  }, [])

  const fetchBalance = async () => {
    const res =  await fetch("http://localhost:8000/mypage/balances", {
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
    setBalanceTotal(data.total)
    setBalanceList(data.list)
  }

  const doTransfer = async () => {
    if (!amount.match(/^\d+$/)) {
      alert("数値じゃないよ")
      return
    }

    const res =  await fetch("http://localhost:8000/mypage/balances/transfer", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem("access_token")
      },
      body: JSON.stringify({
        amount
      })
    })
    const data = await res.json()
    if (data.error) {
      router.replace("/login")
      return
    }

    fetchBalance()
    setAmount("")
  }
  return (
    <div>
      <Head>
        <title>balance</title>
      </Head>
      <h1>BALANCE</h1>
      残高: {balanceTotal}
      <hr/>
      {balanceList.map((b) => (
        <div>
          <div>{b.createdAt}</div>
          <div>{b.amount}</div>
        </div>
      ))
      }
      <hr/>

      <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)}/>
      <button onClick={doTransfer}>引き出す</button>
    </div>
  )
}
