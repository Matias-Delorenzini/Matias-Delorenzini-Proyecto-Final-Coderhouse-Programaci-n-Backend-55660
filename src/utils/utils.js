import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'bcrypt';

export const createHash = password => pkg.hashSync(password, pkg.genSaltSync(10));

export const isValidPassword = (user, password) => pkg.compareSync(password, user.password);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

console.log(__dirname)
console.log(__filename)