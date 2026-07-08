import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FindByPageDto } from '@/common/typeorm/find.dto';

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'upload-files');

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto.login_name, dto.password);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':uid')
  findOne(@Param('uid') uid: string) {
    return this.userService.findOne(uid);
  }

  @Patch(':uid')
  update(@Param('uid') uid: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(uid, updateUserDto);
  }

  @Delete(':uid')
  remove(@Param('uid') uid: string) {
    return this.userService.remove(uid);
  }

  @Post('/page')
  findByPage(@Body() body: FindByPageDto) {
    return this.userService.findByPage(body);
  }

  /**
   * 上传头像
   */
  @Post(':uid/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const uid = req.params.uid;
          const ext = path.extname(file.originalname) || '.jpg';
          const filename = `avatar.${String(uid)}${ext}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(new BadRequestException('只允许上传图片文件'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 3 * 1024 * 1024, // 3MB
      },
    }),
  )
  async uploadAvatar(
    @Param('uid') uid: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const relativePath = `uploads/avatar.${uid}${ext}`;
    const fileUrl = `file:${relativePath}`;

    // 获取旧头像，用于后续删除
    const oldUser = await this.userService.findOneRaw(uid);
    const oldAvatar = oldUser?.avatar || '';

    // 更新用户头像
    await this.userService.update(uid, { avatar: fileUrl });

    // 删除旧头像文件
    if (oldAvatar.startsWith('file:')) {
      const oldPath = path.resolve(
        __dirname,
        '..',
        '..',
        oldAvatar.replace('file:', ''),
      );
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch {
        // 忽略删除失败
      }
    }

    return {
      avatar: fileUrl,
      path: relativePath,
    };
  }
}
