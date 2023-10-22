import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    Request,
    Query,
    UnauthorizedException,
    ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './users.service';
import { ResetPasswordDto } from './resetPasswordDto';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UserType } from './userType';
import { hashService } from './service/encrypt.utils';
import { UserCountType } from './userCountType';
import { UserResults } from './userGetAllResult';
import { ChangeRoleDto } from './changeRoleDto';
import { User } from './users.entity'


enum OrderByEnum {
    ASC = 'ASC',
    DESC = 'DESC',
}
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private userService: UserService) {}
    @UseGuards(AuthGuard)
    @Post('reset-password')
    @ApiBearerAuth()
    async resetPassword(
      @Body() resetPasswordDto: ResetPasswordDto,
      @Request() request,
    ) {
      const user = request.user;
      const hashPassord = await hashService(resetPasswordDto.password);
      return this.userService.resetPassword(hashPassord, user);
    }
    @UseGuards(AuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({
      summary: "Récupérer l'information de l'utilisateur connecté",
    })
    @ApiResponse({
      status: 200,
      description: "Liste des informations d'un utilisateur connecté",
      type: UserType,
    })
    async getUserConnected(@Request() request): Promise<User> {
      const user = request.user;
      return this.userService.getUserConnected(user);
    }
    
    @UseGuards(AuthGuard)
    @Get('count')
    @ApiBearerAuth()
    @ApiOperation({ summary: "Récupérer le nombre d'utilisateur" })
    @ApiResponse({
      status: 200,
      description: "Avoir le nombre d'utilisateur d'un entreprise",
      type: UserCountType,
    })
    async getUserCount(@Request() request): Promise<UserCountType> {
      const user = request.user;
      if (user.group !== 'AD') {
        throw new UnauthorizedException('Accès refusé');
      }
      return this.userService.getUserCount(user);
    }

    @UseGuards(AuthGuard)
    @Post('update')
    @ApiBearerAuth()
    @ApiOperation({ summary: "Mis à jour de l'information d'un utilisateur" })
    async updateUser(@Body() userDto: UserType, @Request() request) {
      const user = request.user;
      return this.userService.updateUser(user, userDto);
    }

    @UseGuards(AuthGuard)
    @Post('update-role')
    @ApiBearerAuth()
    @ApiQuery({
      name: 'id',
      type: Number,
      description: "id de l'utilisateur",
      required: false,
    })
    @ApiOperation({
      summary: 'Mettre à jour le rôle',
    })
    async updateRole(
      @Request() request,
      @Query('id', ParseIntPipe) id: number,
      @Body() role: ChangeRoleDto,
    ): Promise<any> {
      const user = request.user;
      return this.userService.updateRole(user, role, id);
    }

    @UseGuards(AuthGuard)
    @Get()
    @ApiBearerAuth()
    @ApiQuery({
      name: 'group_id',
      type: String,
      description: "le role de l'utilisateur à chercher",
      required: false,
    })
    @ApiQuery({
      name: 'search',
      type: String,
      description: 'Le mot clé à chercher',
      required: false,
    })
    @ApiQuery({
      name: 'orderBy',
      type: String,
      description: 'Le champs à ordoner',
      required: false,
    })
    @ApiQuery({
      name: 'order',
      enum: ['ASC', 'DESC'],
      type: 'string',
      description: 'Ordre (ASC ou DESC)',
      required: false,
    })
    @ApiOperation({
      summary: "Récupérer la liste des utilisateurs d'uns entreprise",
    })
    @ApiResponse({
      status: 200,
      description: 'Liste des des utilisateur',
      type: UserResults,
    })
    async getAllUser(
      @Request() request,
      @Query('group_id') group_id: string,
      @Query('search') search: string,
      @Query('order') order: OrderByEnum,
      @Query('orderBy') orderBy: string,
    ): Promise<UserResults> {
      const user = request.user;
      return this.userService.getAllUser(user, group_id, search, orderBy, order);
    }
}