import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';

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
  account_number: string
  routing_number1: string
  routing_number2: string
  account_holder_name: string
}


const AddressForm = (
  {data, onChange}: {data: Address, onChange: (a: Address) => void}) => (
  <div>
    {["postal_code", "state", "city", "town", "line1"].map((key) => (
      <div className="p-1">
        <label className="inline-block w-32">{key}</label>
        <input className="border-2 border-gray-600 rounded" type="text" onChange={(e) => onChange({...data, [key]: e.target.value})} value={data[key]}/>
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

const DobForm = ({data, onChange}: {data: Dob, onChange: (a: Dob) => void}) => (
  <div>
    <input type="date" onChange={(e) => onChange(str2dob(e.target.value))} value={dob2str(data)}/>
  </div>
)


const ExternalAccountForm = (
  {data, onChange}: {data: ExternalAccount, onChange: (a: ExternalAccount) => void}) => (
  <div>
    {["routing_number1", "routing_number2", "account_number", "account_holder_name"].map((key) => (
      <div className="p-1">
        <label className="inline-block w-32">{key}</label>
        <input className="border-2 border-gray-600 rounded" type="text" onChange={(e) => onChange({...data, [key]: e.target.value})} value={data[key]}/>
      </div>
    ))}
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
  const [tos, setTos] = useState(false)
  const [externalAccount, setExternalAccount] = useState({
  } as ExternalAccount)

  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchUser()
    })()
  }, [])

  const onFrontDrop = useCallback((acceptedFiles) => {
    console.log('frontAcceptedFiles:', acceptedFiles);
    drawCanvas(acceptedFiles[0], "#frontCanvas")
  }, []);

  const onBackDrop = useCallback((acceptedFiles) => {
    console.log('backAcceptedFiles:', acceptedFiles);
    drawCanvas(acceptedFiles[0], "#backCanvas")
  }, []);


  const drawCanvas = (file: File, canvasId: string) => {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const canvas: HTMLCanvasElement = document.querySelector(canvasId)
      let ctx = canvas.getContext('2d')
      let image = new Image()
      image.src = reader.result as string
      image.onload = () => {
        const r = Math.min(
          canvas.width / image.width,
          canvas.height / image.height)
        const w = image.width * r
        const h = image.height * r
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image,
          0, 0, image.width, image.height,
          (canvas.width - w) / 2,
          (canvas.height - h) / 2, w, h)
      }
    }
  }

  const {
    getRootProps: getFrontRootProps,
    getInputProps: getFrontInputProps,
    isDragActive: isFrontDragActive,
    acceptedFiles: frontAcceptedFiles } = useDropzone({
      onDrop: onFrontDrop,
      accept: 'image/jpeg, image/png'
    }
  );

  const {
    getRootProps: getBackRootProps,
    getInputProps: getBackInputProps,
    isDragActive: isBackDragActive,
    acceptedFiles: backAcceptedFiles } = useDropzone({
      onDrop: onBackDrop,
      accept: 'image/jpeg, image/png'
    }
  );

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
        <AddressForm data={addressKanji} onChange={setAddressKanji} />
      住所(かな):
        <AddressForm data={addressKana} onChange={setAddressKana} />
      <label className="inline-block w-32">生年月日</label>
      <DobForm data={dob} onChange={setDob}/>

      <div id="tos">
        <input type="checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)}/><a target="_blank" href="/tos">利用規約</a>に同意する
      </div>

      身分証明書 表面:
      <div {...getFrontRootProps()} className={isFrontDragActive ? "w-80 h-60 border-2 border-green-400" : "w-80 h-60 border-2 border-gray-600"}>
        <input {...getFrontInputProps()} />
        <canvas id="frontCanvas" width="316" height="236"/>
      </div>

      身分証明書 裏面:
      <div {...getBackRootProps()} className={isBackDragActive ? "w-80 h-60 border-2 border-green-400" : "w-80 h-60 border-2 border-gray-600"}>
        <input {...getBackInputProps()} />
        <canvas id="backCanvas" width="316" height="236"/>
      </div>

      口座情報:
      <ExternalAccountForm data={externalAccount} onChange={setExternalAccount}/>
    </div>
  )
}
