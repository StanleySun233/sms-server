export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="glass-card max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          SMS Server Management
        </h1>
        <p className="text-gray-300 mb-6">
          Welcome to your SMS device management platform
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="btn-primary">
            Login
          </a>
          <a href="/register" className="btn-secondary">
            Register
          </a>
        </div>
      </div>
    </main>
  );
}
