import Head from 'next/head'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import { DeepMap, FieldError, FieldValues, useForm, UseFormRegister } from "react-hook-form";

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

  address_kanji: Address
  address_kana: Address
  dob: Dob

  verification: {
    document: {
      front: string|null
      back: string|null
    }
  }
}

interface ExternalAccount {
  account_number: string
  routing_number: string
  account_holder_name: string
}

interface StripeAccountRequest {
  individual: Individual
  external_account: ExternalAccount
}

interface AddressFormProps {
  postfix: string
  register: UseFormRegister<FieldValues>
  errors: DeepMap<FieldValues, FieldError>
}

const AddressForm = (
  {postfix, register, errors}: AddressFormProps) => (
  <div>
    {["postal_code", "state", "city", "town", "line1"].map((key) => (
      <div className="p-1">
        <label className="inline-block w-32">{key}</label>
        <input className={(errors[`${key}_${postfix}`] ? "border-red-600" : "border-gray-600") + " border-2 rounded"} type="text" {...register(`${key}_${postfix}`, {required: true})}/>
        {errors[`${key}_${postfix}`] && <span className="text-red-500">必須入力です</span>}
      </div>
    ))}
  </div>
)

const str2dob = (str: string): Dob => {
  const s = str.split("-")
  return {
    year: s[0],
    month: s[1],
    day: s[2]
  }
}

const DobForm = ({register}: {register: UseFormRegister<FieldValues>}) => (
  <div>
    <input type="date" {...register("dob")}/>
  </div>
)

const ExternalAccountForm = (
  {register}: {register: UseFormRegister<FieldValues>}) => (
  <div>
    {["routing_number1", "routing_number2", "account_number", "account_holder_name"].map((key) => (
      <div className="p-1">
        <label className="inline-block w-32">{key}</label>
        <input className="border-2 border-gray-600 rounded" type="text" {...register(key)}/>
      </div>
    ))}
  </div>
)

export default function Register() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchUser()
    })()
  }, [])

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onFrontDrop = useCallback((acceptedFiles) => {
    console.log('frontAcceptedFiles:', acceptedFiles);
    drawCanvas(acceptedFiles[0], "#frontCanvas")
  }, []);

  const onBackDrop = useCallback((acceptedFiles) => {
    console.log('backAcceptedFiles:', acceptedFiles);
    drawCanvas(acceptedFiles[0], "#backCanvas")
  }, []);

  const imageStr = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = () => {
        reject("file read error")
      }
    })
  }

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


  const onSubmit = async (data) => {
    console.log("data", data);

    if (!data.tos) {
      alert("利用規約に同意してください。")
      return
    }

    const res =  await fetch("http://localhost:8000/stripe/account", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem("access_token")
      },
      body: JSON.stringify({
        individual: {
          first_name_kana: data.first_name_kanji,
          first_name_kanji: data.first_name_kanji,
          last_name_kana: data.last_name_kana,
          last_name_kanji: data.last_name_kanji,
          email: data.email,
          phone: data.phone,
          address_kanji: {
            line1: data.line1_kanji,
            postal_code: data.postal_code_kanji,
            city: data.city_kanji,
            state: data.state_kanji,
            town: data.town_kanji,
          },
          address_kana: {
            line1: data.line1_kana,
            postal_code: data.postal_code_kana,
            city: data.city_kana,
            state: data.state_kana,
            town: data.town_kana,
          },
          dob: str2dob(data.dob),
          verification: {
            document: {
              front: frontAcceptedFiles.length ? await imageStr(frontAcceptedFiles[0]) : null,
              back: backAcceptedFiles.length ? await imageStr(backAcceptedFiles[0]) : null,
            }
          }
        },
        external_account: {
          account_number: data.account_number,
          routing_number: `${data.routing_number1}${data.routing_number2}`,
          account_holder_name: data.account_holder_name
        }
      } as StripeAccountRequest)
    })
    const rdata = await res.json()
    if (rdata.error) {
      router.replace("/login")
      return
    }

  }

  return (
    <div>
      <Head>
        <title>登録</title>
      </Head>
      <h1>登録</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        {[{k: "last_name_kanji"}, {k: "first_name_kanji"}, {k: "last_name_kana"}, {k: "first_name_kana"}, {k: "email", t: "email"}, {k: "phone", t: "tel"}].map(({k, t}) => (
          <div className="p-1">
            <label className="inline-block w-32">{k}</label>
            <input className={(errors[k] ? "border-red-600" : "border-gray-600") + " border-2 rounded"} type={t ? t : "text"} {...register(k, { required: true })}/>
            {errors[k] && <span className="text-red-500">必須入力です</span>}
          </div>
        ))}
        住所(漢字):
          <AddressForm postfix="kanji" register={register} errors={errors}/>
        住所(かな):
          <AddressForm postfix="kana" register={register} errors={errors}/>
        <label className="inline-block w-32">生年月日</label>
        <DobForm register={register}/>

        <div id="tos">
          <input type="checkbox" {...register("tos")}/><a target="_blank" href="/tos">利用規約</a>に同意する
        </div>

        身分証明書 表面:
        <div {...getFrontRootProps()} className={isFrontDragActive ? "w-80 h-60 border-2 border-green-400" : "w-80 h-60 border-2 border-gray-600"}>
          <input {...getFrontInputProps()}/>
          <canvas id="frontCanvas" width="316" height="236"/>
        </div>

        身分証明書 裏面:
        <div {...getBackRootProps()} className={isBackDragActive ? "w-80 h-60 border-2 border-green-400" : "w-80 h-60 border-2 border-gray-600"}>
          <input {...getBackInputProps()}/>
          <canvas id="backCanvas" width="316" height="236"/>
        </div>

        口座情報:
        <ExternalAccountForm register={register}/>

        <input type="submit" className="m-4 p-3 bg-blue-500 rounded" />

      </form>
    </div>
  )
}
