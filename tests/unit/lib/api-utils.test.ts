import { withAuth } from '@/lib/api-utils';
import { verifyToken, validateCompanyAccess } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Mock auth utils
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  validateCompanyAccess: jest.fn(),
}));

describe('withAuth Wrapper', () => {
  const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
  const mockUser = { uid: 'user-123', email: 'test@example.com', name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing', async () => {
    const request = new Request('http://localhost/api/test', { headers: {} });
    const wrapped = withAuth(mockHandler);
    
    const response = await wrapped(request, { params: {} });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 if token is invalid', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer invalid' },
    });
    (verifyToken as jest.Mock).mockResolvedValue(null);

    const wrapped = withAuth(mockHandler);
    const response = await wrapped(request, { params: {} });

    expect(response.status).toBe(401);
  });

  it('should call handler if authenticated and no company check is required', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid' },
    });
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);

    const wrapped = withAuth(mockHandler);
    const response = await wrapped(request, { params: {} });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should return 403 if company check is required but companyId is missing', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid' },
    });
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);

    const wrapped = withAuth(mockHandler, { checkCompanyAccess: true });
    const response = await wrapped(request, { params: {} });

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('FORBIDDEN');
  });

  it('should return 403 if user does not have access to the company', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid', 'x-company-id': 'comp-1' },
    });
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({ authorized: false, reason: 'NO_MEMBERSHIP' });

    const wrapped = withAuth(mockHandler, { checkCompanyAccess: true });
    const response = await wrapped(request, { params: {} });

    expect(response.status).toBe(403);
  });

  it('should pass companyId and role to handler if access is valid', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid' },
    });
    (verifyToken as jest.Mock).mockResolvedValue(mockUser);
    (validateCompanyAccess as jest.Mock).mockResolvedValue({ 
      authorized: true, 
      membership: { role: 'ADMIN' } 
    });

    const wrapped = withAuth(mockHandler, { checkCompanyAccess: true });
    // Simulate path param [id]
    const response = await wrapped(request, { params: { id: 'comp-1' } });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      companyId: 'comp-1',
      role: 'ADMIN'
    }));
  });
});
