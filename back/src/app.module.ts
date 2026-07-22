import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { ChatsModule } from './channels/channels.module';
import { FriendsModule } from './friends/friends.module';
import { BlockedsModule } from './blockeds/blockeds.module';
import { PongModule } from './pong/pong.module';
import { AppGateway } from './app.gateway';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UsersService } from './auth/services/users.service';

@Module({
  imports: [
    AuthModule,
    PrismaModule, 
    ConfigModule.forRoot({ isGlobal: true}),
    PassportModule.register({ session: true }),
    ChatsModule,
    FriendsModule,
    BlockedsModule,
	  PongModule,
	  ServeStaticModule.forRoot({
		rootPath: join(process.cwd(), "/"),
		serveRoot: '/',
	}),
  ],
  providers: [
    AppGateway,
    AppService,
    PrismaService,
    UsersService
  ]
})
export class AppModule {}
