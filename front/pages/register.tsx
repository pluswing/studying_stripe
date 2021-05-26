import Head from 'next/head'
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';

export default function Register() {

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter();

  const doRegister = useCallback(async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/register", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        loginId,
        password
      })
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      return
    }

    // 会員登録完了
    router.push("/login")

  }, [loginId, password])

  return (
    <div>
      <Head>
        <title>会員登録</title>
      </Head>
      <h1>会員登録</h1>
      <div className="text-red-400">{error}</div>
      <form onSubmit={doRegister}>
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
      </form>
    </div>
  );
}

