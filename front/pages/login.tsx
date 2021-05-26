import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter();

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
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      return
    }

    // ログイン完了
    localStorage.setItem("access_token", data.accessToken)
    router.push("/mypage")
  }, [loginId, password])

  return (
    <div>
      <Head>
        <title>LOGIN</title>
      </Head>
      <h1>ログイン</h1>
      <div className="text-red-400">{error}</div>
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
