import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';

interface Dob {
  day: string
  month: string
  year: string
}

interface Address {
  line1: string
  postal_code: string
  city: string
  state: string
  town: string
}

interface Individual {
  first_name_kana: string
  first_name_kanji: string
  last_name_kana: string
  last_name_kanji: string
  email: string
  phone: string
}

interface ExternalAccount {
  // TODO implements
}

export default function Register() {
  const [data, setData] = useState({
  } as Individual)

  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchUser()
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
    // setData({})
  }

  const changeData = (key: string, value: string) => {
    setData({...data, [key]: value})
  }

  return (
    <div>
      <Head>
        <title>登録</title>
      </Head>
      <h1>登録</h1>
      <div>
        email: <input type="text" onChange={(e) => changeData('email', e.target.value)} value={data.email}/>
      </div>
    </div>
  )
}
