import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { createIfNotExists } from '@/common/typeorm/create';
import { updateOneIfExists } from '@/common/typeorm/update';
import { findByPage } from '@/common/typeorm/find';
import { FindByPageDto } from '@/common/typeorm/find.dto';

export const SUPER_ADMIN_UID = 'admin';

const PASSWORD_HASH_SCHEME = 'scrypt';
const PASSWORD_HASH_VERSION = '1';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;
const MIN_SUPER_ADMIN_PASSWORD_LENGTH = 12;

const scryptAsync = promisify(scrypt);

function isSuperAdminIdentity(value?: string | null): boolean {
  return value?.trim().toLowerCase() === SUPER_ADMIN_UID;
}

function hashLegacyPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const key = (await scryptAsync(
    password,
    salt,
    PASSWORD_KEY_LENGTH,
  )) as Buffer;
  return [
    PASSWORD_HASH_SCHEME,
    PASSWORD_HASH_VERSION,
    salt,
    key.toString('hex'),
  ].join('$');
}

function timingSafeEqualHex(actualHex: string, expectedHex: string): boolean {
  const hexPattern = /^[a-f0-9]+$/i;
  if (
    actualHex.length % 2 !== 0 ||
    expectedHex.length % 2 !== 0 ||
    !hexPattern.test(actualHex) ||
    !hexPattern.test(expectedHex)
  ) {
    return false;
  }

  const actual = Buffer.from(actualHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const parts = storedHash.split('$');

  if (parts[0] === PASSWORD_HASH_SCHEME) {
    const [, version, salt, expectedHex] = parts;
    if (version !== PASSWORD_HASH_VERSION || !salt || !expectedHex) {
      return { valid: false, needsRehash: false };
    }

    const key = (await scryptAsync(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;

    return {
      valid: timingSafeEqualHex(key.toString('hex'), expectedHex),
      needsRehash: false,
    };
  }

  const valid = timingSafeEqualHex(hashLegacyPassword(password), storedHash);
  return { valid, needsRehash: valid };
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User, 'work-sqlite')
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    this.assertPublicIdentityAllowed(createUserDto);

    const existing = await this.userRepository.findOne({
      where: { login_name: createUserDto.login_name },
    });
    if (existing) {
      throw new ConflictException(
        `Login name <${createUserDto.login_name}> already exists`,
      );
    }

    let uid = createUserDto.uid;
    if (!uid) {
      const users = await this.userRepository.find({ select: ['uid'] });
      let maxId = 0;
      for (const u of users) {
        if (isSuperAdminIdentity(u.uid)) continue;
        const num = parseInt(u.uid, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
      uid = String(maxId + 1);
    }

    const dto = {
      ...createUserDto,
      uid,
      password: await hashPassword(createUserDto.password),
      is_super_admin: false,
    };

    return await createIfNotExists({
      repository: this.userRepository,
      dto,
      uniqueKey: 'uid',
      errorMessage: `User<${uid}> already exists`,
    });
  }

  async ensureSuperAdmin(initialPassword?: string) {
    const existingByLogin = await this.userRepository.findOne({
      where: { login_name: SUPER_ADMIN_UID },
    });

    if (existingByLogin && existingByLogin.uid !== SUPER_ADMIN_UID) {
      this.logger.error(
        `Cannot initialize super admin: login_name <${SUPER_ADMIN_UID}> is already used by User<${existingByLogin.uid}>`,
      );
      return;
    }

    const existing = await this.userRepository.findOne({
      where: { uid: SUPER_ADMIN_UID },
    });

    if (existing) {
      let changed = false;

      if (existing.login_name !== SUPER_ADMIN_UID) {
        existing.login_name = SUPER_ADMIN_UID;
        changed = true;
      }

      if (!existing.is_super_admin) {
        existing.is_super_admin = true;
        changed = true;
      }

      if (changed) {
        await this.userRepository.save(existing);
      }

      this.logger.log('Super admin account is ready.');
      return;
    }

    if (!initialPassword) {
      this.logger.warn(
        'ADMIN_INITIAL_PASSWORD is not set; skipped super admin bootstrap.',
      );
      return;
    }

    if (initialPassword.length < MIN_SUPER_ADMIN_PASSWORD_LENGTH) {
      this.logger.warn(
        `ADMIN_INITIAL_PASSWORD must be at least ${MIN_SUPER_ADMIN_PASSWORD_LENGTH} characters; skipped super admin bootstrap.`,
      );
      return;
    }

    await this.userRepository.save({
      uid: SUPER_ADMIN_UID,
      login_name: SUPER_ADMIN_UID,
      user_name: 'Administrator',
      password: await hashPassword(initialPassword),
      is_super_admin: true,
    });

    this.logger.log('Super admin account created.');
  }

  async login(loginName: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { login_name: loginName },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid login name or password');
    }

    const verification = await verifyPassword(password, user.password);
    if (!verification.valid) {
      throw new UnauthorizedException('Invalid login name or password');
    }

    if (verification.needsRehash) {
      user.password = await hashPassword(password);
      await this.userRepository.save(user);
    }

    const { password: _password, ...result } = user;
    void _password;
    return result;
  }

  async findOne(uid: string) {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new NotFoundException(`User<${uid}> not found`);
    }
    const { password: _password, ...result } = user;
    void _password;
    return result;
  }

  async findOneRaw(uid: string) {
    return this.userRepository.findOne({ where: { uid } });
  }

  async findByPage(params: FindByPageDto) {
    return findByPage({
      ...params,
      repository: this.userRepository,
      alias: 'user',
      searchFields: ['login_name', 'user_name', 'phone', 'email'],
      select: [
        'uid',
        'login_name',
        'user_name',
        'phone',
        'email',
        'avatar',
        'is_super_admin',
        'create_time',
        'update_time',
      ],
    });
  }

  async update(uid: string, updateUserDto: UpdateUserDto) {
    this.assertUpdateIdentityAllowed(uid, updateUserDto.login_name);

    const dto: UpdateUserDto & { uid: string } = { ...updateUserDto, uid };
    if (dto.password) {
      dto.password = await hashPassword(dto.password);
    }

    return await updateOneIfExists({
      repository: this.userRepository,
      dto,
      uniqueKey: 'uid',
      updateFields: [
        'login_name',
        'password',
        'user_name',
        'phone',
        'email',
        'avatar',
      ],
    });
  }

  async updateAvatar(uid: string, avatar: string) {
    return this.userRepository.update({ uid }, { avatar });
  }

  async remove(uid: string | string[]) {
    const ids = Array.isArray(uid) ? uid : [uid];
    if (ids.some(isSuperAdminIdentity)) {
      throw new ConflictException('The super admin account cannot be removed');
    }

    let deleted = 0;
    for (const id of ids) {
      const result = await this.userRepository.delete({ uid: id });
      if (result.affected && result.affected > 0) {
        deleted += result.affected;
      }
    }

    if (deleted === 0) {
      throw new NotFoundException(`User<${String(uid)}> not found`);
    }

    return { deleted, items: ids };
  }

  private assertPublicIdentityAllowed(dto: CreateUserDto) {
    if (isSuperAdminIdentity(dto.uid) || isSuperAdminIdentity(dto.login_name)) {
      throw new ConflictException('The admin account is reserved');
    }
  }

  private assertUpdateIdentityAllowed(uid: string, loginName?: string) {
    if (!loginName) {
      return;
    }

    if (isSuperAdminIdentity(uid) && !isSuperAdminIdentity(loginName)) {
      throw new ConflictException(
        'The super admin login name cannot be changed',
      );
    }

    if (!isSuperAdminIdentity(uid) && isSuperAdminIdentity(loginName)) {
      throw new ConflictException('The admin account is reserved');
    }
  }
}
