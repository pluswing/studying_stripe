import Head from 'next/head'
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
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

