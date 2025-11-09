declare function hashPassword(password: string, saltRounds?: number): Promise<string>;
export default hashPassword;
