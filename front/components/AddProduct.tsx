import { useCallback, useState } from 'react'

interface Props {
  onAdded: () => {}
}

export default function AddProduct(props: Props) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState(0)
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")

  const onSubmit = useCallback(async () => {
    const res =  await fetch("http://localhost:8000/register_product", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("access_token")
        },
        body: JSON.stringify({
          name,
          amount,
          url
        })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setError("")
      setName("")
      setAmount(0)
      setUrl("")
      props.onAdded()
  }, [name, amount, url])
return (
    <div>
      <div className="text-red-500">{error}</div>
      <input type="text" placeholder="name" value={name} onChange={(e) => setName(e.target.value)}/>
      <br/>
      <input type="text" placeholder="amount" value={amount} onChange={(e) => setAmount(parseInt(e.target.value, 10))}/>
      <br/>
      <input type="text" placeholder="url" value={url} onChange={(e) => setUrl(e.target.value)}/>
      <br/>
      <button onClick={onSubmit}>新規作成</button>
    </div>
  )
}
