export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="glass-card max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          短信服务管理
        </h1>
        <p className="text-gray-300 mb-6">
          欢迎使用短信设备管理平台
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="btn-primary">
            登录
          </a>
          <a href="/register" className="btn-secondary">
            注册
          </a>
        </div>
      </div>
    </main>
  );
}
