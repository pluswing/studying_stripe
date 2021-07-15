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


const AddressForm = (
  {data, setter}: {data: Address, setter: (a: Address) => void}) => (
  <div>
    {["postal_code", "state", "city", "town", "line1"].map((key) => (
      <div className="p-1">
        <label className="inline-block w-32">{key}</label>
        <input className="border-2 border-gray-600 rounded" type="text" onChange={(e) => setter({...data, [key]: e.target.value})} value={data[key]}/>
      </div>
    ))}
  </div>
)

const dob2str = (dob: Dob): string => {
  return `${dob.year}-${dob.month}-${dob.day}`
}

const str2dob = (str: string): Dob => {
  const s = str.split("-")
  return {
    year: s[0],
    month: s[1],
    day: s[2]
  }
}

const DobForm = ({data, setter}: {data: Dob, setter: (a: Dob) => void}) => (
  <div>
    <input type="date" onChange={(e) => setter(str2dob(e.target.value))} value={dob2str(data)}/>
  </div>
)

export default function Register() {
  const [individual, setIndividual] = useState({
  } as Individual)
  const [addressKanji, setAddressKanji] = useState({
  } as Address)
  const [addressKana, setAddressKana] = useState({
  } as Address)
  const [dob, setDob] = useState({
  } as Dob)

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

  return (
    <div>
      <Head>
        <title>登録</title>
      </Head>
      <h1>登録</h1>
      {[{k: "last_name_kanji"}, {k: "first_name_kanji"}, {k: "last_name_kana"}, {k: "first_name_kana"}, {k: "email", t: "email"}, {k: "phone", t: "tel"}].map(({k, t}) => (
        <div className="p-1">
          <label className="inline-block w-32">{k}</label>
          <input className="border-2 border-gray-600 rounded" type={t ? t : "text"} onChange={(e) => setIndividual({...individual, [k]: e.target.value})} value={individual[k]}/>
        </div>
      ))}
      住所(漢字):
        <AddressForm data={addressKanji} setter={setAddressKanji} />
      住所(かな):
        <AddressForm data={addressKana} setter={setAddressKana} />
      <label className="inline-block w-32">生年月日</label>
      <DobForm data={dob} setter={setDob}/>
    </div>
  )
}
