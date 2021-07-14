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

  const AddressForm = (props: {data: Address, setter: (a: Address) => void}) => (
    <div>
      {["postal_code", "state", "city", "town", "line1"].map((key) => (
        <div>
        {key}: <input type="text" onChange={(e) => props.setter({...props.data, [key]: e.target.value})} value={props.data[key]}/>
        </div>
      ))}
    </div>
  )

  const DobForm = (props: {data: Dob, setter: (a: Dob) => void}) => (
    <div>
      生年月日:
      {["year", "month", "day"].map((key) => (
      <input type="text" onChange={(e) => props.setter({...props.data, [key]: e.target.value})} value={props.data[key]}/>
      ))}
    </div>
  )

  return (
    <div>
      <Head>
        <title>登録</title>
      </Head>
      <h1>登録</h1>
      {["last_name_kanji", "first_name_kanji", "last_name_kana", "first_name_kana", "email", "phone"].map((key) => (
        <div>
        {key}: <input type="text" onChange={(e) => setIndividual({...individual, [key]: e.target.value})} value={individual[key]}/>
        </div>
      ))}
      住所(漢字):
      <div className="border-2 border-gray-700 p-3">
        <AddressForm data={addressKanji} setter={setAddressKanji} />
      </div>
      住所(かな):
      <div className="border-2 border-gray-700 p-3">
        <AddressForm data={addressKana} setter={setAddressKana} />
      </div>
      <DobForm data={dob} setter={setDob}/>
    </div>
  )
}
