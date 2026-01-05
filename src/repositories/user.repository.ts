import { UserModel, IUser } from "../models/user.model";

export interface IUserRepository {
  getUserByEmail(email: String): Promise<IUser | null>;
  getUserByUsername(username: String): Promise<IUser | null>;
  createUser(userData: Partial<IUser>): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getAllUsers(): Promise<IUser[]>;
  updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  async getUserByEmail(email: String): Promise<IUser | null> {
    const user = await UserModel.findOne({ email: email });
    return user;
  }
  async getUserByUsername(username: String): Promise<IUser | null> {
    const user = await UserModel.findOne({ username: username });
    return user;
  }
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(userData);
    return await user.save();
  }
  async getUserById(id: string): Promise<IUser | null> {
    const user = await UserModel.findById(id);
    return user;
  }
  async getAllUsers(): Promise<IUser[]> {
    const users = await UserModel.find();
    return users;
  }
  async updateUser(
    id: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return updatedUser;
  }
  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return result ? true : false;
  }
}
