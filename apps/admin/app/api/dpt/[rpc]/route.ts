import { NextResponse } from 'next/server';
import { handleMockRpc, supportedRpcNames, type MockRpcBody } from '../../../../lib/mock-dpt-rpc';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    rpc: string;
  };
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    supportedRpcs: supportedRpcNames,
    note: 'Local mock RPC layer only. No Supabase connection.'
  });
}

export async function POST(request: Request, context: RouteContext) {
  let body: MockRpcBody = {};

  try {
    body = await request.json() as MockRpcBody;
  } catch {
    body = {};
  }

  const response = handleMockRpc(context.params.rpc, body);
  return NextResponse.json(response, { status: response.ok ? 200 : 404 });
}
