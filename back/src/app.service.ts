import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { PrismaService } from "./prisma/prisma.service";
import { UserStatus, challengeStatus } from "@prisma/client";
import { AppGateway } from "./app.gateway";

export const MAX_PROFILE_PICTURE_SIZE_IN_BYTES = 2 * 1024 * 1024;

export const VALID_UPLOADS_MIME_TYPES = [
	'image/jpg',
	'image/jpeg',
	'image/png',
	'image/apng',
	'image/gif',
	'image/webp'
];

// Usernames des comptes de demonstration, partages par les visiteurs
export const DEMO_USERNAMES = (process.env.DEMO_USERNAMES ?? '')
	.split(',')
	.map((username) => username.trim())
	.filter((username) => username.length !== 0)

// Verifie si le username fourni est celui d'un compte de demonstration
export function isDemoUser(username?: string) {
	if (!username)
		return false
	return DEMO_USERNAMES.includes(username)
}


@Injectable()
export class AppService {
	public static connectedUsers: Map<string, Socket> = new Map();
	constructor
	(
		private prisma: PrismaService,
    //private appGateway: AppGateway,
		) {}
	//public static searchingUsers: Map<string, Socket> = new Map();

	public async getAllSocketsChannel(id: number)
  {
    const usersOnChannels = await this.prisma.usersOnChannels.findMany({
      where: {
        channelId: id,
      },
      select: {
        userId: true,

      },
    });

    const sockets = usersOnChannels.map((userOnChannel) => {
      const socket = AppService.connectedUsers.get(userOnChannel.userId?.toString())
      if (socket)
        return socket.id
      else
        return undefined
    })

    return sockets;
  }  

	  public async emitOnChannel(route: string, ...args: any[]) {
		const channelId = args[0]
		const sockets = await this.getAllSocketsChannel(channelId)
		AppService.connectedUsers.forEach((socket) => {
		  const socketToEmit = sockets.includes(socket.id)
  
		  if (socketToEmit)
			socket.emit(route, ...args);
		})
	  }
    async	cancelAllInvitation(userId : number)
	  {
      const messageAuthor = await this.prisma.message.findMany({
        where: {
          authorId: userId,
          isInvit: true,
          NOT: {
            status: challengeStatus.CANCELLED,
          },
        },
      });
   }
  //   async updateStatusUser(idUser : number, newStatus: UserStatus)
  //   {
  //     await this.prisma.user.update({ where: { id: idUser},
  //       data: { status: newStatus }
  //      })
  //      if (newStatus !== UserStatus.ONLINE)
  //        await this.cancelAllInvitation(idUser)
  //       this.appGateway.server.emit("updateUserStatus", idUser, newStatus);
        
    }
