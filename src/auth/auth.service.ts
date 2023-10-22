import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    LoggerService,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import * as https from 'https';
import {
    catchError,
    lastValueFrom,
    Observable,
    throwError,
    timeout,
    TimeoutError,
} from 'rxjs';
import { Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { Niveau } from '../users/niveau.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import {
  TIMEOUT_DURATION,
  TOKEN_EXPIRATION_DURATION,
} from '../utils/constant';
import { UserProfile } from '../users/user-profile.entity';
// import { TicketService } from '../ticket/ticket.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  @InjectRepository(User)
  private readonly repository: Repository<User>;
  @InjectRepository(UserProfile)
  private readonly userProfilerepository: Repository<UserProfile>;
  @InjectRepository(Niveau)
  private readonly niveauRepository: Repository<Niveau>;
  constructor(
    private usersService: UserService,
    // private ticketService: TicketService,
    private jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    this.httpService.axiosRef.defaults.httpsAgent = agent;
  }

  async signInExternal(username, pass, plainPassword) {
    let payload: any;
    let niveau: Niveau;

    const headersRequest = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        `Bearer ${process.env.TOKEN}`,
    };

    const requestData = new URLSearchParams();
    requestData.append('username', username);
    requestData.append('password', pass);

    const userResult = await this.repository.findOne({
      where: { email: username },
    });

    if (!userResult) {
      const responseObservable: Observable<any> = await this.httpService
        .post(
          'https://balipreprod.arescom.fr/bali/api/auth',
          requestData.toString(),
          {
            headers: headersRequest,
          },
        )
        .pipe(
          timeout(TIMEOUT_DURATION),
          catchError(async (error: any) => {
            // Change the parameter type to "any"
            if (error.response?.status === HttpStatus.UNAUTHORIZED) {
              throw new HttpException(
                error.response.data,
                HttpStatus.UNAUTHORIZED,
                {
                  cause: error,
                },
              );
            } else if (error instanceof TimeoutError) {
              throw new UnauthorizedException();
            } else {
              throw new UnauthorizedException();
            }
            // Return an observable
            return throwError(error); // You can use throwError to propagate the error
          }),
        );

      const { data: token } = await lastValueFrom(responseObservable);

      const responseObservableGetConnectedUser = await this.httpService
        .get('https://balipreprod.arescom.fr/bali/api/user/me', {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Bearer ' + token.access_token,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              error.response?.data,
              HttpStatus.UNAUTHORIZED,
              {
                cause: error,
              },
            );
          }),
        );

      const { data: user } = await lastValueFrom(
        responseObservableGetConnectedUser,
      );

      const niveauExist = await this.niveauRepository.findOne({
        where: { name: user.name },
      });

      niveau = niveauExist;

      if (!niveauExist) {
        const comp = await this.niveauRepository.save({
          name: user.name,
        });
        niveau = comp;
      }

      //TODO creation niveau
      //TODO Check if exist niveau
      const externalToken =
        typeof token !== 'undefined' ? token.access_token : null;
      const existingUserProfile = await this.userProfilerepository.findOne({
        where: { id: user.person_id },
      });
      if (!existingUserProfile) {
        const userProfile = await this.userProfilerepository.save({
          id: user.person_id,
          company_person_id: user.niveau_person_id,
          company: niveau,
          firstname: user.first_name,
          lastname: user.last_name,
          filiere: user.filiere,
          mobile: user.mobile,
          phone: user.phone,
        });
        const userFromDatabase = await this.repository.save(
          new User({
            id: user['person.id'],
            email: user.username,
            password: pass,
            externalToken: externalToken,
            timeGeneratedExternalToken: new Date(),
            lastRequestTime: new Date(),
            profile: userProfile,
            groupe: user.group_id,
          }),
        );
        payload = {
          username: userFromDatabase.email,
          sub: userFromDatabase.id,
          group: userFromDatabase.groupe,
        };
      } else {
        const userFromDatabase = await this.repository.save(
          new User({
            id: user['person.id'],
            email: user.username,
            password: pass,
            externalToken: externalToken,
            timeGeneratedExternalToken: new Date(),
            lastRequestTime: new Date(),
            profile: existingUserProfile,
            groupe: user.group_id,
          }),
        );
        payload = {
          username: userFromDatabase.email,
          sub: userFromDatabase.id,
          group: userFromDatabase.groupe,
        };
      }
    } else if (
      userResult &&
      new Date().getTime() - userResult.timeGeneratedExternalToken.getTime() <
        TOKEN_EXPIRATION_DURATION
    ) {
      const passwordValid = await bcrypt.compare(
        plainPassword,
        userResult.password,
      );
      if (passwordValid) {
        payload = {
          username: userResult.email,
          sub: userResult.id,
          group: userResult.groupe,
        };
        this.repository.save({
          id: userResult.id,
          email: userResult.email,
          lastActivityDate: new Date(),
        });
        // this.ticketService.getTickList(payload);
        if (userResult.groupe == 'A') {
          this.usersService.getAllUser(payload);
        }
        return {
          access_token: await this.jwtService.signAsync(payload),
        };
      } else {
        return new UnauthorizedException();
      }
    } else if (
      userResult &&
      new Date().getTime() - userResult.timeGeneratedExternalToken.getTime() >
        TOKEN_EXPIRATION_DURATION
    ) {
      const responseObservable: Observable<any> = await this.httpService
        .post(
          'https://balipreprod.arescom.fr/bali/api/auth',
          requestData.toString(),
          {
            headers: headersRequest,
          },
        )
        .pipe(
          timeout(TIMEOUT_DURATION),
          catchError(async (error: any) => {
            // Change the parameter type to "any"
            if (error.response?.status === HttpStatus.UNAUTHORIZED) {
              throw new HttpException(
                error.response.data,
                HttpStatus.UNAUTHORIZED,
                {
                  cause: error,
                },
              );
            } else if (error instanceof TimeoutError) {
              const passwordValid = bcrypt.compare(
                plainPassword,
                userResult.password,
              );
              if (passwordValid) {
                payload = {
                  username: userResult.email,
                  sub: userResult.id,
                  group: userResult.groupe,
                };
                this.repository.save({
                  id: userResult.id,
                  email: userResult.email,
                  externalToken: null,
                  lastActivityDate: new Date(),
                  updatedAt: new Date(),
                });
              } else {
                return new UnauthorizedException(
                  "Pour des raisons de maintenance, vous ne pouvez pas acceder à l'extranet",
                );
              }
            } else {
              // Your existing logic
            }
            // Return an observable
            return throwError(error); // You can use throwError to propagate the error
          }),
        );
      const { data: token } = await lastValueFrom(responseObservable);
      const externalToken =
        typeof token !== 'undefined' ? token.access_token : null;
      console.log(externalToken);
      if (externalToken) {
        await this.repository.save({
          id: userResult.id,
          email: userResult.email,
          externalToken: externalToken,
          timeGeneratedExternalToken: new Date(),
          updatedAt: new Date(),
        });
        if (payload.groupe == 'AS') {
          this.usersService.getAllUser(payload);
        }
        // this.ticketService.getTickList(payload);
      } else {
        await this.repository.save({
          id: userResult.id,
          email: userResult.email,
          externalToken: externalToken,
          updatedAt: new Date(),
        });
      }
      const passwordValid = await bcrypt.compare(
        plainPassword,
        userResult.password,
      );
      if (passwordValid) {
        payload = {
          username: userResult.email,
          sub: userResult.id,
          group: userResult.groupe,
        };
        this.repository.save({
          id: userResult.id,
          email: userResult.email,
          lastActivityDate: new Date(),
        });
      } else {
        return new UnauthorizedException();
      }
    }
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async verification(username) {
    const headersRequest = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Bearer 1s10iPT1qm9G4anjFe7iADrRxeZirS9Z4qKyaszoQbnOts6BC_UEL0A2MxQ5Xpd_',
    };

    const requestData = new URLSearchParams();
    requestData.append('username', username);

    const responseObservable = await this.httpService
      .post(
        'https://balipreprod.arescom.fr/bali/api/auth/verification',
        requestData.toString(),
        {
          headers: headersRequest,
        },
      )
      .pipe(
        timeout(TIMEOUT_DURATION),
        catchError(() => {
          throw new HttpException(
            'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
            HttpStatus.REQUEST_TIMEOUT,
          );
        }),
      );
    //TODO si bali est off on envoi quelque chose

    const { data } = await lastValueFrom(responseObservable);
    return data;
  }

  extractBearerToken(authorizationHeader: string): string {
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing');
    }

    const [bearerKeyword, token] = authorizationHeader.split(' ');

    if (bearerKeyword.toLowerCase() !== 'bearer' || !token) {
      throw new Error('Invalid authorization header');
    }

    return token;
  }
  async forgotPassword(token: string, password: string) {
    //TODO Erreur si bali est off
    //TODO Forgot n'est pas une activité
    const headersRequest = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Bearer ' + token,
    };

    const requestData = new URLSearchParams();
    requestData.append('password', password);

    const responseObservable = await this.httpService
      .post(
        'https://balipreprod.arescom.fr/bali/api/user/reset-password',
        requestData.toString(),
        {
          headers: headersRequest,
        },
      )
      .pipe(
        timeout(TIMEOUT_DURATION),
        catchError(() => {
          throw new HttpException(
            'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
            HttpStatus.REQUEST_TIMEOUT,
          );
        }),
      );
    const { data } = await lastValueFrom(responseObservable);
    return data;
  }
}
