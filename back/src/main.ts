import { HttpAdapterHost, NestFactory, Reflector,  } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';
import session from 'express-session';
import passport from 'passport'
import { json } from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableShutdownHooks();
	
	app.use(json({ limit: '5mb' }))
	
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,}));
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
	
	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
	
	app.use(cookieParser());
	app.use(
		session({
			secret: process.env.JWT_SECRET,
			resave: false,
			saveUninitialized: false,
			cookie: { maxAge: 60000, 
				sameSite: 'none',
				secure: true
			}
		}),
		);
		
	app.enableCors({
		origin: '*',
		credentials: true,
	})
	
	app.use(passport.initialize());
	app.use(passport.session());
		
	await app.listen(process.env.PORT || 3000);
}
bootstrap();
