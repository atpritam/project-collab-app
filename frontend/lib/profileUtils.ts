/**
 * Navigate to a user's profile page
 * If it's the current user, navigate to /profile
 * If it's another user, navigate to /user/[email]
 */
export function navigateToProfile(
  userEmail: string,
  currentUserEmail: string | null | undefined,
  router: any
) {
  if (!userEmail) {
    console.warn("Cannot navigate to profile: user email is missing");
    return;
  }

  if (userEmail === currentUserEmail) {
    router.push("/profile");
  } else {
    router.push(`/user/${encodeURIComponent(userEmail)}`);
  }
}

/**
 * Get the profile URL for a user
 * Returns either /profile or /user/[email]
 */
export function getProfileUrl(
  userEmail: string,
  currentUserEmail: string | null | undefined
): string {
  if (!userEmail) {
    return "#";
  }

  if (userEmail === currentUserEmail) {
    return "/profile";
  } else {
    return `/user/${encodeURIComponent(userEmail)}`;
  }
}

/**
 * Check if a user email belongs to the current user
 */
export function isCurrentUser(
  userEmail: string,
  currentUserEmail: string | null | undefined
): boolean {
  return userEmail === currentUserEmail;
}

/**
 * Create a clickable profile link component props
 */
export function createProfileLinkProps(
  userEmail: string,
  currentUserEmail: string | null | undefined,
  onClick?: () => void
) {
  const profileUrl = getProfileUrl(userEmail, currentUserEmail);

  return {
    href: profileUrl,
    onClick: (e: React.MouseEvent) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      }
    },
    className: "cursor-pointer hover:opacity-80 transition-opacity",
  };
}
