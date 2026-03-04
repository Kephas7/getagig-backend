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
import { MusicianRepository } from "../repositories/musician.repository";
import { OrganizerRepository } from "../repositories/organizer.repository";
import { IUser } from "../models/user.model";
import { deleteFile } from "../middlewares/upload.middleware";
import { sendEmail } from "../config/email";
const CLIENT_URL = process.env.CLIENT_URL as string;

let userRepository = new UserRepository();
let musicianRepository = new MusicianRepository();
let organizerRepository = new OrganizerRepository();

type VerificationMeta = {
  isVerified?: boolean;
  verificationRequested?: boolean;
  profileId?: string;
};

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

    return this.toResponseDto(user, await this.getVerificationMeta(user));
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

    const usersWithVerification = await Promise.all(
      users.map(async (user) =>
        this.toResponseDto(user, await this.getVerificationMeta(user)),
      ),
    );

    return {
      users: usersWithVerification,
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

    return this.toResponseDto(user, await this.getVerificationMeta(user));
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

  private toResponseDto(
    user: IUser,
    verificationMeta?: VerificationMeta,
  ): UserResponseDto {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: verificationMeta?.isVerified,
      verificationRequested: verificationMeta?.verificationRequested,
      profileId: verificationMeta?.profileId,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async getVerificationMeta(user: IUser): Promise<VerificationMeta> {
    if (user.role === "musician") {
      const musicianProfile = await musicianRepository.findByUserId(
        user._id.toString(),
      );
      return {
        isVerified: musicianProfile?.isVerified ?? false,
        verificationRequested: musicianProfile?.verificationRequested ?? false,
        profileId: musicianProfile?._id?.toString(),
      };
    }

    if (user.role === "organizer") {
      const organizerProfile = await organizerRepository.findByUserId(
        user._id.toString(),
      );
      return {
        isVerified: organizerProfile?.isVerified ?? false,
        verificationRequested: organizerProfile?.verificationRequested ?? false,
        profileId: organizerProfile?._id?.toString(),
      };
    }

    return {};
  }
  async sendResetPasswordEmail(email?: string, clientUrl?: string) {
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      return;
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    const baseUrl = clientUrl || CLIENT_URL;
    const resetLink = `${baseUrl}/reset-password/${token}`;
    const html = `<p> Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(email, "Reset Password", html);
    return user;
  }
  async resetPassword(token?: string, password?: string) {
    if (!token || !password) {
      throw new HttpError(400, "Token and password are required");
    }
    let decodedToken: { id: string };

    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
      throw new HttpError(400, "Invalid or expired reset token");
    }

    const userId = decodedToken.id;
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const hashedPassword = await bcryptjs.hash(password!, 10);
    const updatedUser = await userRepository.updateUser(userId, {
      password: hashedPassword,
    });
    if (!updatedUser) {
      throw new HttpError(404, "User not found");
    }
    return updatedUser;
  }

  async registerDeviceToken(userId: string, token: string, platform?: string) {
    if (!token) throw new HttpError(400, "Device token is required");
    const updated = await userRepository.addDeviceToken(
      userId,
      token,
      platform,
    );
    if (!updated) throw new HttpError(404, "User not found");
    return this.toResponseDto(updated as IUser);
  }

  async unregisterDeviceToken(userId: string, token: string) {
    if (!token) throw new HttpError(400, "Device token is required");
    const updated = await userRepository.removeDeviceToken(userId, token);
    if (!updated) throw new HttpError(404, "User not found");
    return this.toResponseDto(updated as IUser);
  }
}
