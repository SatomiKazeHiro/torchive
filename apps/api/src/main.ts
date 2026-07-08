import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.ts';
import { AllExceptionsFilter } from './common/interceptors/all-exceptions.filter';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 解析 JSON body
  app.use(express.json());
  // 解析 application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));
  // 参数校验 & DTO 严格性
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 过滤掉 DTO 中没有的字段
      forbidNonWhitelisted: true, // DTO 里没定义的字段会报错
      transform: true, // 自动类型转换，例如 "1" -> number
    }),
  );
  // 静态资源：从 .env 获取资源目录
  const configService = app.get(ConfigService);
  const workDir = configService.get<string>('WORK_DIR_PATH');
  if (workDir) {
    // 挂载静态资源路由
    app.use('/resources', express.static(path.resolve(workDir)));
  }

  // 上传文件静态服务
  const uploadDir = path.resolve(__dirname, '..', 'upload-files');
  app.use('/uploads', express.static(uploadDir));

  // 全局响应拦截器（统一成功结构）
  app.useGlobalInterceptors(new TransformInterceptor());
  // 全局异常过滤器（统一失败结构）
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
