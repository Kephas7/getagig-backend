import { UserModel, IUser } from "../models/user.model";

export interface IUserRepository {
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  createUser(userData: Partial<IUser>): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getAllUsers(
    page?: number,
    limit?: number,
  ): Promise<{ users: IUser[]; total: number }>;
  updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;
  addDeviceToken(
    userId: string,
    token: string,
    platform?: string,
  ): Promise<IUser | null>;
  removeDeviceToken(userId: string, token: string): Promise<IUser | null>;
}

export class UserRepository implements IUserRepository {
  async getUserByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email: email });
    return user;
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
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

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: IUser[]; total: number }> {
    const validatedPage = Math.max(1, page);
    const skip = (validatedPage - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find()
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      UserModel.countDocuments(),
    ]);

    return { users, total };
  }

  async updateUser(
    id: string,
    updateData: Partial<IUser>,
  ): Promise<IUser | null> {
    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return result ? true : false;
  }

  async addDeviceToken(
    userId: string,
    token: string,
    platform?: string,
  ): Promise<IUser | null> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { deviceTokens: { token, platform, createdAt: new Date() } },
      },
      { new: true },
    ).select("-password");

    return updated;
  }

  async removeDeviceToken(
    userId: string,
    token: string,
  ): Promise<IUser | null> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { deviceTokens: { token } } },
      { new: true },
    ).select("-password");

    return updated;
  }
}
