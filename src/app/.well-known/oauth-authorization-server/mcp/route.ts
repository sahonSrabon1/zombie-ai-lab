export async function GET() {
  return Response.json({
    issuer: 'http://localhost:3000/mcp',
    authorization_endpoint: null,
    token_endpoint: null,
    response_types_supported: [],
    grant_types_supported: [],
    code_challenge_methods_supported: [],
  });
}
