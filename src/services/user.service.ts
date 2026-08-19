import { UserRepository } from "../repositories/user.repository";
import { UserSelect, UserInsert } from "../db/schema";

export class UserService {
  private userRepo: UserRepository;

  constructor(userRepo = new UserRepository()) {
    this.userRepo = userRepo;
  }

  async countUsers(): Promise<number> {
    return this.userRepo.countUsers();
  }

  async findById(id: string): Promise<UserSelect | null> {
    return this.userRepo.findById(id);
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    return this.userRepo.findByEmail(email);
  }

  async createUser(data: UserInsert): Promise<UserSelect> {
    return this.userRepo.create(data);
  }
}

export const userService = new UserService();
