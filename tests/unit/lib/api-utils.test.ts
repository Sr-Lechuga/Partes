import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
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

describe('createSuccessResponse', () => {
  it('should return 200 with data wrapped in a data key', async () => {
    const payload = { id: '123', name: 'Test' };

    const response = createSuccessResponse(payload);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(payload);
  });

  it('should return a custom status code when provided', async () => {
    const payload = { created: true };

    const response = createSuccessResponse(payload, 201);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual(payload);
  });
});

describe('createErrorResponse', () => {
  it('should return 500 with INTERNAL_SERVER_ERROR code by default', async () => {
    const response = createErrorResponse('Unexpected failure');
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('Unexpected failure');
  });

  it('should return 404 with NOT_FOUND code when status is 404', async () => {
    const response = createErrorResponse('Resource not found', 404);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 with UNAUTHORIZED code when status is 401', async () => {
    const response = createErrorResponse('Token missing', 401);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 with FORBIDDEN code when status is 403', async () => {
    const response = createErrorResponse('Access denied', 403);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
