import type { User } from '../types';

/**
 * Get the dashboard route based on user role
 */
export function getDashboardRoute(user: User | null): string {
  if (!user) {
    return '/';
  }

  switch (user.role) {
    case 'horse_owner':
      return '/owner/dashboard';
    case 'farrier':
      return '/farrier/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

/**
 * Get the default route for a role (used for redirects)
 */
export function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case 'horse_owner':
      return '/owner';
    case 'farrier':
      return '/farrier';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

