export const AGE_RESTRICTION_MESSAGE =
  "You must be at least 18 years old to use Socially.";

export const calculateAge = (dateOfBirth: Date | string, today = new Date()): number | null => {
  const birthDate =
    typeof dateOfBirth === "string"
      ? new Date(`${dateOfBirth}T00:00:00.000Z`)
      : dateOfBirth;
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayHasNotOccurred =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate());
  if (birthdayHasNotOccurred) age -= 1;
  return age;
};
