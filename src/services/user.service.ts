import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";
import {
  RegisterUserDto,
  LoginUserDto,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../models/user.model";
import { deleteFile } from "../middlewares/upload.middleware";

let userRepository = new UserRepository();

export class UserService {
  async registerUser(data: RegisterUserDto) {
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
    const hashedPassword = await bcryptjs.hash(data.password, 10);
    data.password = hashedPassword;

    const newUser = await userRepository.createUser(data);
    return newUser;
  }

  async LoginUser(data: LoginUserDto) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }
    const validPassword = await bcryptjs.compare(data.password, user.password);
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
    return { token, user: this.toResponseDto(user) };
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return this.toResponseDto(user);
  }

  async createUserByAdmin(data: CreateUserDto): Promise<UserResponseDto> {
    const existingEmail = await userRepository.getUserByEmail(data.email);
    if (existingEmail) {
      throw new HttpError(409, "Email already registered.");
    }

    const existingUsername = await userRepository.getUserByUsername(
      data.username,
    );
    if (existingUsername) {
      throw new HttpError(409, "Username already registered.");
    }

    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const newUser = await userRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    return this.toResponseDto(newUser);
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { users, total } = await userRepository.getAllUsers(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => this.toResponseDto(user)),
      total,
      page,
      totalPages,
    };
  }

  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return this.toResponseDto(user);
  }

  async updateUserByAdmin(
    userId: string,
    data: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (data.email && data.email !== user.email) {
      const existingEmail = await userRepository.getUserByEmail(data.email);
      if (existingEmail) {
        throw new HttpError(409, "Email already in use");
      }
    }

    if (data.username && data.username !== user.username) {
      const existingUsername = await userRepository.getUserByUsername(
        data.username,
      );
      if (existingUsername) {
        throw new HttpError(409, "Username already in use");
      }
    }

    if (data.password) {
      data.password = await bcryptjs.hash(data.password, 10);
    }

    const updatedUser = await userRepository.updateUser(userId, data);
    if (!updatedUser) {
      throw new HttpError(404, "User not found");
    }

    return this.toResponseDto(updatedUser);
  }

  async deleteUserByAdmin(userId: string): Promise<void> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (user.profilePicture) {
      deleteFile(user.profilePicture);
    }

    const deleted = await userRepository.deleteUser(userId);
    if (!deleted) {
      throw new HttpError(404, "User not found");
    }
  }

  async updateOwnProfile(
    userId: string,
    data: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (data.email && data.email !== user.email) {
      const existingEmail = await userRepository.getUserByEmail(data.email);
      if (existingEmail) {
        throw new HttpError(409, "Email already in use");
      }
    }

    if (data.username && data.username !== user.username) {
      const existingUsername = await userRepository.getUserByUsername(
        data.username,
      );
      if (existingUsername) {
        throw new HttpError(409, "Username already in use");
      }
    }

    if (data.password) {
      data.password = await bcryptjs.hash(data.password, 10);
    }

    const updatedUser = await userRepository.updateUser(userId, data);
    if (!updatedUser) {
      throw new HttpError(404, "User not found");
    }

    return this.toResponseDto(updatedUser);
  }

  async uploadProfilePictureByAdmin(
    userId: string,
    filepath: string,
  ): Promise<UserResponseDto> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      deleteFile(filepath);
      throw new HttpError(404, "User not found");
    }

    if (user.profilePicture) {
      deleteFile(user.profilePicture);
    }

    const updatedUser = await userRepository.updateUser(userId, {
      profilePicture: filepath,
    });

    return this.toResponseDto(updatedUser!);
  }

  async uploadOwnProfilePicture(
    userId: string,
    filepath: string,
  ): Promise<UserResponseDto> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      deleteFile(filepath);
      throw new HttpError(404, "User not found");
    }

    if (user.profilePicture) {
      deleteFile(user.profilePicture);
    }

    const updatedUser = await userRepository.updateUser(userId, {
      profilePicture: filepath,
    });

    return this.toResponseDto(updatedUser!);
  }

  private toResponseDto(user: IUser): UserResponseDto {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
