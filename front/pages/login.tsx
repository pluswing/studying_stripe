import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useState } from 'react';

export default function Login() {

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")

  const doLogin = useCallback(async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        loginId,
        password
      })
    })
    console.log(await res.json())
  }, [loginId, password])

  return (
    <div>
      <Head>
        <title>LOGIN</title>
      </Head>
      <h1>ログイン</h1>
      <form onSubmit={doLogin}>
        <label>
          LOGIN ID:
          <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
        </label>
        <br/>
        <label>
          PASSWORD:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br/>
        <input type="submit" value="Submit" />
        <br/>
        <Link href="/register"><a>会員登録はこちら</a></Link>
      </form>
    </div>
  );
}

