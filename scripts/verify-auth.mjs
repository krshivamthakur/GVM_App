// Verification script for auth and route protection
const BASE_URL = 'http://localhost:3005'

async function test(description, url, options, validator) {
  try {
    const res = await fetch(url, { redirect: 'manual', ...options })
    const location = res.headers.get('location') || ''
    const status = res.status
    const ok = validator({ status, location, res })
    if (ok) {
      console.log(`[PASS] ${description} (Status: ${status}, Location: ${location || 'none'})`)
      return true
    } else {
      console.error(`[FAIL] ${description} (Status: ${status}, Location: ${location || 'none'})`)
      return false
    }
  } catch (err) {
    console.error(`[ERROR] ${description}: ${err.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('=== Starting Auth & Protection Verification ===\n')
  let passed = 0
  let total = 0

  async function check(desc, url, opts, val) {
    total++
    if (await test(desc, url, opts, val)) passed++
  }

  // 1. Unauthenticated requests to protected paths
  await check(
    'Unauthenticated GET /admin redirects to login with callbackUrl',
    `${BASE_URL}/admin`,
    {},
    ({ status, location }) => status >= 300 && status < 400 && location.includes('/login?callbackUrl=')
  )

  await check(
    'Unauthenticated GET /teacher redirects to login with callbackUrl',
    `${BASE_URL}/teacher`,
    {},
    ({ status, location }) => status >= 300 && status < 400 && location.includes('/login?callbackUrl=')
  )

  await check(
    'Unauthenticated GET /student redirects to login with callbackUrl',
    `${BASE_URL}/student`,
    {},
    ({ status, location }) => status >= 300 && status < 400 && location.includes('/login?callbackUrl=')
  )

  // 2. Authenticated user visiting /login or /
  await check(
    'Authenticated student visiting /login redirects to /student',
    `${BASE_URL}/login`,
    { headers: { Cookie: 'auth_user_id=stu-1; auth_role=student' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/student')
  )

  await check(
    'Authenticated teacher visiting /login redirects to /teacher',
    `${BASE_URL}/login`,
    { headers: { Cookie: 'auth_user_id=teach-1; auth_role=teacher' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/teacher')
  )

  await check(
    'Authenticated admin visiting /login redirects to /admin',
    `${BASE_URL}/login`,
    { headers: { Cookie: 'auth_user_id=adm-1; auth_role=admin' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/admin')
  )

  await check(
    'Authenticated student visiting root / redirects to /student',
    `${BASE_URL}/`,
    { headers: { Cookie: 'auth_user_id=stu-1; auth_role=student' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/student')
  )

  // 3. RBAC Cross-Role Boundary Protection
  await check(
    'Authenticated student accessing /admin is blocked and redirected to /student',
    `${BASE_URL}/admin`,
    { headers: { Cookie: 'auth_user_id=stu-1; auth_role=student' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/student')
  )

  await check(
    'Authenticated student accessing /teacher is blocked and redirected to /student',
    `${BASE_URL}/teacher`,
    { headers: { Cookie: 'auth_user_id=stu-1; auth_role=student' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/student')
  )

  await check(
    'Authenticated teacher accessing /admin is blocked and redirected to /teacher',
    `${BASE_URL}/admin`,
    { headers: { Cookie: 'auth_user_id=teach-1; auth_role=teacher' } },
    ({ status, location }) => status >= 300 && status < 400 && location.endsWith('/teacher')
  )

  // 4. API Route Protection
  await check(
    'Unauthenticated POST /api/progress returns 401 Unauthorized',
    `${BASE_URL}/api/progress`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lectureId: 'lec-1', watchedSeconds: 30 })
    },
    ({ status }) => status === 401
  )

  // 5. Public Routes Access
  await check(
    'Unauthenticated GET /shorts is accessible (public micro-learning videos)',
    `${BASE_URL}/shorts`,
    {},
    ({ status }) => status === 200
  )

  await check(
    'Unauthenticated GET /login is accessible',
    `${BASE_URL}/login`,
    {},
    ({ status }) => status === 200
  )

  console.log(`\n=== Results: ${passed} / ${total} tests passed ===`)
  if (passed === total) {
    console.log('ALL AUTH AND PROTECTION CHECKS ARE WORKING PROPERLY!')
  } else {
    process.exit(1)
  }
}

runAllTests()
