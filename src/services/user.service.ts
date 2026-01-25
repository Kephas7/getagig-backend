import bycryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";
import { RegisterUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import { email } from "zod";

let userRepository = new UserRepository();

export class UserService {
  async registerUser(data: RegisterUserDTO) {
    const existingEmail = await userRepository.getUserByEmail(data.email);
    if (existingEmail) {
      throw new HttpError(403, "Email already registered.");
    }
    const existingUsername = await userRepository.getUserByUsername(
      data.username,
    );
    if (existingUsername) {
      throw new HttpError(403, "Username already registered.");
    }
    const hashedPassword = await bycryptjs.hash(data.password, 10);
    data.password = hashedPassword;

    const newUser = await userRepository.createUser(data);
    return newUser;
  }

  async LoginUser(data: LoginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }
    const validPassword = await bycryptjs.compare(data.password, user.password);
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
    return { token, user };
  }

  async getCurrentUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }
}
