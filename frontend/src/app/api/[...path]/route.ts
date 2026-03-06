const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

function buildTargetUrl(path: string[]): string {
  const segment = path.join('/');
  return `${BACKEND_URL}/api/${segment}`;
}

async function proxy(request: Request, path: string[]) {
  const url = buildTargetUrl(path);
  const headers = new Headers(request.headers);
  headers.delete('host');
  const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;
  const res = await fetch(url, {
    method: request.method,
    headers,
    body,
  });
  const data = res.body ? await res.text() : '';
  return new Response(data, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}
