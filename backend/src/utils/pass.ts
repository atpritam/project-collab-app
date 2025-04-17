// password check
export const checkPassword = (password: string) => {
  // – at least 8 chars
  // – at least one lowercase
  // – at least one uppercase
  // – at least one digit
  // – at least one special character
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
  return regex.test(password);
};
