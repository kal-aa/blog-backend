declare function comparePassword(inputPassword: string, sqlPassword: string): Promise<boolean>;
export default comparePassword;
