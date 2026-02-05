export default function TestPage() {
  return (
    <div style={{ padding: '50px', backgroundColor: 'white', color: 'black' }}>
      <h1>Test Page - No Providers</h1>
      <p>If you can see this without being redirected to /auth, then the issue is in the providers or Navbar.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
}
