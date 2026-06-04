import { auth } from './firebase-admin';
import { prisma } from './prisma';

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
}

export interface UserContext extends AuthUser {
  memberships: {
    companyId: string;
    role: string;
    status: string;
  }[];
}

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Returns the decoded token if valid.
 */
export async function verifyToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Gets the user context including memberships and roles.
 */
export async function getUserContext(uid: string): Promise<UserContext | null> {
  const memberships = await prisma.membership.findMany({
    where: { firebaseUid: uid },
    select: {
      companyId: true,
      role: true,
      status: true,
    },
  });

  // Get user details from Firebase (or we could cache them if needed)
  try {
    const firebaseUser = await auth.getUser(uid);
    return {
      uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      memberships,
    };
  } catch (error) {
    console.error('Error getting user from Firebase:', error);
    return null;
  }
}

/**
 * Validates if the user belongs to the specified company and has the required role.
 */
export async function validateCompanyAccess(
  uid: string,
  companyId: string,
  requiredRoles: string[] = []
) {
  const membership = await prisma.membership.findUnique({
    where: {
      companyId_firebaseUid: {
        companyId,
        firebaseUid: uid,
      },
    },
  });

  if (!membership || membership.status !== 'ACTIVE') {
    return { authorized: false, reason: 'NO_MEMBERSHIP' };
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
    return { authorized: false, reason: 'INSUFFICIENT_PERMISSIONS', role: membership.role };
  }

  return { authorized: true, membership };
}
