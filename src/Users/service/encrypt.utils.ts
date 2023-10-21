import * as bcrypt from 'bcrypt';

export async function hashService(password: string): Promise<string> {
  const fixedSalt = '$2a$10$ABCDEFGHIJKLMNOPQRSTUVWXYZ12345';
  const hash = await bcrypt.hash(password, fixedSalt);
  return hash;
}
